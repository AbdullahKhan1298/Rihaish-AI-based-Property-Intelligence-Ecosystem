# Final DDS live demonstration — October 27, 2026

Rehearsed October 26, 08:08–08:19 Asia/Karachi. Functional rehearsal PASS; sustained k6 acceptance remains OPEN. Use this recovered checkout and retained `.runtime` stores. No migration, import, reset, dependency installation, or performance tuning is part of this demonstration.

Later evaluator request: **one million simultaneous active users**. This remains NOT VERIFIED; the unchanged ten-VU prerequisite at 10:13 failed without completed iterations. Use [DDS_MILLION_USER_TEST.md](DDS_MILLION_USER_TEST.md) for actual evidence and what can honestly be shown. The functional rehearsal below does not establish million-user capacity.

## A–C. Commands in execution order, checks, and what they prove

Use Windows PowerShell. Terminal A stays at the project root. Commands below use existing scripts; the single-node option scopes the existing verifier to keep two voters online. Do not run the default full verifier during this walkthrough: it also deliberately removes quorum.

### 1. Inspect the existing processes first

```powershell
Set-Location 'C:\Users\hp\.gemini\antigravity\scratch\rihaish'
$env:PYTHONIOENCODING='utf-8'
$ErrorActionPreference='Stop'
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_cluster.ps1 -Action status
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_services.ps1 -Action status
```

Expected: three owned node processes, api1, api2 and proxy running. PIDs vary. Process status alone does not prove database availability. If stopped, use recovery section D before proceeding; do not restart healthy processes.

### 2. Show actual Raft identity and leadership

```powershell
$nodes = foreach ($port in @(4001,4003,4005)) {
    $s=Invoke-RestMethod "http://127.0.0.1:$port/status" -TimeoutSec 10
    [pscustomobject]@{Port=$port; Node=$s.store.node_id; Role=$s.store.raft.state; Voter=$s.store.raft.voter; Leader=$s.store.leader.node_id}
}
$nodes | Format-Table
if (@($nodes).Count -ne 3 -or @($nodes | Where-Object { -not $_.Voter }).Count -ne 0 -or @($nodes | Where-Object Role -eq 'Leader').Count -ne 1 -or @($nodes.Leader | Select-Object -Unique).Count -ne 1) { throw 'Cluster is not ready for failure demonstration' }
```

Expected IDs: `rihaish-dds-1`, `rihaish-dds-2`, `rihaish-dds-3`; three `True` voters, one Leader, two Followers, same elected leader. HTTP ports 4001/4003/4005 have Raft partners 4002/4004/4006. The final rehearsal leader was node 2; do not assume tomorrow's leader. Successful responses establish connectivity; the next readiness check establishes a quorum read.

If sequential status requests straddle an election, rerun section 2 and require a consistent result before starting the failure test. The last documentation check observed such a leadership transition; a subsequent real quorum read confirmed HEALTHY with all three voters, leader node 1, and applied index 258 on all nodes (`evidence/final-demo/end-cluster-health.json`). No extra node was stopped. Do not claim leadership stayed fixed throughout the session.

### 3. Confirm both APIs and the proxy

```powershell
foreach ($port in @(8001,8002,8000)) {
    $h=Invoke-RestMethod "http://127.0.0.1:$port/api/health/ready" -TimeoutSec 15
    if (-not $h.ready -or $h.database -ne 'rqlite') { throw "Not ready: $port" }
    [pscustomobject]@{Port=$port; Ready=$h.ready; Database=$h.database; Instance=$h.instance}
}
$instances=@(1..6 | ForEach-Object { (Invoke-RestMethod 'http://127.0.0.1:8000/api/health/ready' -TimeoutSec 15).instance } | Sort-Object -Unique)
$instances
if ($instances.Count -ne 2) { throw 'Both proxy upstreams were not observed' }
```

Expected: 8001 api1, 8002 api2, Caddy 8000 reaches both; ready True and database rqlite. `/api/health/live` only proves API-process liveness. Readiness performs a real linearizable database read; it must not silently use SQLite on failure.

### 4. Search, numerical filtering, global SQL sorting and pagination

