"""Modelo ORM: pago.

Tabla: pago
Registro de pagos asociados a reservas.
"""

from datetime import datetime

from sqlalchemy import Integer, String, Numeric, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Pago(Base):
    __tablename__ = "pago"
    __table_args__ = (
        CheckConstraint("monto_pagado > 0", name="chk_monto_pagado"),
    )

    id_pago: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_reserva: Mapped[int] = mapped_column(Integer, ForeignKey("reserva.id_reserva"), nullable=False)
    monto_pagado: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    fecha_pago: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    metodo_pago: Mapped[str] = mapped_column(String(50), nullable=False)

    # Relaciones
    reserva: Mapped["Reserva"] = relationship(back_populates="pagos")
