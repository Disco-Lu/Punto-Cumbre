"""SQLAlchemy 2.0 asynchronous database engine, session factory, and lifecycle.

Green Software optimizations:
- Async I/O (asyncpg) non-blocking event loop execution.
- Connection pooling configured to eliminate TLS renegotiation overhead with Supabase.
- expire_on_commit=False to avoid unnecessary refresh queries.
- Clean engine disposal on shutdown to release socket and memory descriptors.
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# Asynchronous engine configuration
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG and settings.ENVIRONMENT == "development",
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_recycle=settings.DB_POOL_RECYCLE,
    pool_pre_ping=True,  # Proactively test connection freshness
)

# Async session factory
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Saves CPU & network roundtrips
    autoflush=False,
)


class Base(DeclarativeBase):
    """Declarative Base class for all ORM models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an async database session per request.

    Guarantees session cleanup upon completion of the HTTP request.
    """
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def close_db_connection() -> None:
    """Safely dispose of the connection pool upon application shutdown.

    Green Software benefit: Prevents hanging connections and socket descriptor leaks.
    """
    await engine.dispose()
