from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base


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
    fecha_creacion = Column(DateTime(timezone=True))
    ultimo_login = Column(DateTime(timezone=True))

    role = relationship("Role")
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
    id_localidad = Column(String(9), nullable=True)
    calle_numero = Column(String, nullable=True)
    referencia_geografica = Column(String, nullable=True)
    id_lengua_materna = Column(Integer, nullable=True)
    telefono = Column(String(20), nullable=True)
    url_foto = Column(String, nullable=True)
    fecha_registro = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    usuario = relationship("User", back_populates="persona", uselist=False)


class SesionActiva(Base):
    __tablename__ = "sesiones_activas"
    jti = Column(String(36), primary_key=True)
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=False)
    ip_origen = Column(String(45))
    user_agent = Column(String(512))
    fecha_creacion = Column(DateTime(timezone=True), nullable=False)
    fecha_expira = Column(DateTime(timezone=True), nullable=False)


class Establecimiento(Base):
    __tablename__ = "establecimientos"
    id_establecimiento = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    clues = Column(String(20), unique=True, nullable=False)
    nombre = Column(String(200), nullable=False)
    id_jurisdiccion = Column(Integer, ForeignKey("jurisdicciones_sanitarias.id_jurisdiccion"))
    id_localidad = Column(String(9), ForeignKey("cat_localidades.id_localidad"))
    nivel_atencion = Column(Integer)


class Paciente(Base):
    __tablename__ = "pacientes"
    id_paciente = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_persona = Column(UUID(as_uuid=True), ForeignKey("personas.id_persona"), nullable=False, unique=True)
    numero_expediente = Column(String(50), unique=True, nullable=False)
    grupo_sanguineo = Column(String(5), nullable=True)
    fecha_registro = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    eliminado_en = Column(DateTime(timezone=True), nullable=True)
    eliminado_por = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=True)
    motivo_baja = Column(String, nullable=True)

    persona = relationship("Persona", foreign_keys=[id_persona])


# ── Catálogos INEGI ──────────────────────────────────────────────────────

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
