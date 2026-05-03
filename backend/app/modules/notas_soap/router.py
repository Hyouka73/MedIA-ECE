from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, status, Query, Response, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.deps import get_current_user, require_role
from app.services.notas_soap import NotaSOAPService, CatalogoService
from app.schemas.notas_soap import (
    NotaSOAPCreateIn,
    NotaSOAPUpdateIn,
    NotaSOAPOut,
    NotaEnmiendaCreateIn,
    NotaEnmiendaOut,
    CIE10ListOut,
)
from app.modules.notas_soap.utils.pdf_generator import PDFGenerator

router = APIRouter()


@router.post("/{id_encuentro}/notas", response_model=NotaSOAPOut, status_code=status.HTTP_201_CREATED)
async def crear_nota(
    id_encuentro: UUID,
    data: NotaSOAPCreateIn,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role(["MEDICO_GENERAL", "ESPECIALISTA"])),
):
    """Crea una nota SOAP en borrador para un encuentro específico"""
    return await NotaSOAPService.crear_nota_soap(
        db=db,
        id_encuentro=id_encuentro,
        id_medico=UUID(current_user["sub"]),
        data=data,
    )


@router.patch("/notas/{id_nota}", response_model=NotaSOAPOut)
async def actualizar_nota(
    id_nota: UUID,
    data: NotaSOAPUpdateIn,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role(["MEDICO_GENERAL", "ESPECIALISTA"])),
):
    """Actualiza una nota (solo si esta_firmada = FALSE)"""
    return await NotaSOAPService.actualizar_nota_soap(
        db=db,
        id_nota=id_nota,
        id_medico=UUID(current_user["sub"]),
        data=data,
    )


@router.patch("/notas/{id_nota}/firmar", response_model=NotaSOAPOut)
async def firmar_nota(
    id_nota: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role(["MEDICO_GENERAL", "ESPECIALISTA"])),
):
    """Firma digitalmente la nota y activa inmutabilidad (SHA-256)"""
    return await NotaSOAPService.firmar_nota_soap(
        db=db,
        id_nota=id_nota,
        id_medico=UUID(current_user["sub"]),
    )


# ── GENERACIÓN DE PDF (NOM-004/NOM-151) ────────────────

@router.get("/notas/{id_nota}/pdf")
async def descargar_pdf_nota(
    id_nota: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role(["MEDICO_GENERAL", "ESPECIALISTA", "ENFERMERIA"])),
):
    """
    Genera y descarga el PDF de la nota SOAP firmada con sello NOM-151.
    
    Implementación: GET /notas/{id}/pdf — S5, días 1–2
    
    📋 Contenido del PDF (NOM-004, NOM-151):
    - Datos CLUES del establecimiento
    - Nombre y cédula profesional del médico
    - Número de expediente del paciente
    - Fecha y hora de la consulta en CST (convertida de UTC)
    - Contenido SOAP completo (Subjetivo, Objetivo, Análisis, Plan)
    - Hash SHA-256 del contenido
    - Sello visual de inmutabilidad (#2D8653 verde, Doc7 §1.3)
    
    🎨 Diseño: Plantilla HTML con estilos Doc7 §1.1
    - Fuente: DM Sans (400, 500, 600, 700)
    - Colores institucionales: azul SSA (#1B4F8A), verde firma (#2D8653)
    - Fondo cálido (#EDEBE6) para reducir fatiga visual en turnos largos
    
    ⚙️ Arquitectura (Doc6 §Capa 5):
    - PDF se genera on-demand (NO persiste en Azure Blob Storage)
    - Se devuelve como respuesta binaria con Content-Type: application/pdf
    - Decisión: Solo PDFs externos se guardan en Blob — PDFs de notas firmadas
      se generan dinámicamente para garantizar integridad
    
    📎 Referencias:
    - Doc6 §Diagrama 1, Capa 5: Blob Storage solo para PDFs externos
    - Doc6 §Diagrama 3, Paso 12: Sello visual post-firma
    - Doc7 §1.1: Tokens de color y tipografía
    - Doc7 §1.3: Color verde #2D8653 para firma/inmutabilidad
    
    Args:
        id_nota: UUID de la nota a descargar
        db: Sesión de BD
        current_user: Usuario autenticado (médico o enfermería)
        
    Returns:
        Response binaria con PDF (Content-Type: application/pdf)
        
    Raises:
        HTTPException 404: Nota no encontrada
        HTTPException 403: Nota no firmada (solo PDFs de notas firmadas)
        RuntimeError: Error en generación de PDF
    """
    # Obtener nota con todas las relaciones anidadas (usa new method en service)
    nota = await NotaSOAPService.obtener_nota_para_pdf(db, id_nota)
    
    if not nota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nota no encontrada"
        )
    
    # Verificar que la nota está firmada (NOM-151)
    if not nota.esta_firmada:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo se pueden descargar PDFs de notas firmadas (NOM-151)"
        )
    
    # Validar que hay relaciones cargadas
    if not nota.encuentro or not nota.soap_detalle:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error: Datos incompletos de la nota"
        )
    
    # Generar PDF
    pdf_bytes = await PDFGenerator.generar_pdf_nota_soap(
        nota=nota,
        encuentro=nota.encuentro,
        medico=nota.encuentro.medico,
        medico_persona=nota.encuentro.medico.persona,
        establecimiento=nota.encuentro.establecimiento,
    )
    
    # Retornar como respuesta binaria
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="Nota_SOAP_{nota.id_nota}.pdf"',
            "Cache-Control": "no-cache, no-store, must-revalidate",
        }
    )

@router.post("/notas/{id_nota}/enmienda", response_model=NotaEnmiendaOut)
async def crear_enmienda(
    id_nota: UUID,
    data: NotaEnmiendaCreateIn,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role(["MEDICO_GENERAL", "ESPECIALISTA"])),
):
    """Crea una corrección (Addendum) para una nota ya firmada"""
    return await NotaSOAPService.crear_enmienda(
        db=db,
        id_nota=id_nota,
        id_medico=UUID(current_user["sub"]),
        data=data,
    )


# ── CATÁLOGOS ──────────────────────────────────────────

@router.get("/catalogos/cie10", response_model=CIE10ListOut)
async def buscar_cie10(
    q: str = Query(..., min_length=3, description="Término de búsqueda (código o nombre)"),
    db: AsyncSession = Depends(get_db),
):
    """Búsqueda de diagnósticos CIE-10 (límite 20)"""
    items, total = await CatalogoService.buscar_cie10(db=db, termino=q)
    return {"resultados": items, "total": total}


# ── CONSULTA DE NOTAS ──────────────────────────────────

@router.get("/{id_encuentro}/notas", response_model=List[NotaSOAPOut])
async def listar_notas_encuentro(
    id_encuentro: UUID,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Lista todo el historial de notas de un encuentro"""
    return await NotaSOAPService.listar_notas_encuentro(
        db=db,
        id_encuentro=id_encuentro,
        skip=skip,
        limit=limit,
    )

    