"""Schemas Pydantic: ingreso_diario.

Validación de datos para el consolidado de ingresos del dashboard administrativo.
"""

from datetime import date
from pydantic import BaseModel, Field


# ── Requests ─────────────────────────────────────────────────────────────────

class IngresoDiarioCreate(BaseModel):
    """Datos para registrar o consolidar un ingreso diario."""
    fecha: date
    total_ingresos: float = Field(default=0, ge=0)
    transacciones_count: int = Field(default=0, ge=0)
    id_admin: int


# ── Responses ────────────────────────────────────────────────────────────────

class IngresoDiarioResponse(BaseModel):
    """Ingreso diario consolidado para respuestas del dashboard."""
    id_ingreso: int
    fecha: date
    total_ingresos: float
    transacciones_count: int
    id_admin: int

    model_config = {"from_attributes": True}
