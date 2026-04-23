<<<<<<< HEAD
"""Encuentros Clínicos — SOAP, signos vitales, diagnósticos, prescripciones"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.core.deps import get_current_user, require_role
from app.database.session import get_db
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Optional
import logging

logger = logging.getLogger(__name__)
=======
"""Encuentros Clínicos — SOAP, signos vitales, diagnósticos CIE-10, prescripciones"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, insert
from app.core.deps import get_current_user, require_role, get_db
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
import logging
>>>>>>> feature/p5-modules-frontend

# --- IMPORTACIONES DE MODELOS CENTRALIZADOS (CORREGIDAS) ---
from app.models.auth import CatMedicamento, Alergia, AuditoriaAcceso, CatCIE10

logger = logging.getLogger(__name__)
router = APIRouter()

<<<<<<< HEAD

=======
# --- SCHEMA PARA PRESCRIPCIONES ---
class PrescripcionCreate(BaseModel):
    id_medicamento: str 
    id_paciente: UUID
    dosis: str
    via_administracion: str
    frecuencia: str
    duracion_dias: Optional[int] = None
    indicaciones: Optional[str] = None
    confirmar_alergia: bool = False


>>>>>>> feature/p5-modules-frontend
# ── GET /encuentros ────────────────────────────────────────────────────
@router.get("", response_model=dict)
async def list_encuentros(
    current_user: dict = Depends(get_current_user),
    id_paciente: Optional[UUID] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
<<<<<<< HEAD
    GET /encuentros — Lista encuentros clínicos del usuario o de un paciente específico
=======
    GET /encuentros — Lista encuentros con diagnóstico CIE-10 incluido
>>>>>>> feature/p5-modules-frontend
    """
    try:
        offset = (page - 1) * limit
        
<<<<<<< HEAD
        # Si se especifica id_paciente, verificar acceso
=======
>>>>>>> feature/p5-modules-frontend
        if id_paciente:
            try:
                from app.services.acceso import check_regla_1
                tiene_acceso = await check_regla_1(id_paciente, UUID(current_user["sub"]), db)
                if not tiene_acceso:
<<<<<<< HEAD
                    # ⚠️ TEMPORAL: En desarrollo, permitir acceso para testing
                    logger.warning(f"Acceso denegado pero permitido en modo desarrollo para usuario {current_user['sub']}")
                    # raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
            except ImportError:
                logger.warning("Servicio de acceso no disponible - modo desarrollo")
                # Continuar sin verificación en desarrollo
        
        # Construir query base
        query = """
            SELECT 
                id_encuentro, id_paciente, id_medico, id_establecimiento, 
                id_especialidad, fecha_inicio, fecha_cierre, motivo_consulta
            FROM encuentros_clinicos
=======
                    logger.warning(f"Acceso denegado pero permitido en desarrollo para {current_user['sub']}")
            except ImportError:
                logger.warning("Servicio de acceso no disponible")
        
        # Query con JOIN a cat_cie10 para mostrar el nombre del diagnóstico
        query = """
            SELECT 
                e.id_encuentro, e.id_paciente, e.id_medico, e.id_establecimiento, 
                e.id_especialidad, e.fecha_inicio, e.fecha_cierre, e.motivo_consulta,
                e.id_diagnostico, c.descripcion as diagnostico_nombre
            FROM encuentros_clinicos e
            LEFT JOIN cat_cie10 c ON e.id_diagnostico = c.id_cie10
>>>>>>> feature/p5-modules-frontend
            WHERE 1=1
        """
        count_query = "SELECT COUNT(*) FROM encuentros_clinicos WHERE 1=1"
        params = {}
        
<<<<<<< HEAD
        # Filtros
        if id_paciente:
            query += " AND id_paciente = :id_paciente"
            count_query += " AND id_paciente = :id_paciente"
            params["id_paciente"] = str(id_paciente)
        else:
            # Solo mostrar encuentros del médico actual
            query += " AND id_medico = :id_medico"
            count_query += " AND id_medico = :id_medico"
            params["id_medico"] = current_user["sub"]
        
        # Contar total
=======
        if id_paciente:
            query += " AND e.id_paciente = :id_paciente"
            count_query += " AND id_paciente = :id_paciente"
            params["id_paciente"] = str(id_paciente)
        else:
            query += " AND e.id_medico = :id_medico"
            count_query += " AND id_medico = :id_medico"
            params["id_medico"] = current_user["sub"]
        
>>>>>>> feature/p5-modules-frontend
        result_count = await db.execute(text(count_query), params)
        total = result_count.scalar() or 0
        total_pages = (total + limit - 1) // limit if total else 1
        
<<<<<<< HEAD
        # Paginación
        query_paged = query + f" ORDER BY fecha_inicio DESC LIMIT {limit} OFFSET {offset}"
=======
        query_paged = query + f" ORDER BY e.fecha_inicio DESC LIMIT {limit} OFFSET {offset}"
>>>>>>> feature/p5-modules-frontend
        result = await db.execute(text(query_paged), params)
        encuentros = result.fetchall()
        
        items = [
            {
                "id_encuentro": str(row[0]),
                "id_paciente": str(row[1]),
                "id_medico": str(row[2]),
                "id_establecimiento": str(row[3]) if row[3] else None,
                "id_especialidad": row[4],
                "fecha_inicio": row[5].isoformat() if row[5] else None,
                "fecha_cierre": row[6].isoformat() if row[6] else None,
<<<<<<< HEAD
                "motivo_consulta": row[7]
=======
                "motivo_consulta": row[7],
                "diagnostico": {"codigo": row[8], "nombre": row[9]} if row[8] else None
>>>>>>> feature/p5-modules-frontend
            }
            for row in encuentros
        ]
        
        return {
            "data": {
                "items": items,
                "pages": total_pages,
                "total": total,
                "page": page,
                "limit": limit
            },
            "message": "Lista de encuentros obtenida exitosamente"
        }
<<<<<<< HEAD
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener encuentros: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener encuentros"
        )


