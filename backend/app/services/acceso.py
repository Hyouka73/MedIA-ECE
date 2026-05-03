"""
Servicio de Control de Acceso — Las 4 Reglas de Negocio Clínicas
Estas funciones son la ÚNICA vía para acceder a datos clínicos.
Los routers las llaman ANTES de cualquier query a BD.

Requisito Forense: Todas las decisiones de acceso se auditan automáticamente en middleware/audit.py
"""
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)


# ── Regla 1: Datos Universales ────────────────────────────────────────────────
async def check_regla_1(id_paciente: UUID, id_usuario: UUID, db: AsyncSession) -> bool:
    """
    Datos básicos del paciente (nombre, CURP, alergias, antecedentes) son visibles
    para cualquier médico del Distrito CON un encuentro activo.
    """
    try:
        from app.models.auth import User
        from sqlalchemy import text
        
        # Verificar que el usuario existe
        user_query = select(User).where(User.id_usuario == id_usuario)
        user = await db.scalar(user_query)
        if not user or not user.id_rol:
            logger.warning(f"check_regla_1: Usuario {id_usuario} no existe o no tiene rol")
            return False
        
        # ✅ PERMITIR ACCESO A ADMINISTRADORES SIN ENCUENTRO (DESARROLLO)
        query_rol = text("""
            SELECT r.codigo 
            FROM usuarios_sistema u
            JOIN roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = :id_usuario
        """)
        result_rol = await db.execute(query_rol, {"id_usuario": str(id_usuario)})
        rol = result_rol.scalar()
        
        if rol in ['SUPERADMIN', 'OMNIADMIN', 'ADMINISTRADOR']:
            logger.info(f"check_regla_1: Acceso concedido a administrador {id_usuario}")
            return True
        
        # Para médicos, verificar encuentro ACTIVO (Req Forense)
        # ✅ MEJORA: Permitir acceso si hay encuentro activo del paciente en el mismo establecimiento,
        # incluso si id_medico es NULL (triaje) o si el médico actual está atendiendo.
        query_encounter = text("""
            SELECT COUNT(*) as total 
            FROM encuentros_clinicos e
            JOIN usuarios_establecimientos ue ON e.id_establecimiento = ue.id_establecimiento
            WHERE e.id_paciente = :id_paciente 
              AND e.fecha_cierre IS NULL
              AND ue.id_usuario = :id_usuario
        """)
        result = await db.execute(query_encounter, {
            "id_paciente": str(id_paciente),
            "id_usuario": str(id_usuario)
        })
        count = result.scalar() or 0
        
        allowed = count > 0
        if not allowed:
            logger.warning(f"check_regla_1: ACCESO DENEGADO. El usuario {id_usuario} no tiene un encuentro ACTIVO o establecimiento compartido con el paciente {id_paciente}")
        return allowed
        
    except Exception as e:
        logger.error(f"check_regla_1 error: {str(e)}")
        return False


# ── Regla 2: Notas por Establecimiento ────────────────────────────────────────
async def check_regla_2(id_nota: UUID, id_usuario: UUID, db: AsyncSession) -> bool:
    """
    Una nota SOAP es visible para:
    1. El médico que la redactó (siempre)
    2. Médicos del mismo establecimiento de la nota
    3. EXCEPTO: Si existe referencia ACEPTADA/ATENDIDA, el receptor también ve la nota
    
    Restricción: Médicos de distinto establecimiento NO ven la nota a menos que
    haya una referencia explícita aceptada.
    """
    try:
        from sqlalchemy import text
        
        # Verificar si el usuario es el autor de la nota
        query_author = text("""
            SELECT id_medico FROM notas_medicas 
            WHERE id_nota = :id_nota
        """)
        result = await db.execute(query_author, {"id_nota": id_nota})
        nota_medico = result.scalar()
        
        if nota_medico and nota_medico == id_usuario:
            logger.debug(f"check_regla_2: {id_usuario} es autor de nota {id_nota}")
            return True
        
        # Verificar si están en el mismo establecimiento
        query_same_establishment = text("""
            SELECT COUNT(*) as total FROM (
                SELECT ue1.id_establecimiento
                FROM usuarios_establecimientos ue1
                JOIN notas_medicas nm ON ue1.id_usuario = nm.id_medico
                JOIN usuarios_establecimientos ue2 ON ue2.id_establecimiento = ue1.id_establecimiento
                WHERE nm.id_nota = :id_nota
                  AND ue2.id_usuario = :id_usuario
            ) sub
        """)
        result = await db.execute(query_same_establishment, {
            "id_nota": id_nota,
            "id_usuario": id_usuario
        })
        same_est = (result.scalar() or 0) > 0
        
        if same_est:
            logger.debug(f"check_regla_2: {id_usuario} está en mismo establecimiento que nota {id_nota}")
            return True
        
        # Verificar si hay referencia ACEPTADA/ATENDIDA hacia este usuario
        query_accepted_referral = text("""
            SELECT COUNT(*) as total FROM referencias
            WHERE id_nota = :id_nota
              AND id_especialista_receptor = :id_usuario
              AND estado IN ('ACEPTADA', 'ATENDIDA')
        """)
        result = await db.execute(query_accepted_referral, {
            "id_nota": id_nota,
            "id_usuario": id_usuario
        })
        has_referral = (result.scalar() or 0) > 0
        
        if has_referral:
            logger.debug(f"check_regla_2: {id_usuario} tiene referencia aceptada para nota {id_nota}")
            return True
        
        logger.info(f"check_regla_2: {id_usuario} DENEGADO para nota {id_nota}")
        return False
        
    except Exception as e:
        logger.error(f"check_regla_2 error: {str(e)}")
        return False


