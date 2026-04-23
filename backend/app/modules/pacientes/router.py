"""Pacientes module router"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.auth import Paciente, Persona
from app.schemas.pacientes import PacienteOut, PacienteCreateIn, PersonaOut
from uuid import UUID, uuid4
from datetime import datetime, timezone, date
from sqlalchemy import update
from typing import Optional
from pydantic import BaseModel as PydanticBaseModel
import uuid
import logging
from sqlalchemy.orm import joinedload

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Schemas Adicionales ─────────────────────────────────────────
class PersonaCreateForPaciente(PydanticBaseModel):
    nombre: str
    primer_apellido: str
    segundo_apellido: Optional[str] = None
    curp: Optional[str] = None
    fecha_nacimiento: date
    sexo: str
    id_localidad: Optional[str] = None
    calle_numero: Optional[str] = None
    referencia_geografica: Optional[str] = None
    id_lengua_materna: Optional[int] = None
    telefono: Optional[str] = None


class PacienteCreateWithPersonaIn(PydanticBaseModel):
    persona: PersonaCreateForPaciente
    grupo_sanguineo: Optional[str] = None


class PacienteUpdateIn(PydanticBaseModel):
    grupo_sanguineo: Optional[str] = None


@router.get("")
async def list_pacientes(
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """GET /pacientes — Lista paginada de pacientes con búsqueda opcional"""
    try:
        offset = (page - 1) * limit
        
        # ✅ CAMBIO CRÍTICO: Añadir .options(selectinload(Paciente.persona))
        query = (
            select(Paciente)
            .join(Persona)
            .options(joinedload(Paciente.persona))  # <-- ESTO RESUELVE EL greenlet_spawn
            .where(Paciente.eliminado_en == None)
        )
        
        # Aplicar filtro de búsqueda
        if search:
            search_term = f"%{search.lower()}%"
            query = query.where(
                (Persona.nombre.ilike(search_term)) |
                (Persona.primer_apellido.ilike(search_term)) |
                (Persona.segundo_apellido.ilike(search_term)) |
                (Paciente.numero_expediente.ilike(search_term))
            )
        
        # Contar total (sin necesidad de cargar relaciones)
        count_query = (
            select(func.count())
            .select_from(Paciente)
            .join(Persona)
            .where(Paciente.eliminado_en == None)
        )
        if search:
            search_term = f"%{search.lower()}%"
            count_query = count_query.where(
                (Persona.nombre.ilike(search_term)) |
                (Persona.primer_apellido.ilike(search_term)) |
                (Persona.segundo_apellido.ilike(search_term)) |
                (Paciente.numero_expediente.ilike(search_term))
            )
        
        total = await db.scalar(count_query)
        total_pages = (total + limit - 1) // limit if total else 1
        
        # Paginación
        query = query.offset(offset).limit(limit)
        
        # Ejecutar
        result = await db.execute(query)
        pacientes = result.scalars().unique().all()  # unique() evita duplicados por el JOIN
        
        # Construir respuesta (ahora paciente.persona YA ESTÁ CARGADA)
        items = []
        for paciente in pacientes:
            # Calcular edad si es necesario
            edad = None
            if paciente.persona and paciente.persona.fecha_nacimiento:
                from datetime import date
                hoy = date.today()
                edad = hoy.year - paciente.persona.fecha_nacimiento.year - (
                    (hoy.month, hoy.day) < 
                    (paciente.persona.fecha_nacimiento.month, paciente.persona.fecha_nacimiento.day)
                )
            
            item = {
                "id_paciente": str(paciente.id_paciente),
                "id_persona": str(paciente.id_persona),
                "numero_expediente": paciente.numero_expediente,
                "grupo_sanguineo": paciente.grupo_sanguineo,
                "fecha_registro": paciente.fecha_registro.isoformat(),
                "nombre": paciente.persona.nombre,
                "primer_apellido": paciente.persona.primer_apellido,
                "segundo_apellido": paciente.persona.segundo_apellido or "",
                "edad": edad,
                "telefono": paciente.persona.telefono or "",
                "alergias": []  # TODO
            }
            items.append(item)
        
        return {
            "data": {
                "items": items,
                "pages": total_pages,
                "total": total,
                "page": page,
                "limit": limit
            },
            "message": "Lista de pacientes obtenida exitosamente"
        }
        
    except Exception as e:
        logger.error(f"Error al obtener pacientes: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno al obtener pacientes. El equipo técnico ha sido notificado."
        )



# ── POST /pacientes ─────────────────────────────────────────────
@router.post("", response_model=dict, status_code=201)
async def create_paciente(
    paciente_in: PacienteCreateWithPersonaIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    POST /pacientes — Crea un paciente con su persona asociada (en una transacción)
    
    Acepta dos formatos:
    1. Con datos de persona incluidos (recomendado para crear desde cero):
       { "persona": { nombre, primer_apellido, ... }, "grupo_sanguineo": "O+" }
    
    2. Solo con id_persona si la persona ya existe (menos común):
       { "id_persona": "uuid", "grupo_sanguineo": "O+" }
    """
    try:
        # Si viene con id_persona directamente (compatibilidad)
        if isinstance(paciente_in, dict) and "id_persona" in paciente_in:
            paciente_in = PacienteCreateIn(**paciente_in)
            persona = await db.scalar(select(Persona).where(Persona.id_persona == paciente_in.id_persona))
            if not persona:
                raise HTTPException(status_code=404, detail="Persona no encontrada")
            existing = await db.scalar(select(Paciente).where(Paciente.id_persona == paciente_in.id_persona))
            if existing:
                raise HTTPException(status_code=400, detail="La persona ya está registrada como paciente")
        else:
            # Crear persona primero
            persona_data = paciente_in.persona
            
            # Validar CURP único si se proporciona
            if persona_data.curp:
                existing_persona = await db.scalar(
                    select(Persona).where(Persona.curp == persona_data.curp)
                )
                if existing_persona:
                    raise HTTPException(
                        status_code=400,
                        detail="CURP ya registrado en el sistema"
                    )
            
            # Crear persona
            id_persona = uuid.uuid4()
            nueva_persona = Persona(
                id_persona=id_persona,
                nombre=persona_data.nombre,
                primer_apellido=persona_data.primer_apellido,
                segundo_apellido=persona_data.segundo_apellido,
                curp=Optional[persona_data.curp] if persona_data.curp else None,
                fecha_nacimiento=persona_data.fecha_nacimiento,
                sexo=persona_data.sexo,
                id_localidad=persona_data.id_localidad,
                calle_numero=persona_data.calle_numero,
                referencia_geografica=persona_data.referencia_geografica,
                id_lengua_materna=persona_data.id_lengua_materna,
                telefono=persona_data.telefono,
                url_foto=None,
                fecha_registro=datetime.now(timezone.utc)
            )
            
            db.add(nueva_persona)
            await db.flush()  # Flush para obtener el ID pero sin commit
            persona = nueva_persona

        # Generar número_expediente incremental por año: EXP-YYYY-SEQ
        year = datetime.now().year
        seq_query = select(func.count()).select_from(Paciente).where(func.extract('year', Paciente.fecha_registro) == year)
        seq = (await db.scalar(seq_query)) or 0
        numero_expediente = f"EXP-{year}-{seq+1:06d}"

        nuevo_paciente = Paciente(
            id_persona=persona.id_persona,
            numero_expediente=numero_expediente,
            grupo_sanguineo=paciente_in.grupo_sanguineo,
            fecha_registro=datetime.now(timezone.utc)
        )
        db.add(nuevo_paciente)
        await db.commit()
        await db.refresh(nuevo_paciente)

        return {
            "data": {
                "id_paciente": str(nuevo_paciente.id_paciente),
                "numero_expediente": nuevo_paciente.numero_expediente,
                "id_persona": str(nuevo_paciente.id_persona),
                "grupo_sanguineo": nuevo_paciente.grupo_sanguineo,
                "fecha_registro": nuevo_paciente.fecha_registro.isoformat(),
                "persona": {
                    "id_persona": str(persona.id_persona),
                    "nombre": persona.nombre,
                    "primer_apellido": persona.primer_apellido,
                    "segundo_apellido": persona.segundo_apellido
                }
            },
            "message": "Paciente y persona creados exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al crear paciente: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al crear paciente")


