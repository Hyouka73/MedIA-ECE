"""fix(trigger): corregir UndefinedColumnError en fn_registrar_cambio

Revision ID: 055ae9b771b1
Revises: cd757cd06ec9
Create Date: 2026-03-06 02:45:36.309605

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '055ae9b771b1'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Arreglar la función de trigger fn_registrar_cambio para ser dinámica y segura
    op.execute(sa.text("""
        CREATE OR REPLACE FUNCTION fn_registrar_cambio()
        RETURNS TRIGGER AS $$
        DECLARE
            columna record;
            v_id UUID;
            v_user_id UUID;
            _ boolean;
        BEGIN
            -- Determinar el ID del registro según la tabla (Req 6 Forense)
            CASE TG_TABLE_NAME
                WHEN 'pacientes' THEN v_id := NEW.id_paciente;
                WHEN 'personas' THEN v_id := NEW.id_persona;
                WHEN 'alergias' THEN v_id := NEW.id_alergia;
                WHEN 'antecedentes_heredofamiliares' THEN v_id := NEW.id_ahf;
                WHEN 'antecedentes_patologicos' THEN v_id := NEW.id_ap;
                WHEN 'antecedentes_no_patologicos' THEN v_id := NEW.id_anp;
                WHEN 'antecedentes_ginecoobstetricos' THEN v_id := NEW.id_ago;
                WHEN 'inmunizaciones' THEN v_id := NEW.id_inmunizacion;
                ELSE v_id := gen_random_uuid();
            END CASE;
            
            -- Obtener ID del usuario del contexto (opcional, si el app lo setea)
            BEGIN
                v_user_id := (SELECT id_usuario FROM current_setting('myapp.current_user', true))::uuid;
            EXCEPTION WHEN OTHERS THEN
                v_user_id := NULL;
            END;

            FOR columna IN SELECT column_name FROM information_schema.columns 
                          WHERE table_name = TG_TABLE_NAME AND table_schema = TG_TABLE_SCHEMA
            LOOP
                -- Evitar columnas de ID PK para la comparativa de cambios
                IF columna.column_name IN ('id_paciente', 'id_persona', 'id_alergia', 'id_ahf', 'id_ap', 'id_anp', 'id_ago', 'id_inmunizacion') THEN
                    CONTINUE;
                END IF;

                -- Comparativa IS DISTINCT FROM para manejar NULLs correctamente
                EXECUTE format('SELECT ($1).%I IS DISTINCT FROM ($2).%I', columna.column_name, columna.column_name)
                INTO STRICT _
                USING OLD, NEW;
                
                IF _ THEN
                    EXECUTE format('INSERT INTO historial_cambios (tabla_afectada, registro_id, id_usuario, campo_modificado, valor_anterior, valor_nuevo)
                    VALUES ($1, $2, $3, $4, ($5).%I::text, ($6).%I::text)', 
                    columna.column_name, columna.column_name)
                    USING TG_TABLE_NAME, v_id, v_user_id, columna.column_name, OLD, NEW;
                END IF;
            END LOOP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """))


def downgrade() -> None:
    # Volver a la versión heurística original (aunque tuviera bugs era el estado anterior)
    op.execute(sa.text("""
        CREATE OR REPLACE FUNCTION fn_registrar_cambio()
        RETURNS TRIGGER AS $$
        DECLARE
            columna record;
            v_id UUID;
            _ boolean;
        BEGIN
            v_id := COALESCE(NEW.id_paciente, NEW.id_persona, NEW.id_nota, gen_random_uuid());
            
            FOR columna IN SELECT column_name FROM information_schema.columns 
                          WHERE table_name = TG_TABLE_NAME AND table_schema = TG_TABLE_SCHEMA
            LOOP
                EXECUTE format('SELECT ($1).%I != ($2).%I', columna.column_name, columna.column_name)
                INTO STRICT _
                USING OLD, NEW;
                
                IF _ THEN
                    EXECUTE format('INSERT INTO historial_cambios (tabla_afectada, registro_id, id_usuario, campo_modificado, valor_anterior, valor_nuevo)
                    VALUES ($1, $2, (SELECT id_usuario FROM current_setting(''myapp.current_user'', true)), $3, ($4).%I::text, ($5).%I::text)', 
                    columna.column_name, columna.column_name)
                    USING TG_TABLE_NAME, v_id, columna.column_name, OLD, NEW;
                END IF;
            END LOOP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """))