# ── POST /encuentros ────────────────────────────────────────────────────
@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_encuentro(
    data: dict,
    current_user: dict = Depends(require_role("MEDICO_GENERAL", "ESPECIALISTA", "SUPERADMIN", "OMNIADMIN")),
    db: AsyncSession = Depends(get_db)
):
    """
    POST /encuentros — Crea un encuentro clínico
    Body:
    {
        "id_paciente": uuid,
        "id_establecimiento": uuid,
        "id_especialidad": int,
        "motivo_consulta": "str"
    }
=======
    except Exception as e:
        logger.error(f"Error al obtener encuentros: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno")


# ── POST /encuentros (CON DIAGNÓSTICO CIE-10) ──────────────────────────
@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_encuentro(
    data: dict,
    current_user: dict = Depends(require_role("MEDICO_GENERAL", "ESPECIALISTA", "SUPERADMIN")),
    db: AsyncSession = Depends(get_db)
):
    """
    POST /encuentros — Crea un encuentro validando el catálogo CIE-10
>>>>>>> feature/p5-modules-frontend
    """
    try:
        id_paciente = data.get("id_paciente")
        id_establecimiento = data.get("id_establecimiento")
        id_especialidad = data.get("id_especialidad")
<<<<<<< HEAD
        motivo_consulta = data.get("motivo_consulta", "").strip()
        
        # Validar campos requeridos
        if not id_paciente or not id_establecimiento or not id_especialidad or not motivo_consulta:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Campos requeridos: id_paciente, id_establecimiento, id_especialidad, motivo_consulta"
            )
        
        # Verificar que el paciente existe
        query_paciente = text("SELECT id_paciente FROM pacientes WHERE id_paciente = :id AND eliminado_en IS NULL")
        result = await db.execute(query_paciente, {"id": str(id_paciente)})
        if not result.scalar():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente no encontrado")
        
        # Crear encuentro
        id_encuentro = str(uuid4())
        query_insert = text("""
            INSERT INTO encuentros_clinicos 
            (id_encuentro, id_paciente, id_medico, id_establecimiento, id_especialidad, fecha_inicio, motivo_consulta)
            VALUES (:id_encuentro, :id_paciente, :id_medico, :id_establecimiento, :id_especialidad, :fecha_inicio, :motivo_consulta)
        """)
        
        await db.execute(query_insert, {
            "id_encuentro": id_encuentro,
            "id_paciente": str(id_paciente),
            "id_medico": current_user["sub"],
            "id_establecimiento": str(id_establecimiento),
            "id_especialidad": id_especialidad,
            "fecha_inicio": datetime.now(timezone.utc),
            "motivo_consulta": motivo_consulta
        })
        
        await db.commit()
        
        return {
            "data": {
                "id_encuentro": id_encuentro,
                "motivo_consulta": motivo_consulta,
                "fecha_inicio": datetime.now(timezone.utc).isoformat()
            },
            "message": "Encuentro clínico creado exitosamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al crear encuentro: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al crear encuentro"
        )
=======
        id_diagnostico = data.get("id_diagnostico") # El código (ej: E11.9)
        motivo_consulta = data.get("motivo_consulta", "").strip()
        
        if not id_paciente or not id_diagnostico or not motivo_consulta:
            raise HTTPException(status_code=422, detail="Paciente, Diagnóstico y Motivo son requeridos")
        
        # Validar existencia del diagnóstico en catálogo centralizado
        stmt_cie = select(CatCIE10).where(CatCIE10.id_cie10 == id_diagnostico)
        res_cie = await db.execute(stmt_cie)
        if not res_cie.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Código CIE-10 '{id_diagnostico}' no válido")

        id_encuentro = str(uuid4())
        query_insert = text("""
            INSERT INTO encuentros_clinicos 
            (id_encuentro, id_paciente, id_medico, id_establecimiento, id_especialidad, id_diagnostico, fecha_inicio, motivo_consulta)
            VALUES (:id, :pac, :med, :est, :esp, :diag, :fecha, :mot)
        """)
        
        await db.execute(query_insert, {
            "id": id_encuentro,
            "pac": str(id_paciente),
            "med": current_user["sub"],
            "est": str(id_establecimiento),
            "esp": id_especialidad,
            "diag": id_diagnostico,
            "fecha": datetime.now(timezone.utc),
            "mot": motivo_consulta
        })
        
        await db.commit()
        return {
            "data": {"id_encuentro": id_encuentro, "fecha_inicio": datetime.now(timezone.utc).isoformat()},
            "message": "Encuentro clínico creado exitosamente"
        }
    except Exception as e:
        await db.rollback()
        logger.error(f"Error al crear encuentro: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al crear encuentro")
>>>>>>> feature/p5-modules-frontend


# ── PATCH /encuentros/{id}/cerrar ──────────────────────────────────────
@router.patch("/{id_encuentro}/cerrar", response_model=dict)
async def cerrar_encuentro(
    id_encuentro: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
<<<<<<< HEAD
    PATCH /encuentros/{id}/cerrar — Cierra un encuentro (irreversible)
    Solo el médico que lo creó puede cerrarlo
    """
    try:
        # Obtener encuentro
        query_encounter = text("""
            SELECT id_encuentro, id_medico, fecha_cierre FROM encuentros_clinicos 
            WHERE id_encuentro = :id
        """)
        result = await db.execute(query_encounter, {"id": str(id_encuentro)})
        encuentro = result.fetchone()
        
        if not encuentro:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Encuentro no encontrado")
        
        # Verificar que sea el médico del encuentro
        if encuentro[1] != current_user["sub"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo el médico que creó el encuentro puede cerrarlo")
        
        # Verificar que no esté ya cerrado
        if encuentro[2] is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El encuentro ya está cerrado")
        
        # Cerrar encuentro
        query_update = text("""
            UPDATE encuentros_clinicos 
            SET fecha_cierre = :fecha_cierre 
            WHERE id_encuentro = :id
        """)
        
        await db.execute(query_update, {
            "id": str(id_encuentro),
            "fecha_cierre": datetime.now(timezone.utc)
        })
        
        await db.commit()
        
        return {
            "data": {"id_encuentro": str(id_encuentro)},
            "message": "Encuentro clínico cerrado exitosamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al cerrar encuentro: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al cerrar encuentro"
        )
=======
    PATCH /encuentros/{id}/cerrar — Cierre irreversible por el autor
    """
    try:
        query_encounter = text("SELECT id_medico, fecha_cierre FROM encuentros_clinicos WHERE id_encuentro = :id")
        result = await db.execute(query_encounter, {"id": str(id_encuentro)})
        encuentro = result.fetchone()
        
        if not encuentro: raise HTTPException(status_code=404, detail="No encontrado")
        if encuentro[0] != current_user["sub"]: raise HTTPException(status_code=403, detail="No autorizado")
        if encuentro[1] is not None: raise HTTPException(status_code=400, detail="Ya está cerrado")
        
        await db.execute(text("UPDATE encuentros_clinicos SET fecha_cierre = :fecha WHERE id_encuentro = :id"), 
                        {"id": str(id_encuentro), "fecha": datetime.now(timezone.utc)})
        await db.commit()
        return {"message": "Encuentro clínico cerrado exitosamente"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error al cerrar")
>>>>>>> feature/p5-modules-frontend


# ── POST /encuentros/{id}/signos-vitales ───────────────────────────────
@router.post("/{id_encuentro}/signos-vitales", response_model=dict, status_code=status.HTTP_201_CREATED)
async def registrar_signos_vitales(
    id_encuentro: UUID,
    data: dict,
    current_user: dict = Depends(require_role("ENFERMERO", "MEDICO_GENERAL", "ESPECIALISTA", "SUPERADMIN")),
    db: AsyncSession = Depends(get_db)
):
<<<<<<< HEAD
    """
    POST /encuentros/{id}/signos-vitales — Registra signos vitales
    Body:
    {
        "peso_kg": float,
        "talla_cm": float,
        "temperatura_c": float,
        "frecuencia_cardiaca": int,
        "frecuencia_respiratoria": int,
        "presion_sistolica": int,
        "presion_diastolica": int,
        "saturacion_oxigeno": int
    }
    """
    try:
        # Verificar que el encuentro existe y está abierto
        query_encuentro = text("""
            SELECT fecha_cierre FROM encuentros_clinicos 
            WHERE id_encuentro = :id
        """)
        result = await db.execute(query_encuentro, {"id": str(id_encuentro)})
        encuentro = result.fetchone()
        
        if not encuentro:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Encuentro no encontrado")
        
        if encuentro[0] is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El encuentro está cerrado")
        
        # Registrar signos vitales
=======
    try:
        query_enc_check = text("SELECT fecha_cierre FROM encuentros_clinicos WHERE id_encuentro = :id")
        res_check = await db.execute(query_enc_check, {"id": str(id_encuentro)})
        enc = res_check.fetchone()
        if not enc or enc[0] is not None: raise HTTPException(status_code=400, detail="Encuentro cerrado o inexistente")

>>>>>>> feature/p5-modules-frontend
        id_signos = str(uuid4())
        query_insert = text("""
            INSERT INTO signos_vitales 
            (id_signos, id_encuentro, id_enfermero, peso_kg, talla_cm, temperatura_c, 
             frecuencia_cardiaca, frecuencia_respiratoria, presion_sistolica, presion_diastolica, 
             saturacion_oxigeno, fecha_toma)
<<<<<<< HEAD
            VALUES (:id_signos, :id_encuentro, :id_enfermero, :peso_kg, :talla_cm, :temperatura_c, 
                    :frecuencia_cardiaca, :frecuencia_respiratoria, :presion_sistolica, :presion_diastolica, 
                    :saturacion_oxigeno, :fecha_toma)
        """)
        
        await db.execute(query_insert, {
            "id_signos": id_signos,
            "id_encuentro": str(id_encuentro),
            "id_enfermero": current_user["sub"],
            "peso_kg": data.get("peso_kg"),
            "talla_cm": data.get("talla_cm"),
            "temperatura_c": data.get("temperatura_c"),
            "frecuencia_cardiaca": data.get("frecuencia_cardiaca"),
            "frecuencia_respiratoria": data.get("frecuencia_respiratoria"),
            "presion_sistolica": data.get("presion_sistolica"),
            "presion_diastolica": data.get("presion_diastolica"),
            "saturacion_oxigeno": data.get("saturacion_oxigeno"),
            "fecha_toma": datetime.now(timezone.utc)
        })
        
        await db.commit()
        
        return {
            "data": {"id_signos": id_signos},
            "message": "Signos vitales registrados exitosamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al registrar signos vitales: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al registrar signos vitales"
        )
=======
            VALUES (:id_sig, :id_enc, :id_enf, :peso, :talla, :temp, :fc, :fr, :ps, :pd, :so2, :fecha)
        """)
        
        await db.execute(query_insert, {
            "id_sig": id_signos, "id_enc": str(id_encuentro), "id_enf": current_user["sub"],
            "peso": data.get("peso_kg"), "talla": data.get("talla_cm"), "temp": data.get("temperatura_c"),
            "fc": data.get("frecuencia_cardiaca"), "fr": data.get("frecuencia_respiratoria"),
            "ps": data.get("presion_sistolica"), "pd": data.get("presion_diastolica"),
            "so2": data.get("saturacion_oxigeno"), "fecha": datetime.now(timezone.utc)
        })
        await db.commit()
        return {"message": "Signos registrados exitosamente"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error al registrar signos")


# ── POST /encuentros/{id}/prescripciones ───────────────────────────────
@router.post("/{id_encuentro}/prescripciones", status_code=status.HTTP_201_CREATED)
async def crear_prescripcion(
    id_encuentro: UUID, 
    data: PrescripcionCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    POST /encuentros/{id}/prescripciones con validación de alergias y auditoría
    """
    # 1. Buscar medicamento
    stmt_med = select(CatMedicamento).where(CatMedicamento.codigo_medicamento_ssa == data.id_medicamento)
    res_med = await db.execute(stmt_med)
    medicamento = res_med.scalar_one_or_none()
    
    if not medicamento:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado en catálogo")

    # 2. VALIDACIÓN DE ALERGIAS REAL (Usando Alergia del modelo centralizado)
    stmt_ale = select(Alergia).where(
        Alergia.id_paciente == data.id_paciente,
        Alergia.alergia.ilike(f"%{medicamento.nombre_generico}%")
    )
    res_ale = await db.execute(stmt_ale)
    alergias = res_ale.scalars().all()

    for ale in alergias:
        if ale.severidad == "CRITICA" and not data.confirmar_alergia:
            try:
                # AUDITORÍA FORENSE USANDO MODELO CENTRALIZADO
                stmt_audit = insert(AuditoriaAcceso).values(
                    id_usuario=current_user["sub"], 
                    direccion_ip="127.0.0.1",
                    modulo_funcion="CLINICO_PRESCIPCION",
                    tipo_evento="INTENTO_RIESGO_ALERGIA",
                    resultado="DENEGADO",
                    nivel_severidad="CRITICA",
                    detalles={
                        "alerta": "Alergia bloqueada",
                        "medicamento": medicamento.nombre_generico,
                        "paciente_id": str(data.id_paciente)
                    }
                )
                await db.execute(stmt_audit)
                await db.commit()
            except Exception as e:
                logger.error(f"Error auditoria: {str(e)}")
                await db.rollback()

            raise HTTPException(
                status_code=409,
                detail={"codigo": "ALERTA_ALERGIA", "mensaje": f"BLOQUEO: Alérgico a {ale.alergia}"}
            )

    return {"status": "success", "message": "Prescripción validada correctamente"}
>>>>>>> feature/p5-modules-frontend
