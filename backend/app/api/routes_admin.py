"""
RIHAISH Platform Administration API — Production Grade
Provides real metrics from database, shard health monitoring, user management,
email audit logs, WAL inspection, and system health endpoints.
All endpoints protected with admin role requirement.
"""

import os
import time
import platform
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from ..core.shard_router import shard_router
from ..core.security import require_role, get_current_user
from ..db.database import get_auth_db, get_shard_db, SHARD_PATHS, AUTH_DB_PATH, distributed_enabled

router = APIRouter(prefix="/admin", tags=["Platform Master Administration"])


@router.get("/shards")
def list_shards(current_user: dict = Depends(require_role("admin"))) -> List[Dict[str, Any]]:
    """Returns live shard health metrics with real DB file sizes and record counts."""
    results = shard_router.list_all_shards()
    # Enrich with real file sizes
    for shard in results:
        if distributed_enabled():
            continue
        city_key = shard["city_key"]
        try:
            primary_path = SHARD_PATHS[city_key]["primary"]
            replica_path = SHARD_PATHS[city_key]["replica1"]
            shard["primary_file_size_kb"] = round(os.path.getsize(primary_path) / 1024, 1) if primary_path.exists() else 0
            shard["replica_file_size_kb"] = round(os.path.getsize(replica_path) / 1024, 1) if replica_path.exists() else 0
        except Exception:
            shard["primary_file_size_kb"] = 0
            shard["replica_file_size_kb"] = 0
    return results


@router.post("/shards/{shard_id}/failover")
def trigger_shard_failover(shard_id: str, current_user: dict = Depends(require_role("admin"))) -> Dict[str, Any]:
    """Executes real failover: promotes replica to primary or restores primary."""
    res = shard_router.trigger_failover(shard_id)
    if not res:
        raise HTTPException(status_code=404, detail="Shard ID not found")
    return {
        "message": "Failover operation executed successfully on distributed router.",
        "shard": res
    }


@router.get("/metrics")
def get_platform_metrics(current_user: dict = Depends(require_role("admin"))) -> Dict[str, Any]:
    """Returns real computed metrics from Auth Core and Regional Shard databases."""
    conn = get_auth_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as cnt FROM users")
    total_users = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM users WHERE is_subscribed = 1")
    subscribed_users = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM subscriptions WHERE status = 'ACTIVE'")
    active_subs = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COALESCE(SUM(amount_pkr), 0) as total FROM subscriptions WHERE status = 'ACTIVE'")
    total_revenue = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) as cnt FROM inquiries")
    total_inquiries = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM email_logs")
    total_emails = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM newsletter_subscribers")
    newsletter_count = cursor.fetchone()["cnt"]

    conn.close()

    # Count total properties across all shards
    total_properties = 0
    total_societies = 0
    for city_key in ["karachi", "lahore", "islamabad"]:
        try:
            sconn = get_shard_db(city_key)
            sc = sconn.cursor()
            sc.execute("SELECT COUNT(*) as cnt FROM properties")
            total_properties += sc.fetchone()["cnt"]
            sc.execute("SELECT COUNT(*) as cnt FROM societies")
            total_societies += sc.fetchone()["cnt"]
            sconn.close()
        except Exception:
            pass

    return {
        "total_registered_users": total_users,
        "subscribed_users": subscribed_users,
        "active_subscriptions": active_subs,
        "total_revenue_pkr": total_revenue,
        "total_revenue_formatted": f"PKR {total_revenue:,}",
        "total_verified_listings": total_properties,
        "active_societies": total_societies,
        "total_inquiries": total_inquiries,
        "total_emails_dispatched": total_emails,
        "newsletter_subscribers": newsletter_count,
        "shards_healthy": sum(1 for s in shard_router.list_all_shards() if s.get('total_records') is not None),
        "ai_prediction_accuracy_pct": None
    }


@router.get("/users")
def list_all_users(current_user: dict = Depends(require_role("admin"))) -> Dict[str, Any]:
    """Returns all registered users for admin management."""
    conn = get_auth_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, role, society_id, is_subscribed, subscription_plan, is_email_verified, created_at, last_login FROM users ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    users = [dict(r) for r in rows]
    return {"count": len(users), "users": users}


@router.get("/email-logs")
def get_email_logs(current_user: dict = Depends(require_role("admin"))) -> Dict[str, Any]:
    """Returns email dispatch audit trail."""
    conn = get_auth_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM email_logs ORDER BY dispatched_at DESC LIMIT 100")
    rows = cursor.fetchall()
    conn.close()

    logs = [dict(r) for r in rows]
    return {"count": len(logs), "logs": logs}


@router.get("/system-health")
def get_system_health(current_user: dict = Depends(require_role("admin"))) -> Dict[str, Any]:
    """Returns backend system health: DB sizes, uptime, platform info."""
    if distributed_enabled():
        from ..db.rqlite import cluster_status
        return {'database': 'rqlite', **cluster_status(), 'platform': platform.system(), 'python_version': platform.python_version()}
    auth_db_size = round(os.path.getsize(AUTH_DB_PATH) / 1024, 1) if AUTH_DB_PATH.exists() else 0

    shard_sizes = {}
    for city_key, paths in SHARD_PATHS.items():
        shard_sizes[city_key] = {
            "primary_kb": round(os.path.getsize(paths["primary"]) / 1024, 1) if paths["primary"].exists() else 0,
            "replica_kb": round(os.path.getsize(paths["replica1"]) / 1024, 1) if paths["replica1"].exists() else 0
        }

    return {
        "status": "OPERATIONAL",
        "platform": platform.system(),
        "python_version": platform.python_version(),
        "auth_db_size_kb": auth_db_size,
        "shard_db_sizes": shard_sizes,
        "api_version": "2.0.0",
        "uptime_note": "Running since last server start"
    }


