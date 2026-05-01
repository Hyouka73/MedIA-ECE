from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, text, Text, JSON, BigInteger
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from app.models.base import Base

# ── SISTEMA DE USUARIOS Y ROLES ──────────────────────────────────────────

class Role(Base):
    __tablename__ = "roles"
    id_rol = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String)


class User(Base):
    __tablename__ = "usuarios_sistema"
    id_usuario = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_persona = Column(UUID(as_uuid=True), ForeignKey("personas.id_persona"))
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    id_rol = Column(Integer, ForeignKey("roles.id_rol"))
    cedula_profesional = Column(String(20))
    totp_secret = Column(String(255))
    requires_2fa = Column(Boolean, default=True)
    intentos_fallidos = Column(Integer, default=0)
    bloqueado_hasta = Column(DateTime(timezone=True))
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    ultimo_login = Column(DateTime(timezone=True))

    rol = relationship("Role")
    persona = relationship("Persona", back_populates="usuario")


class Persona(Base):
    __tablename__ = "personas"
    id_persona = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    nombre = Column(String(100), nullable=False)
    primer_apellido = Column(String(100), nullable=False)
    segundo_apellido = Column(String(100), nullable=True)
    curp = Column(String(18), unique=True, nullable=True)
    fecha_nacimiento = Column(DateTime, nullable=False)
    sexo = Column(String(1), nullable=False)
    id_localidad = Column(String(9), ForeignKey("cat_localidades.id_localidad"), nullable=True)
    calle_numero = Column(String, nullable=True)
    referencia_geografica = Column(String, nullable=True)
    id_lengua_materna = Column(Integer, ForeignKey("cat_lenguas_indigenas.id_lengua"), nullable=True)
    telefono = Column(String(20), nullable=True)
    url_foto = Column(String, nullable=True)
    fecha_registro = Column(DateTime(timezone=True), nullable=False, default=func.now())

    usuario = relationship("User", back_populates="persona", uselist=False)
    lengua = relationship("Lengua")


class SesionActiva(Base):
    __tablename__ = "sesiones_activas"
    jti = Column(String(36), primary_key=True)
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=False)
    ip_origen = Column(String(45))
    user_agent = Column(String(512))
    fecha_creacion = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    fecha_expira = Column(DateTime(timezone=True), nullable=False)


# ── INFRAESTRUCTURA INSTITUCIONAL ───────────────────────────────────────

class Establecimiento(Base):
    __tablename__ = "establecimientos"
    id_establecimiento = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    clues = Column(String(20), unique=True, nullable=False)
    nombre = Column(String(200), nullable=False)
    id_jurisdiccion = Column(Integer)
    id_localidad = Column(String(9))
    nivel_atencion = Column(Integer)

class UsuarioEstablecimiento(Base):
    __tablename__ = "usuarios_establecimientos"
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), primary_key=True)
    id_establecimiento = Column(UUID(as_uuid=True), ForeignKey("establecimientos.id_establecimiento"), primary_key=True)
    es_principal = Column(Boolean, server_default="false")


class EstablecimientoEspecialidad(Base):
    __tablename__ = "establecimientos_especialidades"
    id_establecimiento = Column(UUID(as_uuid=True), ForeignKey("establecimientos.id_establecimiento"), primary_key=True)
    id_especialidad = Column(Integer, ForeignKey("cat_especialidades_medicas.id_especialidad"), primary_key=True)
    activo = Column(Boolean, nullable=False, server_default="true")
    fecha_habilitacion = Column(DateTime(timezone=True), server_default=func.now())


class Paciente(Base):
    __tablename__ = "pacientes"
    id_paciente = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_persona = Column(UUID(as_uuid=True), ForeignKey("personas.id_persona"), nullable=False, unique=True)
    numero_expediente = Column(String(50), unique=True, nullable=False)
    grupo_sanguineo = Column(String(5), nullable=True)
    fecha_registro = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    eliminado_en = Column(DateTime(timezone=True), nullable=True)
    eliminado_por = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=True)
    motivo_baja = Column(String, nullable=True)

    persona = relationship("Persona")


# ── CATÁLOGOS INEGI ──────────────────────────────────────────────────────

class Estado(Base):
    __tablename__ = "cat_estados"
    id_estado = Column(String(2), primary_key=True)
    nombre = Column(String(50), nullable=False)


class Municipio(Base):
    __tablename__ = "cat_municipios"
    id_municipio = Column(String(5), primary_key=True)
    id_estado = Column(String(2), ForeignKey("cat_estados.id_estado"), nullable=False)
    nombre = Column(String(100), nullable=False)


class Localidad(Base):
    __tablename__ = "cat_localidades"
    id_localidad = Column(String(9), primary_key=True)
    id_municipio = Column(String(5), ForeignKey("cat_municipios.id_municipio"), nullable=False)
    nombre = Column(String(150), nullable=False)
    ambito = Column(String(20), nullable=True)


class Lengua(Base):
    __tablename__ = "cat_lenguas_indigenas"
    id_lengua = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    familia = Column(String(100), nullable=True)


