-- 07b_demo_encuentros_clinicos.sql
-- UUIDs 100% hexadecimales (PostgreSQL UUID formato estricto)

-- IDs de referencia (de 06_seeds_superadmin.sql y 03_seeds_geograficos.sql):
-- Médico A:       c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d
-- Médico B:       550e8400-e29b-41d4-a716-446655440002
-- Enfermera:      e1b2c3d4-f5e6-4a1b-2c3d-4e5f6a7b8c9d
-- CS Tuxtla:      e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb
-- Hospital SCLC:  550e8400-e29b-41d4-a716-446655440000
-- Pacientes:      bb000001-0000-4000-8000-00000000000[1-5]

-- ═══════════════════════════════════════════════
-- ENCUENTROS
-- ═══════════════════════════════════════════════

INSERT INTO encuentros_clinicos (id_encuentro, id_paciente, id_medico, id_establecimiento, id_especialidad, fecha_inicio, fecha_cierre, motivo_consulta) VALUES
-- Paciente 1, Encuentro 1
('ec000001-0000-4000-8000-000000000001','bb000001-0000-4000-8000-000000000001','c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d','e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb',1,'2026-03-10 09:00:00-06','2026-03-10 09:45:00-06','Control mensual de diabetes e hipertensión. Refiere mareos ocasionales al levantarse.'),
-- Paciente 1, Encuentro 2
('ec000001-0000-4000-8000-000000000002','bb000001-0000-4000-8000-000000000001','c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d','e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb',1,'2026-04-14 10:00:00-06','2026-04-14 10:40:00-06','Seguimiento post-ajuste de dosis. Buena tolerancia al medicamento nuevo.'),
-- Paciente 2, Encuentro 1
('ec000002-0000-4000-8000-000000000001','bb000001-0000-4000-8000-000000000002','c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d','e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb',2,'2026-02-05 11:00:00-06','2026-02-05 11:50:00-06','Primera consulta prenatal. FUM: 01/11/2025. SDG 13.4 aprox. Náuseas matutinas.'),
-- Paciente 2, Encuentro 2
('ec000002-0000-4000-8000-000000000002','bb000001-0000-4000-8000-000000000002','c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d','e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb',2,'2026-03-12 11:00:00-06','2026-03-12 11:45:00-06','Control prenatal 2do trimestre. Sin complicaciones referidas.'),
-- Paciente 3, Encuentro 1
('ec000003-0000-4000-8000-000000000001','bb000001-0000-4000-8000-000000000003','c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d','e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb',1,'2026-04-02 09:00:00-06','2026-04-02 09:30:00-06','Fiebre de 38.5°C de 2 días, tos seca y odinofagia. Madre refiere cuadro gripal.'),
-- Paciente 4, Encuentro 1 (Médico B en SCLC)
('ec000004-0000-4000-8000-000000000001','bb000001-0000-4000-8000-000000000004','550e8400-e29b-41d4-a716-446655440002','550e8400-e29b-41d4-a716-446655440000',1,'2026-03-20 10:00:00-06','2026-03-20 10:40:00-06','Cansancio generalizado, palidez y cefalea frecuente. Ciclos menstruales irregulares.'),
-- Paciente 5, Encuentro 1
('ec000005-0000-4000-8000-000000000001','bb000001-0000-4000-8000-000000000005','c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d','e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb',1,'2026-03-05 08:00:00-06','2026-03-05 08:50:00-06','Chequeo general. Dolor en pecho ocasional y disnea de esfuerzo moderado.'),
-- Paciente 5, Encuentro 2
('ec000005-0000-4000-8000-000000000002','bb000001-0000-4000-8000-000000000005','c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d','e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb',1,'2026-04-10 08:30:00-06','2026-04-10 09:00:00-06','Revisión de resultados de laboratorio y seguimiento.');

-- ═══════════════════════════════════════════════
-- SIGNOS VITALES
-- ═══════════════════════════════════════════════

