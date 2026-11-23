"""Modelo ORM: ingreso_diario.

Tabla: ingreso_diario
Registro consolidado de ingresos por día para el dashboard administrativo (RF 009).
"""

from datetime import date

from sqlalchemy import Integer, Date, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class IngresoDiario(Base):
    __tablename__ = "ingreso_diario"

    id_ingreso: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    total_ingresos: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    transacciones_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    id_admin: Mapped[int] = mapped_column(Integer, ForeignKey("administrador.id_admin"), nullable=False)

    # Relaciones
    administrador: Mapped["Administrador"] = relationship(back_populates="ingresos_diarios")
