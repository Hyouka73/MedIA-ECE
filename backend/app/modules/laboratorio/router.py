import hashlib
import os
import logging
from uuid import UUID, uuid4
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.core.deps import get_current_user
from app.core.config import settings
from app.models.clinico import ResultadoLaboratorio, SolicitudEstudio
from app.schemas.laboratorio import ResultadoLaboratorioOut

logger = logging.getLogger(__name__)
router = APIRouter()

# Configuración de carpeta local
UPLOAD_DIR = os.path.join("static", "laboratorio")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def calculate_sha256(file_content: bytes) -> str:
    """Calcula el hash SHA-256 de un archivo para integridad forense (NOM-151)."""
    return hashlib.sha256(file_content).hexdigest()

@router.post("/upload", response_model=ResultadoLaboratorioOut, status_code=status.HTTP_201_CREATED)
async def upload_resultado_laboratorio(
    id_solicitud: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    POST /laboratorio/upload — Sube un PDF de laboratorio al ALMACENAMIENTO LOCAL.
    Cumple con NOM-151 (Hash SHA-256) y trazabilidad forense.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se permiten archivos PDF."
        )

    # 1. Leer contenido y calcular Hash (NOM-151)
    content = await file.read()
    file_hash = calculate_sha256(content)

    # 2. Guardar en Carpeta Local (Fallback de Azure)
    try:
        file_name = f"{uuid4()}-{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        # URL accesible vía servidor estático de FastAPI
        pdf_url = f"/static/laboratorio/{file_name}"
        logger.info(f"📁 Archivo guardado localmente: {file_name}")

    except Exception as e:
        logger.error(f"Error al guardar archivo local: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar el archivo en el servidor: {str(e)}"
        )

    # 3. Guardar en Base de Datos
    nuevo_resultado = ResultadoLaboratorio(
        id_solicitud=id_solicitud,
        pdf_url=pdf_url,
        pdf_hash=file_hash,
        subido_por=UUID(current_user["sub"])
    )
    
    db.add(nuevo_resultado)
    await db.commit()
    await db.refresh(nuevo_resultado)

    return nuevo_resultado

@router.get("/{id_resultado}/token", response_model=dict)
async def get_laboratorio_url(
    id_resultado: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    GET /laboratorio/{id}/token — Devuelve la URL del archivo local.
    """
    stmt = select(ResultadoLaboratorio).where(ResultadoLaboratorio.id_resultado == id_resultado)
    result = await db.execute(stmt)
    resultado = result.scalar_one_or_none()

    if not resultado:
        raise HTTPException(status_code=404, detail="Resultado no encontrado")

    # Al ser local y estar en /static, devolvemos la URL directa o con el host
    return {
        "url": resultado.pdf_url,
        "full_url": f"{settings.API_V1_STR if hasattr(settings, 'API_V1_STR') else ''}{resultado.pdf_url}",
        "sas_token": "local-storage-no-token-needed"
    }

@router.get("/solicitud/{id_solicitud}/resultados", response_model=list[ResultadoLaboratorioOut])
async def get_resultados_por_solicitud(
    id_solicitud: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    GET /laboratorio/solicitud/{id}/resultados — Obtiene todos los PDFs subidos para una solicitud.
    """
    stmt = select(ResultadoLaboratorio).where(ResultadoLaboratorio.id_solicitud == id_solicitud)
    result = await db.execute(stmt)
    return result.scalars().all()
