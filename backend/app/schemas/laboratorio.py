from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class ResultadoLaboratorioOut(BaseModel):
    id_resultado: UUID
    id_solicitud: UUID
    pdf_url: str
    pdf_hash: str
    fecha_subida: datetime
    subido_por: UUID

    class Config:
        from_attributes = True

class SolicitudEstudioCreate(BaseModel):
    tipo_estudio: str
    urgente: bool = False
    indicacion_clinica: Optional[str] = None
    id_cie10_relacionado: Optional[str] = None

class SolicitudEstudioOut(BaseModel):
    id_solicitud: UUID
    id_encuentro: UUID
    tipo_estudio: str
    descripcion: str
    urgente: bool
    indicacion_clinica: Optional[str] = None
    id_cie10_relacionado: Optional[str] = None
    fecha_solicitud: datetime

    class Config:
        from_attributes = True
