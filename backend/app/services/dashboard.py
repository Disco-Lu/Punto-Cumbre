"""Servicio de métricas y consolidación para el Dashboard administrativo (RF 009).

Green Software:
- Emplea agregaciones nativas de PostgreSQL (GROUP BY, COUNT, SUM) ejecutadas en el motor relacional.
- Minimiza la transferencia de filas individuales por la red.
"""

from datetime import date
from typing import Any
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.categoria import Categoria
from app.models.cliente import Cliente
from app.models.equipo import Equipo
from app.models.ingreso_diario import IngresoDiario
from app.models.pago import Pago
from app.models.reserva import Reserva


async def obtener_metricas_dashboard(db: AsyncSession) -> dict[str, Any]:
    """Genera las métricas consolidadas en tiempo real para el panel de administración."""
    # 1. Conteo de reservas por estado
    query_estados = select(Reserva.estado_reserva, func.count(Reserva.id_reserva)).group_by(
        Reserva.estado_reserva
    )
    res_estados = await db.execute(query_estados)
    reservas_por_estado = {estado: count for estado, count in res_estados.all()}

    # Garantizar presencia de todos los estados clave
    estados_completos = {
        "pendiente": reservas_por_estado.get("pendiente", 0),
        "confirmada": reservas_por_estado.get("confirmada", 0),
        "en_arriendo": reservas_por_estado.get("en_arriendo", 0),
        "devuelta": reservas_por_estado.get("devuelta", 0),
        "cancelada": reservas_por_estado.get("cancelada", 0),
    }

    # 2. Total de ingresos acumulados y transacciones de pago
    query_pagos = select(
        func.coalesce(func.sum(Pago.monto_pagado), 0),
        func.count(Pago.id_pago),
    )
    res_pagos = await db.execute(query_pagos)
    total_ingresos, total_transacciones = res_pagos.one()

    # 3. Equipos y stock total en inventario
    query_equipos = select(
        func.count(Equipo.id_equipo),
        func.coalesce(func.sum(Equipo.cantidad), 0),
    )
    res_equipos = await db.execute(query_equipos)
    total_equipos, stock_total = res_equipos.one()

    # 4. Total de categorías y clientes
    total_categorias = (await db.execute(select(func.count(Categoria.id_categoria)))).scalar() or 0
    total_clientes = (await db.execute(select(func.count(Cliente.id_cliente)))).scalar() or 0

    # 5. Últimas 5 reservas con cliente precargado (Green: selectinload evita N+1)
    query_recientes = (
        select(Reserva)
        .options(selectinload(Reserva.cliente))
        .order_by(Reserva.id_reserva.desc())
        .limit(5)
    )
    res_recientes = await db.execute(query_recientes)
    reservas_recientes = res_recientes.scalars().all()

    ultimas_reservas = [
        {
            "id_reserva": r.id_reserva,
            "cliente_nombre": r.cliente.nombre if r.cliente else "Desconocido",
            "cliente_correo": r.cliente.correo if r.cliente else "",
            "fecha_retiro": r.fecha_retiro,
            "fecha_devolucion": r.fecha_devolucion,
            "estado_reserva": r.estado_reserva,
        }
        for r in reservas_recientes
    ]

    return {
        "resumen_reservas": {
            "total": sum(estados_completos.values()),
            "por_estado": estados_completos,
        },
        "finanzas": {
            "total_ingresos": float(total_ingresos),
            "transacciones_count": total_transacciones,
        },
        "catalogo": {
            "total_equipos": total_equipos,
            "stock_total_unidades": stock_total,
            "total_categorias": total_categorias,
        },
        "clientes": {
            "total_registrados": total_clientes,
        },
        "ultimas_reservas": ultimas_reservas,
    }


async def consolidar_ingreso_diario(
    db: AsyncSession,
    fecha_dia: date,
    id_admin: int,
) -> IngresoDiario:
    """Calcula y consolida el ingreso total de una fecha dada en la tabla ingreso_diario."""
    # Sumar pagos ocurridos en esa fecha
    query_suma = select(
        func.coalesce(func.sum(Pago.monto_pagado), 0),
        func.count(Pago.id_pago),
    ).where(func.date(Pago.fecha_pago) == fecha_dia)

    res = await db.execute(query_suma)
    total_dia, count_dia = res.one()

    # Buscar si ya existe registro para la fecha
    query_existente = select(IngresoDiario).where(IngresoDiario.fecha == fecha_dia)
    res_existente = await db.execute(query_existente)
    ingreso = res_existente.scalar_one_or_none()

    if ingreso:
        ingreso.total_ingresos = total_dia
        ingreso.transacciones_count = count_dia
    else:
        ingreso = IngresoDiario(
            fecha=fecha_dia,
            total_ingresos=total_dia,
            transacciones_count=count_dia,
            id_admin=id_admin,
        )
        db.add(ingreso)

    await db.commit()
    await db.refresh(ingreso)
    return ingreso
