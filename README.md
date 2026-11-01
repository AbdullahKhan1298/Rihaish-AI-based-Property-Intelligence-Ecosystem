# RIHAISH — An AI-Powered Property & Society Intelligence Ecosystem

> **DDS recovery (October 26, 2026):** Native three-node rqlite, two API instances and Caddy are available. Start with [the current DDS runbook](docs/DDS_RUNBOOK.md) and [verified progress](docs/DDS_EXECUTION_TRACKER.md). The older SQLite simulator description below is historical and does not establish fault tolerance.

RIHAISH is an end-to-end, data-driven web platform for real estate discovery, evaluation, and predictive investment intelligence across Pakistan's urban centers (Karachi, Lahore, Islamabad/Rawalpindi) and high-growth emerging development corridors.

---

## 🌟 Key Capabilities & Unique AI Features

1. **5-Year AI Price Forecasting & Trajectory Modeling**:
   - Time-series ARIMA and multivariate growth algorithms forecasting property and society valuations over 1, 3, and 5-year outlooks with upper & lower statistical confidence intervals.
   - Clear investment recommendations (*STRONG BUY*, *BUY*, *HOLD*) and dynamic ROI calculations.

2. **100% Government Lease (Leez) & Legal Transparency**:
   - Every listed plot is linked to verified municipal and development authority records (KDA 99-Year Leasehold, LDA Allotment Letter, RDA Masterplan NOC, CDA NOC).
   - Zero opacity: NOC serials, issuing authority seals, and audit timestamps are surfaced directly to buyers and investors before any transaction.

3. **Facility & Location Intelligence Radar**:
   - Proximity scorecard calculating geospatial Haversine distance and real-world urban drive times to nearest Mosques (Jamia Masjids), Top Schools & Universities, Tertiary Hospitals, Commercial Bazaars & Food Streets, and Main Expressways / Motorways.

4. **Real-Time Construction Progress Tracking**:
   - Under-construction housing schemes upload dated milestone reports (overall % completion, milestone logs, verified site photographs).
   - Verified on-ground by Rihaish audit team, eliminating the need for physical site visits.

5. **Horizontally Distributed Database Sharding**:
   - Scalable architecture partitioned by `city_id` across independent regional shards:
     - `shard-khi`: Karachi Metropolitan Shard (DHA, Scheme 33, Northern Bypass Corridor, Surjani)
     - `shard-lhr`: Lahore Shard (DHA Phase 9, LDA City, Bahria Orchard, Al-Kabir Town)
     - `shard-isb`: Islamabad / Rawalpindi Shard (Capital Smart City, Faisal Town 2, New Metro City, Gulberg Greens)
   - Primary-to-replica automatic failover simulator integrated into the Master Admin Console.

---

## 👥 Role-Based Architecture & Secure Navigation

- **Public Visitors**: Home, Search & Filters, Property Details, Free Valuation Tools. (Restricted admin and investor dashboards are securely hidden from the public navigation header).
- **Investor Pro (Post-Login)**: Portfolio Watchlist, AI 1/3/5-Year Forecasting Sandbox, Comparative Society Liquidity Matrix, Construction Milestone Timeline Feed.
- **Society Admin (B2B)**: Inventory Manager (Add/Edit plots, set price, upload NOC records), Construction Milestone Uploader, B2B Subscription management.
- **Rihaish Master Authority (`/admin/login`)**: Society Verification Queue (Approve/Reject NOC certificates), Shard Health Monitor & Failover Simulator, Platform-wide metrics.

---

## 🚀 Free-Tier Tech Stack & Deployment Guide

### 1. Frontend (React + Vite + Tailwind CSS)
- **Local Run**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- **Free Deployment**:
  - Deployable on **Vercel** or **Netlify** with zero configuration (via `vercel.json`).

### 2. Backend API (Python FastAPI)
- **Local Run**:
  ```bash
  cd backend
  pip install -r requirements.txt
  python run.py
  ```
  - Interactive Swagger API Documentation: `http://localhost:8000/docs`
- **Free Deployment**:
  - Deployable on **Render** (Free Web Service via `render.yaml`) or **Railway** / **Fly.io**.

---

© 2026 RIHAISH Technologies Inc. All Rights Reserved.
