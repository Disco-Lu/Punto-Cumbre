"""Shared dependency injection providers for FastAPI routers."""

from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.administrador import Administrador
from app.services.auth import decode_access_token

# Bearer security scheme matching OpenAPI specification
security_bearer = HTTPBearer(auto_error=False)


async def get_current_admin(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_bearer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Administrador:
    """Valida el token JWT Bearer y retorna la instancia del administrador autenticado.

    Lanza HTTP 401 si el token no existe, está expirado o el administrador no existe.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de autenticación no proporcionadas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username: str | None = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token con formato inválido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Consulta el administrador en la base de datos
    query = select(Administrador).where(Administrador.username == username)
    result = await db.execute(query)
    admin = result.scalar_one_or_none()

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Administrador no encontrado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return admin
