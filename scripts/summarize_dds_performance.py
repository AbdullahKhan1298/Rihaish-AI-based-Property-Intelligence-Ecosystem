"""Summarize retained raw measurements without treating failed runs as passes."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'docs/evidence'


def metrics(path):
    data = json.loads(path.read_text(encoding='utf-8-sig'))
    m = data['metrics']
    values = lambda key: m[key].get('values', m[key])
    return {'requests': values('http_reqs')['count'], 'requests_per_second': values('http_reqs')['rate'],
            'repeated_iterations_observed': values('iterations').get('count', 0) > 10,
            'median_ms': values('http_req_duration')['med'], 'p90_ms': values('http_req_duration')['p(90)'],
            'p95_ms': values('http_req_duration')['p(95)'],
            'failed_request_rate': values('http_req_failed')['rate'],
            'all_thresholds_pass': all(t['ok'] for v in m.values() for t in v.get('thresholds', {}).values())}


def summarize():
    rows = []
    historical = [('k6-initial-failed-summary.json', 'historical initial failure'),
                  ('k6-second-failed-summary.json', 'historical second failure'),
                  ('k6-third-failed-summary.json', 'historical third failure'),
                  ('k6-summary.json', 'historical batching/TLS-cache run')]
    for filename, label in historical:
        path = EVIDENCE / filename
        if path.exists():
            rows.append({'label': label, 'evidence': 'docs/evidence/' + filename,
                         'configuration_snapshot_available': False, 'acceptance_profile': False, **metrics(path)})
    for metadata in sorted(EVIDENCE.glob('k6-*/run.json')):
        run = json.loads(metadata.read_text(encoding='utf-8-sig'))
        summary = metadata.with_name('summary.json')
        if summary.exists():
            rows.append({'label': run['label'], 'evidence': str(summary.relative_to(ROOT)).replace('\\', '/'),
                         'base_url': run['base_url'], 'exit_code': run.get('exit_code'),
                         'acceptance_profile': run.get('acceptance_profile', False),
                         'workload_sha256': run['workload_sha256'], 'configuration_snapshot_available': True,
                         **metrics(summary)})
    result = {'workload': '10 VUs, 30 seconds, rotating cities, price_asc, page_size=10, 0.1-second think time',
              'thresholds': {'failed_rate': '<0.01', 'p95_ms': '<2000', 'checks': '>0.99', 'both_api_counters': '>0'},
              'caveat': 'Historical reports lack source/config snapshots and use differing drain/request timeouts; raw throughput changes are not a controlled causal comparison.',
              'runs': rows}
    (EVIDENCE / 'performance-comparison.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    lines = ['# Measured DDS performance', '',
             'The original workload and thresholds remain unchanged. Every row below comes from a retained raw k6 summary. Failed runs, alternate-profile diagnostics, and a run with only ten total requests are not evidence of stable sustained load.', '',
             '| Run | Requests | Requests/s | Median ms | p90 ms | p95 ms | Failed % | All thresholds pass |',
             '|---|---:|---:|---:|---:|---:|---:|---|']
    for r in rows:
        link = r['evidence'].replace('docs/', '', 1)
        lines.append(f"| [{r['label']}]({link}) | {r['requests']} | {r['requests_per_second']:.3f} | {r['median_ms']:.2f} | {r['p90_ms']:.2f} | {r['p95_ms']:.2f} | {100*r['failed_request_rate']:.2f} | {'PASS' if r['all_thresholds_pass'] else 'FAIL'} |")
    lines.extend(['', 'Historical summaries lack code/configuration snapshots, and their overall duration includes different request/drain timeouts. These rows show actual outcomes; they do not establish that batching alone caused the throughput differences.', '',
                  'One direct-log-handle run returned exit 0 with all original thresholds passing, but made only ten requests. The repeated attached-console run failed. That sparse pass is retained and explicitly not treated as sustained-load acceptance.', '',
                  '## Controlled query comparison', '',
                  '`evidence/property-query-profile.json` compares the real route and rqlite SQL with per-property hydration versus batching. Both variants returned identical content hashes for all three cities. One ten-property city page fell from **42 HTTP requests / 42 SQL statements to 3 HTTP requests / 6 SQL statements**. Karachi elapsed time was 542→39 ms, Lahore 396→40 ms, Islamabad 356→32 ms. These are single-request diagnostic measurements, not k6 throughput claims.', '',
                  '## What is isolated so far', '',
                  '- SQL execution in that comparison was approximately 4–13 ms. Most pre-batching time was outside SQL execution.',
                  '- Python HTTPX: 100 concurrent requests, zero failures, about 42.8 requests/s, p95 295 ms (`evidence/python-concurrency-diagnostic.json`). This diagnostic is not a substitute for k6.',
                  '- Direct-API k6 removed Caddy from the path but still exceeded the error threshold. A no-database FastAPI route also stalled (`evidence/k6-static-api-diagnostic.json`).',
                  '- A controlled standalone HTTP echo service passed its latency/error thresholds (`evidence/k6-echo-controlled.json`). The earlier background echo lost its server, so its failure cannot support a performance conclusion.',
                  '- Stack samples, API/proxy logs and Raft logs show socket waits and occasional loopback/heartbeat timeouts. They do not establish a single proven root cause. No security software was disabled and no benchmark threshold was weakened.',
                  '- Selector-loop and generator-thread experiments did not resolve the issue; the selector-loop change was reverted.', '',
                  '- Correctly isolated minimal-ASGI tests on ports 9009 and 9010 passed with both installed Uvicorn 0.52.4 and workspace-local 0.32.0. The earlier 8999 ASGI test had a port-bind conflict and is invalid; no production dependency downgrade was adopted.',
                  '- Service launchers now use direct inherited log-file handles, avoiding a dependency on an exited PowerShell log reader. This is a launch reliability fix; repeated k6 traffic still failed, so it is not claimed as the complete performance root cause.', '',
                  '## Acceptance', '',
                  'Use `scripts/run_k6.ps1` to create a new run folder with raw output, exact workload, code hashes, k6 version, generator settings and exit code. Acceptance requires **exit code 0 and every original threshold passing**. Until then, sustained-load readiness remains open.'])
    (ROOT / 'docs/DDS_PERFORMANCE_REPORT.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(json.dumps({'summarized_runs': len(rows), 'threshold_passing_runs': sum(r['all_thresholds_pass'] for r in rows),
                      'sustained_acceptance_passing_runs': sum(r['all_thresholds_pass'] and r['acceptance_profile'] and r.get('exit_code') == 0 and r['repeated_iterations_observed'] for r in rows)}))


if __name__ == '__main__':
    summarize()
