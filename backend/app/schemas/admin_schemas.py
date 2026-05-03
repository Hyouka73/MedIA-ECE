from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timezone

class UsuarioOut(BaseModel):
    id_usuario: uuid.UUID
    email: str
    id_rol: Optional[int] = None
    rol: Optional[str] = None
    rol_nombre: Optional[str] = None
    id_establecimiento: Optional[uuid.UUID] = None
    nombre: Optional[str] = None
    primer_apellido: Optional[str] = None
    segundo_apellido: Optional[str] = None
    cedula_profesional: Optional[str] = None
    activo: bool
    bloqueado: Optional[bool] = False
    ultimo_acceso: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    sexo: Optional[str] = None

    class Config:
        from_attributes = True

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        if hasattr(obj, '__tablename__'):
            bloqueado_hasta = getattr(obj, "bloqueado_hasta", None)
            esta_bloqueado = (
                bloqueado_hasta is not None and
                bloqueado_hasta > datetime.now(timezone.utc)
            )
            ultimo_login = getattr(obj, "ultimo_login", None)
            data = {
                "id_usuario":         obj.id_usuario,
                "email":              obj.email,
                "id_rol":             obj.id_rol,
                "rol":                obj.rol.codigo if obj.rol else None,
                "id_establecimiento": obj.establecimientos[0].id_establecimiento if obj.establecimientos else None,
                "activo":             obj.activo,
                "cedula_profesional": getattr(obj, "cedula_profesional", None),
                "bloqueado":          esta_bloqueado,
                "ultimo_acceso":      str(ultimo_login) if ultimo_login else None,
                "rol_nombre":         obj.rol.nombre if obj.rol else None, 
                "nombre":             obj.persona.nombre if obj.persona else None,
                "primer_apellido":    obj.persona.primer_apellido if obj.persona else None,
                "segundo_apellido":   obj.persona.segundo_apellido if obj.persona else None,
                "fecha_nacimiento":   str(obj.persona.fecha_nacimiento) if obj.persona and obj.persona.fecha_nacimiento else None,
                "sexo":               obj.persona.sexo if obj.persona else None,
            }
            return cls(**data)
        return super().model_validate(obj, *args, **kwargs)


class UsuarioCreate(BaseModel):
    nombre: str
    primer_apellido: str
    segundo_apellido: Optional[str] = None
    email: str
    password: str
    rol: str
    fecha_nacimiento: str
    sexo: str
    cedula_profesional: Optional[str] = None
    id_establecimiento: Optional[uuid.UUID] = None


class UsuarioUpdate(BaseModel):
    nombre:             Optional[str]  = None
    primer_apellido:    Optional[str]  = None
    segundo_apellido:   Optional[str]  = None
    email:              Optional[str]  = None
    rol:                Optional[str]  = None
    activo:             Optional[bool] = None
    cedula_profesional: Optional[str]  = None
    id_establecimiento: Optional[uuid.UUID] = None

# ── SCHEMAS DE ESTABLECIMIENTOS ──────────────────────────────────────────

class EstablecimientoBase(BaseModel):
    clues: str
    nombre: str
    nivel_atencion: Optional[int] = 1
    id_localidad: Optional[str] = None

class EstablecimientoCreate(EstablecimientoBase):
    pass

class EstablecimientoUpdate(BaseModel):
    clues: Optional[str] = None
    nombre: Optional[str] = None
    nivel_atencion: Optional[int] = None
    id_localidad: Optional[str] = None

class EstablecimientoOut(BaseModel):
    id_establecimiento: uuid.UUID
    clues: str
    nombre: str
    nivel_atencion: Optional[int] = None
    id_localidad: Optional[str] = None

    class Config:
        from_attributes = True

class RolOut(BaseModel):
    id_rol:  int
    codigo:  str
    nombre:  str

    class Config:
        from_attributes = True