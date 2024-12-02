"""add_role_based_sharing

Revision ID: 9186ae0dc14e
Revises: fa5e909f7c02
Create Date: 2024-12-01 00:29:04.534311

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector  # Added this import

# revision identifiers, used by Alembic.
revision: str = '9186ae0dc14e'
down_revision: Union[str, None] = 'fa5e909f7c02'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    # Get database connection and inspector
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    existing_columns = [c['name'] for c in inspector.get_columns('secrets')]

    # Add new columns to secrets table if they don't exist
    if 'is_shared' not in existing_columns:
        op.add_column('secrets', sa.Column('is_shared', sa.Boolean(), nullable=False, server_default='false'))
    if 'share_with_all' not in existing_columns:
        op.add_column('secrets', sa.Column('share_with_all', sa.Boolean(), nullable=False, server_default='false'))
    if 'min_role_level' not in existing_columns:
        op.add_column('secrets', sa.Column('min_role_level', sa.Integer(), nullable=True))

    # Create secret_role_shares table
    if 'secret_role_shares' not in inspector.get_table_names():
        op.create_table(
            'secret_role_shares',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('secret_id', sa.Integer(), nullable=False),
            sa.Column('role_level', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
            sa.Column('created_by_user_id', sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(['secret_id'], ['secrets.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id')
        )
        
        # Add indexes for better query performance
        op.create_index(op.f('ix_secret_role_shares_secret_id'), 'secret_role_shares', ['secret_id'])
        op.create_index(op.f('ix_secret_role_shares_role_level'), 'secret_role_shares', ['role_level'])
        
        # Add unique constraint to prevent duplicate shares
        op.create_unique_constraint(
            'uq_secret_role_shares_secret_role',
            'secret_role_shares',
            ['secret_id', 'role_level']
        )

def downgrade():
    # Drop indexes first if they exist
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    
    if 'secret_role_shares' in inspector.get_table_names():
        # Drop unique constraint
        op.drop_constraint('uq_secret_role_shares_secret_role', 'secret_role_shares', type_='unique')
        
        # Drop indexes
        op.drop_index(op.f('ix_secret_role_shares_role_level'), 'secret_role_shares')
        op.drop_index(op.f('ix_secret_role_shares_secret_id'), 'secret_role_shares')
        
        # Drop the table
        op.drop_table('secret_role_shares')

    # Check and drop columns from secrets table
    existing_columns = [c['name'] for c in inspector.get_columns('secrets')]
    
    if 'min_role_level' in existing_columns:
        op.drop_column('secrets', 'min_role_level')
    if 'share_with_all' in existing_columns:
        op.drop_column('secrets', 'share_with_all')
    if 'is_shared' in existing_columns:
        op.drop_column('secrets', 'is_shared')