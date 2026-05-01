-- 07_demo_data.sql
-- Datos de demostración para el sistema MedIA ECE
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
