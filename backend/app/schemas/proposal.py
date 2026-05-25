import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
from app.models.proposal import ProposalStatus


class ProposalCreate(BaseModel):
    bid_amount: int
    timeline_days: int
    cover_letter: str

    @field_validator("bid_amount")
    @classmethod
    def validate_bid(cls, v: int) -> int:
        if v < 5:
            raise ValueError("Bid must be at least $5")
        if v > 1_000_000:
            raise ValueError("Bid cannot exceed $1,000,000")
        return v

    @field_validator("timeline_days")
    @classmethod
    def validate_timeline(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Timeline must be at least 1 day")
        if v > 365:
            raise ValueError("Timeline cannot exceed 365 days")
        return v

    @field_validator("cover_letter")
    @classmethod
    def validate_cover_letter(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 100:
            raise ValueError("Cover letter must be at least 100 characters")
        if len(v) > 5000:
            raise ValueError("Cover letter must be under 5000 characters")
        return v


class ProposalStatusUpdate(BaseModel):
    """Client: shortlist/accept/reject. Freelancer: withdraw."""
    status: ProposalStatus


class FreelancerSummary(BaseModel):
    id: uuid.UUID
    full_name: str
    avatar_url: Optional[str]
    title: Optional[str]
    location: Optional[str]
    hourly_rate: Optional[int]
    reputation_score: float
    total_projects: int
    is_verified: bool
    skills: Optional[list[str]]

    model_config = {"from_attributes": True}


class ProposalOut(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    freelancer_id: uuid.UUID
    bid_amount: int
    timeline_days: int
    cover_letter: str
    status: ProposalStatus
    ai_score: Optional[float]
    ai_clarity_score: Optional[float]
    ai_relevance_score: Optional[float]
    ai_professionalism_score: Optional[float]
    ai_value_score: Optional[float]
    ai_feedback: Optional[str]
    created_at: datetime
    updated_at: datetime
    # Joined
    freelancer: Optional[FreelancerSummary] = None
    project_title: Optional[str] = None

    model_config = {"from_attributes": True}
