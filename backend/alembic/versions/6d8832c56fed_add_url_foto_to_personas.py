"""Add url_foto to personas

Revision ID: 6d8832c56fed
Revises: 
Create Date: 2026-03-05 22:53:30.438568

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '6d8832c56fed'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('personas', sa.Column('url_foto', sa.String(), nullable=True))

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('personas', 'url_foto')
