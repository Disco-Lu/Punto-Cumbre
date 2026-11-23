"""SQLAlchemy ORM models package.

Importa todos los modelos para que SQLAlchemy los registre con Base.metadata.
Esto es necesario para que las relaciones entre modelos se resuelvan correctamente.
"""

from app.models.administrador import Administrador
from app.models.categoria import Categoria
from app.models.equipo import Equipo
from app.models.cliente import Cliente
from app.models.reserva import Reserva
from app.models.detalle_reserva import DetalleReserva
from app.models.cotizacion import ReservaCotizacion
from app.models.pago import Pago
from app.models.ingreso_diario import IngresoDiario

__all__ = [
    "Administrador",
    "Categoria",
    "Equipo",
    "Cliente",
    "Reserva",
    "DetalleReserva",
    "ReservaCotizacion",
    "Pago",
    "IngresoDiario",
]
