"""Real cluster verification. Stops ONLY owned DDS nodes and always restarts them.

Writes only uniquely named rows in a dedicated dds_verification table, then
removes those exact probe rows after recovery. Never deletes retained data or
volumes. Run with no concurrent evaluator writes.
"""
import concurrent.futures
import argparse
import json
import sqlite3
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from app.db.rqlite import ClusterClient, ClusterUnavailable, cluster_status


def node_action(action, number):
    subprocess.run(['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', str(ROOT / 'scripts/dds_cluster.ps1'), '-Action', action, '-Node', str(number)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=30)


def api(path, port=8000):
    request = urllib.request.Request(f'http://127.0.0.1:{port}' + path)
    try:
        with ClusterClient().opener.open(request, timeout=20) as response:
            return response.status, json.load(response), response.headers.get('X-Rihaish-Instance')
    except urllib.error.HTTPError as exc:
        return exc.code, {}, None


def await_query(client, timeout=30):
    started = time.monotonic()
    while time.monotonic() - started < timeout:
        try:
            client.query([['SELECT 1']])
            return round(time.monotonic() - started, 3)
        except ClusterUnavailable:
            time.sleep(0.25)
    raise RuntimeError('Cluster did not regain quorum')


def verify(single_node_only=False, output=None):
    report_path = (output or ROOT / 'docs/evidence/live-dds-verification.json').resolve()
    if not report_path.is_relative_to((ROOT / 'docs/evidence').resolve()):
        raise ValueError('Verification reports must stay under docs/evidence')
    run = uuid.uuid4().hex
    client = ClusterClient(timeout=4)
    evidence = {'run_id': run, 'started_at_utc': datetime.now(timezone.utc).isoformat(),
                'scope': 'single-node-only' if single_node_only else 'full-quorum-loss', 'tests': {}}
    for port in (8001, 8002, 8000):
        deadline = time.monotonic() + 30
        while True:
            try:
                if api('/api/health/ready', port)[0] == 200:
                    break
            except OSError:
                pass
            if time.monotonic() > deadline:
                raise RuntimeError(f'API on {port} did not become ready')
            time.sleep(0.25)
    evidence['before'] = cluster_status()
    assert evidence['before']['reachable_nodes'] == 3
    assert evidence['before']['quorum_read_verified']
    assert all(n.get('voter') for n in evidence['before']['nodes'])
    leaders = [n for n in evidence['before']['nodes'] if n.get('role') == 'Leader']
    assert len(leaders) == 1
    leader_number = int(leaders[0]['node_id'].split('-')[-1])
    client.atomic([['CREATE TABLE IF NOT EXISTS dds_verification (id TEXT PRIMARY KEY, value TEXT NOT NULL)']])
    client.atomic([['INSERT INTO dds_verification VALUES (?, ?)', run + '-before', 'committed-before-failure']])

    def competing_insert(_):
        try:
            ClusterClient().atomic([['INSERT INTO dds_verification VALUES (?, ?)', run + '-race', 'unique']])
            return 'committed'
        except sqlite3.IntegrityError:
            return 'constraint_conflict'
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        results = list(pool.map(competing_insert, range(12)))
    assert results.count('committed') == 1 and results.count('constraint_conflict') == 11
    evidence['tests']['concurrent_unique_inserts'] = {'attempts': 12, 'committed': 1, 'database_rejections': 11}
    try:
        client.atomic([['INSERT INTO dds_verification VALUES (?, ?)', run + '-rollback', 'must-not-commit'],
                       ['INSERT INTO dds_verification VALUES (?, ?)', run + '-race', 'duplicate']])
        raise AssertionError('Duplicate transaction should fail')
    except sqlite3.IntegrityError:
        assert client.query([['SELECT COUNT(*) FROM dds_verification WHERE id=?', run + '-rollback']])[0]['values'][0][0] == 0
    evidence['tests']['transaction_rollback'] = True

    observed_instances = set()
    for _ in range(6):
        code, body, instance = api('/api/health/ready')
        assert code == 200 and body['database'] == 'rqlite'
        observed_instances.add(instance)
    assert observed_instances == {'api1', 'api2'}
    evidence['tests']['load_balancer_instances'] = sorted(observed_instances)
    code, first, _ = api('/api/properties/?page_size=10&sort=price_asc')
    assert code == 200 and first['total'] == 224
    _, second, _ = api('/api/properties/?page_size=10&page=2&sort=price_asc')
    rows = first['results'] + second['results']
    assert len({r['id'] for r in rows}) == 20
    assert [r['price'] for r in rows] == sorted(r['price'] for r in rows)
    assert api('/api/properties/?q=%27%20OR%201%3D1%20--&page_size=10')[1]['total'] == 0
    assert api('/api/admin/metrics')[0] == 401
    evidence['tests']['sql_pagination_search_and_unauthorized_access'] = True
    minimum, maximum = rows[3]['price'], rows[-5]['price']
    code, filtered, _ = api(f'/api/properties/?min_price={minimum}&max_price={maximum}&sort=price_asc&page_size=100')
    assert code == 200 and filtered['total'] > 0
    assert all(minimum <= r['price'] <= maximum for r in filtered['results'])
    code, searched, _ = api('/api/properties/?q=plot&page_size=10')
    assert code == 200 and searched['total'] > 0
    evidence['tests']['numeric_price_filters_and_real_search'] = True

    stopped = []
    try:
        node_action('stop', leader_number)
        stopped.append(leader_number)
        try:
            ClusterClient([leaders[0]['url']], timeout=1).request('/status')
            raise AssertionError('Leader process is still reachable')
        except ClusterUnavailable:
            pass
        failover_seconds = await_query(client)
        client.atomic([['INSERT INTO dds_verification VALUES (?, ?)', run + '-during', 'committed-with-leader-offline']])
        assert client.query([['SELECT value FROM dds_verification WHERE id=?', run + '-before']])[0]['values'][0][0] == 'committed-before-failure'
        assert api('/api/properties/?page_size=3')[1]['total'] == 224
        evidence['during_failure'] = cluster_status()
        assert evidence['during_failure']['reachable_nodes'] == 2
        new_leader = next(n['node_id'] for n in evidence['during_failure']['nodes'] if n.get('role') == 'Leader')
        assert new_leader != leaders[0]['node_id']
        evidence['tests']['leader_failure'] = {'stopped': leaders[0]['node_id'], 'new_leader': new_leader, 'quorum_probe_recovery_seconds': failover_seconds, 'read_and_write_succeeded': True}

        if not single_node_only:
            # A majority is required: no fake success with just one voting node.
            second_stop = next(i for i in (1, 2, 3) if i != leader_number)
            node_action('stop', second_stop)
            stopped.append(second_stop)
            time.sleep(2)
            status_code, _, _ = api('/api/health/ready', port=8001)
            assert status_code == 503, status_code
            evidence['tests']['quorum_loss_returns_503'] = True
            assert api('/api/health/live', port=8001)[0] == 200
            evidence['tests']['process_liveness_does_not_claim_database_readiness'] = True
        else:
            evidence['not_repeated'] = ['two-node quorum loss; reuse prior full-quorum-loss report']
    finally:
        for number in reversed(stopped):
            node_action('start', number)
        await_query(client)

    # Every restarted node must contain the write performed while leader was down.
    for url in client.urls:
        deadline = time.monotonic() + 30
        while True:
            try:
                result = ClusterClient([url]).request('/db/query?level=none', [['SELECT value FROM dds_verification WHERE id=?', run + '-during']])
                if result['results'][0].get('values') == [['committed-with-leader-offline']]:
                    break
            except sqlite3.OperationalError:
                # A restarted node can accept HTTP before replay creates tables.
                pass
            if time.monotonic() > deadline:
                raise AssertionError('Node did not catch up: ' + url)
            time.sleep(0.25)
    evidence['tests']['all_three_local_copies_caught_up'] = True
    evidence['after'] = cluster_status()
    probe_ids = [run + suffix for suffix in ('-before', '-race', '-during')]
    client.atomic([['DELETE FROM dds_verification WHERE id IN (?,?,?)', *probe_ids]])
    assert client.query([['SELECT COUNT(*) FROM dds_verification WHERE id IN (?,?,?)', *probe_ids]])[0]['values'][0][0] == 0
    evidence['tests']['only_current_run_probe_rows_cleaned'] = True
    evidence['completed_at_utc'] = datetime.now(timezone.utc).isoformat()
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(evidence, indent=2), encoding='utf-8')
    print(json.dumps(evidence, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--single-node-only', action='store_true', help='Keep two voters online; skip the already-proven majority-outage phase')
    parser.add_argument('--output', type=Path, help='Separate JSON report under docs/evidence')
    args = parser.parse_args()
    verify(args.single_node_only, args.output)

