from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.core.deps import get_db, get_current_user
from app.models.auth import Referencia, User, EstablecimientoEspecialidad
from app.models.encuentros import EncuentroClinico, EspecialidadMedica
from app.services.acceso import check_regla_1  # Para validar encuentro activo

router = APIRouter()

# Schemas
class ReferenciaCreate(BaseModel):
    id_encuentro: str
    id_establecimiento_destino: str
    id_especialidad_destino: int
    urgencia: str  # URGENTE | PROGRAMADA
    motivo_referencia: str
    diagnostico_cie10: str = None

class ReferenciaResponse(BaseModel):
    id_referencia: str
    folio: str
    tipo: str
    estado: str
    urgencia: str
    motivo_referencia: str
    diagnostico_cie10: str = None
    fecha_emision: datetime
    fecha_respuesta: datetime = None
    id_usuario_emisor: str
    id_usuario_respuesta: str = None

class ContrarreferenciaCreate(BaseModel):
    resumen_contrarreferencia: str

# POST /referencias - Emitir referencia
@router.post("/", response_model=ReferenciaResponse)
def emitir_referencia(
    ref: ReferenciaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validar que el encuentro existe y está activo
    encuentro = db.query(EncuentroClinico).filter(
        EncuentroClinico.id_encuentro == ref.id_encuentro,
        EncuentroClinico.fecha_cierre.is_(None)
    ).first()
    if not encuentro:
        raise HTTPException(status_code=400, detail="Encuentro no encontrado o cerrado")

    # Validar que el establecimiento destino tiene la especialidad
    estab_esp = db.query(EstablecimientoEspecialidad).filter(
        EstablecimientoEspecialidad.id_establecimiento == ref.id_establecimiento_destino,
        EstablecimientoEspecialidad.id_especialidad == ref.id_especialidad_destino,
        EstablecimientoEspecialidad.activo == True
    ).first()
    if not estab_esp:
        raise HTTPException(status_code=400, detail="Establecimiento destino no tiene la especialidad habilitada")

    # Generar folio único
    folio = f"REF-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

    # Crear referencia
    nueva_ref = Referencia(
        folio=folio,
        tipo="REFERENCIA",
        id_encuentro_origen=ref.id_encuentro,
        id_establecimiento_destino=ref.id_establecimiento_destino,
        id_especialidad_destino=ref.id_especialidad_destino,
        estado="PENDIENTE",
        urgencia=ref.urgencia,
        motivo_referencia=ref.motivo_referencia,
        diagnostico_cie10=ref.diagnostico_cie10,
        id_usuario_emisor=current_user.id_usuario
    )

    db.add(nueva_ref)
    db.commit()
    db.refresh(nueva_ref)

    # Registrar en auditoria_accesos
    # TODO: Implementar registro de auditoría

    return ReferenciaResponse(**nueva_ref.__dict__)

# PATCH /referencias/{id}/aceptar
@router.patch("/{id}/aceptar", response_model=ReferenciaResponse)
def aceptar_referencia(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ref = db.query(Referencia).filter(Referencia.id_referencia == id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referencia no encontrada")

    if ref.estado != "PENDIENTE":
        raise HTTPException(status_code=400, detail="Referencia no puede ser aceptada")

    # Validar que el usuario pertenece al establecimiento destino
    if str(current_user.id_establecimiento) != ref.id_establecimiento_destino:
        raise HTTPException(status_code=403, detail="Usuario no autorizado para esta referencia")

    ref.estado = "ACEPTADA"
    ref.fecha_respuesta = datetime.now()
    ref.id_usuario_respuesta = current_user.id_usuario

    db.commit()

    return ReferenciaResponse(**ref.__dict__)

# PATCH /referencias/{id}/atender
@router.patch("/{id}/atender", response_model=ReferenciaResponse)
def atender_referencia(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ref = db.query(Referencia).filter(Referencia.id_referencia == id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referencia no encontrada")

    if ref.estado != "ACEPTADA":
        raise HTTPException(status_code=400, detail="Referencia no puede ser atendida")

    if str(current_user.id_establecimiento) != ref.id_establecimiento_destino:
        raise HTTPException(status_code=403, detail="Usuario no autorizado")

    ref.estado = "ATENDIDA"
    ref.fecha_respuesta = datetime.now()
    ref.id_usuario_respuesta = current_user.id_usuario

    db.commit()

    return ReferenciaResponse(**ref.__dict__)

# PATCH /referencias/{id}/contrarreferir
@router.patch("/{id}/contrarreferir", response_model=ReferenciaResponse)
def contrarreferir(
    id: str,
    contra: ContrarreferenciaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ref = db.query(Referencia).filter(Referencia.id_referencia == id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referencia no encontrada")

    if ref.estado != "ATENDIDA":
        raise HTTPException(status_code=400, detail="Referencia no puede ser contrarreferida")

    if str(current_user.id_establecimiento) != ref.id_establecimiento_destino:
        raise HTTPException(status_code=403, detail="Usuario no autorizado")

    # Crear contrarreferencia
    folio_contra = f"CONTRA-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

    contra_ref = Referencia(
        folio=folio_contra,
        tipo="CONTRAREFERENCIA",
        id_referencia_origen=ref.id_referencia,
        id_encuentro_origen=ref.id_encuentro_origen,
        id_establecimiento_destino=ref.encuentro.id_establecimiento,  # Establecimiento origen
        id_especialidad_destino=ref.id_especialidad_destino,
        estado="ATENDIDA",  # Las contrarreferencias se crean atendidas
        urgencia=ref.urgencia,
        motivo_referencia="Contrarreferencia automática",
        resumen_contrarreferencia=contra.resumen_contrarreferencia,
        fecha_emision=datetime.now(),
        fecha_respuesta=datetime.now(),
        id_usuario_emisor=current_user.id_usuario,
        id_usuario_respuesta=current_user.id_usuario
    )

    db.add(contra_ref)
    db.commit()

    return ReferenciaResponse(**contra_ref.__dict__)

# PATCH /referencias/{id}/cancelar
@router.patch("/{id}/cancelar")
def cancelar_referencia(
    id: str,
    motivo_cancelacion: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ref = db.query(Referencia).filter(Referencia.id_referencia == id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referencia no encontrada")

    if ref.estado not in ["PENDIENTE", "ACEPTADA"]:
        raise HTTPException(status_code=400, detail="Referencia no puede ser cancelada")

    # Solo el emisor puede cancelar
    if ref.id_usuario_emisor != current_user.id_usuario:
        raise HTTPException(status_code=403, detail="Solo el emisor puede cancelar la referencia")

    ref.estado = "CANCELADA"
    ref.fecha_respuesta = datetime.now()
    ref.id_usuario_respuesta = current_user.id_usuario
    # TODO: Agregar campo motivo_cancelacion

    db.commit()

    return {"message": "Referencia cancelada"}

# GET /referencias/emitidas
@router.get("/emitidas", response_model=List[ReferenciaResponse])
def get_referencias_emitidas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    refs = db.query(Referencia).filter(
        Referencia.id_usuario_emisor == current_user.id_usuario,
        Referencia.tipo == "REFERENCIA"
    ).all()

    return [ReferenciaResponse(**ref.__dict__) for ref in refs]

# GET /referencias/recibidas
@router.get("/recibidas", response_model=List[ReferenciaResponse])
def get_referencias_recibidas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    refs = db.query(Referencia).filter(
        Referencia.id_establecimiento_destino == str(current_user.id_establecimiento),
        Referencia.tipo == "REFERENCIA"
    ).all()

    return [ReferenciaResponse(**ref.__dict__) for ref in refs]

# GET /referencias/{id}/pdf - TODO: Implementar generación de PDF