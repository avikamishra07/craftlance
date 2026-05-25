"""
Review model — M6
One review per party per contract (unique on contract_id + reviewer_id).
Reviewee is the other party on the contract.
"""
import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, Enum, ForeignKey,
    DateTime, Text, CheckConstraint, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contract_id  = Column(UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False)
    reviewer_id  = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reviewee_id  = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Overall + category ratings (1–5)
    overall_rating        = Column(Integer, nullable=False)
    communication_rating  = Column(Integer, nullable=True)
    quality_rating        = Column(Integer, nullable=True)
    ontime_rating         = Column(Integer, nullable=True)
    recommend_rating      = Column(Integer, nullable=True)   # 1–5 (how likely to recommend)

    body = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # ── Constraints ───────────────────────────────────────────────────────────
    __table_args__ = (
        UniqueConstraint("contract_id", "reviewer_id", name="uq_review_per_party"),
        CheckConstraint("overall_rating BETWEEN 1 AND 5",       name="ck_overall_rating"),
        CheckConstraint("communication_rating BETWEEN 1 AND 5", name="ck_comm_rating"),
        CheckConstraint("quality_rating BETWEEN 1 AND 5",       name="ck_quality_rating"),
        CheckConstraint("ontime_rating BETWEEN 1 AND 5",         name="ck_ontime_rating"),
        CheckConstraint("recommend_rating BETWEEN 1 AND 5",     name="ck_recommend_rating"),
    )

    # ── Relationships ──────────────────────────────────────────────────────────
    contract = relationship("Contract")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    reviewee = relationship("User", foreign_keys=[reviewee_id])
