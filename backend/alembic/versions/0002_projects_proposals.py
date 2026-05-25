"""M3: projects and proposals tables

Revision ID: 0002
Revises: 0001
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── projects ──────────────────────────────────────────────────────────────
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("required_skills", postgresql.ARRAY(sa.String), nullable=False, server_default="{}"),
        sa.Column("budget_min", sa.Integer, nullable=False),
        sa.Column("budget_max", sa.Integer, nullable=False),
        sa.Column("deadline", sa.Date, nullable=True),
        sa.Column(
            "project_type",
            sa.Enum("fixed", "hourly", name="projecttype"),
            nullable=False,
            server_default="fixed",
        ),
        sa.Column(
            "status",
            sa.Enum("open", "in_progress", "completed", "cancelled", "draft", name="projectstatus"),
            nullable=False,
            server_default="open",
        ),
        sa.Column("views_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )

    op.create_index("ix_projects_client_id", "projects", ["client_id"])
    op.create_index("ix_projects_status", "projects", ["status"])
    op.create_index("ix_projects_created_at", "projects", ["created_at"])

    # ── proposals ─────────────────────────────────────────────────────────────
    op.create_table(
        "proposals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("freelancer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bid_amount", sa.Integer, nullable=False),
        sa.Column("timeline_days", sa.Integer, nullable=False),
        sa.Column("cover_letter", sa.Text, nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "shortlisted", "accepted", "rejected", "withdrawn", name="proposalstatus"),
            nullable=False,
            server_default="pending",
        ),
        # AI scoring columns
        sa.Column("ai_score", sa.Float, nullable=True),
        sa.Column("ai_clarity_score", sa.Float, nullable=True),
        sa.Column("ai_relevance_score", sa.Float, nullable=True),
        sa.Column("ai_professionalism_score", sa.Float, nullable=True),
        sa.Column("ai_value_score", sa.Float, nullable=True),
        sa.Column("ai_feedback", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )

    op.create_index("ix_proposals_project_id", "proposals", ["project_id"])
    op.create_index("ix_proposals_freelancer_id", "proposals", ["freelancer_id"])
    op.create_index("ix_proposals_status", "proposals", ["status"])

    # Unique: one active proposal per freelancer per project
    op.create_index(
        "uix_proposals_active_bid",
        "proposals",
        ["project_id", "freelancer_id"],
        unique=False,  # not strictly unique — allow re-bid after withdraw
    )


def downgrade() -> None:
    op.drop_table("proposals")
    op.drop_index("ix_projects_created_at", "projects")
    op.drop_index("ix_projects_status", "projects")
    op.drop_index("ix_projects_client_id", "projects")
    op.drop_table("projects")
    op.execute("DROP TYPE IF EXISTS proposalstatus")
    op.execute("DROP TYPE IF EXISTS projectstatus")
    op.execute("DROP TYPE IF EXISTS projecttype")
