import uuid
import enum
from typing import Optional

from datetime import datetime, timezone
from sqlalchemy import (
    String, Boolean, Float, Integer, DateTime,
    Text, Enum as SAEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY

from app.core.database import Base


class UserRole(str, enum.Enum):
    freelancer = "freelancer"
    client = "client"
    both = "both"


class AvailabilityStatus(str, enum.Enum):
    available = "available"
    busy = "busy"
    not_available = "not_available"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole),
        default=UserRole.freelancer,
        nullable=False
    )

    # ─────────────────────────────────────────────────────────────
    # Profile
    # ─────────────────────────────────────────────────────────────

    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )

    bio: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

    title: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )

    location: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )

    skills: Mapped[Optional[list[str]]] = mapped_column(
        ARRAY(String),
        nullable=True
    )

    hourly_rate: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True
    )

    availability: Mapped[AvailabilityStatus] = mapped_column(
        SAEnum(AvailabilityStatus),
        default=AvailabilityStatus.available
    )

    # ─────────────────────────────────────────────────────────────
    # Social Links
    # ─────────────────────────────────────────────────────────────

    linkedin_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )

    github_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )

    website_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )

    # ─────────────────────────────────────────────────────────────
    # Verification
    # ─────────────────────────────────────────────────────────────

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    identity_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    # ─────────────────────────────────────────────────────────────
    # Reputation Metrics
    # ─────────────────────────────────────────────────────────────

    reputation_score: Mapped[float] = mapped_column(
        Float,
        default=0.0
    )

    ontime_pct: Mapped[float] = mapped_column(
        Float,
        default=0.0
    )

    comm_score: Mapped[float] = mapped_column(
        Float,
        default=0.0
    )

    retention_pct: Mapped[float] = mapped_column(
        Float,
        default=0.0
    )

    completion_streak: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    profile_completeness: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    total_earnings: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    total_projects: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ─────────────────────────────────────────────────────────────
    # Relationships
    # ─────────────────────────────────────────────────────────────

    portfolio_items: Mapped[list["PortfolioItem"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )

    skill_verifications: Mapped[list["SkillVerification"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )

    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )

    posted_projects: Mapped[list["Project"]] = relationship(
        back_populates="client",
        foreign_keys="Project.client_id"
    )

    proposals: Mapped[list["Proposal"]] = relationship(
        back_populates="freelancer",
        foreign_keys="Proposal.freelancer_id"
    )

    # NEW CONTRACT RELATIONSHIPS

    client_contracts: Mapped[list["Contract"]] = relationship(
        "Contract",
        foreign_keys="Contract.client_id",
        back_populates="client"
    )

    freelancer_contracts: Mapped[list["Contract"]] = relationship(
        "Contract",
        foreign_keys="Contract.freelancer_id",
        back_populates="freelancer"
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"


# Avoid circular imports
from app.models.portfolio import PortfolioItem
from app.models.skill_verification import SkillVerification
from app.models.notification import Notification
from app.models.project import Project
from app.models.proposal import Proposal
from app.models.contract import Contract