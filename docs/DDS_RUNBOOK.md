# DDS evaluator walkthrough (Windows, loopback)

Graceful overload follow-up: [DDS_GRACEFUL_OVERLOAD_GUIDE.md](DDS_GRACEFUL_OVERLOAD_GUIDE.md). Implementation is partially verified; final gateway validation and 32-request/4-client rehearsal are pending manual execution at the user's request. Do not represent this as passed million-client testing.

For the October 27 live presentation, use [DDS_FINAL_DEMO_COMMANDS.md](DDS_FINAL_DEMO_COMMANDS.md). It contains the October 26 controlled rehearsal, exact commands, recovery and a 7–10 minute walkthrough. Its `--single-node-only` option on the existing verifier keeps two voters online. The default verifier later in this historical runbook also tests majority loss and is not needed for the final live presentation. Sustained-load acceptance remains unresolved.

Run commands from the RIHAISH project root in PowerShell. Requires Python 3.12 and outbound access for the initial official binary downloads. No Docker, WSL, administrator-level install, database volume deletion or original database rewrite is needed.

## Resume this recovered machine

The cluster is already migrated. **Do not import again.**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_cluster.ps1 -Action start
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_services.ps1 -Action start
Invoke-RestMethod http://127.0.0.1:8000/api/health/ready
```

API entry point: `http://127.0.0.1:8000`. Swagger: `http://127.0.0.1:8000/docs`. The existing Vite proxy already points to port 8000; launch the frontend using its normal `npm run dev` in `frontend`. Frontend design, routing and components are unchanged.

Node console: `http://127.0.0.1:4001/console/`. All database interfaces bind to loopback. Do not open them publicly. Caddy's admin API is disabled.

## Confirm actual Raft and API status

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_cluster.ps1 -Action status
foreach ($port in @(4001,4003,4005)) {
    $status = Invoke-RestMethod "http://127.0.0.1:$port/status"
    $status.store | Select-Object node_id,leader,nodes
    $status.store.raft | Select-Object state,voter,term,applied_index
}
1..6 | ForEach-Object { (Invoke-WebRequest 'http://127.0.0.1:8000/api/health/ready').Headers['X-Rihaish-Instance'] }
```

Expect three members whose `suffrage` is `voter`, one Leader, two Followers,
and the same reported leader ID. A reachable HTTP port alone does not prove
quorum. `/api/health/ready` performs a linearizable database read and must fail
with 503 if quorum is unavailable. `/api/health/live` checks only that the API
process is responsive; Caddy uses this process probe because both APIs share
the database. Real SQL requests retain their quorum requirements. The legacy
listing `shard_status` label is not a live node-health measurement.

## Prepare a fresh evaluation copy

1. Install dependencies and pinned tools:

```powershell
python -m pip install -r backend/requirements.txt
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/install_dds_tools.ps1
```

2. Pause application writes and scheduled ingestion before snapshotting. The script uses SQLite's backup API for each file, but four independent databases cannot provide a single cross-database snapshot while writes continue.

```powershell
python scripts/snapshot_recovery.py
```

3. Start three empty nodes and import the printed backup directory. Use a new candidate path. This command refuses a nonempty target and never modifies the source. Do not expose APIs or database write traffic during the initial import.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_cluster.ps1 -Action start
python scripts/migrate_dds.py --source-dir .runtime/backups/YOUR_SNAPSHOT --output .runtime/migration/evaluator.db --import-empty-cluster
```

If an import response is interrupted, **do not retry the import**: inspect the existing cluster and run `--verify-only` with a new candidate path. The restore may already have committed. Content verification reads a cluster backup with SQLite to avoid JSON date/float rendering differences.

4. Start APIs/load balancer with `scripts/dds_services.ps1 -Action start`. Both inherit the unchanged JWT secret and SMTP environment from `backend/.env`. No seed/scrape task runs at DDS API startup.

## Demonstrate SQL behavior

```powershell
Invoke-RestMethod 'http://127.0.0.1:8000/api/properties/?city=karachi&q=plot&min_price=1000000&sort=price_asc&page=1&page_size=10'
Invoke-RestMethod 'http://127.0.0.1:8000/api/properties/?sort=price_asc&page=2&page_size=10'
1..6 | ForEach-Object { (Invoke-WebRequest 'http://127.0.0.1:8000/api/health/ready').Headers['X-Rihaish-Instance'] }
```

Supported sort values: `score_desc`, `price_asc`, `price_desc`, `newest`. Existing `society`, `type`, `max_price`, `verified_only`, and `min_ai_score` remain available. `total` is the SQL match count, `count` is returned page length. Unknown cities/sort values and invalid pagination are rejected. No pagination arguments preserves the existing frontend's all-results contract.

## Prove replication, concurrency and failure

```powershell
python scripts/verify_dds_live.py
```

