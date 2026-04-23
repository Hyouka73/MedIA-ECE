"""Personas module router — CRUD de Personas con validaciones y gestión de barreras lingüísticas"""
from datetime import date, datetime, timezone
import uuid
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from PIL import Image
import io
import logging

from app.core.deps import get_current_user
from app.database.session import get_db
from app.services.storage import storage_service
from app.models.auth import User, Persona, Lengua
from app.core.config import settings
from app.schemas.pacientes import PersonaCreateIn, PersonaOut

logger = logging.getLogger(__name__)

router = APIRouter()


def _calculate_barrera_linguistica(id_lengua_materna: Optional[int]) -> bool:
    """Calcula si existe barrera lingüística (id_lengua_materna != None)"""
    return id_lengua_materna is not None


async def _persona_to_out(persona: Persona) -> PersonaOut:
    """Convierte modelo Persona a schema PersonaOut con alerta de barrera lingüística"""
    return PersonaOut(
        id_persona=persona.id_persona,
        nombre=persona.nombre,
        primer_apellido=persona.primer_apellido,
        segundo_apellido=persona.segundo_apellido,
        curp=persona.curp,
        fecha_nacimiento=persona.fecha_nacimiento,
        sexo=persona.sexo,
        id_localidad=persona.id_localidad,
        calle_numero=persona.calle_numero,
        referencia_geografica=persona.referencia_geografica,
        id_lengua_materna=persona.id_lengua_materna,
        telefono=persona.telefono,
        url_foto=persona.url_foto,
        fecha_registro=persona.fecha_registro,
        alerta_barrera_linguistica=_calculate_barrera_linguistica(persona.id_lengua_materna)
    )


