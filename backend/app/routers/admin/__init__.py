"""Admin protected routers package."""

from app.routers.admin import auth, categorias, dashboard, equipos, pagos, reservas

__all__ = [
    "auth",
    "categorias",
    "equipos",
    "reservas",
    "pagos",
    "dashboard",
]
