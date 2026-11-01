"""
RIHAISH CLI Admin Account Creator
Usage: python -m app.create_admin --email admin@example.com --password yourpassword --name "Admin Name"

Creates a platform admin account directly in the Auth Core database.
Use this to manually create admin accounts without going through the OTP signup flow.
"""

import argparse
import uuid
import sys
import os

# Add parent to path for module imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import init_all_databases, get_auth_db
from app.core.security import hash_password


def create_admin(email: str, password: str, name: str = "RIHAISH Admin"):
    """Creates an admin user directly in the Auth Core database."""
    # Initialize databases first
    init_all_databases()
    
    conn = get_auth_db()
    cursor = conn.cursor()

    # Check if email already exists
    cursor.execute("SELECT id, role FROM users WHERE email = ?", (email,))
    existing = cursor.fetchone()

    if existing:
        if existing["role"] == "admin":
            print(f"[✓] Admin account already exists: {email} (ID: {existing['id']})")
            conn.close()
            return
        else:
            # Upgrade existing user to admin
            cursor.execute("""
                UPDATE users SET role = 'admin', is_subscribed = 1, subscription_plan = 'Master Tier (CLI)'
                WHERE email = ?
            """, (email,))
            conn.commit()
            conn.close()
            print(f"[✓] Upgraded existing user {email} from '{existing['role']}' to 'admin' role")
            return

    # Create new admin account
    user_id = f"usr-admin-{uuid.uuid4().hex[:6]}"
    pwd_hash = hash_password(password)

    cursor.execute("""
        INSERT INTO users (id, name, email, password_hash, role, society_id, is_subscribed, subscription_plan, is_email_verified)
        VALUES (?, ?, ?, ?, 'admin', NULL, 1, 'Master Tier (CLI)', 1)
    """, (user_id, name, email, pwd_hash))
    conn.commit()
    conn.close()

    print(f"[✓] Admin account created successfully!")
    print(f"    ID:    {user_id}")
    print(f"    Name:  {name}")
    print(f"    Email: {email}")
    print(f"    Role:  admin")
    print(f"\n    Login at: http://localhost:3000/auth")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a RIHAISH platform admin account")
    parser.add_argument("--email", required=True, help="Admin email address")
    parser.add_argument("--password", required=True, help="Admin password")
    parser.add_argument("--name", default="RIHAISH Admin", help="Admin display name")
    
    args = parser.parse_args()
    create_admin(args.email, args.password, args.name)
