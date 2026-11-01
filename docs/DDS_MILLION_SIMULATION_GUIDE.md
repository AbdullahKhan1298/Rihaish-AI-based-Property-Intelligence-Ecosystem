# One-million-user simulation — evaluator walkthrough

Implemented and executed October 26, 2026, 10:26 Asia/Karachi. This is a **synthetic-data and virtual-time simulation**, with a separate small real API sample. It is not a passed million-concurrent-user application load test. The original k6 workload and its failed reports remain unchanged.

## What you can show

| Evidence | Verified in this run | Meaning |
|---|---|---|
| Generated synthetic user profiles | 1,000,000 rows and unique emails; integrity check `ok` | Actual data volume in a separate local fixture database |
| Users marked active in the model | 1,000,000 | Logical users represented in virtual time; no million OS threads, sockets, JWTs or login sessions |
| Offline request events | 1,000,000 per scenario | Queue calculations under explicit service assumptions |
| Live RIHAISH API | 12/12 sorted ten-property response checks; both api1 and api2 | Small actual read sample with at most two concurrent client workers |
| Final health | Three voters, quorum read, all four app/proxy/frontend ports ready | Demo remains operational |
| Million concurrent live users | NOT VERIFIED | Simulation does not establish application capacity |

Executed command:

```powershell
Set-Location 'C:\Users\hp\.gemini\antigravity\scratch\rihaish'
$env:PYTHONIOENCODING='utf-8'
python scripts/demo_million_users.py --users 1000000 --live-sample
```

Exit 0. Actual evidence folder: `docs/evidence/million-simulation-20261026T052601Z-f11db3/`. Report times are UTC (05:26 equals 10:26 Asia/Karachi). Synthetic database: `.runtime/million-user-simulation/20261026T052601Z-f11db3/synthetic-users.sqlite3`. Fixture size 123,977,728 bytes (~118.2 MiB); generation, indexes and verification took 14.41 seconds. Entire demo took about 20 seconds. Timings can vary on another run.

## Step 1 — Open the prepared evaluator screen

No regeneration is needed to show the actual saved run. In PowerShell:

```powershell
Set-Location 'C:\Users\hp\.gemini\antigravity\scratch\rihaish'
$demo=Get-Item docs/evidence/million-simulation-20261026T052601Z-f11db3
Start-Process (Join-Path $demo.FullName 'report.html')
$r=Get-Content (Join-Path $demo.FullName 'report.json') -Raw | ConvertFrom-Json
```

Show the visible **SIMULATION — NOT A LIVE MILLION-USER LOAD TEST** banner. Say:

> “This optional simulation represents a population of one million synthetic users. We separately show real database records, an assumed virtual-time traffic model, and a small real application sample.”

## Step 2 — Prove the million synthetic rows exist

First show the machine-readable fixture statistics:

```powershell
$r.synthetic_dataset | Format-List
```

Then independently query the generated file read-only:

```powershell
@'
import json,sqlite3,sys
from contextlib import closing
from pathlib import Path
report=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
database=Path(report['synthetic_database_relative_path']).resolve()
with closing(sqlite3.connect(database.as_uri()+'?mode=ro',uri=True)) as connection:
    print('Rows, active in model, unique emails:', connection.execute('SELECT COUNT(*),SUM(active_in_model),COUNT(DISTINCT email) FROM simulated_users').fetchone())
    print('City distribution:', connection.execute('SELECT city,COUNT(*) FROM simulated_users GROUP BY city ORDER BY city').fetchall())
    print('First indexed city page:', connection.execute('SELECT user_id,email FROM simulated_users WHERE city=? AND user_id>? ORDER BY user_id LIMIT 5',('karachi',0)).fetchall())
'@ | python - (Join-Path $demo.FullName 'report.json')
```

Expected counts: `(1000000, 1000000, 1000000)`. Cities: Islamabad 333,333, Karachi 333,334, Lahore 333,333. Karachi's first IDs 1,4,7,10,13; next page 16,19,22,25,28. Query plan uses `simulated_city_page`. The measured count plus two pages took 61.129 ms in the saved fixture run.

Say:

> “These profiles are deliberately isolated fixtures. They use example.invalid addresses and have no passwords or tokens. This proves generation and indexed SQL queries over one million synthetic rows in this fixture file. It does not establish one million users in the production rqlite authentication tables.”

The existing application `users` table is not seeded or replaced. The original seven SQLite files and frontend source are preserved. This isolated SQLite file is test input, not a new production datastore or architectural change.

## Step 3 — Explain one million active users in virtual time

```powershell
$r.virtual_time_models | Format-Table active_simulated_users,assumed_service_slots,assumed_constant_service_ms,modeled_p95_seconds,modeled_pending_at_window_end,simulation_wall_seconds
```

