from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base


class NotaMedica(Base):
    __tablename__ = "notas_medicas"

    id_nota         = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_encuentro    = Column(UUID(as_uuid=True), ForeignKey("encuentros_clinicos.id_encuentro"), nullable=False)
    tipo_nota       = Column(String(50), nullable=False)
    esta_firmada    = Column(Boolean, default=False)
    fecha_creacion  = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    fecha_firma     = Column(DateTime(timezone=True), nullable=True)
    pdf_url         = Column(Text, nullable=True)
    pdf_hash        = Column(String(255), nullable=True)

    encuentro    = relationship("EncuentroClinico", back_populates="notas")
    soap_detalle = relationship("NotaSOAP", backref="nota", uselist=False)
    enmiendas    = relationship("NotaEnmienda", back_populates="nota")

    @property
    def id_medico(self):
        return self.encuentro.id_medico if self.encuentro else None

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

    id_nota    = Column(UUID(as_uuid=True), ForeignKey("notas_medicas.id_nota"), primary_key=True)
    subjetivo  = Column(Text, nullable=True)
    objetivo   = Column(Text, nullable=True)
    analisis   = Column(Text, nullable=True)
    plan       = Column(Text, nullable=True)


class NotaEnmienda(Base):
    __tablename__ = "notas_enmienda"

    id_enmienda      = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    id_nota          = Column(UUID(as_uuid=True), ForeignKey("notas_medicas.id_nota"), nullable=False)
    texto_correccion = Column(Text, nullable=False)
    id_medico        = Column(UUID(as_uuid=True), ForeignKey("usuarios_sistema.id_usuario"), nullable=True)
    fecha_enmienda   = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    nota   = relationship("NotaMedica", back_populates="enmiendas")
    medico = relationship("User")