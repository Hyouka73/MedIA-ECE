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
    EncuentroCerrarIn, EncuentroPacienteOut,
    NotaSOAPCreateIn, NotaSOAPUpdateIn, NotaSOAPOut,
    NotaEnmiendaCreateIn, NotaEnmiendaOut, CIE10ListOut
)
import logging
from pydantic import BaseModel


from app.services.encuentros import encuentro_service


from app.models.auth import CatMedicamento, Alergia, AuditoriaAcceso, CatCIE10


logger = logging.getLogger(__name__)
router = APIRouter()


# ─── SCHEMA DEFINIDO LOCALMENTE (evita ImportError de schemas) ──────────
class PrescripcionCreate(BaseModel):
    id_paciente: UUID
    id_medicamento: str
    posologia: str = "1 cada 8 horas"
    duracion_dias: int = 3
    indicaciones_adicionales: Optional[str] = None
    confirmar_alergia: Optional[bool] = False


# ── GET /encuentros ────────────────────────────────────────────────────
@router.get("", response_model=dict)
async def list_encuentros(
    current_user: dict = Depends(get_current_user),
    id_paciente: Optional[UUID] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """GET /encuentros — Lista encuentros clínicos"""
    try:
        offset = (page - 1) * limit

        if id_paciente:
            try:
                from app.services.acceso import check_regla_1
                tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
                if not tiene_acceso:
                    logger.warning(f"Acceso denegado en verificación para {current_user['sub']}")
            except ImportError:
                logger.info("Servicio de acceso no disponible (opcional)")

        query = """
            SELECT
                e.id_encuentro,
                e.id_paciente,
                e.id_medico,
                e.id_establecimiento,
                e.id_especialidad,
                e.fecha_inicio,
                e.fecha_cierre,
                e.motivo_consulta
            FROM encuentros_clinicos e
            WHERE 1=1
        """

        count_query = """
            SELECT COUNT(*)
            FROM encuentros_clinicos e
            WHERE 1=1
        """

        params = {}

        if id_paciente:
            query += " AND e.id_paciente = :id_paciente"
            count_query += " AND e.id_paciente = :id_paciente"
            params["id_paciente"] = str(id_paciente)
        else:
            query += " AND e.id_medico = :id_medico"
            count_query += " AND e.id_medico = :id_medico"
            params["id_medico"] = current_user["sub"]

        result_count = await db.execute(text(count_query), params)
        total = result_count.scalar() or 0
        total_pages = (total + limit - 1) // limit if total else 1

        query_paged = query + f" ORDER BY e.fecha_inicio DESC LIMIT {limit} OFFSET {offset}"
        result = await db.execute(text(query_paged), params)
        encuentros = result.fetchall()

        items = [
            {
                "id_encuentro": str(row[0]),
                "id_paciente": str(row[1]) if row[1] else None,
                "id_medico": str(row[2]) if row[2] else None,
                "id_establecimiento": str(row[3]) if row[3] else None,
                "id_especialidad": row[4],
                "fecha_inicio": row[5].isoformat() if row[5] else None,
                "fecha_cierre": row[6].isoformat() if row[6] else None,
                "motivo_consulta": row[7],
                "diagnostico": None
            }
            for row in encuentros
        ]

        return {
            "data": {
                "items": items,
                "pages": total_pages,
                "total": total,
                "page": page,
                "limit": limit
            },
            "message": "Lista de encuentros obtenida exitosamente"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener encuentros: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al obtener encuentros")


# ── POST /encuentros ────────────────────────────────────────────────────
@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_encuentro(
    data: dict,
    current_user: dict = Depends(
        require_role("MEDICO_GENERAL", "ESPECIALISTA", "SUPERADMIN")
    ),
    db: AsyncSession = Depends(get_db),
):
    """POST /encuentros — Crea un encuentro VALIDANDO CIE-10 y guardando el diagnóstico en diagnosticos_encuentro"""
    try:
        id_paciente = data.get("id_paciente")
        id_establecimiento = data.get("id_establecimiento")
        id_especialidad = data.get("id_especialidad")
        id_cie10 = data.get("id_diagnostico")  # ← código CIE-10 (ej: "A09")
        motivo_consulta = data.get("motivo_consulta", "").strip()
        id_medico = UUID(current_user["sub"])

        if not id_paciente or not motivo_consulta:
            raise HTTPException(
                status_code=422,
                detail="id_paciente y motivo_consulta son requeridos"
            )

        # Validar que el código CIE-10 exista
        if not id_cie10:
            raise HTTPException(
                status_code=400, detail="id_diagnostico (código CIE-10) es requerido"
            )

        stmt_cie = select(CatCIE10).where(CatCIE10.codigo_cie == id_cie10)
        res_cie = await db.execute(stmt_cie)
        cie10 = res_cie.scalar_one_or_none()

        if not cie10:
            raise HTTPException(
                status_code=400,
                detail=f"Código CIE-10 '{id_cie10}' no válido en cat_cie10"
            )

        # Conversión de id_establecimiento:
        # - si es None o "None" → None
        # - si es UUID → str(uuid)
        if not id_establecimiento or id_establecimiento in (None, "None"):
            id_establecimiento = None
        else:
            try:
                id_establecimiento = str(UUID(id_establecimiento))
            except Exception:
                raise HTTPException(status_code=400, detail="id_establecimiento debe ser UUID o None")

        # Crear el id_encuentro
        id_encuentro = str(uuid4())
        fecha_inicio = datetime.now(timezone.utc)

        # Insertar ENCUENTRO (sin id_diagnostico)
        try:
            await db.execute(
                text("""
                    INSERT INTO encuentros_clinicos
                    (
                        id_encuentro, id_paciente, id_medico,
                        id_establecimiento, id_especialidad,
                        fecha_inicio, motivo_consulta
                    )
                    VALUES
                        (:id, :pac, :med, :est, :esp, :fecha, :mot)
                """),
                {
                    "id": id_encuentro,
                    "pac": str(id_paciente),
                    "med": str(id_medico),
                    "est": id_establecimiento,
                    "esp": id_especialidad,
                    "fecha": fecha_inicio,
                    "mot": motivo_consulta
                },
            )
        except Exception as e:
            await db.rollback()
            logger.error(f"Error al insertar encuentro: {e}")
            raise HTTPException(
                status_code=500,
                detail="Error al crear el encuentro clínico"
            )

        # Insertar DIAGNÓSTICO en diagnosticos_encuentro
        try:
            id_diagnostico_pk = str(uuid4())

            await db.execute(
                text("""
                    INSERT INTO diagnosticos_encuentro
                    (id_diagnostico, id_encuentro, codigo_cie)
                    VALUES (:id_diag, :id_enc, :codigo_cie)
                """),
                {
                    "id_diag": id_diagnostico_pk,
                    "id_enc": id_encuentro,
                    "codigo_cie": id_cie10,
                },
            )
        except Exception as e:
            await db.rollback()
            logger.error(f"Error al insertar diagnóstico: {e}")
            raise HTTPException(
                status_code=500,
                detail="Error al guardar el diagnóstico CIE-10 del encuentro"
            )

        await db.commit()

        return {
            "data": {
                "id_encuentro": id_encuentro,
                "fecha_inicio": fecha_inicio.isoformat(),
                "id_cie10": id_cie10,
            },
            "message": "Encuentro clínico y diagnóstico CIE-10 creados exitosamente",
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error general al crear encuentro: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al crear encuentro")


# ── PATCH /encuentros/{id}/cerrar ──────────────────────────────────────
@router.patch("/{id_encuentro}/cerrar", response_model=dict)
async def cerrar_encuentro(
    id_encuentro: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """PATCH /encuentros/{id}/cerrar — Cierre irreversible por el autor"""
    try:
        result = await db.execute(
            text("SELECT id_medico, fecha_cierre FROM encuentros_clinicos WHERE id_encuentro = :id"),
            {"id": str(id_encuentro)}
        )
        encuentro = result.fetchone()

        if not encuentro:
            raise HTTPException(status_code=404, detail="Encuentro no encontrado")
        if str(encuentro[0]) != current_user["sub"]:
            raise HTTPException(status_code=403, detail="No autorizado (no es el autor)")
        if encuentro[1] is not None:
            raise HTTPException(status_code=400, detail="Ya está cerrado")

        await db.execute(
            text("UPDATE encuentros_clinicos SET fecha_cierre = :fecha WHERE id_encuentro = :id"),
            {"id": str(id_encuentro), "fecha": datetime.now(timezone.utc)}
        )
        await db.commit()

        return {"message": "Encuentro clínico cerrado exitosamente"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al cerrar encuentro: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al cerrar encuentro")


# ─── ENDPOINTS DE RESPALDO (usando encuentro_service) ───────────────────

@router.post("/", response_model=EncuentroOut, status_code=201)
async def crear_encuentro_bck(
    data: EncuentroCreateIn,
    current_user: dict = Depends(
        require_role("MEDICO_GENERAL", "ESPECIALISTA", "SUPERADMIN")
    ),
    db: AsyncSession = Depends(get_db),
):
    """POST /encuentros/ — Respaldo usando encuentro_service"""
    id_medico = UUID(current_user["id"])
    id_establecimiento = UUID(current_user.get("establecimiento", "CSSSA023999"))

    encuentro = await encuentro_service.crear_encuentro(
        db=db,
        data=data,
        id_medico=id_medico,
        id_establecimiento=id_establecimiento
    )

    return EncuentroOut(
        id_encuentro=encuentro.id_encuentro,
        id_paciente=encuentro.id_paciente,
        id_medico=encuentro.id_medico,
        id_establecimiento=encuentro.id_establecimiento,
        id_especialidad=encuentro.id_especialidad,
        fecha_inicio=encuentro.fecha_inicio,
        fecha_cierre=encuentro.fecha_cierre,
        motivo_consulta=encuentro.motivo_consulta,
        tipo_consulta=encuentro.tipo_consulta,
    )


@router.get("/activos", response_model=List[EncuentroOut])
async def listar_encuentros_activos(
    current_user: dict = Depends(
        require_role("MEDICO_GENERAL", "ESPECIALISTA", "ENFERMERIA", "SUPERADMIN")
    ),
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """GET /encuentros/activos — Lista encuentros activos del establecimiento"""
    id_establecimiento = UUID(current_user.get("establecimiento", "CSSSA023999"))

    encuentros = await encuentro_service.listar_encuentros_activos(
        db=db,
        id_establecimiento=id_establecimiento,
        skip=skip,
        limit=limit,
    )

    return [
        EncuentroOut(
            id_encuentro=e.id_encuentro,
            id_paciente=e.id_paciente,
            id_medico=e.id_medico,
            id_establecimiento=e.id_establecimiento,
            id_especialidad=e.id_especialidad,
            fecha_inicio=e.fecha_inicio,
            fecha_cierre=e.fecha_cierre,
            motivo_consulta=e.motivo_consulta,
            tipo_consulta=e.tipo_consulta,
            paciente_numero_expediente=e.paciente.numero_expediente if e.paciente else None,
            paciente_nombre=f"{e.paciente.persona.nombre} {e.paciente.persona.primer_apellido}"
                           if e.paciente and e.paciente.persona else None,
            medico_nombre=f"{e.medico.persona.nombre} {e.medico.persona.primer_apellido}"
                         if e.medico and e.medico.persona else None,
            establecimiento_nombre=e.establecimiento.nombre if e.establecimiento else None,
        )
        for e in encuentros
    ]


@router.get("/{id}", response_model=EncuentroDetalleOut)
async def obtener_encuentro(
    id: UUID,
    current_user: dict = Depends(
        require_role("MEDICO_GENERAL", "ESPECIALISTA", "ENFERMERIA", "SUPERADMIN")
    ),
    db: AsyncSession = Depends(get_db),
):
    """GET /encuentros/{id} — Detalle completo del encuentro"""
    id_usuario = UUID(current_user["id"])

    encuentro = await encuentro_service.obtener_encuentro(
        db=db,
        id_encuentro=id,
        id_usuario=id_usuario,
    )

    return EncuentroDetalleOut(
        id_encuentro=encuentro.id_encuentro,
        id_paciente=encuentro.id_paciente,
        id_medico=encuentro.id_medico,
        id_establecimiento=encuentro.id_establecimiento,
        id_especialidad=encuentro.id_especialidad,
        fecha_inicio=encuentro.fecha_inicio,
        fecha_cierre=encuentro.fecha_cierre,
        motivo_consulta=encuentro.motivo_consulta,
        tipo_consulta=encuentro.tipo_consulta,
        paciente_numero_expediente=encuentro.paciente.numero_expediente if encuentro.paciente else None,
        paciente_nombre=f"{encuentro.paciente.persona.nombre} {encuentro.paciente.persona.primer_apellido}"
                       if encuentro.paciente and encuentro.paciente.persona else None,
        medico_nombre=f"{encuentro.medico.persona.nombre} {encuentro.medico.persona.primer_apellido}"
                     if encuentro.medico and encuentro.medico.persona else None,
        establecimiento_nombre=encuentro.establecimiento.nombre if encuentro.establecimiento else None,
        notas=[],
        signos_vitales=None,
        diagnosticos=[],
    )