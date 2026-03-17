from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.deps import require_role, get_db
from app.schemas.admin_schemas import (
    UsuarioOut, UsuarioCreate, UsuarioUpdate,
    EstablecimientoOut, EstablecimientoCreate, EstablecimientoUpdate,
    RolOut
)
from app.models.auth import User, Role, Establecimiento
import uuid
from passlib.context import CryptContext

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ═══════════════════════════════════════════
# USUARIOS
# ═══════════════════════════════════════════

@router.get("/usuarios", response_model=List[UsuarioOut])
async def list_usuarios(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR"))
):
    result = await db.execute(select(User))
    return result.scalars().all()


@router.post("/usuarios", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
async def create_usuario(
    data: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN"))
):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    usuario = User(
        id_usuario=uuid.uuid4(),
        email=data.email,
        password_hash=pwd_context.hash(data.password),
        id_rol=data.id_rol,
        cedula_profesional=data.cedula_profesional,
        id_persona=data.id_persona,
    )
    db.add(usuario)
    await db.commit()
    await db.refresh(usuario)
    return usuario


@router.patch("/usuarios/{id_usuario}", response_model=UsuarioOut)
async def update_usuario(
    id_usuario: uuid.UUID,
    data: UsuarioUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN"))
):
    result = await db.execute(select(User).where(User.id_usuario == id_usuario))
    usuario = result.scalar_one_or_none()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(usuario, field, value)

    await db.commit()
    await db.refresh(usuario)
    return usuario


# ═══════════════════════════════════════════
# ESTABLECIMIENTOS
# ═══════════════════════════════════════════

@router.get("/establecimientos", response_model=List[EstablecimientoOut])
async def list_establecimientos(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR"))
):
    result = await db.execute(select(Establecimiento))
    return result.scalars().all()


@router.post("/establecimientos", response_model=EstablecimientoOut, status_code=status.HTTP_201_CREATED)
async def create_establecimiento(
    data: EstablecimientoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN"))
):
    existing = await db.execute(
        select(Establecimiento).where(Establecimiento.clues == data.clues)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="CLUES ya registrada")

    est = Establecimiento(id_establecimiento=uuid.uuid4(), **data.model_dump())
    db.add(est)
    await db.commit()
    await db.refresh(est)
    return est


@router.patch("/establecimientos/{id_establecimiento}", response_model=EstablecimientoOut)
async def update_establecimiento(
    id_establecimiento: uuid.UUID,
    data: EstablecimientoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN"))
):
    result = await db.execute(
        select(Establecimiento).where(Establecimiento.id_establecimiento == id_establecimiento)
    )
    est = result.scalar_one_or_none()
    if not est:
        raise HTTPException(status_code=404, detail="Establecimiento no encontrado")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(est, field, value)

    await db.commit()
    await db.refresh(est)
    return est


# ═══════════════════════════════════════════
# ROLES
# ═══════════════════════════════════════════

@router.get("/roles", response_model=List[RolOut])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR"))
):
    result = await db.execute(select(Role))
    return result.scalars().all()
