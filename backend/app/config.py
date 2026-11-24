"""Application configuration module.

Implements Green Software principles:
- Uses @lru_cache to ensure .env is read and parsed once in memory (avoids redundant disk I/O).
- Validates settings with Pydantic v2 (Rust-backed for low CPU footprint).
"""

from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application configuration sourced from environment variables or .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App Info ─────────────────────────────────────────────────────────────
    APP_NAME: str = "Punto Cumbre API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    DEBUG: bool = True

    # ── CORS ─────────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",

    ]

    # ── Database (Supabase PostgreSQL via asyncpg) ───────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"

    # Green Software: Connection pool tuning
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800  # Recycle connections every 30 minutes

    # ── Security & JWT ───────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "insecure-dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    # ── E-mail (SMTP) ────────────────────────────────────────────────────────
    SMTP_HOST: str = "smtp.example.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "notificaciones@puntocumbre.cl"
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "notificaciones@puntocumbre.cl"

    # ── File Uploads ─────────────────────────────────────────────────────────
    UPLOAD_DIR: str = "./uploads"
    MAX_IMAGE_SIZE_MB: int = 5


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached instance of application settings.

    Green Software benefit: Zero repeated disk I/O for environment variables.
    """
    return Settings()


# Singleton access
settings = get_settings()
