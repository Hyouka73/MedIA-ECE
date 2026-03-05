"""
Schemas Pydantic v2 — Pacientes y Personas
Contratos Doc3 §Módulos 2 y 3
"""
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
import uuid


# ── Personas ─────────────────────────────────────────
class PersonaCreateIn(BaseModel):
    nombre: str
    primer_apellido: str
    segundo_apellido: Optional[str] = None
    curp: Optional[str] = None  # NULL permitido (comunidades indígenas)
    fecha_nacimiento: date
    sexo: str  # 'M', 'F', 'X'
    id_localidad: Optional[str] = None
    calle_numero: Optional[str] = None
    referencia_geografica: Optional[str] = None
    id_lengua_materna: Optional[int] = None
    telefono: Optional[str] = None

class PersonaOut(PersonaCreateIn):
    id_persona: uuid.UUID
    fecha_registro: datetime
    alerta_barrera_linguistica: bool = False  # True si id_lengua_materna != None y != Español


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


# ── Vistas (respuestas de SQL Views) ─────────────────────────────────────
class PacienteBasicoOut(BaseModel):
    """Proyección de v_paciente_basico — datos mínimos sin SOAP ni diagnósticos"""
    numero_expediente: str
    nombre: str
    primer_apellido: str
    curp: Optional[str] = None
    edad: Optional[int] = None
