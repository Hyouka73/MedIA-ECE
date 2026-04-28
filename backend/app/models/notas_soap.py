from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base

class NotaMedica(Base):
    __tablename__ = "notas_medicas"
    id_nota = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_encuentro = Column(UUID(as_uuid=True), ForeignKey("encuentros_clinicos.id_encuentro"))
    id_medico = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario")) # Autor original
    tipo_nota = Column(String(50), nullable=False)
    esta_firmada = Column(Boolean, default=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    fecha_firma = Column(DateTime(timezone=True))
    firmado_por = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario")) # Quién firmó
    cedula_profesional = Column(String(20))
    pdf_url = Column(Text)
    pdf_hash = Column(String(255))

    encuentro = relationship("EncuentroClinico", back_populates="notas")
    autor = relationship("User", foreign_keys=[id_medico])
    firmante = relationship("User", foreign_keys=[firmado_por])
    soap_detalle = relationship("NotaSOAP", backref="nota", uselist=False)
    enmiendas = relationship("NotaEnmienda", back_populates="nota")

    @property
    def subjetivo(self):
        return self.soap_detalle.subjetivo if self.soap_detalle else None

    @property
    def objetivo(self):
        return self.soap_detalle.objetivo if self.soap_detalle else None

    @property
    def analisis(self):
        return self.soap_detalle.analisis if self.soap_detalle else None

    @property
    def plan(self):
        return self.soap_detalle.plan if self.soap_detalle else None


class NotaSOAP(Base):
    __tablename__ = "notas_soap_detalle"
    id_nota = Column(UUID(as_uuid=True), ForeignKey("notas_medicas.id_nota"), primary_key=True)
    subjetivo = Column(Text)
    objetivo = Column(Text)
    analisis = Column(Text)
    plan = Column(Text)


class NotaEnmienda(Base):
    __tablename__ = "notas_enmienda"
    id_enmienda = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_nota = Column(UUID(as_uuid=True), ForeignKey("notas_medicas.id_nota"))
    texto_correccion = Column(Text, nullable=False)
    id_medico = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"))
    fecha_enmienda = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    nota = relationship("NotaMedica")
    medico = relationship("User")