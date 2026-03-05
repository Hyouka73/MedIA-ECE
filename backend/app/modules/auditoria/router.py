"""Auditoria module router stub"""
from fastapi import APIRouter, Depends
from app.core.deps import require_role

router = APIRouter()

@router.get("/accesos")
async def get_auditoria(current_user: dict = Depends(require_role("SUPERADMIN", "AUDITOR_SEGURIDAD"))):
    """GET /auditoria/accesos — Doc3 §Módulo 13 — TODO Persona 4"""
    return {"data": [], "message": "TODO Persona 4: bitácora de accesos"}

@router.get("/incidentes")
async def get_incidentes(current_user: dict = Depends(require_role("SUPERADMIN", "AUDITOR_SEGURIDAD"))):
    return {"data": [], "message": "TODO Persona 4: gestión de incidentes"}
