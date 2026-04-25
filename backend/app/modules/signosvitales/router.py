from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from uuid import UUID
import logging

from app.database.session import get_db
from app.core.deps import get_current_user, require_role
from app.schemas.signosvitales import SignosVitalesCreateIn

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/signos-vitales", tags=["Signos Vitales"])

# --- POST: Registro con validación S4 y NOM-004 ---
@router.post("", status_code=status.HTTP_201_CREATED)
async def registrar_signos(
    data: SignosVitalesCreateIn,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("ENFERMERO", "MEDICO_GENERAL", "ESPECIALISTA"))
):
    try:
        # Trazabilidad NOM-004: No enviamos fecha, la DB usa su CURRENT_TIMESTAMP
        query = text("""
            INSERT INTO signos_vitales 
            (id_encuentro, id_enfermero, presion_sistolica, presion_diastolica, 
             temperatura_c, saturacion_oxigeno, frecuencia_cardiaca, 
             frecuencia_respiratoria, peso_kg, talla_cm)
            VALUES (:id_e, :id_u, :ps, :pd, :temp, :sat, :fc, :fr, :peso, :talla)
            RETURNING id_signos
        """)
        
        result = await db.execute(query, {
            "id_e": data.id_encuentro,
            "id_u": current_user["sub"],
            "ps": data.presion_sistolica,
            "pd": data.presion_diastolica,
            "temp": data.temperatura_c,
            "sat": data.saturacion_oxigeno,
            "fc": data.frecuencia_cardiaca,
            "fr": data.frecuencia_respiratoria,
            "peso": data.peso_kg,
            "talla": data.talla_cm
        })
        await db.commit()
        return {"id": str(result.scalar()), "message": "Signos vitales registrados exitosamente"}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error registrando signos: {str(e)}")
        raise HTTPException(status_code=400, detail="Error al guardar los signos vitales")

# --- GET: Consulta usando la vista de P3 ---
@router.get("", response_model=dict)
async def obtener_signos_encuentro(
    id_encuentro: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Retorna los signos del encuentro activo usando la vista v_signos_encuentro"""
    try:
        query = text("SELECT * FROM v_signos_encuentro WHERE id_encuentro = :id_e")
        result = await db.execute(query, {"id_e": id_encuentro})
        row = result.fetchone()
        
        if not row:
            return {"data": None, "message": "No hay signos registrados para este encuentro"}
            
        # ._asdict() es necesario para convertir la fila de SQLAlchemy a un diccionario JSON
        return {"data": row._asdict(), "message": "Signos obtenidos correctamente"}
    except Exception as e:
        logger.error(f"Error consultando vista P3: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al consultar los signos")
