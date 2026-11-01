import uuid
import random
import time
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
from ..db.database import get_auth_db
from ..core.email_service import email_service
from ..core.security import get_current_user

router = APIRouter(prefix="/subscription", tags=["Subscriptions & Billing"])

PLAN_PRICING = {
    "buyer_pro": {"name": "Resident & Buyer Pro Pass", "amount": 4999, "cycle": "Yearly"},
    "investor_pro": {"name": "Investor Pro Annual Intelligence", "amount": 14999, "cycle": "Yearly"},
    "starter": {"name": "Starter Society Portal", "amount": 45000, "cycle": "Monthly"},
    "growth": {"name": "Growth & Developer Tier", "amount": 95000, "cycle": "Monthly"},
    "enterprise": {"name": "Enterprise Mega-Project Syndicate", "amount": 220000, "cycle": "Monthly"}
}

class CheckoutRequest(BaseModel):
    plan_id: str
    payment_method: str = "Online Card / Bank Transfer"

class NewsletterRequest(BaseModel):
    email: str

@router.get("/plans")
def list_plans() -> Dict[str, Any]:
    """Returns all available subscription plans — public endpoint."""
    plans = []
    for pid, info in PLAN_PRICING.items():
        plans.append({"id": pid, "name": info["name"], "amount_pkr": info["amount"], "billing_cycle": info["cycle"]})
    return {"plans": plans}

@router.post("/checkout")
def process_subscription_checkout(payload: CheckoutRequest, current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Processes plan activation — requires JWT authentication."""
    plan_info = PLAN_PRICING.get(payload.plan_id)
    if not plan_info:
        raise HTTPException(status_code=400, detail=f"Invalid plan ID: {payload.plan_id}")

    user_id = current_user.get("user_id", "")
    user_email = current_user.get("email", "")
    sub_id = f"sub-{uuid.uuid4().hex[:8]}"
    receipt_no = f"REC-{random.randint(1000, 9999)}-{int(time.time()) % 10000}"
    expires_at = time.strftime("%Y-%m-%d", time.localtime(time.time() + (365 if plan_info["cycle"] == "Yearly" else 30) * 86400))

    conn = get_auth_db()
    cursor = conn.cursor()

    # Fetch user name for email
    cursor.execute("SELECT name FROM users WHERE id = ? OR email = ?", (user_id, user_email))
    user_row = cursor.fetchone()
    user_name = user_row["name"] if user_row else "Valued Customer"

    cursor.execute("""
        INSERT INTO subscriptions 
        (id, user_id, user_email, plan_id, plan_name, amount_pkr, billing_cycle, payment_method, status, receipt_no, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
    """, (sub_id, user_id, user_email, payload.plan_id, plan_info["name"],
          plan_info["amount"], plan_info["cycle"], payload.payment_method, receipt_no, expires_at))

    cursor.execute("""
        UPDATE users 
        SET is_subscribed = 1, subscription_plan = ?, subscription_expiry = ?
        WHERE id = ? OR email = ?
    """, (plan_info["name"], expires_at, user_id, user_email))

    conn.commit()
    conn.close()

    email_service.send_subscription_receipt(
        user_email=user_email,
        user_name=user_name,
        plan_name=plan_info["name"],
        amount_pkr=plan_info["amount"],
        receipt_no=receipt_no
    )

    return {
        "success": True,
        "subscription_id": sub_id,
        "receipt_no": receipt_no,
        "plan_name": plan_info["name"],
        "amount_pkr": plan_info["amount"],
        "billing_cycle": plan_info["cycle"],
        "expires_at": expires_at,
        "message": f"Successfully activated {plan_info['name']}! Receipt dispatched to {user_email}."
    }

@router.post("/newsletter")
def subscribe_newsletter(payload: NewsletterRequest) -> Dict[str, Any]:
    """Subscribes email to Market Intelligence Brief — public endpoint."""
    conn = get_auth_db()
    cursor = conn.cursor()
    sub_id = f"nl-{uuid.uuid4().hex[:8]}"
    try:
        cursor.execute("INSERT INTO newsletter_subscribers (id, email) VALUES (?, ?)", (sub_id, payload.email))
        conn.commit()
    except Exception:
        pass
    conn.close()

    email_service.log_email_dispatch(
        recipient=payload.email,
        subject="Welcome to RIHAISH Market Intelligence Brief",
        email_type="NEWSLETTER",
        snippet="Subscribed to bi-weekly verified valuation reports and infrastructure forecasts."
    )

    return {
        "success": True,
        "message": f"Thank you! {payload.email} subscribed to RIHAISH Market Intelligence Brief."
    }
