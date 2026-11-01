"""Real bounded overload/recovery rehearsal, not a million-client stress test.

Uses existing owned-service scripts to set a low demonstration admission limit,
sends only public property reads, and restores the prior limit in finally.
Never stops a database node or writes application records.
"""
import argparse
import concurrent.futures
import html
import hashlib
import json
import math
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import uuid
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from app.db.rqlite import ClusterClient, cluster_status

CLIENT = threading.local()


def http_opener():
    # All targets are fixed HTTP loopback URLs. Avoid constructing unused TLS
    # contexts/certificate stores (and inherited SSLKEYLOGFILE hooks) per GET.
    if not hasattr(CLIENT, 'opener'):
        CLIENT.opener = urllib.request.OpenerDirector()
        for handler in (urllib.request.HTTPHandler(), urllib.request.HTTPDefaultErrorHandler(), urllib.request.HTTPErrorProcessor()):
            CLIENT.opener.add_handler(handler)
    return CLIENT.opener


def call(path, port=8000):
    started = time.perf_counter()
    request = urllib.request.Request(f'http://127.0.0.1:{port}{path}', headers={'Origin': 'http://127.0.0.1:3000'})
    opener = http_opener()
    try:
        try:
            response = opener.open(request, timeout=15)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            raw = response.read()
            try:
                body = json.loads(raw)
            except ValueError:
                body = {'unparsed_response': raw.decode(errors='replace')[:200]}
            result = {'status': response.code, 'body': body,
                      'retry_after': response.headers.get('Retry-After'),
                      'overload_header': response.headers.get('X-Rihaish-Overload'),
                      'allow_origin': response.headers.get('Access-Control-Allow-Origin'),
                      'instance': response.headers.get('X-Rihaish-Instance')}
    except Exception as error:
        result = {'status': 0, 'body': {}, 'error': f'{type(error).__name__}: {error}'}
    result['elapsed_ms'] = round((time.perf_counter() - started) * 1000, 3)
    return result


def wait_ready(expected_limit):
    deadline = time.monotonic() + 45
    while time.monotonic() < deadline:
        samples = {str(port): call('/api/health/ready', port) for port in (8001, 8002, 8000)}
        live = {str(port): call('/api/health/live', port) for port in (8001, 8002)}
        if all(r['status'] == 200 and r['body'].get('ready') and r['body'].get('database') == 'rqlite' for r in samples.values()) and all(r['body'].get('admission', {}).get('limit') == expected_limit for r in live.values()):
            return {'ready': samples, 'live': live}
        time.sleep(0.25)
    raise RuntimeError(f'APIs did not become ready with admission limit {expected_limit}')


def counts():
    tables = ('users', 'karachi_properties', 'lahore_properties', 'islamabad_properties')
    results = ClusterClient().query([[f'SELECT COUNT(*) FROM {table}'] for table in tables])
    return {table: result['values'][0][0] for table, result in zip(tables, results)}


def restart_services(limit, report, service='all', actions=('stop', 'start')):
    for action in actions:
        command = ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
                   str(ROOT / 'scripts/dds_services.ps1'), '-Action', action,
                   '-MaxInflight', str(limit), '-Service', service]
        result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, timeout=60)
        report.setdefault('service_actions', []).append({'action': action, 'limit': limit, 'service': service,
                                                        'exit_code': result.returncode,
                                                        'output': result.stdout, 'error': result.stderr})
        result.check_returncode()


def pids():
    return {name: (ROOT / '.runtime/services' / (name + '.pid')).read_text().strip()
            for name in ('api1', 'api2', 'proxy')}


