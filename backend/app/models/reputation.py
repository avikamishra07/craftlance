"""
Reputation model — M6

Stores user reputation points and level.
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Reputation(Base):
    __tablename__ = "reputations"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    points = Column(
        Integer,
        default=0,
        nullable=False,
    )

    level = Column(
        Integer,
        default=1,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    user = relationship(
        "User",
        back_populates="reputation",
    )