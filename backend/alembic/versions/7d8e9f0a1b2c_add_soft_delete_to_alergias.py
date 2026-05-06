"""add soft delete to alergias and expand audit columns

Revision ID: 7d8e9f0a1b2c
Revises: 055ae9b771b1
Create Date: 2026-05-02 00:35:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '7d8e9f0a1b2c'
down_revision = '0b8f9ac79690'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Eliminar vista dependiente temporalmente (NOM-024 Audit Dashboard)
    op.execute("DROP VIEW IF EXISTS v_auditoria_estadistica")

    # 2. Modificaciones en auditoria_accesos (Persona 5 - Mensajes largos)
    op.alter_column('auditoria_accesos', 'modulo_funcion',
               existing_type=sa.VARCHAR(length=100),
               type_=sa.VARCHAR(length=255),
               existing_nullable=True)
    op.alter_column('auditoria_accesos', 'tipo_evento',
               existing_type=sa.VARCHAR(length=50),
               type_=sa.VARCHAR(length=255),
               existing_nullable=True)
    op.alter_column('auditoria_accesos', 'resultado',
               existing_type=sa.VARCHAR(length=20),
               type_=sa.VARCHAR(length=100),
               existing_nullable=True)

    # 3. Recrear la vista v_auditoria_estadistica (Req Forense)
    op.execute("""
        CREATE OR REPLACE VIEW v_auditoria_estadistica AS
        SELECT 
            DATE(timestamp_evento) as fecha,
            nivel_severidad,
            tipo_evento,
            COUNT(*) as total_eventos
        FROM auditoria_accesos
        GROUP BY fecha, nivel_severidad, tipo_evento;
    """)

    # 4. Agregar columnas de Soft Delete a alergias si no existen
    conn = op.get_bind()
    from sqlalchemy.engine.reflection import Inspector
    inspector = Inspector.from_engine(conn)
    columns = [c['name'] for c in inspector.get_columns('alergias')]
    
    if 'eliminado_en' not in columns:
        op.add_column('alergias', sa.Column('eliminado_en', sa.DateTime(timezone=True), nullable=True))
    if 'eliminado_por' not in columns:
        op.add_column('alergias', sa.Column('eliminado_por', sa.UUID(), nullable=True))
    if 'motivo_baja' not in columns:
        op.add_column('alergias', sa.Column('motivo_baja', sa.String(length=255), nullable=True))


def downgrade() -> None:
    # 1. Eliminar vista dependiente
    op.execute("DROP VIEW IF EXISTS v_auditoria_estadistica")

    # 2. Revertir columnas de auditoría
    op.alter_column('auditoria_accesos', 'resultado',
               existing_type=sa.VARCHAR(length=100),
               type_=sa.VARCHAR(length=20),
               existing_nullable=True)
    op.alter_column('auditoria_accesos', 'tipo_evento',
               existing_type=sa.VARCHAR(length=255),
               type_=sa.VARCHAR(length=50),
               existing_nullable=True)
    op.alter_column('auditoria_accesos', 'modulo_funcion',
               existing_type=sa.VARCHAR(length=255),
               type_=sa.VARCHAR(length=100),
               existing_nullable=True)
    
    # 3. Recrear la vista con los tipos originales
    op.execute("""
        CREATE OR REPLACE VIEW v_auditoria_estadistica AS
        SELECT 
            DATE(timestamp_evento) as fecha,
            nivel_severidad,
            tipo_evento,
            COUNT(*) as total_eventos
        FROM auditoria_accesos
        GROUP BY fecha, nivel_severidad, tipo_evento;
    """)

    # 4. Eliminar columnas de Soft Delete si existen
    conn = op.get_bind()
    from sqlalchemy.engine.reflection import Inspector
    inspector = Inspector.from_engine(conn)
    columns = [c['name'] for c in inspector.get_columns('alergias')]

    if 'motivo_baja' in columns:
        op.drop_column('alergias', 'motivo_baja')
    if 'eliminado_por' in columns:
        op.drop_column('alergias', 'eliminado_por')
    if 'eliminado_en' in columns:
        op.drop_column('alergias', 'eliminado_en')
