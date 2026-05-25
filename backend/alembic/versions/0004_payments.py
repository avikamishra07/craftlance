"""M5: payments table

Revision ID: 0004
Revises: 0003
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "payments",
        sa.Column("id",           postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("milestone_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("milestones.id", ondelete="CASCADE"),
                  nullable=False, unique=True),
        sa.Column("contract_id",  postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("contracts.id",  ondelete="CASCADE"),
                  nullable=False),
        sa.Column("payer_id",     postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("payee_id",     postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("gross_amount", sa.Integer, nullable=False),
        sa.Column("platform_fee", sa.Integer, nullable=False),
        sa.Column("net_amount",   sa.Integer, nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "processing", "completed", "failed", "refunded",
                    name="paymentstatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("escrow_funded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("released_at",      sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes",            sa.Text, nullable=True),
        sa.Column("created_at",       sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_payments_milestone_id", "payments", ["milestone_id"], unique=True)
    op.create_index("ix_payments_contract_id",  "payments", ["contract_id"])
    op.create_index("ix_payments_payer_id",     "payments", ["payer_id"])
    op.create_index("ix_payments_payee_id",     "payments", ["payee_id"])


def downgrade() -> None:
    op.drop_table("payments")
    op.execute("DROP TYPE IF EXISTS paymentstatus")