INSERT INTO signos_vitales (id_encuentro, id_enfermero, peso_kg, talla_cm, temperatura_c, frecuencia_cardiaca, frecuencia_respiratoria, presion_sistolica, presion_diastolica, saturacion_oxigeno, fecha_toma) VALUES
('ec000001-0000-4000-8000-000000000001','e1b2c3d4-f5e6-4a1b-2c3d-4e5f6a7b8c9d',88.0,168.0,36.8,78,18,148,92,96,'2026-03-10 08:50:00-06'),
('ec000001-0000-4000-8000-000000000002','e1b2c3d4-f5e6-4a1b-2c3d-4e5f6a7b8c9d',87.5,168.0,36.6,74,17,138,86,97,'2026-04-14 09:50:00-06'),
('ec000002-0000-4000-8000-000000000001','e1b2c3d4-f5e6-4a1b-2c3d-4e5f6a7b8c9d',58.0,155.0,36.4,88,18,105,68,99,'2026-02-05 10:50:00-06'),
('ec000002-0000-4000-8000-000000000002','e1b2c3d4-f5e6-4a1b-2c3d-4e5f6a7b8c9d',61.5,155.0,36.5,84,17,108,70,98,'2026-03-12 10:50:00-06'),
('ec000003-0000-4000-8000-000000000001','e1b2c3d4-f5e6-4a1b-2c3d-4e5f6a7b8c9d',28.0,128.0,38.4,105,24,100,65,97,'2026-04-02 08:50:00-06'),
('ec000004-0000-4000-8000-000000000001','e1b2c3d4-f5e6-4a1b-2c3d-4e5f6a7b8c9d',54.0,158.0,36.2,96,19,100,65,97,'2026-03-20 09:50:00-06'),
('ec000005-0000-4000-8000-000000000001','e1b2c3d4-f5e6-4a1b-2c3d-4e5f6a7b8c9d',102.0,172.0,36.7,82,20,158,98,95,'2026-03-05 07:50:00-06'),
('ec000005-0000-4000-8000-000000000002','e1b2c3d4-f5e6-4a1b-2c3d-4e5f6a7b8c9d',101.0,172.0,36.5,80,18,144,90,96,'2026-04-10 08:20:00-06');

-- ═══════════════════════════════════════════════
-- NOTAS MÉDICAS (IDs hex: f1..f8)
-- ═══════════════════════════════════════════════

INSERT INTO notas_medicas (id_nota, id_encuentro, tipo_nota, esta_firmada, fecha_creacion, fecha_firma) VALUES
('f1000001-0000-4000-8000-000000000001','ec000001-0000-4000-8000-000000000001','EVOLUCION',true, '2026-03-10 09:10:00-06','2026-03-10 09:44:00-06'),
('f1000001-0000-4000-8000-000000000002','ec000001-0000-4000-8000-000000000002','EVOLUCION',false,'2026-04-14 10:05:00-06',NULL),
('f2000001-0000-4000-8000-000000000001','ec000002-0000-4000-8000-000000000001','EVOLUCION',true, '2026-02-05 11:10:00-06','2026-02-05 11:48:00-06'),
('f2000001-0000-4000-8000-000000000002','ec000002-0000-4000-8000-000000000002','EVOLUCION',false,'2026-03-12 11:10:00-06',NULL),
('f3000001-0000-4000-8000-000000000001','ec000003-0000-4000-8000-000000000001','EVOLUCION',true, '2026-04-02 09:05:00-06','2026-04-02 09:28:00-06'),
('f4000001-0000-4000-8000-000000000001','ec000004-0000-4000-8000-000000000001','EVOLUCION',false,'2026-03-20 10:05:00-06',NULL),
('f5000001-0000-4000-8000-000000000001','ec000005-0000-4000-8000-000000000001','EVOLUCION',true, '2026-03-05 08:10:00-06','2026-03-05 08:48:00-06'),
('f5000001-0000-4000-8000-000000000002','ec000005-0000-4000-8000-000000000002','EVOLUCION',false,'2026-04-10 08:35:00-06',NULL);

