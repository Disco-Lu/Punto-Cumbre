"""Router administrativo: Métricas y consolidación para el Dashboard de arriendos (RF 009)."""

from datetime import date
from typing import Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.administrador import Administrador
from app.models.ingreso_diario import IngresoDiario
from app.schemas.ingreso_diario import IngresoDiarioResponse
from app.services.dashboard import consolidar_ingreso_diario, obtener_metricas_dashboard

router = APIRouter(prefix="/admin/dashboard", tags=["Admin: Dashboard"])


@router.get(
    "/metricas",
    summary="Obtener métricas y KPIs del dashboard (RF 009)",
    description="Retorna el balance de arriendos por estado, finanzas, inventario y las reservas más recientes.",
)
async def ver_metricas_dashboard(
    admin: Administrador = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    return await obtener_metricas_dashboard(db)


@router.post(
    "/consolidar-ingreso",
    response_model=IngresoDiarioResponse,
    summary="Consolidar ingresos diarios",
    description="Calcula y guarda en la tabla 'ingreso_diario' la suma de transacciones ocurridas en una fecha dada.",
)
async def ejecutar_consolidacion_diaria(
    fecha: date = Query(default_factory=date.today, description="Fecha a consolidar (YYYY-MM-DD)"),
    admin: Administrador = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> IngresoDiario:
    return await consolidar_ingreso_diario(db, fecha, admin.id_admin)
