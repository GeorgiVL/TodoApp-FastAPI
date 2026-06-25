"""Create phone number for user column

Revision ID: a73ed078bec1
Revises: 
Create Date: 2026-06-22 17:02:05.766714

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a73ed078bec1'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('phone_number', sa.String(15), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'phone_number')
