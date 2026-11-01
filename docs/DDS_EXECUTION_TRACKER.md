# DDS execution tracker

> FYP transition, November 1, 2026: DDS assessment passed per owner. Genuine DDS features are preserved; the isolated massive synthetic-user demonstration is retired. Current verification passes (21 isolated tests, frontend build, real SQL/auth checks, three voters, seven-file/frontend hashes and 31-table content comparison). This does not upgrade sustained-load acceptance. The October execution notes below remain historical; use `FYP_CURRENT_STATUS.md` and the current checkpoint for active work.

Evaluation deadline: **October 27, 2026**. Requirements below follow the user's priorities; no separate evaluator rubric was found.

Current task: graceful overload handling requested by evaluator. Code implemented: bounded ASGI admission (default eight per API), explicit pre-handler 503/Retry-After, process metrics, health bypass, capacity release on error/cancellation; new explicit Caddy gateway-failure response and owned-service selectors. **PARTIALLY VERIFIED**: four admission tests pass; both 80-request/16-client real runs fail due to remaining transport/proxy errors even though bounds, data counts and recovery passed. Evidence in `overload-20261026T054842Z-637944/` and `overload-20261026T055214Z-61541e/` under docs/evidence. The final smaller 32-request/4-client profile and API-outage phase, Caddy validation/deployment, existing DDS regression rerun and auth rerun are pending manual execution. Automatic approval review timed out; user explicitly chose manual commands. Follow `DDS_GRACEFUL_OVERLOAD_GUIDE.md`; do not declare full overload or million-client survival passed. Last running workers restored to normal limit eight; no database node/data mutation in these load tests.

Latest authorized alternative (October 26, 10:26): synthetic profiles + labeled virtual-time simulation implemented, executed and documented in `DDS_MILLION_SIMULATION_GUIDE.md`. Actual isolated fixture: 1,000,000 unique rows, integrity ok, 118.2 MiB; two one-million-event queue models under explicit hypothetical inputs; separate live sample 12/12 successful sorted-property reads at at most two client workers, both APIs seen, three-voter health retained. Evidence: `evidence/million-simulation-20261026T052601Z-f11db3/report.json` and standalone `report.html`. Three focused tests pass. This is not a million-VU live acceptance result, does not populate production users, and does not supersede the failed k6 evidence. Exact next step: show the prepared report and read-only fixture SQL using the new guide; establish whether simulation meets the evaluator's rubric.

Latest evaluator request (October 26): **one million users active simultaneously**, explicitly clarified by the user. Status **NOT VERIFIED**. The unchanged ten-VU prerequisite rerun at 10:13 failed (k6 exit 99, no completed iterations or request samples, both API counters zero). See `DDS_MILLION_USER_TEST.md` and `evidence/k6-20261026T101334945/`. Post-test cluster and all application/frontend readiness checks passed at 10:15. No million-VU run, new user seeding or capacity claim. This newer load-test request supersedes the earlier instruction to defer performance investigation during the final rehearsal. Next action: diagnose the no-completion prerequisite before increasing concurrency; real million-user testing additionally requires separate adequately sized generators and reachable staging.

| Priority | Requirement | Current implementation and evidence | Remaining verification/work |
|---|---|---|---|
| 1 | Genuine multi-node relational database | VERIFIED: three live voters and actual leader in `evidence/live-dds-verification.json` | Same laptop; logical city tables are not physical geographic shards |
| 2 | Preserve data/auth | VERIFIED: original seven file hashes unchanged, frontend unchanged, 224 properties / 18 societies; `evidence/current-data-verification.json` | Zero source users; 134 inherited missing society references remain |
| 3 | SQL search/filter/sort/page | VERIFIED through HTTP: actual search, numeric bounds, global sorting, distinct pages; existing response fields retained | Offset pages are not a cross-request snapshot during edits |
| 4 | Multiple APIs and load balancing | VERIFIED: real responses from api1/api2 via Caddy in the live rehearsal; instance header retained | Sustained-load stalls still affect availability; see performance report |
| 5 | Uniqueness/concurrency | VERIFIED: 12 simultaneous inserts, one commit / eleven constraint rejections; rollback; real-API watchlist and OTP concurrency | Broader authorization review is outside this focused continuation |
| 6 | Failure/recovery | VERIFIED: stop leader, replacement election, read/write with 2/3, HTTP 503 with 1/3, all local copies catch up | Final rehearsal probe recovery was 2.141 s after the stop command, not total outage duration |
| 7 | Actual k6 | MEASURED, NOT PASSING: original workload/thresholds retained; timestamped raw summaries and code/config snapshots | Critical blocker: intermittent native Windows HTTP/loopback stalls; no passing full load test yet |
| 8 | Reproducible walkthrough | Runbook, short `DDS_EVALUATOR_PRESENTATION.md`, owned-node scripts, fixture auth and performance runner | Presentation must disclose unresolved k6 failures and inherited integrity issues |

