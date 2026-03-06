-- 01_schema.sql
-- MedIA ECE
-- Esquema principal de la base de datos (40 Entidades)
-- NOM-004-SSA3-2012 y Cómputo Forense garantizados



-- ==========================================
-- DOMINIO 1: Geografía y Catálogos INEGI / Clínicos
-- ==========================================

CREATE TABLE cat_estados (
    id_estado VARCHAR(2) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE cat_municipios (
    id_municipio VARCHAR(5) PRIMARY KEY, -- Clave INEGI conjunta (estado+mun)
    id_estado VARCHAR(2) REFERENCES cat_estados(id_estado) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE cat_localidades (
    id_localidad VARCHAR(9) PRIMARY KEY, -- Clave INEGI conjunta
    id_municipio VARCHAR(5) REFERENCES cat_municipios(id_municipio) ON DELETE RESTRICT,
    nombre VARCHAR(150) NOT NULL,
    ambito VARCHAR(20) -- Urbano, Rural
);

CREATE TABLE cat_lenguas_indigenas (
    id_lengua SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    familia VARCHAR(100)
);

CREATE TABLE cat_cie10 (
    codigo_cie VARCHAR(10) PRIMARY KEY,
    descripcion TEXT NOT NULL,
    codigo_padre VARCHAR(10) REFERENCES cat_cie10(codigo_cie) ON DELETE RESTRICT
);

CREATE TABLE cat_medicamentos (
    codigo_medicamento_ssa VARCHAR(20) PRIMARY KEY,
    nombre_generico TEXT NOT NULL,
    forma_farmaceutica TEXT NOT NULL,
    presentacion TEXT,
    indicaciones TEXT
);

CREATE TABLE cat_especialidades_medicas (
    id_especialidad SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE cat_modulos (
    id_modulo SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- ==========================================
-- DOMINIO 2: Identidad Base y Usuarios (RBAC)
-- ==========================================

CREATE TABLE personas (
    id_persona UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    primer_apellido VARCHAR(100) NOT NULL,
    segundo_apellido VARCHAR(100),
    curp VARCHAR(18) UNIQUE, -- NULL permitido (Poblaciones vulnerables Chiapas)
    fecha_nacimiento DATE NOT NULL,
    sexo CHAR(1) CHECK (sexo IN ('M', 'F', 'X')),
    id_localidad VARCHAR(9) REFERENCES cat_localidades(id_localidad) ON DELETE RESTRICT,
    calle_numero TEXT,
    referencia_geografica TEXT,
    id_lengua_materna INT REFERENCES cat_lenguas_indigenas(id_lengua) ON DELETE RESTRICT,
    telefono VARCHAR(20),
    fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL, -- e.g. MEDICO_GENERAL, RECEPCIONISTA
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE usuarios_sistema (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_persona UUID REFERENCES personas(id_persona) ON DELETE RESTRICT,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT REFERENCES roles(id_rol) ON DELETE RESTRICT,
    cedula_profesional VARCHAR(20),
    totp_secret VARCHAR(255),
    requires_2fa BOOLEAN DEFAULT TRUE,
    intentos_fallidos INT DEFAULT 0,
    bloqueado_hasta TIMESTAMPTZ,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMPTZ
);

CREATE TABLE permisos_rol (
    id_rol INT REFERENCES roles(id_rol) ON DELETE CASCADE,
    id_modulo INT REFERENCES cat_modulos(id_modulo) ON DELETE CASCADE,
    puede_leer BOOLEAN DEFAULT FALSE,
    puede_crear BOOLEAN DEFAULT FALSE,
    puede_editar BOOLEAN DEFAULT FALSE,
    puede_eliminar BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id_rol, id_modulo)
);

-- ==========================================
-- DOMINIO 3: Red Asistencial (Establecimientos)
-- ==========================================

CREATE TABLE jurisdicciones_sanitarias (
    id_jurisdiccion SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    num_jurisdiccion INT UNIQUE NOT NULL
);

CREATE TABLE establecimientos (
    id_establecimiento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clues VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    id_jurisdiccion INT REFERENCES jurisdicciones_sanitarias(id_jurisdiccion) ON DELETE RESTRICT,
    id_localidad VARCHAR(9) REFERENCES cat_localidades(id_localidad) ON DELETE RESTRICT,
    nivel_atencion INT CHECK (nivel_atencion IN (1, 2, 3))
);

CREATE TABLE usuarios_establecimientos (
    id_usuario UUID REFERENCES usuarios_sistema(id_usuario) ON DELETE CASCADE,
    id_establecimiento UUID REFERENCES establecimientos(id_establecimiento) ON DELETE CASCADE,
    es_principal BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id_usuario, id_establecimiento)
);

CREATE TABLE establecimientos_especialidades (
    id_establecimiento UUID REFERENCES establecimientos(id_establecimiento) ON DELETE CASCADE,
    id_especialidad INT REFERENCES cat_especialidades_medicas(id_especialidad) ON DELETE CASCADE,
    activa BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id_establecimiento, id_especialidad)
);

CREATE TABLE permisos_especialidad (
    id_usuario UUID REFERENCES usuarios_sistema(id_usuario) ON DELETE CASCADE,
    id_especialidad INT REFERENCES cat_especialidades_medicas(id_especialidad) ON DELETE CASCADE,
    PRIMARY KEY (id_usuario, id_especialidad)
);

-- ==========================================
-- DOMINIO 4: Paciente y Antecedentes
-- ==========================================

CREATE TABLE pacientes (
    id_paciente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_persona UUID REFERENCES personas(id_persona) ON DELETE RESTRICT UNIQUE,
    numero_expediente VARCHAR(50) UNIQUE NOT NULL, -- EXP-YYYY-SEQ
    grupo_sanguineo VARCHAR(5),
    fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    eliminado_en TIMESTAMPTZ,
    eliminado_por UUID REFERENCES usuarios_sistema(id_usuario) ON DELETE RESTRICT,
    motivo_baja TEXT
);

CREATE TABLE pacientes_tutores_representantes (
    id_tutor UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente UUID REFERENCES pacientes(id_paciente) ON DELETE CASCADE,
    id_persona UUID REFERENCES personas(id_persona) ON DELETE RESTRICT,
    parentesco VARCHAR(50) NOT NULL,
    documento_legal_url TEXT -- URL Azure Blob a documento
);

CREATE TABLE alergias (
    id_alergia UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente UUID REFERENCES pacientes(id_paciente) ON DELETE CASCADE,
    alergia TEXT NOT NULL,
    severidad VARCHAR(20) CHECK (severidad IN ('LEVE', 'MODERADA', 'CRITICA')),
    registrado_por UUID REFERENCES usuarios_sistema(id_usuario) ON DELETE RESTRICT,
    fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    eliminado_en TIMESTAMPTZ,
    eliminado_por UUID REFERENCES usuarios_sistema(id_usuario) ON DELETE RESTRICT
);

-- Tablas de Antecedentes (Simplificadas para DDL)
CREATE TABLE antecedentes_heredofamiliares (
    id_ahf UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente UUID REFERENCES pacientes(id_paciente) ON DELETE CASCADE,
    diabetes BOOLEAN DEFAULT FALSE,
    hipertension BOOLEAN DEFAULT FALSE,
    cardiopatia BOOLEAN DEFAULT FALSE,
    neoplasia BOOLEAN DEFAULT FALSE,
    detalles TEXT,
    eliminado_en TIMESTAMPTZ,
    eliminado_por UUID
);

CREATE TABLE antecedentes_patologicos (
    id_ap UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente UUID REFERENCES pacientes(id_paciente) ON DELETE CASCADE,
    enfermedad VARCHAR(200) NOT NULL,
    fecha_diagnostico DATE,
    tratamiento_actual TEXT,
    eliminado_en TIMESTAMPTZ,
    eliminado_por UUID
);

CREATE TABLE antecedentes_no_patologicos (
    id_anp UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente UUID REFERENCES pacientes(id_paciente) ON DELETE CASCADE,
    tabaquismo BOOLEAN DEFAULT FALSE,
    alcoholismo BOOLEAN DEFAULT FALSE,
    drogas BOOLEAN DEFAULT FALSE,
    detalles TEXT,
    eliminado_en TIMESTAMPTZ,
    eliminado_por UUID
);

CREATE TABLE antecedentes_ginecoobstetricos (
    id_ago UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente UUID REFERENCES pacientes(id_paciente) ON DELETE CASCADE,
    menarca INT,
    gestas INT DEFAULT 0,
    paras INT DEFAULT 0,
    cesareas INT DEFAULT 0,
    abortos INT DEFAULT 0,
    fecha_ultima_menstruacion DATE,
    eliminado_en TIMESTAMPTZ,
    eliminado_por UUID
);

CREATE TABLE inmunizaciones (
    id_inmunizacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente UUID REFERENCES pacientes(id_paciente) ON DELETE CASCADE,
    vacuna VARCHAR(100) NOT NULL,
    fecha_aplicacion DATE,
    dosis VARCHAR(50),
    eliminado_en TIMESTAMPTZ,
    eliminado_por UUID
);

-- ==========================================
-- DOMINIO 5: Núcleo del Acto Médico (Consulta)
-- ==========================================

CREATE TABLE encuentros_clinicos (
    id_encuentro UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente UUID REFERENCES pacientes(id_paciente) ON DELETE RESTRICT,
    id_medico UUID REFERENCES usuarios_sistema(id_usuario) ON DELETE RESTRICT,
    id_establecimiento UUID REFERENCES establecimientos(id_establecimiento) ON DELETE RESTRICT,
    id_especialidad INT REFERENCES cat_especialidades_medicas(id_especialidad) ON DELETE RESTRICT,
    fecha_inicio TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,  -- NOM-004
    fecha_cierre TIMESTAMPTZ,
    motivo_consulta TEXT NOT NULL
);

CREATE TABLE referencias_medicas (
    id_referencia UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_encuentro_origen UUID REFERENCES encuentros_clinicos(id_encuentro) ON DELETE RESTRICT,
    id_establecimiento_destino UUID REFERENCES establecimientos(id_establecimiento) ON DELETE RESTRICT,
    id_especialidad_destino INT REFERENCES cat_especialidades_medicas(id_especialidad) ON DELETE RESTRICT,
    estado VARCHAR(20) CHECK (estado IN ('EMITIDA', 'ACEPTADA', 'RECHAZADA', 'ATENDIDA')),
    motivo_referencia TEXT NOT NULL,
    fecha_emision TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMPTZ
);

CREATE TABLE signos_vitales (
    id_signos UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_encuentro UUID REFERENCES encuentros_clinicos(id_encuentro) ON DELETE CASCADE,
    id_enfermero UUID REFERENCES usuarios_sistema(id_usuario) ON DELETE RESTRICT,
    peso_kg DECIMAL(5,2),
    talla_cm DECIMAL(5,2),
    temperatura_c DECIMAL(4,2),
    frecuencia_cardiaca INT,
    frecuencia_respiratoria INT,
    presion_sistolica INT,
    presion_diastolica INT,
    saturacion_oxigeno INT,
    fecha_toma TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notas_medicas (
    id_nota UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_encuentro UUID REFERENCES encuentros_clinicos(id_encuentro) ON DELETE CASCADE,
    tipo_nota VARCHAR(50) NOT NULL, -- EVOLUCION, INGRESO, REFERENCIA
    esta_firmada BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fecha_firma TIMESTAMPTZ,
    pdf_hash VARCHAR(255) -- Hash SHA256 para integridad
);

CREATE TABLE notas_soap_detalle (
    id_nota UUID PRIMARY KEY REFERENCES notas_medicas(id_nota) ON DELETE CASCADE,
    subjetivo TEXT,
    objetivo TEXT,
    analisis TEXT,
    plan TEXT
);

CREATE TABLE notas_enmienda (
    id_enmienda UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_nota UUID REFERENCES notas_medicas(id_nota) ON DELETE RESTRICT,
    texto_correccion TEXT NOT NULL,
    id_medico UUID REFERENCES usuarios_sistema(id_usuario) ON DELETE RESTRICT,
    fecha_enmienda TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE diagnosticos_encuentro (
    id_diagnostico UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_encuentro UUID REFERENCES encuentros_clinicos(id_encuentro) ON DELETE CASCADE,
    codigo_cie VARCHAR(10) REFERENCES cat_cie10(codigo_cie) ON DELETE RESTRICT,
    tipo VARCHAR(20) CHECK (tipo IN ('PRESUNTIVO', 'DEFINITIVO')),
    observaciones TEXT
);

CREATE TABLE prescripciones (
    id_prescripcion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_encuentro UUID REFERENCES encuentros_clinicos(id_encuentro) ON DELETE CASCADE,
    codigo_medicamento_ssa VARCHAR(20) REFERENCES cat_medicamentos(codigo_medicamento_ssa) ON DELETE RESTRICT,
    indicacion_dosis TEXT NOT NULL,
    duracion_dias INT NOT NULL,
    cantidad_surtir INT NOT NULL,
    alerta_ignorada BOOLEAN DEFAULT FALSE -- Si ignoró alerta de alergia
);

CREATE TABLE solicitudes_estudio (
    id_solicitud UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_encuentro UUID REFERENCES encuentros_clinicos(id_encuentro) ON DELETE CASCADE,
    tipo_estudio VARCHAR(50) NOT NULL, -- LABORATORIO, IMAGENOLOGIA
    descripcion TEXT NOT NULL,
    fecha_solicitud TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE resultados_laboratorio (
    id_resultado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_solicitud UUID REFERENCES solicitudes_estudio(id_solicitud) ON DELETE RESTRICT,
    pdf_url TEXT NOT NULL, -- URL Azure Blob
    pdf_hash VARCHAR(255) NOT NULL, -- Integridad forense
    fecha_subida TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    subido_por UUID REFERENCES usuarios_sistema(id_usuario) ON DELETE RESTRICT
);

-- ==========================================
-- DOMINIO 6: Seguridad Activa y Trazabilidad (Forense)
-- ==========================================

CREATE TABLE auditoria_accesos (
    id_auditoria BIGSERIAL PRIMARY KEY,
    timestamp_evento TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    id_usuario UUID, -- No FK estricta por si el usuario fue eliminado logicamente
    direccion_ip INET NOT NULL,
    id_establecimiento_origen UUID,
    id_establecimiento_dato UUID,
    modulo_funcion VARCHAR(100) NOT NULL,
    tipo_evento VARCHAR(50) NOT NULL, 
    resultado VARCHAR(20) NOT NULL, -- EXITOSO, DENEGADO, FALLIDO
    nivel_severidad VARCHAR(20) NOT NULL CHECK (nivel_severidad IN ('BAJO', 'MEDIO', 'ALTO', 'CRITICO')),
    detalles JSONB,
    hash_archivo VARCHAR(255)
);

CREATE TABLE incidentes_seguridad (
    id_incidente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_auditoria BIGINT REFERENCES auditoria_accesos(id_auditoria) ON DELETE RESTRICT,
    estado VARCHAR(20) DEFAULT 'NUEVO' CHECK (estado IN ('NUEVO', 'EN_INVESTIGACION', 'RESUELTO', 'FALSO_POSITIVO')),
    asignado_a UUID REFERENCES usuarios_sistema(id_usuario),
    notas_investigacion TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMPTZ
);

CREATE TABLE sesiones_invalidas (
    token_jti VARCHAR(255) PRIMARY KEY,
    fecha_expiracion TIMESTAMPTZ NOT NULL,
    revocado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bitacora_recuperacion (
    id_recuperacion SERIAL PRIMARY KEY,
    fecha_evento TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    tipo_evento VARCHAR(50) NOT NULL, -- BACKUP, RESTORE, PITR
    detalles TEXT
);

CREATE TABLE historial_cambios (
    id_cambio BIGSERIAL PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id UUID NOT NULL,
    id_usuario UUID NOT NULL,
    campo_modificado VARCHAR(50) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    fecha_cambio TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
