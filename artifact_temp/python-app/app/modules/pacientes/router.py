"""Pacientes module router stub"""
from fastapi import APIRouter, Depends
from app.core.deps import get_current_user

router = APIRouter()

@router.get("/")
async def list_pacientes(current_user: dict = Depends(get_current_user)):
    """GET /pacientes — Doc3 §Módulo 3 — TODO Persona 3"""
    return {"data": [], "message": "Módulo Pacientes pendiente de implementación (Persona 3)"}

@router.post("/")
async def create_paciente(current_user: dict = Depends(get_current_user)):
    """POST /pacientes — Doc3 §Módulo 3 — TODO Persona 3"""
    return {"message": "TODO Persona 3"}
