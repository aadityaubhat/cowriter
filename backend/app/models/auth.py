"""
Authentication schemas.
"""

import uuid
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    """Token schema."""

    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    """Token payload schema."""

    sub: Optional[str] = None


class UserCreate(BaseModel):
    """User creation schema."""

    email: EmailStr
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    """User login schema."""

    username_or_email: str
    password: str


class UserResponse(BaseModel):
    """User response schema."""

    id: uuid.UUID
    username: str
    email: str
    is_active: bool
    is_verified: bool

    class Config:
        """Pydantic config."""

        orm_mode = True
        from_attributes = True


class PasswordReset(BaseModel):
    """Password reset schema."""

    email: EmailStr


class PasswordUpdate(BaseModel):
    """Password update schema."""

    current_password: str
    new_password: str = Field(..., min_length=8)