def save_report(report, directory):
    (directory / 'report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    example = html.escape(json.dumps(report.get('example_rejection', {}), indent=2))
    checks = ''.join(f'<tr><td>{html.escape(name)}</td><td>{"PASS" if ok else "FAIL"}</td></tr>'
                     for name, ok in report.get('assertions', {}).items())
    recovered = ('Five post-burst reads succeeded without restarting the services.'
                 if report.get('assertions', {}).get('automatic_recovery_without_restart') else
                 'Automatic recovery was not verified; inspect the full evidence.')
    markup = f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RIHAISH overload recovery evidence</title><style>body{{font:18px/1.5 system-ui;max-width:1000px;margin:32px auto;padding:0 24px;background:#122034;color:#eef5ff}}h1{{color:#78ead0}}pre{{white-space:pre-wrap;background:#213750;padding:18px}}table{{border-collapse:collapse;width:100%}}td{{padding:8px;border:1px solid #647b94}}a{{color:#78ead0}}</style>
<h1>Real overload rehearsal: {html.escape(report['result'])}</h1>
<p>Bounded real API requests, temporary admission limit {report['demo_limit']} per API process. This is not a million-client stress test.</p>
<p>Observed burst responses: {html.escape(str(report.get('response_counts', {})))}</p>
<table>{checks}</table><h2>Actual rejected response</h2><pre>{example}</pre>
<p>HTTP 503 with Retry-After is intentional load shedding before the handler. {recovered} The demonstration changes the configured limit temporarily; consult the restored_health evidence for restoration of the previous limit.</p>
<p>No database node is stopped. No application record is written. Existing k6 sustained-load failures remain unresolved.</p>
<p><a href="report.json">Full measured evidence</a></p></html>'''
    (directory / 'report.html').write_text(markup, encoding='utf-8')


def verify(requests=32, clients=4, demo_limit=1):
    if not (16 <= requests <= 200 and 2 <= clients <= 32 and clients <= requests and 1 <= demo_limit <= 8):
        raise ValueError('Bounded demo: 16–200 requests, 2–32 clients, demo limit 1–8')
    run = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:6]
    directory = ROOT / 'docs/evidence' / ('overload-' + run)
    directory.mkdir(parents=True, exist_ok=False)
    report = {'result': 'FAIL', 'started_at_utc': datetime.now(timezone.utc).isoformat(),
              'run_id': run, 'demo_limit': demo_limit, 'requests_planned': requests,
              'client_worker_limit': clients, 'million_client_test': False}
    report['source_sha256'] = {
        name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
        for name in ('backend/app/main.py', 'backend/app/core/admission.py',
                     'infra/Caddyfile', 'scripts/dds_services.ps1', 'scripts/verify_dds_overload.py')
    }
    changed = False
    restore_limit = 8
    stop_monitor = threading.Event()
    monitor = None
    try:
        report['cluster_before'] = cluster_status()
        assert report['cluster_before']['reachable_nodes'] == 3 and report['cluster_before']['quorum_read_verified']
        report['database_counts_before'] = counts()
        previous = [call('/api/health/live', port) for port in (8001, 8002)]
        assert all(r['status'] == 200 for r in previous)
        limits = {r['body'].get('admission', {}).get('limit', 8) for r in previous}
        assert len(limits) == 1, 'Different prior limits; restore them manually rather than guessing'
        restore_limit = limits.pop()
        report['restore_limit'] = restore_limit
        changed = True
        print(f'Installing real demonstration limit {demo_limit} using existing owned API/proxy services...', flush=True)
        restart_services(demo_limit, report)
        report['before_burst_health'] = wait_ready(demo_limit)
        before_pids = pids()
        health_samples = []
        def monitor_liveness():
            while not stop_monitor.is_set():
                for port in (8001, 8002, 8000):
                    health_samples.append({'port': port, **call('/api/health/live', port)})
                stop_monitor.wait(0.05)
        monitor = threading.Thread(target=monitor_liveness, daemon=True)
        monitor.start()
        start = threading.Event()
        def browse(index):
            start.wait()
            city = ('karachi', 'lahore', 'islamabad')[index % 3]
            return {'index': index, **call(f'/api/properties/?city={city}&page_size=10&sort=price_asc')}
        print(f'Burst: {requests} actual property GETs, up to {clients} client workers...', flush=True)
        began = time.perf_counter()
        with concurrent.futures.ThreadPoolExecutor(max_workers=clients) as pool:
            jobs = [pool.submit(browse, i) for i in range(requests)]
            start.set()
            responses = [job.result() for job in jobs]
        report['burst_wall_seconds'] = round(time.perf_counter() - began, 3)
        stop_monitor.set()
        monitor.join(timeout=50)
        report['liveness_during_burst'] = health_samples
        report['response_counts'] = dict(Counter(str(r['status']) for r in responses))
        accepted = [r for r in responses if r['status'] == 200]
        rejected = [r for r in responses if r['status'] == 503]
        report['requests'] = responses
        if rejected:
            report['example_rejection'] = rejected[0]
            times = sorted(r['elapsed_ms'] for r in rejected)
            report['rejection_p95_ms'] = times[math.ceil(len(times) * .95) - 1]
        report['admission_after_burst'] = {str(port): call('/api/health/live', port)['body'].get('admission', {}) for port in (8001, 8002)}
        began = time.perf_counter()
        report['recovery_reads'] = [call('/api/properties/?page_size=3&sort=price_asc') for _ in range(5)]
        report['recovery_check_wall_seconds'] = round(time.perf_counter() - began, 3)
        report['pids_before_burst'] = before_pids
        report['pids_after_recovery'] = pids()
        report['cluster_after_burst'] = cluster_status()
        report['database_counts_after'] = counts()
        report['unauthorized_profile_status_after_recovery'] = call('/api/auth/me')['status']
        def sorted_ten(response):
            rows = response['body'].get('results', [])
            return len(rows) == 10 and all(rows[i-1]['price'] <= rows[i]['price'] for i in range(1, len(rows)))
        report['assertions'] = {
            'some_real_requests_admitted': bool(accepted) and all(sorted_ten(r) for r in accepted),
            'excess_requests_rejected_explicitly': bool(rejected) and all(r['body'].get('code') == 'server_overloaded' and r.get('retry_after') == '1' and r.get('overload_header') == 'rejected-before-handler' for r in rejected),
            'no_timeouts_resets_or_unexpected_statuses': all(r['status'] in (200,503) for r in responses),
            'rejection_p95_under_2000_ms': report.get('rejection_p95_ms', float('inf')) < 2000,
            'both_api_instances_seen': {'api1','api2'}.issubset({r.get('instance') for r in responses}),
            'overload_response_keeps_cors_headers': bool(rejected) and all(r.get('allow_origin') in ('*','http://127.0.0.1:3000') for r in rejected),
            'active_work_bounded_and_drained': all(a.get('limit') == demo_limit and a.get('peak_active', 999) <= demo_limit and a.get('active') == 0 for a in report['admission_after_burst'].values()),
            'liveness_survived_burst': bool(health_samples) and all(s['status'] == 200 and s['body'].get('alive') for s in health_samples),
            'automatic_recovery_without_restart': before_pids == report['pids_after_recovery'] and all(r['status'] == 200 and len(r['body'].get('results', [])) == 3 for r in report['recovery_reads']),
            'quorum_and_three_nodes_survived': report['cluster_after_burst']['quorum_read_verified'] and report['cluster_after_burst']['reachable_nodes'] == 3,
            'application_record_counts_unchanged': report['database_counts_before'] == report['database_counts_after'],
            'authorization_still_denies_unauthenticated': report['unauthorized_profile_status_after_recovery'] == 401,
        }
        assert all(report['assertions'].values()), report['assertions']
        # Separate actual worker outage; keep Caddy and all database nodes up.
        print('Checking gateway response with both owned API processes offline...', flush=True)
        try:
            for name in ('api1', 'api2'):
                restart_services(demo_limit, report, name, ('stop',))
            report['both_apis_offline_response'] = call('/api/properties/?page_size=3')
            unavailable = report['both_apis_offline_response']
            report['assertions']['gateway_failure_is_explicit'] = unavailable['status'] == 503 and unavailable['body'].get('code') == 'gateway_unavailable' and unavailable.get('retry_after') == '1'
            report['assertions']['database_quorum_survives_api_outage'] = cluster_status()['quorum_read_verified']
        finally:
            for name in ('api1', 'api2'):
                restart_services(demo_limit, report, name, ('start',))
            report['after_api_outage_health'] = wait_ready(demo_limit)
        report['assertions']['gateway_recovers_after_api_restart'] = call('/api/properties/?page_size=3')['status'] == 200 and pids()['proxy'] == before_pids['proxy']
        assert all(report['assertions'].values()), report['assertions']
        report['result'] = 'PASS'
    except Exception as error:
        report['error'] = f'{type(error).__name__}: {error}'
    finally:
        stop_monitor.set()
        if monitor:
            monitor.join(timeout=50)
        if changed:
            try:
                print(f'Restoring previous API admission limit {restore_limit}...', flush=True)
                restart_services(restore_limit, report)
                report['restored_health'] = wait_ready(restore_limit)
                report['frontend_ready_after_restore'] = call('/api/health/ready', 3000)
                assert report['frontend_ready_after_restore']['body'].get('ready') and report['frontend_ready_after_restore']['body'].get('database') == 'rqlite'
            except Exception as error:
                report['result'] = 'FAIL'
                report['restore_error'] = str(error)
        report['completed_at_utc'] = datetime.now(timezone.utc).isoformat()
        save_report(report, directory)
    print(json.dumps({key: report.get(key) for key in ('result','response_counts','rejection_p95_ms','assertions','error','restore_error')}, indent=2), flush=True)
    print('Evidence: ' + str(directory), flush=True)
    return report['result'] == 'PASS'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--requests', type=int, default=32)
    parser.add_argument('--clients', type=int, default=4)
    parser.add_argument('--demo-limit', type=int, default=1)
    args = parser.parse_args()
    sys.exit(0 if verify(args.requests, args.clients, args.demo_limit) else 1)
