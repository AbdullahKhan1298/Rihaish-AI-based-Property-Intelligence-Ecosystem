# RIHAISH DDS evaluation guide — October 26, 2026

Use [the executable runbook](DDS_RUNBOOK.md) for commands and [the five-minute presentation](DDS_EVALUATOR_PRESENTATION.md) for the evaluator walkthrough.

The current implementation is three real rqlite voting processes, two FastAPI instances, and Caddy. It preserves the original frontend and seven source SQLite files. All database nodes replicate all logical city tables. The laptop remains one physical failure domain.

Verified in the latest rehearsal:

- Actual three-voter membership and one leader.
- SQL search, numeric price bounds, global sorting and pagination over 224 properties.
- A real write, database uniqueness under twelve concurrent attempts, and transaction rollback.
- A real leader process stopped; a replacement accepted reads and writes with quorum.
- HTTP 503 when quorum was lost; all restarted nodes caught up.
- Actual rqlite-backed buyer/admin login, cross-instance JWTs, RBAC, atomic watchlist and OTP checks, with fixture-only cleanup.

**Sustained-load readiness remains unproven.** The unchanged k6 workload has retained failures; see [measured performance](DDS_PERFORMANCE_REPORT.md) and the newest timestamped raw summary. A run passes only when its exit code is zero and every original threshold passes. Do not present diagnostics as passing load tests.

Known source limits: zero user accounts existed in the recovered copy; 134 properties have missing society parents. These were not silently repaired. See [the execution tracker](DDS_EXECUTION_TRACKER.md).

The previous simulated-failover guide is retained unchanged in [the historical archive](antigravity/dds_evaluation_guide_original.md). Its claims are not current DDS evidence.
