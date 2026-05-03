from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy import select, func, text, update
from app.modules.pacientes.utils.pdf_generator import MedIAPDFGenerator
from app.core.deps import get_current_user, require_role
from app.database.session import get_db
from app.models import (
    Paciente, Persona, Lengua, Alergia, EncuentroClinico
)
from uuid import UUID, uuid4
from datetime import datetime, timezone, date
from pydantic import BaseModel as PydanticBaseModel
from typing import Optional
import logging
import re
from app.core.utils import sanitize_input
from app.services.acceso import check_regla_1
from fastapi import APIRouter, Depends, HTTPException, Query, Body, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.pacientes import PacienteOut, PersonaOut

logger = logging.getLogger(__name__)
router = APIRouter()

def clean_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    return re.sub(r"\D", "", phone)


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
            .outerjoin(Lengua, Persona.id_lengua_materna == Lengua.id_lengua)
            .options(
                joinedload(Paciente.persona),
                selectinload(Paciente.persona, Persona.lengua)
            )  # <-- ESTO RESUELVE EL greenlet_spawn
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
            
            # Determinar nombre de lengua y barrera lingüística
            nombre_lengua = None
            tiene_barrera_linguistica = False
            if paciente.persona and hasattr(paciente.persona, 'lengua') and paciente.persona.lengua:
                nombre_lengua = paciente.persona.lengua.nombre
                # Barrera lingüística si no es español
                tiene_barrera_linguistica = paciente.persona.lengua.nombre.lower() != "español"
            
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
                "lengua_materna": nombre_lengua,
                "tiene_barrera_linguistica": tiene_barrera_linguistica,
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
    current_user: dict = Depends(require_role(["RECEPCIONISTA", "ADMINISTRADOR", "SUPERADMIN", "OMNIADMIN"])),
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
            id_persona = uuid4()
            nueva_persona = Persona(
                id_persona=id_persona,
                nombre=sanitize_input(persona_data.nombre),
                primer_apellido=sanitize_input(persona_data.primer_apellido),
                segundo_apellido=sanitize_input(persona_data.segundo_apellido),
                #curp=Optional[persona_data.curp] if persona_data.curp else None,
                curp = persona_data.curp if persona_data.curp else None, #Vamo a probar así
                fecha_nacimiento=persona_data.fecha_nacimiento,
                sexo=persona_data.sexo,
                id_localidad=persona_data.id_localidad,
                calle_numero=sanitize_input(persona_data.calle_numero),
                referencia_geografica=sanitize_input(persona_data.referencia_geografica),
                id_lengua_materna=persona_data.id_lengua_materna,
                telefono=clean_phone(persona_data.telefono),
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
            .options(
                joinedload(Paciente.persona),
                selectinload(Paciente.persona, Persona.lengua)
            )  
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
                "nombre_lengua": persona.lengua.nombre if hasattr(persona, 'lengua') and persona.lengua else None,
                "telefono": persona.telefono,
                "url_foto": persona.url_foto,
                "fecha_registro": persona.fecha_registro.isoformat() if persona.fecha_registro else None,
                "alerta_barrera_linguistica": bool(persona.id_lengua_materna and persona.lengua and persona.lengua.nombre.lower() != 'español')
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
            .options(
                joinedload(Paciente.persona),
                selectinload(Paciente.persona, Persona.lengua)
            )
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
                "nombre_lengua": persona.lengua.nombre if hasattr(persona, 'lengua') and persona.lengua else None,
                "telefono": persona.telefono,
                "url_foto": persona.url_foto,
                "fecha_registro": persona.fecha_registro.isoformat() if persona.fecha_registro else None,
                "alerta_barrera_linguistica": bool(persona.id_lengua_materna and persona.lengua and persona.lengua.nombre.lower() != 'español')
            }

        query_alergias = text("""
            SELECT id_alergia, alergia, severidad, fecha_registro
            FROM alergias
            WHERE id_paciente = :id_paciente AND eliminado_en IS NULL
            ORDER BY severidad DESC, fecha_registro DESC
        """)
        result_alergias = await db.execute(query_alergias, {"id_paciente": id_paciente})
        alergias = [
            {
                "id_alergia": str(row[0]),
                "alergia": row[1],
                "severidad": row[2],
                "fecha_registro": row[3].isoformat() if row[3] else None
            }
            for row in result_alergias.fetchall()
        ]

        query_ahf = text("""
            SELECT diabetes, hipertension, cardiopatia, neoplasia, detalles
            FROM antecedentes_heredofamiliares
            WHERE id_paciente = :id_paciente AND eliminado_en IS NULL
            LIMIT 1
        """)
        result_ahf = await db.execute(query_ahf, {"id_paciente": id_paciente})
        ahf_row = result_ahf.fetchone()
        antecedentes_heredo = {
            "diabetes": ahf_row[0] if ahf_row else False,
            "hipertension": ahf_row[1] if ahf_row else False,
            "cardiopatia": ahf_row[2] if ahf_row else False,
            "neoplasia": ahf_row[3] if ahf_row else False,
            "detalles": ahf_row[4] if ahf_row else None
        } if ahf_row else None

        query_ap = text("""
            SELECT id_ap, enfermedad, fecha_diagnostico, tratamiento_actual
            FROM antecedentes_patologicos
            WHERE id_paciente = :id_paciente AND eliminado_en IS NULL
            ORDER BY fecha_diagnostico DESC
        """)
        result_ap = await db.execute(query_ap, {"id_paciente": id_paciente})
        antecedentes_patologicos = [
            {
                "id_ap": str(row[0]),
                "enfermedad": row[1],
                "fecha_diagnostico": row[2].isoformat() if row[2] else None,
                "tratamiento_actual": row[3]
            }
            for row in result_ap.fetchall()
        ]

        query_anp = text("""
            SELECT tabaquismo, alcoholismo, drogas, detalles
            FROM antecedentes_no_patologicos
            WHERE id_paciente = :id_paciente AND eliminado_en IS NULL
            LIMIT 1
        """)
        result_anp = await db.execute(query_anp, {"id_paciente": id_paciente})
        anp_row = result_anp.fetchone()
        antecedentes_no_patologicos = {
            "tabaquismo": anp_row[0] if anp_row else False,
            "alcoholismo": anp_row[1] if anp_row else False,
            "drogas": anp_row[2] if anp_row else False,
            "detalles": anp_row[3] if anp_row else None
        } if anp_row else None

        query_inmunizaciones = text("""
            SELECT id_inmunizacion, vacuna, fecha_aplicacion, dosis
            FROM inmunizaciones
            WHERE id_paciente = :id_paciente AND eliminado_en IS NULL
            ORDER BY fecha_aplicacion DESC
        """)
        result_inmunizaciones = await db.execute(query_inmunizaciones, {"id_paciente": id_paciente})
        inmunizaciones = [
            {
                "id_inmunizacion": str(row[0]),
                "vacuna": row[1],
                "fecha_aplicacion": row[2].isoformat() if row[2] else None,
                "dosis": row[3]
            }
            for row in result_inmunizaciones.fetchall()
        ]

        return {
            "data": {
                "id_paciente": str(paciente.id_paciente),
                "numero_expediente": paciente.numero_expediente,
                "id_persona": str(paciente.id_persona),
                "grupo_sanguineo": paciente.grupo_sanguineo,
                "fecha_registro": paciente.fecha_registro.isoformat(),
                "persona": persona_out,
                "antecedentes": {
                    "heredofamiliares": antecedentes_heredo,
                    "patologicos": antecedentes_patologicos,
                    "no_patologicos": antecedentes_no_patologicos
                },
                "alergias": alergias,
                "inmunizaciones": inmunizaciones
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
    current_user: dict = Depends(require_role(["RECEPCIONISTA", "ADMINISTRADOR", "SUPERADMIN", "OMNIADMIN"])),
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
    current_user: dict = Depends(require_role(["ADMINISTRADOR", "SUPERADMIN", "OMNIADMIN"])),
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


# ── GET /pacientes/{id}/alergias ─────────────────────────────────────
@router.get("/{id_paciente}/alergias", response_model=dict)
async def get_alergias(
    id_paciente: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """GET /pacientes/{id}/alergias — Lista alergias activas del paciente ordenadas por severidad (CRÍTICA primero)"""
    try:
        # Verificar acceso (Regla 1)
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            raise HTTPException(status_code=403, detail="Acceso denegado al expediente clínico")

        # Verificar paciente existe
        paciente = await db.scalar(select(Paciente).where(Paciente.id_paciente == id_paciente, Paciente.eliminado_en == None))
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        # Obtener alergias ordenadas por severidad (CRÍTICA primero)
        query = text("""
            SELECT id_alergia, alergia, severidad, fecha_registro
            FROM alergias
            WHERE id_paciente = :id_paciente AND eliminado_en IS NULL
            ORDER BY 
                CASE severidad 
                    WHEN 'CRITICA' THEN 1 
                    WHEN 'MODERADA' THEN 2 
                    WHEN 'LEVE' THEN 3 
                END,
                fecha_registro DESC
        """)
        result = await db.execute(query, {"id_paciente": id_paciente})
        alergias = [
            {
                "id_alergia": str(row[0]),
                "alergia": row[1],
                "severidad": row[2],
                "fecha_registro": row[3].isoformat() if row[3] else None
            }
            for row in result.fetchall()
        ]

        return {
            "data": alergias,
            "message": "Alergias obtenidas exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener alergias {id_paciente}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al obtener alergias")


# ── POST /pacientes/{id}/alergias ─────────────────────────────────────
@router.post("/{id_paciente}/alergias", response_model=dict, status_code=201)
async def add_alergia(
    id_paciente: UUID,
    alergia_in: dict,
    current_user: dict = Depends(require_role(["MEDICO_GENERAL", "RECEPCIONISTA", "ADMINISTRADOR", "SUPERADMIN", "OMNIADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """POST /pacientes/{id}/alergias — Registra nueva alergia. Audita creación en historial_cambios."""
    try:
        # Verificar acceso (Regla 1)
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            raise HTTPException(status_code=403, detail="Acceso denegado")

        # Verificar paciente existe
        paciente = await db.scalar(select(Paciente).where(Paciente.id_paciente == id_paciente, Paciente.eliminado_en == None))
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        # Validar campos
        alergia_texto = alergia_in.get("alergia", "").strip()
        severidad = alergia_in.get("severidad", "LEVE")

        if not alergia_texto:
            raise HTTPException(status_code=422, detail="El campo 'alergia' es requerido")

        if severidad not in ["LEVE", "MODERADA", "CRITICA"]:
            raise HTTPException(status_code=422, detail="Severidad inválida")

        # Insertar alergia
        id_alergia = str(uuid4())
        query_insert = text("""
            INSERT INTO alergias (id_alergia, id_paciente, alergia, severidad, registrado_por, fecha_registro)
            VALUES (:id_alergia, :id_paciente, :alergia, :severidad, :registrado_por, :fecha_registro)
        """)

        await db.execute(query_insert, {
            "id_alergia": id_alergia,
            "id_paciente": str(id_paciente),
            "alergia": sanitize_input(alergia_texto),
            "severidad": severidad,
            "registrado_por": current_user["sub"],
            "fecha_registro": datetime.now(timezone.utc)
        })

        await db.commit()

        return {
            "data": {
                "id_alergia": id_alergia,
                "alergia": alergia_texto,
                "severidad": severidad
            },
            "message": "Alergia registrada exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al agregar alergia: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al agregar alergia")


# ── PATCH /pacientes/{id}/alergias/{id_alergia} ────────────────────────
@router.patch("/{id_paciente}/alergias/{id_alergia}", response_model=dict)
async def update_alergia(
    id_paciente: UUID,
    id_alergia: UUID,
    alergia_update: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """PATCH /pacientes/{id}/alergias/{id} — Actualiza severidad u observaciones. Trigger registra cambio en historial_cambios."""
    try:
        # Verificar acceso (Regla 1)
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            raise HTTPException(status_code=403, detail="Acceso denegado")

        # Verificar que la alergia existe y pertenece al paciente
        query_check = text("""
            SELECT id_alergia FROM alergias 
            WHERE id_alergia = :id_alergia AND id_paciente = :id_paciente AND eliminado_en IS NULL
        """)
        result = await db.execute(query_check, {"id_alergia": str(id_alergia), "id_paciente": str(id_paciente)})
        if not result.fetchone():
            raise HTTPException(status_code=404, detail="Alergia no encontrada")

        # Validar campos a actualizar
        updates = {}
        if "severidad" in alergia_update:
            severidad = alergia_update["severidad"]
            if severidad not in ["LEVE", "MODERADA", "CRITICA"]:
                raise HTTPException(status_code=422, detail="Severidad inválida")
            updates["severidad"] = severidad

        if not updates:
            raise HTTPException(status_code=422, detail="No hay campos válidos para actualizar")

        # Actualizar
        query_update = text(f"""
            UPDATE alergias 
            SET {', '.join(f'{k} = :{k}' for k in updates.keys())}, actualizado_por = :actualizado_por, fecha_actualizacion = :fecha_actualizacion
            WHERE id_alergia = :id_alergia
        """)
        updates.update({
            "id_alergia": str(id_alergia),
            "actualizado_por": current_user["sub"],
            "fecha_actualizacion": datetime.now(timezone.utc)
        })

        await db.execute(query_update, updates)
        await db.commit()

        return {
            "data": {"id_alergia": str(id_alergia), **updates},
            "message": "Alergia actualizada exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al actualizar alergia {id_alergia}: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al actualizar alergia")


# ── DELETE /pacientes/{id}/alergias/{id_alergia} ───────────────────────
@router.delete("/{id_paciente}/alergias/{id_alergia}", response_model=dict)
async def delete_alergia(
    id_paciente: UUID,
    id_alergia: UUID,
    motivo_baja: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """DELETE /pacientes/{id}/alergias/{id} — Borrado lógico. Requiere motivo_baja. Trigger tr_soft_delete registra en auditoria_accesos con nivel ALTO."""
    try:
        # Verificar acceso (Regla 1)
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            raise HTTPException(status_code=403, detail="Acceso denegado")

        # Verificar que la alergia existe y pertenece al paciente
        query_check = text("""
            SELECT id_alergia FROM alergias 
            WHERE id_alergia = :id_alergia AND id_paciente = :id_paciente AND eliminado_en IS NULL
        """)
        result = await db.execute(query_check, {"id_alergia": str(id_alergia), "id_paciente": str(id_paciente)})
        if not result.fetchone():
            raise HTTPException(status_code=404, detail="Alergia no encontrada")

        # Validar motivo_baja
        # Soft delete usando ORM con manejo robusto de UUID
        user_id = current_user["sub"]
        if isinstance(user_id, str):
            user_id = UUID(user_id)

        stmt = (
            update(Alergia)
            .where(Alergia.id_alergia == id_alergia)
            .where(Alergia.id_paciente == id_paciente)
            .where(Alergia.eliminado_en == None)
            .values(
                eliminado_en=datetime.now(timezone.utc),
                eliminado_por=user_id,
                motivo_baja=sanitize_input(str(motivo_baja).strip())
            )
        )

        result = await db.execute(stmt)
        if result.rowcount == 0:
            # Podría ser que no exista o que ya esté eliminado
            raise HTTPException(status_code=404, detail="No se encontró la alergia activa para este paciente")

        await db.commit()

        return {
            "data": {"id_alergia": str(id_alergia)},
            "message": "Alergia dada de baja exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al eliminar alergia {id_alergia}: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al eliminar alergia")


# ── GET /pacientes/{id}/antecedentes ────────────────────────────────
@router.get("/{id_paciente}/antecedentes", response_model=dict)
async def get_antecedentes(
    id_paciente: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """GET /pacientes/{id}/antecedentes — Devuelve los 4 tipos de antecedentes del paciente en un objeto estructurado"""
    try:
        # Verificar acceso (Regla 1)
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            raise HTTPException(status_code=403, detail="Acceso denegado al expediente clínico")

        # Verificar paciente existe
        paciente = await db.scalar(select(Paciente).where(Paciente.id_paciente == id_paciente, Paciente.eliminado_en == None))
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        # Obtener antecedentes heredofamiliares
        query_ahf = text("""
            SELECT diabetes, hipertension, cardiopatia, neoplasia, detalles
            FROM antecedentes_heredofamiliares
            WHERE id_paciente = :id_paciente AND eliminado_en IS NULL
            LIMIT 1
        """)
        result_ahf = await db.execute(query_ahf, {"id_paciente": id_paciente})
        ahf_row = result_ahf.fetchone()
        antecedentes_heredo = {
            "diabetes": ahf_row[0] if ahf_row else False,
            "hipertension": ahf_row[1] if ahf_row else False,
            "cardiopatia": ahf_row[2] if ahf_row else False,
            "neoplasia": ahf_row[3] if ahf_row else False,
            "detalles": ahf_row[4] if ahf_row else None
        } if ahf_row else None

        # Obtener antecedentes patológicos
        query_ap = text("""
            SELECT id_ap, enfermedad, fecha_diagnostico, tratamiento_actual
            FROM antecedentes_patologicos
            WHERE id_paciente = :id_paciente AND eliminado_en IS NULL
            ORDER BY fecha_diagnostico DESC
        """)
        result_ap = await db.execute(query_ap, {"id_paciente": id_paciente})
        antecedentes_patologicos = [
            {
                "id_ap": str(row[0]),
                "enfermedad": row[1],
                "fecha_diagnostico": row[2].isoformat() if row[2] else None,
                "tratamiento_actual": row[3]
            }
            for row in result_ap.fetchall()
        ]

        # Obtener antecedentes no patológicos
        query_anp = text("""
            SELECT tabaquismo, alcoholismo, drogas, detalles
            FROM antecedentes_no_patologicos
            WHERE id_paciente = :id_paciente AND eliminado_en IS NULL
            LIMIT 1
        """)
        result_anp = await db.execute(query_anp, {"id_paciente": id_paciente})
        anp_row = result_anp.fetchone()
        antecedentes_no_patologicos = {
            "tabaquismo": anp_row[0] if anp_row else False,
            "alcoholismo": anp_row[1] if anp_row else False,
            "drogas": anp_row[2] if anp_row else False,
            "detalles": anp_row[3] if anp_row else None
        } if anp_row else None

        # Obtener antecedentes ginecoobstétricos (solo si paciente es F)
        antecedentes_gineco = None
        persona = paciente.persona
        if persona and persona.sexo == 'F':
            query_ago = text("""
                SELECT menarca, ritmo_menstrual, gestas, partos, abortos, cesareas, ultimo_papanicolaou, ultimo_mamograma, anticonceptivos, detalles
                FROM antecedentes_ginecoobstetricos
                WHERE id_paciente = :id_paciente AND eliminado_en IS NULL
                LIMIT 1
            """)
            result_ago = await db.execute(query_ago, {"id_paciente": id_paciente})
            ago_row = result_ago.fetchone()
            if ago_row:
                antecedentes_gineco = {
                    "menarca": ago_row[0],
                    "ritmo_menstrual": ago_row[1],
                    "gestas": ago_row[2],
                    "partos": ago_row[3],
                    "abortos": ago_row[4],
                    "cesareas": ago_row[5],
                    "ultimo_papanicolaou": ago_row[6].isoformat() if ago_row[6] else None,
                    "ultimo_mamograma": ago_row[7].isoformat() if ago_row[7] else None,
                    "anticonceptivos": ago_row[8],
                    "detalles": ago_row[9]
                }

        return {
            "data": {
                "heredofamiliares": antecedentes_heredo,
                "patologicos": antecedentes_patologicos,
                "no_patologicos": antecedentes_no_patologicos,
                "ginecoobstetricos": antecedentes_gineco
            },
            "message": "Antecedentes obtenidos exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener antecedentes {id_paciente}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al obtener antecedentes")


# ── POST /pacientes/{id}/antecedentes/heredofamiliares ──────────────
@router.post("/{id_paciente}/antecedentes/heredofamiliares", response_model=dict, status_code=201)
async def add_antecedente_heredofamiliar(
    id_paciente: UUID,
    antecedente_in: dict,
    current_user: dict = Depends(require_role(["MEDICO_GENERAL", "ESPECIALISTA", "RECEPCIONISTA", "ADMINISTRADOR", "SUPERADMIN", "OMNIADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """POST /pacientes/{id}/antecedentes/heredofamiliares — Registra antecedente hereditario"""
    try:
        # Verificar acceso (Regla 1)
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            raise HTTPException(status_code=403, detail="Acceso denegado")

        # Verificar paciente existe
        paciente = await db.scalar(select(Paciente).where(Paciente.id_paciente == id_paciente, Paciente.eliminado_en == None))
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        # Validar campos
        diabetes = antecedente_in.get("diabetes", False)
        hipertension = antecedente_in.get("hipertension", False)
        cardiopatia = antecedente_in.get("cardiopatia", False)
        neoplasia = antecedente_in.get("neoplasia", False)
        detalles = antecedente_in.get("detalles", "").strip()

        # Insertar o actualizar (solo uno por paciente)
        # Primero verificar si ya existe
        existing = await db.scalar(text("""
            SELECT id_ahf FROM antecedentes_heredofamiliares 
            WHERE id_paciente = :id_paciente AND eliminado_en IS NULL
        """), {"id_paciente": str(id_paciente)})
        
        if existing:
            # Actualizar
            query_update = text("""
                UPDATE antecedentes_heredofamiliares SET
                    diabetes = :diabetes,
                    hipertension = :hipertension,
                    cardiopatia = :cardiopatia,
                    neoplasia = :neoplasia,
                    detalles = :detalles
                WHERE id_ahf = :id_ahf
            """)
            await db.execute(query_update, {
                "id_ahf": str(existing),
                "diabetes": diabetes,
                "hipertension": hipertension,
                "cardiopatia": cardiopatia,
                "neoplasia": neoplasia,
                "detalles": detalles
            })
        else:
            # Insertar
            query_insert = text("""
                INSERT INTO antecedentes_heredofamiliares (id_ahf, id_paciente, diabetes, hipertension, cardiopatia, neoplasia, detalles)
                VALUES (:id_ahf, :id_paciente, :diabetes, :hipertension, :cardiopatia, :neoplasia, :detalles)
            """)
            await db.execute(query_insert, {
                "id_ahf": str(uuid4()),
                "id_paciente": str(id_paciente),
                "diabetes": diabetes,
                "hipertension": hipertension,
                "cardiopatia": cardiopatia,
                "neoplasia": neoplasia,
                "detalles": detalles
            })

        await db.commit()

        return {
            "data": {
                "diabetes": diabetes,
                "hipertension": hipertension,
                "cardiopatia": cardiopatia,
                "neoplasia": neoplasia,
                "detalles": detalles
            },
            "message": "Antecedente heredofamiliar registrado exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al agregar antecedente heredofamiliar: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al agregar antecedente")


# ── POST /pacientes/{id}/antecedentes/patologicos ───────────────────
@router.post("/{id_paciente}/antecedentes/patologicos", response_model=dict, status_code=201)
async def add_antecedente_patologico(
    id_paciente: UUID,
    antecedente_in: dict,
    current_user: dict = Depends(require_role(["MEDICO_GENERAL", "ESPECIALISTA", "RECEPCIONISTA", "ADMINISTRADOR", "SUPERADMIN", "OMNIADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """POST /pacientes/{id}/antecedentes/patologicos — Registra antecedente patológico personal"""
    try:
        # Verificar acceso (Regla 1)
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            raise HTTPException(status_code=403, detail="Acceso denegado")

        # Verificar paciente existe
        paciente = await db.scalar(select(Paciente).where(Paciente.id_paciente == id_paciente, Paciente.eliminado_en == None))
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        # Validar campos
        enfermedad = antecedente_in.get("enfermedad", "").strip()
        fecha_diagnostico_str = antecedente_in.get("fecha_diagnostico")
        tratamiento_actual = antecedente_in.get("tratamiento_actual", "").strip()

        if not enfermedad:
            raise HTTPException(status_code=422, detail="Campo 'enfermedad' requerido")
        
        from datetime import date as data_type
        fecha_diagnostico = None
        if fecha_diagnostico_str:
            try:
                fecha_diagnostico = data_type.fromisoformat(fecha_diagnostico_str)
            except ValueError:
                raise HTTPException(status_code=422, detail="Formato de fecha inválido. Use YYYY-MM-DD")
            
        # Insertar
        query_insert = text("""
            INSERT INTO antecedentes_patologicos (id_ap, id_paciente, enfermedad, fecha_diagnostico, tratamiento_actual)
            VALUES (:id_ap, :id_paciente, :enfermedad, :fecha_diagnostico, :tratamiento_actual)
        """)

        await db.execute(query_insert, {
            "id_ap": str(uuid4()),
            "id_paciente": str(id_paciente),
            "enfermedad": enfermedad,
            "fecha_diagnostico": fecha_diagnostico,
            "tratamiento_actual": tratamiento_actual
        })

        await db.commit()

        return {
            "data": {"enfermedad": enfermedad},
            "message": "Antecedente patológico registrado exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al agregar antecedente patológico: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al agregar antecedente")


# ── POST /pacientes/{id}/antecedentes/no-patologicos ────────────────
@router.post("/{id_paciente}/antecedentes/no-patologicos", response_model=dict, status_code=201)
async def add_antecedente_no_patologico(
    id_paciente: UUID,
    antecedente_in: dict,
    current_user: dict = Depends(require_role(["MEDICO_GENERAL", "ESPECIALISTA", "RECEPCIONISTA", "ADMINISTRADOR", "SUPERADMIN", "OMNIADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """POST /pacientes/{id}/antecedentes/no-patologicos — Registra determinante social de la salud"""
    try:
        # Verificar acceso (Regla 1)
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            raise HTTPException(status_code=403, detail="Acceso denegado")

        # Verificar paciente existe
        paciente = await db.scalar(select(Paciente).where(Paciente.id_paciente == id_paciente, Paciente.eliminado_en == None))
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        # Validar campos
        tabaquismo = antecedente_in.get("tabaquismo", False)
        alcoholismo = antecedente_in.get("alcoholismo", False)
        drogas = antecedente_in.get("drogas", False)
        detalles = antecedente_in.get("detalles", "").strip()

        # Insertar o actualizar (solo uno por paciente)
        # Primero verificar si ya existe
        existing = await db.scalar(text("""
            SELECT id_anp FROM antecedentes_no_patologicos 
            WHERE id_paciente = :id_paciente AND eliminado_en IS NULL
        """), {"id_paciente": str(id_paciente)})
        
        if existing:
            # Actualizar
            query_update = text("""
                UPDATE antecedentes_no_patologicos SET
                    tabaquismo = :tabaquismo,
                    alcoholismo = :alcoholismo,
                    drogas = :drogas,
                    detalles = :detalles
                WHERE id_anp = :id_anp
            """)
            await db.execute(query_update, {
                "id_anp": str(existing),
                "tabaquismo": tabaquismo,
                "alcoholismo": alcoholismo,
                "drogas": drogas,
                "detalles": detalles
            })
        else:
            # Insertar
            query_insert = text("""
                INSERT INTO antecedentes_no_patologicos (id_anp, id_paciente, tabaquismo, alcoholismo, drogas, detalles)
                VALUES (:id_anp, :id_paciente, :tabaquismo, :alcoholismo, :drogas, :detalles)
            """)
            await db.execute(query_insert, {
                "id_anp": str(uuid4()),
                "id_paciente": str(id_paciente),
                "tabaquismo": tabaquismo,
                "alcoholismo": alcoholismo,
                "drogas": drogas,
                "detalles": detalles
            })

        await db.commit()

        return {
            "data": {
                "tabaquismo": tabaquismo,
                "alcoholismo": alcoholismo,
                "drogas": drogas,
                "detalles": detalles
            },
            "message": "Antecedente no patológico registrado exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al agregar antecedente no patológico: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al agregar antecedente")


# ── POST /pacientes/{id}/antecedentes/ginecoobstetricos ─────────────
@router.post("/{id_paciente}/antecedentes/ginecoobstetricos", response_model=dict, status_code=201)
async def add_antecedente_ginecoobstetrico(
    id_paciente: UUID,
    antecedente_in: dict,
    current_user: dict = Depends(require_role(["MEDICO_GENERAL", "ESPECIALISTA", "RECEPCIONISTA", "ADMINISTRADOR", "SUPERADMIN", "OMNIADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """POST /pacientes/{id}/antecedentes/ginecoobstetricos — Solo pacientes con sexo='F'. Registra datos reproductivos"""
    try:
        # Verificar acceso (Regla 1)
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            raise HTTPException(status_code=403, detail="Acceso denegado")

        # Verificar paciente existe y es mujer
        paciente = await db.scalar(select(Paciente).options(joinedload(Paciente.persona)).where(Paciente.id_paciente == id_paciente, Paciente.eliminado_en == None))
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        persona = paciente.persona
        if not persona or persona.sexo != 'F':
            raise HTTPException(status_code=422, detail="Este antecedente solo aplica a pacientes de sexo femenino")

        # Validar campos
        menarca = antecedente_in.get("menarca")
        ritmo_menstrual = antecedente_in.get("ritmo_menstrual", "").strip()
        gestas = antecedente_in.get("gestas", 0)
        partos = antecedente_in.get("partos", 0)
        abortos = antecedente_in.get("abortos", 0)
        cesareas = antecedente_in.get("cesareas", 0)
        ultimo_papanicolaou = antecedente_in.get("ultimo_papanicolaou")
        ultimo_mamograma = antecedente_in.get("ultimo_mamograma")
        anticonceptivos = antecedente_in.get("anticonceptivos", "").strip()
        detalles = antecedente_in.get("detalles", "").strip()

        # Insertar o actualizar (solo uno por paciente)
        # Primero verificar si ya existe
        existing = await db.scalar(text("""
            SELECT id_ago FROM antecedentes_ginecoobstetricos 
            WHERE id_paciente = :id_paciente AND eliminado_en IS NULL
        """), {"id_paciente": str(id_paciente)})
        
        if existing:
            # Actualizar
            query_update = text("""
                UPDATE antecedentes_ginecoobstetricos SET
                    menarca = :menarca,
                    ritmo_menstrual = :ritmo_menstrual,
                    gestas = :gestas,
                    partos = :partos,
                    abortos = :abortos,
                    cesareas = :cesareas,
                    ultimo_papanicolaou = :ultimo_papanicolaou,
                    ultimo_mamograma = :ultimo_mamograma,
                    anticonceptivos = :anticonceptivos,
                    detalles = :detalles
                WHERE id_ago = :id_ago
            """)
            await db.execute(query_update, {
                "id_ago": str(existing),
                "menarca": menarca,
                "ritmo_menstrual": ritmo_menstrual,
                "gestas": gestas,
                "partos": partos,
                "abortos": abortos,
                "cesareas": cesareas,
                "ultimo_papanicolaou": ultimo_papanicolaou,
                "ultimo_mamograma": ultimo_mamograma,
                "anticonceptivos": anticonceptivos,
                "detalles": detalles
            })
        else:
            # Insertar
            query_insert = text("""
                INSERT INTO antecedentes_ginecoobstetricos (id_ago, id_paciente, menarca, ritmo_menstrual, gestas, partos, abortos, cesareas, ultimo_papanicolaou, ultimo_mamograma, anticonceptivos, detalles)
                VALUES (:id_ago, :id_paciente, :menarca, :ritmo_menstrual, :gestas, :partos, :abortos, :cesareas, :ultimo_papanicolaou, :ultimo_mamograma, :anticonceptivos, :detalles)
            """)
            await db.execute(query_insert, {
                "id_ago": str(uuid4()),
                "id_paciente": str(id_paciente),
                "menarca": menarca,
                "ritmo_menstrual": ritmo_menstrual,
                "gestas": gestas,
                "partos": partos,
                "abortos": abortos,
                "cesareas": cesareas,
                "ultimo_papanicolaou": ultimo_papanicolaou,
                "ultimo_mamograma": ultimo_mamograma,
                "anticonceptivos": anticonceptivos,
                "detalles": detalles
            })

        await db.commit()

        return {
            "data": {
                "menarca": menarca,
                "ritmo_menstrual": ritmo_menstrual,
                "gestas": gestas,
                "partos": partos,
                "abortos": abortos,
                "cesareas": cesareas,
                "ultimo_papanicolaou": ultimo_papanicolaou,
                "ultimo_mamograma": ultimo_mamograma,
                "anticonceptivos": anticonceptivos,
                "detalles": detalles
            },
            "message": "Antecedente ginecoobstétrico registrado exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al agregar antecedente ginecoobstétrico: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al agregar antecedente")


# ── DELETE /pacientes/{id}/antecedentes/{tipo}/{id_ant} ─────────────
@router.delete("/{id_paciente}/antecedentes/{tipo}/{id_ant}", response_model=dict)
async def delete_antecedente(
    id_paciente: UUID,
    tipo: str,
    id_ant: UUID,
    motivo_baja: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """DELETE /pacientes/{id}/antecedentes/{tipo}/{id} — Borrado lógico con motivo_baja obligatorio"""
    try:
        # Verificar acceso (Regla 1)
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            raise HTTPException(status_code=403, detail="Acceso denegado")

        # Validar motivo_baja
        if not motivo_baja or not motivo_baja.strip():
            raise HTTPException(status_code=422, detail="motivo_baja es obligatorio para borrado lógico")

        # Determinar tabla según tipo
        table_map = {
            "patologicos": "antecedentes_patologicos",
            "heredofamiliares": "antecedentes_heredofamiliares",
            "no-patologicos": "antecedentes_no_patologicos",
            "ginecoobstetricos": "antecedentes_ginecoobstetricos"
        }

        if tipo not in table_map:
            raise HTTPException(status_code=422, detail="Tipo de antecedente inválido")

        table = table_map[tipo]
        id_column = "id_ap" if tipo == "patologicos" else f"id_{tipo[:3]}"  # id_ap, id_ahf, id_anp, id_ago

        # Verificar que existe y pertenece al paciente
        query_check = text(f"""
            SELECT {id_column} FROM {table}
            WHERE {id_column} = :id_ant AND id_paciente = :id_paciente AND eliminado_en IS NULL
        """)
        result = await db.execute(query_check, {"id_ant": str(id_ant), "id_paciente": str(id_paciente)})
        if not result.fetchone():
            raise HTTPException(status_code=404, detail="Antecedente no encontrado")

        # Soft delete
        query_delete = text(f"""
            UPDATE {table}
            SET eliminado_en = :eliminado_en, eliminado_por = :eliminado_por, motivo_baja = :motivo_baja
            WHERE {id_column} = :id_ant
        """)

        await db.execute(query_delete, {
            "id_ant": str(id_ant),
            "eliminado_en": datetime.now(timezone.utc),
            "eliminado_por": current_user["sub"],
            "motivo_baja": motivo_baja.strip()
        })

        await db.commit()

        return {
            "data": {"id_antecedente": str(id_ant)},
            "message": "Antecedente eliminado exitosamente (soft delete)"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al eliminar antecedente {tipo}/{id_ant}: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al eliminar antecedente")


# ── GET /pacientes/{id}/inmunizaciones ─────────────────────────────
@router.get("/{id_paciente}/inmunizaciones", response_model=dict)
async def get_inmunizaciones(
    id_paciente: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """GET /pacientes/{id}/inmunizaciones — Lista historial vacunal del paciente"""
    try:
        # Verificar acceso (Regla 1)
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            raise HTTPException(status_code=403, detail="Acceso denegado al expediente clínico")

        # Verificar paciente existe
        paciente = await db.scalar(select(Paciente).where(Paciente.id_paciente == id_paciente, Paciente.eliminado_en == None))
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        # Obtener inmunizaciones
        query = text("""
            SELECT id_inmunizacion, vacuna, fecha_aplicacion, dosis
            FROM inmunizaciones
            WHERE id_paciente = :id_paciente AND eliminado_en IS NULL
            ORDER BY fecha_aplicacion DESC
        """)
        result = await db.execute(query, {"id_paciente": id_paciente})
        inmunizaciones = [
            {
                "id_inmunizacion": str(row[0]),
                "vacuna": row[1],
                "fecha_aplicacion": row[2].isoformat() if row[2] else None,
                "dosis": row[3]
            }
            for row in result.fetchall()
        ]

        return {
            "data": inmunizaciones,
            "message": "Inmunizaciones obtenidas exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener inmunizaciones {id_paciente}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al obtener inmunizaciones")


# ── POST /pacientes/{id}/inmunizaciones ────────────────────────────
@router.post("/{id_paciente}/inmunizaciones", response_model=dict, status_code=201)
async def add_inmunizacion(
    id_paciente: UUID,
    inmunizacion_in: dict,
    current_user: dict = Depends(require_role(["MEDICO_GENERAL", "ESPECIALISTA", "RECEPCIONISTA", "ADMINISTRADOR", "SUPERADMIN", "OMNIADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    """POST /pacientes/{id}/inmunizaciones — Registra vacuna aplicada conforme al Esquema Nacional"""
    try:
        # Verificar acceso (Regla 1)
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            raise HTTPException(status_code=403, detail="Acceso denegado")

        # Verificar paciente existe
        paciente = await db.scalar(select(Paciente).where(Paciente.id_paciente == id_paciente, Paciente.eliminado_en == None))
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        # Validar campos
        vacuna = inmunizacion_in.get("vacuna", "").strip()
        fecha_aplicacion = inmunizacion_in.get("fecha_aplicacion")
        dosis = inmunizacion_in.get("dosis", "").strip()

        if not vacuna:
            raise HTTPException(status_code=422, detail="Campo 'vacuna' requerido")

        # Insertar
        query_insert = text("""
            INSERT INTO inmunizaciones (id_inmunizacion, id_paciente, vacuna, fecha_aplicacion, dosis)
            VALUES (:id_inmunizacion, :id_paciente, :vacuna, :fecha_aplicacion, :dosis)
        """)

        await db.execute(query_insert, {
            "id_inmunizacion": str(uuid4()),
            "id_paciente": str(id_paciente),
            "vacuna": vacuna,
            "fecha_aplicacion": fecha_aplicacion,
            "dosis": dosis
        })

        await db.commit()

        return {
            "data": {"vacuna": vacuna},
            "message": "Inmunización registrada exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al agregar inmunización: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al agregar inmunización")


# ── DELETE /pacientes/{id}/inmunizaciones/{id_vac} ──────────────────
@router.delete("/{id_paciente}/inmunizaciones/{id_vac}", response_model=dict)
async def delete_inmunizacion(
    id_paciente: UUID,
    id_vac: UUID,
    motivo_baja: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """DELETE /pacientes/{id}/inmunizaciones/{id} — Borrado lógico con motivo_baja"""
    try:
        # Verificar acceso (Regla 1)
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            raise HTTPException(status_code=403, detail="Acceso denegado")

        # Validar motivo_baja
        if not motivo_baja or not motivo_baja.strip():
            raise HTTPException(status_code=422, detail="motivo_baja es obligatorio para borrado lógico")

        # Verificar que existe y pertenece al paciente
        query_check = text("""
            SELECT id_inmunizacion FROM inmunizaciones
            WHERE id_inmunizacion = :id_vac AND id_paciente = :id_paciente AND eliminado_en IS NULL
        """)
        result = await db.execute(query_check, {"id_vac": str(id_vac), "id_paciente": str(id_paciente)})
        if not result.fetchone():
            raise HTTPException(status_code=404, detail="Inmunización no encontrada")

        # Soft delete
        query_delete = text("""
            UPDATE inmunizaciones
            SET eliminado_en = :eliminado_en, eliminado_por = :eliminado_por, motivo_baja = :motivo_baja
            WHERE id_inmunizacion = :id_vac
        """)

        await db.execute(query_delete, {
            "id_vac": str(id_vac),
            "eliminado_en": datetime.now(timezone.utc),
            "eliminado_por": current_user["sub"],
            "motivo_baja": motivo_baja.strip()
        })

        await db.commit()

        return {
            "data": {"id_inmunizacion": str(id_vac)},
            "message": "Inmunización eliminada exitosamente (soft delete)"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al eliminar inmunización {id_vac}: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al eliminar inmunización")


# ── POST /pacientes/{id}/tutores ─────────────────────────────────────
@router.post("/{id_paciente}/tutores", response_model=dict, status_code=201)
async def add_tutor(
    id_paciente: UUID,
    tutor: dict = Body(...),
    current_user: dict = Depends(require_role(["RECEPCIONISTA", "ADMINISTRADOR", "SUPERADMIN", "OMNIADMIN"])),
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


# ── GET /pacientes/{id}/prescripciones ──────────────────────────────
@router.get("/{id_paciente}/prescripciones", response_model=dict)
async def get_prescripciones_paciente(
    id_paciente: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """GET /pacientes/{id}/prescripciones — Obtiene todas las prescripciones históricas del paciente"""
    try:
        # Extraer ID de usuario del token
        user_id_str = current_user.get("sub")
        if not user_id_str:
            raise HTTPException(status_code=401, detail="Token no contiene identificación de usuario")
        
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            logger.error(f"ID de usuario inválido en token: {user_id_str}")
            raise HTTPException(status_code=401, detail="ID de usuario inválido")

        # Verificar acceso (Regla 1)
        # Nota: check_regla_1 tiene su propio try/except y devuelve bool
        tiene_acceso = await check_regla_1(id_paciente, user_id, db)
        if not tiene_acceso:
            # Si es médico, puede ser que no tenga encuentro activo.
            # Pero para desarrollo, vamos a ser un poco más permisivos o informar mejor.
            logger.warning(f"Acceso denegado Regla 1: Usuario {user_id} -> Paciente {id_paciente}")
            raise HTTPException(
                status_code=403, 
                detail="Acceso denegado. No tiene un encuentro activo con este paciente o permisos suficientes."
            )

        # Verificar paciente existe
        paciente_exists = await db.scalar(
            select(Paciente.id_paciente)
            .where(Paciente.id_paciente == id_paciente, Paciente.eliminado_en == None)
        )
        if not paciente_exists:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        query = text("""
            SELECT 
                p.id_prescripcion,
                p.id_encuentro,
                p.codigo_medicamento_ssa,
                p.indicacion_dosis,
                p.duracion_dias,
                p.cantidad_surtir,
                p.alerta_ignorada,
                m.nombre_generico,
                m.forma_farmaceutica,
                m.presentacion,
                e.fecha_inicio as fecha_prescripcion
            FROM prescripciones p
            INNER JOIN encuentros_clinicos e ON p.id_encuentro = e.id_encuentro
            INNER JOIN cat_medicamentos m ON p.codigo_medicamento_ssa = m.codigo_medicamento_ssa
            WHERE e.id_paciente = :id_p
            ORDER BY e.fecha_inicio DESC
        """)
        
        result = await db.execute(query, {"id_p": str(id_paciente)})
        rows = result.mappings().all()
        
        # Serializar para JSON
        data = []
        for row in rows:
            item = dict(row)
            # Convertir UUIDs y datetimes a string
            for key, value in item.items():
                if value is None:
                    continue
                if isinstance(value, (uuid.UUID, datetime, date)):
                    item[key] = str(value)
            data.append(item)
        
        return {
            "data": data,
            "message": "Prescripciones históricas obtenidas exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error crítico en get_prescripciones_paciente ({id_paciente}): {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud de prescripciones")

# ── POST /pacientes/{id}/prescripciones/ ──────────────────────
@router.post("/{id_paciente}/prescripciones", response_model=dict, status_code=201)
async def add_prescripcion_paciente(
    id_paciente: UUID,
    prescripcion_in: dict,
    request: Request,
    current_user: dict = Depends(require_role(["MEDICO_GENERAL", "ESPECIALISTA"])),
    db: AsyncSession = Depends(get_db)
):
    """POST /pacientes/{id}/prescripciones — Agrega una nueva prescripción al paciente (requiere encuentro activo)"""
    try:
        # Extraer ID de usuario del token
        user_id_str = current_user.get("sub")
        if not user_id_str:
            raise HTTPException(status_code=401, detail="Token no contiene identificación de usuario")
        
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            logger.error(f"ID de usuario inválido en token: {user_id_str}")
            raise HTTPException(status_code=401, detail="ID de usuario inválido")

        # Verificar acceso (Regla 1)
        tiene_acceso = await check_regla_1(id_paciente, user_id, db)
        if not tiene_acceso:
            logger.warning(f"Acceso denegado Regla 1 para agregar prescripción: Usuario {user_id} -> Paciente {id_paciente}")
            raise HTTPException(
                status_code=403, 
                detail="Acceso denegado. No tiene un encuentro activo con este paciente o permisos suficientes para agregar prescripción."
            )

        # Verificar paciente existe
        paciente_exists = await db.scalar(
            select(Paciente.id_paciente)
            .where(Paciente.id_paciente == id_paciente, Paciente.eliminado_en == None)
        )
        if not paciente_exists:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        # Validar campos requeridos
        codigo_medicamento_ssa = prescripcion_in.get("codigo_medicamento_ssa")
        indicacion_dosis = prescripcion_in.get("indicacion_dosis")
        duracion_dias = prescripcion_in.get("duracion_dias")
        cantidad_surtir = prescripcion_in.get("cantidad_surtir")

        if not all([codigo_medicamento_ssa, indicacion_dosis, duracion_dias, cantidad_surtir]):
            raise HTTPException(status_code=422, detail="Faltan campos requeridos para la prescripción")

        # Verificar que el medicamento existe en catálogo y obtener su nombre
        medicamento = await db.execute(
            select(text("nombre_generico"))
            .select_from(text("cat_medicamentos"))
            .where(text("codigo_medicamento_ssa = :codigo")).params(codigo=codigo_medicamento_ssa)
        )
        medicamento_row = medicamento.fetchone()
        if not medicamento_row:
            raise HTTPException(status_code=422, detail="El código de medicamento SSA no existe en el catálogo")
        
        nombre_medicamento = medicamento_row[0]
        
        # Verificar que el paciente tiene un encuentro activo
        encuentro_activo = await db.scalar(
            select(EncuentroClinico.id_encuentro)
            .where(
                EncuentroClinico.id_paciente == id_paciente,
                EncuentroClinico.fecha_cierre == None
            )
        )
        if not encuentro_activo:
            raise HTTPException(status_code=400, detail="El paciente no tiene un encuentro clínico activo. No se puede agregar prescripción.")

        # --- LÓGICA DE SEGURIDAD P5: VERIFICACIÓN DE ALERGIAS ---
        alerta_ignorada = prescripcion_in.get("alerta_ignorada", False)
        
        # 1. Buscar todas las alergias de este paciente para cruce clínico (incluyendo severidad)
        query_alergias = text("""
            SELECT alergia, severidad 
            FROM alergias 
            WHERE id_paciente = :id_paciente AND eliminado_en IS NULL
        """)
        res_alergias = await db.execute(query_alergias, {"id_paciente": id_paciente})
        alergias_paciente = res_alergias.fetchall()

        # 2. Búsqueda de coincidencia (Persona 5)
        alergia_critica_detectada = None
        alergia_moderada_detectada = None
        
        nombre_med_upper = nombre_medicamento.upper()
        
        for a_row in alergias_paciente:
            a_texto = str(a_row[0]).strip().upper()
            a_sev = str(a_row[1]).strip().upper()
            
            # Coincidencia si el medicamento contiene la sustancia alérgica o viceversa
            if a_texto in nombre_med_upper or nombre_med_upper in a_texto:
                if a_sev == "CRITICA":
                    alergia_critica_detectada = a_texto
                else:
                    alergia_moderada_detectada = a_texto

        # Flag para solo verificar sin guardar
        if prescripcion_in.get("solo_verificar", False):
            return {
                "data": {"verificacion": "OK", "alergia_detectada": None},
                "message": "Verificación de seguridad exitosa"
            }

        # 3. Aplicar Reglas de Negocio (Doc1 §3.5)
        if alergia_critica_detectada and not alerta_ignorada:
            logger.warning(f"BLOQUEO DE SEGURIDAD: Alergia CRÍTICA a {alergia_critica_detectada} para el paciente {id_paciente}")
            raise HTTPException(
                status_code=409,
                detail={
                    "error": "ALERTA_CRITICA_ALERGIA",
                    "mensaje": f"BLOQUEO DE SEGURIDAD: El paciente tiene una alergia CRÍTICA registrada a {alergia_critica_detectada}. No se puede recetar este medicamento sin autorización explícita.",
                    "id_medicamento": codigo_medicamento_ssa,
                    "severidad": "CRITICA"
                }
            )
        
        # Flag de advertencia para el frontend (si es moderada o si la crítica fue ignorada)
        advertencia_alergia = None
        if alergia_critica_detectada and alerta_ignorada:
            advertencia_alergia = f"Riesgo CRÍTICO asumido: Alergia a {alergia_critica_detectada} ignorada por el médico."
        elif alergia_moderada_detectada:
            advertencia_alergia = f"Advertencia de seguridad: El paciente tiene una alergia (Leve/Moderada) a {alergia_moderada_detectada}."
        # --------------------------------------------------------
        # Flag para solo verificar sin guardar (Persona 5 Real-time check)
        if prescripcion_in.get("solo_verificar", False):
            return {
                "data": {"verificacion": "OK", "alergia_detectada": None},
                "message": "Verificación de seguridad exitosa"
            }

        # Insertar prescripción
        query_insert = text("""
            INSERT INTO prescripciones (id_prescripcion, id_encuentro, codigo_medicamento_ssa, indicacion_dosis, duracion_dias, cantidad_surtir, alerta_ignorada)
            VALUES (:id_prescripcion, :id_encuentro, :codigo_medicamento_ssa, :indicacion_dosis, :duracion_dias, :cantidad_surtir, :alerta_ignorada)
        """)
        new_id = str(uuid4())
        await db.execute(query_insert, {
            "id_prescripcion": new_id,
            "id_encuentro": str(encuentro_activo),
            "codigo_medicamento_ssa": codigo_medicamento_ssa,
            "indicacion_dosis": indicacion_dosis,
            "duracion_dias": duracion_dias,
            "cantidad_surtir": cantidad_surtir,
            "alerta_ignorada": alerta_ignorada
        })

        # --- REGISTRO DE AUDITORÍA Y SEGURIDAD (P5) ---
        if alerta_ignorada:
            # 1. Crear registro en auditoria_accesos
            query_audit = text("""
                INSERT INTO auditoria_accesos (id_usuario, modulo_funcion, tipo_evento, resultado, nivel_severidad, detalles, direccion_ip)
                VALUES (:id_usuario, 'PRESCRIPCIONES', 'OVERRIDE_ALERGIA', 'ALERTA_IGNORADA', 'CRITICO', :detalles, :ip)
                RETURNING id_auditoria
            """)
            audit_res = await db.execute(query_audit, {
                "id_usuario": user_id,
                "detalles": f'{{"paciente_id": "{id_paciente}", "medicamento": "{nombre_medicamento}", "motivo": "Prescripción con riesgo de alergia confirmada por médico"}}',
                "ip": request.client.host
            })
            id_auditoria = audit_res.scalar()

            # 2. Crear incidente de seguridad vinculado
            query_incidente = text("""
                INSERT INTO incidentes_seguridad (id_auditoria, estado, notas_investigacion)
                VALUES (:id_audit, 'NUEVO', :notas)
            """)
            await db.execute(query_incidente, {
                "id_audit": id_auditoria,
                "notas": f"El médico ignoró una alerta de alergia crítica para el medicamento {nombre_medicamento} (SSA: {codigo_medicamento_ssa})."
            })

        await db.commit()
        return {
            "data": {
                "id_prescripcion": new_id,
                "advertencia_seguridad": advertencia_alergia
            },
            "message": "Prescripción agregada exitosamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error crítico al agregar prescripción para paciente {id_paciente}: {str(e)}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al agregar prescripción")


# ── ENDPOINTS DE DESCARGA PDF (NOM-004 / NOM-151) ──────────────────────────

@router.get("/{id_paciente}/prescripciones/{id_prescripcion}/pdf")
async def download_receta_pdf(
    id_paciente: UUID,
    id_prescripcion: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role(["MEDICO_GENERAL", "ESPECIALISTA", "ADMIN"]))
):
    """Genera y descarga el PDF de una prescripción específica"""
    try:
        # 1. Datos de la prescripción
        query_rx = text("""
            SELECT p.*, m.nombre_generico, m.presentacion 
            FROM prescripciones p
            LEFT JOIN cat_medicamentos m ON p.codigo_medicamento_ssa = m.codigo_medicamento_ssa
            WHERE p.id_prescripcion = :id_rx
        """)
        res_rx = await db.execute(query_rx, {"id_rx": id_prescripcion})
        rx = res_rx.mappings().first()
        
        if not rx: 
            raise HTTPException(status_code=404, detail="La prescripción solicitada no existe en la base de datos.")

        # Datos seguros para el PDF (Persona 5 Fallbacks)
        nombre_med = rx["nombre_generico"] or "Medicamento (Ver indicaciones)"
        presentacion_med = rx["presentacion"] or "N/A"

        # 2. Datos del paciente
        query_pac = select(Paciente).options(joinedload(Paciente.persona)).where(Paciente.id_paciente == id_paciente)
        res_pac = await db.execute(query_pac)
        pac = res_pac.scalar_one_or_none()
        edad = datetime.now().year - pac.persona.fecha_nacimiento.year if pac and pac.persona.fecha_nacimiento else "N/A"

        # 3. Datos del médico
        query_med = text("SELECT nombre, primer_apellido, cedula_profesional FROM usuarios_sistema u JOIN personas p ON u.id_persona = p.id_persona WHERE u.id_usuario = :id_u")
        res_med = await db.execute(query_med, {"id_u": current_user["sub"]})
        med = res_med.mappings().first()

        # 4. Generar PDF con datos de respaldo (Fallbacks)
        pdf_bytes = MedIAPDFGenerator.generar_receta_pdf(
            {
                "medicamento": nombre_med, 
                "presentacion": presentacion_med, 
                "indicaciones": rx.get("indicacion_dosis", "Según indicación médica"), 
                "duracion": f"{rx.get('duracion_dias', 1)} días"
            },
            {
                "nombre": f"{pac.persona.nombre} {pac.persona.primer_apellido}" if pac else "Paciente Desconocido", 
                "expediente": pac.numero_expediente if pac else "N/A", 
                "edad": str(edad), 
                "sexo": pac.persona.sexo if pac else "N/A"
            },
            {
                "nombre": f"Dr. {med.get('nombre', 'Sistema')} {med.get('primer_apellido', 'MedIA')}" if med else "Dr. MedIA", 
                "cedula": (med.get("cedula_profesional") if med else None) or "En Trámite"
            }
        )

        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=receta_{id_prescripcion}.pdf"})
    except Exception as e:
        logger.error(f"Error PDF Receta: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error al generar PDF de receta")


@router.get("/{id_paciente}/estudios/{id_solicitud}/pdf")
async def download_estudio_pdf(
    id_paciente: UUID,
    id_solicitud: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role(["MEDICO_GENERAL", "ESPECIALISTA", "ADMIN"]))
):
    """Genera y descarga el PDF de una solicitud de laboratorio"""
    try:
        query_est = text("SELECT * FROM solicitudes_estudio WHERE id_solicitud = :id_s")
        res_est = await db.execute(query_est, {"id_s": id_solicitud})
        est = res_est.mappings().first()
        if not est: raise HTTPException(status_code=404, detail="Solicitud no encontrada")

        query_pac = select(Paciente).options(joinedload(Paciente.persona)).where(Paciente.id_paciente == id_paciente)
        res_pac = await db.execute(query_pac); pac = res_pac.scalar_one_or_none()
        edad = datetime.now().year - pac.persona.fecha_nacimiento.year if pac and pac.persona.fecha_nacimiento else "N/A"

        query_med = text("SELECT nombre, primer_apellido, cedula_profesional FROM usuarios_sistema u JOIN personas p ON u.id_persona = p.id_persona WHERE u.id_usuario = :id_u")
        res_med = await db.execute(query_med, {"id_u": current_user["sub"]})
        med = res_med.mappings().first()

        pdf_bytes = MedIAPDFGenerator.generar_solicitud_estudio_pdf(
            {
                "tipo_estudio": est["tipo_estudio"],
                "indicacion": est.get("indicacion_clinica") or est["descripcion"],
                "urgente": bool(est.get("urgente", False))
            },
            {"nombre": f"{pac.persona.nombre} {pac.persona.primer_apellido}", "expediente": pac.numero_expediente, "edad": str(edad), "sexo": pac.persona.sexo},
            {"nombre": f"Dr. {med['nombre']} {med['primer_apellido']}", "cedula": med["cedula_profesional"] or "En Tramite"}
        )

        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=solicitud_{id_solicitud}.pdf"})
    except Exception as e:
        logger.error(f"Error PDF Estudio: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error al generar PDF de estudio")


@router.get("/{id_paciente}/referencias/{id_referencia}/pdf")
async def download_referencia_pdf(
    id_paciente: UUID,
    id_referencia: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role(["MEDICO_GENERAL", "ESPECIALISTA", "ADMIN"]))
):
    """Genera y descarga el PDF de una referencia médica"""
    try:
        query_ref = text("""
            SELECT r.*, e.nombre as unidad_destino, esp.nombre as especialidad_nombre
            FROM referencias_medicas r
            JOIN establecimientos e ON r.id_establecimiento_destino = e.id_establecimiento
            JOIN cat_especialidades_medicas esp ON r.id_especialidad_destino = esp.id_especialidad
            WHERE r.id_referencia = :id_r
        """)
        res_ref = await db.execute(query_ref, {"id_r": id_referencia})
        ref = res_ref.mappings().first()
        if not ref: raise HTTPException(status_code=404, detail="Referencia no encontrada")

        query_pac = select(Paciente).options(joinedload(Paciente.persona)).where(Paciente.id_paciente == id_paciente)
        res_pac = await db.execute(query_pac); pac = res_pac.scalar_one_or_none()
        edad = datetime.now().year - pac.persona.fecha_nacimiento.year if pac and pac.persona.fecha_nacimiento else "N/A"

        query_med = text("SELECT nombre, primer_apellido, cedula_profesional FROM usuarios_sistema u JOIN personas p ON u.id_persona = p.id_persona WHERE u.id_usuario = :id_u")
        res_med = await db.execute(query_med, {"id_u": current_user["sub"]})
        med = res_med.mappings().first()

        pdf_bytes = MedIAPDFGenerator.generar_referencia_pdf(
            {"unidad_destino": ref["unidad_destino"], "especialidad": ref["especialidad_nombre"], "motivo": ref["motivo_referencia"]},
            {"nombre": f"{pac.persona.nombre} {pac.persona.primer_apellido}", "expediente": pac.numero_expediente, "edad": str(edad), "sexo": pac.persona.sexo},
            {"nombre": f"Dr. {med['nombre']} {med['primer_apellido']}", "cedula": med["cedula_profesional"] or "En Tramite"}
        )

        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=referencia_{id_referencia}.pdf"})
    except Exception as e:
        logger.error(f"Error PDF Referencia: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error al generar PDF de referencia")
    