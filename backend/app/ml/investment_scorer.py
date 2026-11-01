"""
RIHAISH AI Investment Scoring Engine & Proximity Model
Derives composite score (0-10) weighted across:
1. Facility Proximity Index (0.25)
2. Historical Growth Rate & Infrastructure Velocity (0.35)
3. Society Completion & Construction Milestones (0.20)
4. Legal / Government Lease Risk Weighting (0.20)
"""

from typing import Dict, Any, List
import math

class InvestmentScorer:
    def calculate_score(
        self,
        facility_score: float,
        annual_growth_rate: float,
        completion_pct: float,
        lease_verified: bool
    ) -> Dict[str, Any]:
        # Normalize inputs (0-10 scale)
        loc_score = min(10.0, facility_score)
        growth_score = min(10.0, (annual_growth_rate * 100) / 3.5)
        dev_score = min(10.0, completion_pct / 10.0)
        legal_score = 9.8 if lease_verified else 5.0

        # Composite weighted formula
        composite = (
            (loc_score * 0.25) +
            (growth_score * 0.35) +
            (dev_score * 0.20) +
            (legal_score * 0.20)
        )

        composite_rounded = round(composite, 1)

        return {
            "overall_ai_score": composite_rounded,
            "breakdown": {
                "location_facility_score": round(loc_score, 1),
                "growth_velocity_score": round(growth_score, 1),
                "completion_score": round(dev_score, 1),
                "legal_safety_score": round(legal_score, 1)
            },
            "rating_label": "High Growth Potential" if composite_rounded >= 9.0 else "Stable Investment" if composite_rounded >= 8.0 else "Moderate"
        }

class ProximityEngine:
    """Geospatial distance and travel time calculation using Haversine formula."""
    
    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0 # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(R * c, 2)

    @staticmethod
    def estimate_drive_time_min(distance_km: float, is_urban: bool = True) -> int:
        avg_speed_kmh = 35.0 if is_urban else 60.0 # Urban traffic speed estimate
        hours = distance_km / avg_speed_kmh
        return max(1, round(hours * 60))

investment_scorer = InvestmentScorer()
proximity_engine = ProximityEngine()
