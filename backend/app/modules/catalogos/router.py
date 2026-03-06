"""Catalogos module router stub"""
from fastapi import APIRouter, Depends
from app.core.deps import get_current_user

router = APIRouter()

@router.get("/estados")
async def get_estados(current_user: dict = Depends(get_current_user)):
    """GET /catalogos/estados — TODO Persona 2/3"""
    return {"data": [], "message": "TODO: conectar con cat_estados"}

@router.get("/municipios/{id_estado}")
async def get_municipios(id_estado: str, current_user: dict = Depends(get_current_user)):
    return {"data": [], "message": "TODO: conectar con cat_municipios"}

@router.get("/cie10")
async def search_cie10(q: str = "", current_user: dict = Depends(get_current_user)):
    """GET /catalogos/cie10?q= — TODO Persona 5"""
    return {"data": [], "message": "TODO: autocompletar de CIE-10 (NOTAS_PENDIENTES)"}

@router.get("/medicamentos")
async def search_medicamentos(q: str = "", current_user: dict = Depends(get_current_user)):
    """GET /catalogos/medicamentos?q= — TODO Persona 5"""
    return {"data": [], "message": "TODO: búsqueda de medicamentos SSA"}
