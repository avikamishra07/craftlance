import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.skill_verification import BadgeLevel


class SkillVerificationOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    skill: str
    score: int
    passed: bool
    badge_level: Optional[BadgeLevel]
    attempts: int
    verified_at: datetime

    model_config = {"from_attributes": True}


class StartTestRequest(BaseModel):
    skill: str


class MCQQuestion(BaseModel):
    q: str
    options: list[str]


class TestStartResponse(BaseModel):
    test_id: str
    skill: str
    questions: list[MCQQuestion]


class SubmitTestRequest(BaseModel):
    test_id: str
    answers: list[int]   # index of selected option for each question
