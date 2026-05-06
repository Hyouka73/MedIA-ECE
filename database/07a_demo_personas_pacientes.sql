-- 07a_demo_personas_pacientes.sql
-- Demo Data: Personas, Pacientes, Antecedentes, Alergias, Inmunizaciones
-- UUIDs fijos para referencias cruzadas con 07b y 07c

-- ── PERSONAS ────────────────────────────────────────────────────────────────

INSERT INTO personas (id_persona, nombre, primer_apellido, segundo_apellido, curp, fecha_nacimiento, sexo, id_localidad, calle_numero) VALUES
-- Paciente 1: Hombre adulto mayor, hipertenso diabético
('aa000001-0000-4000-8000-000000000001', 'CARLOS', 'HERNÁNDEZ', 'MÉNDEZ',   'HEMC550312HCHRND09', '1955-03-12', 'M', '071010001', 'Calle Emiliano Zapata 45, Col. Centro'),
-- Paciente 2: Mujer embarazada, sin CURP (comunidad indígena)
('aa000001-0000-4000-8000-000000000002', 'ROSA',   'PÉREZ',     'GÓMEZ',    NULL,                 '1998-07-22', 'F', '071010034', 'Camino a Copoya s/n'),
-- Paciente 3: Niño de 8 años
('aa000001-0000-4000-8000-000000000003', 'MATEO',  'LÓPEZ',     'RUIZ',     'LORM160904HCSPZT05', '2016-09-04', 'M', '071010001', 'Av. 5 de Mayo 12, Barrio Guadalupe'),
-- Paciente 4: Mujer joven, hablante de tseltal
('aa000001-0000-4000-8000-000000000004', 'JUANA',  'DÍAZ',      'JIMÉNEZ',  'DIJJ950118MCSZMN02', '1995-01-18', 'F', '070780001', 'Calle Real de Guadalupe 88, SCLC'),
-- Paciente 5: Hombre con múltiples patologías
('aa000001-0000-4000-8000-000000000005', 'SERGIO', 'MORALES',   'CASTILLO', 'MOCS780623HCSNSR07', '1978-06-23', 'M', '071010001', 'Blvd. Ángel Albino Corzo 301, Tuxtla');

-- Representante del Paciente 3 (menor de edad)
INSERT INTO personas (id_persona, nombre, primer_apellido, segundo_apellido, curp, fecha_nacimiento, sexo, id_localidad) VALUES
('aa000001-0000-4000-8000-000000000006', 'ANA', 'RUIZ', 'SANTOS', 'RUSA850210MCSZNQ03', '1985-02-10', 'F', '071010001');

-- ── PACIENTES ────────────────────────────────────────────────────────────────

INSERT INTO pacientes (id_paciente, id_persona, numero_expediente, grupo_sanguineo, fecha_registro) VALUES
('bb000001-0000-4000-8000-000000000001', 'aa000001-0000-4000-8000-000000000001', 'EXP-2026-TUX-001', 'A+',  '2026-01-10 08:30:00-06'),
('bb000001-0000-4000-8000-000000000002', 'aa000001-0000-4000-8000-000000000002', 'EXP-2026-TUX-002', 'O+',  '2026-01-15 09:00:00-06'),
('bb000001-0000-4000-8000-000000000003', 'aa000001-0000-4000-8000-000000000003', 'EXP-2026-TUX-003', 'B+',  '2026-02-03 10:00:00-06'),
('bb000001-0000-4000-8000-000000000004', 'aa000001-0000-4000-8000-000000000004', 'EXP-2026-SCL-001', 'O-',  '2026-02-14 11:00:00-06'),
('bb000001-0000-4000-8000-000000000005', 'aa000001-0000-4000-8000-000000000005', 'EXP-2026-TUX-004', 'AB+', '2026-03-01 08:00:00-06');

-- ── TUTOR / REPRESENTANTE (Paciente 3 - menor) ───────────────────────────────

INSERT INTO pacientes_tutores_representantes (id_tutor, id_paciente, id_persona, parentesco, documento_legal_url) VALUES
(gen_random_uuid(), 'bb000001-0000-4000-8000-000000000003', 'aa000001-0000-4000-8000-000000000006', 'MADRE', 'https://medsys.blob.core.windows.net/docs/tutoria_mateo_lopez.pdf');

-- ── ANTECEDENTES HEREDOFAMILIARES ────────────────────────────────────────────

INSERT INTO antecedentes_heredofamiliares (id_paciente, diabetes, hipertension, cardiopatia, neoplasia, detalles) VALUES
('bb000001-0000-4000-8000-000000000001', true,  true,  true,  false, 'Padre fallecido por infarto. Madre con DM2 e HTA. Hermano con cardiopatía isquémica.'),
('bb000001-0000-4000-8000-000000000002', false, false, false, false, 'Sin antecedentes familiares relevantes.'),
('bb000001-0000-4000-8000-000000000003', true,  false, false, false, 'Abuelo materno con diabetes tipo 2.'),
('bb000001-0000-4000-8000-000000000004', false, true,  false, true,  'Madre con cáncer de mama. Abuela con hipertensión.'),
('bb000001-0000-4000-8000-000000000005', true,  true,  false, false, 'Ambos padres con DM2. Madre con HTA. Tabaquismo familiar.');

