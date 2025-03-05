"""
Tests for the text formatter service.
"""

from app.models.text import ActionRequest, EvalRequest
from app.services.text_formatter import format_action_prompt, format_eval_prompt


def test_format_action_prompt_expand():
    """
    Test formatting an expand action prompt.

    Returns:
        None
    """
    request = ActionRequest(
        text="This is a test.",
        action="expand",
        action_description="Make the text longer",
        about_me="I am a writer",
        preferred_style="Clear and concise",
        tone="professional",
    )

    prompt = format_action_prompt(request)

    assert "This is a test." in prompt
    assert "longer" in prompt.lower()
    assert "professional" in prompt.lower()


def test_format_action_prompt_shorten():
    """
    Test formatting a shorten action prompt.

    Returns:
        None
    """
    request = ActionRequest(
        text="This is a very long test text that needs to be shortened.",
        action="shorten",
        action_description="Make the text shorter",
        about_me="I am a writer",
        preferred_style="Clear and concise",
        tone="casual",
    )

    prompt = format_action_prompt(request)

    assert "This is a very long test text" in prompt
    assert "shorten" in prompt.lower()
    assert "casual" in prompt.lower()


def test_format_action_prompt_rewrite():
    """
    Test formatting a rewrite action prompt.

    Returns:
        None
    """
    request = ActionRequest(
        text="This is a test text that needs to be rewritten.",
        action="rewrite",
        action_description="Rewrite the text",
        about_me="I am a writer",
        preferred_style="Clear and concise",
        tone="academic",
    )

    prompt = format_action_prompt(request)

    assert "This is a test text" in prompt
    assert "rewrite" in prompt.lower() or "rewritten" in prompt.lower()
    assert "academic" in prompt.lower()


def test_format_eval_prompt_grammar():
    """
    Test formatting a grammar evaluation prompt.

    Returns:
        None
    """
    request = EvalRequest(
        text="This is a test text with some grammar errors.",
        eval_name="grammar",
        eval_description="Check for grammar errors",
    )

    prompt = format_eval_prompt(request)

    assert "This is a test text" in prompt
    assert "grammar" in prompt.lower()
    assert "score" in prompt.lower() or "rating" in prompt.lower()


def test_format_eval_prompt_clarity():
    """
    Test formatting a clarity evaluation prompt.

    Returns:
        None
    """
    request = EvalRequest(
        text="This is a test text that needs to be evaluated for clarity.",
        eval_name="clarity",
        eval_description="Check for clarity",
    )

    prompt = format_eval_prompt(request)

    assert "This is a test text" in prompt
    assert "clarity" in prompt.lower()
    assert "score" in prompt.lower() or "rating" in prompt.lower()
