"""Read-only FYP smoke test of the real cluster/API; no user generation or failures.

Preserves the bounded HTTP sampling/health checks from the retired DDS population
demo. Requires the existing authorized property data; never seeds or resets it.
"""
import argparse
import concurrent.futures
import json
import sys
import threading
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from app.db.rqlite import cluster_status
CLIENT = threading.local()


def get(path, port=8000):
    if not hasattr(CLIENT, 'opener'):
        CLIENT.opener = urllib.request.OpenerDirector()
        for handler in (urllib.request.HTTPHandler(), urllib.request.HTTPDefaultErrorHandler(), urllib.request.HTTPErrorProcessor()):
            CLIENT.opener.add_handler(handler)
    started = time.perf_counter()
    try:
        response = CLIENT.opener.open(f'http://127.0.0.1:{port}{path}', timeout=15)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.code, json.load(response), response.headers.get('X-Rihaish-Instance'), round((time.perf_counter()-started)*1000, 3)


def health(frontend=False):
    state = {'cluster': cluster_status(), 'applications': {}}
    for port in (8001, 8002, 8000) + ((3000,) if frontend else ()):
        code, body, _, _ = get('/api/health/ready', port)
        state['applications'][str(port)] = {'status': code, **body}
        assert code == 200 and body.get('ready') and body.get('database') == 'rqlite', f'Not ready: {port}'
    assert state['cluster']['quorum_read_verified'] and state['cluster']['reachable_nodes'] == 3
    assert all(node.get('voter') for node in state['cluster']['nodes'])
    assert sum(node.get('role') == 'Leader' for node in state['cluster']['nodes']) == 1
    return state


def verify(frontend=False):
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:6]
    directory = ROOT / 'docs/evidence' / ('fyp-smoke-' + stamp)
    directory.mkdir(parents=True, exist_ok=False)
    report = {'started_at_utc': datetime.now(timezone.utc).isoformat(), 'result': 'FAIL',
              'scope': 'Actual bounded read-only HTTP/SQL/health checks; not a load-capacity benchmark',
              'client_worker_limit': 2}
    try:
        report['before'] = health(frontend)
        def read(index):
            city = ('karachi', 'lahore', 'islamabad')[index % 3]
            code, body, instance, elapsed = get(f'/api/properties/?city={city}&page_size=10&sort=price_asc')
            rows = body.get('results', [])
            ok = code == 200 and len(rows) == 10 and all(rows[i-1]['price'] <= rows[i]['price'] for i in range(1, len(rows)))
            return {'city': city, 'status': code, 'instance': instance, 'elapsed_ms': elapsed, 'contract_ok': ok}
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            report['requests'] = list(pool.map(read, range(12)))
        assert all(item['contract_ok'] for item in report['requests'])
        assert {item['instance'] for item in report['requests']} == {'api1', 'api2'}
        pages = []
        for page in (1, 2):
            code, body, _, _ = get(f'/api/properties/?q=plot&min_price=1000000&max_price=10000000&sort=price_asc&page_size=5&page={page}')
            assert code == 200 and len(body.get('results', [])) == 5
            pages.extend(body['results'])
        assert len({item['id'] for item in pages}) == 10
        assert all(1000000 <= item['price'] <= 10000000 for item in pages)
        assert all(pages[i-1]['price'] <= pages[i]['price'] for i in range(1, len(pages)))
        assert get('/api/auth/me')[0] == 401
        report['checks'] = {'twelve_sorted_city_reads': True, 'both_api_instances': True,
                            'real_search_numeric_range_and_cross_page_sort': True,
                            'ten_distinct_paginated_ids': True, 'unauthenticated_profile_denied': True}
        report['after'] = health(frontend)
        report['result'] = 'PASS'
    except Exception as error:
        report['error'] = f'{type(error).__name__}: {error}'
    report['completed_at_utc'] = datetime.now(timezone.utc).isoformat()
    (directory / 'report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))
    print('Evidence: ' + str(directory))
    return report['result'] == 'PASS'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--frontend', action='store_true', help='Also require Vite proxy readiness on port 3000')
    args = parser.parse_args()
    sys.exit(0 if verify(args.frontend) else 1)
