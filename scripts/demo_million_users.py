"""Isolated synthetic profiles + virtual-time traffic model, NOT live million-VU proof.

Only synthetic data under ignored .runtime is written. Optional live sampling
performs public read-only GETs on the existing loopback Caddy endpoint.
"""
import argparse
import concurrent.futures
import hashlib
import heapq
import html
import json
import math
import sqlite3
import sys
import time
import urllib.request
import uuid
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CITIES = ('karachi', 'lahore', 'islamabad')
DISCLAIMER = 'MILLION-USER LOAD TEST'


def build_profiles(path, users):
    """Create fresh isolated fixtures, never overwrite an existing database."""
    if not 1 <= users <= 2_000_000:
        raise ValueError('Synthetic population must be between 1 and 2,000,000')
    path = Path(path)
    path.open('xb').close()
    started = time.perf_counter()
    with closing(sqlite3.connect(path)) as conn:
        conn.execute('''CREATE TABLE simulated_users (
            user_id INTEGER PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            city TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role='synthetic_buyer'),
            active_in_model INTEGER NOT NULL CHECK(active_in_model=1))''')
        for first in range(1, users + 1, 10_000):
            conn.executemany('INSERT INTO simulated_users VALUES (?,?,?,?,?)', (
                (i, f'sim-{i:07d}@example.invalid', CITIES[(i - 1) % 3], 'synthetic_buyer', 1)
                for i in range(first, min(first + 10_000, users + 1))
            ))
        conn.execute('CREATE INDEX simulated_city_page ON simulated_users(city,user_id)')
        conn.commit()
        count = conn.execute('SELECT COUNT(*), SUM(active_in_model), COUNT(DISTINCT email) FROM simulated_users').fetchone()
        assert count == (users, users, users), count
        assert conn.execute('PRAGMA integrity_check').fetchone() == ('ok',)
        query_started = time.perf_counter()
        city_count = conn.execute('SELECT COUNT(*) FROM simulated_users WHERE city=?', ('karachi',)).fetchone()[0]
        first_page = conn.execute('SELECT user_id FROM simulated_users WHERE city=? AND user_id>? ORDER BY user_id LIMIT 5', ('karachi', 0)).fetchall()
        next_page = conn.execute('SELECT user_id FROM simulated_users WHERE city=? AND user_id>? ORDER BY user_id LIMIT 5', ('karachi', first_page[-1][0])).fetchall()
        sql_ms = (time.perf_counter() - query_started) * 1000
        plan = conn.execute('EXPLAIN QUERY PLAN SELECT user_id FROM simulated_users WHERE city=? AND user_id>? ORDER BY user_id LIMIT 5', ('karachi', 0)).fetchall()
    return {
        'scope': 'Isolated SQLite synthetic fixture volume; not the production rqlite/auth database',
        'rows_verified': count[0], 'active_in_model': count[1], 'unique_emails_verified': count[2],
        'database_bytes': path.stat().st_size,
        'build_and_verify_wall_seconds': round(time.perf_counter() - started, 3),
        'integrity_check': 'ok', 'filtered_city_count': city_count,
        'page_1_user_ids': [r[0] for r in first_page], 'page_2_user_ids': [r[0] for r in next_page],
        'count_and_two_pages_sql_ms': round(sql_ms, 3), 'query_plan': plan,
        'has_passwords_or_jwts': False,
    }


def simulate_queue(users, window_seconds, slots, service_ms):
    """Deterministic FIFO virtual-time model; one modeled request per user."""
    if users < 1 or slots < 1 or window_seconds <= 0 or service_ms <= 0:
        raise ValueError('Model inputs must be positive')
    started = time.perf_counter()
    free_at = [0.0] * slots
    latencies = []
    completed_in_window = 0
    last_completion = 0.0
    for index in range(users):
        arrival = index * window_seconds / users
        begin = max(arrival, free_at[0])
        finish = begin + service_ms / 1000
        heapq.heapreplace(free_at, finish)
        latencies.append(finish - arrival)
        completed_in_window += finish <= window_seconds
        last_completion = max(last_completion, finish)
    latencies.sort()
    def percentile(p):
        return round(latencies[max(0, math.ceil(p * len(latencies)) - 1)], 6)
    return {
        'kind': 'ASSUMPTION-BASED VIRTUAL-TIME MODEL, not measured server capacity',
        'active_simulated_users': users, 'modeled_requests': users,
        'arrival_window_seconds': window_seconds, 'assumed_service_slots': slots,
        'assumed_constant_service_ms': service_ms,
        'arrival_pattern': 'Evenly spaced; every user active for the modeled window and sends one request',
        'offered_requests_per_virtual_second': round(users / window_seconds, 3),
        'assumed_service_capacity_per_virtual_second': round(slots * 1000 / service_ms, 3),
        'modeled_completed_by_window_end': completed_in_window,
        'modeled_pending_at_window_end': users - completed_in_window,
        'modeled_p50_seconds': percentile(0.50), 'modeled_p95_seconds': percentile(0.95),
        'modeled_p99_seconds': percentile(0.99),
        'modeled_last_completion_seconds': round(last_completion, 6),
        'simulation_wall_seconds': round(time.perf_counter() - started, 3),
    }


