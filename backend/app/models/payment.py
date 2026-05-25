"""
Payment model — M5
Tracks escrow funding and release per milestone.
One Payment row per milestone (idempotent: fund once, release once).
"""
import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, Enum, ForeignKey,
    DateTime, Text, Boolean,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class PaymentStatus(str, enum.Enum):
    pending    = "pending"      # row created, not yet funded
    processing = "processing"   # client funded escrow
    completed  = "completed"    # released to freelancer
    failed     = "failed"       # payment processor error
    refunded   = "refunded"     # refunded to client


class Payment(Base):
    __tablename__ = "payments"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    milestone_id = Column(UUID(as_uuid=True), ForeignKey("milestones.id", ondelete="CASCADE"), nullable=False, unique=True)
    contract_id  = Column(UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False)
    payer_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)   # client
    payee_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)   # freelancer

    gross_amount = Column(Integer, nullable=False)   # milestone.amount
    platform_fee = Column(Integer, nullable=False)   # 10 %
    net_amount   = Column(Integer, nullable=False)   # gross − fee  (freelancer receives)

    status = Column(
        Enum(PaymentStatus, name="paymentstatus"),
        nullable=False,
        default=PaymentStatus.pending,
        server_default="pending",
    )

    escrow_funded_at = Column(DateTime(timezone=True), nullable=True)
    released_at      = Column(DateTime(timezone=True), nullable=True)
    notes            = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ──────────────────────────────────────────────────────────
    milestone = relationship("Milestone", back_populates="payment", uselist=False)
    contract  = relationship("Contract")
    payer     = relationship("User", foreign_keys=[payer_id])
    payee     = relationship("User", foreign_keys=[payee_id])
