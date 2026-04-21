from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import uuid
from passlib.context import CryptContext

from app.core.deps import require_role, get_db
from app.schemas.admin_schemas import (
    UsuarioOut, UsuarioCreate, UsuarioUpdate,
    EstablecimientoOut, RolOut
)
# Importamos desde el archivo central corregido
from app.models.auth import User, Role, Establecimiento, Persona

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── GET /usuarios ──────────────────────────────────────────────────────
@router.get("/usuarios", response_model=List[UsuarioOut])
async def list_usuarios(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR"))
):
    """Lista usuarios cargando Persona y Rol (corregido de 'role' a 'rol')"""
    result = await db.execute(
        select(User).options(
            selectinload(User.persona),
            selectinload(User.rol)  # <-- CORREGIDO: Antes decía role
        ).where(User.activo == True)
    )
    usuarios = result.scalars().all()
    # model_validate funciona porque UsuarioOut ahora recibe los campos de persona y rol
    return [UsuarioOut.model_validate(u) for u in usuarios]


# ── PATCH /usuarios/{id} ───────────────────────────────────────────────
@router.patch("/usuarios/{id_usuario}", response_model=UsuarioOut)
async def update_usuario(
    id_usuario: uuid.UUID,
    data: UsuarioUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN"))
):
    """Actualiza datos de usuario, contraseña y persona"""
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.persona),
            selectinload(User.rol)  # <-- CORREGIDO: Antes decía role
        )
        .where(User.id_usuario == id_usuario)
    )
    usuario = result.scalar_one_or_none()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    update_data = data.model_dump(exclude_unset=True)

    # 1. Gestión de ROL
    if "rol" in update_data:
        rol_nombre = update_data.pop("rol")
        rol_res = await db.execute(select(Role).where(Role.nombre == rol_nombre))
        rol_obj = rol_res.scalar_one_or_none()
        if not rol_obj:
            raise HTTPException(status_code=400, detail=f"El rol '{rol_nombre}' no existe")
        usuario.id_rol = rol_obj.id_rol

    # 2. Gestión de PERSONA (Campos anidados)
    persona_fields = {"nombre", "primer_apellido", "segundo_apellido"}
    if usuario.persona:
        for field in persona_fields:
            if field in update_data:
                setattr(usuario.persona, field, update_data.pop(field))
    else:
        # Si por alguna razón no tiene objeto persona, limpiamos los campos para no tronar
        for field in persona_fields:
            update_data.pop(field, None)

    # 3. Gestión de CONTRASEÑA
    if "password" in update_data:
        plain = update_data.pop("password")
        usuario.password_hash = pwd_context.hash(plain)

    # 4. Resto de campos (email, activo, cedula, etc.)
    for key, value in update_data.items():
        if hasattr(usuario, key):
            setattr(usuario, key, value)

    try:
        await db.commit()
        # Refrescamos con las relaciones correctas
        await db.refresh(usuario, attribute_names=["persona", "rol"]) 
        return UsuarioOut.model_validate(usuario)

    except Exception as e:
        await db.rollback()
        import traceback
        logger.error(f"Error en update_usuario: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail="Error al actualizar el usuario")


# ── GET /establecimientos ──────────────────────────────────────────────
@router.get("/establecimientos", response_model=List[EstablecimientoOut])
async def list_establecimientos(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR"))
):
    """Catálogo de establecimientos para asignación de usuarios"""
    res = await db.execute(select(Establecimiento))
    return res.scalars().all()


# ── GET /roles ──────────────────────────────────────────────────────────
@router.get("/roles", response_model=List[RolOut])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR"))
):
    """Lista de roles disponibles en el sistema"""
    res = await db.execute(select(Role))
    return res.scalars().all()