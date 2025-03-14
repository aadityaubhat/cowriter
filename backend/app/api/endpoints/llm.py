from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_dependency, get_optional_current_user
from app.models.llm import LLMConnectionRequest, LLMConnectionResponse, LLMType
from app.models.user import User
from app.services.llm_manager import llm_manager

router = APIRouter()


def _handle_openai_connection(api_key: str) -> LLMConnectionResponse:
    """Handle OpenAI connection logic."""
    try:
        llm_manager.connect_openai(api_key)
        return LLMConnectionResponse(
            success=True,
            message="Successfully connected to OpenAI",
        )
    except Exception as e:
        error_msg = f"OpenAI connection error: {str(e)}"
        raise HTTPException(status_code=500, detail=error_msg)


def _handle_llama_connection(host: str, port: str) -> LLMConnectionResponse:
    """Handle Llama connection logic."""
    try:
        llm_manager.connect_llama(host, port)
        return LLMConnectionResponse(
            success=True,
            message="Successfully connected to Llama.cpp server",
        )
    except Exception as e:
        error_msg = f"Llama.cpp connection error: {str(e)}"
        raise HTTPException(status_code=500, detail=error_msg)


@router.post("/connect_llm", response_model=LLMConnectionResponse)
async def connect_llm(
    request: LLMConnectionRequest,
    db: AsyncSession = Depends(get_db_dependency),
    current_user: User = Depends(get_optional_current_user),
) -> LLMConnectionResponse:
    """Test connection to the specified LLM provider and store the connection."""
    try:
        # Disconnect existing connection if any
        llm_manager.disconnect()

        if request.type == LLMType.OPENAI:
            if not request.api_key:
                raise HTTPException(status_code=400, detail="API key is required for OpenAI")
            return _handle_openai_connection(request.api_key)

        elif request.type == LLMType.LLAMA:
            if not request.host or not request.port:
                raise HTTPException(
                    status_code=400, detail="Host and port are required for Llama.cpp"
                )
            return _handle_llama_connection(request.host, request.port)

    except HTTPException as http_error:
        return LLMConnectionResponse(success=False, message=http_error.detail)
    except Exception as e:
        return LLMConnectionResponse(success=False, message=str(e))
