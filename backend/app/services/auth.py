"""Servicio de autenticación y seguridad administrativa.

Implementa:
- Hashing y verificación de contraseñas con bcrypt (passlib).
- Generación y decodificación de tokens de acceso JWT (python-jose).
- Consulta de administradores en base de datos.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.administrador import Administrador

# Contexto de hashing seguro con bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si una contraseña en texto plano coincide con su hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Genera un hash seguro con bcrypt para la contraseña proporcionada."""
    return pwd_context.hash(password)


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Genera un token JWT firmado para autenticación de administrador."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "iat": now})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decodifica y valida la firma y expiración de un token JWT."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


async def authenticate_admin(
    db: AsyncSession, username: str, password: str
) -> Administrador | None:
    """Autentica a un administrador validando usuario y contraseña."""
    query = select(Administrador).where(Administrador.username == username)
    result = await db.execute(query)
    admin = result.scalar_one_or_none()

    if not admin or not verify_password(password, admin.password_hash):
        return None

    return admin
