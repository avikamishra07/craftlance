import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, field_validator, model_validator
from app.models.project import ProjectType, ProjectStatus


class ProjectCreate(BaseModel):
    title: str
    description: str
    required_skills: list[str]
    budget_min: int
    budget_max: int
    deadline: Optional[date] = None
    project_type: ProjectType = ProjectType.fixed
    status: ProjectStatus = ProjectStatus.open  # allow 'draft' saves

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 10:
            raise ValueError("Title must be at least 10 characters")
        if len(v) > 500:
            raise ValueError("Title must be under 500 characters")
        return v

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 50:
            raise ValueError("Description must be at least 50 characters")
        return v

    @field_validator("required_skills")
    @classmethod
    def validate_skills(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("At least one skill is required")
        if len(v) > 15:
            raise ValueError("Maximum 15 skills allowed")
        return [s.strip() for s in v if s.strip()]

    @model_validator(mode="after")
    def validate_budget(self) -> "ProjectCreate":
        if self.budget_min < 10:
            raise ValueError("Minimum budget must be at least $10")
        if self.budget_max < self.budget_min:
            raise ValueError("Maximum budget must be ≥ minimum budget")
        return self


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[list[str]] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    deadline: Optional[date] = None
    project_type: Optional[ProjectType] = None
    status: Optional[ProjectStatus] = None


class ClientSummary(BaseModel):
    id: uuid.UUID
    full_name: str
    avatar_url: Optional[str]
    is_verified: bool
    total_projects: int
    reputation_score: float

    model_config = {"from_attributes": True}


class ProjectOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    title: str
    description: str
    required_skills: list[str]
    budget_min: int
    budget_max: int
    deadline: Optional[date]
    project_type: ProjectType
    status: ProjectStatus
    views_count: int
    created_at: datetime
    updated_at: datetime
    # Joined fields (populated by route)
    client: Optional[ClientSummary] = None
    proposal_count: Optional[int] = None

    model_config = {"from_attributes": True}


class ProjectListFilters(BaseModel):
    q: Optional[str] = None               # full-text search title/desc
    skills: Optional[str] = None          # comma-separated list
    project_type: Optional[ProjectType] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    status: Optional[ProjectStatus] = ProjectStatus.open
    page: int = 1
    page_size: int = 20
