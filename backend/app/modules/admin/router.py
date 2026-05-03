from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import uuid
from passlib.context import CryptContext

from app.core.security import hash_password
from app.core.deps import require_role, get_db
from app.schemas.admin_schemas import (
    UsuarioOut, UsuarioCreate, UsuarioUpdate,
    EstablecimientoOut, EstablecimientoCreate, EstablecimientoUpdate,
    RolOut, EspecialidadOut, EspecialidadAdd
)
# Importamos todos los modelos para asegurar que SQLAlchemy inicialice los mappers correctamente
import app.models as models
from app.models import (
    User, Role, Establecimiento, Persona, 
    UsuarioEstablecimiento, EstablecimientoEspecialidad, EspecialidadMedica
)

router = APIRouter()

# ── GET /usuarios ──────────────────────────────────────────────────────
@router.get("/usuarios", response_model=List[UsuarioOut])
async def list_usuarios(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR"))
):
    """Lista usuarios cargando Persona y Rol (corregido de 'role' a 'rol')"""
    result = await db.execute(
        select(User).options(
            selectinload(User.persona),
            selectinload(User.rol),
            selectinload(User.establecimientos)
        )
    )
    usuarios = result.scalars().all()
    # model_validate funciona porque UsuarioOut ahora recibe los campos de persona y rol
    return [UsuarioOut.model_validate(u) for u in usuarios]


# ── POST /usuarios ─────────────────────────────────────────────────────
@router.post("/usuarios", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
async def create_usuario(
    data: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR"))
):
    """Crea un nuevo usuario en el sistema junto con su persona asociada"""
    
    # 1. Protección contra escalada de privilegios
    if current_user["rol"] != "SUPERADMIN" and data.rol in ["SUPERADMIN", "OMNIADMIN"]:
        raise HTTPException(
            status_code=403, 
            detail="No tiene permisos para asignar roles de alta jerarquía (SUPERADMIN/OMNIADMIN)"
        )

    # 2. Verificar si el email ya existe
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")
        
    # 3. Buscar el rol por código
    rol_res = await db.execute(select(Role).where(Role.codigo == data.rol))
    rol_obj = rol_res.scalar_one_or_none()
    if not rol_obj:
        raise HTTPException(status_code=400, detail=f"El rol '{data.rol}' no existe en el sistema")

    # 4. Crear Persona con datos demográficos obligatorios
    from datetime import datetime
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        fecha_dt = datetime.strptime(data.fecha_nacimiento, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    nueva_persona = Persona(
        nombre=data.nombre,
        primer_apellido=data.primer_apellido,
        segundo_apellido=data.segundo_apellido,
        fecha_nacimiento=fecha_dt,
        sexo=data.sexo
    )
    db.add(nueva_persona)
    
    try:
        await db.flush() # Para obtener el id_persona
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error de integridad al crear persona: {str(e)}")
    
    # 5. Crear Usuario
    nuevo_usuario = User(
        id_persona=nueva_persona.id_persona,
        email=data.email,
        password_hash=hash_password(data.password),
        id_rol=rol_obj.id_rol,
        activo=True,
        cedula_profesional=data.cedula_profesional
    )
    db.add(nuevo_usuario)
    
    # 6. Vincular con establecimiento si se proporcionó
    if data.id_establecimiento:
        await db.flush() # Para obtener el id_usuario
        relacion_estab = UsuarioEstablecimiento(
            id_usuario=nuevo_usuario.id_usuario,
            id_establecimiento=data.id_establecimiento,
            es_principal=True
        )
        db.add(relacion_estab)
    
    try:
        await db.commit()
        await db.refresh(nuevo_usuario, attribute_names=["persona", "rol", "establecimientos"])
        return UsuarioOut.model_validate(nuevo_usuario)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error de integridad final: {str(e)}")


# ── PATCH /usuarios/{id} ───────────────────────────────────────────────
@router.patch("/usuarios/{id_usuario}", response_model=UsuarioOut)
async def update_usuario(
    id_usuario: uuid.UUID,
    data: UsuarioUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR"))
):
    """Actualiza datos de usuario, contraseña y persona"""
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.persona),
            selectinload(User.rol),
            selectinload(User.establecimientos)
        )
        .where(User.id_usuario == id_usuario)
    )
    usuario = result.scalar_one_or_none()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    update_data = data.model_dump(exclude_unset=True)

    # 1. Gestión de ROL + Protección contra escalada
    if "rol" in update_data:
        rol_codigo = update_data.pop("rol")
        
        if current_user["rol"] != "SUPERADMIN" and rol_codigo in ["SUPERADMIN", "OMNIADMIN"]:
            raise HTTPException(
                status_code=403, 
                detail="No tiene permisos para asignar roles de alta jerarquía (SUPERADMIN/OMNIADMIN)"
            )
            
        rol_res = await db.execute(select(Role).where(Role.codigo == rol_codigo))
        rol_obj = rol_res.scalar_one_or_none()
        if not rol_obj:
            raise HTTPException(status_code=400, detail=f"El código de rol '{rol_codigo}' no existe")
        usuario.id_rol = rol_obj.id_rol

    # 2. Gestión de PERSONA (Campos anidados)
    persona_fields = {"nombre", "primer_apellido", "segundo_apellido"}
    if usuario.persona:
        for field in persona_fields:
            if field in update_data:
                setattr(usuario.persona, field, update_data.pop(field))

    # 3. Gestión de CONTRASEÑA
    if "password" in update_data:
        from app.core.security import hash_password
        plain = update_data.pop("password")
        usuario.password_hash = hash_password(plain)

    # 4. Gestión de ESTABLECIMIENTO
    if "id_establecimiento" in update_data:
        new_estab_id = update_data.pop("id_establecimiento")
        estab_res = await db.execute(
            select(UsuarioEstablecimiento)
            .where(UsuarioEstablecimiento.id_usuario == id_usuario)
        )
        relacion = estab_res.scalar_one_or_none()
        
        if new_estab_id:
            if relacion:
                relacion.id_establecimiento = new_estab_id
            else:
                nueva_rel = UsuarioEstablecimiento(
                    id_usuario=id_usuario,
                    id_establecimiento=new_estab_id,
                    es_principal=True
                )
                db.add(nueva_rel)
        elif relacion:
            await db.delete(relacion)

    # 5. Resto de campos (email, activo, cedula, etc.)
    for key, value in update_data.items():
        if hasattr(usuario, key):
            setattr(usuario, key, value)

    try:
        await db.commit()
        await db.refresh(usuario, attribute_names=["persona", "rol", "establecimientos"]) 
        return UsuarioOut.model_validate(usuario)

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al actualizar el usuario: {str(e)}")


