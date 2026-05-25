"""create reviews table

Revision ID: 0005_reviews
Revises: 0004
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "0005_reviews"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "reviews",
        sa.Column("id",           UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("contract_id",  UUID(as_uuid=True), sa.ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reviewer_id",  UUID(as_uuid=True), sa.ForeignKey("users.id"),    nullable=False),
        sa.Column("reviewee_id",  UUID(as_uuid=True), sa.ForeignKey("users.id"),    nullable=False),

        sa.Column("overall_rating",       sa.Integer, nullable=False),
        sa.Column("communication_rating", sa.Integer, nullable=True),
        sa.Column("quality_rating",       sa.Integer, nullable=True),
        sa.Column("ontime_rating",        sa.Integer, nullable=True),
        sa.Column("recommend_rating",     sa.Integer, nullable=True),
        sa.Column("body",                 sa.Text,    nullable=True),

        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),

        sa.UniqueConstraint("contract_id", "reviewer_id", name="uq_review_per_party"),
        sa.CheckConstraint("overall_rating BETWEEN 1 AND 5",       name="ck_overall_rating"),
        sa.CheckConstraint("communication_rating BETWEEN 1 AND 5", name="ck_comm_rating"),
        sa.CheckConstraint("quality_rating BETWEEN 1 AND 5",       name="ck_quality_rating"),
        sa.CheckConstraint("ontime_rating BETWEEN 1 AND 5",         name="ck_ontime_rating"),
        sa.CheckConstraint("recommend_rating BETWEEN 1 AND 5",     name="ck_recommend_rating"),
    )

    op.create_index("ix_reviews_reviewee_id", "reviews", ["reviewee_id"])
    op.create_index("ix_reviews_reviewer_id", "reviews", ["reviewer_id"])
    op.create_index("ix_reviews_contract_id", "reviews", ["contract_id"])


def downgrade() -> None:
    op.drop_table("reviews")
