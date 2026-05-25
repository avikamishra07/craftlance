import uuid
from datetime import datetime, timezone, date
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Date, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import enum
from app.core.database import Base


class MilestoneStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    submitted = "submitted"
    revision_requested = "revision_requested"
    approved = "approved"
    paid = "paid"


class Milestone(Base):
    __tablename__ = "milestones"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contract_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contracts.id"), nullable=False)

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # USD
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[MilestoneStatus] = mapped_column(SAEnum(MilestoneStatus), default=MilestoneStatus.pending)
    deliverable_urls: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String), nullable=True)
    revision_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    contract: Mapped["Contract"] = relationship(back_populates="milestones")
    payment: Mapped[Optional["Payment"]] = relationship(back_populates="milestone")

