"""seed_initial_data

Revision ID: 99424089abf1
Revises: 83f165c7d3c2
Create Date: 2026-05-05 22:46:56.891272

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '99424089abf1'
down_revision: Union[str, Sequence[str], None] = '83f165c7d3c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Sincronizar secuencias para evitar errores de duplicado en IDs seriales
    op.execute("SELECT setval(pg_get_serial_sequence('cat_modulos', 'id_modulo'), COALESCE((SELECT MAX(id_modulo) FROM cat_modulos), 1))")
    op.execute("SELECT setval(pg_get_serial_sequence('roles', 'id_rol'), COALESCE((SELECT MAX(id_rol) FROM roles), 1))")
    op.execute("SELECT setval(pg_get_serial_sequence('jurisdicciones_sanitarias', 'id_jurisdiccion'), COALESCE((SELECT MAX(id_jurisdiccion) FROM jurisdicciones_sanitarias), 1))")
    op.execute("SELECT setval(pg_get_serial_sequence('cat_especialidades_medicas', 'id_especialidad'), COALESCE((SELECT MAX(id_especialidad) FROM cat_especialidades_medicas), 1))")

    # 1. Catálogos Geográficos Mínimos
    op.execute("INSERT INTO cat_estados (id_estado, nombre) SELECT '07', 'Chiapas' WHERE NOT EXISTS (SELECT 1 FROM cat_estados WHERE id_estado = '07')")
    op.execute("INSERT INTO cat_municipios (id_municipio, id_estado, nombre) SELECT '07101', '07', 'Tuxtla Gutiérrez' WHERE NOT EXISTS (SELECT 1 FROM cat_municipios WHERE id_municipio = '07101')")
    op.execute("INSERT INTO cat_localidades (id_localidad, id_municipio, nombre, ambito) SELECT '070101001', '07101', 'Tuxtla Gutiérrez', 'Urbano' WHERE NOT EXISTS (SELECT 1 FROM cat_localidades WHERE id_localidad = '070101001')")

    # 2. Especialidades
    op.execute("INSERT INTO cat_especialidades_medicas (id_especialidad, nombre) SELECT 1, 'Medicina General' WHERE NOT EXISTS (SELECT 1 FROM cat_especialidades_medicas WHERE id_especialidad = 1)")

    # 3. Módulos del Sistema
    modulos = [
        ('EXPEDIENTE', 'Expediente Clínico', 'Consulta y edición de expedientes'),
        ('CONSULTA', 'Consulta Médica', 'Gestión del acto médico'),
        ('PRESCRIPCION', 'Prescripciones', 'Emisión de recetas'),
        ('REFERENCIA', 'Referencias Médicas', 'Envío y recepción de referencias'),
        ('LABORATORIO', 'Laboratorio', 'Solicitud y resultados de estudios'),
        ('AUDITORIA', 'Auditoría', 'Bitácora de accesos')
    ]
    for codigo, nombre, desc in modulos:
        op.execute(sa.text("INSERT INTO cat_modulos (codigo, nombre, descripcion) SELECT :codigo, :nombre, :desc WHERE NOT EXISTS (SELECT 1 FROM cat_modulos WHERE codigo = :codigo)").bindparams(codigo=codigo, nombre=nombre, desc=desc))

    # 4. Roles y Permisos
    op.execute("INSERT INTO roles (codigo, nombre, descripcion) SELECT 'MEDICO_GENERAL', 'Médico General', 'Médico con acceso completo al acto médico' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE codigo = 'MEDICO_GENERAL')")
    
    # Asignar permisos al rol de médico
    op.execute("""
        INSERT INTO permisos_rol (id_rol, id_modulo, puede_leer, puede_crear, puede_editar, puede_eliminar)
        SELECT r.id_rol, m.id_modulo, true, true, true, false
        FROM roles r, cat_modulos m
        WHERE r.codigo = 'MEDICO_GENERAL'
        AND NOT EXISTS (SELECT 1 FROM permisos_rol WHERE id_rol = r.id_rol AND id_modulo = m.id_modulo)
    """)

    # 5. Jurisdicción y Establecimiento
    op.execute("INSERT INTO jurisdicciones_sanitarias (nombre, num_jurisdiccion) SELECT 'Jurisdicción Sanitaria I — Tuxtla Gutiérrez', 1 WHERE NOT EXISTS (SELECT 1 FROM jurisdicciones_sanitarias WHERE num_jurisdiccion = 1)")
    
    op.execute("""
        INSERT INTO establecimientos (id_establecimiento, clues, nombre, id_jurisdiccion, id_localidad, nivel_atencion)
        SELECT '00000000-0000-0000-0000-000000000001', 'CS07TUX0001', 'Centro de Salud Urbano No. 1 — Tuxtla Gutiérrez (DEV)', 
               (SELECT id_jurisdiccion FROM jurisdicciones_sanitarias WHERE num_jurisdiccion = 1 LIMIT 1), 
               '070101001', 1
        WHERE NOT EXISTS (SELECT 1 FROM establecimientos WHERE id_establecimiento = '00000000-0000-0000-0000-000000000001')
    """)

    # 6. Médico de Pruebas (Password: Test1234!)
    op.execute("""
        INSERT INTO personas (id_persona, nombre, primer_apellido, segundo_apellido, curp, fecha_nacimiento, sexo, id_localidad, calle_numero, telefono)
        SELECT 'aaaaaaaa-0000-0000-0000-000000000001', 'Carlos Alberto', 'Martínez', 'Ruiz', 'MARC850315HCSNRR09', '1985-03-15', 'M', '070101001', 'Blvd. Belisario Domínguez 1234', '9611234567'
        WHERE NOT EXISTS (SELECT 1 FROM personas WHERE id_persona = 'aaaaaaaa-0000-0000-0000-000000000001')
    """)
    
    op.execute("""
        INSERT INTO usuarios_sistema (id_usuario, id_persona, email, password_hash, id_rol, cedula_profesional, requires_2fa, activo)
        SELECT 'bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'dr.martinez.pruebas@medsys.local', '$2b$12$ZpBwDREvTfQjK7rX9v.9uO1rF5yV5oUv0F9wX8z.rYmYgW1l7yQG', 
               (SELECT id_rol FROM roles WHERE codigo = 'MEDICO_GENERAL' LIMIT 1), 'CED-12345678', false, true
        WHERE NOT EXISTS (SELECT 1 FROM usuarios_sistema WHERE id_usuario = 'bbbbbbbb-0000-0000-0000-000000000001')
    """)
    
    op.execute("""
        INSERT INTO usuarios_establecimientos (id_usuario, id_establecimiento, es_principal)
        SELECT 'bbbbbbbb-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', true
        WHERE NOT EXISTS (SELECT 1 FROM usuarios_establecimientos WHERE id_usuario = 'bbbbbbbb-0000-0000-0000-000000000001' AND id_establecimiento = '00000000-0000-0000-0000-000000000001')
    """)


def downgrade() -> None:
    # Eliminar datos sembrados en orden inverso
    op.execute("DELETE FROM usuarios_establecimientos WHERE id_usuario = 'bbbbbbbb-0000-0000-0000-000000000001'")
    op.execute("DELETE FROM usuarios_sistema WHERE id_usuario = 'bbbbbbbb-0000-0000-0000-000000000001'")
    op.execute("DELETE FROM personas WHERE id_persona = 'aaaaaaaa-0000-0000-0000-000000000001'")
    op.execute("DELETE FROM establecimientos WHERE id_establecimiento = '00000000-0000-0000-0000-000000000001'")
    op.execute("DELETE FROM roles WHERE codigo = 'MEDICO_GENERAL'")
    op.execute("DELETE FROM cat_modulos WHERE codigo IN ('EXPEDIENTE', 'CONSULTA', 'PRESCRIPCION', 'REFERENCIA', 'LABORATORIO', 'AUDITORIA')")
