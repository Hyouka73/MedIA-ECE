"""Admin module router stub"""
from fastapi import APIRouter, Depends
from app.core.deps import require_role

router = APIRouter()

@router.get("/usuarios")
async def list_usuarios(current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR"))):
    """GET /admin/usuarios — TODO Persona 4"""
    return {"data": [], "message": "TODO Persona 4: gestión de usuarios y roles"}

@router.get("/establecimientos")
async def list_establecimientos(current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR"))):
    """GET /admin/establecimientos — TODO Persona 4"""
    return {"data": [], "message": "TODO Persona 4: gestión de establecimientos"}
