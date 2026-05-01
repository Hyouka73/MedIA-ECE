from fastapi import APIRouter, Depends, Query, Body, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, or_, and_
from app.database.session import get_db
from app.core.deps import require_role
from app.models.auth import AuditoriaAcceso, IncidenteSeguridad

router = APIRouter()

ESTADOS_INCIDENTE = {"ABIERTO", "ENINVESTIGACION", "ERRADICADO", "CERRADO"}
TRANSICIONES_VALIDAS = {
    "ABIERTO": {"ENINVESTIGACION", "CERRADO"},
    "ENINVESTIGACION": {"ERRADICADO", "CERRADO"},
    "ERRADICADO": {"CERRADO"},
    "CERRADO": set(),
}


def critico_condition():
    return or_(
        AuditoriaAcceso.nivel_severidad == "CRITICO",
        AuditoriaAcceso.nivel_severidad == "CRITICA",
        AuditoriaAcceso.nivel_severidad == "ALTO"
    )


def critico_activo_condition():
    # Un incidente es activo si existe en incidentes_seguridad y su estado no es final
    return and_(
        critico_condition(),
        or_(
            IncidenteSeguridad.estado.is_(None),
            IncidenteSeguridad.estado.not_in(["RESUELTO", "FALSO_POSITIVO", "ERRADICADO", "CERRADO"])
        )
    )


@router.get("")
async def get_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=5000),
    solo_criticos: bool = Query(False),
    solo_criticos_activos: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "OMNIADMIN", "AUDITOR_SEGURIDAD"))
):
    offset = (page - 1) * limit

    query = select(AuditoriaAcceso).join(
        IncidenteSeguridad, 
        AuditoriaAcceso.id_auditoria == IncidenteSeguridad.id_auditoria,
        isouter=True
    )

    if solo_criticos_activos:
        query = query.where(critico_activo_condition())
    elif solo_criticos:
        query = query.where(critico_condition())

    query = query.order_by(AuditoriaAcceso.timestamp_evento.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    logs = result.scalars().all()

    count_query = select(func.count()).select_from(AuditoriaAcceso)
    if solo_criticos_activos:
        count_query = count_query.where(critico_activo_condition())
    elif solo_criticos:
        count_query = count_query.where(critico_condition())

    total = await db.scalar(count_query)

    return {
        "items": logs,
        "total": total or 0,
        "page": page,
        "limit": limit
    }


@router.get("/stats")
async def get_audit_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "OMNIADMIN", "AUDITOR_SEGURIDAD"))
):
    total = await db.scalar(
        select(func.count()).select_from(AuditoriaAcceso)
    )

    eventos_hoy = await db.scalar(
        select(func.count())
        .select_from(AuditoriaAcceso)
        .where(func.date(AuditoriaAcceso.timestamp_evento) == func.current_date())
    )

    criticos = await db.scalar(
        select(func.count())
        .select_from(AuditoriaAcceso)
        .join(IncidenteSeguridad, AuditoriaAcceso.id_auditoria == IncidenteSeguridad.id_auditoria)
        .where(critico_activo_condition())
    )

    return {
        "total": total or 0,
        "criticos": criticos or 0,
        "eventos_hoy": eventos_hoy or 0
    }


@router.get("/incidentes/criticos")
async def get_incidentes_criticos(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "OMNIADMIN", "AUDITOR_SEGURIDAD"))
):
    offset = (page - 1) * limit

    query = (
        select(AuditoriaAcceso)
        .join(IncidenteSeguridad, AuditoriaAcceso.id_auditoria == IncidenteSeguridad.id_auditoria)
        .where(critico_activo_condition())
        .order_by(AuditoriaAcceso.timestamp_evento.desc())
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(query)
    items = result.scalars().all()

    total = await db.scalar(
        select(func.count())
        .select_from(AuditoriaAcceso)
        .where(critico_activo_condition())
    )

    return {
        "items": items,
        "total": total or 0,
        "page": page,
        "limit": limit
    }


@router.patch("/incidentes/{id_log}/estado")
async def update_incidente_status(
    id_log: int,
    payload: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "OMNIADMIN"))
):
    # Mapeo de estados del frontend a los estados permitidos en el CHECK constraint de la BD
    MAPA_ESTADOS = {
        "ABIERTO": "NUEVO",
        "NUEVO": "NUEVO",
        "ENINVESTIGACION": "EN_INVESTIGACION",
        "EN_INVESTIGACION": "EN_INVESTIGACION",
        "ERRADICADO": "RESUELTO", 
        "CERRADO": "RESUELTO",
        "RESUELTO": "RESUELTO",
        "FALSO_POSITIVO": "FALSO_POSITIVO"
    }

    estado_raw = str(payload.get("estado", "")).strip().upper()
    nuevo_estado_db = MAPA_ESTADOS.get(estado_raw)

    if not nuevo_estado_db:
        raise HTTPException(status_code=400, detail=f"Estado '{estado_raw}' no es válido")

    # Buscar si ya existe el registro en incidentes_seguridad
    incidente_gestion = await db.scalar(
        select(IncidenteSeguridad).where(IncidenteSeguridad.id_auditoria == id_log)
    )

    if not incidente_gestion:
        # Si no existe, lo creamos
        incidente_gestion = IncidenteSeguridad(
            id_auditoria=id_log,
            estado="NUEVO"
        )
        db.add(incidente_gestion)
        await db.flush()

    # Validar severidad en el log original
    log_original = await db.get(AuditoriaAcceso, id_log)
    if not log_original:
        raise HTTPException(status_code=404, detail="Log de auditoría no encontrado")

    # Actualizar solo la tabla de gestión de incidentes
    incidente_gestion.estado = nuevo_estado_db
    
    # Nuevos campos forenses (Doc 6, Fase 3-5)
    if "notas" in payload:
        incidente_gestion.notas_investigacion = str(payload["notas"]).strip()
    
    if "asignado_a" in payload:
        incidente_gestion.asignado_a = payload["asignado_a"]

    if nuevo_estado_db == "RESUELTO":
        incidente_gestion.fecha_resolucion = func.now()

    await db.commit()

    return {
        "status": "success",
        "message": f"Gestión de incidente actualizada a {nuevo_estado_db}",
        "id_auditoria": id_log
    }