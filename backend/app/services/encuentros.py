"""
Servicio de Encuentros Clínicos
Lógica de negocio para creación, consulta y cierre de encuentros
"""
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, update, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from fastapi import HTTPException, status

from app.models.encuentros import EncuentroClinico, Paciente
from app.models.notas_soap import NotaMedica
from app.models.auth import User, Establecimiento
from app.schemas.encuentros import (
    EncuentroCreateIn, EncuentroOut, EncuentroDetalleOut,
    EncuentroCerrarIn, EncuentroPacienteOut
)

 
class EncuentroService:

    @staticmethod
    async def crear_encuentro(
        db: AsyncSession,
        data: EncuentroCreateIn,
        id_medico: UUID,
        id_establecimiento: UUID
    ) -> EncuentroClinico:
        """Crea un nuevo encuentro clínico"""
        # Verificar que el paciente existe
        paciente = await db.get(Paciente, data.id_paciente)
        if not paciente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Paciente no encontrado"
            )

        # Verificar que no hay encuentro activo para este paciente
        encuentro_activo = await db.execute(
            select(EncuentroClinico).where(
                and_(
                    EncuentroClinico.id_paciente == data.id_paciente,
                    EncuentroClinico.fecha_cierre.is_(None)
                )
            )
        )
        if encuentro_activo.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El paciente ya tiene un encuentro activo"
            )

        # Crear el encuentro
        encuentro = EncuentroClinico(
            id_paciente=data.id_paciente,
            id_medico=id_medico,
            id_establecimiento=id_establecimiento,
            motivo_consulta=data.motivo_consulta
        )

        db.add(encuentro)
        await db.commit()
        await db.refresh(encuentro)

        return encuentro

    @staticmethod
    async def listar_encuentros_activos(
        db: AsyncSession,
        id_establecimiento: UUID,
        skip: int = 0,
        limit: int = 50
    ) -> List[EncuentroClinico]:
        """Lista encuentros activos del establecimiento"""
        result = await db.execute(
            select(EncuentroClinico)
            .options(
                joinedload(EncuentroClinico.paciente).joinedload(Paciente.persona),
                joinedload(EncuentroClinico.medico).joinedload(User.persona),
                joinedload(EncuentroClinico.establecimiento)
            )
            .where(
                and_(
                    EncuentroClinico.id_establecimiento == id_establecimiento,
                    EncuentroClinico.fecha_cierre.is_(None)
                )
            )
            .order_by(desc(EncuentroClinico.fecha_inicio))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    async def obtener_encuentro(
        db: AsyncSession,
        id_encuentro: UUID,
        id_usuario: UUID
    ) -> EncuentroClinico:
        """Obtiene detalle de un encuentro"""
        result = await db.execute(
            select(EncuentroClinico)
            .options(
                joinedload(EncuentroClinico.paciente).joinedload(Paciente.persona),
                joinedload(EncuentroClinico.medico).joinedload(User.persona),
                joinedload(EncuentroClinico.establecimiento),
                joinedload(EncuentroClinico.especialidad),
                joinedload(EncuentroClinico.notas)
            )
            .where(EncuentroClinico.id_encuentro == id_encuentro)
        )
        encuentro = result.scalar_one_or_none()

        if not encuentro:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Encuentro no encontrado"
            )

        # TODO: Verificar permisos según reglas de negocio
        # Por ahora, cualquier usuario autenticado puede ver

        return encuentro

    @staticmethod
    async def cerrar_encuentro(
        db: AsyncSession,
        id_encuentro: UUID,
        id_usuario: UUID
    ) -> EncuentroClinico:
        """Cierra un encuentro clínico"""
        encuentro = await EncuentroService.obtener_encuentro(db, id_encuentro, id_usuario)

        if encuentro.fecha_cierre:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El encuentro ya está cerrado"
            )

        # Verificar que tiene al menos una nota firmada
        notas_firmadas = await db.execute(
            select(NotaMedica).where(
                and_(
                    NotaMedica.id_encuentro == id_encuentro,
                    NotaMedica.esta_firmada == True
                )
            )
        )
        if not notas_firmadas.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede cerrar el encuentro sin al menos una nota firmada"
            )

        # Cerrar el encuentro usando CURRENT_TIMESTAMP del servidor (NOM-004)
        from sqlalchemy import text
        await db.execute(
            text("""
                UPDATE encuentros_clinicos 
                SET fecha_cierre = CURRENT_TIMESTAMP 
                WHERE id_encuentro = :id_encuentro
            """),
            {"id_encuentro": id_encuentro}
        )
        await db.commit()
        
        # Recargar el encuentro para devolverlo actualizado
        encuentro = await EncuentroService.obtener_encuentro(db, id_encuentro, id_usuario)

    @staticmethod
    async def listar_encuentros_paciente(
        db: AsyncSession,
        id_paciente: UUID,
        id_usuario: UUID,
        skip: int = 0,
        limit: int = 50
    ) -> List[EncuentroClinico]:
        """Lista el historial de encuentros de un paciente"""
        # TODO: Verificar permisos según reglas de negocio
        # Por ahora, cualquier usuario autenticado puede ver

        result = await db.execute(
            select(EncuentroClinico)
            .options(
                joinedload(EncuentroClinico.medico).joinedload(User.persona),
                joinedload(EncuentroClinico.establecimiento),
                joinedload(EncuentroClinico.especialidad)
            )
            .where(EncuentroClinico.id_paciente == id_paciente)
            .order_by(desc(EncuentroClinico.fecha_inicio))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()


# Instancia del servicio
encuentro_service = EncuentroService()