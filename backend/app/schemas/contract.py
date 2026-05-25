import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, field_validator
from app.models.contract import ContractStatus


# ── Participant summaries ─────────────────────────────────────────────────────

class UserBrief(BaseModel):
    id: uuid.UUID
    full_name: str
    avatar_url: Optional[str]
    is_verified: bool
    reputation_score: float
    model_config = {"from_attributes": True}


class ProjectBrief(BaseModel):
    id: uuid.UUID
    title: str
    project_type: str
    model_config = {"from_attributes": True}


# ── Status update ─────────────────────────────────────────────────────────────

class ContractStatusUpdate(BaseModel):
    """Allowed client transitions: active→paused, active→cancelled, active→completed
       Allowed freelancer transitions: active→paused"""
    status: ContractStatus
    reason: Optional[str] = None


# ── Contract out ──────────────────────────────────────────────────────────────

class ContractOut(BaseModel):
    id: uuid.UUID
    proposal_id: uuid.UUID
    project_id: uuid.UUID
    client_id: uuid.UUID
    freelancer_id: uuid.UUID
    total_amount: int
    platform_commission: int
    freelancer_amount: int
    status: ContractStatus
    started_at: datetime
    ended_at: Optional[datetime]
    created_at: datetime
    # Joined
    client: Optional[UserBrief] = None
    freelancer: Optional[UserBrief] = None
    project: Optional[ProjectBrief] = None
    milestone_count: Optional[int] = None
    completed_milestones: Optional[int] = None
    unread_messages: Optional[int] = None

    model_config = {"from_attributes": True}