# ── GET /establecimientos ──────────────────────────────────────────────
@router.get("/establecimientos", response_model=List[EstablecimientoOut])
async def list_establecimientos(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR"))
):
    """Catálogo de establecimientos con conteo de especialidades"""
    from sqlalchemy import func
    
    # Subconsulta para contar especialidades activas
    subq = (
        select(func.count(EstablecimientoEspecialidad.id_especialidad))
        .where(EstablecimientoEspecialidad.id_establecimiento == Establecimiento.id_establecimiento)
        .where(EstablecimientoEspecialidad.activa == True)
        .scalar_subquery()
    )
    
    res = await db.execute(
        select(
            Establecimiento.id_establecimiento,
            Establecimiento.clues,
            Establecimiento.nombre,
            Establecimiento.nivel_atencion,
            Establecimiento.id_localidad,
            subq.label("num_especialidades")
        )
    )
    
    return [
        EstablecimientoOut(
            id_establecimiento=r.id_establecimiento,
            clues=r.clues,
            nombre=r.nombre,
            nivel_atencion=r.nivel_atencion,
            id_localidad=r.id_localidad,
            num_especialidades=r.num_especialidades
        ) for r in res.all()
    ]


@router.post("/establecimientos", response_model=EstablecimientoOut, status_code=status.HTTP_201_CREATED)
async def create_establecimiento(
    data: EstablecimientoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR", "OMNIADMIN"))
):
    """Registra un nuevo establecimiento"""
    nuevo = Establecimiento(**data.model_dump())
    db.add(nuevo)
    try:
        await db.commit()
        await db.refresh(nuevo)
        return nuevo
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al crear establecimiento: {str(e)}")


