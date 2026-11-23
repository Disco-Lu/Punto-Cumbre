"""Router público: Consulta de reservas del cliente (RF 007, HU12)."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.cliente import Cliente
from app.models.detalle_reserva import DetalleReserva
from app.models.reserva import Reserva
from app.schemas.common import ErrorResponse
from app.schemas.reserva import ReservaConDetallesResponse

router = APIRouter(prefix="/reservas", tags=["Reservas"])


@router.get(
    "",
    response_model=list[ReservaConDetallesResponse],
    summary="Consultar historial de reservas por correo del cliente",
    description="Permite a los clientes revisar el estado de sus reservas actuales y anteriores ingresando su correo (HU12).",
)
async def consultar_reservas_cliente(
    correo: str = Query(..., description="Correo electrónico asociado a las reservas"),
    db: AsyncSession = Depends(get_db),
) -> list[Reserva]:
    query = (
        select(Reserva)
        .join(Cliente, Reserva.id_cliente == Cliente.id_cliente)
        .options(
            selectinload(Reserva.cliente),
            selectinload(Reserva.detalles).selectinload(DetalleReserva.equipo),
        )
        .where(Cliente.correo == correo.strip().lower())
        .order_by(Reserva.fecha_retiro.desc())
    )
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get(
    "/{id_reserva}",
    response_model=ReservaConDetallesResponse,
    responses={404: {"model": ErrorResponse, "description": "Reserva no encontrada"}},
    summary="Consultar detalle de una reserva por ID",
)
async def obtener_detalle_reserva(
    id_reserva: int,
    db: AsyncSession = Depends(get_db),
) -> Reserva:
    query = (
        select(Reserva)
        .options(
            selectinload(Reserva.cliente),
            selectinload(Reserva.detalles).selectinload(DetalleReserva.equipo),
        )
        .where(Reserva.id_reserva == id_reserva)
    )
    result = await db.execute(query)
    reserva = result.scalar_one_or_none()

    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La reserva con ID {id_reserva} no existe.",
        )
    return reserva
