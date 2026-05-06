# backend/app/database/set_medico_pruebas.py
import uuid
import asyncio
from datetime import date
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Importar configuración asíncrona
from app.database.session import AsyncSessionLocal
from app.models import (
    CatEstado, CatMunicipio, CatLocalidad, CatEspecialidadMedica,
    CatModulo, Rol, PermisoRol, JurisdiccionSanitaria, Establecimiento,
    EstablecimientoEspecialidad, Persona, UsuarioSistema,
    UsuarioEstablecimiento, PermisoEspecialidad,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# UUIDs fijos
ID_PERSONA_MEDICO      = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000001")
ID_USUARIO_MEDICO      = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000001")
ID_ESTABLECIMIENTO_DEV = uuid.UUID("00000000-0000-0000-0000-000000000001")


async def seed_catalogos(db: AsyncSession) -> None:
    """Catálogos geográficos y clínicos mínimos."""
    
    estado = await db.get(CatEstado, "07")
    if not estado:
        db.add(CatEstado(id_estado="07", nombre="Chiapas"))

    municipio = await db.get(CatMunicipio, "07101")
    if not municipio:
        db.add(CatMunicipio(id_municipio="07101", id_estado="07", nombre="Tuxtla Gutiérrez"))

    localidad = await db.get(CatLocalidad, "070101001")
    if not localidad:
        db.add(CatLocalidad(
            id_localidad="070101001",
            id_municipio="07101",
            nombre="Tuxtla Gutiérrez",
            ambito="Urbano",
        ))

    especialidad = await db.execute(select(CatEspecialidadMedica).filter_by(nombre="Medicina General"))
    if not especialidad.scalars().first():
        db.add(CatEspecialidadMedica(id_especialidad=1, nombre="Medicina General"))

    modulos = [
        ("EXPEDIENTE",   "Expediente Clínico",   "Consulta y edición de expedientes"),
        ("CONSULTA",     "Consulta Médica",       "Gestión del acto médico"),
        ("PRESCRIPCION", "Prescripciones",        "Emisión de recetas"),
        ("REFERENCIA",   "Referencias Médicas",   "Envío y recepción de referencias"),
        ("LABORATORIO",  "Laboratorio",           "Solicitud y resultados de estudios"),
        ("AUDITORIA",    "Auditoría",             "Bitácora de accesos"),
    ]
    for codigo, nombre, descripcion in modulos:
        mod = await db.execute(select(CatModulo).filter_by(codigo=codigo))
        if not mod.scalars().first():
            db.add(CatModulo(codigo=codigo, nombre=nombre, descripcion=descripcion))

    await db.flush()


async def seed_rol_medico(db: AsyncSession) -> Rol:
    """Rol MEDICO_GENERAL con permisos sobre módulos clínicos."""
    res = await db.execute(select(Rol).filter_by(codigo="MEDICO_GENERAL"))
    rol = res.scalars().first()
    if not rol:
        rol = Rol(
            codigo="MEDICO_GENERAL",
            nombre="Médico General",
            descripcion="Médico con acceso completo al acto médico",
        )
        db.add(rol)
        await db.flush()

    modulos_clinicos = ["EXPEDIENTE", "CONSULTA", "PRESCRIPCION", "REFERENCIA", "LABORATORIO"]
    for codigo in modulos_clinicos:
        mod_res = await db.execute(select(CatModulo).filter_by(codigo=codigo))
        modulo = mod_res.scalars().first()
        if modulo:
            perm_res = await db.execute(select(PermisoRol).filter_by(
                id_rol=rol.id_rol, id_modulo=modulo.id_modulo
            ))
            if not perm_res.scalars().first():
                db.add(PermisoRol(
                    id_rol=rol.id_rol,
                    id_modulo=modulo.id_modulo,
                    puede_leer=True,
                    puede_crear=True,
                    puede_editar=True,
                    puede_eliminar=False,
                ))
    return rol


async def seed_establecimiento(db: AsyncSession) -> Establecimiento:
    """Jurisdicción y establecimiento de desarrollo."""
    res = await db.execute(select(JurisdiccionSanitaria).filter_by(num_jurisdiccion=1))
    jurisdiccion = res.scalars().first()
    if not jurisdiccion:
        jurisdiccion = JurisdiccionSanitaria(
            nombre="Jurisdicción Sanitaria I — Tuxtla Gutiérrez",
            num_jurisdiccion=1,
        )
        db.add(jurisdiccion)
        await db.flush()

    estab = await db.get(Establecimiento, ID_ESTABLECIMIENTO_DEV)
    if not estab:
        estab = Establecimiento(
            id_establecimiento=ID_ESTABLECIMIENTO_DEV,
            clues="CS07TUX0001",
            nombre="Centro de Salud Urbano No. 1 — Tuxtla Gutiérrez (DEV)",
            id_jurisdiccion=jurisdiccion.id_jurisdiccion,
            id_localidad="070101001",
            nivel_atencion=1,
        )
        db.add(estab)
        await db.flush()

    res_esp = await db.get(CatEspecialidadMedica, 1)
    if res_esp:
        res_ee = await db.execute(select(EstablecimientoEspecialidad).filter_by(
            id_establecimiento=ID_ESTABLECIMIENTO_DEV, id_especialidad=1
        ))
        if not res_ee.scalars().first():
            db.add(EstablecimientoEspecialidad(
                id_establecimiento=ID_ESTABLECIMIENTO_DEV,
                id_especialidad=1,
                activa=True,
            ))

    return estab


async def seed_medico(db: AsyncSession, rol: Rol) -> UsuarioSistema:
    """Persona + Usuario del médico de pruebas."""
    persona = await db.get(Persona, ID_PERSONA_MEDICO)
    if not persona:
        persona = Persona(
            id_persona=ID_PERSONA_MEDICO,
            nombre="Carlos Alberto",
            primer_apellido="Martínez",
            segundo_apellido="Ruiz",
            curp="MARC850315HCSNRR09",
            fecha_nacimiento=date(1985, 3, 15),
            sexo="M",
            id_localidad="070101001",
            calle_numero="Blvd. Belisario Domínguez 1234, Col. Xamaipak",
            telefono="9611234567",
        )
        db.add(persona)
        await db.flush()

    usuario = await db.get(UsuarioSistema, ID_USUARIO_MEDICO)
    if not usuario:
        usuario = UsuarioSistema(
            id_usuario=ID_USUARIO_MEDICO,
            id_persona=ID_PERSONA_MEDICO,
            email="dr.martinez.pruebas@medsys.local",
            password_hash=pwd_context.hash("Test1234!"),
            id_rol=rol.id_rol,
            cedula_profesional="CED-12345678",
            requires_2fa=False,
            activo=True,
        )
        db.add(usuario)
        await db.flush()

    return usuario


async def seed_asignaciones(db: AsyncSession) -> None:
    """Vincula al médico con el establecimiento y la especialidad."""
    res_ue = await db.execute(select(UsuarioEstablecimiento).filter_by(
        id_usuario=ID_USUARIO_MEDICO,
        id_establecimiento=ID_ESTABLECIMIENTO_DEV,
    ))
    if not res_ue.scalars().first():
        db.add(UsuarioEstablecimiento(
            id_usuario=ID_USUARIO_MEDICO,
            id_establecimiento=ID_ESTABLECIMIENTO_DEV,
            es_principal=True,
        ))

    res_pe = await db.execute(select(PermisoEspecialidad).filter_by(
        id_usuario=ID_USUARIO_MEDICO,
        id_especialidad=1,
    ))
    if not res_pe.scalars().first():
        db.add(PermisoEspecialidad(
            id_usuario=ID_USUARIO_MEDICO,
            id_especialidad=1,
        ))


async def run_seed() -> None:
    async with AsyncSessionLocal() as db:
        try:
            await seed_catalogos(db)
            rol = await seed_rol_medico(db)
            await seed_establecimiento(db)
            await seed_medico(db, rol)
            await seed_asignaciones(db)
            await db.commit()
            print("✅  Seed completado.")
        except Exception as exc:
            await db.rollback()
            print(f"❌  Seed fallido: {exc}")
            raise


if __name__ == "__main__":
    asyncio.run(run_seed())