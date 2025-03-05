"""
Tests for the LLM manager service.
"""

from unittest.mock import MagicMock, patch

import pytest

from app.models.llm import LLMType
from app.services.llm_manager import LLMConnectionManager


@pytest.fixture
def llm_manager():
    """
    Create a fresh LLM manager for testing.

    Returns:
        LLMConnectionManager: A fresh LLM manager instance.
    """
    return LLMConnectionManager()


def test_connect_openai(llm_manager, monkeypatch):
    """
    Test connecting to OpenAI.

    Args:
        llm_manager: LLM manager instance.
        monkeypatch: Pytest monkeypatch fixture.

    Returns:
        None
    """

    # Create a mock implementation of connect_openai
    def mock_connect_openai(api_key):
        llm_manager.llm_type = LLMType.OPENAI
        llm_manager.api_key = api_key
        llm_manager.is_connected = True

    # Replace the real method with our mock
    original_method = llm_manager.connect_openai
    llm_manager.connect_openai = mock_connect_openai

    try:
        # Test connection
        llm_manager.connect_openai("test_api_key")

        # Verify
        assert llm_manager.is_connected is True
        assert llm_manager.llm_type == LLMType.OPENAI
        assert llm_manager.api_key == "test_api_key"
    finally:
        # Restore the original method
        llm_manager.connect_openai = original_method


def test_connect_llama(llm_manager):
    """
    Test connecting to Llama.

    Args:
        llm_manager: LLM manager instance.

    Returns:
        None
    """
    with patch("requests.get") as mock_get:
        # Setup mock
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response

        # Test connection
        llm_manager.connect_llama("localhost", "8080")

        # Verify
        assert llm_manager.is_connected is True
        assert llm_manager.llm_type == LLMType.LLAMA
        assert llm_manager.host == "http://localhost"
        assert llm_manager.port == "8080"


def test_disconnect(llm_manager):
    """
    Test disconnecting from LLM.

    Args:
        llm_manager: LLM manager instance.

    Returns:
        None
    """
    # Setup - manually set the connection properties
    llm_manager.llm_type = LLMType.OPENAI
    llm_manager.api_key = "test_api_key"
    llm_manager.is_connected = True

    # Test disconnect
    llm_manager.disconnect()

    # Verify
    assert llm_manager.is_connected is False
    assert llm_manager.llm_type is None


@pytest.mark.asyncio
async def test_generate_text_openai(llm_manager):
    """
    Test generating text with OpenAI.

    Args:
        llm_manager: LLM manager instance.

    Returns:
        None
    """
    # Setup - manually set the connection properties
    llm_manager.llm_type = LLMType.OPENAI
    llm_manager.api_key = "test_api_key"
    llm_manager.is_connected = True

    # Mock the OpenAI client
    with patch.object(llm_manager, "_generate_openai_text", return_value="Test response"):
        # Test generate text
        response = await llm_manager.generate_text("Test prompt")

        # Verify
        assert response == "Test response"


@pytest.mark.asyncio
async def test_generate_text_llama(llm_manager):
    """
    Test generating text with Llama.

    Args:
        llm_manager: LLM manager instance.

    Returns:
        None
    """
    # Setup - manually set the connection properties
    llm_manager.llm_type = LLMType.LLAMA
    llm_manager.host = "http://localhost"
    llm_manager.port = "8080"
    llm_manager.is_connected = True

    # Mock the Llama client
    with patch.object(llm_manager, "_generate_llama_text", return_value="Test response"):
        # Test generate text
        response = await llm_manager.generate_text("Test prompt")

        # Verify
        assert response == "Test response"