This checks actual three-voter membership, runs 12 simultaneous writes against one database key (exactly one succeeds), verifies transaction rollback, checks both API instances, then stops the current leader process. The remaining two nodes must elect a new leader and accept a write while continuing to return all properties. With two nodes stopped, an API quorum read must return 503. Finally the script restarts the stopped nodes using the same persistent stores and directly checks every local replica for the write made during failure. It writes labelled probe rows in `dds_verification`, then cleans only the exact UUID-labelled rows created by this run. Retained application records and volumes are untouched. The report is `docs/evidence/live-dds-verification.json`.

The reported recovery interval measures a quorum probe **after** the process-stop command returns; it is not end-to-end outage duration. Leader election can cause brief errors. A three-node quorum tolerates one failed process, not failure of the host containing all three nodes.

For a manual demonstration, use `scripts/dds_cluster.ps1 -Action status` to identify the leader, then `-Action stop -Node N` and `-Action start -Node N`. Never use `Remove-Item`, volume deletion, or legacy file-copy failover to demonstrate a crash. Do not stop services belonging to someone else.

## Load and regression tests

```powershell
$env:PYTHONIOENCODING = 'utf-8'
python -m unittest discover -s tests -v
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run_k6.ps1 -Label evaluator
python scripts/summarize_dds_performance.py
```

k6 runs 10 concurrent virtual users for 30 seconds against SQL-filtered 10-item result pages via Caddy, rotating cities and pausing 0.1 second between iterations. It requires under 1% failed requests, p95 under 2 seconds, over 99% successful checks, and traffic reaching both APIs. The runner waits for actual database readiness first and writes a new `docs/evidence/k6-TIMESTAMP/` folder containing the exact workload, source hashes, generator settings, raw summary, error log and exit code. Anonymous outbound usage reporting is disabled; the workload remains local. Results apply only to this workload and laptop; they are not a capacity or production SLA claim. **Exit code 99 or any failed threshold means the run failed.** Read `DDS_PERFORMANCE_REPORT.md` for the retained failures and current unresolved transport problem; do not present a diagnostic or a fast single request as a k6 pass.

Auth regression tests use synthetic credentials in temporary databases, never original records or real email. The recovered auth database has zero users, so these are not evidence of a retained user's login or live SMTP delivery. Register a real evaluator account through the existing UI if required. Destructive reset endpoints return 403.

## Real rqlite-backed authentication demonstration

```powershell
python scripts/verify_dds_auth.py
python scripts/verify_dds_data.py
```

The auth script creates clearly labelled buyer and, only if no admin exists,
admin fixtures in the actual rqlite cluster. It tests HTTP login, JWTs on both
API instances, RBAC, actual concurrent watchlist operations and one-use OTP
consumption. It does not send email. Cleanup checks exact UUID IDs and fixture
ownership, removes only this run's fixture records, and verifies the user count
returns to its starting value. Evidence never contains passwords or tokens.

For an interactive UI demonstration:

```powershell
python scripts/verify_dds_auth.py --keep-fixtures
# Read the printed private .runtime/auth-fixtures-UUID.json locally.
# After demonstrating, use that exact manifest:
python scripts/verify_dds_auth.py --cleanup .runtime/auth-fixtures-UUID.json
```

Keep the credential file private and clear evaluation-browser tokens after the
demo. The original JWT implementation has no token-revocation facility; deleting
a fixture account does not by itself revoke a token already issued to a browser.
No original user accounts were present to migrate.

## Data integrity and evaluation limits

`verify_dds_data.py` compares all seven original file hashes and the archived
frontend, then queries the actual migrated database. It currently reports 134
properties with missing society parents (Karachi 18, Lahore 37, Islamabad 79).
Property search retains them through denormalized names; joins to societies omit
them. Foreign keys apply to new writes. These inherited errors are preserved
and disclosed; parents have not been invented to make a clean report.

Use `DDS_EVALUATOR_PRESENTATION.md` as a five-minute talk and live-demo script.
The system demonstrates process-failure tolerance and Raft recovery on one
laptop. It does not demonstrate host-failure tolerance, geographic physical
sharding, verified NOC authenticity, model accuracy or real payment settlement.

## Stop and rollback safely

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_services.ps1 -Action stop
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_cluster.ps1 -Action stop
```

These stop only processes owned by the scripts and preserve all stores. Legacy SQLite mode remains available by omitting `RIHAISH_DB_BACKEND=rqlite`; original database files are unchanged. **Writes made after DDS cutover do not sync back to those files.** Export and reconcile new records before changing the source of truth; never pretend switching modes is a lossless rollback after new writes.

Known inherited issues and evidence limitations are in `DDS_EXECUTION_TRACKER.md`. Do not run the legacy `test_e2e_full.py` against retained data.
