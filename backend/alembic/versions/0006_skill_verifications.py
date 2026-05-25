"""M8: skill_verifications table

Revision ID: 0006
Revises: 0005_reviews
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = '0006'
down_revision = '0005_reviews'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'skill_verifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('skill_name', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('session_data', sa.JSON(), nullable=True),
        sa.Column('badge_awarded', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_skill_verifications_user_id', 'skill_verifications', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_skill_verifications_user_id', table_name='skill_verifications')
    op.drop_table('skill_verifications')
