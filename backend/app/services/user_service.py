"""
User service for authentication and user management.
"""

import logging
import uuid
from typing import Optional, cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.models.user import User

logger = logging.getLogger(__name__)


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get a user by email from the database"""
    try:
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        return cast(Optional[User], result.scalar_one_or_none())
    except Exception as e:
        logger.error(f"Error getting user by email: {e}")
        raise


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
    """Get a user by ID from the database"""
    try:
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        return cast(Optional[User], result.scalar_one_or_none())
    except Exception as e:
        logger.error(f"Error getting user by ID: {e}")
        raise


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    """Authenticate a user with email and password"""
    try:
        user = await get_user_by_email(db, email)
        if not user:
            return None
        # Extract the password hash as a string
        password_hash = str(user.password_hash)
        if not verify_password(password, password_hash):
            return None
        return user
    except Exception as e:
        logger.error(f"Error authenticating user: {e}")
        raise


async def create_user(
    db: AsyncSession, email: str, password: str, is_verified: bool = False
) -> User:
    """Create a new user in the database"""
    try:
        # Create a password hash and ensure it's a string
        password_hash = get_password_hash(password)
        user = User(email=email, password_hash=password_hash, is_verified=is_verified)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating user: {e}")
        raise


async def update_user_password(
    db: AsyncSession, user_id: uuid.UUID, new_password: str
) -> Optional[User]:
    """Update a user's password"""
    try:
        user = await get_user_by_id(db, user_id)
        if not user:
            return None

        # Create a password hash and ensure it's a string
        password_hash = get_password_hash(new_password)
        # Use direct assignment with type ignore comment to avoid type errors
        user.password_hash = password_hash  # type: ignore
        await db.commit()
        await db.refresh(user)
        return user
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating user password: {e}")
        raise
