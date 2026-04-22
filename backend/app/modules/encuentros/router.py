"""Encuentros module router stub"""
from fastapi import APIRouter, Depends
from app.core.deps import get_current_user, require_role

router = APIRouter()

@router.post("/")
async def create_encuentro(current_user: dict = Depends(require_role("MEDICO_GENERAL","ESPECIALISTA","SUPERADMIN"))):
    """POST /encuentros — TODO Persona 3"""
    return {"message": "TODO Persona 3: crear encuentro clínico"}

@router.patch("/{id}/cerrar")
async def cerrar_encuentro(id: str, current_user: dict = Depends(get_current_user)):
    """PATCH /encuentros/{id}/cerrar — TODO Persona 3"""
    return {"message": "TODO Persona 3: cerrar encuentro (irreversible)"}


@router.get("/")
async def create_encuentro(current_user: dict = Depends(require_role("MEDICO_GENERAL","ESPECIALISTA","SUPERADMIN"))):
    """GET /encuentros — TODO Persona 3"""
    return {"message": "TODO Persona 3: crear encuentro clínico"}