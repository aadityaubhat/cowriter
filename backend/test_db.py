"""
Test database connection and session handling.

This script tests the database connection and session handling directly,
without going through the FastAPI application.

Usage:
    python -m test_db
"""

import asyncio
import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import AsyncSessionLocal, engine, get_db
from app.services.user_service import create_user, get_user_by_email

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def test_db_connection():
    """Test direct database connection."""
    try:
        logger.info("Testing database connection...")
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            value = result.scalar()
            assert value == 1
            logger.info("✅ Database connection successful")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        raise


async def test_db_session():
    """Test database session."""
    try:
        logger.info("Testing database session...")
        # Create a session directly using AsyncSessionLocal
        session = AsyncSessionLocal()
        try:
            # Test that it's an AsyncSession
            assert isinstance(session, AsyncSession), f"Expected AsyncSession, got {type(session)}"

            # Test a simple query
            result = await session.execute(text("SELECT 1"))
            value = result.scalar()
            assert value == 1

            logger.info("✅ Database session test successful")
        finally:
            await session.close()
    except Exception as e:
        logger.error(f"❌ Database session test failed: {e}")
        raise


async def test_user_service():
    """Test user service with proper session handling."""
    try:
        logger.info("Testing user service...")
        # Create a session directly using AsyncSessionLocal
        session = AsyncSessionLocal()
        try:
            # Test the get_user_by_email function
            email = "test_db_script@example.com"

            # First check if user exists
            user = await get_user_by_email(session, email)
            if user:
                logger.info(f"User already exists: {user.email}")
            else:
                logger.info(f"User not found, creating test user with email: {email}")
                # Create a test user
                user = await create_user(session, email, "Password123!")
                logger.info(f"Created test user: {user.email}")

            logger.info("✅ User service test successful")
        finally:
            await session.close()
    except Exception as e:
        logger.error(f"❌ User service test failed: {e}")
        raise


async def test_correct_session_usage():
    """Test the correct way to use the session in FastAPI endpoints."""
    logger.info("Testing correct session usage (as in FastAPI endpoints)...")
    try:
        # This is how FastAPI's dependency injection system uses the generator
        db_gen = get_db()
        async with db_gen as db:
            # Test a simple query
            result = await db.execute(text("SELECT 1"))
            value = result.scalar()
            assert value == 1

            # Test the get_user_by_email function
            email = "test_db_script@example.com"
            user = await get_user_by_email(db, email)

            if user:
                logger.info(f"Found user: {user.email}")
            else:
                logger.info(f"User not found: {email}")

            logger.info("✅ Correct session usage test successful")
    except Exception as e:
        logger.error(f"❌ Correct session usage test failed: {e}")
        raise


async def main():
    """Run all tests."""
    try:
        await test_db_connection()
        await test_db_session()
        await test_user_service()
        await test_correct_session_usage()
        logger.info("✅ All tests passed!")
    except Exception as e:
        logger.error(f"❌ Tests failed: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
