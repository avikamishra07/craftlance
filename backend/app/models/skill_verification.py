"""
SkillVerification model — M8

Stores a completed (or in-progress) skill test result for a user.
"""

import uuid
from enum import Enum
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class BadgeLevel(str, Enum):
    bronze = "bronze"
    silver = "silver"
    gold = "gold"


class SkillVerification(Base):
    __tablename__ = "skill_verifications"

    # Primary Key
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Relations
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Skill Info
    skill_key = Column(
        String(64),
        nullable=False,
        index=True,
    )  # e.g. "react", "python"

    skill_label = Column(
        String(128),
        nullable=False,
    )  # e.g. "React"

    # Test Results
    score_pct = Column(
        Float,
        nullable=True,
    )  # 0–100

    correct = Column(
        Integer,
        nullable=True,
    )

    total = Column(
        Integer,
        nullable=True,
    )  # usually 20

    time_taken_s = Column(
        Integer,
        nullable=True,
    )  # seconds

    # Badge Earned
    badge_level = Column(
        String(16),
        nullable=True,
    )  # bronze | silver | gold

    # Saved Answers
    answers = Column(
        JSON,
        nullable=True,
    )  # {question_index: answer_index}

    # Timestamps
    started_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    completed_at = Column(
        DateTime,
        nullable=True,
    )

    # Relationships
    user = relationship(
        "User",
        back_populates="skill_verifications",
    )