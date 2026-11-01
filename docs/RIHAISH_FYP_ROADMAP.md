# RIHAISH FYP roadmap

One milestone at a time: recover context → define a focused outcome → preserve a checkpoint → implement → verify → record evidence → commit. Future items below are plans, not delivered features. No AI/ML rewrite is part of the baseline transition.

| Milestone | State | Outcome and acceptance gate |
|---|---|---|
| 0. Safe source baseline | Completed and published; receipt in GITHUB_PUBLICATION.md | Recoverable private snapshot, preserved DDS/data/frontend/auth, retired artificial population tool, scanned Git history, verified remote source/tree, current checks and supervisor docs. |
| 1. Product implementation/provenance audit | Next | Map screens, endpoints, roles, data sources, algorithms and claims. Identify observed/generated/estimated/predicted values; create a prioritized gap list. Reuse DDS findings rather than repeat that audit. |
| 2. Real ingestion and provenance | Planned | Authorized sources/licensing, source URLs/timestamps, listing-type/unit validation, deduplication, freshness, missing-parent analysis and ingestion tests. Never silently repair retained records. |
| 3. Forecasting validation | Planned | Build a genuinely observed time-series dataset, temporal holdouts, simple baselines, documented errors/uncertainty and leakage checks. Remove unsupported accuracy claims through an approved content change. Publish no invented ROI. |
| 4. Facilities and proximity | Planned | Source-backed facilities, coordinate quality, distance tests, evidence freshness and explicit distinction between distance estimates and actual route/traffic time. |
| 5. Government evidence | Planned | Traceable authority/source documents, review status, reviewer/time/evidence provenance and honest uncertainty. A UI badge must not substitute for authoritative verification. |
| 6. Construction intelligence | Planned | Dated evidence, source/ownership, milestone consistency, review workflow and clear limits on authenticity and currentness. |
| 7. Product/role integration | Planned | Complete buyer/investor/society/admin flows, role alignment, backend/frontend contracts, notification checks and real billing integration if required. Preserve layout/navigation unless an approved milestone changes them. |
| 8. Reliability and security | Planned | Reproduce unresolved load failures, validate bounded overload/gateway recovery, deployment hardening, CORS/credential review, dependency/test warnings, backup/recovery and safe legacy-test isolation. Keep k6 thresholds and failed evidence. |
| 9. FYP/industry presentation | Planned | Reproducible honest walkthrough with measured results, source-backed product claims, clear limitations and an evidence-based pitch; no fabricated users, partnerships or market traction. |

## Immediate next milestone

Audit one capability matrix without changing algorithms: where a value originates, how it reaches an endpoint/screen, which role may change it, whether it is calculated or observed, and what verifies it. Prioritize provenance and misleading/unvalidated labels before expanding the pitch.

Do not start a major forecast rewrite, replace the database, change frontend design or silently mutate source data during that audit. Scope subsequent work into reviewable commits with targeted tests and maintained checkpoints.
