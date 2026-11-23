"""Schemas comunes reutilizables en toda la API."""

from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Respuesta estándar de error."""
    detail: str


class MessageResponse(BaseModel):
    """Respuesta estándar de mensaje exitoso."""
    message: str
