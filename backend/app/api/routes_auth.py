import uuid
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from ..core.security import create_access_token, hash_password, verify_password, get_current_user
from ..core.email_service import email_service
from ..db.database import get_auth_db

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])

class RegisterInitRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "buyer"
    society_name: Optional[str] = None

class VerifyOtpRegisterRequest(BaseModel):
    email: str
    otp_code: str
    name: str
    password: str
    role: str = "buyer"
    society_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp_code: str
    new_password: str

# ─── Role-based default subscription mapping ───
ROLE_DEFAULT_SUBSCRIPTIONS = {
    "buyer": {"is_subscribed": 0, "plan": "Free Tier"},
    "investor": {"is_subscribed": 0, "plan": "Investor Free Tier"},
    "society_admin": {"is_subscribed": 0, "plan": "Society Starter"},
    "admin": {"is_subscribed": 1, "plan": "Master Tier (Founder)"},
}


@router.post("/send-signup-otp")
def send_signup_otp(payload: RegisterInitRequest) -> Dict[str, Any]:
    """Generates 6-digit OTP code and dispatches security verification email."""
    if payload.role not in ('buyer', 'investor', 'society_admin'):
        raise HTTPException(403, 'Use the dedicated administrator registration flow.')
    conn = get_auth_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (payload.email.strip().lower(),))
    existing = cursor.fetchone()
    conn.close()

    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    res = email_service.generate_and_send_otp(payload.email.strip().lower(), purpose="signup")
    return res

