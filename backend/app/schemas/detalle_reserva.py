"""Schemas Pydantic: detalle_reserva.

Validación de datos para los detalles (equipos) incluidos en una reserva.
"""

from pydantic import BaseModel


# ── Requests ─────────────────────────────────────────────────────────────────

class DetalleReservaCreate(BaseModel):
    """Datos para agregar un equipo al detalle de una reserva."""
    id_reserva: int
    id_equipo: int


# ── Responses ────────────────────────────────────────────────────────────────

class DetalleReservaResponse(BaseModel):
    """Detalle de reserva para respuestas de la API."""
    id_detalle: int
    id_reserva: int
    id_equipo: int

    model_config = {"from_attributes": True}


class DetalleReservaConEquipoResponse(DetalleReservaResponse):
    """Detalle con información del equipo incluida."""
    equipo: "EquipoResponse | None" = None


# Importación diferida
from app.schemas.equipo import EquipoResponse  # noqa: E402
DetalleReservaConEquipoResponse.model_rebuild()
