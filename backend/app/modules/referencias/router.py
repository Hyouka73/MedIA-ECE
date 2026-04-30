"""
Referencias Médicas (SRC) — Router
Endpoints REST para el Sistema de Referencia y Contrarreferencia.
Adaptado fielmente a la tabla referencias_medicas de la BD.

Columnas reales de la BD:
    id_referencia, id_encuentro_origen, id_establecimiento_destino,
    id_especialidad_destino, estado (EMITIDA|ACEPTADA|RECHAZADA|ATENDIDA),
    motivo_referencia, fecha_emision, fecha_respuesta
"""
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime, timezone
import logging

from app.database.session import get_db
from app.core.deps import get_current_user, require_role

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Constantes ────────────────────────────────────────────────────────────
# Query base con todos los JOINs necesarios para obtener datos derivados
_BASE_SELECT = """
    SELECT
        r.id_referencia,
        r.id_encuentro_origen,
        r.id_establecimiento_destino,
        r.id_especialidad_destino,
        r.estado,
        r.motivo_referencia,
        r.fecha_emision,
        r.fecha_respuesta,
        -- Paciente (vía encuentro)
        p_per.nombre || ' ' || p_per.primer_apellido
            || COALESCE(' ' || p_per.segundo_apellido, '') AS paciente_nombre,
        pac.numero_expediente,
        pac.id_paciente,
        -- Médico emisor (vía encuentro)
        m_per.nombre || ' ' || m_per.primer_apellido AS medico_emisor,
        -- Establecimiento destino
        est.nombre AS establecimiento_destino_nombre,
        est.clues AS establecimiento_destino_clues,
        -- Especialidad destino
        esp.nombre AS especialidad_destino_nombre,
        -- Establecimiento origen (del encuentro)
        est_orig.nombre AS establecimiento_origen_nombre
    FROM referencias_medicas r
    JOIN encuentros_clinicos ec ON r.id_encuentro_origen = ec.id_encuentro
    JOIN pacientes pac ON ec.id_paciente = pac.id_paciente
    JOIN personas p_per ON pac.id_persona = p_per.id_persona
    JOIN usuarios_sistema us ON ec.id_medico = us.id_usuario
    JOIN personas m_per ON us.id_persona = m_per.id_persona
    LEFT JOIN establecimientos est ON r.id_establecimiento_destino = est.id_establecimiento
    LEFT JOIN cat_especialidades_medicas esp ON r.id_especialidad_destino = esp.id_especialidad
    LEFT JOIN establecimientos est_orig ON ec.id_establecimiento = est_orig.id_establecimiento
"""

_COUNT_BASE = """
    SELECT COUNT(*)
    FROM referencias_medicas r
    JOIN encuentros_clinicos ec ON r.id_encuentro_origen = ec.id_encuentro
"""


def _row_to_dict(row):
    """Convierte una fila del query base a diccionario de respuesta."""
    return {
        "id_referencia": str(row[0]),
        "id_encuentro_origen": str(row[1]) if row[1] else None,
        "id_establecimiento_destino": str(row[2]) if row[2] else None,
        "id_especialidad_destino": row[3],
        "estado": row[4],
        "motivo_referencia": row[5],
        "fecha_emision": row[6].isoformat() if row[6] else None,
        "fecha_respuesta": row[7].isoformat() if row[7] else None,
        "paciente_nombre": row[8],
        "numero_expediente": row[9],
        "id_paciente": str(row[10]) if row[10] else None,
        "medico_emisor": row[11],
        "establecimiento_destino": row[12],
        "establecimiento_destino_clues": row[13],
        "especialidad_destino": row[14],
        "establecimiento_origen": row[15],
    }


