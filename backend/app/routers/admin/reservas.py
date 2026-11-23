"""Router administrativo: Gestión del ciclo de vida de arriendos y reservas (HU10)."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.administrador import Administrador
from app.models.detalle_reserva import DetalleReserva
from app.models.reserva import Reserva
from app.schemas.common import ErrorResponse
from app.schemas.reserva import ReservaConDetallesResponse, ReservaStatusUpdate

router = APIRouter(prefix="/admin/reservas", tags=["Admin: Reservas"])

# Máquina de estados formal acordada en la especificación SDD
TRANSICIONES_VALIDAS: dict[str, list[str]] = {
    "pendiente": ["confirmada", "cancelada"],
    "confirmada": ["en_arriendo", "cancelada"],
    "en_arriendo": ["devuelta", "cancelada"],
    "devuelta": [],   # Estado terminal
    "cancelada": [],  # Estado terminal
}


@router.get(
    "",
    response_model=list[ReservaConDetallesResponse],
    summary="Listar todas las reservas",
    description="Retorna el listado completo de arriendos con filtro opcional por estado (HU10).",
)
async def listar_todas_las_reservas(
    estado: str | None = Query(None, description="Filtrar por estado: pendiente, confirmada, en_arriendo, devuelta, cancelada"),
    admin: Administrador = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> list[Reserva]:
    query = (
        select(Reserva)
        .options(
            selectinload(Reserva.cliente),
            selectinload(Reserva.detalles).selectinload(DetalleReserva.equipo),
        )
        .order_by(Reserva.fecha_retiro.desc())
    )

    if estado:
        query = query.where(Reserva.estado_reserva == estado.strip().lower())

    result = await db.execute(query)
    return list(result.scalars().all())


@router.get(
    "/{id_reserva}",
    response_model=ReservaConDetallesResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Obtener detalle de una reserva específica",
)
async def obtener_reserva_admin(
    id_reserva: int,
    admin: Administrador = Depends(get_current_admin),
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
    res = await db.execute(query)
    reserva = res.scalar_one_or_none()

    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La reserva con ID {id_reserva} no existe.",
        )
    return reserva


@router.patch(
    "/{id_reserva}/estado",
    response_model=ReservaConDetallesResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Transición de estado inválida"},
        404: {"model": ErrorResponse, "description": "Reserva no encontrada"},
    },
    summary="Actualizar estado de una reserva (HU10)",
    description="Aplica la transición de estado (pendiente -> confirmada -> en_arriendo -> devuelta / cancelada) validando las reglas de negocio.",
)
async def actualizar_estado_reserva(
    id_reserva: int,
    cambio: ReservaStatusUpdate,
    admin: Administrador = Depends(get_current_admin),
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
    res = await db.execute(query)
    reserva = res.scalar_one_or_none()

    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La reserva con ID {id_reserva} no existe.",
        )

    estado_actual = reserva.estado_reserva
    nuevo_estado = cambio.estado_reserva

    # Validar máquina de estados
    transiciones_permitidas = TRANSICIONES_VALIDAS.get(estado_actual, [])
    if nuevo_estado not in transiciones_permitidas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Transición no permitida: no se puede cambiar de '{estado_actual}' a '{nuevo_estado}'. "
                f"Transiciones válidas: {transiciones_permitidas}"
            ),
        )

    reserva.estado_reserva = nuevo_estado
    await db.commit()
    await db.refresh(reserva)
    return reserva
