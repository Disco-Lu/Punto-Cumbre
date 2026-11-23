"""Modelo ORM: reserva_cotizacion.

Tabla: reserva_cotizacion
Cotizaciones asociadas a una reserva (RF 004, RF 005, HU04, HU05).
"""

from datetime import datetime

from sqlalchemy import Integer, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class ReservaCotizacion(Base):
    __tablename__ = "reserva_cotizacion"
    __table_args__ = (
        CheckConstraint(
            "estado_cotizacion IN ('pendiente', 'confirmada', 'cancelada')",
            name="chk_estado_cotizacion",
        ),
    )

    id_cotizacion: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_reserva: Mapped[int] = mapped_column(Integer, ForeignKey("reserva.id_reserva"), nullable=False)
    fecha_solicitud: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    estado_cotizacion: Mapped[str] = mapped_column(String(20), nullable=False, default="pendiente")

    # Relaciones
    reserva: Mapped["Reserva"] = relationship(back_populates="cotizaciones")
