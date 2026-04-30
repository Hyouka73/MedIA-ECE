"""
Schemas Pydantic v2 — Pacientes y Personas
Contratos
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
import uuid


# ── Personas ─────────────────────────────────────────
class PersonaCreateIn(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    primer_apellido: str = Field(..., min_length=1, max_length=100)
    segundo_apellido: Optional[str] = Field(None, max_length=100)
    curp: Optional[str] = Field(None, max_length=18)  # NULL permitido (comunidades indígenas)
    fecha_nacimiento: date
    sexo: str = Field(..., pattern="^[MFX]$")  # 'M', 'F', 'X'
    id_localidad: Optional[str] = None
    calle_numero: Optional[str] = None
    referencia_geografica: Optional[str] = None
    id_lengua_materna: Optional[int] = None
    telefono: Optional[str] = Field(None, min_length=7, max_length=20)

class PersonaOut(BaseModel):
    id_persona: uuid.UUID
    nombre: str
    primer_apellido: str
    segundo_apellido: Optional[str] = None
    curp: Optional[str] = None
    fecha_nacimiento: date
    sexo: str
    id_localidad: Optional[str] = None
    calle_numero: Optional[str] = None
    referencia_geografica: Optional[str] = None
    id_lengua_materna: Optional[int] = None
    nombre_lengua: Optional[str] = None
    telefono: Optional[str] = None
    url_foto: Optional[str] = None
    fecha_registro: datetime
    alerta_barrera_linguistica: bool = Field(False, description="True si id_lengua_materna != None")

    class Config:
        from_attributes = True


# ── Pacientes ─────────────────────────────────────────
class PacienteCreateIn(BaseModel):
    id_persona: uuid.UUID
    grupo_sanguineo: Optional[str] = None

class PacienteOut(BaseModel):
    id_paciente: uuid.UUID
    numero_expediente: str  # Formato EXP-YYYY-{SEQ} — generado por BD
    id_persona: uuid.UUID
    grupo_sanguineo: Optional[str] = None
    fecha_registro: datetime
    persona: Optional[PersonaOut] = None  # Incluido en GET /pacientes/{id}/expediente


# ── Composiciones ────────────────────────────────────
class PacienteCreateWithPersonaIn(BaseModel):
    persona: PersonaCreateIn
    paciente: Optional[PacienteCreateIn] = None

class PacienteUpdateIn(BaseModel):
    grupo_sanguineo: Optional[str] = None

# ── Vistas (respuestas de SQL Views) ─────────────────────────────────────
class PacienteBasicoOut(BaseModel):
    """Proyección de v_paciente_basico — datos mínimos sin SOAP ni diagnósticos"""
    numero_expediente: str
    nombre: str
    primer_apellido: str
    curp: Optional[str] = None
    edad: Optional[int] = None


# ── Catálogos INEGI ──────────────────────────────────────────────────────
class EstadoOut(BaseModel):
    id_estado: str
    nombre: str

    class Config:
        from_attributes = True


class MunicipioOut(BaseModel):
    id_municipio: str
    id_estado: str
    nombre: str

    class Config:
        from_attributes = True


class LocalidadOut(BaseModel):
    id_localidad: str
    id_municipio: str
    nombre: str
    ambito: Optional[str] = None  # 'Urbano', 'Rural', etc.

    class Config:
        from_attributes = True


class LenguaOut(BaseModel):
    id_lengua: int
    nombre: str
    familia: Optional[str] = None

    class Config:
        from_attributes = True
