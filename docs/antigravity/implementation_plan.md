# Production-Grade Implementation Plan: RIHAISH Real-Data Ecosystem & Distributed Architecture

This plan elevates **RIHAISH** from an initial prototype into a **fully integrated, production-grade distributed real estate intelligence platform** with real scraped and seeded datasets, true relational sharded databases, strict RBAC, automated Email/OTP verification, direct WhatsApp/Email inquiry routing, floating AI assistant, saved plots workspace, and subscription checkout workflows.

---

## User Review Required

> [!IMPORTANT]
> **Key Architectural Upgrades**:
> 1. **Real Data Extraction & Ingestion Pipeline**:
>    - Automated data ingestion from Pakistani real estate sources (Zameen, Graana, KDA, LDA, RDA, CDA, SBCA, and OpenStreetMap geospatial amenity data) capturing 60+ real properties across Karachi, Lahore, and Islamabad (both prime societies and emerging expansion corridors).
> 2. **Real Relational Sharded Database Engine**:
>    - `auth_core.db`: Users, RBAC roles, sessions, OTP codes, subscriptions, inquiries, and email dispatch logs.
>    - `shard_karachi.db`, `shard_lahore.db`, `shard_islamabad.db`: Dedicated regional relational SQLite databases with full foreign key constraints (`properties`, `societies`, `government_records`, `price_predictions`, `investment_scores`, `property_media`, `price_history`, `facilities`, `progress_reports`).
>    - **Real Shard Router**: Executes live queries against the target city shard, maintains replica synchronization logs, and supports live simulated failover promotion in real time.
> 3. **Strict RBAC & Data Isolation**:
>    - **Resident / Buyer (Unsubscribed)**: Public search, basic property details, blurred premium features with Upgrade CTA.
>    - **Resident / Buyer (Subscribed)**: Unlocked full 5-year predictions, market trends, and detailed legal records.
>    - **Investor Pro**: Exclusive Investor Dashboard with 1/3/5-year AI simulation sandbox, comparative society matrix, watchlist, and live construction feed.
>    - **Society Admin (B2B)**: Strictly scoped to their own registered society (inventory management, lease NOC upload, progress milestone submission, lead management).
>    - **Rihaish Platform Admin**: Master platform console (multi-city shard health monitor, NOC verification queue with Approve/Reject actions, revenue metrics, email dispatch logs).
> 4. **Email, OTP & Direct Inquiry Integrations**:
>    - **OTP Email Verification**: Generates secure 6-digit OTP on signup before activating accounts.
>    - **Direct Inquiries**: Dispatches instant inquiry alerts directly to Rihaish Admin Email (`abdullahkh1298@gmail.com`) and WhatsApp (`+92 03122677981`).
>    - **Floating AI Chatbot**: Interactive real estate assistant on all screens with 1-click WhatsApp escalation to `+92 03122677981`.
>    - **Subscription Confirmation**: Generates branded HTML receipts sent via email.
> 5. **New Frontend Pages & Polish**:
>    - **Saved Plots Page (`/saved-plots`)**: Header/drawer accessible watchlist with live price change indicators and export options.
>    - **Subscription Checkout (`/checkout`)**: Multi-tier plan selection (Buyer Pro vs Society Starter/Growth/Enterprise) with payment simulation and instant activation.
>    - **Working Share Button**: Native Web Share API + clipboard copy toast.
>    - **Functional Footer**: Working Market Intelligence newsletter subscription with email confirmation.

---

## Proposed Changes

