"""fix(db): optimizacion final trigger historial ignorando metadatos extra

Revision ID: 0b8f9ac79690
Revises: 4e96d31a7c45
Create Date: 2026-03-06 16:13:28.182265

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0b8f9ac79690'
down_revision: Union[str, Sequence[str], None] = '4e96d31a7c45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Optimizar trigger para ignorar columnas irrelevantes/administrativas
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
                -- Evitar columnas de metadatos administrativos o PKs irrelevantes para auditoria clínica
                IF columna.column_name IN (
                    'id_paciente', 'id_persona', 'id_alergia', 'id_ahf', 'id_ap', 'id_anp', 'id_ago', 'id_inmunizacion', 
                    'url_foto', 'fecha_registro', 'intentos_fallidos', 'ultimo_login', 'bloqueado_hasta', 'password_hash',
                    'eliminado_en', 'eliminado_por', 'registrado_por'
                ) THEN
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
    # Revertir incluyendo los campos de metadatos de eliminación si es necesario
    op.execute(sa.text("""
        CREATE OR REPLACE FUNCTION fn_registrar_cambio()
        RETURNS TRIGGER AS $$
        DECLARE
            columna record;
            v_id UUID;
            v_user_id UUID;
            _ boolean;
        BEGIN
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
            
            BEGIN
                v_user_id := (SELECT id_usuario FROM current_setting('myapp.current_user', true))::uuid;
            EXCEPTION WHEN OTHERS THEN
                v_user_id := NULL;
            END;

            FOR columna IN SELECT column_name FROM information_schema.columns 
                          WHERE table_name = TG_TABLE_NAME AND table_schema = TG_TABLE_SCHEMA
            LOOP
                IF columna.column_name IN (
                    'id_paciente', 'id_persona', 'id_alergia', 'id_ahf', 'id_ap', 'id_anp', 'id_ago', 'id_inmunizacion', 
                    'url_foto', 'fecha_registro', 'intentos_fallidos', 'ultimo_login', 'bloqueado_hasta', 'password_hash'
                ) THEN
                    CONTINUE;
                END IF;

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
