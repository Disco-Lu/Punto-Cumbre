"""Modelo ORM: reserva.

Tabla: reserva
Reservas de arriendo de equipamiento (RF 003, RF 007, HU03, HU10, HU12).
Estados: pendiente → confirmada → en_arriendo → devuelta (+ cancelada).
"""

from datetime import datetime

from sqlalchemy import Integer, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Reserva(Base):
    __tablename__ = "reserva"
    __table_args__ = (
        CheckConstraint("fecha_devolucion >= fecha_retiro", name="chk_fechas"),
        CheckConstraint(
            "estado_reserva IN ('pendiente', 'confirmada', 'en_arriendo', 'devuelta', 'cancelada')",
            name="chk_estado_reserva",
        ),
    )

    id_reserva: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_cliente: Mapped[int] = mapped_column(Integer, ForeignKey("cliente.id_cliente"), nullable=False)
    fecha_retiro: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_devolucion: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    estado_reserva: Mapped[str] = mapped_column(String(20), nullable=False, default="pendiente")

    # Relaciones
    cliente: Mapped["Cliente"] = relationship(back_populates="reservas")
    detalles: Mapped[list["DetalleReserva"]] = relationship(
        back_populates="reserva", cascade="all, delete-orphan"
    )
    cotizaciones: Mapped[list["ReservaCotizacion"]] = relationship(back_populates="reserva")
    pagos: Mapped[list["Pago"]] = relationship(back_populates="reserva")
