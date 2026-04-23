from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from app.database.session import get_db
from app.core.deps import require_role
from app.models.auth import AuditoriaAcceso

router = APIRouter()

# ─── EL LISTADO (Lo que ve el Auditor en la tabla) ────────────────────
@router.get("")
async def get_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "OMNIADMIN", "AUDITOR_SEGURIDAD"))
):
    offset = (page - 1) * limit
    query = select(AuditoriaAcceso).order_by(AuditoriaAcceso.timestamp_evento.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    count_result = await db.execute(select(func.count()).select_from(AuditoriaAcceso))
    total = count_result.scalar()

    return {
        "items": logs,
        "total": total,
        "page": page,
        "limit": limit
    }

# ─── EL SENSOR (Lo que hace parpadear al Sidebar) ─────────────────────
@router.get("/stats")
async def get_audit_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "OMNIADMIN", "AUDITOR_SEGURIDAD"))
):
    # Total de eventos hoy
    total = await db.scalar(select(func.count()).select_from(AuditoriaAcceso))

    # CRÍTICO: Solo contamos los que son CRITICA Y siguen ABIERTOS
    # Esto es lo que controla el parpadeo en el frontend
    criticos = await db.scalar(
        select(func.count())
        .select_from(AuditoriaAcceso)
        .where(AuditoriaAcceso.nivel_severidad == "CRITICA")
        .where(AuditoriaAcceso.estado == "ABIERTO") 
    )

    return {
        "total": total or 0,
        "criticos": criticos or 0,
        "documentos": total or 0
    }

# ─── EL CONTROL (Para cambiar de ABIERTO a RESUELTO) ──────────────────
@router.patch("/incidentes/{id_log}/estado")
async def update_incidente_status(
    id_log: int,
    payload: dict = Body(...), # Recibe {"estado": "RESUELTO"}
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "AUDITOR_SEGURIDAD"))
):
    nuevo_estado = payload.get("estado")
    await db.execute(
        update(AuditoriaAcceso)
        .where(AuditoriaAcceso.id_auditoria == id_log)
        .values(estado=nuevo_estado)
    )
    await db.commit()
    return {"status": "success", "message": f"Incidente marcado como {nuevo_estado}"}