All million model users remain logically active during a 60-second virtual window. Each sends one request, evenly spread across that window: 16,666.667 offered requests per virtual second. The model uses deterministic FIFO scheduling, an unlimited queue, constant assumed service time, and no network failures, authentication, cache, retries or distributed-database execution. A “service slot” is a hypothetical concurrent service resource; it is not an actual FastAPI process, thread count or rqlite node.

| Hypothetical inputs | Modeled p95 | Pending at virtual 60 seconds | Actual computation time |
|---|---:|---:|---:|
| 100 slots, 50 ms service time | 418.006 seconds | 880,099 | 1.715 seconds |
| 1,000 slots, 50 ms service time | 0.050 seconds | 833 | 1.370 seconds |

The second model still has 833 requests in flight at the window boundary; its last request completes at virtual 60.04994 seconds. The first drains at virtual 500.00594 seconds. These calculations do not measure the application. Virtual 60 seconds can be computed in fewer real seconds because the simulator advances a clock rather than waiting or sending network traffic.

Say:

> “This model illustrates demand and queue buildup. The service-slot count and 50 ms service time are assumptions. The favorable scenario is not a measured RIHAISH capacity result.”

## Step 4 — Show the actual live application sample separately

```powershell
$r.live_api_sample | Select-Object scope,client_worker_limit,requests_attempted,contract_passes,instances_observed,wall_seconds
$r.live_api_sample.requests | Format-Table city,status,instance,contract_ok,elapsed_ms
```

Actual saved result: twelve read-only property GETs with two client workers, all HTTP 200 and sorted ten-item responses. Both api1 and api2 appeared; total wall time 1.342 seconds. Individual request elapsed time was 127.141–382.604 ms in this small sample. These timings were not used as simulated service times, and they do not replace sustained-load testing. The existing ten-VU k6 prerequisite remains failed/unresolved; see `DDS_MILLION_USER_TEST.md`.

Show the real property frontend at `http://127.0.0.1:3000`, and the Raft/failure demonstration from `DDS_FINAL_DEMO_COMMANDS.md`. Actual distributed replication and failure are proved by those separate functional tests, not by the synthetic fixture.

## Step 5 — Reproduce the complete simulation live

If the evaluator wants to watch generation, use:

```powershell
$env:PYTHONIOENCODING='utf-8'
python scripts/demo_million_users.py --users 1000000 --live-sample
if ($LASTEXITCODE -ne 0) { throw 'Inspect the saved report: a live sample or health check may have failed' }
$demo=Get-ChildItem docs/evidence -Directory -Filter 'million-simulation-*' | Sort-Object Name -Descending | Select-Object -First 1
$r=Get-Content (Join-Path $demo.FullName 'report.json') -Raw | ConvertFrom-Json
Start-Process (Join-Path $demo.FullName 'report.html')
```

Every run creates a new unique dataset and evidence directory and refuses overwrite. It writes about 118 MiB per million-profile run; reuse an existing report unless regeneration is needed. It never deletes previous runs or touches original application rows. Running without `--live-sample` is fully offline and needs no running backend:

```powershell
python scripts/demo_million_users.py --users 1000000
```

Offline exit 0 proves completion of the fixture/model computation only. Live mode additionally requires all twelve API checks and final three-node/quorum/application readiness to pass. A partial live failure is saved in the report and produces a nonzero exit; it is not hidden by offline success.

## Step 6 — End with operational health and an accurate conclusion

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dds_cluster.ps1 -Action status
foreach ($port in @(8001,8002,8000,3000)) {
    Invoke-RestMethod "http://127.0.0.1:$port/api/health/ready" -TimeoutSec 15
}
```

Conclude:

> “We demonstrated a real one-million-row synthetic fixture and a virtual-time simulation of one million active users, plus a small live API sample. Our real DDS replication, election and recovery tests are separate. Million-user live capacity and sustained-load acceptance remain unverified.”

Whether this simulation satisfies the evaluator's requirement must be agreed explicitly. If real concurrent load is mandatory, the separate-generator/staging prerequisites in `DDS_MILLION_USER_TEST.md` still apply. Do not relabel simulation as that completed test.

## Implementation and checks

- `scripts/demo_million_users.py`: standard-library-only fixture generation, indexed queries, FIFO virtual-time model, optional bounded public-API sampler, JSON evidence and standalone HTML report. It changes no application endpoint or frontend component.
- `python -m unittest discover -s tests -p test_million_simulation.py -v`: three tests PASS. They verify known queue math, invalid-input rejection, unique fixture data, distinct pages and refusal to overwrite a fixture.
- New generated profiles contain only synthetic identifiers, invalid-domain email addresses, city, a synthetic role and a model-active flag. They provide no login or authorization bypass.
