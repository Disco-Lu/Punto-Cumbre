"""Router público: Solicitud y consulta de cotizaciones automáticas (HU04, HU05)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.common import ErrorResponse
from app.schemas.cotizacion import ResumenCotizacionResponse, SolicitudCotizacionRequest
from app.services.cotizacion import generar_cotizacion, obtener_cotizacion_por_id

router = APIRouter(prefix="/cotizaciones", tags=["Cotizaciones"])


@router.post(
    "",
    response_model=ResumenCotizacionResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Datos inválidos o stock no disponible"},
    },
    summary="Solicitar cotización de arriendo",
    description="Calcula automáticamente los valores de arriendo y genera una reserva preliminar en estado 'pendiente' (HU04, HU05).",
)
async def crear_cotizacion(
    solicitud: SolicitudCotizacionRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        cotizacion = await generar_cotizacion(
            db=db,
            nombre_cliente=solicitud.nombre_cliente,
            correo_cliente=solicitud.correo_cliente,
            telefono_cliente=solicitud.telefono_cliente,
            fecha_retiro=solicitud.fecha_retiro,
            fecha_devolucion=solicitud.fecha_devolucion,
            equipos_ids=solicitud.equipos_ids,
        )
        return cotizacion
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/{id_cotizacion}",
    response_model=ResumenCotizacionResponse,
    responses={404: {"model": ErrorResponse, "description": "Cotización no encontrada"}},
    summary="Consultar cotización por ID",
    description="Permite consultar el desglose de equipos, días y precio total de una cotización previamente generada.",
)
async def obtener_cotizacion(
    id_cotizacion: int,
    db: AsyncSession = Depends(get_db),
) -> dict:
    cotizacion = await obtener_cotizacion_por_id(db, id_cotizacion)
    if not cotizacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La cotización con ID {id_cotizacion} no fue encontrada.",
        )
    return cotizacion
