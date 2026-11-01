"""
RIHAISH Real Data Seeder v2.0
Populates Auth Core DB and Regional Physical Database Shards with real data,
computes real Haversine proximity distances, seeds ML price trajectories,
and establishes replica synchronization.
"""

import json
import sqlite3
import time
import math
from .database import init_all_databases, get_auth_db, get_shard_db, SHARD_PATHS
from .scraper_pipeline import RAW_SOCIETIES_DATA, generate_extracted_properties, generate_urban_facilities
from ..core.security import hash_password
from ..core.shard_router import shard_router
from ..ml.price_predictor import price_predictor

def _haversine(lat1, lon1, lat2, lon2):
    """Compute real Haversine distance in km between two GPS coordinates."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def _drive_time(distance_km):
    """Estimate drive time in minutes (urban speed ~35 km/h)."""
    return max(1, round((distance_km / 35.0) * 60))


def seed_auth_core():
    """Initialize Auth Core DB tables — NO pre-seeded accounts.
    All accounts are created at runtime via OTP signup flow.
    First registered user auto-becomes platform admin.
    """
    conn = get_auth_db()
    cursor = conn.cursor()

    # Ensure tables exist (database.py init_all_databases already creates them,
    # but we double-check here for safety)
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]

    conn.commit()
    conn.close()
    print(f"[SEED AUTH] Auth Core ready — {user_count} registered users (no demo accounts).")

def seed_regional_shards():
    properties = generate_extracted_properties()

    # Milestone templates for under-construction properties
    MILESTONE_TEMPLATES = [
        {"title": "Land Survey & Boundary Demarcation Complete", "offset_months": -18, "pct_offset": -40, "status": "Completed", "verified": True},
        {"title": "Underground Utilities & Sewerage Infrastructure", "offset_months": -12, "pct_offset": -30, "status": "Completed", "verified": True},
        {"title": "Main Boulevard Asphalt & Road Network Laying", "offset_months": -6, "pct_offset": -20, "status": "Completed", "verified": True},
        {"title": "Boundary Wall & Security Gate Construction", "offset_months": -3, "pct_offset": -10, "status": "Completed", "verified": True},
        {"title": "Sector Commercial Plaza Substructure", "offset_months": 2, "pct_offset": 5, "status": "In Progress", "verified": False},
        {"title": "Landscaping, Green Belt & Community Park", "offset_months": 6, "pct_offset": 15, "status": "Upcoming", "verified": False},
    ]
    MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    for city_key in ["karachi", "lahore", "islamabad"]:
        conn = get_shard_db(city_key, use_replica=False)
        cursor = conn.cursor()

        # 1. Seed Societies for this city
        city_societies = [s for s in RAW_SOCIETIES_DATA if s["city"] == city_key]
        for s in city_societies:
            cursor.execute("""
                INSERT OR REPLACE INTO societies 
                (id, name, city, type, tier, growth_rate_pct, avg_price_sqyd, facility_score, total_area_acres, developed_pct)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (s["id"], s["name"], s["city"], s["type"], s["tier"], s["growth_rate_pct"], s["avg_price_sqyd"], s["facility_score"], s["total_area_acres"], s["developed_pct"]))

        # 2. Seed Facilities for this city
        city_facilities = generate_urban_facilities(city_key)
        for fac in city_facilities:
            cursor.execute("""
                INSERT OR REPLACE INTO facilities (id, name, type, city, latitude, longitude, rating)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (fac["id"], fac["name"], fac["type"], fac["city"], fac["latitude"], fac["longitude"], fac["rating"]))

        # 3. Seed Properties for this city
        city_props = [p for p in properties if p["city"] == city_key]
        for prop in city_props:
            cursor.execute("""
                INSERT OR REPLACE INTO properties 
                (id, society_id, society_name, city, title, type, subtype, price, price_formatted, price_per_sqft, size, size_numeric, bedrooms, bathrooms, status, completion_status, completion_pct, featured, ai_investment_score, recommendation, confidence_pct, forecast_3yr_yield, description, images_json, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                prop["id"], prop["society_id"], prop["society_name"], prop["city"], prop["title"],
                prop["type"], prop["subtype"], prop["price"], prop["price_formatted"], prop["price_per_sqft"],
                prop["size"], prop["size_numeric"], prop["bedrooms"], prop["bathrooms"], prop["status"],
                prop["completion_status"], prop["completion_pct"], 1 if prop["featured"] else 0,
                prop["ai_investment_score"], prop["recommendation"], prop["confidence_pct"], prop["forecast_3yr_yield"],
                prop["description"], json.dumps(prop["images"]), prop["latitude"], prop["longitude"]
            ))

            # 4. Seed Government Lease Record
            noc = prop["noc"]
            cursor.execute("""
                INSERT OR REPLACE INTO government_records 
                (id, property_id, title, noc_number, issuing_authority, status_type, transfer_type, verification_date, is_verified, audit_notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                f"gov-{prop['id']}", prop["id"], noc["title"], noc["noc_number"], noc["issuing_authority"],
                noc["status_type"], noc["transfer_type"], noc["verification_date"], 1, noc["audit_notes"]
            ))

            # 5. ML 5-Year Price Trajectory
            soc = next((s for s in RAW_SOCIETIES_DATA if s["id"] == prop["society_id"]), RAW_SOCIETIES_DATA[0])
            annual_rate = soc["growth_rate_pct"] / 100.0
            pred = price_predictor.predict_price_trajectory(prop["price"], annual_rate, historical_years=4, forecast_years=3)
            
            for pt in pred["trajectory"]:
                cursor.execute("""
                    INSERT OR REPLACE INTO price_history (id, property_id, year_label, price, lower_bound, upper_bound, is_projection)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    f"ph-{prop['id']}-{pt['year'][:4]}", prop["id"], pt["year"], pt["price"],
                    pt.get("lower"), pt.get("upper"), 1 if pt["is_projection"] else 0
                ))

            # 6. REAL Haversine Proximity Records
            for fac in city_facilities:
                dist_km = _haversine(prop["latitude"], prop["longitude"], fac["latitude"], fac["longitude"])
                drive_min = _drive_time(dist_km)
                cursor.execute("""
                    INSERT OR REPLACE INTO property_facility_proximity 
                    (id, property_id, facility_id, facility_name, facility_type, distance_km, drive_time_min, rating)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    f"prox-{prop['id']}-{fac['id']}", prop["id"], fac["id"], fac["name"], fac["type"],
                    f"{dist_km} km", f"{drive_min} mins", fac["rating"]
                ))

            # 7. Multiple Progress Milestones for Under-Construction properties
            if prop["completion_pct"] < 100:
                current_pct = prop["completion_pct"]
                for m_idx, milestone in enumerate(MILESTONE_TEMPLATES):
                    m_pct = current_pct + milestone["pct_offset"]
                    if m_pct < 0:
                        m_pct = max(5, m_pct + 50)
                    if m_pct > 100:
                        continue
                    
                    # Calculate month offset from current (Aug 2026)
                    month_idx = (7 + milestone["offset_months"]) % 12  # Aug = index 7
                    year = 2026 if (7 + milestone["offset_months"]) >= 0 else 2025
                    if milestone["offset_months"] < -7:
                        year = 2025
                    report_date = f"{MONTH_NAMES[month_idx]} {year}"
                    
                    cursor.execute("""
                        INSERT OR REPLACE INTO progress_reports 
                        (id, property_id, society_id, title, report_date, completion_pct, status, verified_by_admin, verifier_stamp, photos_json)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        f"prog-{prop['id']}-{m_idx:02d}", prop["id"], prop["society_id"],
                        milestone["title"], report_date, min(100, max(0, m_pct)),
                        milestone["status"], 1 if milestone["verified"] else 0,
                        "Rihaish On-Ground Field Audit" if milestone["verified"] else "Pending Verification",
                        json.dumps(prop["images"][:2])
                    ))

        conn.commit()
        conn.close()

        # Execute physical replication copy to replica1
        shard_router.sync_replication(city_key)
        print(f"[SEED SHARD] {city_key} shard populated ({len(city_props)} properties) and replicated.")

def run_full_seeder():
    init_all_databases()
    seed_auth_core()
    seed_regional_shards()
    print(f"[SEED COMPLETE] All databases ready. Total properties: {len(generate_extracted_properties())}")

if __name__ == "__main__":
    run_full_seeder()
