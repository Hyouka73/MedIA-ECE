-- 02_triggers.sql
-- Triggers de auditoria e inmutabilidad y Vistas de acceso seguro
-- NOM-004-SSA3-2012 y Requerimientos de Cómputo Forense

-- ==========================================
-- 1. Inmutabilidad de Bitácora de Auditoría
-- ==========================================
CREATE OR REPLACE FUNCTION fn_audit_no_changes()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Violación Forense: No se permite modificar ni eliminar registros de la bitácora de accesos.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_audit_no_changes
BEFORE UPDATE OR DELETE ON auditoria_accesos
FOR EACH ROW EXECUTE FUNCTION fn_audit_no_changes();

-- ==========================================
-- 2. Bloqueo de Notas Clínicas Firmadas
-- ==========================================
CREATE OR REPLACE FUNCTION fn_notes_protection()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la nota ya estaba firmada antes del UPDATE, no dejar modificar
    IF OLD.esta_firmada = TRUE THEN
        RAISE EXCEPTION 'Cumplimiento NOM-004: Una nota firmada es inmutable. Use notas_enmienda para correcciones.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_notes_protection
BEFORE UPDATE ON notas_medicas
FOR EACH ROW EXECUTE FUNCTION fn_notes_protection();

-- ==========================================
-- 3. Historial Genérico de Cambios Clínicos
-- ==========================================
CREATE OR REPLACE FUNCTION fn_registrar_cambio()
RETURNS TRIGGER AS $$
DECLARE
    columna record;
    v_id UUID;
    v_user_id UUID;
    _ boolean;
BEGIN
    -- Determinar el ID del registro según la tabla (Req 6 Forense)
    CASE TG_TABLE_NAME
        WHEN 'pacientes' THEN v_id := NEW.id_paciente;
        WHEN 'personas' THEN v_id := NEW.id_persona;
        WHEN 'alergias' THEN v_id := NEW.id_alergia;
        WHEN 'antecedentes_heredofamiliares' THEN v_id := NEW.id_ahf;
        WHEN 'antecedentes_patologicos' THEN v_id := NEW.id_ap;
        WHEN 'antecedentes_no_patologicos' THEN v_id := NEW.id_anp;
        WHEN 'antecedentes_ginecoobstetricos' THEN v_id := NEW.id_ago;
        WHEN 'inmunizaciones' THEN v_id := NEW.id_inmunizacion;
        ELSE v_id := gen_random_uuid();
    END CASE;
    
    -- Obtener ID del usuario del contexto de la sesión (seteado por el app)
    BEGIN
        v_user_id := (SELECT id_usuario FROM current_setting('myapp.current_user', true))::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    FOR columna IN SELECT column_name FROM information_schema.columns WHERE table_name = TG_TABLE_NAME AND table_schema = TG_TABLE_SCHEMA
    LOOP
        -- Evitar columnas de ID PK para la comparativa de cambios o columnas irrelevantes
        IF columna.column_name IN ('id_paciente', 'id_persona', 'id_alergia', 'id_ahf', 'id_ap', 'id_anp', 'id_ago', 'id_inmunizacion', 'url_foto', 'fecha_registro') THEN
            CONTINUE;
        END IF;

        EXECUTE format('SELECT ($1).%I IS DISTINCT FROM ($2).%I', columna.column_name, columna.column_name)
        INTO STRICT _
        USING OLD, NEW;
        
        IF _ THEN
            EXECUTE format('INSERT INTO historial_cambios (tabla_afectada, registro_id, id_usuario, campo_modificado, valor_anterior, valor_nuevo)
            VALUES ($1, $2, $3, $4, ($5).%I::text, ($6).%I::text)', 
            columna.column_name, columna.column_name)
            USING TG_TABLE_NAME, v_id, v_user_id, columna.column_name, OLD, NEW;
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Req 6 Forense: Activar historial de cambios en tablas clínicas
CREATE TRIGGER tr_hist_pacientes AFTER UPDATE ON pacientes FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio();
CREATE TRIGGER tr_hist_personas AFTER UPDATE ON personas FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio();
CREATE TRIGGER tr_hist_alergias AFTER UPDATE ON alergias FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio();
CREATE TRIGGER tr_hist_ant_heredofam AFTER UPDATE ON antecedentes_heredofamiliares FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio();
CREATE TRIGGER tr_hist_ant_patologicos AFTER UPDATE ON antecedentes_patologicos FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio();
CREATE TRIGGER tr_hist_ant_no_patologicos AFTER UPDATE ON antecedentes_no_patologicos FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio();
CREATE TRIGGER tr_hist_ant_ginecoobs AFTER UPDATE ON antecedentes_ginecoobstetricos FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio();
CREATE TRIGGER tr_hist_inmunizaciones AFTER UPDATE ON inmunizaciones FOR EACH ROW EXECUTE FUNCTION fn_registrar_cambio();