## Confirmed recovery evidence

`evidence/recovery-inventory.json` records source hashes, row counts, integrity and journal modes. The legacy audit incorrectly equates physical SQLite files/manual copies with resilient distributed nodes. Its earlier test outcomes are historical claims, not newly reproduced facts.

Source preservation includes the three regional replicas even though only authoritative primary snapshots are migrated. All records in the sources remain untouched. A migration into a populated target is prohibited; it is not a reset mechanism.

## Known limits and open items

1. Confirm whether the evaluator requires multiple physical hosts, geographic physical shards, or a prescribed engine. The demonstrated architecture provides Raft replication and process-failure tolerance on one laptop.
2. Investigate the 134 inherited foreign-key violations without deleting data or inventing societies. This is not silently marked complete.
3. Original auth database has no users. Use isolated auth fixtures for regression tests; user registration through the preserved UI is a separate real operation.
4. Existing synthetic/derived history, NOC assertions, simulated subscriptions and model accuracy are not validated by DDS evidence. Do not present them as verified facts.
5. SQL search count and page are separate reads; deterministic sorting prevents tie instability for unchanged data, but offset pages are not a snapshot across concurrent edits.
6. API write timeout is explicitly ambiguous and is not replayed. Business-level idempotency keys and retry workflows remain future work.
7. The frontend retains its original layout and simulator button. In DDS mode that button is safely rejected; use the real node-stop walkthrough.
8. The listing response's legacy `shard_status` label is not a live node-health measurement. Use actual `/status` output or the admin cluster-health endpoint. An attempted status-label change was rejected by automatic review; the field was left unchanged.

## Continuation evidence, October 26

- Controlled A/B (`evidence/property-query-profile.json`): 42→3 database HTTP calls and 42→6 SQL statements for ten properties, identical response hashes. Single-route latency 356–542→32–40 ms. These are controlled request measurements, not k6 throughput.
- Actual rqlite authentication (`evidence/live-auth-verification.json`): buyer/admin login, same JWT accepted on both APIs, forbidden and unauthenticated access denied, 16 watchlist toggles serialize correctly, exactly one OTP claimant. Only UUID-labelled fixtures were cleaned; user count returned to zero.
- Data impact (`evidence/current-data-verification.json`): 18 Karachi, 37 Lahore and 79 Islamabad properties have absent society parents. Search retains these through denormalized names. Joins to societies omit them; new FK-constrained writes require valid parents. No source repairs were fabricated.
- Thirteen final focused tests passed in `evidence/regression-tests-final.txt`, including log output beyond pipe capacity after the launcher exits.
- `DDS_PERFORMANCE_REPORT.md` and `evidence/performance-comparison.json` summarize retained failures with median/p90/p95, throughput, errors and original thresholds. Historical runs lack full configuration snapshots and are not controlled causal comparisons.
- Current transport changes: related-record batching; shared HTTPX pool using the existing dependency; pure ASGI instance-header middleware. API process liveness and database quorum readiness are separate probes. These changes do not weaken SQL consistency or acceptance thresholds.
- Launch reliability: hidden services now inherit direct log-file handles through `scripts/start_dds_process.py`, rather than relying on a PowerShell parent to pump output after exiting. This addresses a launcher hazard; it is not claimed to have solved all transport stalls.
- A direct-log-handle run returned exit 0, zero errors and p95 455.48 ms, but made only ten requests. Its attached-console repeat failed. This is retained as a threshold pass with insufficient sustained-load evidence, not a completed load-testing requirement.
- Both correctly isolated minimal-ASGI probes passed under Uvicorn 0.52.4 and a workspace-only 0.32.0 compatibility install. No production downgrade was adopted. An earlier probe had a port-bind conflict and is excluded from conclusions.
- Final rqlite HTTP auth and node-failure rehearsals passed after the launcher changes. Data verification again found all seven original files unchanged, no frontend changes, and all 31 original migrated table counts/content hashes matching (`evidence/post-rehearsal-record-verification.json`).

