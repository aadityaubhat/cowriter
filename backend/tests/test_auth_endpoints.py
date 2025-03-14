"""
Test authentication endpoints.
"""

import logging

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient

from app.core.config import settings
from app.db.database import get_db
from app.main import app
from tests.test_database import get_test_db, init_test_db, drop_test_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Override the get_db dependency for testing
app.dependency_overrides[get_db] = get_test_db

# Create test client
client = TestClient(app)


@pytest_asyncio.fixture(scope="module")
async def setup_test_db():
    """Set up the test database."""
    await init_test_db()
    yield
    await drop_test_db()


@pytest.mark.asyncio
async def test_register_user(setup_test_db):
    """Test user registration endpoint."""
    # Test data
    user_data = {
        "email": "test@example.com",
        "password": "Password123!",
    }

    # Make request
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json=user_data,
    )

    # Check response
    logger.info(f"Response status code: {response.status_code}")
    logger.info(f"Response body: {response.json()}")

    # Assert response
    assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    assert "id" in response.json(), "Expected 'id' in response"
    assert "email" in response.json(), "Expected 'email' in response"
    assert response.json()["email"] == user_data["email"], "Email mismatch"


@pytest.mark.asyncio
async def test_register_duplicate_user(setup_test_db):
    """Test registering a user with an email that already exists."""
    # Test data
    user_data = {
        "email": "duplicate@example.com",
        "password": "Password123!",
    }

    # Register first user
    response1 = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json=user_data,
    )

    # Check first response
    assert response1.status_code == 201, f"Expected 201, got {response1.status_code}"

    # Try to register duplicate user
    response2 = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json=user_data,
    )

    # Check second response
    logger.info(f"Duplicate response status code: {response2.status_code}")
    logger.info(f"Duplicate response body: {response2.json()}")

    # Assert response
    assert response2.status_code == 400, f"Expected 400, got {response2.status_code}"
    assert "detail" in response2.json(), "Expected 'detail' in response"
    assert (
        "already registered" in response2.json()["detail"].lower()
    ), "Expected 'already registered' in detail"
