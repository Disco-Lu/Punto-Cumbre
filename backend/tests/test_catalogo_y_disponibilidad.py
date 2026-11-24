"""Pruebas BDD / Integración: Módulo Catálogo y Disponibilidad (HU01, HU02, HU03)."""

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Categoria, Equipo


# ── Módulo Catálogo (HU01, HU02) ─────────────────────────────────────────────

async def test_listar_categorias_semilla(client: httpx.AsyncClient):
    """HU01: El cliente visualiza las categorías del catálogo."""
    res = await client.get("/api/v1/categorias")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["nombre_categoria"] == "Crampones y piolets"


async def test_obtener_categoria_inexistente_retorna_404(client: httpx.AsyncClient):
    res = await client.get("/api/v1/categorias/9999")
    assert res.status_code == 404


async def test_catalogo_vacio_retorna_lista_vacia(client: httpx.AsyncClient):
    """HU01 (caso borde): Catálogo sin equipos retorna []."""
    res = await client.get("/api/v1/equipos")
    assert res.status_code == 200
    assert res.json() == []


async def test_filtrar_catalogo_por_categoria_y_busqueda(
    client: httpx.AsyncClient,
    db_session: AsyncSession,
    sample_equipment: Equipo,
):
    """HU01: Filtro por categoría y búsqueda textual."""
    cat2 = Categoria(
        nombre_categoria="Carpas de expedición",
        descripcion="Carpas 4 estaciones",
        id_admin=1,
    )
    db_session.add(cat2)
    await db_session.flush()

    eq2 = Equipo(
        id_categoria=cat2.id_categoria,
        nombre_equipo="Carpa Mountain 4P",
        caracteristicas="Impermeable 5000mm, varillas de aluminio.",
        precio_arriendo=18000,
        cantidad=3,
        id_admin=1,
    )
    db_session.add(eq2)
    await db_session.commit()

    # Catálogo completo
    res_all = await client.get("/api/v1/equipos")
    assert res_all.status_code == 200
    assert len(res_all.json()) == 2

    # Filtro por categoría
    res_cat = await client.get(f"/api/v1/equipos?id_categoria={cat2.id_categoria}")
    assert res_cat.status_code == 200
    items = res_cat.json()
    assert len(items) == 1
    assert items[0]["nombre_equipo"] == "Carpa Mountain 4P"
    assert items[0]["categoria"]["nombre_categoria"] == "Carpas de expedición"

    # Búsqueda por texto
    res_search = await client.get("/api/v1/equipos?search=Petzl")
    assert res_search.status_code == 200
    assert len(res_search.json()) == 1
    assert res_search.json()[0]["id_equipo"] == sample_equipment.id_equipo


async def test_ficha_tecnica_equipo_y_404(
    client: httpx.AsyncClient, sample_equipment: Equipo
):
    """HU02: Consulta de ficha técnica completa del equipo."""
    res = await client.get(f"/api/v1/equipos/{sample_equipment.id_equipo}")
    assert res.status_code == 200
    body = res.json()
    assert body["nombre_equipo"] == "Crampón Petzl Lynx"
    assert body["precio_arriendo"] == 8000.0
    assert body["cantidad"] == 2
    assert "14 puntas" in body["caracteristicas"]

    res_404 = await client.get("/api/v1/equipos/99999")
    assert res_404.status_code == 404


# ── Módulo Disponibilidad (HU03) ─────────────────────────────────────────────