```powershell
$base='http://127.0.0.1:8000/api/properties/?q=plot&min_price=1000000&max_price=10000000&sort=price_asc&page_size=5'
$p1=Invoke-RestMethod "$base&page=1" -TimeoutSec 15
$p2=Invoke-RestMethod "$base&page=2" -TimeoutSec 15
$p1 | Select-Object total,page,page_size
$p1.results | Select-Object id,title,price
$p2.results | Select-Object id,title,price
$prices=@($p1.results.price)+@($p2.results.price)
if (@($prices | Where-Object { $_ -lt 1000000 -or $_ -gt 10000000 }).Count) { throw 'Price range failed' }
for ($i=1; $i -lt $prices.Count; $i++) { if ($prices[$i] -lt $prices[$i-1]) { throw 'Ordering failed' } }
if (@((@($p1.results.id)+@($p2.results.id)) | Select-Object -Unique).Count -ne 10) { throw 'Pagination failed' }
```

Observed: total 49; page 1 prices 1,200,000; 1,200,000; 1,800,000; 1,800,000; 1,841,000. Page 2: 2,100,000; 2,450,000; 2,700,000; 2,700,000; 2,700,000. Ten distinct IDs and nondecreasing prices across the page boundary. Legitimate later data updates can change these values; assertions check the contract rather than fixed prices. This is the SQL-backed API demonstration, separate from the frontend's existing client-side controls.

### 5. Show the preserved frontend

First open `http://127.0.0.1:3000`. If Vite is stopped, use **Terminal B** and leave it running:

```powershell
Set-Location 'C:\Users\hp\.gemini\antigravity\scratch\rihaish\frontend'
npm run dev -- --host 127.0.0.1 --port 3000 --strictPort
```

Do not run a duplicate when 3000 already serves RIHAISH. In Terminal A:

```powershell
Invoke-RestMethod 'http://127.0.0.1:3000/api/health/ready' -TimeoutSec 15
Start-Process 'http://127.0.0.1:3000/search'
```

Expected: ready True through Vite → Caddy → API → rqlite. In the browser choose Explore Properties, enter **Silicon**, choose **Under 50 Lacs**, choose **Price: Low to High**. Rehearsal displayed three results. Open **5 Marla Smart Residential Plot in Overseas Block**; `/property/prop-isb-001` displayed specifications and the inquiry form. Do not submit an inquiry: that can contact somebody. Home, filtered search and detail screenshots are in `evidence/final-demo/`.

The UI's marketing totals/accuracy/legal-verification badges are not DDS measurements. Its initial budget can exclude listings; use actual SQL counts below when explaining the dataset.

### 6–10. Isolated persistence, real leader failure, recovery and uniqueness

```powershell
$demoRun=Get-Date -Format yyyyMMddTHHmmss
$demoReport="docs/evidence/final-demo/evaluator-$demoRun.json"
python scripts/verify_dds_live.py --single-node-only --output $demoReport
if ($LASTEXITCODE -ne 0) { throw 'Rehearsal failed; restore with section F and inspect output' }
$r=Get-Content $demoReport -Raw | ConvertFrom-Json
$r.before.nodes | Format-Table node_id,reachable,role,voter,leader
$r.tests.leader_failure | Format-List
$r.during_failure.nodes | Format-Table node_id,reachable,role,voter,leader
$r.after.nodes | Format-Table node_id,reachable,role,voter,leader
$r.tests | ConvertTo-Json -Depth 6
```

Expected: exit 0; old leader unreachable, a different leader, two reachable voters with successful reads/writes, then all three recovered. `all_three_local_copies_caught_up`, `transaction_rollback`, and `only_current_run_probe_rows_cleaned` must be true. Twelve concurrent inserts must produce committed 1 / database_rejections 11. Show the persisted pre-failure value and successful offline-leader write through the verifier's assertions and report.

The existing verifier creates UUID-labelled rows in `dds_verification`, commits a write before failure, races the same key, checks transaction rollback, stops the discovered leader using the owned-process launcher, reads the earlier value and writes with two voters, restarts the node in `finally`, and checks the new value on every node's local copy. It deletes only its three exact probe IDs after successful verification. It never resets application tables. Uniqueness executes **before** failure internally; display its result after recovery for the presentation. This is one integrated test, not a claim that those operations executed in a different order.

Rehearsal: run `e8317b95f8374eefad5e87e9a805ed96`, node 3 → node 2, quorum probe recovered 2.344 seconds after the stop command. That timing is not a guaranteed SLA or total measured outage. Test duration approximately 34 seconds. Read `evidence/final-demo/single-node-rehearsal.json` for this actual run; tomorrow's command creates a separate timestamped report.

