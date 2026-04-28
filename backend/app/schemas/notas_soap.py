import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# ── Notas SOAP ─────────────────────────────────────────
class NotaSOAPCreateIn(BaseModel):
    """Request para crear nota SOAP en borrador"""
    tipo_nota: str = Field(..., description="Tipo de nota (SOAP, EVOLUCION, etc.)")
    subjetivo: Optional[str] = Field(None, description="Subjetivo - quejas del paciente")
    objetivo: Optional[str] = Field(None, description="Objetivo - hallazgos clínicos")
    analisis: Optional[str] = Field(None, description="Análisis - interpretación")
    plan: Optional[str] = Field(None, description="Plan - tratamiento y seguimiento")


class NotaSOAPUpdateIn(BaseModel):
    """Request para actualizar nota SOAP (solo si no está firmada)"""
    subjetivo: Optional[str] = None
    objetivo: Optional[str] = None
    analisis: Optional[str] = None
    plan: Optional[str] = None


class NotaSOAPOut(BaseModel):
    """Response — Nota SOAP completa"""
    id_nota: uuid.UUID
    id_encuentro: uuid.UUID
    tipo_nota: str
    esta_firmada: bool
    fecha_creacion: datetime
    fecha_firma: Optional[datetime] = None
    firmado_por: Optional[uuid.UUID] = None
    cedula_profesional: Optional[str] = None
    pdf_url: Optional[str] = None
    pdf_hash: Optional[str] = None
    
    # Contenido SOAP
    subjetivo: Optional[str] = None
    objetivo: Optional[str] = None
    analisis: Optional[str] = None
    plan: Optional[str] = None

    class Config:
        from_attributes = True


class NotaSOAPFirmarIn(BaseModel):
    """Request para firmar nota — activa trigger de inmutabilidad"""
    pass  # No requiere body, solo el PATCH


class NotaEnmiendaCreateIn(BaseModel):
    """Request para crear enmienda post-firma"""
    texto_correccion: str = Field(..., description="Texto de la corrección")


class NotaEnmiendaOut(BaseModel):
    """Response — Enmienda de nota"""
    id_enmienda: uuid.UUID
    id_nota: uuid.UUID
    texto_correccion: str
    id_medico: uuid.UUID
    fecha_enmienda: datetime
    medico_nombre: Optional[str] = None

    class Config:
        from_attributes = True


class CIE10Out(BaseModel):
    """Response — Diagnóstico CIE-10"""
    codigo_cie: str
    descripcion: str

    class Config:
        from_attributes = True


class CIE10ListOut(BaseModel):
    """Response — Lista de diagnósticos CIE-10"""
    diagnosticos: list[CIE10Out]
    total: int
import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# ── Notas SOAP ─────────────────────────────────────────
class NotaSOAPCreateIn(BaseModel):
    """Request para crear nota SOAP en borrador"""
    tipo_nota: str = Field(..., description="Tipo de nota (SOAP, EVOLUCION, etc.)")
    subjetivo: Optional[str] = Field(None, description="Subjetivo - quejas del paciente")
    objetivo: Optional[str] = Field(None, description="Objetivo - hallazgos clínicos")
    analisis: Optional[str] = Field(None, description="Análisis - interpretación")
    plan: Optional[str] = Field(None, description="Plan - tratamiento y seguimiento")


class NotaSOAPUpdateIn(BaseModel):
    """Request para actualizar nota SOAP (solo si no está firmada)"""
    subjetivo: Optional[str] = None
    objetivo: Optional[str] = None
    analisis: Optional[str] = None
    plan: Optional[str] = None


class NotaSOAPOut(BaseModel):
    """Response — Nota SOAP completa"""
    id_nota: uuid.UUID
    id_encuentro: uuid.UUID
    tipo_nota: str
    esta_firmada: bool
    fecha_creacion: datetime
    fecha_firma: Optional[datetime] = None
    firmado_por: Optional[uuid.UUID] = None
    cedula_profesional: Optional[str] = None
    pdf_url: Optional[str] = None
    pdf_hash: Optional[str] = None
    
    # Contenido SOAP
    subjetivo: Optional[str] = None
    objetivo: Optional[str] = None
    analisis: Optional[str] = None
    plan: Optional[str] = None

    class Config:
        from_attributes = True


class NotaSOAPFirmarIn(BaseModel):
    """Request para firmar nota — activa trigger de inmutabilidad"""
    pass  # No requiere body, solo el PATCH


class NotaEnmiendaCreateIn(BaseModel):
    """Request para crear enmienda post-firma"""
    texto_correccion: str = Field(..., description="Texto de la corrección")


class NotaEnmiendaOut(BaseModel):
    """Response — Enmienda de nota"""
    id_enmienda: uuid.UUID
    id_nota: uuid.UUID
    texto_correccion: str
    id_medico: uuid.UUID
    fecha_enmienda: datetime
    medico_nombre: Optional[str] = None

    class Config:
        from_attributes = True


class CIE10Out(BaseModel):
    """Response — Diagnóstico CIE-10"""
    codigo_cie: str
    descripcion: str

    class Config:
        from_attributes = True


class CIE10ListOut(BaseModel):
    """Response — Lista de diagnósticos CIE-10"""
    diagnosticos: list[CIE10Out]
    total: int