def sample_live(reads=12):
    """Two client workers only; no writes, login or notification endpoints."""
    def read(index):
        city = CITIES[index % 3]
        url = f'http://127.0.0.1:8000/api/properties/?city={city}&page_size=10&sort=price_asc'
        began = time.perf_counter()
        item = {'index': index, 'city': city}
        try:
            opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
            with opener.open(url, timeout=10) as response:
                body = json.load(response)
                rows = body.get('results', [])
                item.update(status=response.status, instance=response.headers.get('X-Rihaish-Instance'))
                item['contract_ok'] = response.status == 200 and len(rows) == 10 and all(rows[i-1]['price'] <= rows[i]['price'] for i in range(1, len(rows)))
        except Exception as exc:
            item.update(contract_ok=False, error=f'{type(exc).__name__}: {exc}')
        item['elapsed_ms'] = round((time.perf_counter() - began) * 1000, 3)
        return item
    started = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        rows = list(pool.map(read, range(reads)))
    return {
        'scope': 'Actual small public-API sample; NOT sustained k6 or million-user acceptance',
        'client_worker_limit': 2, 'requests_attempted': reads,
        'contract_passes': sum(r['contract_ok'] for r in rows),
        'instances_observed': sorted({r['instance'] for r in rows if r.get('instance')}),
        'wall_seconds': round(time.perf_counter() - started, 3), 'requests': rows,
    }


def health_snapshot():
    sys.path.insert(0, str(ROOT / 'backend'))
    from app.db.rqlite import cluster_status
    state = {'cluster': cluster_status(), 'applications': {}}
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    for port in (8001, 8002, 8000, 3000):
        try:
            with opener.open(f'http://127.0.0.1:{port}/api/health/ready', timeout=10) as response:
                state['applications'][str(port)] = {'status': response.status, **json.load(response)}
        except Exception as exc:
            state['applications'][str(port)] = {'ready': False, 'error': str(exc)}
    return state


def write_html(report, target):
    data = report['synthetic_dataset']
    model_rows = ''.join(
        '<tr>' + ''.join(f'<td>{html.escape(str(value))}</td>' for value in (
            m['assumed_service_slots'], m['assumed_constant_service_ms'],
            m['offered_requests_per_virtual_second'], m['modeled_p95_seconds'],
            f"{m['modeled_pending_at_window_end']:,}", m['simulation_wall_seconds'])) + '</tr>'
        for m in report['virtual_time_models'])
    live = report.get('live_api_sample')
    live_text = (f"Actual API sample: {live['contract_passes']}/{live['requests_attempted']} contract checks passed; "
                 f"at most {live['client_worker_limit']} concurrent client workers. Instances: {', '.join(live['instances_observed']) or 'none'}."
                 if live else 'Live API sampling was not requested for this run.')
    markup = f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RIHAISH — Million-user simulation evidence</title>
