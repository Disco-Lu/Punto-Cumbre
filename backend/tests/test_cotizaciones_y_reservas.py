"""Pruebas BDD / Integración: Módulo Cotizaciones y Reservas (HU04, HU05, HU10, HU12)."""

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Equipo


# ── Módulo Cotización (HU04, HU05) ───────────────────────────────────────────

async def test_cotizacion_calcula_precio_multiple_equipos_y_dias(
    client: httpx.AsyncClient,
    db_session: AsyncSession,
    sample_equipment: Equipo,
):
    """HU04 + HU05: Fórmula precio_total = sum(precio_arriendo) * días."""
    piolet = Equipo(
        id_categoria=1,
        nombre_equipo="Piolet Petzl Quark",
        caracteristicas="Piolet técnico para hielo y mixto.",
        precio_arriendo=7000,
        cantidad=3,
        id_admin=1,
    )
    db_session.add(piolet)
    await db_session.commit()
    await db_session.refresh(piolet)

    # 4 días * (8000 + 7000) = 60.000 CLP
    res = await client.post(
        "/api/v1/cotizaciones",
        json={
            "nombre_cliente": "Juan Pérez",
            "correo_cliente": "JUAN.PEREZ@ejemplo.cl",
            "telefono_cliente": "+56912345678",
            "fecha_retiro": "2026-12-01T12:00:00Z",
            "fecha_devolucion": "2026-12-05T12:00:00Z",
            "equipos_ids": [sample_equipment.id_equipo, piolet.id_equipo],
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert body["estado_cotizacion"] == "pendiente"
    assert body["cliente"]["correo"] == "juan.perez@ejemplo.cl"  # normalizado a minúsculas
    assert body["arriendo"]["total_dias"] == 4
    assert body["arriendo"]["total_estimado"] == 60000.0
    assert len(body["arriendo"]["equipos"]) == 2

    # Consultar cotización por ID
    res_get = await client.get(f"/api/v1/cotizaciones/{body['id_cotizacion']}")
    assert res_get.status_code == 200
    assert res_get.json()["arriendo"]["total_estimado"] == 60000.0


async def test_cotizacion_mismo_dia_cobra_minimo_un_dia(
    client: httpx.AsyncClient, sample_equipment: Equipo
):
    """HU04 (caso borde): Retiro y devolución el mismo día cobra 1 día."""
    res = await client.post(
        "/api/v1/cotizaciones",
        json={
            "nombre_cliente": "Camila Díaz",
            "correo_cliente": "camila@ejemplo.cl",
            "telefono_cliente": "+56944444444",
            "fecha_retiro": "2026-12-10T12:00:00Z",
            "fecha_devolucion": "2026-12-10T12:00:00Z",
            "equipos_ids": [sample_equipment.id_equipo],
        },
    )
    assert res.status_code == 201
    assert res.json()["arriendo"]["total_dias"] == 1
    assert res.json()["arriendo"]["total_estimado"] == 8000.0


async def test_cotizacion_rechaza_sin_stock_fechas_invalidas_y_email_invalido(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """HU04 (validaciones): Rechazo por stock 0, fechas invertidas o email inválido."""
    sin_stock = Equipo(
        id_categoria=1,
        nombre_equipo="Equipo Agotado",
        caracteristicas="Sin existencias.",
        precio_arriendo=5000,
        cantidad=0,
        id_admin=1,
    )
    db_session.add(sin_stock)
    await db_session.commit()
    await db_session.refresh(sin_stock)

    # 1. Sin stock -> 400
    r_stock = await client.post(
        "/api/v1/cotizaciones",
        json={
            "nombre_cliente": "Test",
            "correo_cliente": "test@ejemplo.cl",
            "telefono_cliente": "+56900000000",
            "fecha_retiro": "2026-12-01T12:00:00Z",
            "fecha_devolucion": "2026-12-02T12:00:00Z",
            "equipos_ids": [sin_stock.id_equipo],
        },
    )
    assert r_stock.status_code == 400

    # 2. Fechas invertidas -> 400
    r_dates = await client.post(
        "/api/v1/cotizaciones",
        json={
            "nombre_cliente": "Test",
            "correo_cliente": "test@ejemplo.cl",
            "telefono_cliente": "+56900000000",
            "fecha_retiro": "2026-12-05T12:00:00Z",
            "fecha_devolucion": "2026-12-01T12:00:00Z",
            "equipos_ids": [sin_stock.id_equipo],
        },
    )
    assert r_dates.status_code == 400

    # 3. Correo mal formado -> 422
    r_email = await client.post(
        "/api/v1/cotizaciones",
        json={
            "nombre_cliente": "Test",
            "correo_cliente": "correo-invalido",
            "telefono_cliente": "+56900000000",
            "fecha_retiro": "2026-12-01T12:00:00Z",
            "fecha_devolucion": "2026-12-02T12:00:00Z",
            "equipos_ids": [sin_stock.id_equipo],
        },
    )
    assert r_email.status_code == 422


# ── Módulo Reservas y Máquina de Estados (HU10, HU12) ────────────────────────

async def test_historial_reservas_cliente_reutiliza_registro(
    client: httpx.AsyncClient, sample_equipment: Equipo
):
    """HU12: El cliente consulta su historial de reservas por correo sin duplicar cliente."""
    for start, end in [
        ("2026-12-01T12:00:00Z", "2026-12-02T12:00:00Z"),
        ("2026-12-10T12:00:00Z", "2026-12-12T12:00:00Z"),
    ]:
        r = await client.post(
            "/api/v1/cotizaciones",
            json={
                "nombre_cliente": "Sofía Muñoz",
                "correo_cliente": "sofia@ejemplo.cl",
                "telefono_cliente": "+56955555555",
                "fecha_retiro": start,
                "fecha_devolucion": end,
                "equipos_ids": [sample_equipment.id_equipo],
            },
        )
        assert r.status_code == 201

    res = await client.get("/api/v1/reservas", params={"correo": "sofia@ejemplo.cl"})
    assert res.status_code == 200
    reservas = res.json()
    assert len(reservas) == 2
    assert reservas[0]["id_cliente"] == reservas[1]["id_cliente"]

    # Detalle individual
    res_detail = await client.get(f"/api/v1/reservas/{reservas[0]['id_reserva']}")
    assert res_detail.status_code == 200
    assert res_detail.json()["cliente"]["nombre"] == "Sofía Muñoz"


async def test_maquina_de_estados_completa_y_transiciones_invalidas(
    client: httpx.AsyncClient,
    sample_equipment: Equipo,
    admin_headers: dict[str, str],
):
    """HU10: Valida ciclo completo y bloqueo estricto de saltos y estados terminales."""
    cot = await client.post(
        "/api/v1/cotizaciones",
        json={
            "nombre_cliente": "Diego Lagos",
            "correo_cliente": "diego@ejemplo.cl",
            "telefono_cliente": "+56966666666",
            "fecha_retiro": "2026-12-01T12:00:00Z",
            "fecha_devolucion": "2026-12-04T12:00:00Z",
            "equipos_ids": [sample_equipment.id_equipo],
        },
    )
    rid = cot.json()["id_reserva"]

    # Saltar de pendiente -> en_arriendo o devuelta debe fallar (400)
    for invalid in ("en_arriendo", "devuelta"):
        r_bad = await client.patch(
            f"/api/v1/admin/reservas/{rid}/estado",
            headers=admin_headers,
            json={"estado_reserva": invalid},
        )
        assert r_bad.status_code == 400

    # Transiciones válidas secuenciales
    for valid in ("confirmada", "en_arriendo", "devuelta"):
        r_ok = await client.patch(
            f"/api/v1/admin/reservas/{rid}/estado",
            headers=admin_headers,
            json={"estado_reserva": valid},
        )
        assert r_ok.status_code == 200
        assert r_ok.json()["estado_reserva"] == valid

    # Estado terminal 'devuelta' bloquea cualquier cambio posterior
    for any_state in ("pendiente", "confirmada", "en_arriendo", "cancelada"):
        r_term = await client.patch(
            f"/api/v1/admin/reservas/{rid}/estado",
            headers=admin_headers,
            json={"estado_reserva": any_state},
        )
        assert r_term.status_code == 400
