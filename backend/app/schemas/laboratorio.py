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

class SolicitudEstudioOut(BaseModel):
    id_solicitud: UUID
    id_encuentro: UUID
    tipo_estudio: str
    descripcion: str
    fecha_solicitud: datetime

    class Config:
        from_attributes = True
