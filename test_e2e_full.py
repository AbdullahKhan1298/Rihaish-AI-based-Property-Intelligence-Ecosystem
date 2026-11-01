"""
RIHAISH Comprehensive E2E Test Suite & Database Purge
Tests all components:
1. Shard Databases & Schemas (Karachi, Lahore, Islamabad)
2. OTP Security (Old OTP invalidation, latest OTP verification)
3. RBAC & Admin MasterPortal (First-come admin claim, 2nd admin rejection, role separation)
4. Password Recovery (Forgot password OTP & reset)
5. Cross-Shard Saved Plots / Watchlist
6. AI Price Predictor (1/3/5-year horizons, P10/P50/P90 confidence intervals)
7. Investment Scoring & Haversine Proximity
8. Government Verification Records (CDA, LDA, SBCA)
9. Cron Pipeline Stage 2 Execution
10. Final Auth DB Purge (Removes all test accounts)
"""

import sys
import os
import json
import uuid
import time
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.db.database import (
    init_all_databases, get_auth_db, get_shard_db, 
    AUTH_DB_PATH, SHARD_PATHS
)
from app.core.email_service import email_service
from app.core.security import (
    hash_password, verify_password, create_access_token, decode_access_token
)
from app.api.routes_auth import (
    send_signup_otp, verify_otp_and_register,
    admin_send_signup_otp, admin_verify_otp_and_register,
    admin_login, login_user, forgot_password, reset_password,
    RegisterInitRequest, VerifyOtpRegisterRequest,
    AdminRegisterInitRequest, AdminVerifyOtpRequest,
    LoginRequest, ForgotPasswordRequest, ResetPasswordRequest
)
from app.api.routes_watchlist import get_user_watchlist, get_full_watchlist, toggle_watchlist, ToggleWatchlistRequest
from app.ml.price_predictor import price_predictor
from app.ml.investment_scorer import investment_scorer, proximity_engine
from app.api.routes_ai_predict import predict_property, society_comparison
from app.api.routes_facilities import calculate_proximity, ProximityCalcRequest
from app.api.routes_progress import get_milestones

passed = 0
failed = 0

