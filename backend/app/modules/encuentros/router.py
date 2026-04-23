"""
Encuentros Clínicos — Router
Endpoints REST para gestión de encuentros clínicos
"""
from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.deps import get_current_user, require_role
from app.services.encuentros import encuentro_service
from app.services.signos_vitales import SignosVitalesService
from app.schemas.encuentros import (
    EncuentroCreateIn, EncuentroOut, EncuentroDetalleOut,
    EncuentroCerrarIn, EncuentroPacienteOut,
    SignosVitalesCreateIn, SignosVitalesOut, SignosVitalesListOut
) 
 
router = APIRouter() 


@router.post("/", response_model=EncuentroOut, status_code=201)
async def crear_encuentro(
    data: EncuentroCreateIn,
    current_user: dict = Depends(require_role("MEDICO_GENERAL", "ESPECIALISTA", "SUPERADMIN")),
    db: AsyncSession = Depends(get_db)
):
    """POST /encuentros — Abre un encuentro clínico para un paciente"""
    id_medico = UUID(current_user["id"])
    id_establecimiento = UUID(current_user.get("establecimiento", "CSSSA023999"))  # TODO: obtener del usuario

    encuentro = await encuentro_service.crear_encuentro(
        db=db,
        data=data,
        id_medico=id_medico,
        id_establecimiento=id_establecimiento
    )

    return EncuentroOut(
        id_encuentro=encuentro.id_encuentro,
        id_paciente=encuentro.id_paciente,
        id_medico=encuentro.id_medico,
        id_establecimiento=encuentro.id_establecimiento,
        id_especialidad=encuentro.id_especialidad,
        fecha_inicio=encuentro.fecha_inicio,
        fecha_cierre=encuentro.fecha_cierre,
        motivo_consulta=encuentro.motivo_consulta,
        tipo_consulta=encuentro.tipo_consulta
    )


