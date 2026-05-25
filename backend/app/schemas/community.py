"""
Community schemas — M9
"""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class VerifiedSkillPublic(BaseModel):
    skill_key:   str
    skill_label: str
    badge_level: Optional[str]   # "bronze" | "silver" | "gold"


class FreelancerCard(BaseModel):
    id:               str
    username:         str
    full_name:        Optional[str]
    avatar_url:       Optional[str]
    title:            Optional[str]
    bio:              Optional[str]
    skills:           list[str]
    hourly_rate:      Optional[float]
    availability:     Optional[str]
    is_verified:      bool
    reputation_score: Optional[float]
    completed_jobs:   int
    verified_skills:  list[VerifiedSkillPublic]
    is_saved:         bool

    class Config:
        from_attributes = True


class FreelancerDirectoryResponse(BaseModel):
    freelancers: list[FreelancerCard]
    total:       int
    page:        int
    per_page:    int
    pages:       int


class SavedFreelancersResponse(BaseModel):
    freelancers: list[FreelancerCard]
    total:       int
