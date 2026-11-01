"""Small, explicit adapter for this application's existing SQLite SQL surface.

Writes are buffered and committed as ONE Raft-replicated SQL transaction.
Reads with pending writes are rejected; callers must commit or use atomic().
Only reads are retried: an uncertain write response must never be replayed.
"""
import json
import os
import re
import sqlite3
import ssl
import urllib.error
import urllib.request
from datetime import datetime
from functools import lru_cache
import atexit
import httpx

REGIONAL_TABLES = frozenset({
    'societies', 'properties', 'government_records', 'price_history',
    'facilities', 'property_facility_proximity', 'progress_reports', 'shard_replication_log',
})
CITIES = ('karachi', 'lahore', 'islamabad')
TOKEN = re.compile(r"--[^\n]*|/\*[\s\S]*?\*/|'(?:''|[^'])*'|\"(?:\"\"|[^\"])*\"|`[^`]*`|\[[^\]]*\]|[A-Za-z_][A-Za-z_0-9]*")


def namespace_sql(sql, city=None):
    if city is None:
        return sql
    if city not in CITIES:
        raise ValueError('Invalid city namespace')

    def replace(match):
        token = match.group()
        if token.startswith(("'", '--', '/*')):
            return token
        name = token.strip('"`[]')
        if name.lower() in REGIONAL_TABLES:
            return '"' + city + '_' + name.lower() + '"'
        return token
    return TOKEN.sub(replace, sql)


class ClusterUnavailable(sqlite3.OperationalError):
    pass


class AmbiguousCommit(ClusterUnavailable):
    pass


@lru_cache(maxsize=1)
def tls_context():
    # Windows certificate-store loading is expensive and can serialize threads.
    # Reuse verified TLS configuration instead of loading it per SQL connection.
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    context.load_default_certs()
    return context


@lru_cache(maxsize=1)
def http_transport():
    """Thread-safe per-process pool; SQL connections do not own TCP sockets."""
    transport = httpx.Client(
        verify=tls_context(), trust_env=False, timeout=5,
        limits=httpx.Limits(max_connections=32, max_keepalive_connections=16, keepalive_expiry=30),
    )
    atexit.register(transport.close)
    return transport


class ClusterClient:
    _preferred = None

    def __init__(self, urls=None, timeout=5):
        self.urls = urls or os.getenv('RQLITE_URLS', 'http://127.0.0.1:4001,http://127.0.0.1:4003,http://127.0.0.1:4005').split(',')
        self.urls = [u.strip().rstrip('/') for u in self.urls]
        if self._preferred in self.urls:
            self.urls = [self._preferred] + [u for u in self.urls if u != self._preferred]
        self.timeout = timeout
        self.transport = http_transport()
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), urllib.request.HTTPSHandler(context=tls_context()))

    def request(self, path, statements=None, write=False):
        data = json.dumps(statements).encode() if statements is not None else None
        # Select a live ingress before sending a write. Never replay a sent write.
        candidates = self.urls
        if write:
            candidates = []
            for url in self.urls:
                try:
                    response = self.transport.get(url + '/readyz', timeout=1)
                    if response.status_code == 200:
                        candidates = [url]
                        break
                except httpx.HTTPError:
                    continue
        for url in candidates:
            try:
                response = self.transport.request('POST' if data is not None else 'GET', url + path,
                                                  content=data, headers={'Content-Type': 'application/json'}, timeout=self.timeout)
                response.raise_for_status()
                payload = response.json()
            except (httpx.HTTPError, ValueError) as exc:
                if write:
                    raise AmbiguousCommit('Write outcome unknown; verify state before retrying') from exc
                continue
            errors = [r['error'] for r in payload.get('results', []) if r.get('error')]
            if payload.get('error'):
                errors.append(payload['error'])
            if errors:
                message = '; '.join(errors)
                if 'constraint' in message.lower():
                    raise sqlite3.IntegrityError(message)
                if any(word in message.lower() for word in ('leader', 'timeout', 'quorum', 'dial tcp', 'connection', 'unavailable')):
                    if write:
                        raise AmbiguousCommit(message)
                    continue
                raise sqlite3.OperationalError(message)
            # Keep a working ingress first; otherwise every nested property
            # query pays the dead node's connection timeout during an outage.
            self.urls = [url] + [u for u in self.urls if u != url]
            if len(self.urls) > 1:
                type(self)._preferred = url
            return payload
        raise ClusterUnavailable('No available database quorum; no SQLite fallback was attempted')

    def query(self, statements):
        return self.request('/db/query?level=linearizable&linearizable_timeout=2s', statements)['results']

    def atomic(self, statements):
        return self.request('/db/request?transaction', statements, write=True)['results']


