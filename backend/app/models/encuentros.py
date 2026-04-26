"""
SQLAlchemy ORM Models — Encuentros Clínicos
"""
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Text, text, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.auth import Paciente


 
# class Paciente(Base):
#     __tablename__ = "pacientes"
#     id_paciente = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
#     id_persona = Column(UUID(as_uuid=True), ForeignKey("personas.id_persona"))
#     numero_expediente = Column(String(50), unique=True, nullable=False)
#     grupo_sanguineo = Column(String(5))
#     fecha_registro = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
#     eliminado_en = Column(DateTime(timezone=True))
#     eliminado_por = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"))
#     motivo_baja = Column(Text)

#     persona = relationship("Persona")


class EspecialidadMedica(Base):
    __tablename__ = "cat_especialidades_medicas"
    id_especialidad = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)


class EncuentroClinico(Base):
    __tablename__ = "encuentros_clinicos"
    id_encuentro = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_paciente = Column(UUID(as_uuid=True), ForeignKey("pacientes.id_paciente"))
    id_medico = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"))
    id_establecimiento = Column(UUID(as_uuid=True), ForeignKey("establecimientos.id_establecimiento"))
    id_especialidad = Column(Integer, ForeignKey("cat_especialidades_medicas.id_especialidad"))
    fecha_inicio = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    fecha_cierre = Column(DateTime(timezone=True))
    motivo_consulta = Column(Text, nullable=False)
    tipo_consulta = Column(String(20))  # PRIMERA_VEZ, SUBSECUENTE

    paciente = relationship("Paciente")
    medico = relationship("User")
    establecimiento = relationship("Establecimiento")
    especialidad = relationship("EspecialidadMedica")
    notas = relationship("NotaMedica", back_populates="encuentro")


class DiagnosticoEncuentro(Base):
    __tablename__ = "diagnosticos_encuentro"
    id_diagnostico = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_encuentro = Column(UUID(as_uuid=True), ForeignKey("encuentros_clinicos.id_encuentro"))
    codigo_cie = Column(String(10), ForeignKey("cat_cie10.codigo_cie"))
    tipo = Column(String(20))  # PRESUNTIVO, DEFINITIVO
    observaciones = Column(Text)

    encuentro = relationship("EncuentroClinico")
    # cie10 = relationship("CatCIE10")
    cie10 = relationship("CatCIE10", foreign_keys=[codigo_cie])


# class SignosVitales(Base):
#     __tablename__ = "signos_vitales"
#     id_signos = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
#     id_encuentro = Column(UUID(as_uuid=True), ForeignKey("encuentros_clinicos.id_encuentro"))
#     id_enfermero = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"))
#     peso_kg = Column(DECIMAL(5, 2))
#     talla_cm = Column(DECIMAL(5, 2))
#     temperatura_c = Column(DECIMAL(4, 2))
#     frecuencia_cardiaca = Column(Integer)
#     frecuencia_respiratoria = Column(Integer)
#     presion_sistolica = Column(Integer)
#     presion_diastolica = Column(Integer)
#     saturacion_oxigeno = Column(DECIMAL(4, 1))
#     fecha_toma = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

#     encuentro = relationship("EncuentroClinico")
#     enfermero = relationship("User")