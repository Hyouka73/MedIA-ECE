"""Add automatic paciente creation trigger cuando se crea una persona

Revision ID: 7f8d9e6c5b3a
Revises: cd757cd06ec9
Create Date: 2026-04-25 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7f8d9e6c5b3a'
down_revision = 'cd757cd06ec9'
branch_labels = None
depends_on = None


def upgrade():
    """Crear trigger que automáticamente registra una persona como paciente"""

    # Crear función para generar número_expediente
    op.execute("""
    CREATE OR REPLACE FUNCTION fn_crear_paciente_automatico()
    RETURNS TRIGGER AS $$
    DECLARE
        v_numero_expediente VARCHAR(50);
        v_year INT;
        v_seq INT;
    BEGIN
        -- Obtener año actual
        v_year := EXTRACT(YEAR FROM CURRENT_TIMESTAMP);

        -- Obtener el siguiente número de secuencia para el año
        SELECT COALESCE(MAX(CAST(SUBSTRING(numero_expediente FROM 9) AS INT)), 0) + 1
        INTO v_seq
        FROM pacientes
        WHERE EXTRACT(YEAR FROM fecha_registro) = v_year;

        -- Generar número_expediente en formato EXP-YYYY-XXXXXX
        v_numero_expediente := 'EXP-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');

        -- Crear automáticamente el paciente
        INSERT INTO pacientes (
            id_paciente,
            id_persona,
            numero_expediente,
            grupo_sanguineo,
            fecha_registro,
            eliminado_en,
            eliminado_por,
            motivo_baja
        ) VALUES (
            gen_random_uuid(),
            NEW.id_persona,
            v_numero_expediente,
            NULL,
            CURRENT_TIMESTAMP,
            NULL,
            NULL,
            NULL
        );

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    # Crear trigger que se dispara después de insertar una persona
    op.execute("""
    CREATE TRIGGER tr_auto_create_paciente
    AFTER INSERT ON personas
    FOR EACH ROW
    EXECUTE FUNCTION fn_crear_paciente_automatico();
    """)


def downgrade():
    """Remover el trigger y la función"""

    op.execute("DROP TRIGGER IF EXISTS tr_auto_create_paciente ON personas;")
    op.execute("DROP FUNCTION IF EXISTS fn_crear_paciente_automatico();")
