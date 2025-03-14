"""
Docker test script for database connection and user registration.

This script is meant to be run inside the Docker container to test
database connection and user registration.

Usage:
    docker exec cowriter_backend python docker_test.py
"""

import asyncio
import logging
import uuid

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.database import AsyncSessionLocal, engine, get_db
from app.services.user_service import create_user, get_user_by_email

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# API URL for internal testing
API_URL = f"http://localhost:8000{settings.API_V1_STR}/auth/register"


async def test_db_connection():
    """Test direct database connection."""
    try:
        logger.info("Testing database connection...")
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            value = result.scalar()
            assert value == 1
            logger.info("✅ Database connection successful")
            return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False


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
            return True
        finally:
            await session.close()
    except Exception as e:
        logger.error(f"❌ Database session test failed: {e}")
        return False


async def test_user_service():
    """Test user service with proper session handling."""
    try:
        logger.info("Testing user service...")
        # Create a session directly using AsyncSessionLocal
        session = AsyncSessionLocal()
        try:
            # Test the get_user_by_email function
            email = "test_docker_script@example.com"

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
            return True
        finally:
            await session.close()
    except Exception as e:
        logger.error(f"❌ User service test failed: {e}")
        return False


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
            email = "test_docker_script@example.com"
            user = await get_user_by_email(db, email)

            if user:
                logger.info(f"Found user: {user.email}")
            else:
                logger.info(f"User not found: {email}")

            logger.info("✅ Correct session usage test successful")
            return True
    except Exception as e:
        logger.error(f"❌ Correct session usage test failed: {e}")
        return False


async def test_register_api():
    """Test user registration API endpoint."""
    try:
        logger.info("Testing user registration API endpoint...")
        logger.info(f"Using API URL: {API_URL}")

        # Generate a unique email
        unique_id = str(uuid.uuid4())[:8]
        email = f"test_api_{unique_id}@example.com"

        # Create test data
        user_data = {
            "email": email,
            "password": "Password123!",
        }

        logger.info(f"Registering user with email: {email}")

        # Make request
        async with httpx.AsyncClient() as client:
            response = await client.post(
                API_URL,
                json=user_data,
                timeout=10.0,
            )

            # Log response
            logger.info(f"Response status code: {response.status_code}")
            logger.info(f"Response body: {response.text}")

            # Check response
            if response.status_code == 201:
                response_data = response.json()
                logger.info(f"✅ User registration API test successful: {response_data}")
                return True
            else:
                logger.error(f"❌ User registration API test failed: {response.text}")
                return False
    except Exception as e:
        logger.error(f"❌ Error during user registration API test: {e}")
        return False


async def main():
    """Run all tests."""
    try:
        logger.info("Starting Docker container tests...")

        # Test database connection
        db_conn_success = await test_db_connection()

        # Test database session
        db_session_success = await test_db_session()

        # Test user service
        user_service_success = await test_user_service()

        # Test correct session usage
        session_usage_success = await test_correct_session_usage()

        # Test user registration API
        api_success = await test_register_api()

        # Check all results
        all_success = (
            db_conn_success
            and db_session_success
            and user_service_success
            and session_usage_success
            and api_success
        )

        if all_success:
            logger.info("✅ All tests passed!")
        else:
            logger.error("❌ Some tests failed!")

        # Return results
        return {
            "db_connection": db_conn_success,
            "db_session": db_session_success,
            "user_service": user_service_success,
            "session_usage": session_usage_success,
            "api": api_success,
            "all_success": all_success,
        }
    except Exception as e:
        logger.error(f"❌ Tests failed: {e}")
        raise


if __name__ == "__main__":
    results = asyncio.run(main())

    # Print summary
    logger.info("\n--- TEST SUMMARY ---")
    for test, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        logger.info(f"{test}: {status}")

    # Exit with appropriate code
    exit(0 if results["all_success"] else 1)
