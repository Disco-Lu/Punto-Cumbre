"""Schemas Pydantic: categoria.

Validación de datos para categorías de equipos de montaña.
"""

from pydantic import BaseModel, Field


# ── Requests ─────────────────────────────────────────────────────────────────

class CategoriaCreate(BaseModel):
    """Datos para crear una categoría."""
    nombre_categoria: str = Field(..., min_length=1, max_length=100)
    descripcion: str | None = None
    id_admin: int


class CategoriaUpdate(BaseModel):
    """Datos para actualizar una categoría."""
    nombre_categoria: str = Field(..., min_length=1, max_length=100)
    descripcion: str | None = None


# ── Responses ────────────────────────────────────────────────────────────────

class CategoriaResponse(BaseModel):
    """Categoría completa para respuestas de la API."""
    id_categoria: int
    nombre_categoria: str
    descripcion: str | None = None
    id_admin: int

    model_config = {"from_attributes": True}
