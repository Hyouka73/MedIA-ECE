"""add_tipo_consulta_to_encuentros

Revision ID: af2c5e76c43e
Revises: 0b8f9ac79690
Create Date: 2026-04-22 07:02:56.351966

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'af2c5e76c43e'
down_revision: Union[str, Sequence[str], None] = '0b8f9ac79690'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None
 

def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('encuentros_clinicos', sa.Column('tipo_consulta', sa.String(length=20), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('encuentros_clinicos', 'tipo_consulta')
