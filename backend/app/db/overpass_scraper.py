"""
RIHAISH OpenStreetMap Overpass API Scraper
Fetches real facility data (schools, hospitals, mosques, malls, parks, etc.)
near each society's GPS coordinates using the free Overpass API.

Uses Haversine distance for real proximity calculation.
Rate-limited to respect Overpass API fair use policy.
"""

import json
import math
import time
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from urllib.request import urlopen, Request
from urllib.error import URLError

# Overpass API endpoint (free, no auth required)
OVERPASS_API = "https://overpass-api.de/api/interpreter"

# Cache directory
CACHE_DIR = Path(__file__).parent / "scraped_data" / "overpass"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Facility types to query
FACILITY_TYPES = [
    {"key": "amenity", "value": "school", "label": "School", "icon": "🏫"},
    {"key": "amenity", "value": "hospital", "label": "Hospital", "icon": "🏥"},
    {"key": "amenity", "value": "clinic", "label": "Medical Clinic", "icon": "⚕️"},
    {"key": "amenity", "value": "place_of_worship", "label": "Mosque/Worship", "icon": "🕌"},
    {"key": "amenity", "value": "bank", "label": "Bank/ATM", "icon": "🏦"},
    {"key": "amenity", "value": "fuel", "label": "Petrol Station", "icon": "⛽"},
    {"key": "amenity", "value": "pharmacy", "label": "Pharmacy", "icon": "💊"},
    {"key": "shop", "value": "supermarket", "label": "Supermarket", "icon": "🛒"},
    {"key": "shop", "value": "mall", "label": "Shopping Mall", "icon": "🏬"},
    {"key": "leisure", "value": "park", "label": "Park/Garden", "icon": "🌳"},
    {"key": "amenity", "value": "restaurant", "label": "Restaurant", "icon": "🍽️"},
    {"key": "highway", "value": "bus_stop", "label": "Bus Stop/Transport", "icon": "🚌"},
]


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Compute Haversine distance in km between two GPS coordinates."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


def drive_time_minutes(distance_km: float, speed_kmh: float = 35.0) -> int:
    """Estimate drive time in minutes at urban speed."""
    return max(1, round((distance_km / speed_kmh) * 60))


def query_overpass(lat: float, lon: float, radius_m: int = 5000, 
                   facility_key: str = "amenity", facility_value: str = "school") -> List[Dict]:
    """Queries Overpass API for facilities near a GPS coordinate.
    Returns list of facilities with name, lat, lon, distance.
    """
    # Check cache first
    cache_key = hashlib.md5(f"{lat:.4f}:{lon:.4f}:{facility_key}:{facility_value}:{radius_m}".encode()).hexdigest()
    cache_path = CACHE_DIR / f"{cache_key}.json"
    
    if cache_path.exists():
        age_days = (time.time() - cache_path.stat().st_mtime) / 86400
        if age_days < 15:
            with open(cache_path, "r") as f:
                return json.load(f)
    
    # Build Overpass QL query
    query = f"""
    [out:json][timeout:25];
    (
      node["{facility_key}"="{facility_value}"](around:{radius_m},{lat},{lon});
      way["{facility_key}"="{facility_value}"](around:{radius_m},{lat},{lon});
    );
    out center body;
    """
    
    try:
        encoded_query = query.encode("utf-8")
        req = Request(OVERPASS_API, data=b"data=" + encoded_query, 
                      headers={"Content-Type": "application/x-www-form-urlencoded"})
        
        with urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
        
        facilities = []
        for element in data.get("elements", []):
            # Get coordinates — nodes have lat/lon directly, ways have center
            f_lat = element.get("lat") or element.get("center", {}).get("lat")
            f_lon = element.get("lon") or element.get("center", {}).get("lon")
            
            if not f_lat or not f_lon:
                continue
            
            tags = element.get("tags", {})
            name = tags.get("name", tags.get("name:en", f"{facility_value.title()} (Unnamed)"))
            
            dist_km = haversine(lat, lon, f_lat, f_lon)
            
            facilities.append({
                "name": name,
                "type": facility_value,
                "lat": f_lat,
                "lon": f_lon,
                "distance_km": dist_km,
                "drive_time_min": drive_time_minutes(dist_km),
                "osm_id": element.get("id"),
            })
        
        # Sort by distance
        facilities.sort(key=lambda x: x["distance_km"])
        
        # Cache results
        with open(cache_path, "w") as f:
            json.dump(facilities, f, indent=2)
        
        return facilities
    
    except Exception as e:
        print(f"[OVERPASS] Query failed for ({lat:.4f}, {lon:.4f}) [{facility_key}={facility_value}]: {e}")
        return []


def fetch_all_facilities_for_location(lat: float, lon: float, radius_m: int = 5000,
                                       rate_limit_sec: float = 1.5) -> List[Dict]:
    """Fetches all facility types for a given GPS coordinate.
    Respects Overpass API rate limits (1 request per 1.5 seconds).
    Returns combined list of nearby facilities with real distances.
    """
    all_facilities = []
    
    for ftype in FACILITY_TYPES:
        facilities = query_overpass(lat, lon, radius_m, ftype["key"], ftype["value"])
        
        # Take top 3 nearest of each type
        for f in facilities[:3]:
            all_facilities.append({
                **f,
                "label": ftype["label"],
                "icon": ftype["icon"],
                "category": ftype["value"],
            })
        
        # Rate limit
        time.sleep(rate_limit_sec)
    
    # Sort all by distance
    all_facilities.sort(key=lambda x: x["distance_km"])
    
    print(f"[OVERPASS] Found {len(all_facilities)} facilities near ({lat:.4f}, {lon:.4f})")
    return all_facilities


def fetch_facilities_for_society(society_name: str, lat: float, lon: float) -> List[Dict]:
    """Fetches facilities for a specific society. Uses society-level caching."""
    cache_key = hashlib.md5(f"society:{society_name}:{lat:.4f}:{lon:.4f}".encode()).hexdigest()
    cache_path = CACHE_DIR / f"society_{cache_key}.json"
    
    if cache_path.exists():
        age_days = (time.time() - cache_path.stat().st_mtime) / 86400
        if age_days < 15:
            print(f"[OVERPASS] Using cached facilities for {society_name}")
            with open(cache_path, "r") as f:
                return json.load(f)
    
    print(f"[OVERPASS] Fetching real facilities for {society_name} ({lat:.4f}, {lon:.4f})")
    facilities = fetch_all_facilities_for_location(lat, lon)
    
    # Cache
    with open(cache_path, "w") as f:
        json.dump(facilities, f, indent=2)
    
    return facilities


def compute_facility_score(facilities: List[Dict]) -> float:
    """Computes a 0-10 facility proximity score based on real distances.
    Scoring: closer facilities = higher score, more variety = bonus.
    """
    if not facilities:
        return 5.0
    
    # Category coverage bonus
    categories = set(f["category"] for f in facilities)
    coverage_bonus = min(len(categories) / len(FACILITY_TYPES), 1.0) * 2.0
    
    # Distance score: average of inverse distances (closer = better)
    avg_distance = sum(f["distance_km"] for f in facilities) / len(facilities)
    distance_score = max(0, 8.0 - (avg_distance * 1.5))
    
    # Combine
    score = min(10.0, distance_score + coverage_bonus)
    return round(score, 1)
