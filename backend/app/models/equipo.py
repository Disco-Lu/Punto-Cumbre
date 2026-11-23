"""Modelo ORM: equipo.

Tabla: equipo
Equipos de montaña disponibles para arriendo (RF 002, RF 008, HU02, HU07).
"""

from sqlalchemy import Integer, String, Text, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Equipo(Base):
    __tablename__ = "equipo"

    id_equipo: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_categoria: Mapped[int] = mapped_column(Integer, ForeignKey("categoria.id_categoria"), nullable=False)
    nombre_equipo: Mapped[str] = mapped_column(String(200), nullable=False)
    caracteristicas: Mapped[str] = mapped_column(Text, nullable=False)
    precio_arriendo: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    id_admin: Mapped[int] = mapped_column(Integer, ForeignKey("administrador.id_admin"), nullable=False)

    # Relaciones
    categoria: Mapped["Categoria"] = relationship(back_populates="equipos")
    administrador: Mapped["Administrador"] = relationship(back_populates="equipos")
    detalles_reserva: Mapped[list["DetalleReserva"]] = relationship(back_populates="equipo")