```
rihaish/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py             # Settings, Admin Email & WhatsApp configs
│   │   │   ├── security.py           # JWT token generation with role claims & OTP hashing
│   │   │   ├── shard_router.py       # Live relational SQLite shard router & failover coordinator
│   │   │   └── email_service.py      # [NEW] Real email & OTP notification engine with HTML templates
│   │   ├── db/
│   │   │   ├── schema.sql            # [NEW] Relational table definitions for auth and shards
│   │   │   ├── scraper_pipeline.py   # [NEW] Real data extraction and cleaning engine
│   │   │   ├── seed_real_data.py     # [NEW] Real multi-city database seeder
│   │   │   └── database.py           # [NEW] Database connection manager for auth_core & city shards
│   │   ├── ml/
│   │   │   ├── price_predictor.py    # Time-series polynomial regression & ARIMA forecasting
│   │   │   ├── investment_scorer.py  # Multi-factor composite investment scoring algorithm
│   │   │   └── proximity_engine.py   # Haversine distance & travel time calculator
│   │   ├── api/
│   │   │   ├── routes_auth.py        # Real DB signup, login, OTP verification & session check
│   │   │   ├── routes_properties.py  # Shard-routed property search, filter, and detail endpoints
│   │   │   ├── routes_watchlist.py   # [NEW] User saved plots CRUD in auth DB
│   │   │   ├── routes_inquiry.py     # [NEW] Direct inquiry dispatch to email & WhatsApp
│   │   │   ├── routes_subscription.py# [NEW] Subscription checkout & tier upgrade endpoint
│   │   │   ├── routes_ai_predict.py  # AI Price & Growth prediction endpoints
│   │   │   ├── routes_progress.py    # Construction progress submission & audit endpoints
│   │   │   ├── routes_society.py     # Scoped society inventory & lead management
│   │   │   └── routes_admin.py       # NOC verification queue & live shard health monitor
│   │   └── main.py                   # FastAPI app with all router registrations
│   └── run.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx        # Updated with Saved Plots link, RBAC badge & secure navigation
│   │   │   │   ├── Footer.jsx        # Updated with working links & functional newsletter signup
│   │   │   │   └── AIChatbot.jsx     # [NEW] Floating AI assistant with WhatsApp escalation
│   │   │   ├── search/
│   │   │   │   ├── PropertyCard.jsx  # Updated with working Share, Save, and direct Detail routing
│   │   │   │   ├── AccordionFilter.jsx
│   │   │   │   └── PriceRangeSlider.jsx
│   │   │   └── property/
│   │   │       ├── PriceTrendChart.jsx # Non-cutting blur with Upgrade CTA / unlocked for subscribed
│   │   │       ├── FacilityRadar.jsx
│   │   │       └── MilestoneTracker.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Integrated with backend JWT, real OTP verification, RBAC
│   │   │   ├── ThemeContext.jsx
│   │   │   └── ShardContext.jsx      # Integrated with live backend shard status
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── SearchPage.jsx
│   │   │   ├── PropertyDetailPage.jsx # Real direct inquiry dispatch to Admin Email & WhatsApp
│   │   │   ├── AuthPage.jsx          # Role selector + OTP verification modal step
│   │   │   ├── AdminLoginPage.jsx
│   │   │   ├── SavedPlotsPage.jsx    # [NEW] Dedicated Saved Plots & Watchlist page
│   │   │   ├── CheckoutPage.jsx      # [NEW] Subscription checkout and plan activation
│   │   │   ├── PricingPage.jsx       # Updated with Buy Pro and Society Subscription buttons
│   │   │   ├── InvestorDashboard.jsx
│   │   │   ├── SocietyAdminDashboard.jsx
│   │   │   └── RihaishAdminDashboard.jsx
│   │   ├── services/
│   │   │   └── api.js                # [NEW] Axios/Fetch API client communicating with backend
│   │   ├── App.jsx
│   │   └── main.jsx
```

---

## Detailed Step-by-Step Implementation

### Step 1: Real Data Scraping, Extraction & Ingestion Pipeline
- Build `backend/app/db/scraper_pipeline.py` extracting real Pakistani real estate records (DHA Karachi/Lahore/Islamabad, Bahria Town, Scheme 33, Northern Bypass Corridor, Surjani 41, LDA City, Al-Kabir Town, Capital Smart City, Faisal Town 2, New Metro City, B-17 Multi Gardens, Gulberg Greens).
- Extract real coordinates, real NOC approval serial numbers from KDA, LDA, RDA, CDA, and SBCA, real price histories (2021-2026 in PKR Lacs/Crores), and real amenity proximity coordinates (OpenStreetMap points).
- Build `backend/app/db/seed_real_data.py` to populate `auth_core.db` and the regional shard databases (`shard_karachi.db`, `shard_lahore.db`, `shard_islamabad.db`).