@router.get("/shards/{shard_id}/wal-log")
def get_shard_wal_log(shard_id: str, current_user: dict = Depends(require_role("admin"))) -> Dict[str, Any]:
    """Returns recent WAL (Write-Ahead Log) entries for a specific shard."""
    shard_state = shard_router.node_states.get(shard_id)
    if not shard_state:
        raise HTTPException(status_code=404, detail="Shard ID not found")

    city_key = shard_state["city_key"]
    try:
        conn = get_shard_db(city_key)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM shard_replication_log ORDER BY logged_at DESC LIMIT 50")
        rows = cursor.fetchall()
        conn.close()
        logs = [dict(r) for r in rows]
    except Exception:
        logs = []

    return {"shard_id": shard_id, "count": len(logs), "wal_entries": logs}


@router.post("/shards/sync-all")
def sync_all_shards(current_user: dict = Depends(require_role("admin"))) -> Dict[str, Any]:
    """Triggers full replication sync on all 3 regional shards."""
    synced = []
    for city_key in ["karachi", "lahore", "islamabad"]:
        try:
            shard_router.sync_replication(city_key)
            synced.append(city_key)
        except Exception as e:
            print(f"[SYNC ERROR] {city_key}: {e}")

    return {
        "success": True,
        "synced_shards": synced,
        "message": f"Replication sync completed on {len(synced)}/3 shards."
    }


@router.get("/pipeline/status")
def get_pipeline_status(current_user: dict = Depends(require_role("admin"))) -> Dict[str, Any]:
    """Returns the cron data pipeline scheduler status."""
    try:
        from ..db.cron_pipeline import pipeline_scheduler
        return pipeline_scheduler.get_status()
    except Exception as e:
        return {"error": str(e), "is_running": False}


@router.post("/pipeline/trigger")
def trigger_pipeline_manually(current_user: dict = Depends(require_role("admin"))) -> Dict[str, Any]:
    """Manually triggers a data refresh pipeline run."""
    if distributed_enabled():
        raise HTTPException(409, 'Legacy reseeding is disabled for the migrated DDS cluster.')
    try:
        from ..db.cron_pipeline import pipeline_scheduler
        result = pipeline_scheduler.trigger_manual()
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline trigger failed: {e}")


@router.get("/ai/calibration")
def get_ai_calibration_report(current_user: dict = Depends(require_role("admin"))) -> Dict[str, Any]:
    """Returns the AI model calibration report with growth rates and facility analysis."""
    try:
        from ..ml.model_trainer import model_trainer
        return model_trainer.get_calibration_report()
    except Exception as e:
        return {"is_calibrated": False, "error": str(e)}


@router.get("/market-trends")
def get_market_trends(current_user: dict = Depends(require_role("admin"))) -> Dict[str, Any]:
    """Returns aggregated market trends across all cities for admin dashboard."""
    trends = {}
    
    for city in ["karachi", "lahore", "islamabad"]:
        try:
            conn = get_shard_db(city, use_replica=True)
            cursor = conn.cursor()
            
            # Total properties and avg price
            cursor.execute("SELECT COUNT(*) as cnt, AVG(price) as avg_price, MAX(price) as max_price, MIN(price) as min_price FROM properties")
            stats = cursor.fetchone()
            
            # Society breakdown
            cursor.execute("""
                SELECT society_name, COUNT(*) as listings, AVG(price) as avg_price, AVG(ai_investment_score) as avg_score
                FROM properties
                GROUP BY society_name
                ORDER BY avg_price DESC
                LIMIT 10
            """)
            societies = [dict(row) for row in cursor.fetchall()]
            
            # Price distribution
            cursor.execute("""
                SELECT 
                    CASE 
                        WHEN price < 5000000 THEN 'Under 50 Lac'
                        WHEN price < 10000000 THEN '50 Lac - 1 Cr'
                        WHEN price < 30000000 THEN '1 Cr - 3 Cr'
                        WHEN price < 50000000 THEN '3 Cr - 5 Cr'
                        ELSE 'Above 5 Cr'
                    END as price_bracket,
                    COUNT(*) as count
                FROM properties
                GROUP BY price_bracket
            """)
            distribution = [dict(row) for row in cursor.fetchall()]
            
            conn.close()
            
            trends[city] = {
                "total_listings": stats["cnt"],
                "avg_price": round(stats["avg_price"] or 0),
                "max_price": stats["max_price"] or 0,
                "min_price": stats["min_price"] or 0,
                "top_societies": societies,
                "price_distribution": distribution,
            }
        except Exception as e:
            trends[city] = {"error": str(e)}
    
    # User role distribution
    try:
        auth_conn = get_auth_db()
        auth_cursor = auth_conn.cursor()
        auth_cursor.execute("SELECT role, COUNT(*) as cnt FROM users GROUP BY role")
        role_dist = [dict(row) for row in auth_cursor.fetchall()]
        auth_conn.close()
        trends["user_roles"] = role_dist
    except Exception:
        trends["user_roles"] = []
    
    return trends
