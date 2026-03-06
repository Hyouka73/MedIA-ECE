"""add sesiones_activas whitelist

Revision ID: a1b2c3d4e5f6
Revises: 6d8832c56fed
Create Date: 2026-03-06 07:30:00.000000

Whitelist de refresh tokens activos para invalidación inmediata en logout.
"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '6d8832c56fed'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'sesiones_activas',
        sa.Column('jti', sa.String(36), primary_key=True),
        sa.Column('id_usuario', sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('usuarios_sistema.id_usuario', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('ip_origen', sa.String(45)),
        sa.Column('user_agent', sa.String(512)),
        sa.Column('fecha_creacion', sa.DateTime(timezone=True), nullable=False),
        sa.Column('fecha_expira', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_sesiones_activas_id_usuario', 'sesiones_activas', ['id_usuario'])
    op.create_index('ix_sesiones_activas_fecha_expira', 'sesiones_activas', ['fecha_expira'])


def downgrade() -> None:
    op.drop_table('sesiones_activas')
