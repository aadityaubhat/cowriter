import os
from typing import List

from pydantic import BaseModel


class Settings(BaseModel):
    """Application settings."""

    # API settings
    API_V1_STR: str = "/api"

    # CORS settings
    ALLOWED_ORIGINS: List[str] = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

    # OpenAI settings
    OPENAI_DEFAULT_MODEL: str = "gpt-3.5-turbo"

    # Llama settings
    LLAMA_DEFAULT_MODEL: str = "Llama-3.2-3B-Instruct"
    LLAMA_MAX_TOKENS: int = 50000


# Create a singleton instance
settings = Settings()
