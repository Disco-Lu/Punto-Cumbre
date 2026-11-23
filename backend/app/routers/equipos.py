"""Router público: Catálogo de equipos y consulta de disponibilidad (HU01, HU02, HU03)."""

from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.equipo import Equipo
from app.schemas.common import ErrorResponse
from app.schemas.equipo import EquipoConCategoriaResponse
from app.services.disponibilidad import consultar_disponibilidad_equipo

router = APIRouter(prefix="/equipos", tags=["Equipos"])


@router.get(
    "",
    response_model=list[EquipoConCategoriaResponse],
    summary="Listar catálogo de equipos",
    description="Retorna los equipos disponibles en el catálogo con soporte para filtros por categoría y búsqueda textual.",
)
async def listar_equipos(
    id_categoria: int | None = Query(None, description="Filtrar por ID de categoría"),
    search: str | None = Query(None, description="Búsqueda por nombre de equipo"),
    db: AsyncSession = Depends(get_db),
) -> list[Equipo]:
    # Green Software: selectinload precarga la categoría en una sola consulta adicional en vez de N+1
    query = select(Equipo).options(selectinload(Equipo.categoria))

    if id_categoria is not None:
        query = query.where(Equipo.id_categoria == id_categoria)

    if search:
        query = query.where(Equipo.nombre_equipo.ilike(f"%{search.strip()}%"))

    query = query.order_by(Equipo.nombre_equipo.asc())
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get(
    "/{id_equipo}",
    response_model=EquipoConCategoriaResponse,
    responses={404: {"model": ErrorResponse, "description": "Equipo no encontrado"}},
    summary="Consultar ficha técnica de un equipo",
    description="Retorna las características completas, precio y condiciones de arriendo del equipo (HU02).",
)
async def obtener_ficha_tecnica(
    id_equipo: int,
    db: AsyncSession = Depends(get_db),
) -> Equipo:
    query = (
        select(Equipo)
        .options(selectinload(Equipo.categoria))
        .where(Equipo.id_equipo == id_equipo)
    )
    result = await db.execute(query)
    equipo = result.scalar_one_or_none()

    if not equipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El equipo con ID {id_equipo} no fue encontrado.",
        )
    return equipo


@router.get(
    "/{id_equipo}/disponibilidad",
    summary="Consultar disponibilidad por fechas",
    description="Verifica si un equipo cuenta con unidades libres para las fechas de retiro y devolución seleccionadas (HU03).",
)
async def consultar_disponibilidad(
    id_equipo: int,
    fecha_retiro: datetime = Query(..., description="Fecha y hora de retiro (ISO 8601)"),
    fecha_devolucion: datetime = Query(..., description="Fecha y hora de devolución (ISO 8601)"),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    if fecha_devolucion < fecha_retiro:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha de devolución no puede ser anterior a la fecha de retiro.",
        )

    disponibilidad = await consultar_disponibilidad_equipo(
        db, id_equipo, fecha_retiro, fecha_devolucion
    )
    if disponibilidad["cantidad_total"] == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El equipo con ID {id_equipo} no existe.",
        )

    return disponibilidad