# ── AUDITORÍA Y SEGURIDAD (Persona 5 - Mapeo Sincronizado con BD) ────────

class AuditoriaAcceso(Base):
    __tablename__ = "auditoria_accesos"
    
    id_auditoria = Column(BigInteger, primary_key=True, index=True)
    timestamp_evento = Column(DateTime(timezone=True), server_default=func.now())
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=True)
    
    # ✅ MAPEOS REALES SEGÚN INFORMATION_SCHEMA
    ip_origen = Column("direccion_ip", INET, nullable=True) 
    modulo_accion = Column("modulo_funcion", String, nullable=False) 
    accion = Column("tipo_evento", String, nullable=False) 
    resultado = Column("resultado", String, server_default="ABIERTO") 
    nivel_severidad = Column(String(20), default="INFO") 
    detalles = Column(JSON, nullable=True)
    
    # Nuevas columnas encontradas en tu consulta SQL
    id_establecimiento_origen = Column(UUID(as_uuid=True), nullable=True)
    id_establecimiento_dato = Column(UUID(as_uuid=True), nullable=True)

    usuario = relationship("User")
    incidente = relationship("IncidenteSeguridad", back_populates="auditoria", uselist=False, lazy="joined")

class IncidenteSeguridad(Base):
    __tablename__ = "incidentes_seguridad"

    id_incidente = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_auditoria = Column(BigInteger, ForeignKey("auditoria_accesos.id_auditoria"), nullable=False)
    estado = Column(String(20), server_default="NUEVO")
    asignado_a = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=True)
    notas_investigacion = Column(Text)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_resolucion = Column(DateTime(timezone=True), nullable=True)

    auditoria = relationship("AuditoriaAcceso", back_populates="incidente")
    asignado = relationship("User")

# ── CATÁLOGOS CLÍNICOS (Persona 5) ──────────────────────────────────────

class CatMedicamento(Base):
    __tablename__ = "cat_medicamentos"
    codigo_medicamento_ssa = Column(String(20), primary_key=True)
    nombre_generico = Column(String(255), nullable=False)
    presentacion = Column(String(100))
    forma_farmaceutica = Column(String(100))
    concentracion = Column(String(100))
    indicaciones = Column(Text)

class CatCIE10(Base):
    __tablename__ = "cat_cie10"
    codigo_cie = Column(String(10), primary_key=True)
    descripcion = Column(Text, nullable=False)
    codigo_padre = Column(String(10), ForeignKey("cat_cie10.codigo_cie"))

class Alergia(Base):
    __tablename__ = "alergias"
    id_alergia = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_paciente = Column(UUID(as_uuid=True), ForeignKey("pacientes.id_paciente"), nullable=False)
    alergia = Column(String(255), nullable=False)
    severidad = Column(String(20), nullable=False, server_default="LEVE")  # LEVE | MODERADA | CRITICA
    registrado_por = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=True)
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())
    eliminado_en = Column(DateTime(timezone=True), nullable=True)
    eliminado_por = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=True)
    motivo_baja = Column(String, nullable=True)

    paciente = relationship("Paciente")
    usuario_registra = relationship("User", foreign_keys=[registrado_por])
    usuario_elimina = relationship("User", foreign_keys=[eliminado_por])


# ── ANTECEDENTES HEREDITARIOS ──────────────────────────────────────────

class AntecedentesHeredofamiliares(Base):
    __tablename__ = "antecedentes_heredofamiliares"
    id_ahf = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_paciente = Column(UUID(as_uuid=True), ForeignKey("pacientes.id_paciente"), nullable=False)
    diabetes = Column(Boolean, default=False)
    hipertension = Column(Boolean, default=False)
    cardiopatia = Column(Boolean, default=False)
    neoplasia = Column(Boolean, default=False)
    detalles = Column(Text, nullable=True)
    eliminado_en = Column(DateTime(timezone=True), nullable=True)
    eliminado_por = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=True)

    paciente = relationship("Paciente")
    usuario_elimina = relationship("User", foreign_keys=[eliminado_por])


# ── ANTECEDENTES PATOLÓGICOS (ENFERMEDADES PREVIAS) ────────────────────

class AntecedentesPatologicos(Base):
    __tablename__ = "antecedentes_patologicos"
    id_ap = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_paciente = Column(UUID(as_uuid=True), ForeignKey("pacientes.id_paciente"), nullable=False)
    enfermedad = Column(String(200), nullable=False)
    fecha_diagnostico = Column(DateTime, nullable=True)
    tratamiento_actual = Column(Text, nullable=True)
    eliminado_en = Column(DateTime(timezone=True), nullable=True)
    eliminado_por = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=True)

    paciente = relationship("Paciente")
    usuario_elimina = relationship("User", foreign_keys=[eliminado_por])


# ── ANTECEDENTES NO PATOLÓGICOS (DETERMINANTES SOCIALES) ────────────────

