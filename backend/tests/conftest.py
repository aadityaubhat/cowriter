"""
Test fixtures for the CoWriter backend.
"""

import asyncio

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.llm_manager import llm_manager


@pytest.fixture
def client() -> TestClient:
    """
    Create a test client for the FastAPI application.

    Returns:
        TestClient: A test client for the FastAPI application.
    """
    return TestClient(app)


@pytest.fixture
def mock_llm_manager(monkeypatch):
    """
    Mock the LLM manager for testing.

    Args:
        monkeypatch: Pytest monkeypatch fixture.

    Returns:
        None
    """
    # Mock the LLM manager properties
    monkeypatch.setattr(llm_manager, "is_connected", True)
    monkeypatch.setattr(llm_manager, "llm_type", "openai")

    # Mock the LLM manager methods
    monkeypatch.setattr(llm_manager, "connect_openai", lambda api_key: None)
    monkeypatch.setattr(llm_manager, "connect_llama", lambda host, port: None)
    monkeypatch.setattr(llm_manager, "disconnect", lambda: None)

    # Mock the async generate_text method
    async def mock_generate_text(prompt, max_tokens=None, temperature=None):
        return "This is a mock response"

    monkeypatch.setattr(llm_manager, "generate_text", mock_generate_text)


@pytest.fixture(scope="module")
def event_loop():
    """
    Create an event loop for the module scope.

    This is needed because the default event_loop fixture in pytest-asyncio
    has function scope, but we need it for module-scoped fixtures.
    """
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()
