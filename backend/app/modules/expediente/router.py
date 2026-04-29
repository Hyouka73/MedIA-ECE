"""
Expediente Clínico — Router de consulta de datos del expediente
Incluye antecedentes, alergias, inmunizaciones, datos clínicos básicos
Aplica reglas de acceso (Regla 1 principalmente)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.orm import joinedload
from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.auth import Paciente, Persona
from app.schemas.pacientes import PersonaOut
from app.services.acceso import check_regla_1
from uuid import UUID
from datetime import date
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_edad(fecha_nacimiento: date) -> int:
    """Calcula edad desde fecha de nacimiento"""
    from datetime import date as date_cls
    today = date_cls.today()
    return today.year - fecha_nacimiento.year - ((today.month, today.day) < (fecha_nacimiento.month, fecha_nacimiento.day))


# ── GET /expediente/{id_paciente} — Expediente Completo ───────────────
@router.get("/{id_paciente}", response_model=dict)
async def get_expediente_completo(
    id_paciente: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    GET /expediente/{id_paciente} — Obtiene expediente clínico completo
    
    Aplica Regla 1: El usuario debe tener un encuentro activo con el paciente
    Devuelve: Datos personales + antecedentes + alergias + inmunizaciones
    """
    try:
        # Regla 1: Verificar acceso
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            logger.warning(f"Acceso denegado al expediente {id_paciente} para usuario {current_user['sub']}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso al expediente clínico de este paciente. Requiere un encuentro activo."
            )

        # Obtener paciente y persona
        paciente = await db.scalar(
            select(Paciente).options(joinedload(Paciente.persona)).where(
                Paciente.id_paciente == id_paciente,
                Paciente.eliminado_en == None
            )
        )
        
        if not paciente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Paciente no encontrado"
            )

        persona = paciente.persona
        persona_out = None
        edad = None
        
        if persona:
            edad = _get_edad(persona.fecha_nacimiento)
            persona_out = PersonaOut(
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
                alerta_barrera_linguistica=bool(persona.id_lengua_materna)
            )

        # Obtener alergias
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

        # Obtener inmunizaciones
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
                "grupo_sanguineo": paciente.grupo_sanguineo,
                "edad": edad,
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener expediente clínico"
        )


# ── POST /expediente/{id_paciente}/alergias ─────────────────────────────
@router.post("/{id_paciente}/alergias", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_alergia(
    id_paciente: UUID,
    alergia_in: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    POST /expediente/{id_paciente}/alergias — Agrega alergia al paciente
    Body: { "alergia": "str", "severidad": "LEVE|MODERADA|CRITICA" }
    """
    try:
        # Verificar acceso (Regla 1)
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")

        # Verificar paciente existe
        paciente = await db.scalar(
            select(Paciente).where(Paciente.id_paciente == id_paciente, Paciente.eliminado_en == None)
        )
        if not paciente:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente no encontrado")

        # Validar campos
        alergia_texto = alergia_in.get("alergia", "").strip()
        severidad = alergia_in.get("severidad", "LEVE")
        
        if not alergia_texto:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="El campo 'alergia' es requerido")
        
        if severidad not in ["LEVE", "MODERADA", "CRITICA"]:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Severidad inválida")

        # Insertar alergia
        from datetime import datetime, timezone
        from uuid import uuid4
        
        query_insert = text("""
            INSERT INTO alergias (id_alergia, id_paciente, alergia, severidad, registrado_por, fecha_registro)
            VALUES (:id_alergia, :id_paciente, :alergia, :severidad, :registrado_por, :fecha_registro)
        """)
        
        await db.execute(query_insert, {
            "id_alergia": str(uuid4()),
            "id_paciente": str(id_paciente),
            "alergia": alergia_texto,
            "severidad": severidad,
            "registrado_por": current_user["sub"],
            "fecha_registro": datetime.now(timezone.utc)
        })
        
        await db.commit()

        return {
            "data": {"alergia": alergia_texto, "severidad": severidad},
            "message": "Alergia registrada exitosamente"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al agregar alergia: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al agregar alergia"
        )


# ── POST /expediente/{id_paciente}/antecedentes/patologicos ────────────────
@router.post("/{id_paciente}/antecedentes/patologicos", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_antecedente_patologico(
    id_paciente: UUID,
    antecedente_in: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    POST /expediente/{id_paciente}/antecedentes/patologicos
    Body: { "enfermedad": "str", "fecha_diagnostico": "YYYY-MM-DD", "tratamiento_actual": "str" }
    """
    try:
        # Verificar acceso (Regla 1)
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")

        # Verificar paciente
        paciente = await db.scalar(
            select(Paciente).where(Paciente.id_paciente == id_paciente, Paciente.eliminado_en == None)
        )
        if not paciente:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente no encontrado")

        # Validar campos
        enfermedad = antecedente_in.get("enfermedad", "").strip()
        fecha_diagnostico = antecedente_in.get("fecha_diagnostico")
        tratamiento = antecedente_in.get("tratamiento_actual", "").strip()
        
        if not enfermedad:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Campo 'enfermedad' requerido")

        # Insertar
        from uuid import uuid4
        
        query_insert = text("""
            INSERT INTO antecedentes_patologicos (id_ap, id_paciente, enfermedad, fecha_diagnostico, tratamiento_actual)
            VALUES (:id_ap, :id_paciente, :enfermedad, :fecha_diagnostico, :tratamiento_actual)
        """)
        
        await db.execute(query_insert, {
            "id_ap": str(uuid4()),
            "id_paciente": str(id_paciente),
            "enfermedad": enfermedad,
            "fecha_diagnostico": fecha_diagnostico,
            "tratamiento_actual": tratamiento
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al agregar antecedente"
        )


# ── POST /expediente/{id_paciente}/inmunizaciones ─────────────────────────
@router.post("/{id_paciente}/inmunizaciones", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_inmunizacion(
    id_paciente: UUID,
    inmunizacion_in: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    POST /expediente/{id_paciente}/inmunizaciones
    Body: { "vacuna": "str", "fecha_aplicacion": "YYYY-MM-DD", "dosis": "str" }
    """
    try:
        # Verificar acceso (Regla 1)
        tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
        if not tiene_acceso:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")

        # Verificar paciente
        paciente = await db.scalar(
            select(Paciente).where(Paciente.id_paciente == id_paciente, Paciente.eliminado_en == None)
        )
        if not paciente:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente no encontrado")

        # Validar campos
        vacuna = inmunizacion_in.get("vacuna", "").strip()
        fecha_aplicacion = inmunizacion_in.get("fecha_aplicacion")
        dosis = inmunizacion_in.get("dosis", "").strip()
        
        if not vacuna:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Campo 'vacuna' requerido")

        # Insertar
        from uuid import uuid4
        
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al agregar inmunización"
        )
