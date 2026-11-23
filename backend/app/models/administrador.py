"""Modelo ORM: administrador.

Tabla: administrador
Gestiona el acceso al panel de administración (ruta oculta, RNF 002).
"""

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Administrador(Base):
    __tablename__ = "administrador"

    id_admin: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relaciones inversas
    categorias: Mapped[list["Categoria"]] = relationship(back_populates="administrador")
    equipos: Mapped[list["Equipo"]] = relationship(back_populates="administrador")
    ingresos_diarios: Mapped[list["IngresoDiario"]] = relationship(back_populates="administrador")
