"""add_trigger_encuentro_cierre_irreversible

Revision ID: 91d01841ccca
Revises: af2c5e76c43e
Create Date: 2026-04-22 07:16:32.160048

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '91d01841ccca'
down_revision: Union[str, Sequence[str], None] = 'af2c5e76c43e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Crear función para prevenir reapertura de encuentros cerrados
    op.execute("""
        CREATE OR REPLACE FUNCTION fn_encuentro_cierre_irreversible()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Si el encuentro ya estaba cerrado, no permitir cambios en fecha_cierre
            IF OLD.fecha_cierre IS NOT NULL AND NEW.fecha_cierre IS NULL THEN
                RAISE EXCEPTION 'Violación de integridad: El cierre de un encuentro es irreversible.';
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    # Crear el trigger
    op.execute("""
        CREATE TRIGGER tr_encuentro_cierre_irreversible
        BEFORE UPDATE ON encuentros_clinicos
        FOR EACH ROW EXECUTE FUNCTION fn_encuentro_cierre_irreversible();
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Eliminar el trigger
    op.execute("DROP TRIGGER IF EXISTS tr_encuentro_cierre_irreversible ON encuentros_clinicos;")
    # Eliminar la función
    op.execute("DROP FUNCTION IF EXISTS fn_encuentro_cierre_irreversible();")
