import json
import time
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any, Literal
from ..db.catalog import search_catalog
from ..core.shard_router import shard_router

router = APIRouter(prefix="/properties", tags=["Properties & Sharded Directory"])

def format_property_row(row, cursor, related=None) -> Dict[str, Any]:
    prop = dict(row)
    prop["images"] = json.loads(prop.get("images_json") or "[]")
    prop["featured"] = bool(prop.get("featured", 0))

    # Fetch Government Record
    if related is None:
        cursor.execute("SELECT * FROM government_records WHERE property_id = ?", (prop["id"],))
        gov = cursor.fetchone()
    else:
        gov_rows = related['government_records'].get(prop['id'], [])
        gov = gov_rows[0] if gov_rows else None
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
        prop["leaseStatus"] = {"verified": False, "title": "Verification unavailable", "statusType": "Unverified"}

    # Fetch Price History
    if related is None:
        cursor.execute("SELECT * FROM price_history WHERE property_id = ? ORDER BY id ASC", (prop["id"],))
        ph_rows = cursor.fetchall()
    else:
        ph_rows = related['price_history'].get(prop['id'], [])
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

    # Fetch Proximity Facilities
    if related is None:
        cursor.execute("SELECT * FROM property_facility_proximity WHERE property_id = ?", (prop["id"],))
        prox_rows = cursor.fetchall()
    else:
        prox_rows = related['property_facility_proximity'].get(prop['id'], [])
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

    # Fetch Construction Milestones
    if related is None:
        cursor.execute("SELECT * FROM progress_reports WHERE property_id = ?", (prop["id"],))
        prog_rows = cursor.fetchall()
    else:
        prog_rows = related['progress_reports'].get(prop['id'], [])
    prop["constructionMilestones"] = [
        {
            "title": pr["title"],
            "date": pr["report_date"],
            "pct": pr["completion_pct"],
            "status": pr["status"],
            "verifiedByAdmin": bool(pr["verified_by_admin"])
        }
        for pr in prog_rows
    ]

    return prop


def prefetch_details(conn, ids):
    tables = ('government_records', 'price_history', 'property_facility_proximity', 'progress_reports')
    slots = ','.join('?' for _ in ids)
    statements = [[f'SELECT * FROM {table} WHERE property_id IN ({slots})' + (' ORDER BY id ASC' if table == 'price_history' else ''), *ids] for table in tables]
    if hasattr(conn, 'query_many'):
        batches = conn.query_many(statements)
    else:
        batches = [[dict(row) for row in conn.execute(s[0], s[1:]).fetchall()] for s in statements]
    grouped = {}
    for table, records in zip(tables, batches):
        grouped[table] = {}
        for record in records:
            grouped[table].setdefault(record['property_id'], []).append(record)
    return grouped

@router.get("/")
def get_properties(
    city: Optional[str] = None,
    society: Optional[str] = None,
    type: Optional[str] = None,
    max_price: Optional[float] = None,
    verified_only: Optional[bool] = False,
    min_ai_score: Optional[float] = None,
    min_price: Optional[float] = Query(None, ge=0),
    q: Optional[str] = Query(None, max_length=200),
    sort: Literal['score_desc', 'price_asc', 'price_desc', 'newest'] = 'score_desc',
    page: int = Query(1, ge=1),
    page_size: Optional[int] = Query(None, ge=1, le=100)
) -> Dict[str, Any]:
    """Queries physical regional shard databases with dynamic SQL filter execution."""
    start_time = time.time()
    results = []
    routed_shard_id = "shard-multi"

    target_cities = ["karachi", "lahore", "islamabad"] if (not city or city.lower() == "all") else [city.lower()]

    if any(c not in ('karachi', 'lahore', 'islamabad', 'rawalpindi') for c in target_cities):
        raise HTTPException(422, 'Unsupported city')
    target_cities = ['islamabad' if c == 'rawalpindi' else c for c in target_cities]
    if page > 1 and page_size is None:
        raise HTTPException(422, 'page_size is required when requesting another page')
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(422, 'min_price must not exceed max_price')
    try:
        total, rows = search_catalog(target_cities, society, type, max_price, min_price,
                                     min_ai_score, verified_only, q, sort, page, page_size)
        connections, details = {}, {}
        try:
            for city_key in target_cities:
                ids = [r['id'] for r in rows if r['_city'] == city_key]
                if ids:
                    connections[city_key] = shard_router.get_connection(city_key, read_only=False)
                    details[city_key] = prefetch_details(connections[city_key], ids)
            for row in rows:
                city_key = row.pop('_city')
                row.pop('_verified', None)
                results.append(format_property_row(row, connections[city_key].cursor(), details[city_key]))
        finally:
            for connection in connections.values():
                connection.close()
    except Exception as exc:
        raise HTTPException(503, 'Property database unavailable; partial results were not returned') from exc

    if len(target_cities) == 1:
        routed_shard_id = shard_router.get_shard_id_for_city(target_cities[0])
    
    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    state = shard_router.node_states.get(routed_shard_id, {"primary_status": "ONLINE (HEALTHY)"})

    return {
        "count": len(results),
        "total": total,
        "page": page,
        "page_size": page_size,
        "results": results,
        "routed_shard": routed_shard_id,
        "shard_status": state.get("primary_status", "ONLINE"),
        "query_latency_ms": elapsed_ms
    }

@router.get("/{property_id}")
def get_property_by_id(property_id: str) -> Dict[str, Any]:
    """Finds single property across regional database shards."""
    for c in ["islamabad", "karachi", "lahore"]:
        try:
            conn = shard_router.get_connection(c, read_only=True)
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM properties WHERE id = ?", (property_id,))
            row = cursor.fetchone()
            if row:
                prop = format_property_row(row, cursor)
                conn.close()
                shard_id = shard_router.get_shard_id_for_city(c)
                return {
                    "property": prop,
                    "routed_shard": shard_id,
                    "primary_node": shard_router.node_states[shard_id]["primary_file"]
                }
            conn.close()
        except Exception:
            pass

    raise HTTPException(status_code=404, detail=f"Property with ID '{property_id}' not found in any regional shard.")