# ── GET /pacientes/{id} ──────────────────────────────────────────
@router.get("/{id_paciente}", response_model=dict)
async def get_paciente(
    id_paciente: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """GET /pacientes/{id} — Obtiene un paciente por ID"""
    try:
        stmt = (
            select(Paciente)
            .options(joinedload(Paciente.persona))  
            .where(
                Paciente.id_paciente == id_paciente,
                Paciente.eliminado_en == None
            )
        )
        
        result = await db.execute(stmt)
        paciente = result.scalar_one_or_none()
        
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        
        persona = paciente.persona  # Ahora SÍ está cargada
        persona_out = None
        
        if persona:
            persona_out = {
                "id_persona": str(persona.id_persona),
                "nombre": persona.nombre,
                "primer_apellido": persona.primer_apellido,
                "segundo_apellido": persona.segundo_apellido,
                "curp": persona.curp,
                "fecha_nacimiento": persona.fecha_nacimiento.isoformat() if persona.fecha_nacimiento else None,
                "sexo": persona.sexo,
                "id_localidad": str(persona.id_localidad) if persona.id_localidad else None,
                "calle_numero": persona.calle_numero,
                "referencia_geografica": persona.referencia_geografica,
                "id_lengua_materna": str(persona.id_lengua_materna) if persona.id_lengua_materna else None,
                "telefono": persona.telefono,
                "url_foto": persona.url_foto,
                "fecha_registro": persona.fecha_registro.isoformat() if persona.fecha_registro else None,
                "alerta_barrera_linguistica": bool(persona.id_lengua_materna)
            }
        
        return {
            "data": {
                "id_paciente": str(paciente.id_paciente),
                "numero_expediente": paciente.numero_expediente,
                "id_persona": str(paciente.id_persona),
                "grupo_sanguineo": paciente.grupo_sanguineo,
                "fecha_registro": paciente.fecha_registro.isoformat(),
                "persona": persona_out
            },
            "message": "Paciente obtenido exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener paciente {id_paciente}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al obtener paciente")


# ── GET /pacientes/{id}/expediente ──────────────────────────────
@router.get("/{id_paciente}/expediente", response_model=dict)
async def get_expediente(
    id_paciente: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """GET /pacientes/{id}/expediente — Redirige a GET /expediente/{id}"""
    try:
        from app.services.acceso import check_regla_1
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            raise HTTPException(status_code=403, detail="Acceso denegado al expediente clínico")

        stmt = (
            select(Paciente)
            .options(joinedload(Paciente.persona))
            .where(
                Paciente.id_paciente == id_paciente,
                Paciente.eliminado_en == None
            )
        )
        
        result = await db.execute(stmt)
        paciente = result.scalar_one_or_none()
        
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        
        persona = paciente.persona
        persona_out = None
        if persona:
            persona_out = {
                "id_persona": str(persona.id_persona),
                "nombre": persona.nombre,
                "primer_apellido": persona.primer_apellido,
                "segundo_apellido": persona.segundo_apellido,
                "curp": persona.curp,
                "fecha_nacimiento": persona.fecha_nacimiento.isoformat() if persona.fecha_nacimiento else None,
                "sexo": persona.sexo,
                "id_localidad": persona.id_localidad,
                "calle_numero": persona.calle_numero,
                "referencia_geografica": persona.referencia_geografica,
                "id_lengua_materna": persona.id_lengua_materna,
                "telefono": persona.telefono,
                "url_foto": persona.url_foto,
                "fecha_registro": persona.fecha_registro.isoformat() if persona.fecha_registro else None,
                "alerta_barrera_linguistica": bool(persona.id_lengua_materna)
            }
        
        return {
            "data": {
                "id_paciente": str(paciente.id_paciente),
                "numero_expediente": paciente.numero_expediente,
                "id_persona": str(paciente.id_persona),
                "grupo_sanguineo": paciente.grupo_sanguineo,
                "fecha_registro": paciente.fecha_registro.isoformat(),
                "persona": persona_out,
                "antecedentes": []
            },
            "message": "Expediente clínico obtenido exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener expediente {id_paciente}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al obtener expediente")


# ── PUT /pacientes/{id} ─────────────────────────────────────────────


# ── PUT /pacientes/{id} ─────────────────────────────────────────────
@router.put("/{id_paciente}", response_model=dict)
async def update_paciente(
    id_paciente: UUID,
    paciente_update: PacienteUpdateIn,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """PUT /pacientes/{id} — Actualiza datos clínicos del paciente"""
    try:
        paciente = await db.scalar(select(Paciente).where(Paciente.id_paciente == id_paciente, Paciente.eliminado_en == None))
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        
        # Actualizar solo campos permitidos
        if paciente_update.grupo_sanguineo is not None:
            paciente.grupo_sanguineo = paciente_update.grupo_sanguineo
        
        await db.commit()
        await db.refresh(paciente)
        
        return {
            "data": {
                "id_paciente": str(paciente.id_paciente),
                "numero_expediente": paciente.numero_expediente,
                "grupo_sanguineo": paciente.grupo_sanguineo,
                "fecha_registro": paciente.fecha_registro.isoformat()
            },
            "message": "Paciente actualizado exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al actualizar paciente: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al actualizar paciente")


# ── DELETE /pacientes/{id} ─────────────────────────────────────────────
@router.delete("/{id_paciente}", response_model=dict, status_code=200)
async def delete_paciente(
    id_paciente: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """DELETE /pacientes/{id} — Soft delete del paciente (requiere aprobación)"""
    try:
        paciente = await db.scalar(select(Paciente).where(Paciente.id_paciente == id_paciente, Paciente.eliminado_en == None))
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        
        # Soft delete: marcar como eliminado
        from datetime import datetime, timezone
        from uuid import UUID as PyUUID
        
        paciente.eliminado_en = datetime.now(timezone.utc)
        paciente.eliminado_por = PyUUID(current_user["sub"])
        
        await db.commit()
        
        return {
            "data": {
                "id_paciente": str(paciente.id_paciente),
                "eliminado_en": paciente.eliminado_en.isoformat()
            },
            "message": "Paciente eliminado exitosamente (soft delete)"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al eliminar paciente: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al eliminar paciente")


# ── POST /pacientes/{id}/tutores ─────────────────────────────────────
from fastapi import Body
@router.post("/{id_paciente}/tutores", response_model=dict, status_code=201)
async def add_tutor(
    id_paciente: UUID,
    tutor: dict = Body(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """POST /pacientes/{id}/tutores — Agrega tutor (requiere documento_legal_url ya en Azure)"""
    try:
        # Validar paciente
        paciente = await db.scalar(select(Paciente).where(Paciente.id_paciente == id_paciente, Paciente.eliminado_en == None))
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        # Validar campos mínimos
        id_persona = tutor.get("id_persona")
        parentesco = tutor.get("parentesco")
        documento_legal_url = tutor.get("documento_legal_url")
        documento_legal_hash = tutor.get("documento_legal_hash")
        if not id_persona or not parentesco:
            raise HTTPException(status_code=422, detail="id_persona y parentesco son obligatorios")
        # Insertar tutor
        await db.execute(
            """
            INSERT INTO pacientes_tutores_representantes (id_paciente, id_persona, parentesco, documento_legal_url, documento_legal_hash)
            VALUES (:id_paciente, :id_persona, :parentesco, :documento_legal_url, :documento_legal_hash)
            """,
            {
                "id_paciente": str(id_paciente),
                "id_persona": str(id_persona),
                "parentesco": parentesco,
                "documento_legal_url": documento_legal_url,
                "documento_legal_hash": documento_legal_hash
            }
        )
        await db.commit()
        return {"message": "Tutor agregado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al agregar tutor: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al agregar tutor")
