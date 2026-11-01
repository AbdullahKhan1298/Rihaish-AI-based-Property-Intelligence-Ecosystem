# RIHAISH project rules

- Read docs/CODEX_CHECKPOINT.md, docs/CODEX_HANDOFF.md and docs/DDS_EXECUTION_TRACKER.md before continuing. Reuse the earlier audit; verify relevant claims only.
- Preserve the React design, navigation, dashboards, API response fields, JWT secret, bcrypt hashes, roles and existing data.
- Never reset changes, delete database records/volumes, or run destructive migrations without explicit user approval. The legacy test_e2e_full.py deletes user records: never run it against retained data.
- Back up databases with SQLite's backup API, not a copy of an active WAL database. Keep backups and secrets under ignored .runtime; never publish them.
- Default runtime remains SQLite. DDS is explicitly selected by RIHAISH_DB_BACKEND=rqlite. Never silently fall back to SQLite when the cluster fails.
- Do not seed, scrape, restore or initialize records from API startup in DDS mode. Migration must be explicit, copy-only, and refuse an occupied target.
- Distinguish local logical partitions from physical distribution, real process failure from simulated toggles, and measured evidence from historical claims.
- Verify with targeted tests and actual node failures. Update the execution tracker and checkpoint with commands, evidence and remaining limitations.
- Run background Windows processes hidden. Bind evaluator services to loopback. Never stop unrelated processes.
- Distinguish overload shedding from capacity claims. Reject before handlers, release slots on failure/cancellation, preserve health probes and failed reports. Gateway/database write failures can be ambiguous; never replay them blindly.

