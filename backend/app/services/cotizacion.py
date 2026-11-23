"""Servicio de generación y cálculo de cotizaciones de arriendo.

Regla de cálculo:
- dias = max(1, (fecha_devolucion - fecha_retiro).days)
- total = sum(precio_arriendo) * dias
- Atomicidad: Se crea Cliente (si no existe) + Reserva + Detalles + Cotización en una sola transacción.
"""

from datetime import datetime
from typing import Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cliente import Cliente
from app.models.cotizacion import ReservaCotizacion
from app.models.detalle_reserva import DetalleReserva
from app.models.equipo import Equipo
from app.models.reserva import Reserva
from app.services.disponibilidad import verificar_disponibilidad_multiple


async def generar_cotizacion(
    db: AsyncSession,
    nombre_cliente: str,
    correo_cliente: str,
    telefono_cliente: str,
    fecha_retiro: datetime,
    fecha_devolucion: datetime,
    equipos_ids: list[int],
) -> dict[str, Any]:
    """Valida disponibilidad, crea cliente/reserva/cotización y calcula el valor total."""
    # 1. Validación de fechas
    if fecha_devolucion < fecha_retiro:
        raise ValueError("La fecha de devolución no puede ser anterior a la fecha de retiro.")

    # 2. Cálculo de días de arriendo (mínimo 1 día)
    dias = max(1, (fecha_devolucion.date() - fecha_retiro.date()).days)

    # 3. Validación de disponibilidad para cada equipo
    todos_disponibles, estados = await verificar_disponibilidad_multiple(
        db, equipos_ids, fecha_retiro, fecha_devolucion
    )
    if not todos_disponibles:
        no_disponibles = [e["id_equipo"] for e in estados if not e["esta_disponible"]]
        raise ValueError(f"Los siguientes equipos no tienen stock disponible para esas fechas: {no_disponibles}")

    # 4. Obtener equipos desde la base de datos para calcular precios
    query_equipos = select(Equipo).where(Equipo.id_equipo.in_(equipos_ids))
    res_equipos = await db.execute(query_equipos)
    equipos = list(res_equipos.scalars().all())

    if len(equipos) != len(equipos_ids):
        raise ValueError("Uno o más equipos solicitados no existen en el catálogo.")

    # 5. Calcular valor total
    subtotal_por_dia = sum(float(eq.precio_arriendo) for eq in equipos)
    total_cotizacion = round(subtotal_por_dia * dias, 2)

    # 6. Buscar o registrar al cliente
    query_cliente = select(Cliente).where(Cliente.correo == correo_cliente.strip().lower())
    res_cliente = await db.execute(query_cliente)
    cliente = res_cliente.scalar_one_or_none()

    if not cliente:
        cliente = Cliente(
            nombre=nombre_cliente.strip(),
            correo=correo_cliente.strip().lower(),
            telefono=telefono_cliente.strip(),
        )
        db.add(cliente)
        await db.flush()  # Asigna id_cliente sin hacer commit definitivo
    else:
        # Actualizar datos de contacto si cambiaron
        cliente.nombre = nombre_cliente.strip()
        cliente.telefono = telefono_cliente.strip()

    # 7. Crear la reserva en estado inicial 'pendiente'
    reserva = Reserva(
        id_cliente=cliente.id_cliente,
        fecha_retiro=fecha_retiro,
        fecha_devolucion=fecha_devolucion,
        estado_reserva="pendiente",
    )
    db.add(reserva)
    await db.flush()  # Asigna id_reserva

    # 8. Asociar los equipos al detalle de la reserva
    for eq in equipos:
        detalle = DetalleReserva(
            id_reserva=reserva.id_reserva,
            id_equipo=eq.id_equipo,
        )
        db.add(detalle)

    # 9. Crear la cotización vinculada
    cotizacion = ReservaCotizacion(
        id_reserva=reserva.id_reserva,
        estado_cotizacion="pendiente",
    )
    db.add(cotizacion)

    # Confirmar transacción atómica
    await db.commit()
    await db.refresh(cotizacion)
    await db.refresh(reserva)

    # 10. Formar resumen consolidado de respuesta
    return {
        "id_cotizacion": cotizacion.id_cotizacion,
        "id_reserva": reserva.id_reserva,
        "estado_cotizacion": cotizacion.estado_cotizacion,
        "fecha_solicitud": cotizacion.fecha_solicitud,
        "cliente": {
            "id_cliente": cliente.id_cliente,
            "nombre": cliente.nombre,
            "correo": cliente.correo,
            "telefono": cliente.telefono,
        },
        "arriendo": {
            "fecha_retiro": reserva.fecha_retiro,
            "fecha_devolucion": reserva.fecha_devolucion,
            "total_dias": dias,
            "equipos": [
                {
                    "id_equipo": eq.id_equipo,
                    "nombre_equipo": eq.nombre_equipo,
                    "precio_arriendo_dia": float(eq.precio_arriendo),
                }
                for eq in equipos
            ],
            "total_estimado": total_cotizacion,
        },
    }


async def obtener_cotizacion_por_id(db: AsyncSession, id_cotizacion: int) -> dict[str, Any] | None:
    """Recupera una cotización por su ID con todos sus detalles precargados."""
    query = (
        select(ReservaCotizacion)
        .options(
            selectinload(ReservaCotizacion.reserva).selectinload(Reserva.cliente),
            selectinload(ReservaCotizacion.reserva)
            .selectinload(Reserva.detalles)
            .selectinload(DetalleReserva.equipo),
        )
        .where(ReservaCotizacion.id_cotizacion == id_cotizacion)
    )
    res = await db.execute(query)
    cotizacion = res.scalar_one_or_none()

    if not cotizacion:
        return None

    reserva = cotizacion.reserva
    cliente = reserva.cliente
    equipos = [d.equipo for d in reserva.detalles if d.equipo]
    dias = max(1, (reserva.fecha_devolucion.date() - reserva.fecha_retiro.date()).days)
    total = round(sum(float(eq.precio_arriendo) for eq in equipos) * dias, 2)

    return {
        "id_cotizacion": cotizacion.id_cotizacion,
        "id_reserva": reserva.id_reserva,
        "estado_cotizacion": cotizacion.estado_cotizacion,
        "fecha_solicitud": cotizacion.fecha_solicitud,
        "cliente": {
            "id_cliente": cliente.id_cliente,
            "nombre": cliente.nombre,
            "correo": cliente.correo,
            "telefono": cliente.telefono,
        },
        "arriendo": {
            "fecha_retiro": reserva.fecha_retiro,
            "fecha_devolucion": reserva.fecha_devolucion,
            "total_dias": dias,
            "equipos": [
                {
                    "id_equipo": eq.id_equipo,
                    "nombre_equipo": eq.nombre_equipo,
                    "precio_arriendo_dia": float(eq.precio_arriendo),
                }
                for eq in equipos
            ],
            "total_estimado": total,
        },
    }