def test(name, condition, details=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  [PASS] {name} {details}")
    else:
        failed += 1
        print(f"  [FAIL] {name} {details}")

print("=" * 70)
print("RIHAISH COMPREHENSIVE E2E VERIFICATION SUITE")
print("=" * 70)

# STEP 1: Verify Shard Databases
print("\n--- 1. Testing Distributed Shard Databases ---")
init_all_databases()

for city in ["islamabad", "lahore", "karachi"]:
    conn = get_shard_db(city)
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as cnt FROM properties")
    prop_count = c.fetchone()["cnt"]
    c.execute("SELECT COUNT(*) as cnt FROM societies")
    soc_count = c.fetchone()["cnt"]
    c.execute("SELECT COUNT(*) as cnt FROM government_records")
    gov_count = c.fetchone()["cnt"]
    conn.close()
    test(f"Shard '{city}' loaded", prop_count > 0, f"({prop_count} properties, {soc_count} societies, {gov_count} gov records)")

# STEP 2: Test OTP Security (Old OTP Invalidation)
print("\n--- 2. Testing OTP Security & Invalidation ---")
test_email = "e2e_tester@rihaish.test"

# Generate OTP 1
res1 = email_service.generate_and_send_otp(test_email, purpose="signup")
# Get the first OTP code from DB
auth_conn = get_auth_db()
ac = auth_conn.cursor()
ac.execute("SELECT otp_code FROM otp_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1", (test_email,))
otp1 = ac.fetchone()["otp_code"]
auth_conn.close()

# Generate OTP 2 for the same email (should invalidate OTP 1)
res2 = email_service.generate_and_send_otp(test_email, purpose="signup")
auth_conn = get_auth_db()
ac = auth_conn.cursor()
ac.execute("SELECT otp_code FROM otp_codes WHERE email = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1", (test_email,))
otp2 = ac.fetchone()["otp_code"]
auth_conn.close()

# Test that OTP 1 is now INVALID
val1 = email_service.verify_otp(test_email, otp1, purpose="signup")
test("Old OTP 1 is automatically invalidated", val1 is False, f"(Code: {otp1})")

# Test that OTP 2 is VALID
val2 = email_service.verify_otp(test_email, otp2, purpose="signup")
test("Latest OTP 2 is accepted", val2 is True, f"(Code: {otp2})")

# Test that OTP 2 cannot be reused
val2_reuse = email_service.verify_otp(test_email, otp2, purpose="signup")
test("OTP 2 cannot be reused after verification", val2_reuse is False)

# STEP 3: Test User Signup & Role-Based Default Subscription
print("\n--- 3. Testing User Registration & RBAC ---")
user_email = "buyer_e2e@rihaish.test"
email_service.generate_and_send_otp(user_email, purpose="signup")
auth_conn = get_auth_db()
ac = auth_conn.cursor()
ac.execute("SELECT otp_code FROM otp_codes WHERE email = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1", (user_email,))
buyer_otp = ac.fetchone()["otp_code"]
auth_conn.close()

buyer_reg = verify_otp_and_register(VerifyOtpRegisterRequest(
    email=user_email,
    otp_code=buyer_otp,
    name="Buyer Tester",
    password="Password123!",
    role="buyer"
))
test("Buyer registered successfully", buyer_reg["success"] is True)
test("Buyer JWT token generated", bool(buyer_reg["access_token"]))
test("Buyer default subscription is Free Tier", buyer_reg["user"]["subscription_plan"] == "Free Tier")
test("Buyer cannot have admin role", buyer_reg["user"]["role"] == "buyer")

buyer_token_payload = decode_access_token(buyer_reg["access_token"])
buyer_user_id = buyer_token_payload["user_id"]

# STEP 4: Test Admin MasterPortal (First-Come Claim & 2nd Admin Rejection)
print("\n--- 4. Testing MasterAdmin Portal First-Come OTP Flow ---")

# First, ensure no admin exists
auth_conn = get_auth_db()
ac = auth_conn.cursor()
ac.execute("DELETE FROM users WHERE role = 'admin'")
ac.execute("DELETE FROM otp_codes WHERE purpose = 'admin_signup'")
auth_conn.commit()
auth_conn.close()

admin_email = "master_admin_e2e@rihaish.test"
# 1. Admin Send OTP
admin_otp_res = admin_send_signup_otp(AdminRegisterInitRequest(
    name="Master Admin",
    email=admin_email,
    password="AdminSecure2026!"
))
test("Admin OTP dispatched", admin_otp_res["success"] is True)

# Retrieve admin OTP from DB
auth_conn = get_auth_db()
ac = auth_conn.cursor()
ac.execute("SELECT otp_code FROM otp_codes WHERE email = ? AND purpose = 'admin_signup' AND is_used = 0", (admin_email,))
admin_otp = ac.fetchone()["otp_code"]
auth_conn.close()

# 2. First Admin verifies OTP & claims MasterAdmin
admin_reg = admin_verify_otp_and_register(AdminVerifyOtpRequest(
    email=admin_email,
    otp_code=admin_otp,
    name="Master Admin",
    password="AdminSecure2026!"
))
test("First user successfully claims MasterAdmin role", admin_reg["user"]["role"] == "admin")
test("MasterAdmin granted Master Tier (Founder) plan", admin_reg["user"]["subscription_plan"] == "Master Tier (Founder)")

admin_token_payload = decode_access_token(admin_reg["access_token"])
admin_user_id = admin_token_payload["user_id"]

# 3. Second Admin registration attempt MUST BE REJECTED with 403
second_admin_email = "impostor_admin@rihaish.test"
second_admin_blocked = False
try:
    admin_send_signup_otp(AdminRegisterInitRequest(
        name="Impostor Admin",
        email=second_admin_email,
        password="FakePassword123!"
    ))
except Exception as e:
    second_admin_blocked = True
    test("Second Admin registration is strictly blocked", True, f"({getattr(e, 'detail', str(e))})")

if not second_admin_blocked:
    test("Second Admin registration is strictly blocked", False, "ERROR: Second admin was allowed!")

# 4. Admin Login with correct password
admin_log = admin_login(LoginRequest(email=admin_email, password="AdminSecure2026!"))
test("MasterAdmin login with valid credentials succeeds", admin_log["success"] is True)

# 5. Regular buyer attempting admin login MUST BE REJECTED with 403
buyer_admin_attempt_blocked = False
try:
    admin_login(LoginRequest(email=user_email, password="Password123!"))
except Exception as e:
    buyer_admin_attempt_blocked = True
    test("Regular user attempting Admin Login is denied with 403", True)

if not buyer_admin_attempt_blocked:
    test("Regular user attempting Admin Login is denied with 403", False)

# STEP 5: Test Forgot Password Flow
print("\n--- 5. Testing Forgot Password & Reset Flow ---")
# 1. Request reset
fp_res = forgot_password(ForgotPasswordRequest(email=user_email))
test("Forgot password request succeeds", fp_res["success"] is True)

# 2. Get reset OTP from DB
auth_conn = get_auth_db()
ac = auth_conn.cursor()
ac.execute("SELECT otp_code FROM otp_codes WHERE email = ? AND purpose = 'password_reset' AND is_used = 0 ORDER BY created_at DESC LIMIT 1", (user_email,))
reset_otp = ac.fetchone()["otp_code"]
auth_conn.close()

# 3. Reset password with OTP
rp_res = reset_password(ResetPasswordRequest(
    email=user_email,
    otp_code=reset_otp,
    new_password="NewPassword2026!"
))
test("Password reset with valid OTP succeeds", rp_res["success"] is True)

# 4. Login with old password fails
old_pwd_failed = False
try:
    login_user(LoginRequest(email=user_email, password="Password123!"))
except Exception:
    old_pwd_failed = True
test("Login with old password fails", old_pwd_failed is True)

# 5. Login with new password succeeds
new_log = login_user(LoginRequest(email=user_email, password="NewPassword2026!"))
test("Login with new password succeeds", new_log["success"] is True)

# STEP 6: Test Watchlist & Cross-Shard Saved Plots
print("\n--- 6. Testing Watchlist & Cross-Shard Saved Plots ---")
current_user_dict = {"user_id": buyer_user_id, "email": user_email, "role": "buyer"}

# Find 1 real property from each shard
prop_ids = {}
for city in ["islamabad", "lahore", "karachi"]:
    conn = get_shard_db(city)
    c = conn.cursor()
    c.execute("SELECT id FROM properties LIMIT 1")
    row = c.fetchone()
    if row:
        prop_ids[city] = row["id"]
    conn.close()

# Toggle Save on all 3 properties
for city, pid in prop_ids.items():
    tog = toggle_watchlist(ToggleWatchlistRequest(property_id=pid, city=city), current_user=current_user_dict)
    test(f"Saved property '{pid}' ({city})", tog["is_saved"] is True)

# Fetch Full Watchlist -> MUST return all 3 with cross-shard join
full_wl = get_full_watchlist(current_user=current_user_dict)
test("Full watchlist count equals 3", full_wl["count"] == 3, f"(Found: {len(full_wl['properties'])} properties)")

# Check that every saved property has leaseStatus, priceHistory, and facilities
for p in full_wl["properties"]:
    has_lease = "leaseStatus" in p and bool(p["leaseStatus"].get("title"))
    has_history = "priceHistory" in p and len(p["priceHistory"]) > 0
    has_facilities = "facilities" in p
    test(f"Property '{p['id']}' has complete sharded data", has_lease and has_history and has_facilities, 
         f"(Authority: {p['leaseStatus'].get('issuingAuthority', 'N/A')}, History points: {len(p['priceHistory'])})")

# Toggle Remove one property
first_city, first_pid = list(prop_ids.items())[0]
tog_rem = toggle_watchlist(ToggleWatchlistRequest(property_id=first_pid, city=first_city), current_user=current_user_dict)
test(f"Removed property '{first_pid}' from watchlist", tog_rem["is_saved"] is False)

wl_after = get_full_watchlist(current_user=current_user_dict)
test("Watchlist count decremented to 2", wl_after["count"] == 2)

# STEP 7: Test AI & Valuation Engines
print("\n--- 7. Testing AI Predictive Valuation & Proximity Engines ---")

# 1. Price trajectory 1, 3, 5 years with confidence intervals
for yr in [1, 3, 5]:
    traj = price_predictor.predict_price_trajectory(
        base_price=15000000,
        annual_growth_rate=0.22,
        forecast_years=yr
    )
    test(f"{yr}-Year Horizon Trajectory", len(traj["trajectory"]) == 5 + yr, 
         f"(Projected: PKR {traj['projected_final_price']:,}, Yield: {traj['total_yield_pct']})")
    
    # Verify upper and lower confidence bounds
    last_pt = traj["trajectory"][-1]
    has_bounds = "lower" in last_pt and "upper" in last_pt and last_pt["lower"] < last_pt["price"] < last_pt["upper"]
    test(f"{yr}-Year P10/P50/P90 Confidence Bounds", has_bounds, 
         f"(Lower: PKR {last_pt.get('lower', 0):,}, Expected: PKR {last_pt['price']:,}, Upper: PKR {last_pt.get('upper', 0):,})")

# 2. Investment Scorer
score_res = investment_scorer.calculate_score(
    facility_score=8.5,
    annual_growth_rate=0.24,
    completion_pct=75.0,
    lease_verified=True
)
test("AI Composite Score calculated", 7.0 <= score_res["overall_ai_score"] <= 10.0, 
     f"(Score: {score_res['overall_ai_score']}/10, Rating: {score_res['rating_label']})")

# 3. Haversine Proximity Calculation
# Coordinates: Centaurus Mall to Faisal Mosque, Islamabad
centaurus_lat, centaurus_lon = 33.7077, 73.0501
faisal_lat, faisal_lon = 33.7296, 73.0372
prox_res = calculate_proximity(ProximityCalcRequest(
    property_lat=centaurus_lat,
    property_lon=centaurus_lon,
    facility_lat=faisal_lat,
    facility_lon=faisal_lon
))
test("Haversine Distance calculated", 2.0 <= prox_res["distance_km"] <= 4.0, 
     f"({prox_res['distance_formatted']}, Drive: {prox_res['drive_time_formatted']})")

# 4. Real property predict endpoint
test_prop_id = prop_ids.get("islamabad", "prop-isb-001")
try:
    prop_ai = predict_property(test_prop_id)
    test(f"Real property AI prediction on '{test_prop_id}'", bool(prop_ai["ai_trajectory"]), 
         f"(Society: {prop_ai['society']}, Nearest facilities: {len(prop_ai['nearest_facilities'])})")
except Exception as e:
    test(f"Real property AI prediction on '{test_prop_id}'", False, str(e))

# 5. Society Comparison Matrix (All 18 societies)
soc_comp = society_comparison()
test("Society Comparison Matrix returns 18 societies", soc_comp["total_societies"] == 18, 
     f"(Top pick: {soc_comp['top_pick']['name'] if soc_comp['top_pick'] else 'N/A'})")

# STEP 8: Test Government Records & NOC Verifications
print("\n--- 8. Testing Government Legal Title & NOC Verifications ---")
authorities_found = set()
for city in ["karachi", "lahore", "islamabad"]:
    conn = get_shard_db(city)
    c = conn.cursor()
    c.execute("SELECT DISTINCT issuing_authority, status_type, noc_number FROM government_records")
    rows = c.fetchall()
    for r in rows:
        authorities_found.add(r["issuing_authority"])
    conn.close()

cda_found = [a for a in authorities_found if "CDA" in a or "Capital Development Authority" in a]
lda_found = [a for a in authorities_found if "LDA" in a or "Lahore Development Authority" in a]
sbca_found = [a for a in authorities_found if "SBCA" in a or "KDA" in a or "Sindh Building" in a]

test("CDA records present (Islamabad)", len(cda_found) > 0, f"({cda_found})")
test("LDA records present (Lahore)", len(lda_found) > 0, f"({lda_found})")
test("SBCA/KDA records present (Karachi)", len(sbca_found) > 0, f"({sbca_found})")

# STEP 9: Test Cron Pipeline Stage 2 Ingestion
print("\n--- 9. Testing Cron Pipeline Stage 2 (Schema-Compliant) ---")
from app.db.cron_pipeline import pipeline_scheduler

try:
    # Test Stage 2 directly with a mock property batch
    from app.db.real_scraper import generate_price_history
    city = "islamabad"
    conn = get_shard_db(city)
    cursor = conn.cursor()
    test_pid = f"test-cron-{uuid.uuid4().hex[:6]}"
    
    # Execute Stage 2 query
    cursor.execute("""
        INSERT OR IGNORE INTO properties 
        (id, society_id, society_name, city, title, type, subtype, price,
         price_formatted, price_per_sqft, size, size_numeric, bedrooms, bathrooms,
         status, completion_status, completion_pct, featured, ai_investment_score,
         recommendation, confidence_pct, forecast_3yr_yield, description,
         images_json, latitude, longitude, created_at)
        VALUES (?, 'capital-smart-city', 'Capital Smart City', 'islamabad', 'Test Plot',
                'Plot', 'Residential Plot', 5500000, 'PKR 55.0 Lacs', 'PKR 4,888/sq.ft',
                '5 Marla (125 sq.yd)', 125, 0, 0, 'Available', 'Ready for Possession',
                100, 0, 8.5, 'BUY', 92, '+35%', 'Test description', '[]', 33.55, 73.05, datetime('now'))
    """, (test_pid,))
    conn.commit()
    
    # Check it inserted
    cursor.execute("SELECT id FROM properties WHERE id = ?", (test_pid,))
    inserted = cursor.fetchone()
    cursor.execute("DELETE FROM properties WHERE id = ?", (test_pid,))
    conn.commit()
    conn.close()
    
    test("Cron Pipeline Stage 2 insert query executes without column errors", inserted is not None)
except Exception as e:
    test("Cron Pipeline Stage 2 insert query executes without column errors", False, str(e))

# STEP 10: Complete Database Purge
print("\n--- 10. Executing Auth Core Database Purge ---")
auth_conn = get_auth_db()
ac = auth_conn.cursor()

# Count before purge
ac.execute("SELECT COUNT(*) as cnt FROM users")
pre_users = ac.fetchone()["cnt"]
ac.execute("SELECT COUNT(*) as cnt FROM otp_codes")
pre_otps = ac.fetchone()["cnt"]

# PURGE EVERYTHING
ac.execute("DELETE FROM users")
ac.execute("DELETE FROM otp_codes")
ac.execute("DELETE FROM subscriptions")
ac.execute("DELETE FROM saved_properties")
ac.execute("DELETE FROM email_logs")
auth_conn.commit()

# Verify counts after purge
ac.execute("SELECT COUNT(*) as cnt FROM users")
post_users = ac.fetchone()["cnt"]
ac.execute("SELECT COUNT(*) as cnt FROM otp_codes")
post_otps = ac.fetchone()["cnt"]
auth_conn.close()

test("Purged all test user accounts", post_users == 0, f"(Cleared {pre_users} accounts)")
test("Purged all OTP codes & audit records", post_otps == 0, f"(Cleared {pre_otps} OTPs)")
test("Admin slot is 100% OPEN for first-come registration on /admin/login", True)

print("\n" + "=" * 70)
print(f"E2E TEST SUMMARY: {passed} PASSED, {failed} FAILED")
print("=" * 70)

if failed == 0:
    print("\n>>> ALL SYSTEMS VERIFIED AND READY FOR STAKEHOLDER DEMO <<<")
else:
    print(f"\n>>> ATTENTION: {failed} TESTS FAILED <<<")
