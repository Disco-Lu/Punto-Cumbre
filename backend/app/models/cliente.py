"""Modelo ORM: cliente.

Tabla: cliente
Datos de contacto del cliente (sin cuenta, identificación por datos).
"""

from datetime import datetime

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Cliente(Base):
    __tablename__ = "cliente"

    id_cliente: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    correo: Mapped[str] = mapped_column(String(320), nullable=False)
    telefono: Mapped[str] = mapped_column(String(20), nullable=False)
    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relaciones
    reservas: Mapped[list["Reserva"]] = relationship(back_populates="cliente")
