import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, field_validator
from app.models.milestone import MilestoneStatus


class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    amount: int
    due_date: Optional[date] = None
    order_index: int = 0

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Title must be at least 3 characters")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Milestone amount must be at least $1")
        return v


class MilestoneStatusUpdate(BaseModel):
    """
    Freelancer:  pending → in_progress, in_progress → submitted
    Client:      submitted → approved | revision_requested
    System:      approved → paid (on payment release)
    """
    status: MilestoneStatus
    revision_note: Optional[str] = None      # used when requesting revision
    deliverable_urls: Optional[list[str]] = None  # used when submitting


class MilestoneOut(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    title: str
    description: Optional[str]
    amount: int
    due_date: Optional[date]
    order_index: int
    status: MilestoneStatus
    deliverable_urls: Optional[list[str]]
    revision_note: Optional[str]
    submitted_at: Optional[datetime]
    approved_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}
