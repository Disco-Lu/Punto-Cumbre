"""Pruebas BDD / Integración: Administración, Seguridad JWT, Dashboard y Contrato SDD."""

import httpx

from app.models import Equipo


# ── Seguridad y Autenticación (RNF 002) ──────────────────────────────────────

async def test_login_admin_valido_invalido_y_rutas_protegidas(
    client: httpx.AsyncClient,
):
    """RNF 002: Login con JWT y protección estricta de rutas /admin/*."""
    # Acceso sin token -> 401
    r_no_auth = await client.get("/api/v1/admin/dashboard/metricas")
    assert r_no_auth.status_code == 401

    # Acceso con token falso -> 401
    r_bad_tok = await client.get(
        "/api/v1/admin/auth/me", headers={"Authorization": "Bearer token-falso"}
    )
    assert r_bad_tok.status_code == 401

    # Contraseña incorrecta -> 401
    r_wrong = await client.post(
        "/api/v1/admin/auth/login",
        json={"username": "admin", "password": "incorrecta"},
    )
    assert r_wrong.status_code == 401

    # Login correcto -> 200 + JWT funcional
    r_ok = await client.post(
        "/api/v1/admin/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert r_ok.status_code == 200
    token = r_ok.json()["access_token"]

    r_me = await client.get(
        "/api/v1/admin/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert r_me.status_code == 200
    assert r_me.json()["username"] == "admin"


# ── CRUD Categorías y Equipos (RF 008, HU07, HU09) ───────────────────────────

async def test_crud_categorias_e_integridad_referencial(
    client: httpx.AsyncClient,
    sample_equipment: Equipo,
    admin_headers: dict[str, str],
):
    """HU07: Crear, editar, evitar duplicados y proteger categorías con equipos."""
    # Crear nueva categoría
    r_create = await client.post(
        "/api/v1/admin/categorias",
        headers=admin_headers,
        json={
            "nombre_categoria": "Mochilas técnicas",
            "descripcion": "Mochilas de 40L a 70L",
            "id_admin": 1,
        },
    )
    assert r_create.status_code == 201
    cat_id = r_create.json()["id_categoria"]

    # Duplicado -> 400
    r_dup = await client.post(
        "/api/v1/admin/categorias",
        headers=admin_headers,
        json={"nombre_categoria": "mochilas técnicas", "id_admin": 1},
    )
    assert r_dup.status_code == 400

    # Actualizar
    r_upd = await client.put(
        f"/api/v1/admin/categorias/{cat_id}",
        headers=admin_headers,
        json={"nombre_categoria": "Mochilas de alta montaña", "descripcion": "Actualizada"},
    )
    assert r_upd.status_code == 200
    assert r_upd.json()["nombre_categoria"] == "Mochilas de alta montaña"

    # Eliminar categoría vacía -> OK
    r_del_ok = await client.delete(
        f"/api/v1/admin/categorias/{cat_id}", headers=admin_headers
    )
    assert r_del_ok.status_code == 200

    # Eliminar categoría 1 (tiene sample_equipment asociado) -> bloqueado 400
    r_del_blocked = await client.delete(
        "/api/v1/admin/categorias/1", headers=admin_headers
    )
    assert r_del_blocked.status_code == 400


async def test_crud_equipos_y_bloqueo_con_arriendo_activo(
    client: httpx.AsyncClient, admin_headers: dict[str, str]
):
    """RF 008 / HU07 / HU09: Crear, actualizar stock/precio y bloquear borrado si está arrendado."""
    r_new = await client.post(
        "/api/v1/admin/equipos",
        headers=admin_headers,
        json={
            "id_categoria": 1,
            "nombre_equipo": "Crampón Grivel G12",
            "caracteristicas": "12 puntas clásico.",
            "precio_arriendo": 9500,
            "cantidad": 4,
            "id_admin": 1,
        },
    )
    assert r_new.status_code == 201
    eq_id = r_new.json()["id_equipo"]

    # Actualizar precio y stock
    r_upd = await client.put(
        f"/api/v1/admin/equipos/{eq_id}",
        headers=admin_headers,
        json={"precio_arriendo": 10500, "cantidad": 6},
    )
    assert r_upd.status_code == 200
    assert r_upd.json()["cantidad"] == 6

    # Crear reserva activa con este equipo
    cot = await client.post(
        "/api/v1/cotizaciones",
        json={
            "nombre_cliente": "Matías Ríos",
            "correo_cliente": "matias@ejemplo.cl",
            "telefono_cliente": "+56977777777",
            "fecha_retiro": "2026-12-01T12:00:00Z",
            "fecha_devolucion": "2026-12-03T12:00:00Z",
            "equipos_ids": [eq_id],
        },
    )
    reserva_id = cot.json()["id_reserva"]

    # Intentar eliminar equipo con reserva activa -> 400
    r_del_fail = await client.delete(
        f"/api/v1/admin/equipos/{eq_id}", headers=admin_headers
    )
    assert r_del_fail.status_code == 400

    # Cancelar reserva y volver a probar eliminación (nota: detalle_reserva mantiene FK histórica,
    # pero probamos eliminación directa sobre un equipo nuevo sin reservas)
    await client.patch(
        f"/api/v1/admin/reservas/{reserva_id}/estado",
        headers=admin_headers,
        json={"estado_reserva": "cancelada"},
    )

    r_free = await client.post(
        "/api/v1/admin/equipos",
        headers=admin_headers,
        json={
            "id_categoria": 1,
            "nombre_equipo": "Equipo Temporal",
            "caracteristicas": "Para borrado limpio.",
            "precio_arriendo": 5000,
            "cantidad": 1,
            "id_admin": 1,
        },
    )
    free_id = r_free.json()["id_equipo"]
    r_del_ok = await client.delete(
        f"/api/v1/admin/equipos/{free_id}", headers=admin_headers
    )
    assert r_del_ok.status_code == 200


# ── Pagos y Dashboard (RF 009) ───────────────────────────────────────────────

async def test_pagos_y_metricas_dashboard(
    client: httpx.AsyncClient,
    sample_equipment: Equipo,
    admin_headers: dict[str, str],
):
    """RF 009: Registrar pago confirma reserva y actualiza métricas del dashboard."""
    cot = await client.post(
        "/api/v1/cotizaciones",
        json={
            "nombre_cliente": "Elena Paredes",
            "correo_cliente": "elena@ejemplo.cl",
            "telefono_cliente": "+56988888888",
            "fecha_retiro": "2026-12-01T12:00:00Z",
            "fecha_devolucion": "2026-12-04T12:00:00Z",
            "equipos_ids": [sample_equipment.id_equipo],
        },
    )
    reserva_id = cot.json()["id_reserva"]

    # Registrar pago -> promueve reserva pendiente -> confirmada
    r_pago = await client.post(
        "/api/v1/admin/pagos",
        headers=admin_headers,
        json={
            "id_reserva": reserva_id,
            "monto_pagado": 24000,
            "metodo_pago": "transferencia",
        },
    )
    assert r_pago.status_code == 201

    # Verificar que la reserva pasó a confirmada
    r_res = await client.get(
        f"/api/v1/admin/reservas/{reserva_id}", headers=admin_headers
    )
    assert r_res.json()["estado_reserva"] == "confirmada"

    # Verificar métricas del dashboard
    r_dash = await client.get(
        "/api/v1/admin/dashboard/metricas", headers=admin_headers
    )
    assert r_dash.status_code == 200
    dash = r_dash.json()
    assert dash["resumen_reservas"]["total"] == 1
    assert dash["resumen_reservas"]["por_estado"]["confirmada"] == 1
    assert dash["finanzas"]["total_ingresos"] == 24000.0
    assert dash["finanzas"]["transacciones_count"] == 1
    assert dash["catalogo"]["total_equipos"] == 1
    assert dash["catalogo"]["stock_total_unidades"] == 2


# ── Validación de Contrato SDD y Green Software ──────────────────────────────

async def test_contrato_openapi_y_health_green(client: httpx.AsyncClient):
    """SDD + Green Software: OpenAPI válido con todos los endpoints y healthcheck."""
    r_health = await client.get("/api/v1/health")
    assert r_health.status_code == 200
    health = r_health.json()
    assert health["status"] == "ok"
    assert "orjson" in health["green_features"]["json_serializer"]

    r_spec = await client.get("/api/v1/openapi.json")
    assert r_spec.status_code == 200
    spec = r_spec.json()
    paths = set(spec["paths"].keys())
    expected_paths = {
        "/api/v1/health",
        "/api/v1/categorias",
        "/api/v1/equipos",
        "/api/v1/equipos/{id_equipo}",
        "/api/v1/equipos/{id_equipo}/disponibilidad",
        "/api/v1/cotizaciones",
        "/api/v1/reservas",
        "/api/v1/admin/auth/login",
        "/api/v1/admin/auth/me",
        "/api/v1/admin/categorias",
        "/api/v1/admin/equipos",
        "/api/v1/admin/reservas",
        "/api/v1/admin/reservas/{id_reserva}/estado",
        "/api/v1/admin/pagos",
        "/api/v1/admin/dashboard/metricas",
    }
    missing = expected_paths - paths
    assert not missing, f"Rutas faltantes en el contrato OpenAPI: {missing}"
