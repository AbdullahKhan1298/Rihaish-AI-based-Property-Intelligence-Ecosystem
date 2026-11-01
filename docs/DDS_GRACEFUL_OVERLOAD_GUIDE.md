# Graceful overload and API failure — manual evaluator test

Implemented October 26, 2026. The intended behavior is bounded active work, explicit temporary rejection, preserved data and recovery. A deliberate database crash is unnecessary.

**Current verification:** four isolated admission tests PASS. Two larger HTTP rehearsals FAIL; reports are preserved below. Final gateway validation, the smaller 32-request/4-client rehearsal, gateway-outage test, DDS regression rerun and auth rerun are **PENDING MANUAL EXECUTION**. Automatic permission review timed out, and the user selected manual commands. The new gateway file is not active until Caddy restarts. Do not claim this entire feature passed until a new actual report says PASS.

## Implemented behavior

- `backend/app/core/admission.py`: real ASGI admission control, default **eight active requests per API process**, sixteen across the two current processes. Startup setting `RIHAISH_MAX_INFLIGHT` accepts 1–128. This is an application-work bound, not measured throughput. There is no waiting queue.
- Excess requests are rejected before handler/body/SQL execution: HTTP 503, `Retry-After: 1`, `Cache-Control: no-store`, `X-Rihaish-Overload: rejected-before-handler`, JSON `{"detail":"Server busy. Please retry shortly.","code":"server_overloaded","retryable":true}`. CORS and instance headers remain available. There is no client-controlled bypass or public limit-changing endpoint.
- Slots release in `finally`, including exceptions/cancellation. Admitted writes are not forcibly canceled or automatically replayed. Existing database ambiguity handling is retained.
- `/api/health/live` preserves alive/instance and adds process-local admission statistics: limit, active, peak_active, admitted, completed, rejected and queue_limit=0. Both exact health paths bypass business admission. Readiness still performs a real database quorum read. This does not protect against arbitrary health-endpoint flooding.
- `infra/Caddyfile`: Caddy-generated transport/no-upstream 502/503/504 errors become explicit HTTP 503 JSON `code=gateway_unavailable`, with Retry-After and a warning to check write state. An uncertain gateway failure is distinct from rejection before handler execution. Upstream API responses keep their existing contracts.
- The existing ownership-checking hidden launcher now accepts `-MaxInflight` and `-Service all|api1|api2|proxy`. Existing defaults still select the API/proxy group.
- `scripts/verify_dds_overload.py` temporarily sets a low admission limit and sends real property GETs. There is no mock/sleep endpoint. It checks rejection, liveness, unchanged counts, authorization denial and recovery, then separately stops only owned APIs to test gateway failure/restart. Database nodes stay running. The prior admission limit is restored in `finally`; source hashes and actual results are saved.

## Run these PowerShell commands in order

### 1. Validate before restarting anything

```powershell
Set-Location 'C:\Users\hp\.gemini\antigravity\scratch\rihaish'
$ErrorActionPreference='Stop'
$env:PYTHONIOENCODING='utf-8'
$env:SSLKEYLOGFILE=$null
& .\.runtime\bin\caddy-2.11.7\caddy.exe validate --config .\infra\Caddyfile
if ($LASTEXITCODE -ne 0) { throw 'Caddy configuration invalid; do not restart services' }
```

Expected: valid configuration, exit 0. This preflight was not completed by Codex because permission review timed out. Clearing SSLKEYLOGFILE affects only this console/children; it changes no global security setting or backend secret.

### 2. Check the implementation and retained cluster

```powershell
python -m unittest discover -s tests -p test_admission.py -v
if ($LASTEXITCODE -ne 0) { throw 'Admission tests failed' }
python -m unittest discover -s tests -p test_dds.py -v
if ($LASTEXITCODE -ne 0) { throw 'DDS regression failed' }
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_cluster.ps1 -Action status
foreach ($port in @(8001,8002,8000)) {
    Invoke-RestMethod "http://127.0.0.1:$port/api/health/ready" -TimeoutSec 15
}
```

Expected: four admission tests and the existing thirteen DDS tests pass; three voters/one leader; ready=true/database=rqlite. Admission unit tests use blocked fake handlers to check middleware deterministically; the next step uses actual HTTP property routes. Never run destructive `test_e2e_full.py`.

### 3. Run the real overload/recovery demonstration

```powershell
$priorRuns=@(Get-ChildItem docs/evidence -Directory -Filter 'overload-*' | Select-Object -ExpandProperty FullName)
python scripts/verify_dds_overload.py --requests 32 --clients 4 --demo-limit 1
$overloadExit=$LASTEXITCODE
$demo=Get-ChildItem docs/evidence -Directory -Filter 'overload-*' | Where-Object { $_.FullName -notin $priorRuns } | Sort-Object Name -Descending | Select-Object -First 1
if (-not $demo -or -not (Test-Path (Join-Path $demo.FullName 'report.json'))) { throw 'No fresh completed report was created; inspect console output' }
$r=Get-Content (Join-Path $demo.FullName 'report.json') -Raw | ConvertFrom-Json
$r.result
$r.response_counts
$r.assertions | Format-List
Start-Process (Join-Path $demo.FullName 'report.html')
if ($overloadExit -ne 0) { throw 'Live test failed; preserve this report and check recovery below' }
```

This briefly restarts owned API/Caddy processes to install a temporary limit of one business request per API; frontend requests may temporarily fail during those configuration restarts. It restores the prior limit afterward, normally eight. No database node is stopped and no application record is written.