@router.get("/", response_model=List[EncuentroOut])
async def listar_encuentros_activos(
    current_user: dict = Depends(require_role("MEDICO_GENERAL", "ESPECIALISTA", "ENFERMERIA", "SUPERADMIN")),
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """GET /encuentros — Lista encuentros activos del establecimiento"""
    id_establecimiento = UUID(current_user.get("establecimiento", "CSSSA023999"))  # TODO: obtener del usuario

    encuentros = await encuentro_service.listar_encuentros_activos(
        db=db,
        id_establecimiento=id_establecimiento,
        skip=skip,
        limit=limit
    )

    return [
        EncuentroOut(
            id_encuentro=e.id_encuentro,
            id_paciente=e.id_paciente,
            id_medico=e.id_medico,
            id_establecimiento=e.id_establecimiento,
            id_especialidad=e.id_especialidad,
            fecha_inicio=e.fecha_inicio,
            fecha_cierre=e.fecha_cierre,
            motivo_consulta=e.motivo_consulta,
            tipo_consulta=e.tipo_consulta,
            paciente_numero_expediente=e.paciente.numero_expediente if e.paciente else None,
            paciente_nombre=f"{e.paciente.persona.nombre} {e.paciente.persona.primer_apellido}" if e.paciente and e.paciente.persona else None,
            medico_nombre=f"{e.medico.persona.nombre} {e.medico.persona.primer_apellido}" if e.medico and e.medico.persona else None,
            establecimiento_nombre=e.establecimiento.nombre if e.establecimiento else None
        )
        for e in encuentros
    ]


@router.get("/{id}", response_model=EncuentroDetalleOut)
async def obtener_encuentro(
    id: UUID,
    current_user: dict = Depends(require_role("MEDICO_GENERAL", "ESPECIALISTA", "ENFERMERIA", "SUPERADMIN")),
    db: AsyncSession = Depends(get_db)
):
    """GET /encuentros/{id} — Detalle completo del encuentro
    
    Incluye:
    - Datos básicos del encuentro
    - Datos del paciente, médico, establecimiento
    - Lista de signos vitales registrados (paso 1 del stepper)
    - Notas médicas (paso 2)
    - Diagnósticos (paso 3)
    """
    id_usuario = UUID(current_user["id"])

    encuentro = await encuentro_service.obtener_encuentro(
        db=db,
        id_encuentro=id,
        id_usuario=id_usuario
    )

    # Cargar signos vitales del encuentro
    signos_list, _, _ = await SignosVitalesService.obtener_signos_encuentro(
        db=db,
        id_encuentro=id,
        skip=0,
        limit=999  # Sin límite para el detalle
    )

    return EncuentroDetalleOut(
        id_encuentro=encuentro.id_encuentro,
        id_paciente=encuentro.id_paciente,
        id_medico=encuentro.id_medico,
        id_establecimiento=encuentro.id_establecimiento,
        id_especialidad=encuentro.id_especialidad,
        fecha_inicio=encuentro.fecha_inicio,
        fecha_cierre=encuentro.fecha_cierre,
        motivo_consulta=encuentro.motivo_consulta,
        tipo_consulta=encuentro.tipo_consulta,
        paciente_numero_expediente=encuentro.paciente.numero_expediente if encuentro.paciente else None,
        paciente_nombre=f"{encuentro.paciente.persona.nombre} {encuentro.paciente.persona.primer_apellido}" if encuentro.paciente and encuentro.paciente.persona else None,
        medico_nombre=f"{encuentro.medico.persona.nombre} {encuentro.medico.persona.primer_apellido}" if encuentro.medico and encuentro.medico.persona else None,
        establecimiento_nombre=encuentro.establecimiento.nombre if encuentro.establecimiento else None,
        notas=[],  # TODO: implementar carga de notas
        signos_vitales=[
            SignosVitalesOut(
                id_signos=s.id_signos,
                id_encuentro=s.id_encuentro,
                id_enfermero=s.id_enfermero,
                presion_sistolica=s.presion_sistolica,
                presion_diastolica=s.presion_diastolica,
                temperatura_c=s.temperatura_c,
                saturacion_oxigeno=s.saturacion_oxigeno,
                frecuencia_cardiaca=s.frecuencia_cardiaca,
                frecuencia_respiratoria=s.frecuencia_respiratoria,
                peso_kg=s.peso_kg,
                talla_cm=s.talla_cm,
                fecha_toma=s.fecha_toma
            )
            for s in signos_list
        ],
        diagnosticos=[]  # TODO: implementar carga de diagnósticos
    )

 
@router.patch("/{id}/cerrar", response_model=EncuentroOut)
async def cerrar_encuentro(
    id: UUID,
    current_user: dict = Depends(require_role("MEDICO_GENERAL", "ESPECIALISTA", "SUPERADMIN")),
    db: AsyncSession = Depends(get_db)
):
    """PATCH /encuentros/{id}/cerrar — Cierra el encuentro (irreversible)"""
    id_usuario = UUID(current_user["id"])

    encuentro = await encuentro_service.cerrar_encuentro(
        db=db,
        id_encuentro=id,
        id_usuario=id_usuario
    )

    return EncuentroOut(
        id_encuentro=encuentro.id_encuentro,
        id_paciente=encuentro.id_paciente,
        id_medico=encuentro.id_medico,
        id_establecimiento=encuentro.id_establecimiento,
        id_especialidad=encuentro.id_especialidad,
        fecha_inicio=encuentro.fecha_inicio,
        fecha_cierre=encuentro.fecha_cierre,
        motivo_consulta=encuentro.motivo_consulta,
        tipo_consulta=encuentro.tipo_consulta
    )


@router.get("/pacientes/{id}/encuentros", response_model=List[EncuentroPacienteOut])
async def listar_encuentros_paciente(
    id: UUID,
    current_user: dict = Depends(require_role("MEDICO_GENERAL", "ESPECIALISTA", "SUPERADMIN")),
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """GET /pacientes/{id}/encuentros — Historial de encuentros del paciente"""
    id_usuario = UUID(current_user["id"])

    encuentros = await encuentro_service.listar_encuentros_paciente(
        db=db,
        id_paciente=id,
        id_usuario=id_usuario,
        skip=skip,
        limit=limit
    )

    return [
        EncuentroPacienteOut(
            id_encuentro=e.id_encuentro,
            fecha_inicio=e.fecha_inicio,
            fecha_cierre=e.fecha_cierre,
            motivo_consulta=e.motivo_consulta,
            tipo_consulta=e.tipo_consulta,
            medico_nombre=f"{e.medico.persona.nombre} {e.medico.persona.primer_apellido}" if e.medico and e.medico.persona else "Desconocido",
            establecimiento_nombre=e.establecimiento.nombre if e.establecimiento else "Desconocido",
            especialidad_nombre=e.especialidad.nombre if e.especialidad else None,
            tiene_notas_firmadas=False  # TODO: implementar verificación
        )
        for e in encuentros
    ]


# ───────────────────────────────────────────────────────
# 📊 SIGNOS VITALES — NOM-004 Trazabilidad
# ───────────────────────────────────────────────────────

@router.post("/{id}/signos-vitales", response_model=SignosVitalesOut, status_code=201)
async def registrar_signos_vitales(
    id: UUID,
    data: SignosVitalesCreateIn,
    current_user: dict = Depends(require_role("ENFERMERIA", "SUPERADMIN")),
    db: AsyncSession = Depends(get_db)
):
    """POST /encuentros/{id}/signos-vitales — Registra signos vitales del encuentro
    
    ✅ Validaciones de rango fisiológico:
    - Presión sistólica: 60–250 mmHg
    - Presión diastólica: 40–150 mmHg
    - Temperatura: 34–42 °C
    - Saturación O₂: 70–100%
    - Frecuencia cardíaca: 30–220 lpm
    
    ⚠️ Cliente NO envía registrado_en/fecha_toma:
    - Timestamp generado por servidor en DB (CURRENT_TIMESTAMP)
    - Garantiza trazabilidad NOM-004 (auditoría de cuándo se registró)
    
    📎 Referencia: Doc6 §Diagrama 3, Paso 2
    """
    id_enfermero = UUID(current_user["id"])
    
    signos = await SignosVitalesService.registrar_signos(
        db=db,
        id_encuentro=id,
        id_enfermero=id_enfermero,
        data=data
    )
    
    return SignosVitalesOut(
        id_signos=signos.id_signos,
        id_encuentro=signos.id_encuentro,
        id_enfermero=signos.id_enfermero,
        presion_sistolica=signos.presion_sistolica,
        presion_diastolica=signos.presion_diastolica,
        temperatura_c=signos.temperatura_c,
        saturacion_oxigeno=signos.saturacion_oxigeno,
        frecuencia_cardiaca=signos.frecuencia_cardiaca,
        frecuencia_respiratoria=signos.frecuencia_respiratoria,
        peso_kg=signos.peso_kg,
        talla_cm=signos.talla_cm,
        fecha_toma=signos.fecha_toma
    )


@router.get("/{id}/signos-vitales", response_model=SignosVitalesListOut)
async def obtener_signos_encuentro(
    id: UUID,
    current_user: dict = Depends(require_role("MEDICO_GENERAL", "ESPECIALISTA", "ENFERMERIA", "SUPERADMIN")),
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """GET /encuentros/{id}/signos-vitales?id_encuentro={id} — Obtiene signos del encuentro activo
    
    ✅ Usa vista v_signos_encuentro (control de acceso enfermería)
    ✅ Retorna signos ordenados por fecha DESC (más reciente primero)
    
    📎 Referencia: P3 creó v_signos_encuentro, P4 la usa en este endpoint
    """
    signos_list, total, esta_activo = await SignosVitalesService.obtener_signos_encuentro(
        db=db,
        id_encuentro=id,
        skip=skip,
        limit=limit
    )
    
    return SignosVitalesListOut(
        signos=[
            SignosVitalesOut(
                id_signos=s.id_signos,
                id_encuentro=s.id_encuentro,
                id_enfermero=s.id_enfermero,
                presion_sistolica=s.presion_sistolica,
                presion_diastolica=s.presion_diastolica,
                temperatura_c=s.temperatura_c,
                saturacion_oxigeno=s.saturacion_oxigeno,
                frecuencia_cardiaca=s.frecuencia_cardiaca,
                frecuencia_respiratoria=s.frecuencia_respiratoria,
                peso_kg=s.peso_kg,
                talla_cm=s.talla_cm,
                fecha_toma=s.fecha_toma
            )
            for s in signos_list
        ],
        total=total,
        encuentro_activo=esta_activo
    )


@router.patch("/{id}/signos-vitales/{signos_id}", response_model=SignosVitalesOut)
async def actualizar_signos_vitales(
    id: UUID,
    signos_id: UUID,
    data: SignosVitalesCreateIn,
    current_user: dict = Depends(require_role("ENFERMERIA", "SUPERADMIN")),
    db: AsyncSession = Depends(get_db)
):
    """PATCH /encuentros/{id}/signos-vitales/{signos_id} — Actualiza signos registrados
    
    ⚠️ Solo el enfermero que registró puede modificar (validación de ownership)
    ⚠️ Timestamp original se mantiene (no se recalcula)
    """
    id_enfermero = UUID(current_user["id"])
    
    signos = await SignosVitalesService.actualizar_signos(
        db=db,
        id_signos=signos_id,
        id_enfermero=id_enfermero,
        data=data
    )
    
    return SignosVitalesOut(
        id_signos=signos.id_signos,
        id_encuentro=signos.id_encuentro,
        id_enfermero=signos.id_enfermero,
        presion_sistolica=signos.presion_sistolica,
        presion_diastolica=signos.presion_diastolica,
        temperatura_c=signos.temperatura_c,
        saturacion_oxigeno=signos.saturacion_oxigeno,
        frecuencia_cardiaca=signos.frecuencia_cardiaca,
        frecuencia_respiratoria=signos.frecuencia_respiratoria,
        peso_kg=signos.peso_kg,
        talla_cm=signos.talla_cm,
        fecha_toma=signos.fecha_toma
    )


@router.delete("/{id}/signos-vitales/{signos_id}", status_code=204)
async def eliminar_signos_vitales(
    id: UUID,
    signos_id: UUID,
    current_user: dict = Depends(require_role("ENFERMERIA", "SUPERADMIN")),
    db: AsyncSession = Depends(get_db)
):
    """DELETE /encuentros/{id}/signos-vitales/{signos_id} — Elimina un registro de signos
    
    ⚠️ Solo el enfermero que registró puede eliminar
    """
    id_enfermero = UUID(current_user["id"])
    
    await SignosVitalesService.eliminar_signos(
        db=db,
        id_signos=signos_id,
        id_enfermero=id_enfermero
    )