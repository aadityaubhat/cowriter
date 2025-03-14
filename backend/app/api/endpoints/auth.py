"""
Authentication endpoints.
"""

import logging
from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import current_user_dependency, get_db_dependency
from app.core.config import settings
from app.core.security import create_access_token
from app.models.auth import Token, UserCreate, UserLogin, UserResponse
from app.models.user import User
from app.services.user_service import authenticate_user, create_user, get_user_by_email

# Set up logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    responses={401: {"description": "Unauthorized"}},
)


@router.post("/login", response_model=Token, summary="OAuth2 compatible token login")
async def login_access_token(
    db: AsyncSession = Depends(get_db_dependency),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.

    Args:
        db: Database session.
        form_data: OAuth2 password request form.

    Returns:
        Access token.
    """
    logger.info(f"Attempting OAuth2 login for user: {form_data.username}")
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        logger.warning(f"Failed login attempt for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        logger.warning(f"Login attempt by inactive user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    logger.info(f"Successful login for user: {form_data.username}")
    return {
        "access_token": create_access_token(user.id, expires_delta=access_token_expires),
        "token_type": "bearer",
    }


@router.post("/login/json", response_model=Token)
async def login_json(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db_dependency),
) -> Any:
    """
    JSON login, get an access token for future requests.

    Args:
        login_data: User login data.
        db: Database session.

    Returns:
        Access token.
    """
    logger.info(f"Attempting JSON login for user: {login_data.username_or_email}")
    user = await authenticate_user(db, login_data.username_or_email, login_data.password)
    if not user:
        logger.warning(f"Failed login attempt for user: {login_data.username_or_email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        logger.warning(f"Login attempt by inactive user: {login_data.username_or_email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    logger.info(f"Successful JSON login for user: {login_data.username_or_email}")
    return {
        "access_token": create_access_token(user.id, expires_delta=access_token_expires),
        "token_type": "bearer",
    }


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db_dependency),
) -> Any:
    """
    Register a new user.

    Args:
        user_data: User creation data.
        db: Database session.

    Returns:
        Created user.
    """
    logger.info(f"Attempting to register new user with email: {user_data.email}")
    logger.debug(f"Database session type: {type(db)}")

    try:
        # Check if user exists
        user = await get_user_by_email(db, user_data.email)
        if user:
            logger.warning(f"Registration failed - email already exists: {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Create user
        user = await create_user(db, user_data.email, user_data.password)
        logger.info(f"User registered successfully: {user_data.email}")
        return user
    except Exception as e:
        logger.error(f"Error during user registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user: User = Depends(current_user_dependency),
) -> Any:
    """
    Get current user.

    Args:
        current_user: Current user.

    Returns:
        Current user.
    """
    logger.debug(f"Retrieving current user info for user ID: {current_user.id}")
    return current_user
