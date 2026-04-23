"""Catálogos module router — Endpoints INEGI y clínicos con TTL de caché 24h"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.auth import Estado, Municipio, Localidad, Lengua
from app.schemas.pacientes import EstadoOut, MunicipioOut, LocalidadOut, LenguaOut
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ── GET /estados — Listar todos los estados ────────────────────────────
@router.get("/estados", response_model=dict)
async def get_estados(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """GET /catalogos/estados — Lista todos los estados mexicanos (CDN TTL: 24h)"""
    try:
        query = select(Estado).order_by(Estado.nombre)
        result = await db.execute(query)
        estados = result.scalars().all()
        
        items = [
            EstadoOut(id_estado=e.id_estado, nombre=e.nombre)
            for e in estados
        ]
        
        return {
            "data": items,
            "message": "Estados obtenidos exitosamente",
            "cache": {
                "ttl": 86400,  # 24 horas en segundos
                "cdn": True
            }
        }
    except Exception as e:
        logger.error(f"Error al obtener estados: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener estados"
        )


# ── GET /municipios — Listar municipios por estado ─────────────────────
@router.get("/municipios", response_model=dict)
async def get_municipios(
    estado: str = Query(..., description="Clave del estado (ej: '07' para Chiapas)"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """GET /catalogos/municipios?estado={clave} — Lista municipios por estado (CDN TTL: 24h)"""
    try:
        # Validar que el estado existe
        estado_query = select(Estado).where(Estado.id_estado == estado)
        estado_result = await db.execute(estado_query)
        if not estado_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Estado '{estado}' no encontrado"
            )
        
        # Obtener municipios
        query = select(Municipio).where(
            Municipio.id_estado == estado
        ).order_by(Municipio.nombre)
        
        result = await db.execute(query)
        municipios = result.scalars().all()
        
        items = [
            MunicipioOut(
                id_municipio=m.id_municipio,
                id_estado=m.id_estado,
                nombre=m.nombre
            )
            for m in municipios
        ]
        
        return {
            "data": items,
            "message": f"Municipios de {estado} obtenidos exitosamente",
            "cache": {
                "ttl": 86400,
                "cdn": True
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener municipios: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener municipios"
        )


# ── GET /localidades — Listar localidades por municipio ───────────────
@router.get("/localidades", response_model=dict)
async def get_localidades(
    municipio: str = Query(..., description="Clave del municipio (ej: '07101' para Tuxtla Gutiérrez)"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """GET /catalogos/localidades?municipio={clave} — Lista localidades por municipio (CDN TTL: 24h)"""
    try:
        from sqlalchemy import func, select
        
        # Construir query base
        query = select(Localidad).where(Localidad.id_municipio == municipio)
        count_query = select(func.count()).select_from(Localidad).where(Localidad.id_municipio == municipio)
        
        # Ordenar
        query = query.order_by(Localidad.nombre)
        
        # Ejecutar consulta principal
        result = await db.execute(query)
        localidades = result.scalars().all()
        
        # Ejecutar conteo
        count_result = await db.execute(count_query)
        total = count_result.scalar_one()
        
        # Construir respuesta
        items = [
            {
                "id_localidad": l.id_localidad,
                "id_municipio": l.id_municipio,
                "nombre": l.nombre,
                "ambito": getattr(l, 'ambito', None)  # Si existe el campo ambito
            }
            for l in localidades
        ]
        
        return {
            "data": items,
            "total": total,
            "message": f"Localidades del municipio {municipio} obtenidas exitosamente",
            "cache": {
                "ttl": 86400,
                "cdn": True
            }
        }
    except Exception as e:
        logger.error(f"Error al obtener localidades: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener localidades"
        )


# ── GET /lenguas — Listar lenguas indígenas ────────────────────────────
@router.get("/lenguas", response_model=dict)
async def get_lenguas(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """GET /catalogos/lenguas — Lista lenguas indígenas para alertas de barrera lingüística (CDN TTL: 24h)"""
    try:
        query = select(Lengua).order_by(Lengua.nombre)
        result = await db.execute(query)
        lenguas = result.scalars().all()
        
        items = [
            LenguaOut(
                id_lengua=l.id_lengua,
                nombre=l.nombre,
                familia=l.familia
            )
            for l in lenguas
        ]
        
        return {
            "data": items,
            "message": "Lenguas indígenas obtenidas exitosamente",
            "cache": {
                "ttl": 86400,
                "cdn": True,
                "note": "Activar alerta de barrera lingüística (alerta_barrera_linguistica) en frontend si id_lengua_materna != None"
            }
        }
    except Exception as e:
        logger.error(f"Error al obtener lenguas: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener lenguas"
        )


# ── Endpoints legacy (mantener retrocompatibilidad) ───────────────────
@router.get("/cie10", response_model=dict)
async def search_cie10(q: str = "", current_user: dict = Depends(get_current_user)):
    """GET /catalogos/cie10?q= — TODO Persona 5"""
    return {"data": [], "message": "TODO: autocompletar de CIE-10 (NOTAS_PENDIENTES)"}


@router.get("/medicamentos", response_model=dict)
async def search_medicamentos(q: str = "", current_user: dict = Depends(get_current_user)):
    """GET /catalogos/medicamentos?q= — TODO Persona 5"""
    return {"data": [], "message": "TODO: búsqueda de medicamentos SSA"}

