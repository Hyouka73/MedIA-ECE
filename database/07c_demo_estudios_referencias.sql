-- 07c_demo_estudios_referencias.sql
-- UUIDs 100% hexadecimales

-- ═══════════════════════════════════════════════
-- SOLICITUDES DE ESTUDIO
-- ═══════════════════════════════════════════════

INSERT INTO solicitudes_estudio (id_solicitud, id_encuentro, tipo_estudio, descripcion, urgente, indicacion_clinica, id_cie10_relacionado, fecha_solicitud) VALUES
-- Paciente 1: HbA1c
('a1000001-0000-4000-8000-000000000001','ec000001-0000-4000-8000-000000000001','LABORATORIO','Hemoglobina glucosilada HbA1c',false,'Control glucémico en DM2.','E119','2026-03-10 09:40:00-06'),
-- Paciente 1: Perfil lipídico
('a1000001-0000-4000-8000-000000000002','ec000001-0000-4000-8000-000000000001','LABORATORIO','Perfil lipídico completo',false,'Riesgo cardiovascular en diabético hipertenso.','I10','2026-03-10 09:41:00-06'),
-- Paciente 1: BHC seguimiento
('a1000001-0000-4000-8000-000000000003','ec000001-0000-4000-8000-000000000002','LABORATORIO','Biometría hemática + química sanguínea 6 elementos',false,'Seguimiento semestral.','E119','2026-04-14 10:38:00-06'),
-- Paciente 2: Panel prenatal
('a2000001-0000-4000-8000-000000000001','ec000002-0000-4000-8000-000000000001','LABORATORIO','Panel prenatal: BHC, Grupo/Rh, VDRL, VIH, glucosa, EGO',false,'Control prenatal 1er trimestre.','O80','2026-02-05 11:45:00-06'),
-- Paciente 2: USG 1er trimestre
('a2000001-0000-4000-8000-000000000002','ec000002-0000-4000-8000-000000000001','IMAGENOLOGIA','Ultrasonido obstétrico 1er trimestre',false,'Confirmar viabilidad y FPP.','O80','2026-02-05 11:46:00-06'),
-- Paciente 2: USG morfológico
('a2000001-0000-4000-8000-000000000003','ec000002-0000-4000-8000-000000000002','IMAGENOLOGIA','Ultrasonido morfológico fetal 18-22 SDG',false,'Descartar malformaciones estructurales.','O80','2026-03-12 11:43:00-06'),
-- Paciente 4: BHC + perfil de hierro
('a4000001-0000-4000-8000-000000000001','ec000004-0000-4000-8000-000000000001','LABORATORIO','BHC completa + perfil de hierro (Fe sérico, ferritina)',false,'Anemia ferropénica con menorragia.','I10','2026-03-20 10:38:00-06'),
-- Paciente 4: USG pélvico
('a4000001-0000-4000-8000-000000000002','ec000004-0000-4000-8000-000000000001','IMAGENOLOGIA','Ultrasonido pélvico transvaginal',false,'Descartar miomatosis o pólipos uterinos.','I10','2026-03-20 10:39:00-06'),
-- Paciente 5: Perfil lipídico + glucosa
('a5000001-0000-4000-8000-000000000001','ec000005-0000-4000-8000-000000000001','LABORATORIO','Perfil lipídico + glucosa + creatinina',false,'Riesgo cardiovascular alto. HTA con obesidad.','I10','2026-03-05 08:45:00-06'),
-- Paciente 5: Rx tórax
('a5000001-0000-4000-8000-000000000002','ec000005-0000-4000-8000-000000000001','IMAGENOLOGIA','Radiografía de tórax PA y lateral',false,'Descartar cardiomegalia. Dolor torácico.','I10','2026-03-05 08:46:00-06'),
-- Paciente 5: EKG urgente
('a5000001-0000-4000-8000-000000000003','ec000005-0000-4000-8000-000000000002','LABORATORIO','Electrocardiograma 12 derivaciones',true,'Dolor torácico recurrente con disnea. Descartar isquemia.','I10','2026-04-10 08:58:00-06');

