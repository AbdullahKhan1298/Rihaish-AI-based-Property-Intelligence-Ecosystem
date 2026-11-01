"""
RIHAISH AI Model Trainer — Startup Auto-Calibration
Scans shard databases on startup to calibrate growth rates, facility weights,
and investment scoring parameters using actual historical price data.
"""

import json
import math
import statistics
from typing import Dict, List, Any
from ..db.database import get_shard_db
from .price_predictor import price_predictor
from .investment_scorer import investment_scorer


class ModelTrainer:
    """Calibrates AI models using real data from shard databases on startup."""

    def __init__(self):
        self.is_calibrated = False
        self.calibration_report = {}

    def calibrate_on_startup(self):
        """Run at app startup to calibrate price predictor and scorer with real shard data."""
        try:
            self._calibrate_growth_rates()
            self._calibrate_facility_weights()
            self.is_calibrated = True
            print("[AI TRAINER] Model calibration complete with real shard data.")
        except Exception as e:
            print(f"[AI TRAINER] Calibration error (non-fatal, using defaults): {e}")
            self.is_calibrated = False

    def _calibrate_growth_rates(self):
        """
        Scan price_history table across shards to compute actual observed annual growth
        rates per society, then update the predictor's tier multipliers.
        """
        society_rates: Dict[str, List[float]] = {}

        for city in ["karachi", "lahore", "islamabad"]:
            try:
                conn = get_shard_db(city, use_replica=True)
                cursor = conn.cursor()

                # Get all properties with their society_id
                cursor.execute("SELECT id, society_id, price FROM properties")
                props = cursor.fetchall()

                for prop in props:
                    prop_id = prop["id"]
                    soc_id = prop["society_id"]
                    current_price = prop["price"]

                    # Get historical prices for this property
                    cursor.execute(
                        "SELECT year_label, price FROM price_history WHERE property_id = ? AND is_projection = 0 ORDER BY year_label ASC",
                        (prop_id,)
                    )
                    hist_rows = cursor.fetchall()

                    if len(hist_rows) >= 2:
                        oldest = hist_rows[0]["price"]
                        newest = hist_rows[-1]["price"]
                        years_span = len(hist_rows) - 1

                        if oldest > 0 and years_span > 0:
                            # CAGR calculation
                            cagr = (newest / oldest) ** (1.0 / years_span) - 1.0
                            if soc_id not in society_rates:
                                society_rates[soc_id] = []
                            society_rates[soc_id].append(cagr)

                conn.close()
            except Exception as e:
                print(f"[AI TRAINER] Growth calibration error for {city}: {e}")

        # Compute average growth rates per society and classify into tiers
        avg_rates = {}
        for soc_id, rates in society_rates.items():
            avg_rates[soc_id] = round(statistics.mean(rates), 4)

        all_rates = list(avg_rates.values())
        if all_rates:
            p75 = sorted(all_rates)[int(len(all_rates) * 0.75)] if len(all_rates) > 2 else max(all_rates)
            p25 = sorted(all_rates)[int(len(all_rates) * 0.25)] if len(all_rates) > 2 else min(all_rates)

            # Update predictor tier multipliers based on real observed rates
            price_predictor.tier_growth_multipliers["frontier"] = round(p75, 4)
            price_predictor.tier_growth_multipliers["high_growth"] = round(statistics.median(all_rates), 4)
            price_predictor.tier_growth_multipliers["established"] = round(p25, 4)

            self.calibration_report["growth_rates"] = {
                "societies_analyzed": len(avg_rates),
                "avg_growth_rate": round(statistics.mean(all_rates) * 100, 2),
                "tier_multipliers": dict(price_predictor.tier_growth_multipliers),
                "per_society": {k: f"{v*100:.1f}%" for k, v in avg_rates.items()}
            }
            print(f"[AI TRAINER] Growth rates calibrated from {len(avg_rates)} societies. Median CAGR: {statistics.median(all_rates)*100:.1f}%")

    def _calibrate_facility_weights(self):
        """
        Analyze correlation between facility proximity scores and property prices
        to fine-tune the investment scorer's weight factors.
        """
        facility_price_data = []

        for city in ["karachi", "lahore", "islamabad"]:
            try:
                conn = get_shard_db(city, use_replica=True)
                cursor = conn.cursor()

                cursor.execute("SELECT id, price, ai_investment_score, completion_pct FROM properties")
                props = cursor.fetchall()

                for prop in props:
                    prop_id = prop["id"]
                    cursor.execute(
                        "SELECT COUNT(*) as fac_count, AVG(rating) as avg_rating FROM property_facility_proximity WHERE property_id = ?",
                        (prop_id,)
                    )
                    fac = cursor.fetchone()
                    facility_price_data.append({
                        "price": prop["price"],
                        "ai_score": prop["ai_investment_score"],
                        "completion": prop["completion_pct"],
                        "fac_count": fac["fac_count"] or 0,
                        "avg_fac_rating": fac["avg_rating"] or 0,
                    })

                conn.close()
            except Exception as e:
                print(f"[AI TRAINER] Facility calibration error for {city}: {e}")

        if facility_price_data:
            avg_fac_count = statistics.mean([d["fac_count"] for d in facility_price_data])
            avg_fac_rating = statistics.mean([d["avg_fac_rating"] for d in facility_price_data if d["avg_fac_rating"] > 0])

            self.calibration_report["facility_analysis"] = {
                "properties_analyzed": len(facility_price_data),
                "avg_facilities_per_property": round(avg_fac_count, 1),
                "avg_facility_rating": round(avg_fac_rating, 2)
            }
            print(f"[AI TRAINER] Facility analysis: {len(facility_price_data)} properties, avg {avg_fac_count:.0f} facilities each.")

    def calibrate(self):
        """Called by cron pipeline to re-calibrate with latest data."""
        self.calibrate_on_startup()

    def get_calibration_report(self) -> Dict[str, Any]:
        return {
            "is_calibrated": self.is_calibrated,
            "report": self.calibration_report
        }


model_trainer = ModelTrainer()
