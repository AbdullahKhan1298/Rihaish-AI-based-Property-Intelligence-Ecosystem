from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sqlite3
import os
from .core.config import settings
from .core.admission import AdmissionState, AdmissionControlMiddleware
from .api.routes_auth import router as auth_router
from .api.routes_properties import router as properties_router
from .api.routes_watchlist import router as watchlist_router
from .api.routes_inquiry import router as inquiry_router
from .api.routes_subscription import router as subscription_router
from .api.routes_ai_predict import router as ai_predict_router
from .api.routes_facilities import router as facilities_router
from .api.routes_progress import router as progress_router
from .api.routes_society import router as society_router
from .api.routes_admin import router as admin_router
from .db.database import init_all_databases, DB_DIR, distributed_enabled

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Distributed AI-Powered Real Estate & Society Intelligence Ecosystem API Layer"
)

admission = AdmissionState(int(os.getenv('RIHAISH_MAX_INFLIGHT', '8')))
app.state.admission = admission
# CORS and instance middleware wrap admission so rejected responses keep headers.
app.add_middleware(AdmissionControlMiddleware, state=admission)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(sqlite3.IntegrityError)
async def database_conflict(request, exc):
    return JSONResponse(status_code=409, content={'detail': 'Database constraint conflict. Refresh and retry the operation.'})

@app.exception_handler(sqlite3.OperationalError)
async def database_unavailable(request, exc):
    return JSONResponse(status_code=503, content={'detail': 'Database unavailable or write outcome uncertain. Check state before retrying.'})

class InstanceHeaderMiddleware:
    """Add the instance header without BaseHTTPMiddleware's extra stream/tasks."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        async def with_instance_header(message):
            if message['type'] == 'http.response.start':
                message['headers'] = [*message.get('headers', []),
                                      (b'x-rihaish-instance', os.getenv('RIHAISH_INSTANCE_ID', 'local').encode())]
            await send(message)
        await self.app(scope, receive, with_instance_header)

app.add_middleware(InstanceHeaderMiddleware)

@app.get('/api/health/live')
async def liveness():
    """API process only. Database readiness remains a separate quorum probe."""
    return {'alive': True, 'instance': os.getenv('RIHAISH_INSTANCE_ID', 'local'),
            'admission': admission.snapshot()}

@app.get('/api/health/ready')
def readiness():
    from .db.database import get_auth_db
    conn = get_auth_db()
    try:
        conn.execute('SELECT COUNT(*) AS count FROM users').fetchone()
        return {'ready': True, 'database': 'rqlite' if distributed_enabled() else 'sqlite', 'instance': os.getenv('RIHAISH_INSTANCE_ID', 'local')}
    finally:
        conn.close()

@app.on_event("startup")
def on_startup():
    """Initialize databases and auto-seed if empty."""
    init_all_databases()
    if distributed_enabled():
        # Never run seeders, scrapers or SMTP side effects in each API instance.
        return
    
    # Auto-seed if primary shards are empty (first run)
    from .db.database import get_shard_db
    try:
        conn = get_shard_db("islamabad", use_replica=False)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as cnt FROM properties")
        row = cursor.fetchone()
        count = row["cnt"] if row else 0
        conn.close()
        
        if count == 0:
            print("[STARTUP] Empty databases detected — running full seeder...")
            from .db.seed_real_data import run_full_seeder
            run_full_seeder()
        else:
            print(f"[STARTUP] Databases already populated ({count} properties in ISB shard). Skipping seed.")
    except Exception as e:
        print(f"[STARTUP] Seed check failed: {e}. Attempting seed...")
        try:
            from .db.seed_real_data import run_full_seeder
            run_full_seeder()
        except Exception as e2:
            print(f"[STARTUP SEED ERROR] {e2}")

    # Auto-calibrate AI models with real data
    try:
        from .ml.model_trainer import model_trainer
        model_trainer.calibrate_on_startup()
    except Exception as e:
        print(f"[STARTUP] AI model calibration skipped: {e}")

    # Start cron data pipeline scheduler (every 15 days at off-peak)
    try:
        from .db.cron_pipeline import pipeline_scheduler
        pipeline_scheduler.start()
    except Exception as e:
        print(f"[STARTUP] Cron pipeline scheduler failed: {e}")

    # Validate SMTP connection on startup
    if settings.SMTP_ENABLED:
        try:
            import smtplib
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            print(f"[STARTUP] SMTP connection verified OK - emails will be sent from {settings.SMTP_USER}")
        except Exception as e:
            print(f"[STARTUP] SMTP connection failed: {e} - emails will be logged only")
    else:
        print("[STARTUP] SMTP disabled - set SMTP_PASSWORD in .env to enable OTP emails")

# Register Sub-Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(properties_router, prefix=settings.API_V1_STR)
app.include_router(watchlist_router, prefix=settings.API_V1_STR)
app.include_router(inquiry_router, prefix=settings.API_V1_STR)
app.include_router(subscription_router, prefix=settings.API_V1_STR)
app.include_router(ai_predict_router, prefix=settings.API_V1_STR)
app.include_router(facilities_router, prefix=settings.API_V1_STR)
app.include_router(progress_router, prefix=settings.API_V1_STR)
app.include_router(society_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "admin_inquiry_email": settings.ADMIN_EMAIL,
        "admin_whatsapp": settings.ADMIN_WHATSAPP,
        "smtp_enabled": settings.SMTP_ENABLED
    }
