import os
from pathlib import Path

# Load .env file from backend directory
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    load_dotenv(env_path)
    print(f"[CONFIG] Loaded environment from {env_path}")
except ImportError:
    print("[CONFIG] python-dotenv not installed — using system environment variables only")


class Settings:
    PROJECT_NAME: str = "RIHAISH — AI-Powered Property & Society Intelligence Ecosystem"
    VERSION: str = "3.0.0"
    API_V1_STR: str = "/api"
    # Preserve the configured local key; never publish a shared signing secret.
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    if not SECRET_KEY:
        raise RuntimeError("Set SECRET_KEY in backend/.env before starting RIHAISH; see backend/.env.example")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "https://rihaish.vercel.app",
        "*"
    ]

    # SMTP Email Configuration — loaded from .env file
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "RIHAISH Intelligence")
    SMTP_ENABLED: bool = bool(os.getenv("SMTP_PASSWORD", ""))

    # Kaggle API Token for data scraping
    KAGGLE_API_TOKEN: str = os.getenv("KAGGLE_API_TOKEN", "")

    # Cron Pipeline
    SCRAPE_INTERVAL_DAYS: int = int(os.getenv("SCRAPE_INTERVAL_DAYS", "15"))

    # Admin Configuration
    ADMIN_EMAIL: str = os.getenv("SMTP_USER", "abdullahkh1298@gmail.com")
    ADMIN_WHATSAPP: str = "+92 03122677981"
    ADMIN_WHATSAPP_LINK: str = "https://wa.me/923122677981"


settings = Settings()

# Startup SMTP validation
if settings.SMTP_ENABLED:
    print(f"[CONFIG] SMTP enabled — sending from {settings.SMTP_USER} via {settings.SMTP_HOST}:{settings.SMTP_PORT}")
else:
    print("[CONFIG] SMTP disabled - no SMTP_PASSWORD found in .env. OTP emails will be logged only.")