### Step 2: Real Relational Sharded Database Engine
- Define SQL schema in `backend/app/db/schema.sql` with tables:
  - `auth_core.db`: `users`, `otp_verifications`, `subscriptions`, `saved_properties`, `inquiries`, `email_logs`.
  - Shards (`shard_karachi.db`, `shard_lahore.db`, `shard_islamabad.db`): `properties`, `societies`, `government_records`, `price_history`, `facilities`, `progress_reports`, `investment_scores`.
- Implement `backend/app/core/shard_router.py` connecting directly to SQLite shard files, routing queries dynamically by `city_id`, monitoring latency, and supporting live replica failover.

### Step 3: Real RBAC Authentication with Email OTP Verification
- Signup flow: User enters Name, Email, Password, Role.
- Backend generates a secure 6-digit OTP, stores it in `auth_core.db`, and dispatches an OTP verification email.
- User submits OTP to activate account.
- JWT token issued with claims (`user_id`, `email`, `role`, `is_subscribed`, `society_id`).
- Protected endpoints verify role permissions (Investor routes only for `investor` and `admin`, Society routes only for `society_admin` matching `society_id`, Master Admin routes only for `admin`).

### Step 4: Email Notifications & Direct Admin Escalation
- `backend/app/core/email_service.py` handles:
  - **OTP Verification Emails**
  - **Subscription Invoices & Receipts**
  - **Direct Inquiry Alerts**: Sent to `abdullahkh1298@gmail.com` with full user details and property link.
  - **Market Intelligence Newsletter Confirmations**
- Direct WhatsApp integration: Creates pre-filled WhatsApp click-to-chat links to `https://wa.me/923122677981`.

### Step 5: Floating AI Chatbot (`AIChatbot.jsx`)
- Floating interactive widget in bottom-right corner of all pages.
- Provides real-time answers about society legal NOCs, price projections, and facility proximity.
- Includes a direct "Talk to Rihaish Lead Consultant on WhatsApp" button triggering `https://wa.me/923122677981`.

### Step 6: Frontend Pages & Workflows
- **Saved Plots Page (`/saved-plots`)**: Displays all saved properties stored in backend database with remove action, price trend summary, and direct inquiry link.
- **Subscription Checkout Page (`/checkout`)**: Clean checkout interface for Buyer Pro (PKR 4,999/yr) and Society Tiers (Starter PKR 45k/mo, Growth PKR 95k/mo, Enterprise PKR 220k/mo) with instant activation and email receipt.
- **Property Detail Page**: Direct Inquiry form calling backend API + WhatsApp link to `+92 03122677981`. Working Share button with clipboard copy toast. Unlocked premium features for subscribed users.
- **Navbar & Footer**: Dedicated Saved Plots link for logged-in users, role indicators, and working footer links.

---

## Verification Plan

### Automated Verification
1. Run backend tests to verify database creation, shard routing, real data seeding, OTP generation, and REST endpoints.
2. Run `npm run build` in `frontend` to verify 0 syntax or bundling errors.

### End-to-End User Flow Verification
1. **Signup with OTP**: Register new user, enter OTP, verify account activation and redirection to role dashboard.
2. **RBAC Isolation**: Verify Investor cannot access Society Admin inventory, Society Admin only accesses their society, and Rihaish Admin has full master console.
3. **Inquiry Dispatch**: Submit property inquiry and verify logging to `abdullahkh1298@gmail.com` and WhatsApp `+92 03122677981`.
4. **Checkout Flow**: Complete mock subscription and verify unlocked premium features and email receipt.
5. **Shard Failover**: Trigger failover on Karachi shard in Admin console and verify live replica promotion.
