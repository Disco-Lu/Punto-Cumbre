"""Health check and service status router."""

from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel

from app.config import settings

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    environment: str
    timestamp: str
    green_features: dict[str, str]


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Verificar estado del servicio",
    description="Endpoint de diagnóstico liviano para monitoreo y verificación de salud de la API.",
)
async def check_health() -> HealthResponse:
    """Return application health status with green software metrics."""
    return HealthResponse(
        status="ok",
        app=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc).isoformat(),
        green_features={
            "json_serializer": "orjson (Rust core)",
            "io_model": "asyncpg non-blocking event loop",
            "connection_pooling": f"max {settings.DB_POOL_SIZE + settings.DB_MAX_OVERFLOW} connections",
            "settings_cache": "lru_cache active (0 repeated disk I/O)",
        },
    )
