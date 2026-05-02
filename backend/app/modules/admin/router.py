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
    EstablecimientoOut, RolOut
)
# Importamos desde el archivo central corregido
from app.models.auth import User, Role, Establecimiento, Persona, UsuarioEstablecimiento

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
    """Catálogo de establecimientos para asignación de usuarios"""
    res = await db.execute(select(Establecimiento))
    return res.scalars().all()


# ── GET /roles ──────────────────────────────────────────────────────────
@router.get("/roles", response_model=List[RolOut])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_role("SUPERADMIN", "ADMINISTRADOR"))
):
    """Lista de roles disponibles en el sistema"""
    res = await db.execute(select(Role))
    return res.scalars().all()


# creacion de usuarios

# @router.post("/usuarios", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
# async def create_usuario(
#     data: UsuarioCreate,
#     db: AsyncSession = Depends(get_db),
#     current_user: dict = Depends(require_role("SUPERADMIN"))
# ):
#     """Crea un nuevo usuario con rol y persona"""
    
#     # 1. Validación de email único
#     res = await db.execute(select(User).where(User.email == data.email))
#     if res.scalar_one_or_none():
#         raise HTTPException(status_code=400, detail="El email ya está registrado")

#     # 2. Validación de rol existente
#     rol_res = await db.execute(select(Role).where(Role.nombre == data.rol))
#     rol_obj = rol_res.scalar_one_or_none()
#     if not rol_obj:
#         raise HTTPException(status_code=400, detail=f"El rol '{data.rol}' no existe")

#     try:
#         # 3. Creación de persona
#         persona = Persona(
#             nombre=data.nombre,
#             primer_apellido=data.primer_apellido,
#             segundo_apellido=data.segundo_apellido
#         )
#         db.add(persona)
#         await db.flush()  # Obtenemos id_persona sin terminar la transacción

#         # 4. Creación de usuario (Asegúrate de importar uuid)
#         usuario = User(
#             id_usuario=uuid.uuid4(),  # <--- Generamos el UUID manualmente
#             email=data.email,
#             password_hash=pwd_context.hash(data.password),
#             id_rol=rol_obj.id_rol,
#             id_persona=persona.id_persona,
#             id_establecimiento=data.id_establecimiento, # <--- ¡No olvides este!
#             cedula_profesional=data.cedula_profesional,
#             activo=True
#         )
#         db.add(usuario)
        
#         # 5. Commit único para ambas tablas
#         await db.commit()
        
#         # 6. Carga de relaciones para el response_model
#         await db.refresh(usuario, attribute_names=["persona", "rol"]) 
#         return UsuarioOut.model_validate(usuario)

#     except Exception as e:
#         await db.rollback()
#         logger.error(f"Error al crear usuario: {str(e)}")
#         raise HTTPException(status_code=500, detail="Error interno al procesar la creación")
