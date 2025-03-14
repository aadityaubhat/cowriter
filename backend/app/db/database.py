"""
Database connection and session management.
"""

from contextlib import contextmanager
from typing import AsyncGenerator, Generator, cast

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

# Create SQLAlchemy engine with connection pooling
# Sync engine for Alembic migrations
sync_engine = create_engine(
    str(settings.DATABASE_URL),
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
)

# Async engine for application
engine = create_async_engine(
    str(settings.ASYNC_DATABASE_URL),
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

# Create session factories
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=sync_engine,
)

# Create async session factory
_AsyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
)


# Type-safe wrapper for AsyncSessionLocal
def AsyncSessionLocal() -> AsyncSession:
    """Create a new AsyncSession."""
    return cast(AsyncSession, _AsyncSessionLocal())


# Create base class for models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Get async database session.

    Yields:
        AsyncSession: Async database session
    """
    session = AsyncSessionLocal()
    try:
        yield session
    finally:
        await session.close()


# Alias for get_db for backward compatibility
get_async_db = get_db


@contextmanager
def get_sync_db() -> Generator[Session, None, None]:
    """
    Get sync database session.

    Yields:
        Session: Sync database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
