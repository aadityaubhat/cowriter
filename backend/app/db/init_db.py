"""
Database initialization script.

This script initializes the database with the necessary tables and extensions.
It should be run when the container starts up.
"""

import logging
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import Base, engine

logger = logging.getLogger(__name__)


async def create_extensions(db: AsyncSession) -> None:
    """
    Create PostgreSQL extensions.

    Args:
        db: Database session
    """
    try:
        await db.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'))
        await db.commit()
        logger.info("Created uuid-ossp extension")
    except Exception as e:
        logger.error(f"Error creating extensions: {e}")
        await db.rollback()
        raise


async def init_db() -> None:
    """
    Initialize database with tables and extensions.

    This function creates all tables defined in SQLAlchemy models
    and ensures the necessary PostgreSQL extensions are installed.
    """
    try:
        # Create all tables
        async with engine.begin() as conn:
            # Create tables
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Created database tables")

            # Create a session to run extension creation
            async with AsyncSession(engine) as session:
                await create_extensions(session)

        logger.info("Database initialization completed successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


def get_db_info() -> dict[str, Any]:
    """
    Get database information.

    Returns:
        dict: Database information including tables and indexes
    """
    tables = Base.metadata.tables
    return {
        "tables": [
            {
                "name": table_name,
                "columns": [
                    {
                        "name": column.name,
                        "type": str(column.type),
                        "nullable": column.nullable,
                        "primary_key": column.primary_key,
                    }
                    for column in table.columns
                ],
            }
            for table_name, table in tables.items()
        ]
    }