-- ═══════════════════════════════════════════════
-- RESULTADOS DE LABORATORIO
-- ═══════════════════════════════════════════════

INSERT INTO resultados_laboratorio (id_resultado, id_solicitud, pdf_url, pdf_hash, fecha_subida, subido_por) VALUES
(gen_random_uuid(),'a1000001-0000-4000-8000-000000000001',
 'https://medsys.blob.core.windows.net/resultados/EXP-TUX-001_HbA1c_20260318.pdf',
 'sha256:a3f5c8d1e7b2094f6a1bc3e58d92f47a01c8b7e4d3a690c1234567890abcdef',
 '2026-03-18 14:00:00-06','c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d'),
(gen_random_uuid(),'a1000001-0000-4000-8000-000000000002',
 'https://medsys.blob.core.windows.net/resultados/EXP-TUX-001_Lipidos_20260318.pdf',
 'sha256:b4e6d9f2a8c31056b2cd4f69e03558b12d9c8f5e4b7a901d2345678901bcdefa',
 '2026-03-18 14:05:00-06','c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d'),
(gen_random_uuid(),'a2000001-0000-4000-8000-000000000001',
 'https://medsys.blob.core.windows.net/resultados/EXP-TUX-002_PanelPrenatal_20260210.pdf',
 'sha256:c5f7e0a3b9d42160c3de5670f1468c23e0d9065fc8b012e3456789012cdefab1',
 '2026-02-10 10:30:00-06','c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d'),
(gen_random_uuid(),'a5000001-0000-4000-8000-000000000001',
 'https://medsys.blob.core.windows.net/resultados/EXP-TUX-004_Lipidos_20260312.pdf',
 'sha256:d6081b4c0e5327f94ef6081625070d34f1e007060d9c123f4567890123defabc',
 '2026-03-12 11:00:00-06','c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d');

-- ═══════════════════════════════════════════════
-- REFERENCIAS MÉDICAS
-- ═══════════════════════════════════════════════

INSERT INTO referencias_medicas (id_referencia, id_encuentro_origen, id_establecimiento_destino, id_especialidad_destino, estado, motivo_referencia, fecha_emision, fecha_respuesta) VALUES
-- Paciente 4 (SCLC) → Ginecología en Tuxtla
('b1000001-0000-4000-8000-000000000001',
 'ec000004-0000-4000-8000-000000000001',
 'e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb',2,'EMITIDA',
 'Anemia ferropénica severa secundaria a menorragia. Valoración ginecológica para sangrado uterino anormal.',
 '2026-03-20 10:39:00-06',NULL),
-- Paciente 2 (Tuxtla) → Hospital SCLC 2do nivel
('b1000001-0000-4000-8000-000000000002',
 'ec000002-0000-4000-8000-000000000002',
 '550e8400-e29b-41d4-a716-446655440000',2,'ACEPTADA',
 'Embarazada 17.4 SDG con edema. Se refiere a 2do nivel para seguimiento obstétrico.',
 '2026-03-12 11:44:00-06','2026-03-13 09:00:00-06'),
-- Paciente 1 (Tuxtla) → Hospital SCLC evaluación cardiovascular
('b1000001-0000-4000-8000-000000000003',
 'ec000001-0000-4000-8000-000000000002',
 '550e8400-e29b-41d4-a716-446655440000',1,'EMITIDA',
 'DM2 e HTA de difícil control. Antecedente familiar de cardiopatía. Evaluación integral cardiovascular.',
 '2026-04-14 10:39:00-06',NULL);

-- ═══════════════════════════════════════════════
-- PERMISOS DE ESPECIALIDAD
-- ═══════════════════════════════════════════════

INSERT INTO permisos_especialidad (id_usuario, id_especialidad) VALUES
('c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d',1),
('c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d',2),
('550e8400-e29b-41d4-a716-446655440002', 1),
('550e8400-e29b-41d4-a716-446655440002', 2)
ON CONFLICT DO NOTHING;
