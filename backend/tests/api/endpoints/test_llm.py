"""
Tests for the LLM endpoints.
"""

from fastapi.testclient import TestClient

from app.models.llm import LLMType


def test_connect_openai_success(client: TestClient, mock_llm_manager):
    """
    Test successful connection to OpenAI.

    Args:
        client: Test client for the FastAPI application.
        mock_llm_manager: Mocked LLM manager.

    Returns:
        None
    """
    response = client.post(
        "/api/connect_llm",
        json={"type": LLMType.OPENAI.value, "api_key": "test_api_key"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "message": "Successfully connected to OpenAI",
    }


def test_connect_openai_missing_api_key(client: TestClient, mock_llm_manager):
    """
    Test connection to OpenAI with missing API key.

    Args:
        client: Test client for the FastAPI application.
        mock_llm_manager: Mocked LLM manager.

    Returns:
        None
    """
    response = client.post(
        "/api/connect_llm",
        json={"type": LLMType.OPENAI.value},
    )

    assert response.status_code == 200  # The endpoint handles errors internally
    assert response.json()["success"] is False
    assert "API key is required" in response.json()["message"]


def test_connect_llama_success(client: TestClient, mock_llm_manager):
    """
    Test successful connection to Llama.

    Args:
        client: Test client for the FastAPI application.
        mock_llm_manager: Mocked LLM manager.

    Returns:
        None
    """
    response = client.post(
        "/api/connect_llm",
        json={"type": LLMType.LLAMA.value, "host": "localhost", "port": "8080"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "message": "Successfully connected to Llama.cpp server",
    }


def test_connect_llama_missing_params(client: TestClient, mock_llm_manager):
    """
    Test connection to Llama with missing parameters.

    Args:
        client: Test client for the FastAPI application.
        mock_llm_manager: Mocked LLM manager.

    Returns:
        None
    """
    response = client.post(
        "/api/connect_llm",
        json={"type": LLMType.LLAMA.value},
    )

    assert response.status_code == 200  # The endpoint handles errors internally
    assert response.json()["success"] is False
    assert "Host and port are required" in response.json()["message"]
