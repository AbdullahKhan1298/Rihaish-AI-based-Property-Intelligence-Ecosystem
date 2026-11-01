from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List
from ..ml.investment_scorer import proximity_engine

router = APIRouter(prefix="/facilities", tags=["Facility Proximity Engine"])

class ProximityCalcRequest(BaseModel):
    property_lat: float
    property_lon: float
    facility_lat: float
    facility_lon: float

@router.post("/proximity")
def calculate_proximity(payload: ProximityCalcRequest) -> Dict[str, Any]:
    distance = proximity_engine.haversine_distance(
        payload.property_lat, payload.property_lon,
        payload.facility_lat, payload.facility_lon
    )
    drive_time = proximity_engine.estimate_drive_time_min(distance)
    return {
        "distance_km": distance,
        "estimated_drive_time_min": drive_time,
        "distance_formatted": f"{distance} km",
        "drive_time_formatted": f"{drive_time} mins"
    }