async def test_disponibilidad_total_parcial_y_agotada(
    client: httpx.AsyncClient, sample_equipment: Equipo
):
    """HU03: Stock 2 -> disponible(2) -> 1 reserva -> parcial(1) -> 2 reservas -> agotado(0)."""
    eq_id = sample_equipment.id_equipo
    params = {
        "fecha_retiro": "2026-12-10T12:00:00Z",
        "fecha_devolucion": "2026-12-14T12:00:00Z",
    }

    # 1. Totalmente disponible
    r1 = await client.get(f"/api/v1/equipos/{eq_id}/disponibilidad", params=params)
    assert r1.status_code == 200
    assert r1.json()["esta_disponible"] is True
    assert r1.json()["cantidad_disponible"] == 2

    # 2. Primera cotización (rango solapado)
    await client.post(
        "/api/v1/cotizaciones",
        json={
            "nombre_cliente": "Ana Torres",
            "correo_cliente": "ana@ejemplo.cl",
            "telefono_cliente": "+56911111111",
            "fecha_retiro": "2026-12-11T12:00:00Z",
            "fecha_devolucion": "2026-12-15T12:00:00Z",
            "equipos_ids": [eq_id],
        },
    )
    r2 = await client.get(f"/api/v1/equipos/{eq_id}/disponibilidad", params=params)
    assert r2.json()["esta_disponible"] is True
    assert r2.json()["cantidad_reservada"] == 1
    assert r2.json()["cantidad_disponible"] == 1

    # 3. Segunda cotización -> sin stock para ese rango
    await client.post(
        "/api/v1/cotizaciones",
        json={
            "nombre_cliente": "Luis Vera",
            "correo_cliente": "luis@ejemplo.cl",
            "telefono_cliente": "+56922222222",
            "fecha_retiro": "2026-12-12T12:00:00Z",
            "fecha_devolucion": "2026-12-13T12:00:00Z",
            "equipos_ids": [eq_id],
        },
    )
    r3 = await client.get(f"/api/v1/equipos/{eq_id}/disponibilidad", params=params)
    assert r3.json()["esta_disponible"] is False
    assert r3.json()["cantidad_disponible"] == 0

    # 4. Fechas sin solapamiento siguen con 2 unidades libres
    r_other = await client.get(
        f"/api/v1/equipos/{eq_id}/disponibilidad",
        params={
            "fecha_retiro": "2026-12-20T12:00:00Z",
            "fecha_devolucion": "2026-12-22T12:00:00Z",
        },
    )
    assert r_other.json()["esta_disponible"] is True
    assert r_other.json()["cantidad_disponible"] == 2


async def test_disponibilidad_fechas_invertidas_retorna_400(
    client: httpx.AsyncClient, sample_equipment: Equipo
):
    """HU03 (validación): fecha_devolucion < fecha_retiro retorna 400."""
    res = await client.get(
        f"/api/v1/equipos/{sample_equipment.id_equipo}/disponibilidad",
        params={
            "fecha_retiro": "2026-12-15T12:00:00Z",
            "fecha_devolucion": "2026-12-10T12:00:00Z",
        },
    )
    assert res.status_code == 400


async def test_reserva_cancelada_libera_stock_inmediatamente(
    client: httpx.AsyncClient,
    sample_equipment: Equipo,
    admin_headers: dict[str, str],
):
    """HU03 (caso borde): Una reserva cancelada NO bloquea la disponibilidad."""
    eq_id = sample_equipment.id_equipo
    cot = await client.post(
        "/api/v1/cotizaciones",
        json={
            "nombre_cliente": "Pedro Soto",
            "correo_cliente": "pedro@ejemplo.cl",
            "telefono_cliente": "+56933333333",
            "fecha_retiro": "2026-12-01T12:00:00Z",
            "fecha_devolucion": "2026-12-03T12:00:00Z",
            "equipos_ids": [eq_id],
        },
    )
    reserva_id = cot.json()["id_reserva"]

    # Cancelar la reserva
    patch = await client.patch(
        f"/api/v1/admin/reservas/{reserva_id}/estado",
        headers=admin_headers,
        json={"estado_reserva": "cancelada"},
    )
    assert patch.status_code == 200

    # El stock vuelve a estar completo (2/2)
    disp = await client.get(
        f"/api/v1/equipos/{eq_id}/disponibilidad",
        params={
            "fecha_retiro": "2026-12-01T12:00:00Z",
            "fecha_devolucion": "2026-12-03T12:00:00Z",
        },
    )
    assert disp.json()["cantidad_reservada"] == 0
    assert disp.json()["cantidad_disponible"] == 2
