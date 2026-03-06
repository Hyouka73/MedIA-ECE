from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from PIL import Image
import io
import logging

from app.core.deps import get_current_user
from app.database.session import get_db
from app.services.storage import storage_service
from app.models.auth import User, Persona
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
async def list_personas(current_user: dict = Depends(get_current_user)):
    """GET /personas — TODO Persona 3"""
    return {"data": [], "message": "Módulo Personas pendiente de implementación (Persona 3)"}

@router.post("/")
async def create_persona(current_user: dict = Depends(get_current_user)):
    """POST /personas — TODO Persona 3"""
    return {"message": "TODO Persona 3"}

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Sube y redimensiona (500x500) una foto de perfil y la asocia a la persona logueada.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Formato no válido. Debe ser una imagen.")

    try:
        content = await file.read()
        image = Image.open(io.BytesIO(content))
        
        # Asegurar conversión a RGB para máxima compatibilidad con JPEG
        if image.mode != "RGB":
            image = image.convert("RGB")
            
        # Redimensionar (Mantiene la relación de aspecto y ajusta al límite)
        image.thumbnail((500, 500))
        
        # Guardar a un buffer en memoria
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG', quality=85)
        
        # Subir a Azure Storage
        url_blob = await storage_service.upload_file(
            file_content=img_byte_arr,
            extension=".jpeg",
            container_name="avatares",
            content_type="image/jpeg"
        )
        
        if not url_blob:
            raise HTTPException(status_code=500, detail="Error al subir imagen a la nube.")
            
        # Actualizar DB
        # Primero necesitamos la persona del usuario logueado
        from uuid import UUID as UUID_OBJ
        user_uuid = UUID_OBJ(current_user["sub"])
        
        query = select(User).where(User.id_usuario == user_uuid)
        user = (await db.execute(query)).scalar_one_or_none()
        
        if not user or not user.id_persona:
            raise HTTPException(status_code=404, detail="Usuario o Registro de Persona no encontrado.")
            
        await db.execute(
            update(Persona)
            .where(Persona.id_persona == user.id_persona)
            .values(url_foto=url_blob)
        )
        await db.commit()
        
        return {"message": "Avatar actualizado correctamente", "url_foto": url_blob}
        
    except HTTPException as e:
        # Re-lanzar errores controlados
        raise e
    except Exception as e:
        logger.error(f"Error procesando avatar: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno procesando imagen: {str(e)}")
