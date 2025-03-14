import re
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_dependency, get_optional_current_user
from app.models.text import ActionRequest, ChatRequest, EvalRequest, TextResponse
from app.models.user import User
from app.services.llm_manager import llm_manager
from app.services.text_formatter import format_action_prompt, format_eval_prompt

router = APIRouter()


@router.post("/submit_action")
async def submit_action(
    request: ActionRequest,
    db: AsyncSession = Depends(get_db_dependency),
    current_user: User = Depends(get_optional_current_user),
) -> Dict[str, Any]:
    """Process a text modification action using the connected LLM."""
    if not llm_manager.is_connected:
        raise HTTPException(status_code=400, detail="No active LLM connection")

    try:
        print("Sending prompt to LLM:", format_action_prompt(request))
        response_text = await llm_manager.generate_text(format_action_prompt(request))
        return {"success": True, "text": response_text}
    except Exception as e:
        print(f"Error processing action: {str(e)}")
        return {"success": False, "detail": str(e)}


@router.post("/submit_eval")
async def submit_eval(
    request: EvalRequest,
    db: AsyncSession = Depends(get_db_dependency),
    current_user: User = Depends(get_optional_current_user),
) -> Dict[str, Any]:
    """Process a text evaluation using the connected LLM."""
    if not llm_manager.is_connected:
        raise HTTPException(status_code=400, detail="No active LLM connection")

    try:
        print("Sending evaluation prompt to LLM:", format_eval_prompt(request))
        response_text = await llm_manager.generate_text(format_eval_prompt(request))

        # Extract score from the response
        score = 5  # Default score
        rating_match = re.search(r"rating:?\s*(\d+)(?:\s*\/\s*10)?", response_text, re.IGNORECASE)
        score_match = re.search(r"score:?\s*(\d+)(?:\s*\/\s*10)?", response_text, re.IGNORECASE)

        if rating_match and rating_match.group(1):
            extracted_score = int(rating_match.group(1))
            if 0 <= extracted_score <= 10:
                score = extracted_score
        elif score_match and score_match.group(1):
            extracted_score = int(score_match.group(1))
            if 0 <= extracted_score <= 10:
                score = extracted_score

        return {"success": True, "result": response_text, "score": score}
    except Exception as e:
        print(f"Error processing evaluation: {str(e)}")
        return {"success": False, "detail": str(e)}


@router.post("/chat", response_model=TextResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db_dependency),
    current_user: User = Depends(get_optional_current_user),
) -> TextResponse:
    """Process a chat message using the connected LLM and return a response."""
    if not llm_manager.is_connected:
        raise HTTPException(status_code=400, detail="No active LLM connection")

    try:
        context = f"\nContext: {request.context}" if request.context else ""
        prompt = f"{request.message}{context}"
        response_text = await llm_manager.generate_text(prompt)
        return TextResponse(text=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
