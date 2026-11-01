-- RIHAISH Relational Database Schema
-- Multi-Shard Distributed Architecture

-- 1. AUTH CORE DATABASE (auth_core.db)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('buyer', 'investor', 'society_admin', 'admin')),
    society_id TEXT,
    is_subscribed BOOLEAN DEFAULT 0,
    subscription_plan TEXT DEFAULT 'Free Tier',
    subscription_expiry TEXT,
    is_email_verified BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_codes (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    purpose TEXT NOT NULL, -- 'signup', 'password_reset', 'login'
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_properties (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    city TEXT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    property_title TEXT NOT NULL,
    society_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'SENT_TO_ADMIN',
    forwarded_to_email TEXT DEFAULT 'abdullahkh1298@gmail.com',
    forwarded_to_whatsapp TEXT DEFAULT '+92 03122677981',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    amount_pkr INTEGER NOT NULL,
    billing_cycle TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    receipt_no TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    email_type TEXT NOT NULL, -- 'OTP', 'INQUIRY_ALERT', 'SUBSCRIPTION_RECEIPT', 'NEWSLETTER'
    content_snippet TEXT,
    delivery_status TEXT DEFAULT 'DELIVERED',
    dispatched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
