"""
Database Connection & Distributed Shard Manager
Manages physical SQLite database connections for Auth Core and Regional Shards (Karachi, Lahore, Islamabad).
"""

import sqlite3
import os
import json
from pathlib import Path
from typing import Dict, Any, List, Optional

# Base directories
DB_DIR = Path(os.getenv("RIHAISH_DB_DIR", str(Path(__file__).parent / "shards")))
DB_DIR.mkdir(parents=True, exist_ok=True)

AUTH_DB_PATH = DB_DIR / "auth_core.db"

SHARD_PATHS = {
    "karachi": {
        "primary": DB_DIR / "shard_karachi_primary.db",
        "replica1": DB_DIR / "shard_karachi_replica1.db"
    },
    "lahore": {
        "primary": DB_DIR / "shard_lahore_primary.db",
        "replica1": DB_DIR / "shard_lahore_replica1.db"
    },
    "islamabad": {
        "primary": DB_DIR / "shard_islamabad_primary.db",
        "replica1": DB_DIR / "shard_islamabad_replica1.db"
    }
}

def get_auth_db():
    if distributed_enabled():
        from .rqlite import Connection
        return Connection()
    conn = sqlite3.connect(AUTH_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def get_shard_db(city: str, use_replica: bool = False):
    city_key = "karachi" if "karachi" in city.lower() else "lahore" if "lahore" in city.lower() else "islamabad"
    if distributed_enabled():
        from .rqlite import Connection
        return Connection(city_key)
    role = "replica1" if use_replica else "primary"
    db_path = SHARD_PATHS[city_key][role]
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_all_databases():
    """Initializes schema on Auth DB and all primary/replica shard databases."""
    if distributed_enabled():
        # Explicit migration only. A missing migration must fail startup.
        conn = get_auth_db()
        try:
            if not conn.execute("SELECT version FROM dds_migration WHERE version = 1").fetchone():
                raise RuntimeError("DDS migration missing")
        finally:
            conn.close()
        return
    schema_path = Path(__file__).parent / "schema.sql"
    shard_schema_path = Path(__file__).parent / "shard_schema.sql"

    with open(schema_path, "r", encoding="utf-8") as f:
        auth_schema = f.read()

    with open(shard_schema_path, "r", encoding="utf-8") as f:
        shard_schema = f.read()

    # Initialize Auth DB
    with get_auth_db() as conn:
        conn.executescript(auth_schema)

    # Initialize all Shard DBs
    for city_key, paths in SHARD_PATHS.items():
        for role, p in paths.items():
            conn = sqlite3.connect(p, check_same_thread=False)
            conn.executescript(shard_schema)
            conn.close()

    print("[DB INIT] All physical databases (Auth Core + 3 City Shards & Replicas) initialized successfully.")


def distributed_enabled():
    backend = os.getenv('RIHAISH_DB_BACKEND', 'sqlite')
    if backend not in ('sqlite', 'rqlite'):
        raise ValueError('RIHAISH_DB_BACKEND must be sqlite or rqlite')
    return backend == 'rqlite'


def atomic_batch(conn, statements):
    """Execute a bounded read/write batch atomically on either backend."""
    if hasattr(conn, 'atomic'):
        return conn.atomic(statements)
    results = []
    try:
        conn.execute('BEGIN IMMEDIATE')
        for sql, *params in statements:
            cursor = conn.execute(sql, params)
            if cursor.description:
                results.append({'columns': [d[0] for d in cursor.description], 'values': [list(r) for r in cursor.fetchall()]})
            else:
                results.append({'rows_affected': cursor.rowcount})
        conn.commit()
        return results
    except Exception:
        conn.rollback()
        raise