# ── GET /referencias ──────────────────────────────────────────────────────
@router.get("", response_model=dict)
async def list_referencias(
    current_user: dict = Depends(get_current_user),
    estado: Optional[str] = Query(None, description="Filtrar por estado: EMITIDA, ACEPTADA, RECHAZADA, ATENDIDA"),
    id_paciente: Optional[str] = Query(None, description="Filtrar por ID de paciente"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """GET /referencias — Lista referencias con filtros y paginación."""
    try:
        offset = (page - 1) * limit
        where_clauses = []
        params = {}

        if estado:
            where_clauses.append("r.estado = :estado")
            params["estado"] = estado

        if id_paciente:
            where_clauses.append("ec.id_paciente = :id_paciente")
            params["id_paciente"] = id_paciente

        where_sql = ""
        if where_clauses:
            where_sql = " WHERE " + " AND ".join(where_clauses)

        # Count total
        count_query = _COUNT_BASE + where_sql
        result_count = await db.execute(text(count_query), params)
        total = result_count.scalar() or 0
        total_pages = max((total + limit - 1) // limit, 1)

        # Fetch page
        data_query = _BASE_SELECT + where_sql + f" ORDER BY r.fecha_emision DESC LIMIT {limit} OFFSET {offset}"
        result = await db.execute(text(data_query), params)
        rows = result.fetchall()

        items = [_row_to_dict(row) for row in rows]

        return {
            "data": {
                "items": items,
                "pages": total_pages,
                "total": total,
                "page": page,
                "limit": limit,
            },
            "message": "Lista de referencias obtenida exitosamente",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al listar referencias: {e}")
        raise HTTPException(status_code=500, detail="Error interno al obtener referencias")


# ── GET /referencias/catalogos/establecimientos ──────────────────────────
# NOTA: Estas rutas DEBEN estar ANTES de /{id_referencia} para evitar
# que FastAPI intente parsear "catalogos" como UUID.
@router.get("/catalogos/establecimientos", response_model=dict)
async def list_establecimientos_para_referencia(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Catálogo de establecimientos disponibles para referenciar."""
    try:
        result = await db.execute(
            text("SELECT id_establecimiento, clues, nombre, nivel_atencion FROM establecimientos ORDER BY nombre")
        )
        rows = result.fetchall()
        items = [
            {
                "id_establecimiento": str(r[0]),
                "clues": r[1],
                "nombre": r[2],
                "nivel_atencion": r[3],
            }
            for r in rows
        ]
        return {"data": items, "message": "ok"}
    except Exception as e:
        logger.error(f"Error al listar establecimientos: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener establecimientos")


# ── GET /referencias/catalogos/especialidades ────────────────────────────
@router.get("/catalogos/especialidades", response_model=dict)
async def list_especialidades_para_referencia(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Catálogo de especialidades médicas disponibles."""
    try:
        result = await db.execute(
            text("SELECT id_especialidad, nombre FROM cat_especialidades_medicas ORDER BY nombre")
        )
        rows = result.fetchall()
        items = [
            {"id_especialidad": r[0], "nombre": r[1]}
            for r in rows
        ]
        return {"data": items, "message": "ok"}
    except Exception as e:
        logger.error(f"Error al listar especialidades: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener especialidades")


# ── GET /referencias/{id} ────────────────────────────────────────────────
@router.get("/{id_referencia}", response_model=dict)
async def get_referencia(
    id_referencia: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """GET /referencias/{id} — Detalle completo de una referencia."""
    try:
        query = _BASE_SELECT + " WHERE r.id_referencia = :id"
        result = await db.execute(text(query), {"id": str(id_referencia)})
        row = result.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Referencia no encontrada")

        return {
            "data": _row_to_dict(row),
            "message": "Referencia obtenida exitosamente",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener referencia {id_referencia}: {e}")
        raise HTTPException(status_code=500, detail="Error interno al obtener la referencia")


# ── POST /referencias ────────────────────────────────────────────────────
@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_referencia(
    data: dict,
    current_user: dict = Depends(
        require_role("MEDICO_GENERAL", "ESPECIALISTA", "SUPERADMIN", "OMNIADMIN")
    ),
    db: AsyncSession = Depends(get_db),
):
    """POST /referencias — Emite una nueva referencia médica.

    Campos requeridos (mapeados a la BD):
        - id_encuentro_origen: UUID del encuentro clínico activo
        - id_establecimiento_destino: UUID del establecimiento destino
        - id_especialidad_destino: INT id de la especialidad destino
        - motivo_referencia: TEXT motivo clínico
    """
    try:
        id_encuentro_origen = data.get("id_encuentro_origen")
        id_establecimiento_destino = data.get("id_establecimiento_destino")
        id_especialidad_destino = data.get("id_especialidad_destino")
        motivo_referencia = (data.get("motivo_referencia") or "").strip()

        # Validaciones
        if not id_encuentro_origen:
            raise HTTPException(status_code=422, detail="id_encuentro_origen es requerido")
        if not id_establecimiento_destino:
            raise HTTPException(status_code=422, detail="id_establecimiento_destino es requerido")
        if not id_especialidad_destino:
            raise HTTPException(status_code=422, detail="id_especialidad_destino es requerido")
        if not motivo_referencia:
            raise HTTPException(status_code=422, detail="motivo_referencia es requerido")

        # Validar que el encuentro existe
        enc_result = await db.execute(
            text("SELECT id_encuentro FROM encuentros_clinicos WHERE id_encuentro = :id"),
            {"id": str(id_encuentro_origen)},
        )
        if not enc_result.fetchone():
            raise HTTPException(status_code=404, detail="Encuentro clínico no encontrado")

        # Validar que el establecimiento destino existe
        est_result = await db.execute(
            text("SELECT id_establecimiento FROM establecimientos WHERE id_establecimiento = :id"),
            {"id": str(id_establecimiento_destino)},
        )
        if not est_result.fetchone():
            raise HTTPException(status_code=404, detail="Establecimiento destino no encontrado")

        # Validar que la especialidad destino existe
        esp_result = await db.execute(
            text("SELECT id_especialidad FROM cat_especialidades_medicas WHERE id_especialidad = :id"),
            {"id": int(id_especialidad_destino)},
        )
        if not esp_result.fetchone():
            raise HTTPException(status_code=404, detail="Especialidad destino no encontrada")

        # Insertar referencia — estado inicial EMITIDA
        insert_query = text("""
            INSERT INTO referencias_medicas
                (id_encuentro_origen, id_establecimiento_destino,
                 id_especialidad_destino, estado, motivo_referencia)
            VALUES
                (:enc, :est, :esp, 'EMITIDA', :motivo)
            RETURNING id_referencia, fecha_emision
        """)

        result = await db.execute(insert_query, {
            "enc": str(id_encuentro_origen),
            "est": str(id_establecimiento_destino),
            "esp": int(id_especialidad_destino),
            "motivo": motivo_referencia,
        })

        row = result.fetchone()
        await db.commit()

        return {
            "data": {
                "id_referencia": str(row[0]),
                "fecha_emision": row[1].isoformat() if row[1] else None,
                "estado": "EMITIDA",
            },
            "message": "Referencia médica emitida exitosamente",
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al crear referencia: {e}")
        raise HTTPException(status_code=500, detail="Error interno al crear la referencia")


# ── PUT /referencias/{id}/responder ──────────────────────────────────────
@router.put("/{id_referencia}/responder", response_model=dict)
async def responder_referencia(
    id_referencia: UUID,
    data: dict,
    current_user: dict = Depends(
        require_role("MEDICO_GENERAL", "ESPECIALISTA", "SUPERADMIN", "OMNIADMIN")
    ),
    db: AsyncSession = Depends(get_db),
):
    """PUT /referencias/{id}/responder — Aceptar o rechazar una referencia.

    Body:
        - estado: 'ACEPTADA' o 'RECHAZADA'
    """
    try:
        nuevo_estado = data.get("estado", "").upper()
        if nuevo_estado not in ("ACEPTADA", "RECHAZADA"):
            raise HTTPException(
                status_code=422,
                detail="Estado debe ser 'ACEPTADA' o 'RECHAZADA'",
            )

        # Verificar que la referencia existe y está en estado EMITIDA
        check = await db.execute(
            text("SELECT estado FROM referencias_medicas WHERE id_referencia = :id"),
            {"id": str(id_referencia)},
        )
        row = check.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Referencia no encontrada")
        if row[0] != "EMITIDA":
            raise HTTPException(
                status_code=400,
                detail=f"No se puede responder una referencia en estado '{row[0]}'. Solo se puede responder en estado EMITIDA.",
            )

        # Actualizar estado y fecha_respuesta
        await db.execute(
            text("""
                UPDATE referencias_medicas
                SET estado = :estado, fecha_respuesta = :fecha
                WHERE id_referencia = :id
            """),
            {
                "id": str(id_referencia),
                "estado": nuevo_estado,
                "fecha": datetime.now(timezone.utc),
            },
        )
        await db.commit()

        return {
            "data": {"id_referencia": str(id_referencia), "estado": nuevo_estado},
            "message": f"Referencia {nuevo_estado.lower()} exitosamente",
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al responder referencia {id_referencia}: {e}")
        raise HTTPException(status_code=500, detail="Error al responder la referencia")


# ── PUT /referencias/{id}/cancelar ───────────────────────────────────────
@router.put("/{id_referencia}/cancelar", response_model=dict)
async def cancelar_referencia(
    id_referencia: UUID,
    current_user: dict = Depends(
        require_role("MEDICO_GENERAL", "ESPECIALISTA", "SUPERADMIN", "OMNIADMIN")
    ),
    db: AsyncSession = Depends(get_db),
):
    """PUT /referencias/{id}/cancelar — Rechaza/cancela una referencia emitida.

    La BD no tiene estado CANCELADA; se usa RECHAZADA como equivalente funcional.
    Solo se puede cancelar si está en estado EMITIDA.
    """
    try:
        # Verificar que la referencia existe y está en estado EMITIDA
        check = await db.execute(
            text("SELECT estado FROM referencias_medicas WHERE id_referencia = :id"),
            {"id": str(id_referencia)},
        )
        row = check.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Referencia no encontrada")
        if row[0] != "EMITIDA":
            raise HTTPException(
                status_code=400,
                detail=f"No se puede cancelar una referencia en estado '{row[0]}'. Solo se puede cancelar en estado EMITIDA.",
            )

        await db.execute(
            text("""
                UPDATE referencias_medicas
                SET estado = 'RECHAZADA', fecha_respuesta = :fecha
                WHERE id_referencia = :id
            """),
            {
                "id": str(id_referencia),
                "fecha": datetime.now(timezone.utc),
            },
        )
        await db.commit()

        return {
            "data": {"id_referencia": str(id_referencia), "estado": "RECHAZADA"},
            "message": "Referencia cancelada exitosamente",
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al cancelar referencia {id_referencia}: {e}")
        raise HTTPException(status_code=500, detail="Error al cancelar la referencia")


# ── PUT /referencias/{id}/atender ────────────────────────────────────────
@router.put("/{id_referencia}/atender", response_model=dict)
async def atender_referencia(
    id_referencia: UUID,
    current_user: dict = Depends(
        require_role("MEDICO_GENERAL", "ESPECIALISTA", "SUPERADMIN", "OMNIADMIN")
    ),
    db: AsyncSession = Depends(get_db),
):
    """PUT /referencias/{id}/atender — Marca una referencia aceptada como atendida."""
    try:
        check = await db.execute(
            text("SELECT estado FROM referencias_medicas WHERE id_referencia = :id"),
            {"id": str(id_referencia)},
        )
        row = check.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Referencia no encontrada")
        if row[0] != "ACEPTADA":
            raise HTTPException(
                status_code=400,
                detail=f"Solo se puede marcar como atendida una referencia ACEPTADA. Estado actual: '{row[0]}'",
            )

        await db.execute(
            text("""
                UPDATE referencias_medicas
                SET estado = 'ATENDIDA', fecha_respuesta = :fecha
                WHERE id_referencia = :id
            """),
            {
                "id": str(id_referencia),
                "fecha": datetime.now(timezone.utc),
            },
        )
        await db.commit()

        return {
            "data": {"id_referencia": str(id_referencia), "estado": "ATENDIDA"},
            "message": "Referencia marcada como atendida",
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al marcar referencia como atendida: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar la referencia")
