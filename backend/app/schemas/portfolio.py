import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, HttpUrl


class PortfolioItemCreate(BaseModel):
    title: str
    description: str
    tech_stack: list[str] = []
    image_urls: list[str] = []
    live_url: Optional[str] = None
    github_url: Optional[str] = None
    category: Optional[str] = None
    outcomes: Optional[str] = None


class PortfolioItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[list[str]] = None
    image_urls: Optional[list[str]] = None
    live_url: Optional[str] = None
    github_url: Optional[str] = None
    category: Optional[str] = None
    outcomes: Optional[str] = None


class PortfolioItemOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: str
    tech_stack: list[str]
    image_urls: list[str]
    live_url: Optional[str]
    github_url: Optional[str]
    category: Optional[str]
    outcomes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
