"""Router público: Categorías de equipamiento de montaña (HU01)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.categoria import Categoria
from app.schemas.categoria import CategoriaResponse
from app.schemas.common import ErrorResponse

router = APIRouter(prefix="/categorias", tags=["Categorías"])


@router.get(
    "",
    response_model=list[CategoriaResponse],
    summary="Listar todas las categorías",
    description="Retorna el catálogo completo de categorías de equipamiento disponibles.",
)
async def listar_categorias(
    db: AsyncSession = Depends(get_db),
) -> list[Categoria]:
    query = select(Categoria).order_by(Categoria.nombre_categoria.asc())
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get(
    "/{id_categoria}",
    response_model=CategoriaResponse,
    responses={404: {"model": ErrorResponse, "description": "Categoría no encontrada"}},
    summary="Obtener categoría por ID",
)
async def obtener_categoria(
    id_categoria: int,
    db: AsyncSession = Depends(get_db),
) -> Categoria:
    query = select(Categoria).where(Categoria.id_categoria == id_categoria)
    result = await db.execute(query)
    categoria = result.scalar_one_or_none()

    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La categoría con ID {id_categoria} no existe.",
        )
    return categoria
