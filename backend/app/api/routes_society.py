"""
RIHAISH Society Admin B2B Management API — Production Grade
All endpoints protected with JWT auth + role verification.
Returns real data from shard databases scoped to the logged-in society admin.
"""

import uuid
import json
import time
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from ..db.database import get_auth_db, get_shard_db
from ..core.shard_router import shard_router
from ..core.security import get_current_user, require_role

router = APIRouter(prefix="/society", tags=["Society B2B Management"])

class AddListingRequest(BaseModel):
    title: str
    subtype: str
    price: float
    size: str
    noc_number: str
    type: str = "Plot"
    description: str = ""
    bedrooms: int = 0
    bathrooms: int = 0


@router.get("/subscription")
def get_subscription_status(current_user: dict = Depends(require_role("society_admin", "admin"))) -> Dict[str, Any]:
    """Returns real subscription status for the logged-in society admin from Auth Core DB."""
    user_id = current_user.get("user_id", "")
    user_email = current_user.get("email", "")
    society_id = current_user.get("society_id", "")

    conn = get_auth_db()
    cursor = conn.cursor()

    # Get active subscription
    cursor.execute("""
        SELECT * FROM subscriptions 
        WHERE (user_id = ? OR user_email = ?) AND status = 'ACTIVE'
        ORDER BY created_at DESC LIMIT 1
    """, (user_id, user_email))
    sub = cursor.fetchone()
    conn.close()

    # Get society info from shard
    society_info = None
    listings_count = 0
    leads_count = 0
    for city_key in ["karachi", "lahore", "islamabad"]:
        try:
            sconn = get_shard_db(city_key, use_replica=True)
            sc = sconn.cursor()
            sc.execute("SELECT * FROM societies WHERE id = ?", (society_id,))
            row = sc.fetchone()
            if row:
                society_info = dict(row)
                sc.execute("SELECT COUNT(*) as cnt FROM properties WHERE society_id = ?", (society_id,))
                listings_count = sc.fetchone()["cnt"]
            sconn.close()
            if society_info:
                break
        except Exception:
            pass

    # Count leads/inquiries
    try:
        aconn = get_auth_db()
        ac = aconn.cursor()
        ac.execute("SELECT COUNT(*) as cnt FROM inquiries WHERE society_name LIKE ?", (f"%{society_id}%",))
        leads_count = ac.fetchone()["cnt"]
        aconn.close()
    except Exception:
        pass

    if sub:
        return {
            "society_id": society_id,
            "society_name": society_info["name"] if society_info else society_id,
            "plan": sub["plan_name"],
            "amount_pkr": sub["amount_pkr"],
            "monthly_fee": f"PKR {sub['amount_pkr']:,}",
            "status": sub["status"],
            "billing_cycle": sub["billing_cycle"],
            "renewal_due": sub["expires_at"],
            "receipt_no": sub["receipt_no"],
            "listings_count": listings_count,
            "leads_captured": leads_count
        }
    else:
        return {
            "society_id": society_id,
            "society_name": society_info["name"] if society_info else society_id,
            "plan": "No Active Plan",
            "amount_pkr": 0,
            "monthly_fee": "PKR 0",
            "status": "INACTIVE",
            "billing_cycle": "N/A",
            "renewal_due": "N/A",
            "receipt_no": "N/A",
            "listings_count": listings_count,
            "leads_captured": leads_count
        }


@router.get("/listings")
def get_society_listings(current_user: dict = Depends(require_role("society_admin", "admin"))) -> Dict[str, Any]:
    """Returns all property listings belonging to the logged-in society admin."""
    society_id = current_user.get("society_id", "")
    listings = []

    for city_key in ["karachi", "lahore", "islamabad"]:
        try:
            conn = get_shard_db(city_key, use_replica=True)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, title, type, subtype, price, price_formatted, size, status, 
                       completion_status, completion_pct, ai_investment_score, created_at
                FROM properties WHERE society_id = ? ORDER BY created_at DESC
            """, (society_id,))
            rows = cursor.fetchall()
            listings.extend([dict(r) for r in rows])
            conn.close()
        except Exception:
            pass

    return {"society_id": society_id, "count": len(listings), "listings": listings}


@router.get("/leads")
def get_society_leads(current_user: dict = Depends(require_role("society_admin", "admin"))) -> Dict[str, Any]:
    """Returns inquiries received for properties belonging to this society."""
    society_id = current_user.get("society_id", "")

    conn = get_auth_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM inquiries 
        WHERE society_name LIKE ? 
        ORDER BY created_at DESC LIMIT 50
    """, (f"%{society_id}%",))
    rows = cursor.fetchall()
    conn.close()

    leads = [dict(r) for r in rows]
    return {"society_id": society_id, "count": len(leads), "leads": leads}


@router.post("/listings")
def add_society_listing(payload: AddListingRequest, current_user: dict = Depends(require_role("society_admin", "admin"))) -> Dict[str, Any]:
    """Creates a new property listing in the correct regional shard database."""
    society_id = current_user.get("society_id", "")
    if not society_id:
        raise HTTPException(status_code=400, detail="No society assigned to this account.")

    # Find which city shard this society belongs to
    target_city = None
    society_name = society_id
    for city_key in ["karachi", "lahore", "islamabad"]:
        try:
            conn = get_shard_db(city_key)
            cursor = conn.cursor()
            cursor.execute("SELECT name, city FROM societies WHERE id = ?", (society_id,))
            row = cursor.fetchone()
            conn.close()
            if row:
                target_city = row["city"]
                society_name = row["name"]
                break
        except Exception:
            pass

    if not target_city:
        raise HTTPException(status_code=404, detail=f"Society '{society_id}' not found in any shard.")

    prop_id = f"prop-{target_city[:3]}-{uuid.uuid4().hex[:6]}"
    price_formatted = f"PKR {payload.price/1000000:.1f}M" if payload.price >= 1000000 else f"PKR {payload.price/1000:.0f}K"

    conn = shard_router.get_connection(target_city, read_only=False)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO properties 
        (id, society_id, society_name, city, title, type, subtype, price, price_formatted, 
         price_per_sqft, size, size_numeric, bedrooms, bathrooms, status, completion_status, 
         completion_pct, featured, ai_investment_score, recommendation, confidence_pct, 
         forecast_3yr_yield, description, images_json, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        prop_id, society_id, society_name, target_city, payload.title,
        payload.type, payload.subtype, int(payload.price), price_formatted,
        "Contact", payload.size, 0, payload.bedrooms, payload.bathrooms,
        "Available", "Under Construction", 50, 0,
        8.0, "BUY", 85, "+25%",
        payload.description, "[]", 0.0, 0.0
    ))

    # Add government record
    cursor.execute("""
        INSERT INTO government_records 
        (id, property_id, title, noc_number, issuing_authority, status_type, transfer_type, verification_date, is_verified, audit_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        f"gov-{prop_id}", prop_id, f"NOC Verification — {society_name}",
        payload.noc_number, "Pending Authority", "Pending Verification",
        "Open Market", time.strftime("%Y-%m-%d"), 0, "Submitted by society admin. Pending Rihaish audit."
    ))

    conn.commit()
    conn.close()

    # Log WAL
    shard_router.log_wal_entry(target_city, "INSERT", "properties", prop_id)

    return {
        "status": "SUCCESS_PUBLISHED",
        "message": f"Listing published to {target_city} shard. Pending NOC verification by Rihaish admin.",
        "listing_id": prop_id,
        "shard": shard_router.get_shard_id_for_city(target_city)
    }
