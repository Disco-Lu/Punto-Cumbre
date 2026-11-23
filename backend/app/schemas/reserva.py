"""Schemas Pydantic: reserva.

Validación de datos para reservas de arriendo.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


# ── Tipos ────────────────────────────────────────────────────────────────────

EstadoReserva = Literal["pendiente", "confirmada", "en_arriendo", "devuelta", "cancelada"]


# ── Requests ─────────────────────────────────────────────────────────────────

class ReservaCreate(BaseModel):
    """Datos para crear una reserva."""
    id_cliente: int
    fecha_retiro: datetime
    fecha_devolucion: datetime
    equipos_ids: list[int] = Field(..., min_length=1, description="IDs de los equipos a reservar")

    @model_validator(mode="after")
    def validar_fechas(self):
        if self.fecha_devolucion < self.fecha_retiro:
            raise ValueError("La fecha de devolución debe ser igual o posterior a la fecha de retiro.")
        return self


class ReservaStatusUpdate(BaseModel):
    """Datos para actualizar el estado de una reserva."""
    estado_reserva: EstadoReserva


# ── Responses ────────────────────────────────────────────────────────────────

class ReservaResponse(BaseModel):
    """Reserva completa para respuestas de la API."""
    id_reserva: int
    id_cliente: int
    fecha_retiro: datetime
    fecha_devolucion: datetime
    estado_reserva: str

    model_config = {"from_attributes": True}


class ReservaConDetallesResponse(ReservaResponse):
    """Reserva con datos del cliente y detalles de equipos."""
    cliente: "ClienteResponse | None" = None
    detalles: list["DetalleReservaConEquipoResponse"] = []


# Importaciones diferidas
from app.schemas.cliente import ClienteResponse  # noqa: E402
from app.schemas.detalle_reserva import DetalleReservaConEquipoResponse  # noqa: E402
ReservaConDetallesResponse.model_rebuild()