Two-node quorum loss was deliberately **not repeated**. Existing `evidence/live-dds-verification.json` already records HTTP 503 readiness with quorum lost, process liveness 200, and recovery. Do not stop another voter manually during this demonstration.

### 11. Show measured query batching evidence

```powershell
$profile=Get-Content docs/evidence/property-query-profile.json -Raw | ConvertFrom-Json
$profile.scope
$profile.measurements | Format-Table city,mode,database_http_requests,sql_statements,route_elapsed_ms
foreach ($city in @('karachi','lahore','islamabad')) {
    $m=@($profile.measurements | Where-Object city -eq $city)
    [pscustomobject]@{City=$city; IdenticalResponseHashes=(@($m.response_sha256 | Select-Object -Unique).Count -eq 1)}
}
```

Expected: each ten-item city page **42 → 3 database HTTP calls**, **42 → 6 SQL statements**, identical response hashes. Route function elapsed times: Karachi 542.42 → 39.001 ms; Lahore 396.279 → 40.325 ms; Islamabad 355.566 → 32.476 ms. This reuses preserved controlled real-SQL measurements, excluding API routing/load generation. It is **not** a fresh benchmark or proof of sustained-load acceptance. No k6 workload was run or threshold changed during this final rehearsal. The sparse ten-request threshold pass is insufficient; the repeated run failed. See `DDS_PERFORMANCE_REPORT.md` for retained failures.

### 12. End with source preservation and final readiness

```powershell
python scripts/verify_dds_data.py
if ($LASTEXITCODE -ne 0) { throw 'Preservation check failed' }
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_cluster.ps1 -Action status
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_services.ps1 -Action status
foreach ($port in @(8001,8002,8000,3000)) {
    $h=Invoke-RestMethod "http://127.0.0.1:$port/api/health/ready" -TimeoutSec 15
    if (-not $h.ready -or $h.database -ne 'rqlite') { throw "Not ready: $port" }
    [pscustomobject]@{Port=$port; Ready=$h.ready; Database=$h.database; Instance=$h.instance}
}
```

Expected: seven original SQLite files unchanged, frontend_files_changed empty, 224 properties / 18 societies, 134 inherited foreign-key violations, zero users. All services ready. Repeat section 2 to display current leader and three voters. Never describe the inherited violations as fixed.

## D. Safe recovery if something does not restart

Read logs first. Use only the existing ownership-checking scripts; never kill arbitrary Python/node processes or delete `.runtime` stores.

```powershell
Get-Content .runtime/dds/node1.stderr.log -Tail 40
Get-Content .runtime/dds/node2.stderr.log -Tail 40
Get-Content .runtime/dds/node3.stderr.log -Tail 40
Get-Content .runtime/services/api1.stderr.log -Tail 40
Get-Content .runtime/services/api2.stderr.log -Tail 40
Get-Content .runtime/services/proxy.stderr.log -Tail 40
```

If one node is stopped, start that node (choose its actual number); existing stores are reused:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_cluster.ps1 -Action start -Node 1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_cluster.ps1 -Action start -Node 2
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_cluster.ps1 -Action start -Node 3
```

Already-running nodes are skipped. Allow election/replay, then repeat sections 2–3. If a running owned node remains unhealthy, inspect logs and ports before taking action; do not stop a second voter or reset a data directory.

For stopped API/proxy processes use `dds_services.ps1 -Action start`. Only if the existing API/proxy group is running but unusable after database recovery, restart that **owned group**:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_services.ps1 -Action stop
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_services.ps1 -Action start
```

This briefly interrupts both APIs/Caddy and does not stop the database. The script now supports `-Service api1`, `-Service api2` or `-Service proxy`; the default selects all three. If a port/ownership mismatch is reported, inspect `Get-NetTCPConnection -State Listen`; do not kill the unrelated owner. Vite's `--strictPort` prevents silent port changes. If your foreground Terminal B Vite is broken, Ctrl+C there and repeat its launch command. Do not use `start_servers.bat` (legacy SQLite API conflicts with Caddy) or broad stop scripts.

## E. 7–10 minute evaluator walkthrough

