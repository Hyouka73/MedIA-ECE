"""
Servicio de Notas SOAP
Lógica CRUD para notas médicas SOAP con firma digital y enmiendas
Garantiza inmutabilidad NOM-004 mediante triggers de BD
"""
import hashlib
from uuid import UUID
from typing import List, Optional
from sqlalchemy import select, and_, desc, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload
from fastapi import HTTPException, status

from app.models.encuentros import NotaMedica, NotaSOAP, NotaEnmienda, EncuentroClinico
from app.models.auth import User, CatCIE10
from app.schemas.encuentros import (
    NotaSOAPCreateIn, NotaSOAPUpdateIn, NotaSOAPOut, NotaSOAPFirmarIn,
    NotaEnmiendaCreateIn, NotaEnmiendaOut, CIE10Out, CIE10ListOut
)


class NotaSOAPService:
    """CRUD de Notas SOAP con firma digital y enmiendas"""

    @staticmethod
    async def crear_nota_soap(
        db: AsyncSession,
        id_encuentro: UUID,
        id_medico: UUID,
        data: NotaSOAPCreateIn
    ) -> NotaMedica:
        """Crea una nueva nota SOAP en borrador
        
        - Crea registro en notas_medicas (esta_firmada=FALSE)
        - Crea registro en notas_soap_detalle con contenido
        - Permite edición hasta que se firme
        
        Args:
            db: Sesión de DB
            id_encuentro: UUID del encuentro clínico
            id_medico: UUID del médico que crea la nota
            data: NotaSOAPCreateIn con contenido SOAP
            
        Returns:
            NotaMedica: Nota creada con relaciones cargadas
            
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
                detail="No puede crear notas en un encuentro cerrado"
            )

        # Crear nota médica (borrador)
        nota = NotaMedica(
            id_encuentro=id_encuentro,
            tipo_nota=data.tipo_nota,
            esta_firmada=False
        )
        db.add(nota)
        await db.flush()  # Obtener id_nota generado

        # Crear detalle SOAP
        nota_soap = NotaSOAP(
            id_nota=nota.id_nota,
            subjetivo=data.subjetivo,
            objetivo=data.objetivo,
            analisis=data.analisis,
            plan=data.plan
        )
        db.add(nota_soap)

        await db.commit()
        await db.refresh(nota)

        # Cargar relaciones para respuesta
        await db.refresh(nota_soap)
        nota.soap_detalle = nota_soap

        return nota

    @staticmethod
    async def obtener_nota_soap(
        db: AsyncSession,
        id_nota: UUID,
        id_usuario: UUID
    ) -> NotaMedica:
        """Obtiene una nota SOAP completa con detalle
        
        Args:
            db: Sesión de DB
            id_nota: UUID de la nota
            id_usuario: UUID del usuario (para validaciones de acceso)
            
        Returns:
            NotaMedica: Nota con detalle SOAP cargado
            
        Raises:
            HTTPException 404: Nota no encontrada
        """
        result = await db.execute(
            select(NotaMedica)
            .options(
                joinedload(NotaMedica.encuentro),
                joinedload(NotaMedica.soap_detalle),
                selectinload(NotaMedica.enmiendas).joinedload(NotaEnmienda.medico).joinedload(User.persona)
            )
            .where(NotaMedica.id_nota == id_nota)
        )
        nota = result.unique().scalar_one_or_none()

        if not nota:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nota no encontrada"
            )

        # TODO: Validar permisos de acceso según reglas de negocio
        # Por ahora, cualquier usuario autenticado puede ver

        return nota

    @staticmethod
    async def actualizar_nota_soap(
        db: AsyncSession,
        id_nota: UUID,
        id_medico: UUID,
        data: NotaSOAPUpdateIn
    ) -> NotaMedica:
        """Actualiza contenido de nota SOAP (solo si no está firmada)
        
        El trigger tr_notes_protection en BD impide modificar notas firmadas.
        Si está firmada, debe usar enmiendas.
        
        Args:
            db: Sesión de DB
            id_nota: UUID de la nota
            id_medico: UUID del médico (validación de ownership)
            data: NotaSOAPUpdateIn con campos a actualizar
            
        Returns:
            NotaMedica: Nota actualizada
            
        Raises:
            HTTPException 404: Nota no encontrada
            HTTPException 403: Nota ya firmada (trigger la bloquea)
        """
        # Obtener nota con detalle
        nota = await NotaSOAPService.obtener_nota_soap(db, id_nota, id_medico)

        if nota.esta_firmada:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puede modificar una nota firmada. Use enmiendas para correcciones."
            )

        # TODO: Validar que el médico que actualiza es el mismo que creó
        # Por ahora permitimos cualquier médico actualizar

        # Actualizar detalle SOAP
        if nota.soap_detalle:
            if data.subjetivo is not None:
                nota.soap_detalle.subjetivo = data.subjetivo
            if data.objetivo is not None:
                nota.soap_detalle.objetivo = data.objetivo
            if data.analisis is not None:
                nota.soap_detalle.analisis = data.analisis
            if data.plan is not None:
                nota.soap_detalle.plan = data.plan

        await db.commit()
        await db.refresh(nota)

        return nota

    @staticmethod
    async def firmar_nota_soap(
        db: AsyncSession,
        id_nota: UUID,
        id_medico: UUID
    ) -> NotaMedica:
        """Firma digitalmente una nota SOAP
        
        Proceso NOM-151:
        1. Genera hash SHA-256 del contenido completo
        2. Establece esta_firmada=TRUE
        3. Registra firmado_por, fecha_firma, cedula_profesional
        4. El trigger tr_notes_protection la hace inmutable
        
        Args:
            db: Sesión de DB
            id_nota: UUID de la nota
            id_medico: UUID del médico que firma
            
        Returns:
            NotaMedica: Nota firmada
            
        Raises:
            HTTPException 404: Nota no encontrada
            HTTPException 400: Nota ya firmada
        """
        # Obtener nota con detalle
        nota = await NotaSOAPService.obtener_nota_soap(db, id_nota, id_medico)

        if nota.esta_firmada:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La nota ya está firmada"
            )

        # Obtener cédula profesional del médico
        medico = await db.get(User, id_medico)
        if not medico or not medico.cedula_profesional:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El médico debe tener cédula profesional registrada para firmar"
            )

        # Generar hash SHA-256 del contenido completo
        contenido = f"{nota.soap_detalle.subjetivo or ''}|{nota.soap_detalle.objetivo or ''}|{nota.soap_detalle.analisis or ''}|{nota.soap_detalle.plan or ''}"
        pdf_hash = hashlib.sha256(contenido.encode('utf-8')).hexdigest()

        # Firmar la nota (esto activa el trigger de inmutabilidad)
        nota.esta_firmada = True
        nota.firmado_por = id_medico
        nota.cedula_profesional = medico.cedula_profesional
        nota.pdf_hash = pdf_hash
        # fecha_firma se establece automáticamente en BD con CURRENT_TIMESTAMP

        await db.commit()
        await db.refresh(nota)

        return nota

    @staticmethod
    async def crear_enmienda(
        db: AsyncSession,
        id_nota: UUID,
        id_medico: UUID,
        data: NotaEnmiendaCreateIn
    ) -> NotaEnmienda:
        """Crea una enmienda para una nota firmada
        
        Las enmiendas permiten correcciones post-firma sin alterar
        el contenido original (requisito NOM-004).
        
        Args:
            db: Sesión de DB
            id_nota: UUID de la nota firmada
            id_medico: UUID del médico que crea la enmienda
            data: NotaEnmiendaCreateIn con texto de corrección
            
        Returns:
            NotaEnmienda: Enmienda creada
            
        Raises:
            HTTPException 404: Nota no encontrada
            HTTPException 400: Nota no está firmada
        """
        # Verificar que la nota existe y está firmada
        nota = await NotaSOAPService.obtener_nota_soap(db, id_nota, id_medico)

        if not nota.esta_firmada:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo puede crear enmiendas para notas firmadas"
            )

        # Crear enmienda
        enmienda = NotaEnmienda(
            id_nota=id_nota,
            texto_correccion=data.texto_correccion,
            id_medico=id_medico
        )

        db.add(enmienda)
        await db.commit()
        await db.refresh(enmienda)

        # Cargar relación con médico para respuesta
        await db.refresh(enmienda, ['medico'])
        if enmienda.medico and enmienda.medico.persona:
            enmienda.medico_nombre = f"{enmienda.medico.persona.nombre} {enmienda.medico.persona.primer_apellido}"

        return enmienda

    @staticmethod
    async def listar_notas_encuentro(
        db: AsyncSession,
        id_encuentro: UUID,
        skip: int = 0,
        limit: int = 50
    ) -> List[NotaMedica]:
        """Lista todas las notas de un encuentro
        
        Args:
            db: Sesión de DB
            id_encuentro: UUID del encuentro
            skip: Offset para paginación
            limit: Cantidad de registros
            
        Returns:
            List[NotaMedica]: Notas del encuentro
        """
        result = await db.execute(
            select(NotaMedica)
            .options(
                joinedload(NotaMedica.soap_detalle),
                selectinload(NotaMedica.enmiendas).joinedload(NotaEnmienda.medico).joinedload(User.persona)
            )
            .where(NotaMedica.id_encuentro == id_encuentro)
            .order_by(desc(NotaMedica.fecha_creacion))
            .offset(skip)
            .limit(limit)
        )
        return result.unique().scalars().all()


class CatalogoService:
    """Servicios para catálogos médicos"""

    @staticmethod
    async def buscar_cie10(
        db: AsyncSession,
        termino: str,
        limit: int = 20
    ) -> tuple[List[CatCIE10], int]:
        """Busca diagnósticos CIE-10 por término
        
        Args:
            db: Sesión de DB
            termino: Término de búsqueda
            limit: Máximo de resultados
            
        Returns:
            Tupla: (lista de CIE-10, total de resultados)
        """
        # Búsqueda con ILIKE en código y descripción
        search_pattern = f"%{termino}%"
        
        result = await db.execute(
            select(CatCIE10)
            .where(
                or_(
                    CatCIE10.codigo_cie.ilike(search_pattern),
                    CatCIE10.descripcion.ilike(search_pattern)
                )
            )
            .order_by(CatCIE10.codigo_cie)
            .limit(limit)
        )
        diagnosticos = result.scalars().all()

        # Contar total de resultados
        count_result = await db.execute(
            select(func.count(CatCIE10.codigo_cie))
            .where(
                or_(
                    CatCIE10.codigo_cie.ilike(search_pattern),
                    CatCIE10.descripcion.ilike(search_pattern)
                )
            )
        )
        total = count_result.scalar()

        return diagnosticos, total