-- ═══════════════════════════════════════════════
-- NOTAS SOAP DETALLE
-- ═══════════════════════════════════════════════

INSERT INTO notas_soap_detalle (id_nota, subjetivo, objetivo, analisis, plan) VALUES
('f1000001-0000-4000-8000-000000000001',
 'Mareos leves al ponerse de pie. Cumple medicación. Refiere sed excesiva.',
 'TA 148/92. Glucosa capilar 185 mg/dL. Peso 88 kg. Sin edema.',
 'DM2 con control glucémico subóptimo. HTA con respuesta parcial a Losartán.',
 'Ajustar Metformina a 850mg c/8h. Agregar Amlodipino 5mg c/24h. Solicitar HbA1c y perfil lipídico.'),
('f1000001-0000-4000-8000-000000000002',
 'Buena tolerancia. Sin mareos. Cumple dieta. Mejor control tensional.',
 'TA 138/86. Glucosa 158 mg/dL. Peso 87.5 kg. HbA1c 7.8%.',
 'DM2 con mejoría en control metabólico. HTA en mejoría.',
 'Continuar esquema. Reforzar dieta hiposódica. Cita en 4 semanas.'),
('f2000001-0000-4000-8000-000000000001',
 'Primigesta 27 años. FUM 01/11/2025. Náuseas matutinas moderadas. Sin sangrado.',
 'TA 105/68. Peso 58 kg. USG obstétrico pendiente.',
 'Embarazo de 13.4 SDG. Riesgo bajo. Náuseas del primer trimestre.',
 'Ácido fólico 5mg/día. Sulfato ferroso 300mg/día. Solicitar USG y labs prenatales.'),
('f2000001-0000-4000-8000-000000000002',
 'Movimientos fetales percibidos. Sin dolor. Náuseas resueltas.',
 'TA 108/70. Peso 61.5 kg. AU 20 cm. FCF 148 lpm. Edema leve en tobillos.',
 'Embarazo 17.4 SDG sin complicaciones. Edema fisiológico.',
 'Continuar hierro y ácido fólico. Solicitar USG morfológico. Cita en 3 semanas.'),
('f3000001-0000-4000-8000-000000000001',
 'Fiebre 38.5°C 2 días. Tos seca, odinofagia leve. Sin dificultad respiratoria.',
 'Temp 38.4°C. FC 105. FR 24. SatO2 97%. Faringe hiperémica sin exudado.',
 'Faringitis aguda viral. Sin sobreinfección bacteriana.',
 'Paracetamol 15mg/kg c/6h por 3 días si fiebre. Hidratación. Reposo escolar 48h.'),
('f4000001-0000-4000-8000-000000000001',
 'Cansancio 3 meses, cefalea frecuente, palidez progresiva. Ciclos menstruales 8-10 días abundantes.',
 'Palidez de conjuntivas ++. FC 96. TA 100/65. Hb 8.2 g/dL previo. Peso 54 kg.',
 'Anemia ferropénica por pérdidas menstruales. Menorragia probable.',
 'Reforzar sulfato ferroso. BHC completa, perfil de hierro, USG pélvico. Referir a Ginecología.'),
('f5000001-0000-4000-8000-000000000001',
 'Dolor torácico opresivo ocasional EVA 4/10. Disnea con caminata rápida. Fumador activo.',
 'TA 158/98. Peso 102 kg. IMC 34.5. FC 82. SatO2 95%. Sin edema.',
 'HTA no controlada. Obesidad grado II. Riesgo cardiovascular alto.',
 'Amlodipino 5mg c/24h. Solicitar EKG, Rx tórax, perfil lipídico. Cese tabáquico urgente.'),
