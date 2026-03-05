-- 05_seeds_sistema.sql
-- Seeds de modulos, roles, especialidades y permisos_rol

-- 1. Modulos del Sistema
INSERT INTO cat_modulos (id_modulo, codigo, nombre, descripcion) VALUES
(1, 'PACIENTES', 'Gestión de Pacientes', 'Registro e identidad demográfica de pacientes y tutor/representante (sin datos clínicos).'),
(2, 'EXPEDIENTE', 'Expediente Clínico', 'Antecedentes, alergias, e inmunizaciones históricas.'),
(3, 'ENCUENTROS', 'Encuentros y Consulta', 'Notas SOAP, signos vitales, diagnósticos y referencias médicas activas.'),
(4, 'ESTUDIOS', 'Laboratorio y Gabinete', 'Solicitudes y resultados en PDF de exámenes externos.'),
(5, 'FARMACIA', 'Prescripción Electrónica', 'Prescripción de medicamentos con vinculación al cuadro básico SSA.'),
(6, 'ADMIN', 'Administración', 'Gestión de establecimientos del Distrito, catálogos geográficos, personal médico.'),
(7, 'AUDITORIA', 'Auditoría y Seguridad', 'Monitorización inmutable de accesos según requisitos de Cómputo Forense.');


-- 2. Roles del Sistema (Basados en Situación Real Operativa - Chiapas)
INSERT INTO roles (id_rol, codigo, nombre, descripcion) VALUES
(1, 'SUPERADMIN', 'Super Administrador', 'Control total técnico del sistema. Asigna administradores de distrito.'),
(2, 'ADMINISTRADOR', 'Administrador de Distrito', 'Gestión de cuentas de médicos, altas/bajas en su jurisdicción. No ve datos clínicos.'),
(3, 'RECEPCIONISTA', 'Recepcionista / Trabajo Social', 'Busca e inscribe nuevos pacientes al sistema desde la sala de espera. No entra al SOAP.'),
(4, 'ENFERMERIA', 'Personal de Enfermería', 'Toma de constantes (signos vitales) previos a la consulta. Sin acceso al SOAP, ni diagnósticos.'),
(5, 'MEDICO_GENERAL', 'Médico General', 'Atención de primer contacto en unidad médica. Búsqueda de pacientes, notas evolutivas, referencia a especialista.'),
(6, 'ESPECIALISTA', 'Médico Especialista', 'Atención referida con filtros de visibilidad cruzada por especialidad.'),
(7, 'AUDITOR_SEGURIDAD', 'Auditor de Cómputo Forense', 'Lectura de bitácora y gestión de incidentes cibernéticos. Cero acceso a contenido clínico (sin nombres).'),
(8, 'ESTADISTICA', 'Estadística y Archivo', 'Personal que emite reportes anonimizados para SUIVE (SSA).'),
(9, 'OMNIADMIN', 'Omni Administrador', 'Acceso total a todos los módulos y funciones del sistema sin restricciones.');

-- 4. Matriz de Permisos por Rol (RBAC Realista)
-- Rol 9: OMNIADMIN (Acceso total)
INSERT INTO permisos_rol (id_rol, id_modulo, puede_leer, puede_crear, puede_editar, puede_eliminar)
SELECT 9, id_modulo, true, true, true, true FROM cat_modulos;
-- Rol 1: SUPERADMIN (Todo menos ver datos clínicos por defecto en UI)
INSERT INTO permisos_rol (id_rol, id_modulo, puede_leer, puede_crear, puede_editar, puede_eliminar) VALUES
(1, 6, true, true, true, true), -- Admin total
(1, 7, true, true, true, false); -- Auditoria

-- Rol 2: ADMINISTRADOR
INSERT INTO permisos_rol (id_rol, id_modulo, puede_leer, puede_crear, puede_editar, puede_eliminar) VALUES
(2, 6, true, true, true, false);

-- Rol 3: RECEPCIONISTA (El registro de pacientes ahora es su dominio)
INSERT INTO permisos_rol (id_rol, id_modulo, puede_leer, puede_crear, puede_editar, puede_eliminar) VALUES
(3, 1, true, true, true, false); -- Puede registrar personas y convertirlas a pacientes

-- Rol 4: ENFERMERIA
INSERT INTO permisos_rol (id_rol, id_modulo, puede_leer, puede_crear, puede_editar, puede_eliminar) VALUES
(4, 1, true, false, false, false), -- Solo busca paciente para identificarlo
(4, 3, true, true, true, false);   -- Puede crear signos vitales en el encuentro, no cierra ni elabora SOAP

-- Rol 5: MEDICO_GENERAL
INSERT INTO permisos_rol (id_rol, id_modulo, puede_leer, puede_crear, puede_editar, puede_eliminar) VALUES
(5, 1, true, false, true, false), -- NO crea pacientes (lo hace recepcionista), pero sí puede actualizar demografía si es errónea
(5, 2, true, true, true, false),  -- Edita expedientes/historial
(5, 3, true, true, true, false),  -- Crea encuentros y notas SOAP
(5, 4, true, true, true, false),  -- Puede solicitar estudios y visualizar PDFs
(5, 5, true, true, true, false);  -- Receta medicamentos

-- Rol 6: ESPECIALISTA
INSERT INTO permisos_rol (id_rol, id_modulo, puede_leer, puede_crear, puede_editar, puede_eliminar) VALUES
(6, 1, true, false, false, false), 
(6, 2, true, true, true, false),
(6, 3, true, true, true, false),
(6, 4, true, true, false, false),
(6, 5, true, true, true, false);

-- Rol 7: AUDITOR_SEGURIDAD
INSERT INTO permisos_rol (id_rol, id_modulo, puede_leer, puede_crear, puede_editar, puede_eliminar) VALUES
(7, 7, true, true, true, false); -- Control total sobre auditoría, sin ver expedientes

-- Rol 8: ESTADISTICA
INSERT INTO permisos_rol (id_rol, id_modulo, puede_leer, puede_crear, puede_editar, puede_eliminar) VALUES
(8, 1, true, false, false, false); -- Lectura anonimizada gestionada por la app externa
