from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timezone

class UsuarioOut(BaseModel):
    id_usuario: uuid.UUID
    email: str
    id_rol: Optional[int] = None
    rol_nombre: Optional[str] = None
    nombre: Optional[str] = None
    primer_apellido: Optional[str] = None
    segundo_apellido: Optional[str] = None
    cedula_profesional: Optional[str] = None
    activo: bool
    bloqueado: Optional[bool] = False
    ultimo_acceso: Optional[str] = None

    class Config:
        from_attributes = True

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        # Si el objeto viene de SQLAlchemy (tiene __tablename__)
        if hasattr(obj, '__tablename__'):
            # Cálculo de estado de bloqueo
            bloqueado_hasta = getattr(obj, "bloqueado_hasta", None)
            esta_bloqueado = (
                bloqueado_hasta is not None and
                bloqueado_hasta > datetime.now(timezone.utc)
            )
            
            ultimo_login = getattr(obj, "ultimo_login", None)
            
            # MAPE DE DATOS (Sincronizado con auth.py)
            data = {
                "id_usuario":         obj.id_usuario,
                "email":              obj.email,
                "id_rol":             obj.id_rol,
                "activo":             obj.activo,
                "cedula_profesional": getattr(obj, "cedula_profesional", None),
                "bloqueado":          esta_bloqueado,
                "ultimo_acceso":      str(ultimo_login) if ultimo_login else None,
                "rol_nombre":         obj.rol.nombre if obj.rol else None,  # <--- CORREGIDO: de role a rol
                "nombre":             obj.persona.nombre if obj.persona else None,
                "primer_apellido":    obj.persona.primer_apellido if obj.persona else None,
                "segundo_apellido":   obj.persona.segundo_apellido if obj.persona else None,
            }
            return cls(**data)
        
        # Si ya es un diccionario o objeto Pydantic
        return super().model_validate(obj, *args, **kwargs)


class UsuarioCreate(BaseModel):
    nombre: str
    primer_apellido: str
    segundo_apellido: Optional[str] = None
    email: str
    password: str
    rol: str
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


class EstablecimientoOut(BaseModel):
    id_establecimiento: uuid.UUID
    clues:              str
    nombre:             str
    nivel_atencion:     Optional[int] = None

    class Config:
        from_attributes = True


class EstablecimientoUpdate(BaseModel):
    nombre:         Optional[str] = None
    nivel_atencion: Optional[int] = None


class RolOut(BaseModel):
    id_rol:  int
    codigo:  str
    nombre:  str

    class Config:
        from_attributes = True