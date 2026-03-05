"""
Servicio de Control de Acceso — Las 4 Reglas de Negocio
Doc1 §3.3 · Doc6 §Diagrama 6

Estas funciones son la ÚNICA vía para acceder a datos clínicos.
Los routers las llaman ANTES de cualquier query a BD.
"""
from uuid import UUID
from fastapi import HTTPException, status


# ── Regla 1: Datos Universales ────────────────────────────────────────────────
async def check_regla_1(id_paciente: UUID, id_usuario: UUID, db) -> bool:
    """
    Datos básicos del paciente (nombre, CURP, alergias, antecedentes) son visibles
    para cualquier médico del Distrito CON un encuentro activo.
    Sin restricción de establecimiento.
    TODO Persona 3: implementar query a encuentros_clinicos
    """
    # Placeholder — siempre True en desarrollo
    return True


# ── Regla 2: Notas por Establecimiento ────────────────────────────────────────
async def check_regla_2(id_nota: UUID, id_usuario: UUID, db) -> bool:
    """
    Una nota SOAP solo es visible para el médico que la redactó y para médicos
    del mismo establecimiento, EXCEPTO cuando existe referencia ACEPTADA o ATENDIDA.
    TODO Persona 3: implementar query cruzada notas + establecimientos + referencias
    """
    return True


# ── Regla 3: Acceso por Especialidad ──────────────────────────────────────────
async def check_regla_3(id_referencia: UUID, id_especialidad: int, id_usuario: UUID, db) -> bool:
    """
    El médico receptor de una referencia solo puede ver notas relevantes
    a la especialidad de la referencia, NO el expediente completo.
    TODO Persona 3: implementar filtro por especialidad en query de notas
    """
    return True


# ── Regla 4: Auditoría sin excepción ──────────────────────────────────────────
# La Regla 4 la ejecuta automáticamente el AuditMiddleware (ya implementado en middleware/audit.py).
# Los developers NO deben bypasear el middleware. Esta función es solo documentación.
async def verificar_regla_4() -> None:
    """No hacer nada aquí — el middleware ya lo registra. Esta función es documentación."""
    pass


def raise_acceso_denegado(regla: int):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Acceso denegado: Regla de Negocio {regla} no satisfecha (Doc6 §Diagrama 6)"
    )
