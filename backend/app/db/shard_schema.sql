-- Regional Shard Database Schema
-- Executed on each regional database node (Karachi, Lahore, Islamabad)

CREATE TABLE IF NOT EXISTS societies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Established', 'High Growth', 'Emerging Frontier'
    tier TEXT NOT NULL, -- 'Tier 1', 'Tier 2', 'Tier 3'
    growth_rate_pct REAL NOT NULL,
    avg_price_sqyd INTEGER NOT NULL,
    facility_score REAL NOT NULL,
    total_area_acres INTEGER,
    developed_pct INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    society_id TEXT NOT NULL,
    society_name TEXT NOT NULL,
    city TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Plot', 'House', 'Apartment'
    subtype TEXT NOT NULL, -- 'Residential Plot', 'Commercial Plot', 'Luxury Villa', 'Townhouse'
    price INTEGER NOT NULL,
    price_formatted TEXT NOT NULL,
    price_per_sqft TEXT NOT NULL,
    size TEXT NOT NULL,
    size_numeric INTEGER NOT NULL, -- in sq.yd
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Available', -- 'Available', 'Reserved', 'Sold'
    completion_status TEXT NOT NULL,
    completion_pct INTEGER NOT NULL,
    featured BOOLEAN DEFAULT 0,
    ai_investment_score REAL NOT NULL,
    recommendation TEXT NOT NULL,
    confidence_pct INTEGER NOT NULL,
    forecast_3yr_yield TEXT NOT NULL,
    description TEXT,
    images_json TEXT, -- JSON array of image URLs
    latitude REAL,
    longitude REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (society_id) REFERENCES societies(id)
);

CREATE TABLE IF NOT EXISTS government_records (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    title TEXT NOT NULL,
    noc_number TEXT NOT NULL,
    issuing_authority TEXT NOT NULL, -- 'KDA', 'LDA', 'RDA', 'CDA', 'SBCA', 'TMA'
    status_type TEXT NOT NULL, -- '99-Year Leasehold Verified', 'LDA Exemption Clear Title', etc.
    transfer_type TEXT NOT NULL,
    verification_date TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT 1,
    audit_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS price_history (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    year_label TEXT NOT NULL, -- '2022', '2023', '2024', '2025', '2026 (Current)', '2027 (AI Proj)', etc.
    price INTEGER NOT NULL,
    lower_bound INTEGER,
    upper_bound INTEGER,
    is_projection BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS facilities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'mosque', 'school', 'hospital', 'market', 'transport', 'park'
    city TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    rating REAL DEFAULT 4.8
);

CREATE TABLE IF NOT EXISTS property_facility_proximity (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    facility_id TEXT NOT NULL,
    facility_name TEXT NOT NULL,
    facility_type TEXT NOT NULL,
    distance_km TEXT NOT NULL,
    drive_time_min TEXT NOT NULL,
    rating REAL NOT NULL,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS progress_reports (
    id TEXT PRIMARY KEY,
    property_id TEXT,
    society_id TEXT NOT NULL,
    title TEXT NOT NULL,
    report_date TEXT NOT NULL,
    completion_pct INTEGER NOT NULL,
    status TEXT NOT NULL, -- 'Completed', 'In Progress', 'Scheduled'
    verified_by_admin BOOLEAN DEFAULT 0,
    verifier_stamp TEXT,
    photos_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shard_replication_log (
    log_id TEXT PRIMARY KEY,
    operation TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    replica_synced BOOLEAN DEFAULT 1,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
