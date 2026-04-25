"""
SQLAlchemy ORM Models — Signos vitales
"""
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Text, text, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.auth import Paciente

class SignosVitales(Base):
    __tablename__ = "signos_vitales"
    id_signos = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_encuentro = Column(UUID(as_uuid=True), ForeignKey("encuentros_clinicos.id_encuentro"))
    id_enfermero = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"))
    peso_kg = Column(DECIMAL(5, 2))
    talla_cm = Column(DECIMAL(5, 2))
    temperatura_c = Column(DECIMAL(4, 2))
    frecuencia_cardiaca = Column(Integer)
    frecuencia_respiratoria = Column(Integer)
    presion_sistolica = Column(Integer)
    presion_diastolica = Column(Integer)
    saturacion_oxigeno = Column(DECIMAL(4, 1))
    fecha_toma = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    encuentro = relationship("EncuentroClinico")
    enfermero = relationship("User")