"""
Schemas Pydantic v2 — Encuentros Clínicos
Contratos de request/response
"""
from pydantic import BaseModel
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