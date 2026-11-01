# Retirement of the DDS-only artificial population demo

Recorded before removal on November 1, 2026. The owner reports the DDS assessment passed and has requested an FYP product baseline. This is a focused classification, not a repeat architecture audit.

## Exact target and provenance

| Category | File/mechanism | Finding and action |
|---|---|---|
| A: retired artificial population demonstration | `scripts/demo_million_users.py` | Creates `simulated_users` with synthetic emails and `active_in_model`, generates up to one million isolated rows, runs assumed virtual-time queues, renders an HTML demo. Remove the generator/models/report builder from active tooling. It already labelled results as simulation; there is no evidence these were genuine customer records. |
| A: generator-specific tests | `tests/test_million_simulation.py` | Imports the retired module and tests only its fixture generation/queue model. Remove with that mechanism. |
| B: legitimate functionality mixed into the demo | `sample_live` and `health_snapshot` in the retired script | Preserve as the read-only `scripts/verify_dds_smoke.py` tool, with actual API/SQL/health checks and no population generation. |
| A: historical instructions | `docs/DDS_MILLION_SIMULATION_GUIDE.md` | Retain the original text with a prominent retired notice; old commands are no longer supported. |
| B: real load measurement | `tests/dds_load.js`, `scripts/run_k6.ps1`, `scripts/profile_property_reads.py`, `docs/DDS_MILLION_USER_TEST.md` | Preserve unchanged workload/thresholds and measured qualifications. |
| C: legitimate concurrency fixtures | `scripts/verify_dds_live.py`, `scripts/verify_dds_auth.py`, `tests/test_dds.py`, `tests/test_auth_preservation.py`, `tests/test_admission.py` | Preserve uniqueness, rollback, auth/RBAC, OTP and overload checks. |
| D: real user management | `backend/app/api/routes_auth.py`, security/watchlist/subscription modules, role guards | Preserve; the massive generator did not create production auth accounts or JWTs. |
| E: unrelated seed/data/prototype features | Original seven SQLite files, rqlite stores, property seeders, frontend sample properties and prediction modules | Preserve. These are outside the requested removal. Their provenance/validation limits are documented separately. |

Pre-removal SHA-256 values:

- `scripts/demo_million_users.py`: `2135f6b86797cd0e1258677c744fe55ad594c725ba9cbb47279b38ffda2f8abf`
- `tests/test_million_simulation.py`: `64209243c5b1c295fd46bc30bbfb545146db71f33485997eb27030e1d8a59dd9`

The source snapshot and consistent seven-database backups are privately retained under `.runtime/backups/fyp-baseline-20261101T114444Z-f3f5da/`. Git baseline `3bcb382865a20745becfbf850633515df9835e9b` also preserves the two source files before retirement, without private data/secrets.

Focused searches found generator references only in its own tool/test and historical documentation. There was no matching startup hook, production API population endpoint or frontend customer-count wiring. Price literals such as 1,000,000 PKR are unrelated and remain intact.

## Data and history preservation

No database rows, stores, volumes, datasets or historical raw reports are deleted. The generated fixture file remains ignored under `.runtime/million-user-simulation/`; it is not application customer data. Historical reports remain locally under ignored `docs/evidence/`, including failed load/overload runs. They are excluded from public Git because some raw responses include property payloads and machine-local details. Public summaries describe the qualifications without publishing those payloads.

The real rqlite adapter, three-node launch/consensus configuration, Caddy, migration/verification scripts, SQL batching, authentication, uniqueness and legitimate load/concurrency tooling remain. Retiring this demo is not a claim that sustained-load acceptance passed.
