"""Router administrativo: Gestión y CRUD de equipamiento de montaña (RF 008, HU07, HU09)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.administrador import Administrador
from app.models.categoria import Categoria
from app.models.detalle_reserva import DetalleReserva
from app.models.equipo import Equipo
from app.models.reserva import Reserva
from app.schemas.common import ErrorResponse, MessageResponse
from app.schemas.equipo import EquipoConCategoriaResponse, EquipoCreate, EquipoResponse, EquipoUpdate

router = APIRouter(prefix="/admin/equipos", tags=["Admin: Equipos"])


@router.post(
    "",
    response_model=EquipoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Agregar nuevo equipamiento de montaña (RF 008, HU07)",
)
async def crear_equipo(
    datos: EquipoCreate,
    admin: Administrador = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Equipo:
    # Verificar que la categoría exista
    query_cat = select(Categoria).where(Categoria.id_categoria == datos.id_categoria)
    res_cat = await db.execute(query_cat)
    if not res_cat.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La categoría con ID {datos.id_categoria} no existe.",
        )

    nuevo_equipo = Equipo(
        id_categoria=datos.id_categoria,
        nombre_equipo=datos.nombre_equipo.strip(),
        caracteristicas=datos.caracteristicas.strip(),
        precio_arriendo=datos.precio_arriendo,
        cantidad=datos.cantidad,
        id_admin=admin.id_admin,
    )
    db.add(nuevo_equipo)
    await db.commit()
    await db.refresh(nuevo_equipo)
    return nuevo_equipo


@router.put(
    "/{id_equipo}",
    response_model=EquipoResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Actualizar información, precio o stock de un equipo (HU07, HU09)",
)
async def actualizar_equipo(
    id_equipo: int,
    datos: EquipoUpdate,
    admin: Administrador = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Equipo:
    query = select(Equipo).where(Equipo.id_equipo == id_equipo)
    res = await db.execute(query)
    equipo = res.scalar_one_or_none()

    if not equipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El equipo con ID {id_equipo} no existe.",
        )

    if datos.id_categoria is not None:
        query_cat = select(Categoria).where(Categoria.id_categoria == datos.id_categoria)
        res_cat = await db.execute(query_cat)
        if not res_cat.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"La categoría con ID {datos.id_categoria} no existe.",
            )
        equipo.id_categoria = datos.id_categoria

    if datos.nombre_equipo is not None:
        equipo.nombre_equipo = datos.nombre_equipo.strip()
    if datos.caracteristicas is not None:
        equipo.caracteristicas = datos.caracteristicas.strip()
    if datos.precio_arriendo is not None:
        equipo.precio_arriendo = datos.precio_arriendo
    if datos.cantidad is not None:
        equipo.cantidad = datos.cantidad

    await db.commit()
    await db.refresh(equipo)
    return equipo


@router.delete(
    "/{id_equipo}",
    response_model=MessageResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Equipo con arriendos activos"},
        404: {"model": ErrorResponse, "description": "Equipo no encontrado"},
    },
    summary="Eliminar equipo del catálogo",
)
async def eliminar_equipo(
    id_equipo: int,
    admin: Administrador = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    query = select(Equipo).where(Equipo.id_equipo == id_equipo)
    res = await db.execute(query)
    equipo = res.scalar_one_or_none()

    if not equipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El equipo con ID {id_equipo} no existe.",
        )

    # Verificar si está comprometido en reservas no devueltas/canceladas
    query_activos = (
        select(DetalleReserva)
        .join(Reserva, DetalleReserva.id_reserva == Reserva.id_reserva)
        .where(
            DetalleReserva.id_equipo == id_equipo,
            Reserva.estado_reserva.in_(("pendiente", "confirmada", "en_arriendo")),
        )
    )
    res_activos = await db.execute(query_activos)
    if res_activos.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar el equipo porque forma parte de arriendos activos o pendientes.",
        )

    await db.delete(equipo)
    await db.commit()
    return MessageResponse(message=f"Equipo '{equipo.nombre_equipo}' eliminado con éxito.")
