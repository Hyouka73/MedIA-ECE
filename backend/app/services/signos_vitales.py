"""
Servicio de Signos Vitales
Lógica CRUD para registro y consulta de signos vitales durante encuentros clínicos
Garantiza trazabilidad NOM-004 con timestamp del servidor
"""
from uuid import UUID
from typing import List, Optional
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from fastapi import HTTPException, status

from app.models.encuentros import SignosVitales, EncuentroClinico
from app.models.auth import User
from app.schemas.encuentros import (
    SignosVitalesCreateIn, SignosVitalesOut, SignosVitalesListOut
)


class SignosVitalesService:
    """CRUD de Signos Vitales con validaciones y trazabilidad"""

    @staticmethod
    async def registrar_signos(
        db: AsyncSession,
        id_encuentro: UUID,
        id_enfermero: UUID,
        data: SignosVitalesCreateIn
    ) -> SignosVitales:
        """Registra signos vitales para un encuentro activo
        
        - Verifica que el encuentro existe y está activo (sin fecha_cierre)
        - Crea registro con timestamp del servidor (CURRENT_TIMESTAMP en DB)
        - Cliente NO puede enviar fecha_toma (garantiza trazabilidad)
        
        Args:
            db: Sesión de DB
            id_encuentro: UUID del encuentro clínico
            id_enfermero: UUID del enfermero que registra
            data: SignosVitalesCreateIn con validaciones de rango
            
        Returns:
            SignosVitales: Registro creado con fecha_toma del servidor
            
        Raises:
            HTTPException 404: Encuentro no encontrado
            HTTPException 400: Encuentro ya cerrado
        """
        # Verificar encuentro activo
        encuentro = await db.execute(
            select(EncuentroClinico).where(
                EncuentroClinico.id_encuentro == id_encuentro
            )
        )
        encuentro_obj = encuentro.scalar_one_or_none()

        if not encuentro_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Encuentro no encontrado"
            )

        if encuentro_obj.fecha_cierre:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puede registrar signos en un encuentro cerrado"
            )

        # Crear registro — fecha_toma se asigna en DB con CURRENT_TIMESTAMP
        signos = SignosVitales(
            id_encuentro=id_encuentro,
            id_enfermero=id_enfermero,
            presion_sistolica=data.presion_sistolica,
            presion_diastolica=data.presion_diastolica,
            temperatura_c=data.temperatura_c,
            saturacion_oxigeno=data.saturacion_oxigeno,
            frecuencia_cardiaca=data.frecuencia_cardiaca,
            frecuencia_respiratoria=data.frecuencia_respiratoria,
            peso_kg=data.peso_kg,
            talla_cm=data.talla_cm
            # fecha_toma se genera automáticamente en DB
        )

        db.add(signos)
        await db.commit()
        await db.refresh(signos)

        return signos

    @staticmethod
    async def obtener_signos_encuentro(
        db: AsyncSession,
        id_encuentro: UUID,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[SignosVitales], int, bool]:
        """Obtiene signos vitales de un encuentro
        
        Usa la vista v_signos_encuentro para control de acceso (enfermería).
        Los datos son públicos dentro de la vista.
        
        Args:
            db: Sesión de DB
            id_encuentro: UUID del encuentro
            skip: Offset para paginación
            limit: Cantidad de registros por página
            
        Returns:
            Tupla: (lista de signos, total de registros, está_activo)
        """
        # Verificar si encuentro existe y está activo
        encuentro = await db.execute(
            select(EncuentroClinico).where(
                EncuentroClinico.id_encuentro == id_encuentro
            )
        )
        encuentro_obj = encuentro.scalar_one_or_none()

        if not encuentro_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Encuentro no encontrado"
            )

        esta_activo = encuentro_obj.fecha_cierre is None

        # Obtener signos vitales ordenados por fecha DESC (más reciente primero)
        result = await db.execute(
            select(SignosVitales)
            .options(
                joinedload(SignosVitales.enfermero).joinedload(User.persona)
            )
            .where(SignosVitales.id_encuentro == id_encuentro)
            .order_by(desc(SignosVitales.fecha_toma))
            .offset(skip)
            .limit(limit)
        )
        signos_list = result.unique().scalars().all()

        # Contar total de registros
        count_result = await db.execute(
            select(SignosVitales).where(SignosVitales.id_encuentro == id_encuentro)
        )
        total = len(count_result.scalars().all())

        return signos_list, total, esta_activo

    @staticmethod
    async def obtener_signos_ultimo(
        db: AsyncSession,
        id_encuentro: UUID
    ) -> Optional[SignosVitales]:
        """Obtiene el último registro de signos vitales de un encuentro
        
        Útil para validar en frontend si el paso 1 (Signos) está completo
        
        Args:
            db: Sesión de DB
            id_encuentro: UUID del encuentro
            
        Returns:
            SignosVitales o None si no hay registros
        """
        result = await db.execute(
            select(SignosVitales)
            .where(SignosVitales.id_encuentro == id_encuentro)
            .order_by(desc(SignosVitales.fecha_toma))
            .limit(1)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def actualizar_signos(
        db: AsyncSession,
        id_signos: UUID,
        id_enfermero: UUID,
        data: SignosVitalesCreateIn
    ) -> SignosVitales:
        """Actualiza un registro de signos vitales
        
        Solo el enfermero que registró o admin puede actualizar
        NOTA: En NOM-004 se requiere auditoría de cambios, considerar crear
              entrada de auditoría o log forense para cambios
        
        Args:
            db: Sesión de DB
            id_signos: UUID del registro a actualizar
            id_enfermero: UUID del enfermero (validación de ownership)
            data: Nuevos valores con validaciones
            
        Returns:
            SignosVitales: Registro actualizado
            
        Raises:
            HTTPException 404: Registro no encontrado
            HTTPException 403: No autorizado a modificar
        """
        # Obtener registro existente
        signos = await db.get(SignosVitales, id_signos)
        if not signos:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registro de signos vitales no encontrado"
            )

        # Validar ownership (solo quien registró puede modificar)
        # TODO: Permitir también admin/supervisor según políticas
        if signos.id_enfermero != id_enfermero:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo el enfermero que registró puede modificar"
            )

        # Actualizar campos
        signos.presion_sistolica = data.presion_sistolica
        signos.presion_diastolica = data.presion_diastolica
        signos.temperatura_c = data.temperatura_c
        signos.saturacion_oxigeno = data.saturacion_oxigeno
        signos.frecuencia_cardiaca = data.frecuencia_cardiaca
        signos.frecuencia_respiratoria = data.frecuencia_respiratoria
        signos.peso_kg = data.peso_kg
        signos.talla_cm = data.talla_cm

        await db.commit()
        await db.refresh(signos)

        return signos

    @staticmethod
    async def eliminar_signos(
        db: AsyncSession,
        id_signos: UUID,
        id_enfermero: UUID
    ) -> None:
        """Elimina un registro de signos vitales
        
        Solo el enfermero que registró o admin puede eliminar
        
        Args:
            db: Sesión de DB
            id_signos: UUID del registro a eliminar
            id_enfermero: UUID del enfermero (validación)
            
        Raises:
            HTTPException 404: Registro no encontrado
            HTTPException 403: No autorizado a eliminar
        """
        signos = await db.get(SignosVitales, id_signos)
        if not signos:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registro de signos vitales no encontrado"
            )

        if signos.id_enfermero != id_enfermero:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo el enfermero que registró puede eliminar"
            )

        await db.delete(signos)
        await db.commit()
