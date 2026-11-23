"""Schemas Pydantic: cliente.

Validación de datos para clientes.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ── Requests ─────────────────────────────────────────────────────────────────

class ClienteCreate(BaseModel):
    """Datos para registrar un cliente."""
    nombre: str = Field(..., min_length=1, max_length=200)
    correo: EmailStr
    telefono: str = Field(..., min_length=1, max_length=20)


# ── Responses ────────────────────────────────────────────────────────────────

class ClienteResponse(BaseModel):
    """Cliente completo para respuestas de la API."""
    id_cliente: int
    nombre: str
    correo: str
    telefono: str
    fecha_registro: datetime

    model_config = {"from_attributes": True}
