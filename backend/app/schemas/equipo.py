"""Schemas Pydantic: equipo.

Validación de datos para equipos de montaña.
"""

from pydantic import BaseModel, Field


# ── Requests ─────────────────────────────────────────────────────────────────

class EquipoCreate(BaseModel):
    """Datos para crear un equipo."""
    id_categoria: int
    nombre_equipo: str = Field(..., min_length=1, max_length=200)
    caracteristicas: str = Field(..., min_length=1)
    precio_arriendo: float = Field(..., gt=0)
    cantidad: int = Field(..., ge=0)
    id_admin: int


class EquipoUpdate(BaseModel):
    """Datos para actualizar un equipo."""
    id_categoria: int | None = None
    nombre_equipo: str | None = Field(None, min_length=1, max_length=200)
    caracteristicas: str | None = Field(None, min_length=1)
    precio_arriendo: float | None = Field(None, gt=0)
    cantidad: int | None = Field(None, ge=0)


# ── Responses ────────────────────────────────────────────────────────────────

class EquipoResponse(BaseModel):
    """Equipo completo para respuestas de la API."""
    id_equipo: int
    id_categoria: int
    nombre_equipo: str
    caracteristicas: str
    precio_arriendo: float
    cantidad: int
    id_admin: int

    model_config = {"from_attributes": True}


class EquipoConCategoriaResponse(EquipoResponse):
    """Equipo con datos de la categoría incluidos."""
    categoria: "CategoriaResponse | None" = None


# Importación diferida para evitar dependencia circular
from app.schemas.categoria import CategoriaResponse  # noqa: E402
EquipoConCategoriaResponse.model_rebuild()
