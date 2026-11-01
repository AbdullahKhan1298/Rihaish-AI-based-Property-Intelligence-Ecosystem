# Codex checkpoint — November 1, 2026

Current milestone: FYP transition and safe GitHub source baseline. The owner reports the DDS evaluation passed. No architecture redesign, database reset or AI/ML rewrite was performed.

## Current completed work

- Private snapshot `.runtime/backups/fyp-baseline-20261101T114444Z-f3f5da/`: 265 source files plus consistent SQLite-backup-API copies of all seven original databases. Snapshot includes local configuration privately; never publish it.
- Initialized Git/main after confirming no metadata/remotes existed. Baseline commit `3bcb382865a20745becfbf850633515df9835e9b`; separate retirement commit `61743d1ba092b4a468ec3de3f38a08261a8235e1`.
- Removed only `scripts/demo_million_users.py` and its exclusive test. Preserved bounded real HTTP/SQL/health sampling as `scripts/verify_dds_smoke.py`. Historical guides marked retired; no fixture DB/raw evidence deleted. See `FYP_MASSIVE_USER_CLEANUP.md` for categories, hashes and scope.
- Strong Git/data/secret exclusions; safe `.env.example`; shared hard-coded signing fallback removed while the actual ignored `.env` and key remained byte-for-byte unchanged. Publication scanner checks staged content/history, known local secret values, signatures, private paths and large blobs. Windows installed dependency closure pinned separately.
- 21 isolated tests PASS, frontend build PASS, real read-only SQL/API/frontend-proxy smoke PASS, actual rqlite JWT/RBAC/OTP/watchlist PASS, all seven original hashes/frontend unchanged, all 31 original table counts/content hashes match a consistent cluster backup. Caddy config valid. No disruptive failover/load test repeated.
- Source-only reproducibility check: 21 tests PASS in 3.671 s without private .env/DBs, using the installed dependencies and an ephemeral key. Replaced the batching test's private-data input with tiny in-memory fixtures; fixed its separate launch test's Windows log cleanup race by waiting for the exact owned child to exit. Initial failed source-only report retained locally. A fresh pip-install validation is not claimed.
- Browser Home/search/detail and unauthenticated admin→login navigation verified. Legacy unsupported UI promotional labels remain unchanged and documented as prototype copy, not product evidence.
- Root README, `FYP_CURRENT_STATUS.md`, `FYP_SUPERVISOR_DEMO.md`, `RIHAISH_FYP_ROADMAP.md` and public verification summary prepared. Raw November verification under ignored `docs/evidence/fyp-transition-20261101/`; smoke under `docs/evidence/fyp-smoke-20261101T115811Z-b95468/`.
- Existing GCM GitHub auth works as AbdullahKhan1298; no RIHAISH remote previously existed. Created the explicitly requested public repository: `https://github.com/AbdullahKhan1298/Rihaish-AI-based-Property-Intelligence-Ecosystem`. Final documentation commit, staged/history scan and push confirmation are the remaining publication actions at this checkpoint.

## Exact next action

Complete the source-only publication gate, commit the FYP documentation/security/tooling changes, push main without force, and verify the remote HEAD/tree. Then record the publication receipt. The next development milestone after publication is the scoped product implementation/provenance audit in `RIHAISH_FYP_ROADMAP.md`; do not start a forecast/database/frontend rewrite during it.

Runtime: retained three voters and two APIs/Caddy/Vite started normally from existing stores for checks. No import, original-record cleanup or node failure. Auth fixtures were exact-owned and cleaned (users 0→0). Retained data: 224 properties/18 societies/134 inherited missing society references. Sustained-load qualification remains open; synthetic population work is retired.

## Historical DDS checkpoint — retained below

The following October notes are history, not the current work order. The November FYP task supersedes the earlier manual-only verification restriction for the normal non-disruptive checks performed above.

# Codex checkpoint — October 26, 2026

Current work: graceful overload rejection/recovery. Implementation is present; final gateway deployment and smaller HTTP rehearsal are PENDING MANUAL EXECUTION at the user's request after automatic permission-review timeouts. Follow `DDS_GRACEFUL_OVERLOAD_GUIDE.md`. Do not report the whole feature as passed. Million-client capacity remains unverified.

## Last verified

- Read existing audit/evaluation docs and relevant database, auth, Docker and API code. No Git metadata or earlier checkpoint exists in this directory.
- Backups: `.runtime/backups/20261025T191913Z/`; all seven SQLite files pass integrity checks, all original data retained.
- Native rqlite v10.6.5 cluster running on ports 4001/4003/4005; three voters joined. All 31 migrated source tables verified by content hashes.
- Both DDS API processes and Caddy started. Read-only smoke checks on 8000/8001/8002 return rqlite readiness and 224 listings.
- Seven targeted isolated tests pass for SQL ordering/pagination, filters, literal search, SQL namespace handling and buffered-write safety.

