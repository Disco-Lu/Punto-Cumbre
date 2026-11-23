"""Modelo ORM: categoria.

Tabla: categoria
Categorización de equipos de montaña (RF 001, HU01).
"""

from sqlalchemy import Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Categoria(Base):
    __tablename__ = "categoria"

    id_categoria: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre_categoria: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    id_admin: Mapped[int] = mapped_column(Integer, ForeignKey("administrador.id_admin"), nullable=False)

    # Relaciones
    administrador: Mapped["Administrador"] = relationship(back_populates="categorias")
    equipos: Mapped[list["Equipo"]] = relationship(back_populates="categoria")
