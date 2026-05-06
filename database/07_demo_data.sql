-- 07_demo_data.sql
-- Datos de demostración para el sistema MedSys ECE
-- Inserta un Paciente de Prueba completo para agilizar el testing de P3

-- 1. Persona de Prueba (Vinculada a Tuxtla Gutiérrez)
INSERT INTO personas (id_persona, nombre, primer_apellido, segundo_apellido, curp, fecha_nacimiento, sexo, id_localidad, calle_numero)
VALUES (
    'f1e2d3c4-b5a6-4978-8765-43210fedcba9',
    'PACIENTE',
    'DE PRUEBA',
    'SISTEMA',
    'PAPR000501HDFRRD01',
    '2000-05-01',
    'M',
    '071010001', -- Tuxtla Gutiérrez (071010001 en 03_seeds_geograficos.sql)
    'Av. Central Poniente 123, Centro'
);

-- 2. Registro de Paciente
INSERT INTO pacientes (id_paciente, id_persona, numero_expediente, grupo_sanguineo)
VALUES (
    'a1b2c3d4-e5f6-4a1b-8c9d-0e1f2a3b4c5d',
    'f1e2d3c4-b5a6-4978-8765-43210fedcba9',
    'EXP-2026-0001',
    'O+'
);

-- 3. Antecedentes Heredofamiliares
INSERT INTO antecedentes_heredofamiliares (id_ahf, id_paciente, diabetes, hipertension, detalles)
VALUES (
    gen_random_uuid(),
    'a1b2c3d4-e5f6-4a1b-8c9d-0e1f2a3b4c5d',
    true,
    true,
    'Padre con diabetes tipo 2. Madre con hipertensión arterial controlada.'
);

-- 4. Alergias Críticas
INSERT INTO alergias (id_alergia, id_paciente, alergia, severidad, registrado_por)
VALUES (
    gen_random_uuid(),
    'a1b2c3d4-e5f6-4a1b-8c9d-0e1f2a3b4c5d',
    'Penicilina',
    'CRITICA',
    'b2c3d4e5-f6a7-4b5c-8d9e-0f1a2b3c4d5e' -- Registrado por SuperAdmin (06_seeds_superadmin.sql)
);

-- 5. Inmunizaciones básicas
INSERT INTO inmunizaciones (id_inmunizacion, id_paciente, vacuna, fecha_aplicacion, dosis)
VALUES 
    (gen_random_uuid(), 'a1b2c3d4-e5f6-4a1b-8c9d-0e1f2a3b4c5d', 'Influenza Estacional', '2025-10-15', 'Anual'),
    (gen_random_uuid(), 'a1b2c3d4-e5f6-4a1b-8c9d-0e1f2a3b4c5d', 'SR (Sarampión y Rubéola)', '2024-05-20', 'Refuerzo');

-- 6. Encuentro Clínico Base
INSERT INTO encuentros_clinicos (id_encuentro, id_paciente, id_medico, id_establecimiento, id_especialidad, motivo_consulta)
VALUES (
    'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e',
    'a1b2c3d4-e5f6-4a1b-8c9d-0e1f2a3b4c5d',
    'c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d', -- Médico A
    'e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb', -- CS Tuxtla
    1, -- Medicina General
    'Control de hipertensión y revisión general.'
);

-- 7. Signos Vitales (Dentro de rangos válidos: 34-42C, 60-250 sistólica)
INSERT INTO signos_vitales (id_signos, id_encuentro, id_enfermero, peso_kg, talla_cm, temperatura_c, frecuencia_cardiaca, presion_sistolica, presion_diastolica, saturacion_oxigeno)
VALUES (
    gen_random_uuid(),
    'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e',
    'e1b2c3d4-f5e6-4a1b-2c3d-4e5f6a7b8c9d', -- Enfermera
    75.50,
    170.00,
    36.5,
    72,
    120,
    80,
    98
);

-- 8. Nota Médica SOAP (Sin firmar para permitir edición)
INSERT INTO notas_medicas (id_nota, id_encuentro, tipo_nota, esta_firmada)
VALUES (
    'n1n2n3n4-n5n6-4n7n-8n9n-0n1n2n3n4n5n',
    'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e',
    'EVOLUCION',
    false
);

INSERT INTO notas_soap_detalle (id_nota, subjetivo, objetivo, analisis, plan)
VALUES (
    'n1n2n3n4-n5n6-4n7n-8n9n-0n1n2n3n4n5n',
    'Paciente refiere sentirse bien, sin cefalea ni mareos.',
    'Signos estables. Exploración física sin hallazgos patológicos.',
    'Hipertensión arterial sistémica controlada.',
    'Continuar con tratamiento actual. Dieta hiposódica.'
);

-- 9. Referencia Médica (Estado Inicial: EMITIDA)
INSERT INTO referencias_medicas (id_referencia, id_encuentro_origen, id_establecimiento_destino, id_especialidad_destino, estado, motivo_referencia)
VALUES (
    'r1r2r3r4-r5r6-4r7r-8r9r-0r1r2r3r4r5r',
    'e1e2e3e4-e5e6-4e7e-8e9e-0e1e2e3e4e5e',
    'e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb', -- Destino (mismo por ahora para demo)
    2, -- Ginecología (ejemplo)
    'EMITIDA',
    'Se requiere valoración por especialista para control preventivo.'
);

-- ==========================================
-- ADICIÓN: Paciente B (Zona 2) e Interoperabilidad P1->P2
-- ==========================================

-- 1. Paciente B (Residente en San Cristóbal para prueba de aislamiento)
INSERT INTO personas (id_persona, nombre, primer_apellido, segundo_apellido, curp, fecha_nacimiento, sexo, id_localidad)
VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'ELENA',
    'VÁZQUEZ',
    'RUIZ',
    'VARE920505MDFRRD10',
    '1992-05-05',
    'F',
    '070780001' -- San Cristóbal
);

INSERT INTO pacientes (id_paciente, id_persona, numero_expediente, grupo_sanguineo)
VALUES (
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440003',
    'EXP-2026-SCLC-0002',
    'A+'
);

-- 2. Interoperabilidad: Reorientar Referencia del Paciente A (Tuxtla) hacia Hospital SCLC (Zona 2)
-- Se modifica el destino original para que el Médico B (SCLC) pueda recibirla
UPDATE referencias_medicas
SET id_establecimiento_destino = '550e8400-e29b-41d4-a716-446655440000',
    id_especialidad_destino = 1, -- Medicina General
    estado = 'EMITIDA'
WHERE id_referencia = 'r1r2r3r4-r5r6-4r7r-8r9r-0r1r2r3r4r5r';