**Expected checks, not preclaimed results:** exit 0/result PASS; both actual HTTP 200 and explicit `server_overloaded` 503 responses; no unexpected statuses/timeouts/resets; rejection p95 <2000 ms; both APIs seen; CORS/Retry-After correct; liveness available during burst; peak_active ≤1 and active drains to zero; five later reads succeed with unchanged pre/post-burst process IDs; database counts unchanged; unauthenticated profile still 401.

Then a separate real process-outage phase stops api1/api2 while Caddy and rqlite remain running. It requires `gateway_unavailable` 503, retained database quorum and recovery after restarting APIs, with Caddy's PID unchanged. The final `finally` restores the previous limit and checks all API/proxy/frontend readiness.

The low limit makes a small laptop reproduce the actual boundary without a huge generator. Four clients are not a million. This demonstrates mechanism at a configured boundary, not survival of a million sockets or exhausted host resources.

### 4. Show and explain the actual evidence

```powershell
$r.example_rejection | ConvertTo-Json -Depth 6
$r.admission_after_burst | ConvertTo-Json -Depth 5
$r.liveness_during_burst | Select-Object port,status,elapsed_ms
$r.pids_before_burst
$r.pids_after_recovery
$r.recovery_reads | Select-Object status,instance,elapsed_ms
$r.both_apis_offline_response | ConvertTo-Json -Depth 6
```

Say: “Excess work gets an explicit 503 instead of an unbounded application queue. After the burst, capacity is released and reads succeed without a recovery restart. Separately, both API processes are stopped to demonstrate an explicit gateway failure and restart recovery.”

The five recovery reads and matching PIDs are recorded **before** the separate outage phase and configuration-restoration restart. Do not confuse these phases. If any check fails, show the failure and retain its report.

### 5. Check auth, preservation and restored service health

The auth verifier creates/cleans only its own UUID fixtures and sends no mail. Preserve the earlier report first:

```powershell
Copy-Item docs/evidence/live-auth-verification.json (Join-Path $demo.FullName 'auth-before.json')
python scripts/verify_dds_auth.py
if ($LASTEXITCODE -ne 0) { throw 'Authentication test failed; retain output and fixture manifest' }
Copy-Item docs/evidence/live-auth-verification.json (Join-Path $demo.FullName 'auth-after.json')
python scripts/verify_dds_data.py
if ($LASTEXITCODE -ne 0) { throw 'Preservation verification failed' }
Copy-Item docs/evidence/current-data-verification.json (Join-Path $demo.FullName 'data-preservation.json')
foreach ($port in @(8001,8002)) {
    Invoke-RestMethod "http://127.0.0.1:$port/api/health/live" -TimeoutSec 15 | ConvertTo-Json -Depth 5
}
foreach ($port in @(8001,8002,8000,3000)) {
    Invoke-RestMethod "http://127.0.0.1:$port/api/health/ready" -TimeoutSec 15
}
```

Expected: new actual auth report passes; original database hashes/frontend unchanged; 224 properties/18 societies, 134 inherited violations disclosed, original user count preserved. Normal admission limit restored. No JWT secret, password hash, role or frontend file changed in this implementation.

## Recovery if interrupted

After validating Caddy, restore only owned APIs/proxy:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_services.ps1 -Action stop
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_services.ps1 -Action start -MaxInflight 8
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_services.ps1 -Action status
Invoke-RestMethod 'http://127.0.0.1:8000/api/health/ready' -TimeoutSec 15
```

If only one worker is stopped: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_services.ps1 -Action start -Service api1 -MaxInflight 8`. Start skips a running worker; changing its limit requires stop/start. Never kill an unrelated port owner or delete stores. Logs: `.runtime/services/api1.stderr.log`, `api2.stderr.log`, `proxy.stderr.log`.

## Actual tests and limits

- Four admission tests passed in the completed unsandboxed run (0.196 s): bounded burst, rejection before POST handler/body, health bypass, release on exception/cancellation, invalid limits. Two restricted-environment async probes stalled and their exact owned processes were stopped; no conclusion about the root cause of historical k6 stalls is drawn.
- `evidence/overload-20261026T054842Z-637944/`: 80 requests/16 clients FAIL. 51 HTTP 200; 19 HTTP 503 (18 from admission); 6 HTTP 502; 4 client errors. Rejection p95 21127.261 ms. Active work bounded, liveness/recovery/counts passed. A retained offline profile measured unused per-request TLS-construction overhead; this did not establish the complete cause.
- `evidence/overload-20261026T055214Z-61541e/`: same larger profile with HTTP-only client FAIL. 1 HTTP 200; 73 HTTP 503 (53 from admission); 6 client errors; p95 70116.633 ms. Transport/proxy stalls remained. Work drained, recovery/counts passed. Both reports are retained unchanged.
- The 32-request/4-client default is a separately disclosed smaller profile with the **same** response/liveness/rejection-latency requirements. Original k6 thresholds/workload are unchanged. New gateway checks and final deployment remain pending manual execution.
- This bounds handlers after HTTP acceptance, not all OS connections, RAM, disk, network or physical-host failure. One-million-user simulation and live million-client capacity remain distinct. No full million-client survival guarantee is claimed.
- Only `server_overloaded`/`rejected-before-handler` establishes that this attempt did not run business logic. Gateway/database failures can have uncertain write outcomes. Retry safe reads with bounded backoff/jitter; check write state/idempotency before retrying uncertain POSTs. No automatic write replay was added.
- Frontend files are unchanged. Demonstrate overload via actual HTTP output/report, without claiming a new browser error banner.

Five-minute presentation: normal readiness → explain temporary one-per-API boundary → run burst → show structured 503, bounded counters, live health and automatic recovery → show separate API outage/gateway recovery → finish with restored normal limits and data checks. Present only what the newly produced report actually verifies.
