# Measured DDS performance

## Latest evaluator-requested prerequisite — October 26, 10:13 Asia/Karachi

The evaluator's target was clarified as **1,000,000 simultaneously active users**. That target was not executed or demonstrated. The original ten-VU/30-second property-browsing workload was rerun unchanged with label `million-concurrent-prerequisite`; `evidence/k6-20261026T101334945/run.json` records k6 exit 99. k6 warned that no iterations completed; `http_reqs` is absent and both API counters are zero. Zero-filled latency, error and check metrics have no samples and must be interpreted as **N/A**, not successful performance. This failed prerequisite cannot establish server capacity or its root cause. No larger ramp was attempted. All three voting nodes and 8001/8002/8000/3000 readiness passed afterwards; see its `post-test-health.json`. Exact evidence commands and real million-user prerequisites: `DDS_MILLION_USER_TEST.md`.

The original workload and thresholds remain unchanged. Every row below comes from a retained raw k6 summary. Failed runs, alternate-profile diagnostics, and a run with only ten total requests are not evidence of stable sustained load.

| Run | Requests | Requests/s | Median ms | p90 ms | p95 ms | Failed % | All thresholds pass |
|---|---:|---:|---:|---:|---:|---:|---|
| [historical initial failure](evidence/k6-initial-failed-summary.json) | 4 | 0.033 | 35035.54 | 47053.09 | 48555.34 | 100.00 | FAIL |
| [historical second failure](evidence/k6-second-failed-summary.json) | 3 | 0.043 | 30049.07 | 30050.94 | 30051.18 | 100.00 | FAIL |
| [historical third failure](evidence/k6-third-failed-summary.json) | 3 | 0.060 | 0.00 | 24027.12 | 27030.51 | 100.00 | FAIL |
| [historical batching/TLS-cache run](evidence/k6-summary.json) | 43 | 1.399 | 195.01 | 10088.29 | 19996.33 | 51.16 | FAIL |
| [resume-batched-baseline](evidence/k6-20261026T061838304/summary.json) | 29 | 0.480 | 192.47 | 19934.53 | 25966.55 | 58.62 | FAIL |
| [diagnostic-direct-api](evidence/k6-20261026T062037822/summary.json) | 2860 | 95.083 | 0.00 | 0.00 | 0.00 | 100.00 | FAIL |
| [diagnostic-direct-ready-api](evidence/k6-20261026T062142171/summary.json) | 408 | 13.475 | 143.93 | 211.39 | 276.68 | 2.45 | FAIL |
| [batched-pooled-transport](evidence/k6-20261026T062358438/summary.json) | 6 | 0.120 | 30042.38 | 30043.45 | 30043.45 | 100.00 | FAIL |
| [same-workload-generator-one-thread](evidence/k6-20261026T062858552/summary.json) | 707 | 20.491 | 115.62 | 159.08 | 204.44 | 21.07 | FAIL |
| [windows-selector-loop](evidence/k6-20261026T063041947/summary.json) | 211 | 2.834 | 116.88 | 187.28 | 10024.45 | 9.48 | FAIL |
| [generator-profile](evidence/k6-20261026T063323451/summary.json) | 16 | 0.266 | 10024.86 | 10029.31 | 10029.84 | 100.00 | FAIL |
| [generator-profile-enabled](evidence/k6-20261026T063550016/summary.json) | 34 | 0.670 | 149.73 | 10042.21 | 13548.64 | 35.29 | FAIL |
| [pure-asgi-instance-header](evidence/k6-20261026T064811148/summary.json) | 166 | 3.768 | 159.89 | 10005.81 | 10022.41 | 15.66 | FAIL |
| [separate-api-liveness-db-readiness](evidence/k6-20261026T065559555/summary.json) | 19 | 0.473 | 20025.20 | 20043.10 | 20043.49 | 100.00 | FAIL |
| [loopback-only-no-telemetry](evidence/k6-20261026T070450083/summary.json) | 20 | 0.653 | 15125.57 | 30111.60 | 30116.37 | 50.00 | FAIL |
| [diagnostic-fresh-connections](evidence/k6-20261026T070832306/summary.json) | 13 | 0.324 | 20038.48 | 30058.82 | 30060.77 | 100.00 | FAIL |
| [direct-log-handles](evidence/k6-20261026T071340359/summary.json) | 10 | 0.124 | 432.80 | 453.73 | 455.48 | 0.00 | PASS |

Historical summaries lack code/configuration snapshots, and their overall duration includes different request/drain timeouts. These rows show actual outcomes; they do not establish that batching alone caused the throughput differences.

One direct-log-handle run returned exit 0 with all original thresholds passing, but made only ten requests. The repeated attached-console run failed. That sparse pass is retained and explicitly not treated as sustained-load acceptance.

## Controlled query comparison

`evidence/property-query-profile.json` compares the real route and rqlite SQL with per-property hydration versus batching. Both variants returned identical content hashes for all three cities. One ten-property city page fell from **42 HTTP requests / 42 SQL statements to 3 HTTP requests / 6 SQL statements**. Karachi elapsed time was 542→39 ms, Lahore 396→40 ms, Islamabad 356→32 ms. These are single-request diagnostic measurements, not k6 throughput claims.

## What is isolated so far

- SQL execution in that comparison was approximately 4–13 ms. Most pre-batching time was outside SQL execution.
- Python HTTPX: 100 concurrent requests, zero failures, about 42.8 requests/s, p95 295 ms (`evidence/python-concurrency-diagnostic.json`). This diagnostic is not a substitute for k6.
- Direct-API k6 removed Caddy from the path but still exceeded the error threshold. A no-database FastAPI route also stalled (`evidence/k6-static-api-diagnostic.json`).
- A controlled standalone HTTP echo service passed its latency/error thresholds (`evidence/k6-echo-controlled.json`). The earlier background echo lost its server, so its failure cannot support a performance conclusion.
- Stack samples, API/proxy logs and Raft logs show socket waits and occasional loopback/heartbeat timeouts. They do not establish a single proven root cause. No security software was disabled and no benchmark threshold was weakened.
- Selector-loop and generator-thread experiments did not resolve the issue; the selector-loop change was reverted.

- Correctly isolated minimal-ASGI tests on ports 9009 and 9010 passed with both installed Uvicorn 0.52.4 and workspace-local 0.32.0. The earlier 8999 ASGI test had a port-bind conflict and is invalid; no production dependency downgrade was adopted.
- Service launchers now use direct inherited log-file handles, avoiding a dependency on an exited PowerShell log reader. This is a launch reliability fix; repeated k6 traffic still failed, so it is not claimed as the complete performance root cause.

## Acceptance

Use `scripts/run_k6.ps1` to create a new run folder with raw output, exact workload, code hashes, k6 version, generator settings and exit code. Acceptance requires **exit code 0 and every original threshold passing**. Until then, sustained-load readiness remains open.
