# RIHAISH FYP handoff — November 1, 2026 (Asia/Karachi)

The DDS assessment passed per the owner. The active phase is the preserved FYP/product baseline; see root README, `FYP_CURRENT_STATUS.md`, `FYP_SUPERVISOR_DEMO.md` and `RIHAISH_FYP_ROADMAP.md`. Git/main was initialized on November 1, with separate baseline and artificial-population retirement commits. The old statements below about missing Git describe the October recovery only.

The DDS-only massive synthetic-user tool and its dedicated test are removed. Real read-only sampling survives as `verify_dds_smoke.py`; k6, concurrency/auth fixtures, overload handling, database adapter/launch/migration/failure tools and all original data remain. Retired guides and local raw evidence are not erased.

Publication is source-only: local credentials/DBs/rqlite stores/scraped data/backups/raw reports excluded. The actual configured JWT key is unchanged; a fresh clone must explicitly configure its own SECRET_KEY. The current local data is not shipped in public Git. See the current checkpoint and publication receipt for the remote/commit status; never invent a pushed state.

Current November verification passes: 21 isolated tests, frontend build, real SQL/health/API sampling, actual auth/RBAC/OTP/watchlist, seven-file/frontend preservation and 31-table source/cluster hashes. No failover or k6 rerun was needed. Existing forecasting/legal/traffic/construction/traction claims remain unvalidated prototype content. The next scope is an evidence/provenance audit, not a rewrite.

## Historical recovered implementation — October 26, 2026

## Read this first

Latest task is graceful overload/recovery; see `DDS_GRACEFUL_OVERLOAD_GUIDE.md` and checkpoint. Admission code defaults to eight active business requests per API, no queue, explicit pre-handler 503. Liveness adds process-local counters. New Caddy error handling and final smaller HTTP/outage verification are pending manual deployment; the user chose manual commands after permission-review timeouts. Four admission tests pass; larger 16-client HTTP attempts remain FAIL and are retained. No million-client capacity/survival claim. Existing workers last restored to limit eight, database nodes/data preserved. Owned-service launcher now supports `-MaxInflight` and `-Service`.

The retained application is React/Vite/Tailwind plus FastAPI. The recovery task preserved the frontend and existing API fields. DDS mode is opt-in (`RIHAISH_DB_BACKEND=rqlite`). Consult `CODEX_CHECKPOINT.md` for the most recent verification and `DDS_EXECUTION_TRACKER.md` for remaining work.

This workspace has **no `.git` directory**; `git status` and `git log` fail. There is no recoverable commit history here, and no reliable way to attribute uncommitted changes or identify the exact interrupted Antigravity task. No repository reset or initialization was performed. A pre-edit source archive and consistent database backups are in `.runtime/backups/20261025T191913Z/`. The archive excludes credentials, node_modules and datasets. Existing `backend/.env` is retained unchanged.

## What was recovered

- Existing documentation: `implementation_audit.md` and `dds_evaluation_guide.md`. No AGENTS or checkpoint was present in this project. A targeted search of Antigravity brain artifacts recovered the earlier implementation plan and walkthrough from session 37849e26-8916-40d1-81e9-5e15b32293ae; unchanged copies are retained in docs/antigravity/. They explicitly planned SQLite and a simulated failover. They do not identify a more recent interrupted task or supply independent network-cluster evidence. These old documents are retained as historical context, with superseded claims marked.
- Seven SQLite files: auth, three regional primaries, and three regional copies. Existing router toggles an in-process flag; replication uses `shutil.copy2`. Several callers bypass the router. Restoration copies the old primary over the promoted copy, potentially losing writes. Do not use this simulator for failure evidence.
- SQLite files use **DELETE journaling, not WAL**, according to actual PRAGMA reads. No network database cluster, Docker Compose deployment or k6 script existed. Docker was not found and `wsl --status` reports WSL is not installed. The old claim about firmware capabilities was not independently verified.
- Actual primary totals: 224 properties (Karachi 48, Lahore 67, Islamabad 109), 18 societies, **zero users**, two OTP rows, two email-log rows and one newsletter row. All seven files pass integrity checks. Regional primaries contain **134 pre-existing foreign-key violations** (18/37/79); no records were removed or rewritten to hide these.
- JWT/bcrypt, email verification, RBAC, subscriptions, watchlists, property and society APIs exist. The previous test script deletes admins and ultimately all users, subscriptions and other auth records; it was deliberately not run.
- Data includes generated templates, backcast history and asserted government-verification fields. Neither real-world NOC authenticity nor model accuracy is established by the earlier audit. Payment behavior is simulated in existing code. This recovery adds no fabricated production data or benchmark results.

## Current DDS architecture

Three native Windows **rqlite v10.6.5** processes use independent storage and TCP Raft links. HTTP ports are 4001/4003/4005; Raft ports are 4002/4004/4006. They are three voting members of one replicated relational database. Each member stores all data. City tables are namespaced (`karachi_properties`, etc.); auth tables retain their names. This is logical regional partitioning with full replication, **not physical city sharding or multi-host availability**.

