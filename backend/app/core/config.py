import os
from typing import Any, Dict, List, Optional, Union, cast

from pydantic import BaseModel, PostgresDsn, validator


class Settings(BaseModel):
    """Application settings."""

    # API settings
    API_V1_STR: str = "/api"

    # Debug mode
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")

    # CORS settings
    ALLOWED_ORIGINS: List[str] = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

    # OpenAI settings
    OPENAI_DEFAULT_MODEL: str = "gpt-3.5-turbo"

    # Llama settings
    LLAMA_DEFAULT_MODEL: str = "Llama-3.2-3B-Instruct"
    LLAMA_MAX_TOKENS: int = 50000

    # Database settings
    DATABASE_URL: Union[str, PostgresDsn] = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cowriter"
    )

    # Async database URL (derived from DATABASE_URL)
    ASYNC_DATABASE_URL: Optional[PostgresDsn] = None

    # JWT settings for authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    @validator("DATABASE_URL", pre=True)
    def validate_database_url(cls, v: Any) -> Union[str, PostgresDsn]:
        """Validate database URL."""
        if isinstance(v, str):
            return v

        user = os.getenv("POSTGRES_USER", "postgres")
        password = os.getenv("POSTGRES_PASSWORD", "postgres")
        host = os.getenv("POSTGRES_HOST", "localhost")
        port = os.getenv("POSTGRES_PORT", "5432")
        db = os.getenv("POSTGRES_DB", "cowriter")

        return cast(PostgresDsn, f"postgresql://{user}:{password}@{host}:{port}/{db}")

    @validator("ASYNC_DATABASE_URL", pre=True, always=True)
    def set_async_database_url(cls, v: Any, values: Dict[str, Any]) -> Optional[PostgresDsn]:
        """Set async database URL based on DATABASE_URL."""
        if v:
            return cast(PostgresDsn, v)

        db_url = values.get("DATABASE_URL")
        if not db_url:
            return None

        # Convert postgresql:// to postgresql+asyncpg://
        if isinstance(db_url, str):
            return cast(PostgresDsn, db_url.replace("postgresql://", "postgresql+asyncpg://"))

        # This should not be reached as DATABASE_URL should be a string
        return None


# Create a singleton instance
settings = Settings()