## Precise next action

The user chose manual commands: validate Caddy, run four admission tests and existing DDS regressions, then `python scripts/verify_dds_overload.py --requests 32 --clients 4 --demo-limit 1`. Inspect the new report, execute auth/preservation checks and verify normal limits/readiness as documented in `DDS_GRACEFUL_OVERLOAD_GUIDE.md`. New gateway handling is not active until Caddy restarts. Current running API processes were last restored to limit eight; database nodes were not stopped. Retain larger failed reports. Do not resume unapproved automatic service restarts after the user chose manual execution.

## Graceful overload implementation — October 26, 10:48–10:54 Asia/Karachi; manual follow-up pending

- Added `app/core/admission.py` and wiring in main: eight in-flight business requests per API by default, no queue; excess requests get explicit pre-handler 503/Retry-After/code. Health paths exempt; slots release on exceptions/cancellation. Liveness adds process-local metrics; existing auth/response fields, secrets and frontend preserved.
- Four deterministic async tests passed outside restricted execution (0.196 s). Two restricted async probes stalled; stopped only their precisely identified owned processes. Existing thirteen-test rerun could not start because automatic approval review timed out; not a code-test failure and not a passing check.
- First real 80-request/16-client test FAIL: `evidence/overload-20261026T054842Z-637944/`; 51 HTTP 200, 19 HTTP 503 (18 admission responses), 6 HTTP 502, 4 client errors; rejection p95 21127.261 ms. Guard bounded work; liveness, five-read recovery, record counts and auth denial passed. Restored normal limit eight.
- The client unnecessarily constructed TLS contexts for HTTP-only GETs, including an inherited keylog hook. Offline construction measurements retained in the first report folder. Changed the bounded verifier to use explicit thread-local HTTP-only openers; no global security settings changed and this is not a claimed complete root-cause fix.
- Same larger test rerun FAIL: `evidence/overload-20261026T055214Z-61541e/`; 1 HTTP 200, 73 HTTP 503 (53 admission responses), 6 client errors; p95 70116.633 ms. Work bounded/drained, recovery and counts still passed. Native gateway/transport stalls remain; normal limit restored, no database writes/nodes stopped.
- New Caddy error handler converts Caddy-generated 502/503/504 to explicit gateway_unavailable 503, preserving the distinction from pre-handler shedding and uncertain write outcomes. This final config has NOT been validated/deployed. Validation twice timed out in automatic permission review.
- Existing owned-service script now supports MaxInflight and Service selectors. Updated verifier default is a disclosed smaller 32-request/4-client real profile, keeping rejection p95 <2000 ms and all status/liveness checks; adds an actual both-API-process outage/gateway recovery phase. No mock endpoint and no k6 threshold changes. Final variant is NOT yet run.
- User selected “Provide commands for me to run manually” in response to the blocked verification. Guide and code are complete for that manual run; no further automatic service restarts authorized in this continuation. Recovery commands restore only API/Caddy, not database stores. Await actual new PASS/FAIL report before changing verification claims.

## Authorized simulation implemented — October 26, 10:26 Asia/Karachi

- `scripts/demo_million_users.py` is standard-library-only; creates fresh ignored synthetic data, FIFO virtual-time queue models, a separate bounded read-only API sample, and JSON/HTML evidence. Application source, authentication and frontend are unchanged.
- Actual command `python scripts/demo_million_users.py --users 1000000 --live-sample` exited 0. Run `20261026T052601Z-f11db3`: 1,000,000 rows, unique emails and model-active flags verified; integrity ok; 123,977,728 bytes; build/verification 14.41 seconds. Indexed fixture count plus two pages 61.129 ms. This is isolated SQLite fixture volume, not production rqlite/auth performance.
- Two one-million-event models use explicit hypothetical 100/1000 service slots and 50 ms service time. Modeled p95 418.006/0.050 seconds; these are computed assumptions, not measured RIHAISH latency. Every model user sends one request during a 60-second virtual active window.
- Real sample: 12/12 public property GET checks passed using at most two client workers; both APIs appeared, 1.342 s total. Final cluster HEALTHY, three voters/quorum, all app ports ready. Actual rqlite applied index 263 everywhere: fixture generation did not add production records.
- Three targeted tests PASS for queue math, validation, fixture uniqueness/pagination and no-overwrite. Final preservation verification is recorded with the simulation evidence.
- Evidence and presentation: `docs/evidence/million-simulation-20261026T052601Z-f11db3/report.json` and `report.html`; retained synthetic DB under `.runtime/million-user-simulation/20261026T052601Z-f11db3/`. No passwords, JWTs or production accounts in synthetic records.