The adapter in `backend/app/db/rqlite.py` preserves parameterized SQLite SQL and row dictionaries. It buffers writes until `commit`, then sends one transactional request through Raft. Reads are linearizable. Pending-write reads require explicit commit or an atomic batch. The adapter retries reads across configured nodes but does not automatically replay uncertain writes. API errors report 503 for unavailable storage and 409 for constraint conflicts. There is no silent SQLite fallback.

Migration builds a new local candidate from read-only snapshots, preserving every original field, ID and password hash. It refuses a nonempty cluster. Verification uses the cluster's binary SQLite backup and the same SQLite reader on each side, avoiding JSON timestamp and floating-point formatting differences. All 31 source tables matched after migration. Foreign keys are enforced for new cluster writes; inherited violations remain explicitly recorded.

Two FastAPI processes (8001/8002) share the same backend environment and JWT secret. Caddy v2.11.7 balances requests at 127.0.0.1:8000 with readiness probes. DDS startup verifies the migration marker and skips legacy schema initialization, automatic seeding, scraping and SMTP startup checks. The manual legacy reseed endpoint is disabled in DDS mode. SMTP registration flows are otherwise preserved; live email delivery has not been reverified.

Search uses a SQL UNION over city tables, bound filters, literal substring search, allowlisted sorting, deterministic tie breaks, LIMIT/OFFSET and SQL totals. Existing calls without pagination still return all matches and retain `count`, `results`, `routed_shard`, `shard_status`, and `query_latency_ms`; pagination adds `total`, `page`, `page_size`.

## Correctness and preservation changes

- Unique watchlist pair and single-admin indexes are added to the new DDS candidate; migration fails on conflicting retained data rather than deleting it.
- Watchlist toggle is a single atomic delete/conditional-insert/read batch. OTP consumption is conditional so only one concurrent request can claim it.
- Public signup cannot choose the admin role. The dedicated first-admin flow remains. Destructive public reset endpoints now return 403. Password hashes and JWT settings were not changed.
- Missing government records are no longer represented as verified in property listings. The hard-coded model accuracy metric is returned as null rather than presented as a measurement.
- DDS status comes from actual node state and quorum reads. The old failover button returns 409 in DDS mode: real failure is performed using the owned-node script, not an in-memory flag.

## Operational boundaries

## Performance continuation, October 26

The related-record batching is verified against the real cluster: a ten-item
city page fell from 42 HTTP calls to 3 (42 to 6 SQL statements) with identical
response content. Measured single-route time fell from 356–542 ms to 32–40 ms.
See `DDS_PERFORMANCE_REPORT.md` for raw load-test comparisons and their limits.

The current code additionally reuses a thread-safe HTTPX transport pool,
retains linearizable reads and uncertain-write handling, and adds instance
headers through pure ASGI middleware. API process liveness (`/api/health/live`)
and database readiness (`/api/health/ready`) are separate; Caddy probes process
liveness while real requests still require database quorum. These changes
have not established stable sustained-load performance.

Launchers now ignore stale PID files pointing to unrelated programs and use
`scripts/start_dds_process.py`. This helper passes direct log-file handles to
hidden child processes, so logging does not require a PowerShell parent to
remain alive and pump redirected output. A regression test writes 128 KiB to
each log after the launcher has exited. Logs are appended, not discarded.

One k6 run passed the original thresholds but produced only ten requests; its
repeat failed. Do not describe that sparse result as sustained-load readiness.
All failures, source/workload hashes, generator settings and exit codes remain
in timestamped evidence folders. Diagnostic generator/port/loop experiments
are distinguished from original-profile acceptance runs. A Uvicorn 0.32.0
compatibility environment exists only under ignored `.runtime`; no production
dependency downgrade was adopted. Both tested Uvicorn versions passed a
correctly isolated minimal-ASGI transport test.

Real rqlite-backed buyer/admin authentication, JWTs across both APIs, role
restrictions, OTP concurrency and concurrent watchlist toggles passed in
`evidence/live-auth-verification.json`. Fixtures were ownership-checked and
cleaned, returning the user count to zero. The latest failover rehearsal
checks voter flags, numeric filters, leader replacement, quorum loss and local
catch-up, then removes only its exact probe rows. It does not alter retained
application records.

## Operational boundaries (continued)

The native setup is loopback-only, for evaluation. It does not configure Internet-facing database authentication/TLS. All nodes share this laptop, so it cannot survive host or disk failure. Full production hardening and true physical geographic sharding are outside the evidence so far. Do not expose database ports on a public interface.

Read the evidence JSON files rather than relying on old success claims. Source records and credentials are private and excluded from evidence output. Keep `.runtime` out of version control.

References: [rqlite installation](https://rqlite.io/docs/install-rqlite/), [cluster behavior](https://rqlite.io/docs/clustering/general-guidelines/), [read consistency](https://rqlite.io/docs/api/read-consistency/), [backup and restore](https://rqlite.io/docs/guides/backup/).

