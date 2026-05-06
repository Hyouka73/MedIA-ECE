"""
Schemas Pydantic v2 — Signos Vitales
Contratos de request/response
"""

from __future__ import annotations
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import datetime
import uuid


# ── Signos Vitales ─────────────────────────────────────────────────────────────
class SignosVitalesCreateIn(BaseModel):
    """Request para registrar signos vitales — NOM-004 trazabilidad"""

    # Presión arterial (mmHg) — obligatorios
    presion_sistolica:  int   = Field(..., ge=60,   le=250,  description="Sistólica 60–250 mmHg")
    presion_diastolica: int   = Field(..., ge=40,   le=150,  description="Diastólica 40–150 mmHg")

    # Temperatura (°C) — obligatoria
    temperatura_c: float = Field(..., ge=34.0, le=42.0, description="Temperatura 34–42 °C")

    # Saturación de oxígeno (%) — obligatoria, float para admitir 98.5 %
    saturacion_oxigeno: float = Field(..., ge=70.0, le=100.0, description="SpO₂ 70–100 %")

    # Frecuencia cardíaca (lpm) — obligatoria
    frecuencia_cardiaca: int = Field(..., ge=30, le=220, description="FC 30–220 lpm")

    # Opcionales
    frecuencia_respiratoria: Optional[int]   = Field(None, ge=8,   le=40,  description="FR 8–40 rpm")
    peso_kg:                 Optional[float] = Field(None, ge=0.5, le=300, description="Peso en kg")
    talla_cm:                Optional[float] = Field(None, ge=30,  le=250, description="Talla en cm")

    # ── Validadores de precisión decimal ──────────────────────────────────────
    @field_validator("temperatura_c", "saturacion_oxigeno")
    @classmethod
    def validar_decimales(cls, v: float, info) -> float:
        """Máximo 2 decimales en campos float clínicos."""
        partes = str(v).split(".")
        if len(partes) == 2 and len(partes[1]) > 2:
            raise ValueError(
                f"{info.field_name} debe tener máximo 2 decimales (recibido: {v})"
            )
        return v

    # ── Validación cruzada: sistólica > diastólica ─────────────────────────────
    @model_validator(mode="after")
    def validar_presion_cruzada(self) -> "SignosVitalesCreateIn":
        ps, pd = self.presion_sistolica, self.presion_diastolica
        if ps is not None and pd is not None and ps <= pd:
            raise ValueError(
                f"La presión sistólica ({ps} mmHg) debe ser mayor "
                f"que la diastólica ({pd} mmHg)"
            )
        return self


# ── Response ───────────────────────────────────────────────────────────────────
class SignosVitalesOut(BaseModel):
    """Response — Signos vitales registrados"""
    id_signos:    uuid.UUID
    id_encuentro: uuid.UUID
    id_enfermero: Optional[uuid.UUID] = None

    # Vitales obligatorios
    presion_sistolica:  int
    presion_diastolica: int
    temperatura_c:      float
    saturacion_oxigeno: float   # float para consistencia con CreateIn
    frecuencia_cardiaca: int

    # Opcionales
    frecuencia_respiratoria: Optional[int]   = None
    peso_kg:                 Optional[float] = None
    talla_cm:                Optional[float] = None

    # Timestamp del servidor (garantiza trazabilidad NOM-004)
    fecha_toma: datetime

    class Config:
        from_attributes = True


class SignosVitalesListOut(BaseModel):
    """Response — Listado de signos vitales de un encuentro"""
    signos:           list[SignosVitalesOut]
    total:            int
    encuentro_activo: bool