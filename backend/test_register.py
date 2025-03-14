"""
Test script for user registration endpoint.

This script tests the user registration endpoint directly,
without going through the test framework.

Usage:
    python -m test_register
"""

import asyncio
import logging
import os
import uuid

import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# API URL - use Docker container URL
# When running from host, use localhost:8000
# When running from Docker, use http://backend:8000
API_URL = os.environ.get("API_URL", "http://localhost:8000/api/v1/auth/register")


async def test_register_user():
    """Test user registration endpoint."""
    try:
        logger.info("Testing user registration endpoint...")
        logger.info(f"Using API URL: {API_URL}")

        # Generate a unique email
        unique_id = str(uuid.uuid4())[:8]
        email = f"test_user_{unique_id}@example.com"

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
                logger.info(f"✅ User registration successful: {response_data}")
                return True
            else:
                logger.error(f"❌ User registration failed: {response.text}")
                return False
    except Exception as e:
        logger.error(f"❌ Error during user registration test: {e}")
        return False


async def main():
    """Run all tests."""
    try:
        success = await test_register_user()
        if success:
            logger.info("✅ All tests passed!")
        else:
            logger.error("❌ Tests failed!")
    except Exception as e:
        logger.error(f"❌ Tests failed: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
