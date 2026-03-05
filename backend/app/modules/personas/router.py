"""Personas module router stub"""
from fastapi import APIRouter, Depends
from app.core.deps import get_current_user

router = APIRouter()

@router.get("/")
async def list_personas(current_user: dict = Depends(get_current_user)):
    """GET /personas — Doc3 §Módulo 2 — TODO Persona 3"""
    return {"data": [], "message": "Módulo Personas pendiente de implementación (Persona 3)"}

@router.post("/")
async def create_persona(current_user: dict = Depends(get_current_user)):
    """POST /personas — Doc3 §Módulo 2 — TODO Persona 3"""
    return {"message": "TODO Persona 3"}