# ── Regla 3: Acceso por Especialidad ──────────────────────────────────────────
async def check_regla_3(id_referencia: UUID, id_especialidad: int, id_usuario: UUID, db: AsyncSession) -> bool:
    """
    El médico receptor de una referencia SOLO puede ver NOTAS RELEVANTES
    a su especialidad, NO el expediente clínico completo.
    
    Implementación: Cuando el usuario intenta GET /notas?id_referencia=X,
    se filtran automáticamente las notas que:
    1. Están vinculadas a la referencia explícitamente, O
    2. Son de especialidades relacionadas a su área de práctica
    
    Restricción: NOT permite ver antecedentes ginecoobstétricos, psicológicos, etc.
    si no son directamente relevantes a la especialidad de la referencia.
    """
    try:
        from sqlalchemy import text
        
        # Verificar que la referencia existe y está dirigida a este usuario
        query_referral = text("""
            SELECT id_especialidad FROM referencias
            WHERE id_referencia = :id_referencia
              AND id_especialista_receptor = :id_usuario
              AND estado IN ('ACEPTADA', 'ATENDIDA')
        """)
        result = await db.execute(query_referral, {
            "id_referencia": id_referencia,
            "id_usuario": id_usuario
        })
        ref_speciality = result.scalar()
        
        if not ref_speciality:
            logger.info(f"check_regla_3: {id_usuario} no tiene referencia aceptada {id_referencia}")
            return False
        
        # Verificar que la especialidad del usuario coincide o es compatible
        # (Esto permite que un médico de varias especialidades pueda ver referencias relevantes)
        query_user_specialties = text("""
            SELECT COUNT(*) FROM permisos_especialidad
            WHERE id_usuario = :id_usuario
              AND id_especialidad = :id_especialidad
        """)
        result = await db.execute(query_user_specialties, {
            "id_usuario": id_usuario,
            "id_especialidad": id_especialidad
        })
        has_specialty = (result.scalar() or 0) > 0
        
        if has_specialty:
            logger.debug(f"check_regla_3: {id_usuario} autorizado para referencia {id_referencia} (especialidad {id_especialidad})")
            return True
        
        logger.info(f"check_regla_3: {id_usuario} no tiene especialidad {id_especialidad}")
        return False
        
    except Exception as e:
        logger.error(f"check_regla_3 error: {str(e)}")
        return False


# ── Regla 4: Auditoría sin excepción ──────────────────────────────────────────
# La Regla 4 la ejecuta automáticamente el AuditMiddleware (ya implementado en middleware/audit.py).
# Los developers NO deben bypasear el middleware. Esta función es solo documentación.
async def verificar_regla_4() -> None:
    """
    NO hacer nada aquí — el middleware ya registra TODOS los accesos en auditoria_accesos.
    
    Esta función es SOLO documentación. El AuditMiddleware en middleware/audit.py
    se ejecuta para CADA request y registra:
    - IP origen
    - Usuario ID
    - Módulo/Función accedida
    - Tipo de evento (READ, CREATE, UPDATE, DELETE)
    - Resultado (EXITOSO, DENEGADO, ERROR)
    - Timestamp UTC con microsegundos (Req. Forense 4)
    
    Los developers NO deben bypasear el middleware. Si necesitan deshabilitar auditoría,
    requiere aprobación del responsable de Cumplimiento Forense.
    """
    pass


def raise_acceso_denegado(regla: int):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Acceso denegado: Regla de Negocio {regla} no satisfecha"
    )
