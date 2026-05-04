# seeds/seed_medico_pruebas.py
import uuid
from datetime import date, datetime, timezone
from passlib.context import CryptContext
from sqlalchemy.orm import Session

# Asume que tienes tu engine/SessionLocal configurado
from app.database import SessionLocal
from app.models import (
    CatEstado, CatMunicipio, CatLocalidad, CatEspecialidadMedica,
    CatModulo, Rol, PermisoRol, JurisdiccionSanitaria, Establecimiento,
    EstablecimientoEspecialidad, Persona, UsuarioSistema,
    UsuarioEstablecimiento, PermisoEspecialidad,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# UUIDs fijos para facilitar referencias en otros seeds
ID_PERSONA_MEDICO      = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000001")
ID_USUARIO_MEDICO      = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000001")
ID_ESTABLECIMIENTO_DEV = uuid.UUID("00000000-0000-0000-0000-000000000001")


def seed_catalogos(db: Session) -> None:
    """Catálogos geográficos y clínicos mínimos."""

    if not db.get(CatEstado, "07"):
        db.add(CatEstado(id_estado="07", nombre="Chiapas"))

    if not db.get(CatMunicipio, "07101"):
        db.add(CatMunicipio(id_municipio="07101", id_estado="07", nombre="Tuxtla Gutiérrez"))

    if not db.get(CatLocalidad, "070101001"):
        db.add(CatLocalidad(
            id_localidad="070101001",
            id_municipio="07101",
            nombre="Tuxtla Gutiérrez",
            ambito="Urbano",
        ))

    if not db.query(CatEspecialidadMedica).filter_by(nombre="Medicina General").first():
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
        if not db.query(CatModulo).filter_by(codigo=codigo).first():
            db.add(CatModulo(codigo=codigo, nombre=nombre, descripcion=descripcion))

    db.flush()  # Para que los IDs de módulos estén disponibles


def seed_rol_medico(db: Session) -> Rol:
    """Rol MEDICO_GENERAL con permisos sobre módulos clínicos."""

    rol = db.query(Rol).filter_by(codigo="MEDICO_GENERAL").first()
    if not rol:
        rol = Rol(
            codigo="MEDICO_GENERAL",
            nombre="Médico General",
            descripcion="Médico con acceso completo al acto médico",
        )
        db.add(rol)
        db.flush()

    modulos_clinicos = ["EXPEDIENTE", "CONSULTA", "PRESCRIPCION", "REFERENCIA", "LABORATORIO"]
    for codigo in modulos_clinicos:
        modulo = db.query(CatModulo).filter_by(codigo=codigo).first()
        if modulo:
            existe = db.query(PermisoRol).filter_by(
                id_rol=rol.id_rol, id_modulo=modulo.id_modulo
            ).first()
            if not existe:
                db.add(PermisoRol(
                    id_rol=rol.id_rol,
                    id_modulo=modulo.id_modulo,
                    puede_leer=True,
                    puede_crear=True,
                    puede_editar=True,
                    puede_eliminar=False,  # El médico no borra, solo borrado lógico
                ))
    return rol


def seed_establecimiento(db: Session) -> Establecimiento:
    """Jurisdicción y establecimiento de desarrollo."""

    jurisdiccion = db.query(JurisdiccionSanitaria).filter_by(num_jurisdiccion=1).first()
    if not jurisdiccion:
        jurisdiccion = JurisdiccionSanitaria(
            nombre="Jurisdicción Sanitaria I — Tuxtla Gutiérrez",
            num_jurisdiccion=1,
        )
        db.add(jurisdiccion)
        db.flush()

    estab = db.get(Establecimiento, ID_ESTABLECIMIENTO_DEV)
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
        db.flush()

    especialidad = db.get(CatEspecialidadMedica, 1)
    if especialidad:
        existe = db.query(EstablecimientoEspecialidad).filter_by(
            id_establecimiento=ID_ESTABLECIMIENTO_DEV, id_especialidad=1
        ).first()
        if not existe:
            db.add(EstablecimientoEspecialidad(
                id_establecimiento=ID_ESTABLECIMIENTO_DEV,
                id_especialidad=1,
                activa=True,
            ))

    return estab


def seed_medico(db: Session, rol: Rol) -> UsuarioSistema:
    """Persona + Usuario del médico de pruebas."""

    persona = db.get(Persona, ID_PERSONA_MEDICO)
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
        db.flush()

    usuario = db.get(UsuarioSistema, ID_USUARIO_MEDICO)
    if not usuario:
        usuario = UsuarioSistema(
            id_usuario=ID_USUARIO_MEDICO,
            id_persona=ID_PERSONA_MEDICO,
            email="dr.martinez.pruebas@medsys.local",
            password_hash=pwd_context.hash("Test1234!"),
            id_rol=rol.id_rol,
            cedula_profesional="CED-12345678",
            requires_2fa=False,   # Solo dev — en prod debe ser True
            activo=True,
        )
        db.add(usuario)
        db.flush()

    return usuario


def seed_asignaciones(db: Session) -> None:
    """Vincula al médico con el establecimiento y la especialidad."""

    existe_estab = db.query(UsuarioEstablecimiento).filter_by(
        id_usuario=ID_USUARIO_MEDICO,
        id_establecimiento=ID_ESTABLECIMIENTO_DEV,
    ).first()
    if not existe_estab:
        db.add(UsuarioEstablecimiento(
            id_usuario=ID_USUARIO_MEDICO,
            id_establecimiento=ID_ESTABLECIMIENTO_DEV,
            es_principal=True,
        ))

    existe_esp = db.query(PermisoEspecialidad).filter_by(
        id_usuario=ID_USUARIO_MEDICO,
        id_especialidad=1,
    ).first()
    if not existe_esp:
        db.add(PermisoEspecialidad(
            id_usuario=ID_USUARIO_MEDICO,
            id_especialidad=1,
        ))


def run_seed() -> None:
    db: Session = SessionLocal()
    try:
        seed_catalogos(db)
        rol = seed_rol_medico(db)
        seed_establecimiento(db)
        seed_medico(db, rol)
        seed_asignaciones(db)
        db.commit()
        print("✅  Seed completado.")
        print("    Email:    dr.martinez.pruebas@medsys.local")
        print("    Password: Test1234!")
        print("    Cédula:   CED-12345678")
        print("    2FA:      desactivado (solo dev)")
    except Exception as exc:
        db.rollback()
        print(f"❌  Seed fallido: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()