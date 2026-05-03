"""
Encuentros Clínicos — Router
Endpoints REST para gestión de encuentros clínicos
"""
from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, delete
from uuid import UUID as uuid, uuid4
from datetime import datetime, timezone


from app.database.session import get_db
from app.core.deps import get_current_user, require_role
from app.schemas.encuentros import (
    EncuentroCreateIn, EncuentroOut, EncuentroDetalleOut,
    EncuentroCerrarIn, EncuentroPacienteOut
) 
from app.schemas.laboratorio import SolicitudEstudioCreate

from app.schemas.notas_soap import (
    NotaSOAPCreateIn, NotaSOAPUpdateIn, NotaSOAPOut,
    NotaEnmiendaCreateIn, NotaEnmiendaOut, CIE10ListOut
)
import logging
from pydantic import BaseModel


from app.services.encuentros import encuentro_service


from app.models.auth import CatMedicamento, Alergia, AuditoriaAcceso, CatCIE10


logger = logging.getLogger(__name__)
router = APIRouter()


# GET /solicitudes-estudio?id_encuentro={id}
@router.get("/", response_model=dict) # El prefijo ya es /solicitudes-estudio
async def get_solicitudes_estudio(
    id_encuentro: UUID = Query(...), 
    db: AsyncSession = Depends(get_db)
):
    """Obtiene las solicitudes de estudio filtradas por encuentro y ordenadas por urgencia."""
    try:
        query = text("""
            SELECT 
                se.id_solicitud,
                se.id_encuentro,
                se.tipo_estudio,
                se.descripcion,
                se.indicacion_clinica,
                se.id_cie10_relacionado,
                se.urgente,
                se.fecha_solicitud,
                (SELECT COUNT(*) FROM resultados_laboratorio rl WHERE rl.id_solicitud = se.id_solicitud) AS num_resultados
            FROM solicitudes_estudio se
            WHERE se.id_encuentro = :id_e
            ORDER BY se.urgente DESC, se.fecha_solicitud DESC
        """)

        result = await db.execute(query, {"id_e": str(id_encuentro)})
        rows = result.mappings().all()

        return {
            "data": [dict(row) for row in rows],
            "message": "Solicitudes obtenidas"
        }
    except Exception as e:
        logger.error(f"Error GET solicitudes: {e}")
        raise HTTPException(status_code=500, detail="Error interno")

# POST /solicitudes-estudio
@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_solicitud_estudio(
    data: SolicitudEstudioCreate,
    current_user: dict = Depends(require_role("MEDICO_GENERAL", "ESPECIALISTA", "SUPERADMIN")),
    db: AsyncSession = Depends(get_db)
):
    """Crea una solicitud de estudio. El id_encuentro viene en el body."""
    try:
        # 1. Validar encuentro abierto
        res_enc = await db.execute(
            text("SELECT fecha_cierre FROM encuentros_clinicos WHERE id_encuentro = :id"),
            {"id": str(data.id_encuentro)}
        )
        enc = res_enc.fetchone()

        if not enc:
            raise HTTPException(status_code=404, detail="Encuentro no encontrado")
        if enc[0] is not None:
            raise HTTPException(status_code=400, detail="El encuentro ya está cerrado")

        # 2. Validar CIE-10 si existe
        if data.id_cie10_relacionado:
            res_cie = await db.execute(
                select(CatCIE10).where(CatCIE10.codigo_cie == data.id_cie10_relacionado)
            )
            if not res_cie.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Código CIE-10 no válido")

        # 3. Insertar
        result = await db.execute(
            text("""
                INSERT INTO solicitudes_estudio
                (id_encuentro, tipo_estudio, descripcion, urgente, indicacion_clinica, id_cie10_relacionado)
                VALUES (:id_e, :tipo, :desc, :urgente, :indicacion, :cie)
                RETURNING id_solicitud
            """),
            {
                "id_e": str(data.id_encuentro),
                "tipo": data.tipo_estudio,
                "desc": data.indicacion_clinica or f"Estudio de {data.tipo_estudio}",
                "urgente": data.urgente,
                "indicacion": data.indicacion_clinica,
                "cie": data.id_cie10_relacionado
            }
        )

        await db.commit()
        return {
            "id_solicitud": str(result.scalar()),
            "message": "Solicitud creada exitosamente"
        }
    except Exception as e:
        await db.rollback()
        raise e
