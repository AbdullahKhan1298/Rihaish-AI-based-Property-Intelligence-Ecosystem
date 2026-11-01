"""
RIHAISH Production Security Module
Real JWT token generation/validation with PyJWT + bcrypt password hashing.
Provides FastAPI dependencies for authentication and role-based access control.
"""

import time
import uuid
from typing import Optional, List, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings

# Use jose for JWT (already in requirements as python-jose)
from jose import jwt, JWTError
import bcrypt

# ─── Password Hashing (bcrypt direct) ───
def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

# ─── JWT Token Management ───
def create_access_token(data: dict, expires_minutes: int = None) -> str:
    """Generate real JWT token with HS256 signing."""
    to_encode = data.copy()
    expire = int(time.time()) + (expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES) * 60
    to_encode.update({
        "exp": expire,
        "iat": int(time.time()),
        "iss": "rihaish-auth",
        "jti": uuid.uuid4().hex[:12]
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate JWT token. Returns payload or None."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

# ─── FastAPI Security Dependencies ───
bearer_scheme = HTTPBearer(auto_error=False)

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)
) -> Optional[dict]:
    """Returns user payload from JWT if present, else None. Does NOT raise errors."""
    if not credentials:
        return None
    payload = decode_access_token(credentials.credentials)
    return payload

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)
) -> dict:
    """Returns user payload from JWT. Raises 401 if missing/invalid."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please login.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token. Please login again.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return payload

def require_role(*allowed_roles: str):
    """Factory that returns a dependency requiring the user to have one of the allowed roles."""
    async def role_checker(
        current_user: dict = Depends(get_current_user)
    ) -> dict:
        user_role = current_user.get("role", "")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}. Your role: {user_role}."
            )
        return current_user
    return role_checker
