"""add saved_freelancers table (M9)

Revision ID: m9_community
Revises: m8_skill_verifications
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'm9_community'
down_revision = '0006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'saved_freelancers',
        sa.Column('id',            postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id',       postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('freelancer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('saved_at',      sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('user_id', 'freelancer_id', name='uq_saved_freelancer'),
    )
    op.create_index('ix_saved_freelancers_user_id',       'saved_freelancers', ['user_id'])
    op.create_index('ix_saved_freelancers_freelancer_id', 'saved_freelancers', ['freelancer_id'])


def downgrade() -> None:
    op.drop_index('ix_saved_freelancers_freelancer_id')
    op.drop_index('ix_saved_freelancers_user_id')
    op.drop_table('saved_freelancers')
