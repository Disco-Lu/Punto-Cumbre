"""Modelo ORM: detalle_reserva.

Tabla: detalle_reserva
Relación N:M entre reserva y equipo (qué equipos incluye cada reserva).
"""

from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DetalleReserva(Base):
    __tablename__ = "detalle_reserva"

    id_detalle: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_reserva: Mapped[int] = mapped_column(Integer, ForeignKey("reserva.id_reserva", ondelete="CASCADE"), nullable=False)
    id_equipo: Mapped[int] = mapped_column(Integer, ForeignKey("equipo.id_equipo", ondelete="RESTRICT"), nullable=False)

    # Relaciones
    reserva: Mapped["Reserva"] = relationship(back_populates="detalles")
    equipo: Mapped["Equipo"] = relationship(back_populates="detalles_reserva")
