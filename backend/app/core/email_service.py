"""
RIHAISH Production Email & Notification Service
Real SMTP integration with Gmail + database audit logging.
Falls back to DB-only logging if SMTP credentials are not configured.
"""

import uuid
import random
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from ..db.database import get_auth_db
from .config import settings

ADMIN_NOTIFICATION_EMAIL = settings.ADMIN_EMAIL
ADMIN_WHATSAPP_NUMBER = settings.ADMIN_WHATSAPP
ADMIN_WHATSAPP_LINK = settings.ADMIN_WHATSAPP_LINK


class EmailService:
    def __init__(self):
        self.sender_email = settings.SMTP_USER
        self.sender_name = settings.SMTP_FROM_NAME
        self.smtp_enabled = settings.SMTP_ENABLED

    def _send_smtp_email(self, to_email: str, subject: str, html_body: str) -> bool:
        """Sends real email via SMTP. Returns True on success."""
        if not self.smtp_enabled:
            return False
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.sender_name} <{self.sender_email}>"
            msg["To"] = to_email
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(self.sender_email, to_email, msg.as_string())
            return True
        except Exception as e:
            print(f"[SMTP ERROR] Failed to send email to {to_email}: {e}")
            return False

    def _build_html_template(self, title: str, body_content: str) -> str:
        """Wraps content in branded RIHAISH HTML email template."""
        return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{{margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#0f172a}}
.container{{max-width:600px;margin:0 auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155}}
.header{{background:linear-gradient(135deg,#6366f1 0%,#a855f7 50%,#ec4899 100%);padding:32px;text-align:center}}
.header h1{{color:#fff;font-size:28px;margin:0;letter-spacing:1px}}
.header p{{color:#e0e7ff;font-size:14px;margin-top:8px}}
.body{{padding:32px;color:#e2e8f0}}
.body h2{{color:#a5b4fc;font-size:20px;margin-top:0}}
.otp-box{{background:#312e81;border:2px dashed #818cf8;border-radius:12px;padding:24px;text-align:center;margin:24px 0}}
.otp-code{{font-size:36px;font-weight:800;color:#a5b4fc;letter-spacing:8px}}
.info-row{{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:12px 16px;margin:8px 0;display:flex;justify-content:space-between}}
.info-label{{color:#94a3b8;font-size:13px}}.info-value{{color:#f1f5f9;font-weight:600;font-size:13px}}
.btn{{display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;margin-top:16px}}
.footer{{padding:24px;text-align:center;color:#64748b;font-size:12px;border-top:1px solid #334155}}
</style></head>
<body><div class="container">
<div class="header"><h1>🏠 RIHAISH</h1><p>{title}</p></div>
<div class="body">{body_content}</div>
<div class="footer">
<p>RIHAISH — AI-Powered Property & Society Intelligence Ecosystem</p>
<p>Admin: {ADMIN_NOTIFICATION_EMAIL} | WhatsApp: {ADMIN_WHATSAPP_NUMBER}</p>
<p>© 2026 RIHAISH Intelligence. All rights reserved.</p>
</div></div></body></html>"""

    def log_email_dispatch(self, recipient: str, subject: str, email_type: str, snippet: str, smtp_sent: bool = False) -> str:
        """Stores sent email records in Auth Core database for audit and inspection."""
        email_id = f"eml-{uuid.uuid4().hex[:8]}"
        delivery = "SMTP_DELIVERED" if smtp_sent else "LOGGED_ONLY"
        try:
            conn = get_auth_db()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO email_logs (id, recipient_email, subject, email_type, content_snippet, delivery_status)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (email_id, recipient, subject, email_type, snippet[:200], delivery))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[EMAIL LOG ERROR] {e}")
        return email_id

    def generate_and_send_otp(self, email: str, purpose: str = "signup") -> Dict[str, Any]:
        """Generates 6-digit OTP, invalidates previous codes, saves in database, and dispatches email."""
        otp_code = f"{random.randint(100000, 999999)}"
        otp_id = f"otp-{uuid.uuid4().hex[:8]}"
        expires_at = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(time.time() + 900))

        conn = get_auth_db()
        cursor = conn.cursor()

        # SECURITY: Invalidate ALL previous unused OTPs for this email + purpose
        cursor.execute("""
            UPDATE otp_codes SET is_used = 1 
            WHERE email = ? AND purpose = ? AND is_used = 0
        """, (email, purpose))

        cursor.execute("""
            INSERT INTO otp_codes (id, email, otp_code, purpose, expires_at)
            VALUES (?, ?, ?, ?, ?)
        """, (otp_id, email, otp_code, purpose, expires_at))
        conn.commit()
        conn.close()

        purpose_label = "Password Reset" if purpose == "password_reset" else "Admin Portal Registration" if purpose == "admin_signup" else "Email Verification"
        subject = f"Your RIHAISH Security Code: {otp_code}"
        body = f"""<h2>{purpose_label}</h2>
<p>Use the code below to verify your RIHAISH account:</p>
<div class="otp-box"><div class="otp-code">{otp_code}</div></div>
<p style="color:#94a3b8;font-size:13px">This code expires in <strong>15 minutes</strong>. Do not share it with anyone.</p>
<p style="color:#94a3b8;font-size:13px">If you didn't request this, please ignore this email.</p>"""

        html = self._build_html_template(purpose_label + " Code", body)
        smtp_sent = self._send_smtp_email(email, subject, html)
        snippet = f"OTP for {purpose}. Valid 15 min."
        self.log_email_dispatch(email, subject, "OTP", snippet, smtp_sent)
        print(f"[EMAIL] OTP to {email}: ****** (SMTP: {smtp_sent})")

        return {
            "success": True,
            "message": f"Verification code sent to {email}",
            "expires_at": expires_at,
            "smtp_delivered": smtp_sent
        }

    def verify_otp(self, email: str, otp_code: str, purpose: str = "signup") -> bool:
        """Validates submitted OTP code — ONLY the latest unused OTP for this email+purpose is valid."""
        conn = get_auth_db()
        cursor = conn.cursor()

        # Get the MOST RECENT OTP for this email + purpose
        cursor.execute("""
            SELECT id, otp_code, expires_at, is_used FROM otp_codes 
            WHERE email = ? AND purpose = ? 
            ORDER BY created_at DESC LIMIT 1
        """, (email, purpose))
        row = cursor.fetchone()

        if not row:
            conn.close()
            return False

        # Must be unused and must match the submitted code
        if row["is_used"] or row["otp_code"] != otp_code:
            conn.close()
            return False

        # Check expiry
        import time as _time
        try:
            import datetime
            expires = datetime.datetime.strptime(row["expires_at"], "%Y-%m-%d %H:%M:%S")
            if datetime.datetime.now() > expires:
                conn.close()
                return False
        except (TypeError, ValueError):
            conn.close()
            return False

        # Mark as used
        cursor.execute("UPDATE otp_codes SET is_used = 1 WHERE id = ? AND is_used = 0", (row["id"],))
        conn.commit()
        claimed = cursor.rowcount == 1
        conn.close()
        return claimed

    def send_inquiry_alert_to_admin(
        self, property_id: str, property_title: str, society_name: str,
        user_name: str, user_email: str, user_phone: str, message: str
    ) -> Dict[str, Any]:
        """Dispatches urgent property inquiry to Admin email + WhatsApp link."""
        inquiry_id = f"inq-{uuid.uuid4().hex[:8]}"

        conn = get_auth_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO inquiries 
            (id, property_id, property_title, society_name, user_name, user_email, user_phone, message, forwarded_to_email, forwarded_to_whatsapp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (inquiry_id, property_id, property_title, society_name,
              user_name, user_email, user_phone, message,
              ADMIN_NOTIFICATION_EMAIL, ADMIN_WHATSAPP_NUMBER))
        conn.commit()
        conn.close()

        subject = f"🔔 URGENT Inquiry: {property_title} by {user_name}"
        body = f"""<h2>New Property Inquiry</h2>
<div class="info-row"><span class="info-label">Property</span><span class="info-value">{property_title}</span></div>
<div class="info-row"><span class="info-label">Society</span><span class="info-value">{society_name}</span></div>
<div class="info-row"><span class="info-label">Buyer Name</span><span class="info-value">{user_name}</span></div>
<div class="info-row"><span class="info-label">Email</span><span class="info-value">{user_email}</span></div>
<div class="info-row"><span class="info-label">Phone</span><span class="info-value">{user_phone}</span></div>
<div class="info-row"><span class="info-label">Message</span><span class="info-value">{message}</span></div>
<a href="{ADMIN_WHATSAPP_LINK}" class="btn">Reply on WhatsApp</a>"""

        html = self._build_html_template("Urgent Property Inquiry Alert", body)
        smtp_sent = self._send_smtp_email(ADMIN_NOTIFICATION_EMAIL, subject, html)
        self.log_email_dispatch(ADMIN_NOTIFICATION_EMAIL, subject, "INQUIRY_ALERT",
                               f"Inquiry from {user_name} for {property_title}", smtp_sent)

        import urllib.parse
        wa_text = f"Hello! Inquiry from {user_name} ({user_phone}) for {property_title} in {society_name}. Message: {message}"
        whatsapp_url = f"{ADMIN_WHATSAPP_LINK}?text={urllib.parse.quote(wa_text)}"

        return {
            "success": True,
            "inquiry_id": inquiry_id,
            "notified_admin_email": ADMIN_NOTIFICATION_EMAIL,
            "notified_whatsapp": ADMIN_WHATSAPP_NUMBER,
            "whatsapp_direct_url": whatsapp_url,
            "smtp_delivered": smtp_sent
        }

    def send_subscription_receipt(
        self, user_email: str, user_name: str, plan_name: str,
        amount_pkr: int, receipt_no: str
    ) -> Dict[str, Any]:
        """Dispatches verified subscription invoice & activation email."""
        subject = f"✅ Receipt #{receipt_no}: RIHAISH {plan_name} Activated"
        body = f"""<h2>Subscription Confirmed!</h2>
<p>Thank you, <strong>{user_name}</strong>! Your subscription is now active.</p>
<div class="info-row"><span class="info-label">Plan</span><span class="info-value">{plan_name}</span></div>
<div class="info-row"><span class="info-label">Amount</span><span class="info-value">PKR {amount_pkr:,}</span></div>
<div class="info-row"><span class="info-label">Receipt No.</span><span class="info-value">{receipt_no}</span></div>
<div class="info-row"><span class="info-label">Status</span><span class="info-value" style="color:#4ade80">ACTIVE ✓</span></div>
<p style="margin-top:24px">Full AI forecasting, verified government records, and premium intelligence features are now unlocked.</p>
<a href="http://localhost:3000" class="btn">Open RIHAISH Dashboard</a>"""

        html = self._build_html_template("Subscription Receipt & Confirmation", body)
        smtp_sent = self._send_smtp_email(user_email, subject, html)
        self.log_email_dispatch(user_email, subject, "SUBSCRIPTION_RECEIPT",
                               f"Plan: {plan_name}, PKR {amount_pkr:,}, Receipt: {receipt_no}", smtp_sent)

        return {"success": True, "receipt_no": receipt_no, "recipient": user_email, "smtp_delivered": smtp_sent}

email_service = EmailService()
