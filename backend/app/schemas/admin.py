"""Schemas Pydantic: administrador.

Validación de datos para autenticación y gestión de administradores.
"""

from pydantic import BaseModel, Field


# ── Requests ─────────────────────────────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    """Datos de inicio de sesión del administrador."""
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1)


# ── Responses ────────────────────────────────────────────────────────────────

class AdminLoginResponse(BaseModel):
    """Respuesta exitosa de inicio de sesión."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int

    model_config = {"from_attributes": True}


class AdminResponse(BaseModel):
    """Datos públicos del administrador (sin password_hash)."""
    id_admin: int
    username: str

    model_config = {"from_attributes": True}
