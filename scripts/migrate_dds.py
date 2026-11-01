"""Copy snapshots into a NEW empty rqlite cluster; never modify source records."""
import argparse
import hashlib
import json
import sqlite3
import sys
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from app.db.rqlite import CITIES, ClusterClient, namespace_sql


def table_digest(connection, table):
    columns = [r[1] for r in connection.execute(f'PRAGMA table_info("{table}")')]
    projection = ','.join(f'quote("{c}")' for c in columns)
    rows = connection.execute(f'SELECT {projection} FROM "{table}"').fetchall()
    serialized = sorted(json.dumps(list(r), ensure_ascii=False, separators=(',', ':')) for r in rows)
    return hashlib.sha256('\n'.join(serialized).encode()).hexdigest()


def prepare(source_dir, output):
    if output.exists():
        raise RuntimeError('Candidate file already exists; choose a new output path')
    source_dir = source_dir.resolve()
    sources = {'auth': source_dir / 'auth_core.db', **{c: source_dir / f'shard_{c}_primary.db' for c in CITIES}}
    if not all(p.is_file() for p in sources.values()):
        raise RuntimeError('All four source snapshots are required')
    output.parent.mkdir(parents=True, exist_ok=True)
    target = sqlite3.connect(output)
    manifest = {'tables': {}, 'source_directory': str(source_dir), 'existing_foreign_key_violations': {}}
    try:
        for city, path in sources.items():
            source = sqlite3.connect(path.as_uri() + '?mode=ro', uri=True)
            try:
                manifest['existing_foreign_key_violations'][city] = len(source.execute('PRAGMA foreign_key_check').fetchall())
                tables = source.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").fetchall()
                for name, ddl in tables:
                    target_name = name if city == 'auth' else f'{city}_{name}'
                    target.execute(namespace_sql(ddl, None if city == 'auth' else city))
                    rows = source.execute(f'SELECT * FROM "{name}"').fetchall()
                    if rows:
                        placeholders = ','.join('?' for _ in rows[0])
                        target.executemany(f'INSERT INTO "{target_name}" VALUES ({placeholders})', rows)
                    digest = table_digest(source, name)
                    if table_digest(target, target_name) != digest:
                        raise RuntimeError('Copy digest mismatch: ' + target_name)
                    manifest['tables'][target_name] = {'count': len(rows), 'sha256': digest, 'columns': [r[1] for r in source.execute(f'PRAGMA table_info("{name}")')]}
                for name, ddl in source.execute("SELECT name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL"):
                    if city != 'auth':
                        raise RuntimeError('Regional custom index needs explicit mapping: ' + name)
                    target.execute(ddl)
            finally:
                source.close()
        # Fail on conflicts; never deduplicate or discard retained records.
        target.execute('CREATE UNIQUE INDEX saved_property_unique ON saved_properties(user_id, property_id)')
        target.execute("CREATE UNIQUE INDEX one_platform_admin ON users(role) WHERE role = 'admin'")
        for city in CITIES:
            target.execute(f'CREATE INDEX {city}_property_price ON {city}_properties(price, id)')
            target.execute(f'CREATE INDEX {city}_property_score ON {city}_properties(ai_investment_score, id)')
            for table in ('government_records', 'price_history', 'property_facility_proximity', 'progress_reports'):
                target.execute(f'CREATE INDEX {city}_{table}_property ON {city}_{table}(property_id)')
        target.execute('CREATE TABLE dds_migration (version INTEGER PRIMARY KEY, manifest_sha256 TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)')
        manifest_hash = hashlib.sha256(json.dumps(manifest, sort_keys=True).encode()).hexdigest()
        target.execute('INSERT INTO dds_migration(version, manifest_sha256) VALUES (1, ?)', (manifest_hash,))
        target.commit()
        if target.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise RuntimeError('Candidate integrity check failed')
    finally:
        target.close()
    output.with_suffix('.manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    return manifest


def verify(client, manifest):
    # Use a database backup so Go timestamp encoding and SQLite-version float
    # rendering do not change values solely at the JSON transport boundary.
    client.query([['SELECT version FROM dds_migration']])
    path = ROOT / '.runtime' / 'verification' / (uuid.uuid4().hex + '.db')
    path.parent.mkdir(parents=True, exist_ok=True)
    with client.opener.open(client.urls[0] + '/db/backup', timeout=30) as response:
        path.write_bytes(response.read())
    connection = sqlite3.connect(path)
    try:
        if connection.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise RuntimeError('Cluster backup integrity check failed')
        for table, expected in manifest['tables'].items():
            count = connection.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
            if count != expected['count'] or table_digest(connection, table) != expected['sha256']:
                raise RuntimeError('Cluster content mismatch: ' + table)
    finally:
        connection.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, required=True, help='Quiesced SQLite backup directory')
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--import-empty-cluster', action='store_true')
    parser.add_argument('--verify-only', action='store_true')
    args = parser.parse_args()
    manifest = prepare(args.source_dir, args.output)
    if args.import_empty_cluster and args.verify_only:
        raise RuntimeError('Choose import OR verification')
    if args.import_empty_cluster or args.verify_only:
        client = ClusterClient()
    if args.import_empty_cluster:
        occupied = client.query([["SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"]])[0]
        if occupied.get('values'):
            raise RuntimeError('Target is not empty. Restore refused; existing data retained.')
        request = urllib.request.Request(client.urls[0] + '/db/load', data=args.output.read_bytes(), headers={'Content-Type': 'application/octet-stream'})
        # No retries: the restore may have succeeded if the response was lost.
        with client.opener.open(request, timeout=60) as response:
            result = json.load(response)
        if result.get('error') or any(r.get('error') for r in result.get('results', [])):
            raise RuntimeError(result)
    if args.import_empty_cluster or args.verify_only:
        verify(client, manifest)
        evidence = {'verified_table_count': len(manifest['tables']), 'all_row_hashes_match': True, 'tables': manifest['tables'], 'existing_foreign_key_violations': manifest['existing_foreign_key_violations']}
        (ROOT / 'docs/evidence/migration-verification.json').write_text(json.dumps(evidence, indent=2), encoding='utf-8')
        print(json.dumps({'verified_table_count': len(manifest['tables']), 'all_row_hashes_match': True}))
    else:
        print('Candidate prepared and verified; cluster was not changed.')


if __name__ == '__main__':
    main()
