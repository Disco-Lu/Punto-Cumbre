"""Schemas Pydantic: reserva_cotizacion.

Validación de datos para solicitudes de cotización asociadas a reservas.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

EstadoCotizacion = Literal["pendiente", "confirmada", "cancelada"]


# ── Requests ─────────────────────────────────────────────────────────────────

class CotizacionCreate(BaseModel):
    """Datos para generar una cotización."""
    id_reserva: int


class CotizacionStatusUpdate(BaseModel):
    """Datos para actualizar el estado de una cotización."""
    estado_cotizacion: EstadoCotizacion


# ── Responses ────────────────────────────────────────────────────────────────

class CotizacionResponse(BaseModel):
    """Cotización completa para respuestas de la API."""
    id_cotizacion: int
    id_reserva: int
    fecha_solicitud: datetime
    estado_cotizacion: str

    model_config = {"from_attributes": True}