# ── GET / — Listar personas con paginación y búsqueda ───────────────────
@router.get("/", response_model=dict)
async def list_personas(
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """GET /personas — Lista paginada de personas con búsqueda opcional"""
    try:
        offset = (page - 1) * limit
        
        # Query base
        query = select(Persona)
        count_query = select(func.count()).select_from(Persona)
        
        # Filtro de búsqueda (nombre, apellidos, CURP)
        if search:
            search_term = f"%{search.lower()}%"
            filter_condition = (
                (Persona.nombre.ilike(search_term)) |
                (Persona.primer_apellido.ilike(search_term)) |
                (Persona.segundo_apellido.ilike(search_term)) |
                (Persona.curp.ilike(search_term))
            )
            query = query.where(filter_condition)
            count_query = count_query.where(filter_condition)
        
        # Contar total
        total = await db.scalar(count_query)
        total_pages = (total + limit - 1) // limit if total else 1
        
        # Aplicar paginación
        query = query.offset(offset).limit(limit)
        result = await db.execute(query)
        personas = result.scalars().all()
        
        # Convertir a schemas
        items = [await _persona_to_out(p) for p in personas]
        
        return {
            "data": {
                "items": items,
                "pages": total_pages,
                "total": total,
                "page": page,
                "limit": limit
            },
            "message": "Lista de personas obtenida exitosamente"
        }
    except Exception as e:
        logger.error(f"Error al obtener personas: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener personas"
        )


# ── GET /{id} — Obtener persona por ID ──────────────────────────────────
@router.get("/{id_persona}", response_model=dict)
async def get_persona(
    id_persona: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """GET /personas/{id} — Obtiene una persona específica"""
    try:
        query = select(Persona).where(Persona.id_persona == id_persona)
        result = await db.execute(query)
        persona = result.scalar_one_or_none()
        
        if not persona:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Persona no encontrada"
            )
        
        persona_out = await _persona_to_out(persona)
        return {
            "data": persona_out,
            "message": "Persona obtenida exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener persona {id_persona}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener persona"
        )


# ── POST / — Crear nueva persona ────────────────────────────────────────
@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_persona(
    persona_in: PersonaCreateIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """POST /personas — Crea una nueva persona"""
    try:
        # Validar CURP único si se proporciona
        if persona_in.curp:
            existing = await db.execute(
                select(Persona).where(Persona.curp == persona_in.curp)
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CURP ya registrado en el sistema"
                )
        
        # Crear persona
        nueva_persona = Persona(
            id_persona=uuid.uuid4(),
            nombre=persona_in.nombre,
            primer_apellido=persona_in.primer_apellido,
            segundo_apellido=persona_in.segundo_apellido,
            curp=Optional[persona_in.curp] if persona_in.curp else None,
            fecha_nacimiento=persona_in.fecha_nacimiento,
            sexo=persona_in.sexo,
            id_localidad=persona_in.id_localidad,
            calle_numero=persona_in.calle_numero,
            referencia_geografica=persona_in.referencia_geografica,
            id_lengua_materna=persona_in.id_lengua_materna,
            telefono=persona_in.telefono,
            url_foto=None,
            fecha_registro=datetime.now(timezone.utc)
        )
        
        db.add(nueva_persona)
        await db.commit()
        await db.refresh(nueva_persona)
        
        persona_out = await _persona_to_out(nueva_persona)
        return {
            "data": persona_out,
            "message": "Persona creada exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al crear persona: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al crear persona"
        )


# ── PATCH /{id} — Actualizar persona ───────────────────────────────────
@router.patch("/{id_persona}", response_model=dict)
async def update_persona(
    id_persona: UUID,
    persona_in: PersonaCreateIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """PATCH /personas/{id} — Actualiza una persona existente"""
    try:
        # Obtener persona existente
        query = select(Persona).where(Persona.id_persona == id_persona)
        result = await db.execute(query)
        persona = result.scalar_one_or_none()
        
        if not persona:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Persona no encontrada"
            )
        
        # Validar CURP único si cambió
        if persona_in.curp and persona_in.curp != persona.curp:
            existing = await db.execute(
                select(Persona).where(Persona.curp == persona_in.curp)
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CURP ya registrado en el sistema"
                )
        
        # Actualizar campos
        persona.nombre = persona_in.nombre
        persona.primer_apellido = persona_in.primer_apellido
        persona.segundo_apellido = persona_in.segundo_apellido
        persona.curp = persona_in.curp
        persona.fecha_nacimiento = persona_in.fecha_nacimiento
        persona.sexo = persona_in.sexo
        persona.id_localidad = persona_in.id_localidad
        persona.calle_numero = persona_in.calle_numero
        persona.referencia_geografica = persona_in.referencia_geografica
        persona.id_lengua_materna = persona_in.id_lengua_materna
        persona.telefono = persona_in.telefono
        
        await db.commit()
        await db.refresh(persona)
        
        persona_out = await _persona_to_out(persona)
        return {
            "data": persona_out,
            "message": "Persona actualizada exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al actualizar persona {id_persona}: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al actualizar persona"
        )


# ── POST /{id}/avatar — Subir avatar ───────────────────────────────────
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
            
        import hashlib
        from app.core.forensic_logger import log_forensic_event
        
        # Calcular hash del archivo para trazabilidad forense
        img_byte_arr.seek(0)
        file_hash = hashlib.sha256(img_byte_arr.read()).hexdigest()
        
        log_forensic_event(
            usuario=current_user["sub"],
            accion="SUBIDA_ARCHIVO_AVATAR",
            resultado="EXITOSO",
            hash_archivo=file_hash,
            detalles={"url": url_blob}
        )
            
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
        # Re-lanzar errores controlados (404, 400, etc)
        raise e
    except Exception as e:
        logger.error(f"Error crítico procesando avatar: {str(e)}")
        # No exponemos la traza completa de SQL al cliente por seguridad, pero dejamos una pista.
        raise HTTPException(
            status_code=500, 
            detail="Error interno al guardar la imagen. El equipo técnico ha sido notificado."
        )