# FYP current status — November 1, 2026

The owner reports the DDS assessment passed. This document describes repository implementation and observed checks, not an independent grade record or a production-readiness certificate.

## Status definitions

- **Implemented and verified:** exercised by current code/tests or an explicitly identified earlier functional rehearsal.
- **Implemented, not fully validated:** code exists but its real-world correctness or complete workflow has not been established.
- **Partial:** some parts exist, with material missing integration or acceptance work.
- **Planned:** future milestone; not delivered by this cleanup.

## Actual scope

| Capability | State | Evidence and practical limit |
|---|---|---|
| Three-voter relational replication | Implemented and verified | Native rqlite/Raft, dynamic leader, separate stores, real quorum reads. All three healthy on November 1. One laptop; full replication with logical city namespaces. |
| Leader failure/recovery | Earlier verified rehearsal retained | Actual October process stop/election/read-write/catch-up evidence preserved. Not disrupted again for this source baseline. |
| Two APIs and Caddy | Implemented and verified | Both api1/api2 observed through Caddy; readiness remains on rqlite. Caddy config validates. |
| SQL search, price bounds, sorting, pagination | Implemented and verified | Twelve actual city reads, ten distinct IDs across two filtered/sorted pages, preserved response shape. |
| Query batching | Earlier controlled measurement retained | 42→3 database HTTP calls for a ten-item city query with identical content hashes; not a sustained-load claim. |
| Authentication and access control | Implemented and verified for covered cases | Actual buyer/admin login, cross-instance JWT, role denials, OTP concurrency and 16 watchlist toggles pass. Isolated UUID fixtures cleaned; user count returned 0→0. Complete investor/society workflows need broader coverage. |
| Uniqueness and atomicity | Implemented and verified | Existing DB constraints, isolated concurrency/rollback tests; real auth/watchlist/OTP checks pass. Historical 12-insert race retained. |
| Frontend design/navigation | Implemented and verified for sampled routes | Build succeeds; Home→Search→Property detail renders; unauthenticated admin dashboard redirects to login. Original frontend source hashes unchanged. |
| Data preservation and migration | Implemented and verified | All seven original file hashes unchanged; 31 original table counts/content hashes match current cluster backup. No import/reset performed. |
| Forecasts and investment scores | Implemented, not fully validated | Growth assumptions, backcasts, heuristic bands/recommendations and calibration code exist. No established out-of-sample forecast accuracy; no measured 94% claim. |
| Facilities and proximity | Implemented, not fully validated | Haversine distance and drive-time estimate API exist. Authoritative facility coverage, routing/traffic times and freshness need validation. |
| Government verification | Partial | Record fields and admin/UI workflows exist. Independent government evidence integration, provenance and authenticity are not established by a badge. |
| Construction intelligence | Partial | Stored reports/progress views exist. Genuine dated evidence, image authenticity and live independent audit are not established. |
| Subscriptions/checkout | Partial | Prototype plans and workflow code/UI retained. A production payment processor, settlement and reliable subscription enforcement are not verified. |
| Ingestion/provenance | Partial | Scrapers, datasets and seed code retained locally; rights, listing types/units, source quality and observed-versus-generated history require audit. |
| Overload protection | Implemented, acceptance incomplete | Bounded admission unit tests pass; gateway config validates and normal routing works. Larger HTTP/transport failures and final overload acceptance remain unresolved. |
| Sustained-load qualification | Open | Failed k6/overload reports and unchanged original thresholds preserved. No new load or massive-user capacity claim. |

## Current retained data

224 properties: Karachi 48, Lahore 67, Islamabad 109. Eighteen society parent records. The source copy has zero users; authentication verification used temporary test accounts, not migrated customers.

134 inherited property references have no matching society parent: Karachi 18, Lahore 37, Islamabad 79. Denormalized search retains those listings; joins to societies omit them. No invented parents or silent repairs were introduced.

Legacy UI promotional counters, accuracy/ROI/verification language and simulated commercial behavior remain prototype content. They are not traction, validated model results or legal certification. The interface was preserved as requested; truth/provenance review is a future milestone.

## Completed FYP transition work

- Private recoverable source snapshot and SQLite-backup-API copies of all seven original files.
- New main-branch Git baseline, followed by a separate artificial-population retirement commit.
- Removed only the DDS massive population/queue generator and its exclusive test. Preserved its legitimate read-only sampling as `verify_dds_smoke.py`. No fixture/database data was deleted.
- Safe environment example, explicit configured signing key with existing local key unchanged, data/secret exclusions, staged/history publication gate and its tests.
- Source-only GitHub preparation, README, supervisor demo and milestone roadmap. Original raw evidence remains local and ignored; public verification is summarized in `docs/verification/FYP_BASELINE_2026-11-01.md`.

## Verification observed November 1

21 isolated tests PASS on the retained tree (4.705 seconds), then **21 PASS from a source-only copy without private .env or databases** (3.671 seconds, using installed dependencies and an ephemeral test key). The batching test now uses tiny in-memory fixtures rather than retained records; a Windows test-child log cleanup race exposed by the first source-only run was fixed by waiting for that owned child to exit. The initial failed run is retained locally. Frontend build PASS (16.75 seconds); real API/SQL smoke PASS; actual rqlite auth/RBAC/OTP/watchlist PASS; seven-file/frontend preservation PASS; 31-table count/hash comparison PASS. Caddy validation PASS. No failover, reseed, massive-user simulation or k6 run was needed for this milestone.

Build still warns about a large JavaScript chunk; the installed test client reports a deprecation warning. These do not invalidate the observed passes and are not hidden. The pinned Windows dependency snapshot was generated from installed metadata, not validated through a clean-machine install.

## Next milestone

A scoped product implementation/provenance audit: map each displayed claim and capability to its actual API, source, algorithm, role coverage and verification. Produce an actionable gap list before making AI/ML changes. Work incrementally using `RIHAISH_FYP_ROADMAP.md`.
