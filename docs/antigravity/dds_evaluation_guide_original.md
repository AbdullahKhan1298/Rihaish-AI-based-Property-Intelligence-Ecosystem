> **Historical document — superseded October 26, 2026.** Its SQLite distribution, WAL, failover and verification claims are not accepted evidence. See [Codex handoff](CODEX_HANDOFF.md), [DDS execution tracker](DDS_EXECUTION_TRACKER.md), and [current evaluator runbook](DDS_RUNBOOK.md). Original content is retained below.

# RIHAISH — Distributed Database System (DDS) Evaluation Guide

> **Version:** 2.0  
> **Architecture:** Physical SQLite Shard Cluster with WAL Replication

---

## 1. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    FastAPI Application Layer                  │
│                  (app/main.py — uvicorn:8000)                │
├──────────────────────────────────────────────────────────────┤
│                PhysicalShardRouter (core/shard_router.py)     │
│          ┌─────────────┬─────────────┬─────────────┐        │
│          │  shard-khi  │  shard-lhr  │  shard-isb  │        │
│          │  (Karachi)  │  (Lahore)   │ (Islamabad) │        │
│          └──────┬──────┴──────┬──────┴──────┬──────┘        │
│                 │             │             │                │
│           ┌─────┴─────┐ ┌────┴─────┐ ┌────┴─────┐          │
│           │ Primary   │ │ Primary  │ │ Primary  │           │
│           │ Replica-1 │ │ Replica-1│ │ Replica-1│           │
│           └───────────┘ └──────────┘ └──────────┘           │
├──────────────────────────────────────────────────────────────┤
│                   Auth Core Database                         │
│              (auth_core.db — centralized)                    │
└──────────────────────────────────────────────────────────────┘
```

## 2. DDS Evaluation Criteria & Evidence

### 2.1 Data Partitioning (Horizontal Sharding)

**Criterion:** Data is partitioned by geographic region.

**Evidence:**
- Properties are partitioned across 3 city-specific shard databases
- Shard routing is deterministic: city name → shard key → database file
- Each shard contains only its region's data (no cross-shard duplication)

**Verification Command:**
```bash
# Count records per shard
python -c "
import sqlite3
for shard in ['karachi', 'lahore', 'islamabad']:
    conn = sqlite3.connect(f'backend/app/db/shards/shard_{shard}_primary.db')
    count = conn.execute('SELECT COUNT(*) FROM properties').fetchone()[0]
    print(f'{shard}: {count} properties')
    conn.close()
"
```

### 2.2 Replication

**Criterion:** Each shard maintains at least one replica for redundancy.

**Evidence:**
- Every primary shard has a corresponding `_replica1.db` file
- `sync_replication()` performs physical file copy (primary → replica)
- WAL log tracks all replication events with timestamps
- Admin endpoint `/api/admin/shards/sync-all` triggers cluster-wide replication

**Verification Command:**
```bash
# Compare file sizes (should be identical after sync)
python -c "
import os
shards = ['karachi', 'lahore', 'islamabad']
for s in shards:
    p = os.path.getsize(f'backend/app/db/shards/shard_{s}_primary.db')
    r = os.path.getsize(f'backend/app/db/shards/shard_{s}_replica1.db')
    print(f'{s}: primary={p}B, replica={r}B, match={p==r}')
"
```

### 2.3 Read-Replica Load Balancing

**Criterion:** Read queries are routed to replicas to distribute load.

**Evidence:**
- `PhysicalShardRouter.get_connection(city, read_only=True)` routes to replica
- `PhysicalShardRouter.get_connection(city, read_only=False)` routes to primary
- ML model trainer reads from replicas: `get_shard_db(city, use_replica=True)`

### 2.4 Failover & Recovery

**Criterion:** System can survive primary node failure and recover.

**Evidence:**
- `trigger_failover(shard_id)` toggles failover mode:
  - **Failover Active:** All queries routed to replica (promoted to primary)
  - **Restore:** Primary restored, replica resynced
- WAL logs `FAILOVER_TRIGGERED` and `PRIMARY_RESTORED` events
- Admin API: `POST /api/admin/shards/{shard_id}/failover`

**Verification Steps:**
1. Call `POST /api/admin/shards/shard-khi/failover` (triggers failover)
2. Verify Karachi queries still return data (routed through replica)
3. Call `POST /api/admin/shards/shard-khi/failover` again (restore)
4. Check WAL log for failover/restore events

### 2.5 Write-Ahead Logging (WAL)

**Criterion:** All write operations are logged for auditability.

**Evidence:**
- In-memory WAL ring buffer (50 entries per shard) in `PhysicalShardRouter`
- Database-level WAL table: `shard_replication_log` (operation, table, record_id, timestamp)
- Admin API: `GET /api/admin/shards/{shard_id}/wal-log`

### 2.6 Cross-Shard Queries

**Criterion:** System can aggregate data across all shards.

**Evidence:**
- `routes_properties.py` — Iterates all 3 shards to build combined property listing
- `routes_admin.py` — Aggregates metrics (total properties, societies) across shards
- `routes_ai_predict.py` — Society comparison spans all 18 societies across 3 cities
- `model_trainer.py` — Calibrates from all shards simultaneously

---

## 3. Live Health Check Procedure

### Step 1: Start Backend
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Step 2: Verify Shard Health (requires admin JWT)
```bash
# After admin login, use the returned token:
curl -H "Authorization: Bearer <TOKEN>" http://127.0.0.1:8000/api/admin/shards
```

Expected response shows 3 shards with:
- `primary_status: "ONLINE (HEALTHY)"`
- `total_records: <count>`
- `query_latency_ms: <ms>`
- `primary_file_size_kb: <size>`

### Step 3: Test Failover
```bash
# Trigger failover on Karachi shard
curl -X POST -H "Authorization: Bearer <TOKEN>" http://127.0.0.1:8000/api/admin/shards/shard-khi/failover

# Verify properties still accessible
curl http://127.0.0.1:8000/api/properties/?city=karachi

# Restore primary
curl -X POST -H "Authorization: Bearer <TOKEN>" http://127.0.0.1:8000/api/admin/shards/shard-khi/failover
```

### Step 4: Trigger Full Replication Sync
```bash
curl -X POST -H "Authorization: Bearer <TOKEN>" http://127.0.0.1:8000/api/admin/shards/sync-all
```

---

## 4. Performance Characteristics

| Metric | Observed Value |
|--------|---------------|
| Backend startup (cold) | ~3-5 seconds (includes DB init + seed check + AI calibration) |
| Property listing query (all cities) | ~15-25ms |
| Single property detail | ~5-10ms |
| AI prediction per property | ~2-5ms |
| Shard failover toggle | ~50-100ms |
| Replication sync (per shard) | ~10-30ms |

---

## 5. Limitations & Future Enhancements

| Current Limitation | Future Enhancement |
|---|---|
| SQLite lacks network-level replication | Migrate to PostgreSQL with streaming replication |
| Single-process (no true concurrency for writes) | Deploy with gunicorn workers + connection pooling |
| File-based replication (full copy) | Implement incremental WAL-based replication |
| No automatic failover detection | Add health-check heartbeat with auto-promotion |
| 3 regional shards only | Add shard-splitting for high-growth cities |
