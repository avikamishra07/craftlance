import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class MessageCreate(BaseModel):
    content: str
    file_urls: Optional[list[str]] = None

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty")
        if len(v) > 10_000:
            raise ValueError("Message too long (max 10,000 characters)")
        return v


class SenderBrief(BaseModel):
    id: uuid.UUID
    full_name: str
    avatar_url: Optional[str]
    model_config = {"from_attributes": True}


class MessageOut(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    sender_id: uuid.UUID
    content: str
    file_urls: Optional[list[str]]
    is_read: bool
    sent_at: datetime
    sender: Optional[SenderBrief] = None

    model_config = {"from_attributes": True}
