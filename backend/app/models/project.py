import uuid
from datetime import datetime, timezone, date
from typing import Optional
from sqlalchemy import String, Integer, Date, DateTime, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import enum
from app.core.database import Base


class ProjectType(str, enum.Enum):
    fixed = "fixed"
    hourly = "hourly"


class ProjectStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
    draft = "draft"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    required_skills: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    budget_min: Mapped[int] = mapped_column(Integer, nullable=False)  # in USD
    budget_max: Mapped[int] = mapped_column(Integer, nullable=False)
    deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    project_type: Mapped[ProjectType] = mapped_column(SAEnum(ProjectType), default=ProjectType.fixed)
    status: Mapped[ProjectStatus] = mapped_column(SAEnum(ProjectStatus), default=ProjectStatus.open)
    views_count: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    client: Mapped["User"] = relationship(back_populates="posted_projects", foreign_keys=[client_id])
    proposals: Mapped[list["Proposal"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    contract: Mapped[Optional["Contract"]] = relationship(back_populates="project")

    from app.models.user import User