## Million-concurrent-user request — October 26, 10:13–10:15 Asia/Karachi

- User explicitly clarified **1,000,000 active users simultaneously**. It is not a request for accounts or total requests.
- Ran the original bounded prerequisite: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run_k6.ps1 -Label million-concurrent-prerequisite`.
- Evidence `docs/evidence/k6-20261026T101334945/`: k6 exit 99; wrapper exit 1; no iterations completed, no `http_reqs` metric, zero responses from either API. Latency/error/check zero-filled fields have no samples and are not successful measurements. No threshold/workload/app change.
- Host snapshot: 8 logical processors, 7.88 GiB total RAM, 1.47 GiB available, RAM load 81%. Did not launch one million VUs on this host. No fake users inserted.
- Post-test health at 10:15:19 passed: three reachable voters, real quorum read, leader node 2, applied index 263 everywhere; 8001/8002/8000/3000 all ready on rqlite. Evidence in the run's `post-test-health.json`.
- `DDS_MILLION_USER_TEST.md` contains the actual failed prerequisite, exact evaluator evidence commands, resource limits, honest narration and prerequisites for a real distributed million-VU experiment. Current status: million concurrency NOT VERIFIED; functional DDS still verified; sustained-load acceptance OPEN.

## Final live rehearsal — October 26, 08:08–08:19 Asia/Karachi

- Reused running database/API/Caddy processes; only Vite was initially stopped and launched on loopback 3000 using the existing hidden-process helper. No application/frontend source changes.
- Added `--single-node-only` and evidence output selection to the existing failure verifier. Default full-quorum-loss behavior remains available. Report paths are restricted to `docs/evidence`. This avoids deliberately stopping a second voter in the presentation.
- Executed `python scripts/verify_dds_live.py --single-node-only --output docs/evidence/final-demo/single-node-rehearsal.json`: exit 0. Run `e8317b95f8374eefad5e87e9a805ed96`; node 3 stopped, node 2 elected, quorum probe recovered 2.344 s after stop; reads/writes passed with two voters; every local copy caught up after restoration. Twelve insert attempts: one committed, eleven database uniqueness rejections. Exact current-run probes cleaned.
- Actual browser checks passed: Home, Explore Properties, Silicon + Under 50 Lacs + ascending price (three results), and `/property/prop-isb-001`. Saved home/search/detail screenshots under `docs/evidence/final-demo/`; no inquiry submitted.
- Actual SQL API query `q=plot&min_price=1000000&max_price=10000000&sort=price_asc&page_size=5` returned 49 matches. Two pages gave ten distinct IDs, numeric range and cross-page order passed.
- Executed `python scripts/verify_dds_data.py`: exit 0; seven original files unchanged, frontend unchanged, 224 properties/18 societies, 134 inherited missing parents, zero users.
- Final 08:19:27 checks: three reachable voters, leader 2, 8001/8002/8000/3000 ready on rqlite. Evidence: `final-demo/final-health.json`, `data-preservation.json`, `rehearsal-summary.json`.
- Reused controlled 42→3 profile, previous real-auth report, and previous quorum-loss 503 report. No repeated authentication fixtures, two-node outage, A/B profiling or k6. No threshold or database-architecture changes. Sustained acceptance remains open.
- Deliverable: `DDS_FINAL_DEMO_COMMANDS.md` includes exact ordered PowerShell commands, expected checks, recovery, 7–10 minute narration, factual limitations and preserved evidence links.
- Final documentation checks: all 13 PowerShell blocks parsed, verifier `--help` passed, both Caddy upstreams observed, A/B hashes confirmed equal. Sequential cluster-status output later straddled a leadership transition. A fresh `cluster_status()` plus assertions passed: HEALTHY, three voters, consistent leader node 1, applied index 258 on all nodes (`evidence/final-demo/end-cluster-health.json`). Guide requires consistent leadership/readiness before proceeding; no additional node stops or performance investigation.

## Verified during the continuation

- Restarted the existing three voters and two APIs/Caddy. Fixed stale PID handling so recycled PIDs belonging to unrelated processes are ignored.
- The batched reader is present and original endpoint fields remain. Controlled real-SQL A/B: 42 database HTTP requests before batching versus 3 after, 42 versus 6 SQL statements, identical response hashes. Karachi route 542→39 ms, Lahore 396→40 ms, Islamabad 356→32 ms. See `evidence/property-query-profile.json`.
- Added a shared HTTPX pool using an existing dependency. Linearizable reads, timeouts and uncertain-write handling are unchanged.
- Thirteen final regression tests passed: `evidence/regression-tests-final.txt`.
- Actual rqlite-backed HTTP authentication passed: buyer/admin login, JWTs on both APIs, RBAC, 16 concurrent watchlist toggles, single-use OTP. UUID-labelled fixtures were cleaned and user count returned from 0 to 0. See `evidence/live-auth-verification.json`.

## Performance remains unfinished

The workload stays at 10 VUs for 30 seconds, 0.1-second think time, rotating cities, SQL price sorting, 10-item pages. Thresholds remain failure rate <1%, p95 <2000 ms, checks >99%, traffic to both APIs. `scripts/run_k6.ps1` saves timestamped raw summaries, errors, workload copies, source hashes, generator settings and exit codes.

Initial resumed batched run: 29 requests, 0.480 requests/sec, p95 25966.55 ms, 58.62% failed, exit 99. Do not declare performance complete or attribute all stalls to SQL. A Python diagnostic completed 100 concurrent requests with zero errors, p95 295 ms. Direct-API k6 had p95 277 ms but 2.45% failed. A no-database FastAPI route also stalled; a controlled bare HTTP echo test passed latency/error thresholds. The background echo diagnostic lost its server and is invalid for performance conclusions. Selector-loop and generator-thread experiments did not solve the issue; the selector-loop change was reverted.

## Last completed implementation and final verification

- Service launcher helper `scripts/start_dds_process.py` opens direct append-only log handles and creates hidden children. It avoids dependence on PowerShell output-pump lifetime. A regression test confirms 128 KiB can be written to each log after the launcher exits.
- Shared HTTPX pooling and pure ASGI instance-header middleware are present. Caddy probes API-process liveness; database readiness remains a linearizable quorum read. Neither probes nor benchmark thresholds claim a healthy database without evidence.
- Last original-profile run with direct log handles: `evidence/k6-20261026T071340359/`, exit 0, ten requests, zero errors, p95 455.48 ms, 0.124 reported requests/sec. **Only ten requests means this is insufficient sustained-load evidence.** Its attached-console repeat (`evidence/k6-direct-log-attached-summary.json`) failed.
- Final live authentication passed at 07:20 Asia/Karachi, including real rqlite users, both APIs, RBAC, watchlist and OTP concurrency. Fixtures were cleaned and user count returned to zero.
- Final existing failure script passed: leader 1 stopped, leader 2 elected, read/write with quorum, 503 on quorum loss, process liveness still 200, all nodes caught up, only current probe rows cleaned. Probe recovery was 2.141 s after the stop command. All three voters were healthy afterwards.
- `verify_dds_data.py` confirmed seven original database files unchanged, no frontend changes, 224 properties/18 societies, 134 unchanged inherited missing society references, zero current users. A read-only cluster-backup check verified all 31 original table hashes/counts still match; no migration was rerun.
- `DDS_RUNBOOK.md`, current `dds_evaluation_guide.md`, `DDS_EVALUATOR_PRESENTATION.md` and `DDS_PERFORMANCE_REPORT.md` are updated. The historical guide is preserved under `docs/antigravity/`.

No benchmark or diagnostic is intentionally left running. The three DDS nodes,
two APIs and Caddy remain available on loopback. No global Python packages were
changed; the compatibility environment is private under `.runtime` and unused
by the services. Automatic review rejected a proposed listing status-label
change; that field remains unchanged and the runbook points to real health
checks instead.

## Test commands executed

```powershell
python scripts/profile_property_reads.py
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run_k6.ps1 -Label direct-log-handles
python -m unittest discover -s tests -v
python scripts/verify_dds_auth.py
python scripts/verify_dds_live.py
python scripts/verify_dds_data.py
python scripts/summarize_dds_performance.py
```

Current blocker: intermittent HTTP/loopback stalls and sparse/delayed generator
iterations remain unisolated. See measured comparisons and diagnostic caveats;
no stable sustained-load claim is authorized by the existing evidence.

Network access to local services requires execution outside the tool sandbox on this machine; sandbox failures are not evidence that the cluster is down. Background processes must start hidden and persist outside the sandbox.

Never run `test_e2e_full.py`: it deletes retained auth data. Never run legacy failover restore or the seeder against original files. Do not read or print `.env` secrets.
