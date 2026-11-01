# Evaluator request: one million simultaneous active users

> **Historical DDS requirement, retired from the current FYP demonstration on November 1, 2026.** The synthetic population mechanism is removed. This document retains the actual failed load-test evidence and its qualifications; it is not a current customer-count or capacity claim. Legitimate k6 tools remain available. See `FYP_MASSIVE_USER_CLEANUP.md`.

Confirmed by the user on October 26, 2026: the requirement means **1,000,000 concurrent active users**, not accounts or cumulative requests. This requirement is **NOT VERIFIED**. No million-user workload was launched and no million-user capacity result is claimed.

Later the user explicitly authorized an alternative using synthetic data and simulation. That alternative is implemented and actually executed: see `DDS_MILLION_SIMULATION_GUIDE.md` and `evidence/million-simulation-20261026T052601Z-f11db3/report.html`. It contains one million isolated fixture rows and a million-user virtual-time model, with a separate small live API sample. It does not establish the real concurrency target described here.

## Actual test performed

The existing original k6 acceptance workload was run as a bounded prerequisite without changing its workload, thresholds, application, database or frontend:

```powershell
Set-Location 'C:\Users\hp\.gemini\antigravity\scratch\rihaish'
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run_k6.ps1 -Label million-concurrent-prerequisite
```

Run: `evidence/k6-20261026T101334945/`, October 26 10:13:35–10:14:27 Asia/Karachi. k6 version 2.3.0. Original profile: ten constant VUs for 30 seconds, five-second graceful stop, ten-second request timeout, 0.1-second think time, rotating cities, ten-property pages, SQL price ascending, Caddy port 8000. Public property browsing only: this does not test one million authenticated sessions, users, account writes or browser-rendering processes.

| Measurement | Actual result |
|---|---|
| k6 process exit | 99 — FAIL |
| Completed iterations | None; explicit k6 warning |
| Completed request counter | `http_reqs` absent from summary |
| Response counters | api1 = 0; api2 = 0; both required thresholds failed |
| Latency / errors / checks | No samples; zero-filled trend/rate fields are NOT passing performance measurements |
| Sustained-load acceptance | Not established |
| One million concurrent users | Not run, not demonstrated |

This is an unsuccessful load run, not a measurement of the server's maximum capacity. The result alone does not prove whether the client generator, transport, or server caused the failure. Previous evidence also has unresolved native Windows transport/load stalls. No speculative fix or larger ramp was attempted after this failure.

Post-test real health succeeded at 10:15:19 Asia/Karachi: three reachable voting nodes, leader `rihaish-dds-2`, applied index 263 on every node, real quorum read; api1/8001, api2/8002, Caddy/8000 and Vite/3000 returned ready=true/database=rqlite. See `evidence/k6-20261026T101334945/post-test-health.json`. Existing services remain running. No user records were created or removed.

## Why this laptop cannot validate this target

Read-only host snapshot: eight logical processors, 7.88 GiB total physical RAM, 1.47 GiB available, 81% RAM load at sampling. The application, database voters and generator share this host. Interfaces are bound to loopback, so separate generators cannot currently reach the test service.

Grafana's [large-test guidance](https://grafana.com/docs/k6/latest/testing-guides/running-large-tests/) explains that generator CPU, RAM and network limits must be measured independently; its rough simple-test estimate is 1–5 MB per VU. Multiplying that guidance by one million gives approximately 1–5 TB of generator RAM as an illustrative sizing order, **not a measured RIHAISH requirement or a provisioning specification**. Actual workload-specific generator usage must be measured first. Application/database capacity is a separate requirement. Changing `vus` to 1000000 on this laptop would not constitute valid proof.

[Constant-VU semantics](https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/constant-vus/) specify concurrent looping virtual users; iteration time includes request time plus think time. One million VUs is not automatically one million requests per second. For example, one completed request every ten seconds per user means 100,000 requests/s; this is arithmetic, not a measured throughput prediction.

## How to show the current evidence to the evaluator

1. Show the healthy existing system using `DDS_FINAL_DEMO_COMMANDS.md`: three voters, SQL filtering/pages, two APIs, real leader failure/recovery and concurrent uniqueness. These functional results remain separate from load capacity.
2. State: **“Our DDS functional tests passed. The requirement for one million simultaneous users has not been demonstrated. The current ten-user k6 prerequisite fails, so we cannot claim large-scale capacity.”**
3. Open the exact workload and retained run evidence in PowerShell:

```powershell
Set-Location 'C:\Users\hp\.gemini\antigravity\scratch\rihaish'
Get-Content tests/dds_load.js
Get-Content docs/evidence/k6-20261026T101334945/run.json
Get-Content docs/evidence/k6-20261026T101334945/errors.txt
$s=Get-Content docs/evidence/k6-20261026T101334945/summary.json -Raw | ConvertFrom-Json
$s.metrics.api1_responses
$s.metrics.api2_responses
$s.metrics.vus_max
Get-Content docs/evidence/k6-20261026T101334945/post-test-health.json
```

4. Explain the warning: no iterations completed; there are no meaningful latency/error samples. Never present the summary's zero-valued percentiles or rates as successful results.
5. If the evaluator asks for a new run, execute the bounded ten-user command above, then use its newly printed evidence directory. It can fail again; preserve the result. Do not silently change thresholds or label ten VUs as a million users.
6. End by showing current readiness:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_cluster.ps1 -Action status
foreach ($port in @(8001,8002,8000,3000)) {
    Invoke-RestMethod "http://127.0.0.1:$port/api/health/ready" -TimeoutSec 15
}
```

## Steps required for an actual million-user experiment

These are prerequisites, not completed infrastructure or runnable deployment commands. No remote target, generator fleet, cloud account, budget, deployment manifests or evaluator-approved duration is configured in this repository.

1. Agree on the workload contract: read-only browsing versus authenticated sessions; endpoint mix, page sizes, think time, ramp, steady duration, data volume, latency/error acceptance and maximum resource use. Existing property browsing cannot establish authentication capacity.
2. Resolve the no-completion ten-VU prerequisite with matched generator/server telemetry. Obtain repeated, populated runs satisfying the original thresholds. Increase gradually only while the previous stage and service health remain acceptable; stop at the first failed stage and preserve evidence.
3. Prepare a separate authorized staging deployment reachable by test workers over a controlled network. Keep the current laptop demo intact. Preserve existing authentication and database semantics; do not insert a million fake users into retained data.
4. Measure generator CPU, RAM, network and successful session throughput at modest concurrency on dedicated workers. Select worker count from those measurements with headroom. Monitor the application and database independently so generator saturation is not mistaken for server latency.
5. Coordinate workers so the **simultaneous sum of active VUs**, during a specified steady interval, actually reaches 1,000,000. As pure arithmetic, 100 workers × 10,000 VUs sums to the target; it is not a claim that 100 suitable workers exist or that this workload fits them. Ten sequential runs do not add their concurrency.
6. Ramp through agreed stages; collect completed requests, checks, p50/p90/p95/p99, failure rates, achieved active users over time, generator saturation, API CPU/RAM, proxy traffic, Raft health, database timings and test source/config hashes. Keep original acceptance thresholds; insufficient samples and interrupted VUs are not acceptance.
7. Report the highest **measured sustained passing** concurrency. If the run fails before one million, the target remains unmet. Do not extrapolate a small passing test into a million-user claim.

Exact next action: diagnose the existing ten-VU no-completion result before any scale increase. A genuine million-user run additionally requires suitable staging and independent generators. The current functional DDS demonstration can proceed, with this performance limitation disclosed.
