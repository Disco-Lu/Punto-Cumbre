"""Pydantic v2 schemas package.

Centraliza la exportación de todos los esquemas de validación de datos (DTOs)
para requests y responses de la API.
"""

from app.schemas.common import ErrorResponse, MessageResponse
from app.schemas.admin import AdminLoginRequest, AdminLoginResponse, AdminResponse
from app.schemas.categoria import CategoriaCreate, CategoriaUpdate, CategoriaResponse
from app.schemas.equipo import (
    EquipoCreate,
    EquipoUpdate,
    EquipoResponse,
    EquipoConCategoriaResponse,
)
from app.schemas.cliente import ClienteCreate, ClienteResponse
from app.schemas.detalle_reserva import (
    DetalleReservaCreate,
    DetalleReservaResponse,
    DetalleReservaConEquipoResponse,
)
from app.schemas.reserva import (
    EstadoReserva,
    ReservaCreate,
    ReservaStatusUpdate,
    ReservaResponse,
    ReservaConDetallesResponse,
)
from app.schemas.cotizacion import (
    EstadoCotizacion,
    CotizacionCreate,
    CotizacionStatusUpdate,
    CotizacionResponse,
    SolicitudCotizacionRequest,
    ResumenCotizacionResponse,
)
from app.schemas.pago import PagoCreate, PagoResponse
from app.schemas.ingreso_diario import IngresoDiarioCreate, IngresoDiarioResponse

__all__ = [
    "ErrorResponse",
    "MessageResponse",
    "AdminLoginRequest",
    "AdminLoginResponse",
    "AdminResponse",
    "CategoriaCreate",
    "CategoriaUpdate",
    "CategoriaResponse",
    "EquipoCreate",
    "EquipoUpdate",
    "EquipoResponse",
    "EquipoConCategoriaResponse",
    "ClienteCreate",
    "ClienteResponse",
    "DetalleReservaCreate",
    "DetalleReservaResponse",
    "DetalleReservaConEquipoResponse",
    "EstadoReserva",
    "ReservaCreate",
    "ReservaStatusUpdate",
    "ReservaResponse",
    "ReservaConDetallesResponse",
    "EstadoCotizacion",
    "CotizacionCreate",
    "CotizacionStatusUpdate",
    "CotizacionResponse",
    "SolicitudCotizacionRequest",
    "ResumenCotizacionResponse",
    "PagoCreate",
    "PagoResponse",
    "IngresoDiarioCreate",
    "IngresoDiarioResponse",
]
