"""ajuste forense ece urls y hashes

Revision ID: cd757cd06ec9
Revises: a1b2c3d4e5f6
Create Date: 2026-03-06 02:12:33.069695

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cd757cd06ec9'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Agregar pdf_url a notas_medicas (el hash ya existía)
    op.add_column('notas_medicas', sa.Column('pdf_url', sa.Text(), nullable=True))
    
    # 2. Agregar hash legal a tutores (la url ya existía)
    op.add_column('pacientes_tutores_representantes', sa.Column('documento_legal_hash', sa.String(length=255), nullable=True))
    
    # 3. Quitar hash_archivo de auditoria_accesos para evitar bloating
    op.drop_column('auditoria_accesos', 'hash_archivo')
    
    # 4. Crear nueva tabla exclusiva para descargas masivas o exportaciones de expediente (Riesgo Fuga de Datos)
    op.create_table(
        'auditoria_exportaciones',
        sa.Column('id_exportacion', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('id_usuario', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('usuarios_sistema.id_usuario', ondelete='RESTRICT'), nullable=False),
        sa.Column('fecha_exportacion', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('tipo_exportacion', sa.String(length=50), nullable=False),
        sa.Column('formato', sa.String(length=20), nullable=False),
        sa.Column('archivo_url', sa.Text(), nullable=False),
        sa.Column('archivo_hash', sa.String(length=255), nullable=False),
        sa.Column('direccion_ip', sa.dialects.postgresql.INET(), nullable=False),
        sa.Column('motivo', sa.Text(), nullable=True)
    )


def downgrade() -> None:
    op.drop_table('auditoria_exportaciones')
    op.add_column('auditoria_accesos', sa.Column('hash_archivo', sa.String(length=255), nullable=True))
    op.drop_column('pacientes_tutores_representantes', 'documento_legal_hash')
    op.drop_column('notas_medicas', 'pdf_url')
