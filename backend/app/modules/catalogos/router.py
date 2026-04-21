"""Módulo de Catálogos — INEGI, CIE-10 y Medicamentos (Persona 5)"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List

from app.core.deps import get_current_user, get_db
# Importamos desde el corazón del sistema
from app.models.auth import CatMedicamento, CatCIE10, Estado, Municipio, Localidad

router = APIRouter()

# ─── ESTADOS ──────────────────────────────────────────────────────────
@router.get("/estados")
async def get_estados(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtiene el catálogo de estados oficial"""
    result = await db.execute(select(Estado).order_by(Estado.nombre))
    return {"status": "success", "data": result.scalars().all()}

# ─── MUNICIPIOS ───────────────────────────────────────────────────────
@router.get("/municipios/{id_estado}")
async def get_municipios(
    id_estado: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtiene municipios filtrados por la clave de estado"""
    query = select(Municipio).where(Municipio.id_estado == id_estado).order_by(Municipio.nombre)
    result = await db.execute(query)
    return {"status": "success", "data": result.scalars().all()}

# ─── CIE-10 (Búsqueda de Diagnósticos) ────────────────────────────────
@router.get("/cie10")
async def search_cie10(
    q: str = Query("", description="Texto de búsqueda para diagnóstico"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Búsqueda dinámica en el catálogo CIE-10 (ID o Descripción)"""
    query = select(CatCIE10)
    if q:
        # Usamos or_ para una búsqueda más limpia en SQLAlchemy
        query = query.where(
            or_(
                CatCIE10.id_cie10.ilike(f"%{q}%"),
                CatCIE10.descripcion.ilike(f"%{q}%")
            )
        )
    
    # Límite de 50 para no saturar el autocompletado del Front
    result = await db.execute(query.limit(50))
    return {"status": "success", "data": result.scalars().all()}

# ─── MEDICAMENTOS ─────────────────────────────────────────────────────
@router.get("/medicamentos")
async def search_medicamentos(
    q: str = Query("", description="Nombre o clave del medicamento"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Búsqueda dinámica en el Cuadro Básico de Medicamentos"""
    query = select(CatMedicamento)
    if q:
        query = query.where(
            or_(
                CatMedicamento.nombre_generico.ilike(f"%{q}%"),
                CatMedicamento.codigo_medicamento_ssa.ilike(f"%{q}%")
            )
        )
        
    result = await db.execute(query.limit(50))
    medicamentos = result.scalars().all()
    
    # Devolvemos el mapeo exacto que necesita el componente de Prescripción
    return {
        "status": "success",
        "data": [
            {
                "codigo_medicamento_ssa": med.codigo_medicamento_ssa,
                "nombre_generico": med.nombre_generico,
                "presentacion": med.presentacion,
                "forma_farmaceutica": med.forma_farmaceutica,
                "concentracion": med.concentracion,
                "indicaciones": med.indicaciones
            }
            for med in medicamentos
        ]
    }