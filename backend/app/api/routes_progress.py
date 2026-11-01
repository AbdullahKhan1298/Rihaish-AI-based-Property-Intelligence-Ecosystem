"""
RIHAISH Construction Progress Tracking API — Production Grade
Queries real progress milestones from regional shard databases.
Society admins can submit new milestones for admin verification.
"""

import uuid
import json
import time
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from ..db.database import get_shard_db
from ..core.shard_router import shard_router
from ..core.security import get_current_user, require_role, get_current_user_optional

router = APIRouter(prefix="/progress", tags=["Construction Progress Tracking"])

class MilestoneSubmitRequest(BaseModel):
    property_id: str
    title: str
    completion_pct: int
    notes: str
    city: str = ""


@router.get("/{property_id}")
def get_milestones(property_id: str) -> Dict[str, Any]:
    """Queries real progress milestones from the appropriate regional shard database."""
    for city_key in ["karachi", "lahore", "islamabad"]:
        try:
            conn = get_shard_db(city_key, use_replica=True)
            cursor = conn.cursor()

            # Check if property exists in this shard
            cursor.execute("SELECT completion_pct, completion_status, society_id FROM properties WHERE id = ?", (property_id,))
            prop = cursor.fetchone()
            if not prop:
                conn.close()
                continue

            # Get milestones
            cursor.execute("""
                SELECT title, report_date, completion_pct, status, verified_by_admin, verifier_stamp, photos_json
                FROM progress_reports 
                WHERE property_id = ? 
                ORDER BY completion_pct ASC
            """, (property_id,))
            rows = cursor.fetchall()
            conn.close()

            milestones = [
                {
                    "date": r["report_date"],
                    "title": r["title"],
                    "status": r["status"],
                    "pct": r["completion_pct"],
                    "verified_by_admin": bool(r["verified_by_admin"]),
                    "verifier_stamp": r["verifier_stamp"],
                    "photos": json.loads(r["photos_json"] or "[]")
                }
                for r in rows
            ]

            return {
                "property_id": property_id,
                "completion_overall_pct": prop["completion_pct"],
                "completion_status": prop["completion_status"],
                "society_id": prop["society_id"],
                "milestone_count": len(milestones),
                "milestones": milestones
            }
        except Exception as e:
            print(f"[PROGRESS QUERY ERROR] {city_key}: {e}")

    raise HTTPException(status_code=404, detail=f"Property '{property_id}' not found in any shard.")


@router.post("/submit")
def submit_milestone(
    payload: MilestoneSubmitRequest, 
    current_user: dict = Depends(require_role("society_admin", "admin"))
) -> Dict[str, Any]:
    """Submits a new construction milestone for admin review. Writes to shard DB."""
    # Determine which shard
    target_city = None
    for city_key in ["karachi", "lahore", "islamabad"]:
        try:
            conn = get_shard_db(city_key)
            cursor = conn.cursor()
            cursor.execute("SELECT id, society_id FROM properties WHERE id = ?", (payload.property_id,))
            row = cursor.fetchone()
            conn.close()
            if row:
                target_city = city_key
                society_id = row["society_id"]
                break
        except Exception:
            pass

    if not target_city:
        raise HTTPException(status_code=404, detail=f"Property '{payload.property_id}' not found.")

    # Verify society admin owns this property
    user_society = current_user.get("society_id", "")
    user_role = current_user.get("role", "")
    if user_role != "admin" and user_society != society_id:
        raise HTTPException(status_code=403, detail="You can only submit milestones for your own society's properties.")

    milestone_id = f"prog-{payload.property_id}-{uuid.uuid4().hex[:6]}"
    report_date = time.strftime("%b %Y")

    conn = shard_router.get_connection(target_city, read_only=False)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO progress_reports 
        (id, property_id, society_id, title, report_date, completion_pct, status, verified_by_admin, verifier_stamp, photos_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        milestone_id, payload.property_id, society_id,
        payload.title, report_date, payload.completion_pct,
        "In Progress" if payload.completion_pct < 100 else "Completed",
        0, "Pending Verification", "[]"
    ))

    # Update property completion_pct
    cursor.execute("""
        UPDATE properties SET completion_pct = ? WHERE id = ?
    """, (payload.completion_pct, payload.property_id))

    conn.commit()
    conn.close()

    shard_router.log_wal_entry(target_city, "INSERT", "progress_reports", milestone_id)

    return {
        "status": "QUEUED_FOR_AUDIT",
        "message": "Milestone submitted successfully. Queued for Rihaish field audit and admin verification.",
        "milestone_id": milestone_id,
        "property_id": payload.property_id,
        "completion_pct": payload.completion_pct
    }