class Cursor:
    def __init__(self, connection):
        self.connection = connection
        self.rows = []
        self.rowcount = -1
        self.lastrowid = None

    def set_result(self, result):
        types = result.get('types', [])
        def normalize(value, kind):
            if value is not None and kind.lower() in ('timestamp', 'datetime'):
                return datetime.fromisoformat(value.replace('Z', '+00:00')).replace(tzinfo=None).isoformat(sep=' ')
            return value
        self.rows = [dict(zip(result.get('columns', []), [normalize(v, t) for v, t in zip(row, types)])) for row in result.get('values', [])]
        self.rowcount = result.get('rows_affected', -1)
        self.lastrowid = result.get('last_insert_id')

    def execute(self, sql, parameters=()):
        self.connection.ensure_open()
        statement = [namespace_sql(sql, self.connection.city), *parameters]
        self.rows, self.rowcount, self.lastrowid = [], -1, None
        if sql.lstrip().upper().startswith(('SELECT', 'WITH', 'PRAGMA')):
            if self.connection.pending:
                raise sqlite3.ProgrammingError('Commit pending writes before reading, or use atomic()')
            self.set_result(self.connection.client.query([statement])[0])
        else:
            self.connection.pending.append((statement, self))
        return self

    def executemany(self, sql, rows):
        for row in rows:
            self.execute(sql, row)
        return self

    def fetchone(self):
        return self.rows.pop(0) if self.rows else None

    def fetchall(self):
        rows, self.rows = self.rows, []
        return rows


class Connection:
    def __init__(self, city=None, client=None):
        self.city, self.client = city, client or ClusterClient()
        self.pending = []
        self.closed = False

    def ensure_open(self):
        if self.closed:
            raise sqlite3.ProgrammingError('Connection is closed')

    def cursor(self):
        self.ensure_open()
        return Cursor(self)

    def execute(self, sql, parameters=()):
        return self.cursor().execute(sql, parameters)

    def commit(self):
        self.ensure_open()
        pending, self.pending = self.pending, []
        if pending:
            results = self.client.atomic([statement for statement, _ in pending])
            for (_, cursor), result in zip(pending, results):
                cursor.set_result(result)

    def atomic(self, statements):
        self.ensure_open()
        if self.pending:
            raise sqlite3.ProgrammingError('Cannot mix atomic() and buffered writes')
        return self.client.atomic([[namespace_sql(s[0], self.city), *s[1:]] for s in statements])

    def query_many(self, statements):
        self.ensure_open()
        if self.pending:
            raise sqlite3.ProgrammingError('Commit pending writes before reading')
        results = self.client.query([[namespace_sql(s[0], self.city), *s[1:]] for s in statements])
        rows = []
        for result in results:
            cursor = Cursor(self)
            cursor.set_result(result)
            rows.append(cursor.fetchall())
        return rows

    def rollback(self):
        self.pending.clear()

    def close(self):
        self.rollback()
        self.closed = True

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        try:
            self.rollback() if exc_type else self.commit()
        finally:
            self.close()


def cluster_status():
    client = ClusterClient(timeout=2)
    nodes = []
    for url in client.urls:
        try:
            status = ClusterClient([url], timeout=1).request('/status')
            store = status['store']
            nodes.append({'url': url, 'reachable': True, 'node_id': store['node_id'],
                          'role': store['raft']['state'], 'leader': store['leader']['node_id'],
                          'voter': store['raft']['voter'],
                          'applied_index': store['raft']['applied_index'],
                          'database_size_bytes': store['sqlite3']['db_size']})
        except (ClusterUnavailable, KeyError):
            nodes.append({'url': url, 'reachable': False})
    try:
        client.query([['SELECT 1']])
        quorum = True
    except sqlite3.Error:
        quorum = False
    live = sum(n['reachable'] for n in nodes)
    return {'status': ('HEALTHY' if live == len(nodes) else 'DEGRADED') if quorum else 'UNAVAILABLE',
            'quorum_read_verified': quorum, 'reachable_nodes': live, 'nodes': nodes,
            'partitioning': 'logical city tables; each voting node replicates all data'}
