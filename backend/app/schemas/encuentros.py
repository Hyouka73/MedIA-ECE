"""
Schemas Pydantic v2 — Encuentros Clínicos
Contratos de request/response
"""

from __future__ import annotations
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
import uuid

 
# ── Encuentros ─────────────────────────────────────────
class EncuentroCreateIn(BaseModel):
    id_paciente: uuid.UUID
    motivo_consulta: str
    tipo_consulta: str  # PRIMERA_VEZ, SUBSECUENTE


class EncuentroOut(BaseModel):
    id_encuentro: uuid.UUID
    id_paciente: uuid.UUID
    id_medico: uuid.UUID
    id_establecimiento: uuid.UUID
    id_especialidad: Optional[int] = None
    fecha_inicio: datetime
    fecha_cierre: Optional[datetime] = None
    motivo_consulta: str
    tipo_consulta: Optional[str] = None
    paciente_numero_expediente: Optional[str] = None
    paciente_nombre: Optional[str] = None
    medico_nombre: Optional[str] = None
    establecimiento_nombre: Optional[str] = None


class EncuentroDetalleOut(EncuentroOut):
    notas: list = []
    signos_vitales: Optional[dict] = None
    diagnosticos: list = []


# ── Cerrar Encuentro ───────────────────────────────────
class EncuentroCerrarIn(BaseModel):
    pass  # No requiere body, solo el PATCH


# ── Listado de Encuentros ──────────────────────────────
class EncuentroListOut(BaseModel):
    encuentros: list[EncuentroOut]
    total: int
    pagina: int
    por_pagina: int


# ── Historial de Paciente ──────────────────────────────
class EncuentroPacienteOut(BaseModel):
    id_encuentro: uuid.UUID
    fecha_inicio: datetime
    fecha_cierre: Optional[datetime] = None
    motivo_consulta: str
    tipo_consulta: Optional[str] = None
    medico_nombre: str
    establecimiento_nombre: str
    especialidad_nombre: Optional[str] = None
    tiene_notas_firmadas: bool = False

# # ── Signos Vitales ─────────────────────────────────────
# class SignosVitalesCreateIn(BaseModel):
#     """Request para registrar signos vitales — NOM-004 trazabilidad"""
#     # Presión arterial (mmHg)
#     presion_sistolica: int = Field(..., ge=60, le=250, description="Sistólica 60–250 mmHg")
#     presion_diastolica: int = Field(..., ge=40, le=150, description="Diastólica 40–150 mmHg")
    
#     # Temperatura (°C)
#     temperatura_c: float = Field(..., ge=34.0, le=42.0, description="Temperatura 34–42 °C")
    
#     # Saturación de oxígeno (%)
#     saturacion_oxigeno: int = Field(..., ge=70, le=100, description="SpO₂ 70–100%")
    
#     # Frecuencia cardíaca (lpm)
#     frecuencia_cardiaca: int = Field(..., ge=30, le=220, description="FC 30–220 lpm")
    
#     # Opcionales
#     frecuencia_respiratoria: Optional[int] = Field(None, ge=6, le=60, description="FR 6–60 rpm (opcional)")
#     peso_kg: Optional[float] = Field(None, gt=0, le=300, description="Peso en kg (opcional)")
#     talla_cm: Optional[float] = Field(None, gt=0, le=250, description="Talla en cm (opcional)")

#     @field_validator("temperatura_c")
#     @classmethod
#     def validar_temperatura_precision(cls, v):
#         """Validar 2 decimales máximo"""
#         if isinstance(v, float) and len(str(v).split('.')[-1]) > 2:
#             raise ValueError("Temperatura debe tener máximo 2 decimales")
#         return v


# class SignosVitalesOut(BaseModel):
#     """Response — Signos vitales registrados"""
#     id_signos: uuid.UUID
#     id_encuentro: uuid.UUID
#     id_enfermero: Optional[uuid.UUID] = None
    
#     # Vitales obligatorios
#     presion_sistolica: int
#     presion_diastolica: int
#     temperatura_c: float
#     saturacion_oxigeno: int
#     frecuencia_cardiaca: int
    
#     # Opcionales
#     frecuencia_respiratoria: Optional[int] = None
#     peso_kg: Optional[float] = None
#     talla_cm: Optional[float] = None
    
#     # Timestamp del servidor (garantiza trazabilidad NOM-004)
#     fecha_toma: datetime

#     class Config:
#         from_attributes = True


# class SignosVitalesListOut(BaseModel):
#     """Response — Listado de signos vitales de un encuentro"""
#     signos: list[SignosVitalesOut]
#     total: int
#     encuentro_activo: bool


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

