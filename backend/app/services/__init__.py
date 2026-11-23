"""Servicios de lógica de negocio desacoplada.

Exporta funciones de:
- Autenticación administrativa (auth).
- Verificación de disponibilidad de stock (disponibilidad).
- Cálculo y orquestación de cotizaciones (cotizacion).
- Métricas e ingresos para el dashboard (dashboard).
"""

from app.services.auth import (
    authenticate_admin,
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)
from app.services.cotizacion import (
    generar_cotizacion,
    obtener_cotizacion_por_id,
)
from app.services.dashboard import (
    consolidar_ingreso_diario,
    obtener_metricas_dashboard,
)
from app.services.disponibilidad import (
    consultar_disponibilidad_equipo,
    verificar_disponibilidad_multiple,
)

__all__ = [
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "decode_access_token",
    "authenticate_admin",
    "consultar_disponibilidad_equipo",
    "verificar_disponibilidad_multiple",
    "generar_cotizacion",
    "obtener_cotizacion_por_id",
    "obtener_metricas_dashboard",
    "consolidar_ingreso_diario",
]
