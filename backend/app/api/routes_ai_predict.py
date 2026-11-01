"""
RIHAISH AI & Machine Learning Prediction API — Production Grade
Property-level predictions, market trends, and society comparison analytics.
Uses real data from shard databases to compute forecasts.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from ..ml.price_predictor import price_predictor
from ..ml.investment_scorer import investment_scorer, proximity_engine
from ..core.shard_router import shard_router
from ..core.security import get_current_user_optional
from ..db.database import get_shard_db

router = APIRouter(prefix="/predict", tags=["AI & Machine Learning Engines"])

class PricePredictionRequest(BaseModel):
    base_price: float
    annual_growth_rate: float
    horizon_years: Optional[int] = 3

class InvestmentScoreRequest(BaseModel):
    facility_score: float
    annual_growth_rate: float
    completion_pct: float
    lease_verified: bool


@router.post("/price")
def predict_price_endpoint(payload: PricePredictionRequest) -> Dict[str, Any]:
    """Generic price trajectory prediction from inputs."""
    return price_predictor.predict_price_trajectory(
        base_price=payload.base_price,
        annual_growth_rate=payload.annual_growth_rate,
        forecast_years=payload.horizon_years
    )

@router.post("/score")
def calculate_score_endpoint(payload: InvestmentScoreRequest) -> Dict[str, Any]:
    """Generic investment score calculation from inputs."""
    return investment_scorer.calculate_score(
        facility_score=payload.facility_score,
        annual_growth_rate=payload.annual_growth_rate,
        completion_pct=payload.completion_pct,
        lease_verified=payload.lease_verified
    )


@router.get("/property/{property_id}")
def predict_property(property_id: str) -> Dict[str, Any]:
    """Runs the AI model on a specific property and returns full analysis."""
    from ..db.scraper_pipeline import RAW_SOCIETIES_DATA

    for city_key in ["karachi", "lahore", "islamabad"]:
        try:
            conn = get_shard_db(city_key, use_replica=True)
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM properties WHERE id = ?", (property_id,))
            prop = cursor.fetchone()
            if not prop:
                conn.close()
                continue

            prop = dict(prop)

            # Find society data
            soc = next((s for s in RAW_SOCIETIES_DATA if s["id"] == prop["society_id"]), None)
            if not soc:
                conn.close()
                continue

            annual_rate = soc["growth_rate_pct"] / 100.0

            # 5-Year Price Trajectory
            trajectory = price_predictor.predict_price_trajectory(
                base_price=prop["price"],
                annual_growth_rate=annual_rate,
                historical_years=4,
                forecast_years=5
            )

            # Investment Score
            score = investment_scorer.calculate_score(
                facility_score=soc["facility_score"],
                annual_growth_rate=annual_rate,
                completion_pct=soc["developed_pct"],
                lease_verified=True
            )

            # Facility proximity summary
            cursor.execute("""
                SELECT facility_name, facility_type, distance_km, drive_time_min, rating
                FROM property_facility_proximity WHERE property_id = ?
                ORDER BY CAST(REPLACE(distance_km, ' km', '') AS REAL) ASC LIMIT 10
            """, (property_id,))
            facilities = [dict(r) for r in cursor.fetchall()]

            conn.close()

            return {
                "property_id": property_id,
                "property_title": prop["title"],
                "society": soc["name"],
                "city": prop["city"],
                "current_price": prop["price"],
                "current_price_formatted": prop["price_formatted"],
                "growth_rate_pct": soc["growth_rate_pct"],
                "ai_trajectory": trajectory,
                "ai_score": score,
                "nearest_facilities": facilities,
                "market_position": {
                    "society_tier": soc["tier"],
                    "society_type": soc["type"],
                    "developed_pct": soc["developed_pct"],
                    "avg_price_sqyd": soc["avg_price_sqyd"]
                }
            }
        except Exception as e:
            print(f"[AI PREDICT ERROR] {city_key}: {e}")

    raise HTTPException(status_code=404, detail=f"Property '{property_id}' not found.")


@router.get("/market-trend/{city}")
def get_market_trend(city: str) -> Dict[str, Any]:
    """Returns city-wide market trend analysis aggregated across societies."""
    from ..db.scraper_pipeline import RAW_SOCIETIES_DATA

    city_key = "karachi" if "karachi" in city.lower() else "lahore" if "lahore" in city.lower() else "islamabad"
    city_societies = [s for s in RAW_SOCIETIES_DATA if s["city"] == city_key]

    if not city_societies:
        raise HTTPException(status_code=404, detail=f"No societies found for city '{city}'")

    # Compute aggregate metrics
    avg_growth = sum(s["growth_rate_pct"] for s in city_societies) / len(city_societies)
    avg_price_sqyd = sum(s["avg_price_sqyd"] for s in city_societies) / len(city_societies)
    avg_facility = sum(s["facility_score"] for s in city_societies) / len(city_societies)
    avg_developed = sum(s["developed_pct"] for s in city_societies) / len(city_societies)

    # Get total property count from shard
    total_listings = 0
    try:
        conn = get_shard_db(city_key, use_replica=True)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as cnt FROM properties")
        total_listings = cursor.fetchone()["cnt"]
        conn.close()
    except Exception:
        pass

    # Society-level breakdown
    society_breakdown = []
    for s in city_societies:
        trajectory = price_predictor.predict_price_trajectory(
            base_price=s["avg_price_sqyd"] * 200,  # avg 200 sqyd plot
            annual_growth_rate=s["growth_rate_pct"] / 100.0,
            forecast_years=3
        )
        society_breakdown.append({
            "id": s["id"],
            "name": s["name"],
            "tier": s["tier"],
            "type": s["type"],
            "growth_rate_pct": s["growth_rate_pct"],
            "avg_price_sqyd": s["avg_price_sqyd"],
            "facility_score": s["facility_score"],
            "developed_pct": s["developed_pct"],
            "recommendation": trajectory["recommendation"],
            "projected_3yr_yield": trajectory["total_yield_pct"]
        })

    # Sort by growth rate desc
    society_breakdown.sort(key=lambda x: x["growth_rate_pct"], reverse=True)

    return {
        "city": city_key,
        "total_societies": len(city_societies),
        "total_listings": total_listings,
        "aggregate_metrics": {
            "avg_growth_rate_pct": round(avg_growth, 1),
            "avg_price_per_sqyd": round(avg_price_sqyd),
            "avg_facility_score": round(avg_facility, 1),
            "avg_developed_pct": round(avg_developed, 1)
        },
        "market_sentiment": "BULLISH" if avg_growth > 22 else "GROWING" if avg_growth > 16 else "STABLE",
        "society_breakdown": society_breakdown
    }


@router.get("/society-comparison")
def society_comparison() -> Dict[str, Any]:
    """Comparative matrix across all 18 societies for investment analysis."""
    from ..db.scraper_pipeline import RAW_SOCIETIES_DATA

    comparison = []
    for s in RAW_SOCIETIES_DATA:
        score = investment_scorer.calculate_score(
            facility_score=s["facility_score"],
            annual_growth_rate=s["growth_rate_pct"] / 100.0,
            completion_pct=s["developed_pct"],
            lease_verified=True
        )
        trajectory = price_predictor.predict_price_trajectory(
            base_price=s["avg_price_sqyd"] * 200,
            annual_growth_rate=s["growth_rate_pct"] / 100.0,
            forecast_years=3
        )
        comparison.append({
            "id": s["id"],
            "name": s["name"],
            "city": s["city"],
            "tier": s["tier"],
            "type": s["type"],
            "growth_rate_pct": s["growth_rate_pct"],
            "avg_price_sqyd": s["avg_price_sqyd"],
            "facility_score": s["facility_score"],
            "developed_pct": s["developed_pct"],
            "ai_score": score["overall_ai_score"],
            "recommendation": trajectory["recommendation"],
            "projected_3yr_yield": trajectory["total_yield_pct"],
            "rating_label": score["rating_label"]
        })

    # Sort by AI score descending
    comparison.sort(key=lambda x: x["ai_score"], reverse=True)

    return {
        "total_societies": len(comparison),
        "comparison_matrix": comparison,
        "top_pick": comparison[0] if comparison else None,
        "analysis_timestamp": __import__("time").strftime("%Y-%m-%d %H:%M:%S")
    }