## Historical performance investigation next action (deferred for final demonstration)

Isolate the remaining difference between passing bare ASGI and the real FastAPI application using matched minimal async/sync FastAPI handlers and the current direct-log launcher. Use unused ports and verify the exact responder/process before measuring. Capture API/generator socket waits and timer/iteration behavior together: the sparse threshold pass does not demonstrate sustained traffic. Do not repeat migration/audits or keep trying unmeasured configurations. Re-run the original full k6 workload after a demonstrated fix; require exit 0, every original threshold passing, and actual repeated iterations.

## Final evaluator rehearsal — October 26, 08:08–08:19 Asia/Karachi

Current priority is reproducible demonstration, not further performance investigation. Execute `DDS_FINAL_DEMO_COMMANDS.md` tomorrow; all twelve requested functional steps passed, with the optimization measurement explicitly reused rather than rerun.

Final command validation also passed: 13 PowerShell blocks parse, verifier help exposes the documented flags, both proxy upstreams observed, profile response hashes agree. A later sequential status snapshot straddled a leadership transition; a fresh asserted quorum check was HEALTHY with leader node 1 and applied index 258 on every voter. See `evidence/final-demo/end-cluster-health.json`. The guide requires a consistent leader before beginning failure; leadership is not claimed to have stayed unchanged.

| Requirement | Rehearsal result | Evidence |
|---|---|---|
| Real three-voter Raft cluster, identity and leader | PASS, initial and final health checked | `evidence/final-demo/preflight.json`, `final-health.json` |
| Both API instances and Caddy | PASS, both upstreams observed, readiness on rqlite | `single-node-rehearsal.json`, `final-health.json` |
| SQL search, numeric filtering, sorting, pagination | PASS, 49 matches, ten unique IDs across sorted pages | `final-health.json` |
| Preserved frontend | PASS, rendered Home/search/detail and real proxy readiness | `frontend-home.png`, `frontend-search.png`, `frontend-property.png` |
| Isolated persistence and actual leader failure | PASS, node 3 → node 2, read/write with two voters | `single-node-rehearsal.json` |
| Recovery and catch-up | PASS, all three local copies contain the offline-leader write | `single-node-rehearsal.json` |
| Concurrency | PASS, twelve attempts, one commit, eleven uniqueness rejections | `single-node-rehearsal.json` |
| 42→3 HTTP call optimization | PASS, reused controlled real-SQL evidence; identical hashes | `evidence/property-query-profile.json` |
| Original data/frontend preservation | PASS, seven original files unchanged, frontend unchanged | `evidence/final-demo/data-preservation.json` |
| Authentication and majority-outage behavior | Prior verified PASS reused; not repeated | `evidence/live-auth-verification.json`, `live-dds-verification.json` |
| Sustained k6 | OPEN; not run/investigated in this rehearsal | `DDS_PERFORMANCE_REPORT.md` |

Paths without `evidence/` in the table are under `docs/evidence/final-demo/`, except prior `live-dds-verification.json` under `docs/evidence/`. Scoped existing verifier command: `python scripts/verify_dds_live.py --single-node-only --output docs/evidence/final-demo/single-node-rehearsal.json` (exit 0). Read-only `python scripts/verify_dds_data.py` also exited 0. Only the discovered leader was stopped and restored. New flags preserve the default full test and protect the presentation from a needless majority outage. No application code, architecture, source records, frontend files, or k6 thresholds changed. Remaining limitations: one laptop, 134 inherited missing society parents, zero source users, unresolved sustained-load acceptance. Exact next step: follow the final guide, make a separate timestamped evaluator report, then verify complete cluster/application readiness.

