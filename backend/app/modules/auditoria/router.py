from fastapi import APIRouter, Depends, Query, Body, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, or_, and_
from app.database.session import get_db
from app.core.deps import require_role
from app.models.auth import AuditoriaAcceso

router = APIRouter()


def critico_condition():
    return or_(
        AuditoriaAcceso.nivel_severidad == "CRITICO",
        AuditoriaAcceso.nivel_severidad == "CRITICA"
    )


def critico_activo_condition():
    return and_(
        critico_condition(),
        or_(
            AuditoriaAcceso.resultado.is_(None),
            AuditoriaAcceso.resultado != "RESUELTO"
        )
    )


@router.get("")
async def get_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
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
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "OMNIADMIN", "AUDITOR_SEGURIDAD"))
):
    query = (
        select(AuditoriaAcceso)
        .where(critico_activo_condition())
        .order_by(AuditoriaAcceso.timestamp_evento.desc())
        .limit(limit)
    )

    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": items,
        "total": len(items)
    }


@router.patch("/incidentes/{id_log}/estado")
async def update_incidente_status(
    id_log: int,
    payload: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "AUDITOR_SEGURIDAD"))
):
    nuevo_estado = str(payload.get("estado", "")).strip().upper()

    if nuevo_estado not in {"RESUELTO", "EN_PROCESO"}:
        raise HTTPException(status_code=400, detail="Estado inválido")

    result = await db.execute(
        update(AuditoriaAcceso)
        .where(AuditoriaAcceso.id_auditoria == id_log)
        .values(resultado=nuevo_estado)
        .execution_options(synchronize_session="fetch")
    )

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")

    await db.commit()

    return {
        "status": "success",
        "message": f"Incidente marcado como {nuevo_estado}"
    }
