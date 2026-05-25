"""M4: contracts, milestones, messages tables

Revision ID: 0003
Revises: 0002
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── contracts ─────────────────────────────────────────────────────────────
    op.create_table(
        "contracts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("proposal_id",  postgresql.UUID(as_uuid=True), sa.ForeignKey("proposals.id"),  nullable=False),
        sa.Column("project_id",   postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"),   nullable=False),
        sa.Column("client_id",    postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"),      nullable=False),
        sa.Column("freelancer_id",postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"),      nullable=False),
        sa.Column("total_amount",         sa.Integer, nullable=False),
        sa.Column("platform_commission",  sa.Integer, nullable=False),
        sa.Column("freelancer_amount",    sa.Integer, nullable=False),
        sa.Column(
            "status",
            sa.Enum("active","completed","disputed","cancelled","paused", name="contractstatus"),
            nullable=False, server_default="active",
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("ended_at",   sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_contracts_client_id",     "contracts", ["client_id"])
    op.create_index("ix_contracts_freelancer_id",  "contracts", ["freelancer_id"])
    op.create_index("ix_contracts_proposal_id",    "contracts", ["proposal_id"], unique=True)

    # ── milestones ────────────────────────────────────────────────────────────
    op.create_table(
        "milestones",
        sa.Column("id",          postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("contract_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title",       sa.String(500), nullable=False),
        sa.Column("description", sa.Text,        nullable=True),
        sa.Column("amount",      sa.Integer,     nullable=False),
        sa.Column("due_date",    sa.Date,        nullable=True),
        sa.Column("order_index", sa.Integer,     nullable=False, server_default="0"),
        sa.Column(
            "status",
            sa.Enum("pending","in_progress","submitted","revision_requested","approved","paid",
                    name="milestonestatus"),
            nullable=False, server_default="pending",
        ),
        sa.Column("deliverable_urls", postgresql.ARRAY(sa.String), nullable=True),
        sa.Column("revision_note",    sa.Text,    nullable=True),
        sa.Column("submitted_at",     sa.DateTime(timezone=True), nullable=True),
        sa.Column("approved_at",      sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at",       sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_milestones_contract_id", "milestones", ["contract_id"])

    # ── messages ──────────────────────────────────────────────────────────────
    op.create_table(
        "messages",
        sa.Column("id",          postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("contract_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sender_id",   postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"),   nullable=False),
        sa.Column("content",     sa.Text,    nullable=False),
        sa.Column("file_urls",   postgresql.ARRAY(sa.String), nullable=True),
        sa.Column("is_read",     sa.Boolean, nullable=False, server_default="false"),
        sa.Column("sent_at",     sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_messages_contract_id", "messages", ["contract_id"])
    op.create_index("ix_messages_sender_id",   "messages", ["sender_id"])
    op.create_index("ix_messages_sent_at",     "messages", ["sent_at"])


def downgrade() -> None:
    op.drop_table("messages")
    op.drop_table("milestones")
    op.drop_table("contracts")
    op.execute("DROP TYPE IF EXISTS milestonestatus")
    op.execute("DROP TYPE IF EXISTS contractstatus")
