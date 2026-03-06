from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
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
    segundo_apellido = Column(String(100))
    curp = Column(String(18), unique=True)
    url_foto = Column(String)
    
    usuario = relationship("User", back_populates="persona", uselist=False)
