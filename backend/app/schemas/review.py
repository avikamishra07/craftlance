"""Review schemas — M6"""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class UserBrief(BaseModel):
    id: uuid.UUID
    full_name: str
    avatar_url: Optional[str] = None
    model_config = {"from_attributes": True}


class ReviewCreate(BaseModel):
    overall_rating:       int = Field(..., ge=1, le=5)
    communication_rating: Optional[int] = Field(None, ge=1, le=5)
    quality_rating:       Optional[int] = Field(None, ge=1, le=5)
    ontime_rating:        Optional[int] = Field(None, ge=1, le=5)
    recommend_rating:     Optional[int] = Field(None, ge=1, le=5)
    body:                 Optional[str] = None


class ReviewOut(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    reviewer_id: uuid.UUID
    reviewee_id: uuid.UUID

    overall_rating:       int
    communication_rating: Optional[int] = None
    quality_rating:       Optional[int] = None
    ontime_rating:        Optional[int] = None
    recommend_rating:     Optional[int] = None
    body:                 Optional[str] = None
    created_at: datetime

    reviewer: Optional[UserBrief] = None
    reviewee: Optional[UserBrief] = None

    model_config = {"from_attributes": True}


class ReputationOut(BaseModel):
    """Reputation breakdown for a user."""
    user_id: uuid.UUID
    review_count: int
    avg_overall:        Optional[float] = None
    avg_communication:  Optional[float] = None
    avg_quality:        Optional[float] = None
    avg_ontime:         Optional[float] = None
    avg_recommend:      Optional[float] = None
