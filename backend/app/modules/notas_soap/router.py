from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.deps import get_current_user, require_role
from app.services.encuentros import encuentro_service
from app.services.notas_soap import NotaSOAPService, CatalogoService

from app.schemas.notas_soap import (
    NotaSOAPCreateIn, NotaSOAPUpdateIn, 
    NotaSOAPOut, NotaEnmiendaCreateIn, NotaEnmiendaOut, CIE10ListOut
)
 

router = APIRouter()

@router.post("/encuentros/{id_encuentro}/notas", response_model=NotaSOAPOut, status_code=status.HTTP_201_CREATED)
async def crear_nota(
    id_encuentro: UUID,
    data: NotaSOAPCreateIn,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Crea una nota SOAP en borrador para un encuentro específico"""
    return await NotaSOAPService.crear_nota_soap(
        db=db, id_encuentro=id_encuentro, id_medico=UUID(current_user["sub"]), data=data
    )

@router.patch("/notas/{id_nota}", response_model=NotaSOAPOut)
async def actualizar_nota(
    id_nota: UUID,
    data: NotaSOAPUpdateIn,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualiza una nota (Solo si esta_firmada = FALSE)"""
    return await NotaSOAPService.actualizar_nota_soap(
        db=db, id_nota=id_nota, id_medico=UUID(current_user["sub"]), data=data
    )

@router.patch("/notas/{id_nota}/firmar", response_model=NotaSOAPOut)
async def firmar_nota(
    id_nota: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Firma digitalmente la nota y activa inmutabilidad (SHA-256)"""
    return await NotaSOAPService.firmar_nota_soap(
        db=db, id_nota=id_nota, id_medico=UUID(current_user["sub"])
    )

# ── ENMIENDAS (POST-FIRMA) ─────────────────────────────

@router.post("/notas/{id_nota}/enmienda", response_model=NotaEnmiendaOut)
async def crear_enmienda(
    id_nota: UUID,
    data: NotaEnmiendaCreateIn,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Crea una corrección (Addendum) para una nota ya firmada"""
    return await NotaSOAPService.crear_enmienda(
        db=db, id_nota=id_nota, id_medico=UUID(current_user["sub"]), data=data
    )

# ── CATÁLOGOS ──────────────────────────────────────────

@router.get("/catalogos/cie10", response_model=CIE10ListOut)
async def buscar_cie10(
    q: str = Query(..., min_length=3, description="Término de búsqueda (código o nombre)"),
    db: AsyncSession = Depends(get_db)
):
    """Búsqueda de diagnósticos CIE-10 (Límite 20)"""
    items, total = await CatalogoService.buscar_cie10(db=db, termino=q)
    return {"resultados": items, "total": total}

# ── CONSULTA DE NOTAS ──────────────────────────────────

@router.get("/encuentros/{id_encuentro}/notas", response_model=List[NotaSOAPOut])
async def listar_notas_encuentro(
    id_encuentro: UUID,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Lista todo el historial de notas de un encuentro"""
    return await NotaSOAPService.listar_notas_encuentro(
        db=db, id_encuentro=id_encuentro, skip=skip, limit=limit
    )