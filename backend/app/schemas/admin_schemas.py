from pydantic import BaseModel
from typing import Optional
import uuid


# ─── Usuarios ────────────────────────────────────────────
class UsuarioOut(BaseModel):
    id_usuario: uuid.UUID
    email: str
    id_rol: Optional[int] = None
    cedula_profesional: Optional[str] = None
    activo: bool
    requires_2fa: bool

    class Config:
        from_attributes = True


class UsuarioCreate(BaseModel):
    email: str
    password: str
    id_rol: int
    cedula_profesional: Optional[str] = None
    id_persona: Optional[uuid.UUID] = None


class UsuarioUpdate(BaseModel):
    id_rol: Optional[int] = None
    activo: Optional[bool] = None
    cedula_profesional: Optional[str] = None


# ─── Establecimientos ────────────────────────────────────
class EstablecimientoOut(BaseModel):
    id_establecimiento: uuid.UUID
    clues: str
    nombre: str
    nivel_atencion: Optional[int] = None
    id_jurisdiccion: Optional[int] = None
    id_localidad: Optional[str] = None

    class Config:
        from_attributes = True


class EstablecimientoCreate(BaseModel):
    clues: str
    nombre: str
    nivel_atencion: int
    id_jurisdiccion: Optional[int] = None
    id_localidad: Optional[str] = None


class EstablecimientoUpdate(BaseModel):
    nombre: Optional[str] = None
    nivel_atencion: Optional[int] = None
    id_jurisdiccion: Optional[int] = None


# ─── Roles ───────────────────────────────────────────────
class RolOut(BaseModel):
    id_rol: int
    codigo: str
    nombre: str
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True
