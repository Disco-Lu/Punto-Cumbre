"""Schemas Pydantic: pago.

Validación de datos para transacciones y pagos de reservas.
"""

from datetime import datetime
from pydantic import BaseModel, Field


# ── Requests ─────────────────────────────────────────────────────────────────

class PagoCreate(BaseModel):
    """Datos para registrar un pago."""
    id_reserva: int
    monto_pagado: float = Field(..., gt=0, description="Monto total cancelado")
    metodo_pago: str = Field(..., min_length=1, max_length=50, description="Ej: transferencia, debito, credito")


# ── Responses ────────────────────────────────────────────────────────────────

class PagoResponse(BaseModel):
    """Pago completo para respuestas de la API."""
    id_pago: int
    id_reserva: int
    monto_pagado: float
    fecha_pago: datetime
    metodo_pago: str

    model_config = {"from_attributes": True}
