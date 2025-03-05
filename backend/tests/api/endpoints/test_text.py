"""
Tests for the text endpoints.
"""

from fastapi.testclient import TestClient


def test_submit_action_success(client: TestClient, mock_llm_manager):
    """
    Test successful submission of a text action.

    Args:
        client: Test client for the FastAPI application.
        mock_llm_manager: Mocked LLM manager.

    Returns:
        None
    """
    response = client.post(
        "/api/submit_action",
        json={
            "text": "This is a test text.",
            "action": "expand",
            "action_description": "Make the text longer",
            "about_me": "I am a writer",
            "preferred_style": "Clear and concise",
            "tone": "professional",
        },
    )

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "text" in response.json()


def test_submit_eval_success(client: TestClient, mock_llm_manager):
    """
    Test successful submission of a text evaluation.

    Args:
        client: Test client for the FastAPI application.
        mock_llm_manager: Mocked LLM manager.

    Returns:
        None
    """
    response = client.post(
        "/api/submit_eval",
        json={
            "text": "This is a test text.",
            "eval_name": "grammar",
            "eval_description": "Check for grammar errors",
        },
    )

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "result" in response.json()
    assert "score" in response.json()


def test_chat_success(client: TestClient, mock_llm_manager):
    """
    Test successful chat interaction.

    Args:
        client: Test client for the FastAPI application.
        mock_llm_manager: Mocked LLM manager.

    Returns:
        None
    """
    response = client.post(
        "/api/chat",
        json={
            "message": "Hello, how are you?",
            "context": "This is a test context.",
        },
    )

    assert response.status_code == 200
    assert "text" in response.json()


def test_no_llm_connection(client: TestClient, monkeypatch):
    """
    Test endpoints when no LLM is connected.

    Args:
        client: Test client for the FastAPI application.
        monkeypatch: Pytest monkeypatch fixture.

    Returns:
        None
    """
    from app.services.llm_manager import llm_manager

    # Mock the LLM manager to be disconnected
    monkeypatch.setattr(llm_manager, "is_connected", False)

    # Test submit_action
    response = client.post(
        "/api/submit_action",
        json={
            "text": "This is a test text.",
            "action": "expand",
            "action_description": "Make the text longer",
            "about_me": "I am a writer",
            "preferred_style": "Clear and concise",
            "tone": "professional",
        },
    )
    assert response.status_code == 400

    # Test submit_eval
    response = client.post(
        "/api/submit_eval",
        json={
            "text": "This is a test text.",
            "eval_name": "grammar",
            "eval_description": "Check for grammar errors",
        },
    )
    assert response.status_code == 400

    # Test chat
    response = client.post(
        "/api/chat",
        json={
            "message": "Hello, how are you?",
            "context": "This is a test context.",
        },
    )
    assert response.status_code == 400
