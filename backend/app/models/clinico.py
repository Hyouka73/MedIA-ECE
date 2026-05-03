"""
SQLAlchemy ORM Models — Módulos Clínicos (P5)
Prescripciones, Solicitudes de Estudio y Resultados de Laboratorio
"""
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.auth import User, CatMedicamento

class Prescripcion(Base):
    __tablename__ = "prescripciones"
    
    id_prescripcion        = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_encuentro           = Column(UUID(as_uuid=True), ForeignKey("encuentros_clinicos.id_encuentro"), nullable=False)
    codigo_medicamento_ssa = Column(String(20), ForeignKey("cat_medicamentos.codigo_medicamento_ssa"), nullable=False)
    indicacion_dosis       = Column(Text, nullable=False)
    duracion_dias          = Column(Integer, nullable=False)
    cantidad_surtir        = Column(Integer, nullable=False)
    alerta_ignorada        = Column(Boolean, default=False)

    encuentro = relationship("EncuentroClinico")
    medicamento = relationship("CatMedicamento")

class SolicitudEstudio(Base):
    __tablename__ = "solicitudes_estudio"
    
    id_solicitud          = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_encuentro          = Column(UUID(as_uuid=True), ForeignKey("encuentros_clinicos.id_encuentro"), nullable=False)
    tipo_estudio          = Column(String(50), nullable=False)  # LABORATORIO, IMAGENOLOGIA
    descripcion           = Column(Text, nullable=False)
    urgente               = Column(Boolean, default=False)
    indicacion_clinica    = Column(Text, nullable=True)
    id_cie10_relacionado  = Column(String(10), ForeignKey("cat_cie10.codigo_cie"), nullable=True)
    fecha_solicitud       = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    encuentro = relationship("EncuentroClinico")
    cie10 = relationship("CatCIE10")
    resultados = relationship("ResultadoLaboratorio", back_populates="solicitud")

class ResultadoLaboratorio(Base):
    __tablename__ = "resultados_laboratorio"
    
    id_resultado = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_solicitud = Column(UUID(as_uuid=True), ForeignKey("solicitudes_estudio.id_solicitud"), nullable=False)
    pdf_url      = Column(Text, nullable=False) # URL Azure Blob
    pdf_hash     = Column(String(255), nullable=False) # Integridad forense SHA-256
    fecha_subida = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    subido_por   = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=False)

    solicitud = relationship("SolicitudEstudio", back_populates="resultados")
    usuario = relationship("User")
