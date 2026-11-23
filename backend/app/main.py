"""Punto Cumbre API — Main entrypoint.

Tech Stack:
- FastAPI 0.115+
- Pydantic v2
- SQLAlchemy 2.0 Async (asyncpg)
- ORJSONResponse (High performance, low carbon footprint)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.config import settings
from app.database import close_db_connection
from app.routers import (
    categorias,
    cotizaciones,
    equipos,
    health,
    reservas,
)
from app.routers.admin import (
    auth as admin_auth,
    categorias as admin_categorias,
    dashboard as admin_dashboard,
    equipos as admin_equipos,
    pagos as admin_pagos,
    reservas as admin_reservas,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager (Green Software).

    - Startup: Log startup and initialize cached singletons.
    - Shutdown: Safely dispose database connection pools and descriptors.
    """
    # Startup phase
    yield

    # Shutdown phase: Clean resource deallocation
    await close_db_connection()


# Create FastAPI application instance
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API REST para la plataforma de arriendo de equipos de montaña Punto Cumbre.",
    lifespan=lifespan,
    default_response_class=ORJSONResponse,  # Green Software: ~5-10x faster JSON serialization
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
)

# Configure Cross-Origin Resource Sharing (CORS)
# Allows the frontend (Next.js) developed by teammate to interact seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"], summary="Página de bienvenida")
async def root():
    """Root endpoint with quick API reference links."""
    return {
        "message": "Bienvenido a la API de Punto Cumbre",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/api/v1/health",
        "spec": "/api/v1/openapi.json",
    }


# ── Rutas Públicas ────────────────────────────────────────────────────────────
app.include_router(health.router, prefix="/api/v1")
app.include_router(categorias.router, prefix="/api/v1")
app.include_router(equipos.router, prefix="/api/v1")
app.include_router(cotizaciones.router, prefix="/api/v1")
app.include_router(reservas.router, prefix="/api/v1")

# ── Rutas de Administración (Protegidas) ──────────────────────────────────────
app.include_router(admin_auth.router, prefix="/api/v1")
app.include_router(admin_categorias.router, prefix="/api/v1")
app.include_router(admin_equipos.router, prefix="/api/v1")
app.include_router(admin_reservas.router, prefix="/api/v1")
app.include_router(admin_pagos.router, prefix="/api/v1")
app.include_router(admin_dashboard.router, prefix="/api/v1")
