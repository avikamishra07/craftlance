"""Payment schemas — M5"""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.payment import PaymentStatus


class UserBrief(BaseModel):
    id: uuid.UUID
    full_name: str
    avatar_url: Optional[str]
    model_config = {"from_attributes": True}


class PaymentOut(BaseModel):
    id: uuid.UUID
    milestone_id: uuid.UUID
    contract_id: uuid.UUID
    payer_id: uuid.UUID
    payee_id: uuid.UUID
    gross_amount: int
    platform_fee: int
    net_amount: int
    status: PaymentStatus
    escrow_funded_at: Optional[datetime]
    released_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime

    # Hydrated
    payer: Optional[UserBrief] = None
    payee: Optional[UserBrief] = None

    model_config = {"from_attributes": True}


class BalanceOut(BaseModel):
    """Freelancer balance breakdown."""
    pending_amount: int    # approved milestones not yet released
    available_amount: int  # released (completed) payments
    total_earned: int      # lifetime completed


class FundEscrowPayload(BaseModel):
    milestone_id: uuid.UUID
    notes: Optional[str] = None
