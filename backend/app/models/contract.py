import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.core.database import Base


class ContractStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    disputed = "disputed"
    cancelled = "cancelled"
    paused = "paused"


class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    proposal_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("proposals.id"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    freelancer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    total_amount: Mapped[int] = mapped_column(Integer, nullable=False)  # USD
    platform_commission: Mapped[int] = mapped_column(Integer, nullable=False)  # 10%
    freelancer_amount: Mapped[int] = mapped_column(Integer, nullable=False)  # 90%
    status: Mapped[ContractStatus] = mapped_column(SAEnum(ContractStatus), default=ContractStatus.active)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    proposal: Mapped["Proposal"] = relationship(back_populates="contract")
    project: Mapped["Project"] = relationship(back_populates="contract")
    milestones: Mapped[list["Milestone"]] = relationship(back_populates="contract", cascade="all, delete-orphan", order_by="Milestone.order_index")
    messages: Mapped[list["Message"]] = relationship(back_populates="contract", cascade="all, delete-orphan")
    reviews: Mapped[list["Review"]] = relationship(back_populates="contract")

    from app.models.proposal import Proposal
    from app.models.project import Project
