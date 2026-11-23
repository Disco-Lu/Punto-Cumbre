"""Schemas Pydantic: reserva_cotizacion.

Validación de datos para solicitudes de cotización asociadas a reservas.
"""

from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, EmailStr, Field

EstadoCotizacion = Literal["pendiente", "confirmada", "cancelada"]


# ── Requests ─────────────────────────────────────────────────────────────────

class CotizacionCreate(BaseModel):
    """Datos para generar una cotización interna a partir de una reserva."""
    id_reserva: int


class CotizacionStatusUpdate(BaseModel):
    """Datos para actualizar el estado de una cotización."""
    estado_cotizacion: EstadoCotizacion


class SolicitudCotizacionRequest(BaseModel):
    """Payload enviado por el cliente para solicitar una cotización automática (HU04)."""
    nombre_cliente: str = Field(..., min_length=1, max_length=200)
    correo_cliente: EmailStr
    telefono_cliente: str = Field(..., min_length=1, max_length=20)
    fecha_retiro: datetime
    fecha_devolucion: datetime
    equipos_ids: list[int] = Field(..., min_length=1, description="Lista de IDs de equipos a cotizar")


# ── Responses ────────────────────────────────────────────────────────────────

class CotizacionResponse(BaseModel):
    """Cotización completa para respuestas de la API."""
    id_cotizacion: int
    id_reserva: int
    fecha_solicitud: datetime
    estado_cotizacion: str

    model_config = {"from_attributes": True}


class EquipoCotizadoItem(BaseModel):
    id_equipo: int
    nombre_equipo: str
    precio_arriendo_dia: float


class DetalleArriendoCotizacion(BaseModel):
    fecha_retiro: datetime
    fecha_devolucion: datetime
    total_dias: int
    equipos: list[EquipoCotizadoItem]
    total_estimado: float


class ClienteCotizacionInfo(BaseModel):
    id_cliente: int
    nombre: str
    correo: str
    telefono: str


class ResumenCotizacionResponse(BaseModel):
    """Resumen completo devuelto tras calcular una cotización (HU05)."""
    id_cotizacion: int
    id_reserva: int
    estado_cotizacion: str
    fecha_solicitud: datetime
    cliente: ClienteCotizacionInfo
    arriendo: DetalleArriendoCotizacion
