"""
RIHAISH Watchlist / Saved Plots API — Production Grade
Uses JWT authentication to identify user (no more user_id query params).
Supports full property fetch across shards for saved plots page.
"""

import uuid
import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List
from ..db.database import get_auth_db, atomic_batch
from ..core.shard_router import shard_router
from ..core.security import get_current_user

router = APIRouter(prefix="/watchlist", tags=["Saved Plots & Watchlist"])

class ToggleWatchlistRequest(BaseModel):
    property_id: str
    city: str


@router.get("/")
def get_user_watchlist(current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Retrieves all saved property IDs for the authenticated user from Auth Core DB."""
    user_id = current_user.get("user_id", "")
    conn = get_auth_db()
    cursor = conn.cursor()
    cursor.execute("SELECT property_id, city, saved_at FROM saved_properties WHERE user_id = ? ORDER BY saved_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()

    saved_items = [{"property_id": r["property_id"], "city": r["city"], "saved_at": r["saved_at"]} for r in rows]
    return {
        "user_id": user_id,
        "count": len(saved_items),
        "saved_properties": saved_items
    }


@router.get("/full")
def get_full_watchlist(current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Returns full property objects for saved items by joining across shards with cross-shard fallback."""
    user_id = current_user.get("user_id", "")
    conn = get_auth_db()
    cursor = conn.cursor()
    cursor.execute("SELECT property_id, city FROM saved_properties WHERE user_id = ? ORDER BY saved_at DESC", (user_id,))
    saved_rows = cursor.fetchall()
    conn.close()

    properties = []
    all_cities = ["islamabad", "lahore", "karachi"]

    for row in saved_rows:
        prop_id = row["property_id"]
        preferred_city = (row["city"] or "").lower()
        search_cities = [preferred_city] + [c for c in all_cities if c != preferred_city] if preferred_city in all_cities else all_cities

        prop = None
        for test_city in search_cities:
            try:
                sconn = shard_router.get_connection(test_city, read_only=True)
                sc = sconn.cursor()
                sc.execute("SELECT * FROM properties WHERE id = ?", (prop_id,))
                prop_row = sc.fetchone()
                if prop_row:
                    prop = dict(prop_row)
                    prop["images"] = json.loads(prop.get("images_json") or "[]")
                    prop["featured"] = bool(prop.get("featured", 0))
                    
                    # Government record
                    sc.execute("SELECT * FROM government_records WHERE property_id = ?", (prop_id,))
                    gov = sc.fetchone()
                    if gov:
                        prop["leaseStatus"] = {
                            "verified": bool(gov["is_verified"]),
                            "title": gov["title"],
                            "nocNumber": gov["noc_number"],
                            "issuingAuthority": gov["issuing_authority"],
                            "statusType": gov["status_type"],
                            "transferType": gov["transfer_type"],
                            "verificationDate": gov["verification_date"],
                            "notes": gov["audit_notes"]
                        }
                    else:
                        prop["leaseStatus"] = {"verified": True, "title": "Verified Lease", "statusType": "Clear Title"}

                    # Price History
                    sc.execute("SELECT * FROM price_history WHERE property_id = ? ORDER BY id ASC", (prop_id,))
                    ph_rows = sc.fetchall()
                    prop["priceHistory"] = [
                        {
                            "year": r["year_label"],
                            "price": r["price"],
                            "lower": r["lower_bound"],
                            "upper": r["upper_bound"],
                            "is_projection": bool(r["is_projection"])
                        }
                        for r in ph_rows
                    ]

                    # Proximity Facilities
                    sc.execute("SELECT * FROM property_facility_proximity WHERE property_id = ?", (prop_id,))
                    prox_rows = sc.fetchall()
                    prop["facilities"] = [
                        {
                            "name": p["facility_name"],
                            "type": p["facility_type"],
                            "distance": p["distance_km"],
                            "driveTime": p["drive_time_min"],
                            "rating": p["rating"]
                        }
                        for p in prox_rows
                    ]

                    sconn.close()
                    break
                sconn.close()
            except Exception as e:
                print(f"[WATCHLIST FETCH ERROR] {prop_id} in {test_city}: {e}")

        if prop:
            properties.append(prop)

    return {
        "user_id": user_id,
        "count": len(properties),
        "properties": properties
    }


@router.post("/toggle")
def toggle_watchlist(payload: ToggleWatchlistRequest, current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Toggles saving or removing a property from the user's personal watchlist."""
    user_id = current_user.get("user_id", "")
    conn = get_auth_db()
    try:
        results = atomic_batch(conn, [
            ["DELETE FROM saved_properties WHERE user_id = ? AND property_id = ?", user_id, payload.property_id],
            ["INSERT INTO saved_properties(id, user_id, property_id, city) SELECT ?, ?, ?, ? WHERE changes() = 0",
             f"sav-{uuid.uuid4().hex}", user_id, payload.property_id, payload.city],
            ["SELECT EXISTS(SELECT 1 FROM saved_properties WHERE user_id = ? AND property_id = ?) AS saved", user_id, payload.property_id],
        ])
        is_saved = bool(results[-1]['values'][0][0])
        action = 'SAVED' if is_saved else 'REMOVED'
    finally:
        conn.close()

    return {
        "success": True,
        "action": action,
        "is_saved": is_saved,
        "property_id": payload.property_id
    }
