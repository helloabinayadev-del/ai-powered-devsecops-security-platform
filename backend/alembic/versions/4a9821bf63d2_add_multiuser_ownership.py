"""Add multiuser ownership and user profile fields

Revision ID: 4a9821bf63d2
Revises: 398589fe97c1
Create Date: 2026-09-08 18:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a9821bf63d2'
down_revision: Union[str, Sequence[str], None] = '398589fe97c1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Safely add columns to existing tables using batch mode for SQLite support
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('email', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('is_active', sa.Boolean(), server_default=sa.text('1'), nullable=False))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))
        batch_op.create_index(batch_op.f('ix_users_email'), ['email'], unique=True)

    with op.batch_alter_table('scan_history', schema=None) as batch_op:
        batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))
        batch_op.create_index(batch_op.f('ix_scan_history_user_id'), ['user_id'], unique=False)
        batch_op.create_foreign_key('fk_scan_history_user_id', 'users', ['user_id'], ['id'])

    with op.batch_alter_table('email_history', schema=None) as batch_op:
        batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))
        batch_op.create_index(batch_op.f('ix_email_history_user_id'), ['user_id'], unique=False)
        batch_op.create_foreign_key('fk_email_history_user_id', 'users', ['user_id'], ['id'])

    with op.batch_alter_table('audit_logs', schema=None) as batch_op:
        batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))
        batch_op.create_index(batch_op.f('ix_audit_logs_user_id'), ['user_id'], unique=False)
        batch_op.create_foreign_key('fk_audit_logs_user_id', 'users', ['user_id'], ['id'])


def downgrade() -> None:
    with op.batch_alter_table('audit_logs', schema=None) as batch_op:
        batch_op.drop_constraint('fk_audit_logs_user_id', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_audit_logs_user_id'))
        batch_op.drop_column('user_id')

    with op.batch_alter_table('email_history', schema=None) as batch_op:
        batch_op.drop_constraint('fk_email_history_user_id', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_email_history_user_id'))
        batch_op.drop_column('user_id')

    with op.batch_alter_table('scan_history', schema=None) as batch_op:
        batch_op.drop_constraint('fk_scan_history_user_id', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_scan_history_user_id'))
        batch_op.drop_column('user_id')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_email'))
        batch_op.drop_column('updated_at')
        batch_op.drop_column('is_active')
        batch_op.drop_column('email')
