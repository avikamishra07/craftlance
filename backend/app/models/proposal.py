import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Text, Float, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.core.database import Base


class ProposalStatus(str, enum.Enum):
    pending = "pending"
    shortlisted = "shortlisted"
    accepted = "accepted"
    rejected = "rejected"
    withdrawn = "withdrawn"


class Proposal(Base):
    __tablename__ = "proposals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    freelancer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    bid_amount: Mapped[int] = mapped_column(Integer, nullable=False)  # USD
    timeline_days: Mapped[int] = mapped_column(Integer, nullable=False)
    cover_letter: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ProposalStatus] = mapped_column(SAEnum(ProposalStatus), default=ProposalStatus.pending)

    # AI evaluation scores (0-100)
    ai_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_clarity_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_relevance_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_professionalism_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_value_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    project: Mapped["Project"] = relationship(back_populates="proposals")
    freelancer: Mapped["User"] = relationship(back_populates="proposals", foreign_keys=[freelancer_id])
    contract: Mapped[Optional["Contract"]] = relationship(back_populates="proposal")

    from app.models.user import User