| Time | Show and explain |
|---|---|
| 0:00–1:00 | Three real voters, one elected leader, full replicated relational data; all on one laptop. |
| 1:00–2:00 | Two API instances through Caddy; readiness is a real quorum read. |
| 2:00–3:00 | SQL search, numerical prices, sorted nonoverlapping pages; preserved frontend search/detail. |
| 3:00–5:00 | Run single-node verifier; explain isolated writes, real leader stop and new election. |
| 5:00–6:00 | Show two-voter reads/writes, restarted node catch-up and exactly one of twelve inserts committing. |
| 6:00–7:30 | Show 42-to-3 evidence with matching hashes; distinguish it from unresolved sustained k6 acceptance. |
| 7:30–9:00 | Source preservation, three healthy voters, APIs/frontend healthy; explain limitations and questions. |

## F. Exact complete-cluster restoration commands

Run from Terminal A after an interrupted demonstration. Starts are idempotent and retain data; these are also the normal cold-start commands, not a migration.

```powershell
Set-Location 'C:\Users\hp\.gemini\antigravity\scratch\rihaish'
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_cluster.ps1 -Action start
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_services.ps1 -Action start
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_cluster.ps1 -Action status
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_services.ps1 -Action status
Invoke-RestMethod 'http://127.0.0.1:8001/api/health/ready' -TimeoutSec 15
Invoke-RestMethod 'http://127.0.0.1:8002/api/health/ready' -TimeoutSec 15
Invoke-RestMethod 'http://127.0.0.1:8000/api/health/ready' -TimeoutSec 15
```

Then section 2 must show three voters and one leader; section 5 starts Vite only if stopped. A successful process launch alone is not recovery confirmation. If the verifier is killed before cleanup, keep the run ID/output for inspection; do not issue a broad DELETE. Its successful path cleans only that run's probes.

## G. Factual answers and limits

- **Is it genuinely distributed?** Three separate rqlite/Raft processes, separate stores, voting/election and replicated SQL. One laptop provides process-failure tolerance, not independent-host, power, disk or network failure tolerance. All nodes replicate all data; city namespaces are logical partitions, not physical city shards.
- **How does this differ from the original failover?** Earlier simulated status toggles were not evidence of process failure or Raft election. This test stops the actual discovered leader, verifies a different elected leader, writes with quorum and verifies local catch-up.
- **How many failures are tolerated?** One of three voters. Losing two removes majority; supported database operations must fail (readiness 503), rather than silently fall back. A short election interruption is possible; no zero-downtime SLA is claimed.
- **Was data preserved?** Seven original SQLite files and frontend source hashes remain unchanged. Migration previously validated 31 table counts/hashes. Current read-only verification finds 224 properties and 18 society parent records.
- **What about integrity?** 134 source properties reference absent society parents: Karachi 18, Lahore 37, Islamabad 79. Denormalized property search retains them; society joins omit those properties. No missing parents were fabricated. UI labels are not independent legal validation.
- **Can you show existing-user migration?** The source copy had zero users. Real rqlite-backed buyer/admin JWT, cross-instance auth, RBAC, OTP single-use and watchlist concurrency passed earlier with isolated fixtures, then fixtures were cleaned. Evidence: `evidence/live-auth-verification.json`; not rerun during this rehearsal. No credentials or genuine migrated-user claim are supplied.
- **Did load testing pass?** Sustained acceptance is unresolved. Original thresholds are unchanged; failures and a sparse ten-request pass are retained. Query-call reduction is verified separately. No performance investigation was done in this rehearsal.
- **Why do UI numbers differ?** Existing budget/filter controls can exclude records and society options use denormalized strings. The UI's 28,500+ listing and accuracy/verification marketing claims are not dataset counts or measured DDS results. Quote SQL evidence for evaluation.

## Controlled rehearsal result

All twelve requested functional steps PASS, with step 11 explicitly reusing prior measured evidence. See `evidence/final-demo/rehearsal-summary.json`, `single-node-rehearsal.json`, `final-health.json`, `data-preservation.json`, and frontend screenshots. Final health recorded 08:19:27 Asia/Karachi: three reachable voters, leader node 2, both APIs, Caddy and Vite ready on rqlite. Only Vite was initially stopped and was launched; existing backend services were reused. Only node 3 was stopped for the controlled failure and restored. No source/frontend application code or original records were changed. Two-node quorum loss, authentication fixtures, A/B profiling and k6 were not repeated; their evidence/limits above remain explicit.
