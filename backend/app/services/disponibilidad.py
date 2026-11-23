"""Servicio de verificación de disponibilidad de equipamiento.

Green Software:
- Consulta de agregación SQL directa (COUNT + JOIN) para evitar traer reservas completas a memoria.
- Utiliza los índices creados en la base de datos (idx_reserva_estado, idx_detalle_reserva_id_reserva).
"""

from datetime import datetime
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.detalle_reserva import DetalleReserva
from app.models.equipo import Equipo
from app.models.reserva import Reserva

# Estados que comprometen inventario físico
ESTADOS_ACTIVOS = ("pendiente", "confirmada", "en_arriendo")


async def consultar_disponibilidad_equipo(
    db: AsyncSession,
    id_equipo: int,
    fecha_retiro: datetime,
    fecha_devolucion: datetime,
) -> dict[str, int | bool | str]:
    """Calcula las unidades disponibles de un equipo para un rango de fechas.

    Retorna un diccionario con:
    - id_equipo: int
    - cantidad_total: int
    - cantidad_reservada: int
    - cantidad_disponible: int
    - esta_disponible: bool
    """
    # 1. Obtener el equipo y su stock total
    query_equipo = select(Equipo).where(Equipo.id_equipo == id_equipo)
    res_equipo = await db.execute(query_equipo)
    equipo = res_equipo.scalar_one_or_none()

    if not equipo:
        return {
            "id_equipo": id_equipo,
            "cantidad_total": 0,
            "cantidad_reservada": 0,
            "cantidad_disponible": 0,
            "esta_disponible": False,
        }

    # 2. Contar unidades comprometidas en reservas solapadas
    # Dos rangos [A, B] y [C, D] se solapan si A <= D y B >= C
    query_ocupados = (
        select(func.count(DetalleReserva.id_detalle))
        .join(Reserva, DetalleReserva.id_reserva == Reserva.id_reserva)
        .where(
            DetalleReserva.id_equipo == id_equipo,
            Reserva.estado_reserva.in_(ESTADOS_ACTIVOS),
            Reserva.fecha_retiro <= fecha_devolucion,
            Reserva.fecha_devolucion >= fecha_retiro,
        )
    )
    res_ocupados = await db.execute(query_ocupados)
    cantidad_reservada = res_ocupados.scalar() or 0

    cantidad_disponible = max(0, equipo.cantidad - cantidad_reservada)

    return {
        "id_equipo": id_equipo,
        "cantidad_total": equipo.cantidad,
        "cantidad_reservada": cantidad_reservada,
        "cantidad_disponible": cantidad_disponible,
        "esta_disponible": cantidad_disponible > 0,
    }


async def verificar_disponibilidad_multiple(
    db: AsyncSession,
    equipos_ids: list[int],
    fecha_retiro: datetime,
    fecha_devolucion: datetime,
) -> tuple[bool, list[dict[str, int | bool | str]]]:
    """Verifica si todos los equipos de una lista están disponibles en las fechas dadas.

    Retorna una tupla: (todos_disponibles, lista_de_estados_por_equipo).
    """
    detalles = []
    todos_disponibles = True

    for eq_id in equipos_ids:
        disp = await consultar_disponibilidad_equipo(db, eq_id, fecha_retiro, fecha_devolucion)
        detalles.append(disp)
        if not disp["esta_disponible"]:
            todos_disponibles = False

    return todos_disponibles, detalles