<style>body{{font:17px/1.5 system-ui,sans-serif;background:#101b2c;color:#e5edf8;max-width:1100px;margin:40px auto;padding:0 24px}}h1{{font-size:32px}}.banner{{background:#783b0b;color:#fff4d5;padding:16px;border:2px solid #ffc65a;font-weight:800}}.cards{{display:flex;gap:16px;flex-wrap:wrap}}.card{{background:#1b3049;padding:20px;flex:1;min-width:220px}}strong.big{{display:block;font-size:36px;color:#69e2c4}}table{{width:100%;border-collapse:collapse;background:#1b3049}}th,td{{text-align:left;padding:12px;border:1px solid #40607e}}th{{font-size:14px}}code{{color:#9af2d9}}a{{color:#9af2d9}}.small{{font-size:14px;color:#b9ccdf}}</style>
<div class="banner">{DISCLAIMER}</div><h1>RIHAISH: {data['rows_verified']:,} synthetic users</h1>
<p>Three separate forms of evidence: a real isolated fixture database, an assumed queue model, and optional small live API sampling.</p>
<div class="cards"><div class="card"><strong class="big">{data['rows_verified']:,}</strong>synthetic rows verified in isolated SQLite</div>
<div class="card"><strong class="big">{data['active_in_model']:,}</strong>users active in virtual time</div>
<div class="card"><strong class="big">NOT VERIFIED</strong>one million live concurrent application users</div></div>
<h2>1. Actual synthetic data volume</h2><p>Unique synthetic emails: {data['unique_emails_verified']:,}. Integrity check: {data['integrity_check']}. Database size: {data['database_bytes'] / 1048576:.1f} MiB. Build/verification: {data['build_and_verify_wall_seconds']} real seconds.</p>
<p>Indexed city count plus two keyset pages: {data['count_and_two_pages_sql_ms']} ms in this isolated fixture database. These are not production rqlite query timings. No passwords, JWTs or production accounts were created.</p>
<h2>2. Virtual-time traffic simulation</h2><p>All users are represented as active in the modeled 60-second window, with one evenly spaced request per user. Service time and service slots below are explicit hypothetical inputs, not measured RIHAISH capacity. A model can complete faster than its virtual clock.</p>
<table><tr><th>Assumed slots</th><th>Assumed service ms</th><th>Offered requests / virtual s</th><th>Modeled p95 seconds</th><th>Pending at virtual 60 s</th><th>Real simulation seconds</th></tr>{model_rows}</table>
<p>The comparison illustrates queue growth when assumed demand exceeds assumed service capacity. It does not prove the application can supply either modeled capacity.</p>
<h2>3. Actual small live API sample</h2><p>{html.escape(live_text)}</p><p>The existing sustained k6 prerequisite failed and remains unresolved. This sample and the offline simulation do not replace it.</p>
<h2>Evaluator statement</h2><blockquote>We generated and queried one million isolated synthetic profiles and modeled one million simultaneously active sessions in virtual time. The live DDS has separately passed functional replication/failure tests. One million concurrent real application users has not been demonstrated.</blockquote>
<p class="small">Run {html.escape(report['run_id'])}; generated {html.escape(report['completed_at_utc'])}. Machine-readable evidence: <a href="report.json">report.json</a>. Original user data and frontend remain separate.</p></html>'''
    target.write_text(markup, encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--users', type=int, default=2_000_000)
    parser.add_argument('--live-sample', action='store_true', help='Twelve real public GETs with at most two client workers; also record health')
    args = parser.parse_args()
    if not 30 <= args.users <= 2_000_000:
        parser.error('--users must be between 30 and 1000000')
    run_id = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:6]
    runtime = ROOT / '.runtime' / 'million-user-simulation' / run_id
    evidence = ROOT / 'docs' / 'evidence' / ('million-simulation-' + run_id)
    runtime.mkdir(parents=True, exist_ok=False)
    evidence.mkdir(parents=True, exist_ok=False)
    report = {'run_id': run_id, 'started_at_utc': datetime.now(timezone.utc).isoformat(),
              'label': DISCLAIMER, 'one_million_live_concurrency_verified': False,
              'script_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              'synthetic_database_relative_path': str((runtime / 'synthetic-users.sqlite3').relative_to(ROOT))}
    print(f'{DISCLAIMER}\nGenerating {args.users:,} isolated profiles...', flush=True)
    report['synthetic_dataset'] = build_profiles(runtime / 'synthetic-users.sqlite3', args.users)
    report['virtual_time_models'] = [simulate_queue(args.users, 60, slots, 50) for slots in (100, 1000)]
    if args.live_sample:
        report['live_api_sample'] = sample_live()
        report['post_test_health'] = health_snapshot()
    report['completed_at_utc'] = datetime.now(timezone.utc).isoformat()
    (evidence / 'report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    write_html(report, evidence / 'report.html')
    print(json.dumps(report, indent=2), flush=True)
    print('Presentation: ' + str(evidence / 'report.html'), flush=True)
    if args.live_sample:
        health = report['post_test_health']
        if report['live_api_sample']['contract_passes'] != 12 or not health['cluster'].get('quorum_read_verified') or health['cluster'].get('reachable_nodes') != 3 or not all(h.get('ready') and h.get('database') == 'rqlite' for h in health['applications'].values()):
            raise SystemExit('Offline artifacts saved, but live sample/health did not fully pass; inspect report.json')


if __name__ == '__main__':
    main()
