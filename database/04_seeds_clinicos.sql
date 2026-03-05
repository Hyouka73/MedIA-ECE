-- 04_seeds_clinicos.sql
-- Seeds de Lenguas, CIE-10 (Fragmento representativo) y Medicamentos SSA

-- 1. Catálogo INALI de Lenguas Indígenas de Chiapas
INSERT INTO cat_lenguas_indigenas (id_lengua, nombre, familia) VALUES
(1, 'Tseltal', 'Maya'),
(2, 'Tsotsil', 'Maya'),
(3, 'Ch''ol', 'Maya'),
(4, 'Zoque', 'Mixe-Zoque'),
(5, 'Tojolabal', 'Maya'),
(6, 'Mame', 'Maya'),
(7, 'Lacandón', 'Maya');

-- 2. CIE-10 Fragmento (Nom-024)
INSERT INTO cat_cie10 (codigo_cie, descripcion, codigo_padre) VALUES
('E11', 'Diabetes mellitus no insulinodependiente', NULL),
('E119', 'Diabetes mellitus no insulinodependiente sin mención de complicación', 'E11'),
('I10', 'Hipertensión esencial (primaria)', NULL),
('J00', 'Rinofaringitis aguda (resfriado común)', NULL),
('J02', 'Faringitis aguda', NULL),
('J029', 'Faringitis aguda, no especificada', 'J02'),
('A09', 'Diarrea y gastroenteritis de presunto origen infeccioso', NULL),
('O80', 'Parto único espontáneo', NULL),
('Z00', 'Examen general e investigación de personas sin quejas o diagnósticos informados', NULL);

-- 3. Medicamentos Cuadro Básico SSA (Fragmento)
INSERT INTO cat_medicamentos (codigo_medicamento_ssa, nombre_generico, forma_farmaceutica, presentacion, indicaciones) VALUES
('010.000.0104.00', 'Paracetamol', 'Tableta', 'Envase con 10 tabletas 500 mg.', 'Fiebre y dolor leve a moderado.'),
('010.000.0106.00', 'Paracetamol', 'Supositorio', 'Envase con 3 supositorios 300 mg.', 'Fiebre en pediatría.'),
('010.000.0572.00', 'Acido Acetilsalicilico', 'Tableta soluble', 'Envase con 20 tabletas 300 mg.', 'Dolor leve, antiagregante.'),
('010.000.4106.00', 'Metformina', 'Tableta', 'Envase con 30 tabletas 850 mg.', 'Diabetes mellitus tipo 2.'),
('010.000.2104.00', 'Losartán', 'Gragea o Tableta recubierta', 'Envase con 30 grageas 50 mg.', 'Hipertensión arterial.'),
('010.000.2132.00', 'Amlodipino', 'Tableta o cápsula', 'Envase con 10 tabletas 5 mg.', 'Hipertensión arterial.'),
('010.000.0891.00', 'Amoxicilina', 'Cápsula', 'Envase con 12 cápsulas 500 mg.', 'Infecciones respiratorias bacterianas.'),
('010.000.5165.00', 'Ibuprofeno', 'Tableta', 'Envase con 10 tabletas 400 mg.', 'Dolor moderado e  inflamación.'),
('010.000.0402.00', 'Loratadina', 'Tableta o gragea', 'Envase con 10 tabletas 10 mg.', 'Alergias sistémicas.');
