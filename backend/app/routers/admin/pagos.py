"""Router administrativo: Registro y consulta de pagos de arriendos."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.administrador import Administrador
from app.models.pago import Pago
from app.models.reserva import Reserva
from app.schemas.common import ErrorResponse
from app.schemas.pago import PagoCreate, PagoResponse

router = APIRouter(prefix="/admin/pagos", tags=["Admin: Pagos"])


@router.post(
    "",
    response_model=PagoResponse,
    status_code=status.HTTP_201_CREATED,
    responses={404: {"model": ErrorResponse, "description": "Reserva no encontrada"}},
    summary="Registrar pago de un arriendo",
    description="Registra la transacción monetaria asociada a una reserva. Si la reserva está 'pendiente', la actualiza a 'confirmada'.",
)
async def registrar_pago(
    datos: PagoCreate,
    admin: Administrador = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Pago:
    # 1. Validar que la reserva exista
    query_res = select(Reserva).where(Reserva.id_reserva == datos.id_reserva)
    res_res = await db.execute(query_res)
    reserva = res_res.scalar_one_or_none()

    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La reserva con ID {datos.id_reserva} no existe.",
        )

    # 2. Registrar el pago
    pago = Pago(
        id_reserva=datos.id_reserva,
        monto_pagado=datos.monto_pagado,
        metodo_pago=datos.metodo_pago.strip().lower(),
    )
    db.add(pago)

    # 3. Si la reserva estaba en pendiente, pasa a confirmada
    if reserva.estado_reserva == "pendiente":
        reserva.estado_reserva = "confirmada"

    await db.commit()
    await db.refresh(pago)
    return pago


@router.get(
    "/reserva/{id_reserva}",
    response_model=list[PagoResponse],
    summary="Consultar pagos de una reserva",
)
async def listar_pagos_reserva(
    id_reserva: int,
    admin: Administrador = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> list[Pago]:
    query = select(Pago).where(Pago.id_reserva == id_reserva).order_by(Pago.fecha_pago.desc())
    result = await db.execute(query)
    return list(result.scalars().all())