-- ── ANTECEDENTES PATOLÓGICOS ─────────────────────────────────────────────────

INSERT INTO antecedentes_patologicos (id_paciente, enfermedad, fecha_diagnostico, tratamiento_actual) VALUES
('bb000001-0000-4000-8000-000000000001', 'Diabetes mellitus tipo 2',           '2010-06-15', 'Metformina 850mg c/12h, Losartán 50mg c/24h'),
('bb000001-0000-4000-8000-000000000001', 'Hipertensión arterial sistémica',     '2008-03-20', 'Losartán 50mg c/24h, Amlodipino 5mg c/24h'),
('bb000001-0000-4000-8000-000000000005', 'Obesidad grado II',                   '2020-01-10', 'Dieta hipocalórica, actividad física'),
('bb000001-0000-4000-8000-000000000005', 'Hipertensión arterial sistémica',     '2021-05-05', 'Amlodipino 5mg c/24h'),
('bb000001-0000-4000-8000-000000000004', 'Anemia ferropénica',                  '2025-11-20', 'Sulfato ferroso 300mg c/24h');

-- ── ANTECEDENTES NO PATOLÓGICOS ──────────────────────────────────────────────

INSERT INTO antecedentes_no_patologicos (id_paciente, tabaquismo, alcoholismo, drogas, detalles) VALUES
('bb000001-0000-4000-8000-000000000001', true,  true,  false, 'Ex fumador 20 cigarros/día por 25 años. Suspendió hace 5 años. Alcohol ocasional.'),
('bb000001-0000-4000-8000-000000000002', false, false, false, 'Niega tabaquismo, alcoholismo y uso de drogas.'),
('bb000001-0000-4000-8000-000000000003', false, false, false, 'Sin hábitos tóxicos. Actividad física escolar regular.'),
('bb000001-0000-4000-8000-000000000004', false, false, false, 'Sin hábitos tóxicos.'),
('bb000001-0000-4000-8000-000000000005', true,  false, false, 'Fumador activo 10 cigarros/día por 15 años. Sedentarismo.');

-- ── ANTECEDENTES GINECOOBSTÉTRICOS ───────────────────────────────────────────

INSERT INTO antecedentes_ginecoobstetricos (id_paciente, menarca, gestas, paras, cesareas, abortos, fecha_ultima_menstruacion) VALUES
('bb000001-0000-4000-8000-000000000002', 13, 2, 1, 0, 0, '2026-02-01'),
('bb000001-0000-4000-8000-000000000004', 12, 0, 0, 0, 0, '2026-03-15');

-- ── ALERGIAS ─────────────────────────────────────────────────────────────────

INSERT INTO alergias (id_paciente, alergia, severidad, registrado_por, fecha_registro) VALUES
('bb000001-0000-4000-8000-000000000001', 'Penicilina',         'CRITICA',   'b2c3d4e5-f6a7-4b5c-8d9e-0f1a2b3c4d5e', '2026-01-10 08:45:00-06'),
('bb000001-0000-4000-8000-000000000001', 'Sulfonamidas',       'MODERADA',  'b2c3d4e5-f6a7-4b5c-8d9e-0f1a2b3c4d5e', '2026-01-10 08:46:00-06'),
('bb000001-0000-4000-8000-000000000003', 'Polen estacional',   'LEVE',      'c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d', '2026-02-03 10:20:00-06'),
('bb000001-0000-4000-8000-000000000005', 'AINEs (Ibuprofeno)', 'MODERADA',  'c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d', '2026-03-01 08:30:00-06');

-- ── INMUNIZACIONES ───────────────────────────────────────────────────────────

INSERT INTO inmunizaciones (id_paciente, vacuna, fecha_aplicacion, dosis) VALUES
('bb000001-0000-4000-8000-000000000001', 'Influenza',           '2025-10-01', 'Anual'),
('bb000001-0000-4000-8000-000000000001', 'Neumococo 23v',       '2024-06-15', 'Única'),
('bb000001-0000-4000-8000-000000000002', 'Toxoide tetánico',    '2026-01-20', '1ra dosis embarazo'),
('bb000001-0000-4000-8000-000000000002', 'Influenza',           '2026-01-20', 'Anual gestante'),
('bb000001-0000-4000-8000-000000000003', 'SRP (Triple viral)',  '2024-09-04', '2da dosis'),
('bb000001-0000-4000-8000-000000000003', 'VPH',                 '2024-09-04', '1ra dosis'),
('bb000001-0000-4000-8000-000000000004', 'Influenza',           '2025-10-05', 'Anual'),
('bb000001-0000-4000-8000-000000000005', 'Influenza',           '2025-10-10', 'Anual');
