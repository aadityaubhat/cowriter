from typing import Any, Dict

from fastapi import APIRouter

from app.services.llm_manager import llm_manager

router = APIRouter()


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "llm_connected": llm_manager.is_connected,
        "llm_type": llm_manager.llm_type,
    }
