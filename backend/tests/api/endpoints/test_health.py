"""
Tests for the health endpoint.
"""

from fastapi.testclient import TestClient


def test_health_check(client: TestClient, mock_llm_manager):
    """
    Test the health check endpoint.

    Args:
        client: Test client for the FastAPI application.
        mock_llm_manager: Mocked LLM manager.

    Returns:
        None
    """
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "llm_connected": True,
        "llm_type": "openai",
    }
