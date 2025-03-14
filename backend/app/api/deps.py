"""
Dependencies for API endpoints.
"""

import uuid
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.database import AsyncSessionLocal
from app.models.auth import TokenPayload
from app.models.user import User
from app.services.user_service import get_user_by_id

# Create OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_session() -> AsyncSession:
    """
    Get a database session that works with FastAPI's dependency injection.

    This is a workaround for the issue with FastAPI's dependency injection system
    not properly handling async generators.

    Returns:
        AsyncSession: Database session
    """
    session = AsyncSessionLocal()
    try:
        yield session
    finally:
        await session.close()


# Create module-level variables for dependency functions
get_db_dependency = get_session


async def get_current_user(
    db: AsyncSession = Depends(get_db_dependency),
    token: str = Depends(oauth2_scheme),
) -> User:
    """
    Get the current user from the token.

    Args:
        db: Database session.
        token: JWT token.

    Returns:
        The current user.

    Raises:
        HTTPException: If the token is invalid or the user is not found.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = token_data.sub
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user = await get_user_by_id(db, uuid.UUID(user_id))
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


# Create module-level variable for the get_current_user dependency
current_user_dependency = get_current_user


async def get_current_active_user(
    current_user: User = Depends(current_user_dependency),
) -> User:
    """
    Get the current active user.

    Args:
        current_user: Current user.

    Returns:
        The current active user.

    Raises:
        HTTPException: If the user is inactive.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    return current_user


async def get_optional_current_user(
    db: AsyncSession = Depends(get_db_dependency),
    token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[User]:
    """
    Get the current user from the token, or None if no token is provided.

    Args:
        db: Database session.
        token: JWT token.

    Returns:
        The current user, or None if no token is provided.
    """
    if token is None:
        return None

    try:
        return await get_current_user(db, token)
    except HTTPException:
        return None