@router.post("/verify-otp-and-register")
def verify_otp_and_register(payload: VerifyOtpRegisterRequest) -> Dict[str, Any]:
    """Verifies submitted OTP code and creates active user record in Auth Core DB."""
    if payload.role not in ('buyer', 'investor', 'society_admin'):
        raise HTTPException(403, 'Use the dedicated administrator registration flow.')
    email_lower = payload.email.strip().lower()
    is_valid = email_service.verify_otp(email_lower, payload.otp_code, purpose="signup")
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP verification code. Please request a new one.")

    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    pwd_hash = hash_password(payload.password)
    society_id = payload.society_name.lower().replace(" ", "-") if payload.society_name else None

    effective_role = payload.role
    sub_defaults = ROLE_DEFAULT_SUBSCRIPTIONS.get(effective_role, {"is_subscribed": 0, "plan": "Free Tier"})
    is_sub = sub_defaults["is_subscribed"]
    sub_plan = sub_defaults["plan"]

    conn = get_auth_db()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO users (id, name, email, password_hash, role, society_id, is_subscribed, subscription_plan, is_email_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    """, (user_id, payload.name.strip(), email_lower, pwd_hash, effective_role, society_id, is_sub, sub_plan))
    conn.commit()
    conn.close()

    token = create_access_token({
        "user_id": user_id,
        "email": email_lower,
        "role": effective_role,
        "is_subscribed": bool(is_sub),
        "society_id": society_id
    })

    # Send welcome email
    try:
        email_service._send_smtp_email(
            email_lower,
            f"Welcome to RIHAISH — {effective_role.replace('_', ' ').title()} Account Active",
            email_service._build_html_template("Welcome to RIHAISH!", f"""
                <h2>Welcome, {payload.name.strip()}!</h2>
                <p>Your <strong>{effective_role.replace('_', ' ').title()}</strong> account has been successfully created.</p>
                <div class="info-row"><span class="info-label">Email</span><span class="info-value">{email_lower}</span></div>
                <div class="info-row"><span class="info-label">Role</span><span class="info-value">{effective_role.replace('_', ' ').title()}</span></div>
                <div class="info-row"><span class="info-label">Plan</span><span class="info-value">{sub_plan}</span></div>
                <a href="http://localhost:3000" class="btn">Open RIHAISH Dashboard</a>
            """)
        )
    except Exception as e:
        print(f"[EMAIL] Welcome email failed: {e}")

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": payload.name.strip(),
            "email": email_lower,
            "role": effective_role,
            "society_id": society_id,
            "is_subscribed": bool(is_sub),
            "subscription_plan": sub_plan
        }
    }


# ─── Admin Portal: Separate Registration & Login ───

class AdminRegisterInitRequest(BaseModel):
    name: str
    email: str
    password: str

class AdminVerifyOtpRequest(BaseModel):
    email: str
    otp_code: str
    name: str
    password: str

@router.post("/admin/send-signup-otp")
def admin_send_signup_otp(payload: AdminRegisterInitRequest) -> Dict[str, Any]:
    """Admin portal registration — only the FIRST admin registrant can claim admin role."""
    email_lower = payload.email.strip().lower()

    conn = get_auth_db()
    cursor = conn.cursor()

    # Check if an admin already exists
    cursor.execute("SELECT id FROM users WHERE role = 'admin'")
    existing_admin = cursor.fetchone()
    if existing_admin:
        conn.close()
        raise HTTPException(
            status_code=403,
            detail="A platform administrator already exists. Only one admin account is allowed. Contact existing admin for access."
        )

    # Check if email is already registered
    cursor.execute("SELECT id FROM users WHERE email = ?", (email_lower,))
    existing_user = cursor.fetchone()
    conn.close()

    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    res = email_service.generate_and_send_otp(email_lower, purpose="admin_signup")
    return res


@router.post("/admin/verify-otp-and-register")
def admin_verify_otp_and_register(payload: AdminVerifyOtpRequest) -> Dict[str, Any]:
    """Verifies OTP and creates the platform admin account (first-come only)."""
    email_lower = payload.email.strip().lower()

    is_valid = email_service.verify_otp(email_lower, payload.otp_code, purpose="admin_signup")
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP verification code. Please request a new one.")

    conn = get_auth_db()
    cursor = conn.cursor()

    # Double-check no admin exists
    cursor.execute("SELECT id FROM users WHERE role = 'admin'")
    existing_admin = cursor.fetchone()
    if existing_admin:
        conn.close()
        raise HTTPException(status_code=403, detail="Admin account was just claimed by another user.")

    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    pwd_hash = hash_password(payload.password)

    cursor.execute("""
        INSERT INTO users (id, name, email, password_hash, role, society_id, is_subscribed, subscription_plan, is_email_verified)
        VALUES (?, ?, ?, ?, 'admin', NULL, 1, 'Master Tier (Founder)', 1)
    """, (user_id, payload.name.strip(), email_lower, pwd_hash))
    conn.commit()
    conn.close()

    token = create_access_token({
        "user_id": user_id,
        "email": email_lower,
        "role": "admin",
        "is_subscribed": True,
        "society_id": None
    })

    print(f"[AUTH] Platform admin registered: {email_lower}")

    # Send admin welcome email
    try:
        email_service._send_smtp_email(
            email_lower,
            "RIHAISH Platform Admin Account Activated",
            email_service._build_html_template("Admin Portal Activated", f"""
                <h2>Welcome, {payload.name.strip()}!</h2>
                <p>You have been registered as the <strong>Rihaish Platform Master Administrator</strong>.</p>
                <div class="info-row"><span class="info-label">Role</span><span class="info-value">Platform Admin (Master)</span></div>
                <div class="info-row"><span class="info-label">Access Level</span><span class="info-value">Full Platform Control</span></div>
                <a href="http://localhost:3000/admin/login" class="btn">Open Admin Console</a>
            """)
        )
    except Exception as e:
        print(f"[EMAIL] Admin welcome email failed: {e}")

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": payload.name.strip(),
            "email": email_lower,
            "role": "admin",
            "society_id": None,
            "is_subscribed": True,
            "subscription_plan": "Master Tier (Founder)"
        }
    }


@router.post("/admin/reset-admin-slot")
def reset_admin_slot() -> Dict[str, Any]:
    """Clears existing admin accounts from Auth DB to reopen the MasterAdmin registration slot."""
    raise HTTPException(403, 'Destructive database reset is disabled. Use an isolated test database.')


@router.post("/admin/reset-test-db")
def reset_test_db() -> Dict[str, Any]:
    """Purges test accounts and stale OTPs from Auth DB."""
    raise HTTPException(403, 'Destructive database reset is disabled. Use an isolated test database.')


@router.post("/admin/login")
def admin_login(payload: LoginRequest) -> Dict[str, Any]:
    """Admin-specific login — only allows users with admin role."""
    email_lower = payload.email.strip().lower()

    conn = get_auth_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email_lower,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid admin credentials.")

    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid admin credentials.")

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="This account does not have admin privileges. Use the regular login portal.")

    token = create_access_token({
        "user_id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "is_subscribed": bool(user["is_subscribed"]),
        "society_id": user["society_id"]
    })

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "society_id": user["society_id"],
            "is_subscribed": bool(user["is_subscribed"]),
            "subscription_plan": user["subscription_plan"]
        }
    }


# ─── Regular Login ───

@router.post("/login")
def login_user(payload: LoginRequest) -> Dict[str, Any]:
    """Authenticates against Auth Core DB with role verification."""
    email_lower = payload.email.strip().lower()

    conn = get_auth_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email_lower,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid password.")

    # Platform admin must use /admin/login
    if user["role"] == "admin":
        raise HTTPException(
            status_code=403, 
            detail="Platform administrators must use the dedicated Rihaish Admin Portal at /admin/login."
        )

    token = create_access_token({
        "user_id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "is_subscribed": bool(user["is_subscribed"]),
        "society_id": user["society_id"]
    })

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "society_id": user["society_id"],
            "is_subscribed": bool(user["is_subscribed"]),
            "subscription_plan": user["subscription_plan"]
        }
    }


# ─── Forgot Password / Reset ───

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest) -> Dict[str, Any]:
    """Sends a password reset OTP to the user's email."""
    email_lower = payload.email.strip().lower()

    conn = get_auth_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email_lower,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        # Don't reveal if email exists - security best practice
        return {
            "success": True,
            "message": f"If an account exists for {email_lower}, a password reset code has been sent."
        }

    res = email_service.generate_and_send_otp(email_lower, purpose="password_reset")
    return {
        "success": True,
        "message": f"If an account exists for {email_lower}, a password reset code has been sent."
    }


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest) -> Dict[str, Any]:
    """Verifies OTP, resets the user's password, and returns fresh auth token."""
    email_lower = payload.email.strip().lower()

    if not payload.new_password or len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")

    is_valid = email_service.verify_otp(email_lower, payload.otp_code.strip(), purpose="password_reset")
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code. Please request a new one.")

    pwd_hash = hash_password(payload.new_password)

    conn = get_auth_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password_hash = ? WHERE email = ?", (pwd_hash, email_lower))
    conn.commit()
    affected = cursor.rowcount

    if affected == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found.")

    cursor.execute("SELECT * FROM users WHERE email = ?", (email_lower,))
    user = cursor.fetchone()
    conn.commit()
    conn.close()

    token = create_access_token({
        "user_id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "is_subscribed": bool(user["is_subscribed"]),
        "society_id": user["society_id"]
    })

    return {
        "success": True,
        "message": "Password has been reset successfully! You are now logged in.",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "society_id": user["society_id"],
            "is_subscribed": bool(user["is_subscribed"]),
            "subscription_plan": user["subscription_plan"]
        }
    }


# ─── Profile ───

@router.get("/me")
def get_current_user_profile(current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Returns the current authenticated user's profile from JWT + database."""
    conn = get_auth_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ? OR email = ?", 
                   (current_user.get("user_id", ""), current_user.get("email", "")))
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User profile not found.")

    return {
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "society_id": user["society_id"],
            "is_subscribed": bool(user["is_subscribed"]),
            "subscription_plan": user["subscription_plan"],
            "is_email_verified": bool(user["is_email_verified"])
        }
    }