('f5000001-0000-4000-8000-000000000002',
 'Mejoría en tensión arterial. Redujo tabaquismo. Sin dolor torácico en 2 semanas.',
 'TA 144/90. Peso 101 kg. Colesterol 218, TG 195, Glucosa 98. EKG sin alteraciones.',
 'HTA en mejoría parcial. Dislipidemia mixta. Sin cardiopatía isquémica.',
 'Amlodipino 10mg c/24h. Plan dietético hipocalórico. Cita mensual.');

-- ═══════════════════════════════════════════════
-- DIAGNÓSTICOS
-- ═══════════════════════════════════════════════

INSERT INTO diagnosticos_encuentro (id_encuentro, codigo_cie, tipo, observaciones) VALUES
('ec000001-0000-4000-8000-000000000001','E119','DEFINITIVO','DM2 con control subóptimo.'),
('ec000001-0000-4000-8000-000000000001','I10', 'DEFINITIVO','HTA con respuesta parcial.'),
('ec000001-0000-4000-8000-000000000002','E119','DEFINITIVO','DM2 en mejoría. HbA1c 7.8%.'),
('ec000001-0000-4000-8000-000000000002','I10', 'DEFINITIVO','HTA en mejoría.'),
('ec000002-0000-4000-8000-000000000001','O80', 'PRESUNTIVO','Embarazo único primer trimestre.'),
('ec000002-0000-4000-8000-000000000002','O80', 'DEFINITIVO','Embarazo 17.4 SDG en evolución normal.'),
('ec000003-0000-4000-8000-000000000001','J029','DEFINITIVO','Faringitis aguda viral pediátrica.'),
('ec000004-0000-4000-8000-000000000001','I10', 'PRESUNTIVO','Hipotensión secundaria a anemia.'),
('ec000005-0000-4000-8000-000000000001','I10', 'DEFINITIVO','HTA con riesgo cardiovascular alto.'),
('ec000005-0000-4000-8000-000000000002','I10', 'DEFINITIVO','HTA en mejoría. Dislipidemia mixta.');

-- ═══════════════════════════════════════════════
-- PRESCRIPCIONES
-- ═══════════════════════════════════════════════

INSERT INTO prescripciones (id_encuentro, codigo_medicamento_ssa, indicacion_dosis, duracion_dias, cantidad_surtir) VALUES
('ec000001-0000-4000-8000-000000000001','010.000.4106.00','Metformina 850mg cada 8 horas con alimentos',30,90),
('ec000001-0000-4000-8000-000000000001','010.000.2104.00','Losartán 50mg cada 24 horas por la mañana',30,30),
('ec000001-0000-4000-8000-000000000001','010.000.2132.00','Amlodipino 5mg cada 24 horas por la noche',30,30),
('ec000001-0000-4000-8000-000000000002','010.000.4106.00','Metformina 850mg continuar esquema 3 veces al día',30,90),
('ec000001-0000-4000-8000-000000000002','010.000.2132.00','Amlodipino 5mg continuar 1 tableta nocturna',30,30),
('ec000003-0000-4000-8000-000000000001','010.000.0104.00','Paracetamol 500mg: mitad de tableta c/6h si fiebre >38°C',3,5),
('ec000005-0000-4000-8000-000000000001','010.000.2132.00','Amlodipino 5mg cada 24 horas por la mañana',35,35),
('ec000005-0000-4000-8000-000000000002','010.000.2132.00','Amlodipino 10mg cada 24 horas (dosis ajustada)',30,30);

-- ═══════════════════════════════════════════════
-- NOTA DE ENMIENDA (nota firmada del Paciente 1)
-- ═══════════════════════════════════════════════

INSERT INTO notas_enmienda (id_enmienda, id_nota, texto_correccion, id_medico, fecha_enmienda) VALUES
(gen_random_uuid(),
 'f1000001-0000-4000-8000-000000000001',
 'Corrección: La dosis de Metformina es 850mg cada 8h. Total diario: 2550mg, no 1700mg como se registró.',
 'c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d',
 '2026-03-11 08:00:00-06');
