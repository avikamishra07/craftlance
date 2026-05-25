import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole, AvailabilityStatus


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole


class UserPublic(BaseModel):
    """Safe public profile — no sensitive fields."""
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: UserRole
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[list[str]] = None
    hourly_rate: Optional[int] = None
    availability: AvailabilityStatus
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None
    is_verified: bool
    onboarding_completed: bool
    identity_verified: bool
    reputation_score: float
    ontime_pct: float
    comm_score: float
    retention_pct: float
    completion_streak: int
    profile_completeness: int
    total_earnings: int
    total_projects: int
    created_at: datetime

    model_config = {"from_attributes": True}


class UserMe(UserPublic):
    """Extended profile for the authenticated user."""
    is_active: bool
    updated_at: datetime


class OnboardingRequest(BaseModel):
    title: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[list[str]] = None
    hourly_rate: Optional[int] = None
    availability: Optional[AvailabilityStatus] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[list[str]] = None
    hourly_rate: Optional[int] = None
    availability: Optional[AvailabilityStatus] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None
    avatar_url: Optional[str] = None
