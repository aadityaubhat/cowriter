"""
Test database connection and session handling.
"""

import logging

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import engine, get_db
from app.services.user_service import get_user_by_email

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@pytest.mark.asyncio
async def test_db_connection():
    """Test direct database connection."""
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            value = result.scalar()
            assert value == 1
            logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise AssertionError(f"Database connection failed: {e}")


@pytest.mark.asyncio
async def test_db_session():
    """Test database session."""
    try:
        # Get the session generator
        db_gen = get_db()
        # Get the session from the generator
        db = await anext(db_gen)

        # Test that it's an AsyncSession
        assert isinstance(db, AsyncSession), f"Expected AsyncSession, got {type(db)}"

        # Test a simple query
        result = await db.execute(text("SELECT 1"))
        value = result.scalar()
        assert value == 1

        # Close the session
        await db.close()
        logger.info("Database session test successful")
    except Exception as e:
        logger.error(f"Database session test failed: {e}")
        raise AssertionError(f"Database session test failed: {e}")


@pytest.mark.asyncio
async def test_user_service():
    """Test user service with proper session handling."""
    try:
        # Get the session generator
        db_gen = get_db()
        # Get the session from the generator
        db = await anext(db_gen)

        # Test the get_user_by_email function
        email = "test@example.com"  # Use a non-existent email for testing
        user = await get_user_by_email(db, email)

        # We don't care about the result, just that it doesn't throw an exception
        logger.info(f"User lookup result: {user}")

        # Close the session
        await db.close()
        logger.info("User service test successful")
    except Exception as e:
        logger.error(f"User service test failed: {e}")
        raise AssertionError(f"User service test failed: {e}")


@pytest.mark.asyncio
async def test_correct_session_usage():
    """Test the correct way to use the session in FastAPI endpoints."""
    async for db in get_db():
        try:
            # This is how FastAPI's dependency injection system uses the generator
            # Test a simple query
            result = await db.execute(text("SELECT 1"))
            value = result.scalar()
            assert value == 1

            # Test the get_user_by_email function
            email = "test@example.com"  # Use a non-existent email for testing
            user = await get_user_by_email(db, email)

            # We don't care about the result, just that it doesn't throw an exception
            logger.info(f"User lookup result: {user}")

            logger.info("Correct session usage test successful")
        except Exception as e:
            logger.error(f"Correct session usage test failed: {e}")
            raise AssertionError(f"Correct session usage test failed: {e}")
