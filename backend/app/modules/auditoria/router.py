from fastapi import APIRouter, Depends, Query, Body, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, or_, and_
from app.database.session import get_db
from app.core.deps import require_role
from app.models.auth import AuditoriaAcceso

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
    return and_(
        critico_condition(),
        or_(
            AuditoriaAcceso.resultado.is_(None),
            AuditoriaAcceso.resultado.not_in(["ERRADICADO", "CERRADO", "RESUELTO"])
        )
    )


@router.get("")
async def get_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=1000),
    solo_criticos: bool = Query(False),
    solo_criticos_activos: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "OMNIADMIN", "AUDITOR_SEGURIDAD"))
):
    offset = (page - 1) * limit

    query = select(AuditoriaAcceso)

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
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "OMNIADMIN", "AUDITOR_SEGURIDAD"))
):
    offset = (page - 1) * limit

    query = (
        select(AuditoriaAcceso)
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
    nuevo_estado = str(payload.get("estado", "")).strip().upper()

    if nuevo_estado not in ESTADOS_INCIDENTE:
        raise HTTPException(status_code=400, detail="Estado inválido")

    incidente = await db.scalar(
        select(AuditoriaAcceso).where(AuditoriaAcceso.id_auditoria == id_log)
    )

    if not incidente:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")

    severidad = (incidente.nivel_severidad or "").strip().upper()
    if severidad not in {"CRITICO", "CRITICA", "ALTO"}:
        raise HTTPException(status_code=400, detail="Solo se pueden gestionar incidentes de severidad ALTA o CRÍTICA")

    estado_actual = (incidente.resultado or "ABIERTO").strip().upper()
    if estado_actual not in ESTADOS_INCIDENTE:
        estado_actual = "ABIERTO"

    if nuevo_estado == estado_actual:
        raise HTTPException(status_code=409, detail="El incidente ya tiene ese estado")

    if nuevo_estado not in TRANSICIONES_VALIDAS.get(estado_actual, set()):
        raise HTTPException(
            status_code=409,
            detail=f"Transición inválida: {estado_actual} -> {nuevo_estado}"
        )

    await db.execute(
        update(AuditoriaAcceso)
        .where(AuditoriaAcceso.id_auditoria == id_log)
        .values(resultado=nuevo_estado)
        .execution_options(synchronize_session="fetch")
    )

    await db.commit()

    return {
        "status": "success",
        "message": f"Incidente actualizado de {estado_actual} a {nuevo_estado}"
    }