-- ==========================================
-- 4. Bloqueo por Intentos Fallidos
-- ==========================================
CREATE OR REPLACE FUNCTION fn_bloqueo_por_intentos()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.intentos_fallidos >= 5 THEN
        -- Bloqueo de 30 minutos
        NEW.bloqueado_hasta = CURRENT_TIMESTAMP + INTERVAL '30 minutes';
        NEW.intentos_fallidos = 0; -- Reiniciar contador después de aplicar el castigo
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_bloqueo_por_intentos
BEFORE UPDATE ON usuarios_sistema
FOR EACH ROW EXECUTE FUNCTION fn_bloqueo_por_intentos();

-- ==========================================
-- 5. Alerta de Incidente Crítico
-- ==========================================
CREATE OR REPLACE FUNCTION fn_alerta_incidente_critico()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nivel_severidad IN ('CRITICO', 'ALTO') THEN
        INSERT INTO incidentes_seguridad (id_auditoria, estado)
        VALUES (NEW.id_auditoria, 'NUEVO');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_alerta_incidente_critico
AFTER INSERT ON auditoria_accesos
FOR EACH ROW EXECUTE FUNCTION fn_alerta_incidente_critico();

-- ==========================================
-- 6. Registro Forense de Borrado Lógico
-- ==========================================
CREATE OR REPLACE FUNCTION fn_registro_borrado_logico()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.eliminado_en IS NOT NULL AND OLD.eliminado_en IS NULL THEN
        INSERT INTO auditoria_accesos (direccion_ip, modulo_funcion, tipo_evento, resultado, nivel_severidad, detalles)
        VALUES (
            '127.0.0.1', 
            TG_TABLE_NAME, 
            'BORRADO_LOGICO', 
            'EXITOSO', 
            'ALTO', 
            jsonb_build_object('registro_afectado', NEW)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_registro_borrado_pacientes
AFTER UPDATE ON pacientes
FOR EACH ROW EXECUTE FUNCTION fn_registro_borrado_logico();


-- ==========================================
-- VISTAS SQL REQUERIDAS (Doc3/ReporteBD)
-- ==========================================

-- A. v_paciente_basico: Datos desensibilizados para búsquedas
CREATE VIEW v_paciente_basico AS 
SELECT 
    p.numero_expediente,
    per.nombre, 
    per.primer_apellido, 
    per.curp, 
    EXTRACT(YEAR FROM age(per.fecha_nacimiento)) as edad
FROM pacientes p
JOIN personas per ON p.id_persona = per.id_persona
WHERE p.eliminado_en IS NULL;

-- B. v_signos_encuentro: Para que el rol Enfermería no vea SOAP sensible
CREATE VIEW v_signos_encuentro AS
SELECT
    sv.id_signos,
    sv.id_encuentro,
    sv.fecha_toma,
    sv.peso_kg,
    sv.presion_sistolica,
    sv.presion_diastolica,
    e.fecha_inicio AS fecha_encuentro,
    e.motivo_consulta
FROM signos_vitales sv
JOIN encuentros_clinicos e ON sv.id_encuentro = e.id_encuentro;

-- C. v_auditoria_estadistica: Para dashboard de Auditor SIN revelar nombres
CREATE VIEW v_auditoria_estadistica AS
SELECT 
    DATE(timestamp_evento) as fecha,
    nivel_severidad,
    tipo_evento,
    COUNT(*) as total_eventos
FROM auditoria_accesos
GROUP BY fecha, nivel_severidad, tipo_evento;