class AntecedentesNoPatologicos(Base):
    __tablename__ = "antecedentes_no_patologicos"
    id_anp = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_paciente = Column(UUID(as_uuid=True), ForeignKey("pacientes.id_paciente"), nullable=False)
    tabaquismo = Column(Boolean, default=False)
    alcoholismo = Column(Boolean, default=False)
    drogas = Column(Boolean, default=False)
    detalles = Column(Text, nullable=True)
    eliminado_en = Column(DateTime(timezone=True), nullable=True)
    eliminado_por = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=True)

    paciente = relationship("Paciente")
    usuario_elimina = relationship("User", foreign_keys=[eliminado_por])


# ── ANTECEDENTES GINECOOBSTÉTRICOS (SOLO MUJERES) ────────────────────

class AntecedentesGinecoobstetricos(Base):
    __tablename__ = "antecedentes_ginecoobstetricos"
    id_ago = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_paciente = Column(UUID(as_uuid=True), ForeignKey("pacientes.id_paciente"), nullable=False)
    menarca = Column(Integer, nullable=True)
    gestas = Column(Integer, default=0)
    paras = Column(Integer, default=0)
    cesareas = Column(Integer, default=0)
    abortos = Column(Integer, default=0)
    fecha_ultima_menstruacion = Column(DateTime, nullable=True)
    eliminado_en = Column(DateTime(timezone=True), nullable=True)
    eliminado_por = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=True)

    paciente = relationship("Paciente")
    usuario_elimina = relationship("User", foreign_keys=[eliminado_por])


# ── INMUNIZACIONES (VACUNAS) ──────────────────────────────────────────

class Inmunizacion(Base):
    __tablename__ = "inmunizaciones"
    id_inmunizacion = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_paciente = Column(UUID(as_uuid=True), ForeignKey("pacientes.id_paciente"), nullable=False)
    vacuna = Column(String(100), nullable=False)
    fecha_aplicacion = Column(DateTime, nullable=True)
    dosis = Column(String(50), nullable=True)
    eliminado_en = Column(DateTime(timezone=True), nullable=True)
    eliminado_por = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=True)

    paciente = relationship("Paciente")
    usuario_elimina = relationship("User", foreign_keys=[eliminado_por])


# ── TUTORES Y REPRESENTANTES LEGALES ──────────────────────────────────

class PacienteTutor(Base):
    __tablename__ = "pacientes_tutores_representantes"
    id_tutor = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_paciente = Column(UUID(as_uuid=True), ForeignKey("pacientes.id_paciente"), nullable=False)
    id_persona = Column(UUID(as_uuid=True), ForeignKey("personas.id_persona"), nullable=False)
    parentesco = Column(String(50), nullable=False)
    documento_legal_url = Column(String, nullable=True)  # URL en Azure Blob
    documento_legal_hash = Column(String(255), nullable=True)  # SHA-256 hash
    eliminado_en = Column(DateTime(timezone=True), nullable=True)
    eliminado_por = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=True)
    motivo_baja = Column(String, nullable=True)

    paciente = relationship("Paciente")
    persona = relationship("Persona")
    usuario_elimina = relationship("User", foreign_keys=[eliminado_por])


# ── REFERENCIAS MÉDICAS (INTERCONSULTAS) ──────────────────────────────

class Referencia(Base):
    __tablename__ = "referencias_medicas"
    id_referencia = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    folio = Column(String(20), unique=True, nullable=False)  # Folio único generado
    tipo = Column(String(20), nullable=False, server_default="REFERENCIA")  # REFERENCIA | CONTRAREFERENCIA
    id_referencia_origen = Column(UUID(as_uuid=True), ForeignKey("referencias_medicas.id_referencia"), nullable=True)  # Para contrarreferencias
    id_encuentro_origen = Column(UUID(as_uuid=True), ForeignKey("encuentros_clinicos.id_encuentro"), nullable=False)
    id_establecimiento_destino = Column(UUID(as_uuid=True), ForeignKey("establecimientos.id_establecimiento"), nullable=False)
    id_especialidad_destino = Column(Integer, ForeignKey("cat_especialidades_medicas.id_especialidad"), nullable=False)
    estado = Column(String(20), nullable=False, server_default="PENDIENTE")  # PENDIENTE | ACEPTADA | ATENDIDA | CANCELADA
    urgencia = Column(String(20), nullable=False)  # URGENTE | PROGRAMADA
    motivo_referencia = Column(Text, nullable=False)
    diagnostico_cie10 = Column(String(10), nullable=True)  # Código CIE-10
    resumen_contrarreferencia = Column(Text, nullable=True)  # Solo para contrarreferencias
    fecha_emision = Column(DateTime(timezone=True), server_default=func.now())
    fecha_respuesta = Column(DateTime(timezone=True), nullable=True)
    id_usuario_emisor = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=False)
    id_usuario_respuesta = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=True)

    # Relaciones
    encuentro = relationship("EncuentroClinico")
    establecimiento_destino = relationship("Establecimiento")
    especialidad_destino = relationship("EspecialidadMedica")
    usuario_emisor = relationship("User", foreign_keys=[id_usuario_emisor])
    usuario_respuesta = relationship("User", foreign_keys=[id_usuario_respuesta])
    referencia_origen = relationship("Referencia", remote_side=[id_referencia])