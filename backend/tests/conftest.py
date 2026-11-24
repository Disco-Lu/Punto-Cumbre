"""Fixtures compartidas para la suite de pruebas BDD e integración.

Principio Green Software aplicado a testing:
- Base de datos SQLite asíncrona en memoria (aiosqlite + StaticPool):
  0 tráfico de red hacia Supabase, 0 contaminación de datos productivos y
  ejecución en milisegundos.
- Hash bcrypt precalculado una sola vez por sesión de pytest para evitar
  ciclos de CPU repetitivos en cada escenario.
"""

from collections.abc import AsyncGenerator

import httpx
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Administrador, Categoria, Equipo
from app.services.auth import create_access_token, get_password_hash

# Hash generado una sola vez para toda la corrida (Green Software: ahorro de CPU)
TEST_ADMIN_PASSWORD = "admin123"
TEST_ADMIN_HASH = get_password_hash(TEST_ADMIN_PASSWORD)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Crea una base de datos limpia en memoria con admin y categoría semilla."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )

    async with session_factory() as session:
        admin = Administrador(username="admin", password_hash=TEST_ADMIN_HASH)
        session.add(admin)
        await session.flush()

        categoria = Categoria(
            nombre_categoria="Crampones y piolets",
            descripcion="Equipos esenciales para escalada en hielo y nieve",
            id_admin=admin.id_admin,
        )
        session.add(categoria)
        await session.commit()

        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[httpx.AsyncClient, None]:
    """Cliente HTTP asíncrono conectado directamente a la instancia FastAPI."""

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport, base_url="http://testserver"
    ) as async_client:
        yield async_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers() -> dict[str, str]:
    """Cabecera Bearer JWT válida para el administrador semilla."""
    token = create_access_token(data={"sub": "admin", "id_admin": 1})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def sample_equipment(db_session: AsyncSession) -> Equipo:
    """Inserta un equipo de prueba en la categoría semilla (stock=2, $8.000/día)."""
    equipo = Equipo(
        id_categoria=1,
        nombre_equipo="Crampón Petzl Lynx",
        caracteristicas="14 puntas de acero, compatible con botas semi-rígidas y rígidas.",
        precio_arriendo=8000,
        cantidad=2,
        id_admin=1,
    )
    db_session.add(equipo)
    await db_session.commit()
    await db_session.refresh(equipo)
    return equipo
