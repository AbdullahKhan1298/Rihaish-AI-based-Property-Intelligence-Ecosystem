# Supervisor demonstration — preserved FYP baseline

Goal: show the existing application and genuine DDS implementation without fabricated customer counts or unsupported production claims. Allow 8–10 minutes. This walkthrough uses authorized local data that is deliberately not part of public Git.

## 1. Prepare the retained installation

Use its established Python environment and configured local secret. Do not overwrite `.env`, rerun migration or create a new dataset.

```powershell
Set-Location 'C:\Users\hp\.gemini\antigravity\scratch\rihaish'
$env:PYTHONIOENCODING='utf-8'
$env:SSLKEYLOGFILE=$null
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_cluster.ps1 -Action start
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_services.ps1 -Action start
```

If port 3000 does not already serve RIHAISH, run this in another terminal:

```powershell
Set-Location 'C:\Users\hp\.gemini\antigravity\scratch\rihaish\frontend'
npm.cmd run dev -- --host 127.0.0.1 --port 3000 --strictPort
```

For a fresh clone, follow README data/configuration prerequisites first. The source-only repository contains neither credentials nor the working databases. Start commands are idempotent for owned running processes; never stop unrelated port owners.

## 2. Explain the problem and product (one minute)

Open http://127.0.0.1:3000. Explain the buyer's need to compare prices, source evidence, facilities and construction updates across Pakistani cities. Show the existing navigation and explain the buyer/investor, society and admin workflows. Label prediction/evidence/commercial features according to `FYP_CURRENT_STATUS.md`.

Do not quote legacy promotional counts, accuracy badges, ROI labels or government-verification copy as measured results. Actual retained data: 224 properties, 18 societies, zero source user accounts. These are development-copy counts, not market traction.

## 3. Show functional property discovery (two minutes)

Choose Explore Properties, change city/price controls, choose Price: Low to High and open a property. The sampled Home/search/detail routes rendered on November 1. An unauthenticated visit to `/dashboard/admin` redirects to `/auth?mode=login`; no credentials need to be exposed.

Demonstrate actual SQL separately from existing frontend controls:

```powershell
$base='http://127.0.0.1:8000/api/properties/?q=plot&min_price=1000000&max_price=10000000&sort=price_asc&page_size=5'
foreach ($page in @(1,2)) {
    $p=Invoke-RestMethod "$base&page=$page"
    $p | Select-Object total,page,page_size
    $p.results | Select-Object id,title,price
}
```

Show numerical bounds, nondecreasing prices across pages and distinct IDs. Do not infer every frontend filter sends a SQL query; current controls also perform client-side filtering.

## 4. Show real distributed services (two minutes)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_cluster.ps1 -Action status
foreach ($port in @(4001,4003,4005)) {
    $s=Invoke-RestMethod "http://127.0.0.1:$port/status"
    [pscustomobject]@{Port=$port;Node=$s.store.node_id;Role=$s.store.raft.state;Voter=$s.store.raft.voter;Leader=$s.store.leader.node_id}
}
foreach ($port in @(8001,8002,8000)) {
    Invoke-RestMethod "http://127.0.0.1:$port/api/health/ready"
}
```

Explain one elected leader, three voters, replicated relational data, quorum and two API workers behind Caddy. Each DB node stores all data; city tables are logical namespaces. All processes share one laptop, so do not claim host/power/geographic fault tolerance.

Use earlier real failure evidence if a live outage is unnecessary. If explicitly demonstrating failure on an isolated working session, reuse the existing scoped script rather than the simulated frontend toggle:

```powershell
$report="docs/evidence/fyp-failover-$(Get-Date -Format yyyyMMddTHHmmss).json"
python scripts/verify_dds_live.py --single-node-only --output $report
```

That optional step stops one discovered leader, uses only isolated probe records, restores the node and cleans exact probes. It is not part of ordinary startup or this Git baseline. Never stop a second voter manually during it.

## 5. Reproduce safe checks (two minutes)

```powershell
python scripts/verify_dds_smoke.py --frontend
python -m unittest discover -s tests -v
```

The smoke tool is read-only: twelve real sorted city reads, SQL text/price filtering, cross-page sorting, both API IDs, unauthorized denial and health. It generates no population records and stops no service.

For actual covered authentication flows, use the preserved verifier with a separate report:

```powershell
$authReport="docs/evidence/fyp-auth-$(Get-Date -Format yyyyMMddTHHmmss).json"
python scripts/verify_dds_auth.py --output $authReport
```

It creates and cleans only its own UUID-labelled buyer/admin/OTP/watchlist fixtures, sends no mail, and checks JWTs on both APIs and RBAC. Do not display its private fixture manifests or claim those accounts were real migrated customers. Never use destructive `test_e2e_full.py`.

## 6. Finish with evidence and next work (one minute)

Show `docs/verification/FYP_BASELINE_2026-11-01.md` and the current Git commits. Explain the 42→3 controlled query-call optimization, with matching response hashes, as an earlier single-request measurement. Sustained-load acceptance remains open.

State the unresolved source-data references and prototype intelligence limits. Propose the next evidence/provenance audit followed by validated forecasting, facilities, government evidence and construction workflows. End with normal cluster/application readiness and the real repository URL from README. No massive-user generator or artificial user-count demonstration is needed.
