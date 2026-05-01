-- reset_demo.sql
-- Script de limpieza para ensayos de demo (MedSys ECE)
-- Propósito: Eliminar registros transaccionales para reiniciar el flujo de atención clínica.
-- Preserva: Usuarios, Personas, Pacientes y Catálogos institucionales.
-- Cumplimiento: NOM-151 e Integridad Forense (Se recomienda respaldar auditoria_accesos antes de ejecutar).

BEGIN;

-- 1. Limpiar Dominio de Consulta (Encuentros y derivados)
TRUNCATE TABLE prescripciones CASCADE;
TRUNCATE TABLE diagnosticos_encuentro CASCADE;
TRUNCATE TABLE notas_enmienda CASCADE;
TRUNCATE TABLE notas_soap_detalle CASCADE;
TRUNCATE TABLE notas_medicas CASCADE;
TRUNCATE TABLE signos_vitales CASCADE;
TRUNCATE TABLE referencias_medicas CASCADE;
TRUNCATE TABLE solicitudes_estudio CASCADE;
TRUNCATE TABLE resultados_laboratorio CASCADE;
TRUNCATE TABLE encuentros_clinicos CASCADE;

-- 2. Limpiar Dominio de Expediente (Opcional, según requerimiento de "Sustancia")
-- Si se desea mantener los antecedentes del "PACIENTE DE PRUEBA", comentar estas líneas.
TRUNCATE TABLE antecedentes_heredofamiliares CASCADE;
TRUNCATE TABLE antecedentes_patologicos CASCADE;
TRUNCATE TABLE antecedentes_no_patologicos CASCADE;
TRUNCATE TABLE antecedentes_ginecoobstetricos CASCADE;
TRUNCATE TABLE inmunizaciones CASCADE;
-- TRUNCATE TABLE alergias CASCADE; -- Generalmente se conservan como parte del perfil del paciente

-- 3. Limpiar Bitácoras Forenses (Solo si se requiere un estado 0 absoluto en auditoría)
-- ADVERTENCIA: Esto borra la evidencia de accesos previos.
TRUNCATE TABLE auditoria_accesos CASCADE;
TRUNCATE TABLE incidentes_seguridad CASCADE;
TRUNCATE TABLE historial_cambios CASCADE;

COMMIT;

-- Mensaje de Verificación
-- SELECT 'Reset completo. Sistema listo para nueva demostración clínica.' as status;
