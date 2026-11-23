"""Router administrativo: Autenticación y sesión de administrador (RNF 002)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_admin
from app.models.administrador import Administrador
from app.schemas.admin import AdminLoginRequest, AdminLoginResponse, AdminResponse
from app.schemas.common import ErrorResponse
from app.services.auth import authenticate_admin, create_access_token

router = APIRouter(prefix="/admin/auth", tags=["Admin: Autenticación"])


@router.post(
    "/login",
    response_model=AdminLoginResponse,
    responses={401: {"model": ErrorResponse, "description": "Credenciales inválidas"}},
    summary="Iniciar sesión como administrador",
    description="Valida usuario y contraseña y emite un token JWT Bearer para acceder a la ruta oculta de administración.",
)
async def login_admin(
    credentials: AdminLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> AdminLoginResponse:
    admin = await authenticate_admin(db, credentials.username, credentials.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generar token JWT con el username en el campo 'sub'
    token = create_access_token(data={"sub": admin.username, "id_admin": admin.id_admin})
    return AdminLoginResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.JWT_EXPIRE_MINUTES * 60,
    )


@router.get(
    "/me",
    response_model=AdminResponse,
    summary="Obtener perfil del administrador autenticado",
)
async def obtener_perfil_admin(
    admin: Administrador = Depends(get_current_admin),
) -> Administrador:
    return admin