@router.patch("/establecimientos/{id_establecimiento}", response_model=EstablecimientoOut)
async def update_establecimiento(
    id_establecimiento: uuid.UUID,
    data: EstablecimientoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR", "OMNIADMIN"))
):
    """Actualiza datos de un establecimiento"""
    res = await db.execute(select(Establecimiento).where(Establecimiento.id_establecimiento == id_establecimiento))
    estab = res.scalar_one_or_none()
    if not estab:
        raise HTTPException(status_code=404, detail="Establecimiento no encontrado")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(estab, key, value)
    
    try:
        await db.commit()
        await db.refresh(estab)
        return estab
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al actualizar establecimiento: {str(e)}")


# ── GET /roles ──────────────────────────────────────────────────────────
@router.get("/roles", response_model=List[RolOut])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR"))
):
    """Lista de roles disponibles en el sistema"""
    res = await db.execute(select(Role))
    return res.scalars().all()

# ── ESPECIALIDADES ───────────────────────────────────────────────────────

@router.get("/especialidades", response_model=List[EspecialidadOut])
async def list_especialidades(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR", "OMNIADMIN"))
):
    """Catálogo global de especialidades médicas"""
    res = await db.execute(select(EspecialidadMedica).order_by(EspecialidadMedica.nombre))
    return res.scalars().all()


@router.get("/establecimientos/{id_establecimiento}/especialidades", response_model=List[EspecialidadOut])
async def list_establecimiento_especialidades(
    id_establecimiento: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR", "OMNIADMIN"))
):
    """Lista especialidades activas de un establecimiento específico"""
    res = await db.execute(
        select(EspecialidadMedica)
        .join(EstablecimientoEspecialidad, EspecialidadMedica.id_especialidad == EstablecimientoEspecialidad.id_especialidad)
        .where(EstablecimientoEspecialidad.id_establecimiento == id_establecimiento)
        .where(EstablecimientoEspecialidad.activa == True)
    )
    return res.scalars().all()


@router.post("/establecimientos/{id_establecimiento}/especialidades", status_code=status.HTTP_201_CREATED)
async def add_especialidad_to_establecimiento(
    id_establecimiento: uuid.UUID,
    data: EspecialidadAdd,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR", "OMNIADMIN"))
):
    """Vincula una especialidad a un establecimiento"""
    # Verificar si ya existe
    res = await db.execute(
        select(EstablecimientoEspecialidad)
        .where(EstablecimientoEspecialidad.id_establecimiento == id_establecimiento)
        .where(EstablecimientoEspecialidad.id_especialidad == data.id_especialidad)
    )
    rel = res.scalar_one_or_none()
    
    if rel:
        if rel.activa:
            return {"message": "La especialidad ya está activa en este establecimiento"}
        rel.activa = True
    else:
        nueva_rel = EstablecimientoEspecialidad(
            id_establecimiento=id_establecimiento,
            id_especialidad=data.id_especialidad,
            activa=True
        )
        db.add(nueva_rel)
    
    try:
        await db.commit()
        return {"message": "Especialidad añadida exitosamente"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al añadir especialidad: {str(e)}")


@router.delete("/establecimientos/{id_establecimiento}/especialidades/{id_especialidad}")
async def remove_especialidad_from_establecimiento(
    id_establecimiento: uuid.UUID,
    id_especialidad: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR", "OMNIADMIN"))
):
    """Desvincula (desactiva) una especialidad de un establecimiento"""
    res = await db.execute(
        select(EstablecimientoEspecialidad)
        .where(EstablecimientoEspecialidad.id_establecimiento == id_establecimiento)
        .where(EstablecimientoEspecialidad.id_especialidad == id_especialidad)
    )
    rel = res.scalar_one_or_none()
    
    if not rel:
        raise HTTPException(status_code=404, detail="Relación no encontrada")
    
    rel.activa = False
    try:
        await db.commit()
        return {"message": "Especialidad removida exitosamente"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al remover especialidad: {str(e)}")
