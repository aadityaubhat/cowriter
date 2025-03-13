"""
User preferences model for storing user settings.
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class UserPreference(Base):
    """User preferences model for storing user settings."""

    __tablename__ = "user_preferences"

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    theme = Column(String(20), default="system")
    default_document_type = Column(String(50), default="Blog")
    llm_provider = Column(String(50), default="openai")
    llm_model = Column(String(50), default="gpt-4")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="preferences", uselist=False)

    def __repr__(self) -> str:
        """Return string representation of user preferences."""
        return f"<UserPreference for user_id={self.user_id}>"
