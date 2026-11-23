"""Router administrativo: Gestión y CRUD de categorías de montaña (HU07)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.administrador import Administrador
from app.models.categoria import Categoria
from app.models.equipo import Equipo
from app.schemas.categoria import CategoriaCreate, CategoriaResponse, CategoriaUpdate
from app.schemas.common import ErrorResponse, MessageResponse

router = APIRouter(prefix="/admin/categorias", tags=["Admin: Categorías"])


@router.post(
    "",
    response_model=CategoriaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva categoría",
)
async def crear_categoria(
    datos: CategoriaCreate,
    admin: Administrador = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Categoria:
    # Verificar si ya existe el nombre
    query_existente = select(Categoria).where(
        Categoria.nombre_categoria.ilike(datos.nombre_categoria.strip())
    )
    res = await db.execute(query_existente)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una categoría llamada '{datos.nombre_categoria}'.",
        )

    nueva_cat = Categoria(
        nombre_categoria=datos.nombre_categoria.strip(),
        descripcion=datos.descripcion.strip() if datos.descripcion else None,
        id_admin=admin.id_admin,
    )
    db.add(nueva_cat)
    await db.commit()
    await db.refresh(nueva_cat)
    return nueva_cat


@router.put(
    "/{id_categoria}",
    response_model=CategoriaResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Actualizar categoría existente",
)
async def actualizar_categoria(
    id_categoria: int,
    datos: CategoriaUpdate,
    admin: Administrador = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Categoria:
    query = select(Categoria).where(Categoria.id_categoria == id_categoria)
    res = await db.execute(query)
    categoria = res.scalar_one_or_none()

    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La categoría con ID {id_categoria} no existe.",
        )

    categoria.nombre_categoria = datos.nombre_categoria.strip()
    if datos.descripcion is not None:
        categoria.descripcion = datos.descripcion.strip() if datos.descripcion else None

    await db.commit()
    await db.refresh(categoria)
    return categoria


@router.delete(
    "/{id_categoria}",
    response_model=MessageResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Tiene equipos asociados"},
        404: {"model": ErrorResponse, "description": "No encontrada"},
    },
    summary="Eliminar categoría",
)
async def eliminar_categoria(
    id_categoria: int,
    admin: Administrador = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    query = select(Categoria).where(Categoria.id_categoria == id_categoria)
    res = await db.execute(query)
    categoria = res.scalar_one_or_none()

    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La categoría con ID {id_categoria} no existe.",
        )

    # Verificar que no tenga equipos asociados antes de eliminar
    query_equipos = select(Equipo).where(Equipo.id_categoria == id_categoria)
    res_equipos = await db.execute(query_equipos)
    if res_equipos.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar la categoría porque contiene equipos asociados.",
        )

    await db.delete(categoria)
    await db.commit()
    return MessageResponse(message=f"Categoría '{categoria.nombre_categoria}' eliminada con éxito.")
