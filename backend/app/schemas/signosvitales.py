"""
Schemas Pydantic v2 — Signos Vitales
Contratos de request/response
"""

from __future__ import annotations
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
import uuid

# ── Signos Vitales ─────────────────────────────────────
class SignosVitalesCreateIn(BaseModel):
    """Request para registrar signos vitales — NOM-004 trazabilidad"""
    # Presión arterial (mmHg)
    presion_sistolica: int = Field(..., ge=60, le=250, description="Sistólica 60–250 mmHg")
    presion_diastolica: int = Field(..., ge=40, le=150, description="Diastólica 40–150 mmHg")
    
    # Temperatura (°C)
    temperatura_c: float = Field(..., ge=34.0, le=42.0, description="Temperatura 34–42 °C")
    
    # Saturación de oxígeno (%)
    saturacion_oxigeno: int = Field(..., ge=70, le=100, description="SpO₂ 70–100%")
    
    # Frecuencia cardíaca (lpm)
    frecuencia_cardiaca: int = Field(..., ge=30, le=220, description="FC 30–220 lpm")
    
    # Opcionales
    frecuencia_respiratoria: Optional[int] = Field(None, ge=6, le=60, description="FR 6–60 rpm (opcional)")
    peso_kg: Optional[float] = Field(None, gt=0, le=300, description="Peso en kg (opcional)")
    talla_cm: Optional[float] = Field(None, gt=0, le=250, description="Talla en cm (opcional)")

    @field_validator("temperatura_c")
    @classmethod
    def validar_temperatura_precision(cls, v):
        """Validar 2 decimales máximo"""
        if isinstance(v, float) and len(str(v).split('.')[-1]) > 2:
            raise ValueError("Temperatura debe tener máximo 2 decimales")
        return v


class SignosVitalesOut(BaseModel):
    """Response — Signos vitales registrados"""
    id_signos: uuid.UUID
    id_encuentro: uuid.UUID
    id_enfermero: Optional[uuid.UUID] = None
    
    # Vitales obligatorios
    presion_sistolica: int
    presion_diastolica: int
    temperatura_c: float
    saturacion_oxigeno: int
    frecuencia_cardiaca: int
    
    # Opcionales
    frecuencia_respiratoria: Optional[int] = None
    peso_kg: Optional[float] = None
    talla_cm: Optional[float] = None
    
    # Timestamp del servidor (garantiza trazabilidad NOM-004)
    fecha_toma: datetime

    class Config:
        from_attributes = True


class SignosVitalesListOut(BaseModel):
    """Response — Listado de signos vitales de un encuentro"""
    signos: list[SignosVitalesOut]
    total: int
    encuentro_activo: bool