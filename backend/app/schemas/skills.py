"""
Pydantic schemas for M8 skill verification endpoints.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ── Catalogue ──────────────────────────────────────────────────────────────────

class SkillCatalogueItem(BaseModel):
    key:            str
    label:          str
    icon:           str
    description:    str
    question_count: int


# ── Test start ─────────────────────────────────────────────────────────────────

class QuestionOut(BaseModel):
    index:   int
    text:    str
    options: list[str]


class TestStartResponse(BaseModel):
    test_id:           str
    skill_key:         str
    skill_label:       str
    questions:         list[QuestionOut]
    duration_seconds:  int
    started_at:        float


# ── Test submit ────────────────────────────────────────────────────────────────

class TestSubmitRequest(BaseModel):
    answers: dict[str, int]    # {"0": 2, "1": 0, …}  question_index → chosen_option_index


class TestSubmitResponse(BaseModel):
    verification_id: str
    skill_key:       str
    skill_label:     str
    score_pct:       float
    correct:         int
    total:           int
    badge:           Optional[str]     # "bronze" | "silver" | "gold" | null
    time_taken_s:    Optional[int]
    completed_at:    datetime


# ── Verified skills list ───────────────────────────────────────────────────────

class VerifiedSkillOut(BaseModel):
    id:           str
    skill_key:    str
    skill_label:  str
    score_pct:    float
    badge_level:  Optional[str]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True
