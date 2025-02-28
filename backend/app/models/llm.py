from enum import Enum
from typing import Optional

from pydantic import BaseModel


class LLMType(str, Enum):
    OPENAI = "openai"
    LLAMA = "llama"


class LLMConnectionRequest(BaseModel):
    type: LLMType
    api_key: Optional[str] = None
    host: Optional[str] = None
    port: Optional[str] = None


class LLMConnectionResponse(BaseModel):
    success: bool
    message: str
