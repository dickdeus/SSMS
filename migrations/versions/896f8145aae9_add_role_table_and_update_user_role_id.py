"""Sync ROLE and GROUP migrations with updated MySQL schema

Revision ID: 896f8145aae9
Revises: 
Create Date: 2025-08-06 11:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '896f8145aae9'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # ✅ SKIP migrating from user_group (already done manually)
    # ✅ SKIP dropping user_group (already dropped)

    # ✅ Ensure STATION.group_id points to GROUP
    with op.batch_alter_table('STATION', schema=None) as batch_op:
        batch_op.drop_constraint('STATION_group_id_fkey', type_='foreignkey', if_exists=True)
        batch_op.create_foreign_key('STATION_group_id_fkey', 'GROUP', ['group_id'], ['id'])

    # ✅ SKIP creating ROLE (already exists)
    # ✅ Update USERS.role_id to point to ROLE.id
    with op.batch_alter_table('USERS', schema=None) as batch_op:
        batch_op.drop_constraint('USERS_ibfk_2', type_='foreignkey', if_exists=True)
        batch_op.create_foreign_key('USERS_role_id_fkey', 'ROLE', ['role_id'], ['id'])

def downgrade():
    # Recreate user_group table if needed
    op.create_table(
        'user_group',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('group_name', sa.String(length=150), nullable=False),
        sa.Column('created_by', sa.Integer()),
        sa.Column('created_time', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
    )

    # Copy data back from GROUP to user_group
    op.execute('INSERT INTO user_group (id, group_name, created_by, created_time) SELECT id, group_name, created_by, created_time FROM `GROUP`')

    # Point STATION.group_id back to user_group
    with op.batch_alter_table('STATION', schema=None) as batch_op:
        batch_op.drop_constraint('STATION_group_id_fkey', type_='foreignkey', if_exists=True)
        batch_op.create_foreign_key('STATION_ibfk_2', 'user_group', ['group_id'], ['id'])

    # Drop foreign key from USERS to ROLE
    with op.batch_alter_table('USERS', schema=None) as batch_op:
        batch_op.drop_constraint('USERS_role_id_fkey', type_='foreignkey', if_exists=True)

    # Drop ROLE table
    op.drop_table('ROLE')
