from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.session import get_db
from app.core.deps import get_current_user, require_role
from app.models.auth import AuditoriaAcceso

router = APIRouter()

@router.get("")
async def get_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "OMNIADMIN"))
):
    """
    Endpoint para obtener la bitácora forense
    """
    offset = (page - 1) * limit
    
    # CORRECCIÓN: Usar AuditoriaAcceso y timestamp_evento
    query = select(AuditoriaAcceso).order_by(AuditoriaAcceso.timestamp_evento.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    # Contar total para paginación
    count_query = select(func.count()).select_from(AuditoriaAcceso)
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    return {
        "items": logs,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.get("/stats")
async def get_audit_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "OMNIADMIN"))
):
    """
    Métricas para los cuadros del Dashboard
    """
    # Total de eventos
    total_res = await db.execute(select(func.count()).select_from(AuditoriaAcceso))
    total = total_res.scalar()

    # Total críticos
    crit_res = await db.execute(
        select(func.count())
        .select_from(AuditoriaAcceso)
        .where(AuditoriaAcceso.nivel_severidad == "CRITICA")
    )
    criticos = crit_res.scalar()

    return {
        "total": total,
        "criticos": criticos,
        "documentos": total # Simulamos documentos firmados con el total de logs
    }