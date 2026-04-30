"""
Documentos PDF (Módulo 12) — Router
Endpoint que recopila documentos clínicos de un paciente desde las tablas reales.

Según Doc3 Módulo 12, MedIA genera 4 documentos PDF on-demand:
  1. Nota SOAP firmada      → notas_medicas + notas_soap_detalle
  2. Receta médica          → prescripciones + cat_medicamentos
  3. Solicitud de laboratorio → solicitudes_estudio
  4. Referencia médica      → referencias_medicas

Todos se vinculan al paciente vía encuentros_clinicos.id_paciente.
Los endpoints de generación PDF (WeasyPrint) se implementarán en el futuro.
"""
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import logging

from app.database.session import get_db
from app.core.deps import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


# ── GET /documentos ──────────────────────────────────────────────────────
@router.get("", response_model=dict)
async def list_documentos(
    current_user: dict = Depends(get_current_user),
    id_paciente: UUID = Query(..., description="ID del paciente para obtener sus documentos"),
    db: AsyncSession = Depends(get_db),
):
    """GET /documentos?id_paciente=X — Lista todos los documentos clínicos de un paciente.

    Agrupa documentos de 4 fuentes (tablas reales de la BD):
      - Notas SOAP firmadas
      - Recetas médicas (prescripciones)
      - Solicitudes de estudio (laboratorio/imagenología)
      - Referencias médicas

    Cada documento indica si la descarga PDF está disponible (pdf_disponible).
    Cuando se implemente WeasyPrint, solo se cambia pdf_disponible a true.
    """
    try:
        id_pac = str(id_paciente)

        # ── 1. Notas SOAP firmadas ────────────────────────────────────
        notas_query = text("""
            SELECT
                nm.id_nota,
                nm.fecha_creacion,
                nm.fecha_firma,
                nm.esta_firmada,
                nm.tipo_nota,
                nsd.subjetivo,
                ec.motivo_consulta,
                m_per.nombre || ' ' || m_per.primer_apellido AS medico_nombre
            FROM notas_medicas nm
            JOIN encuentros_clinicos ec ON nm.id_encuentro = ec.id_encuentro
            JOIN usuarios_sistema us ON ec.id_medico = us.id_usuario
            JOIN personas m_per ON us.id_persona = m_per.id_persona
            LEFT JOIN notas_soap_detalle nsd ON nm.id_nota = nsd.id_nota
            WHERE ec.id_paciente = :id_paciente
            ORDER BY nm.fecha_creacion DESC
        """)
        notas_result = await db.execute(notas_query, {"id_paciente": id_pac})
        notas_rows = notas_result.fetchall()

        notas = [
            {
                "id": str(r[0]),
                "tipo_documento": "NOTA_SOAP",
                "fecha": r[1].isoformat() if r[1] else None,
                "fecha_firma": r[2].isoformat() if r[2] else None,
                "firmada": r[3] or False,
                "tipo_nota": r[4],
                "descripcion": (r[5] or r[6] or "Nota clínica")[:120],
                "medico": r[7],
                "pdf_disponible": False,
                "pdf_endpoint": f"/notas/{r[0]}/pdf",
            }
            for r in notas_rows
        ]

        # ── 2. Recetas médicas (prescripciones) ──────────────────────
        recetas_query = text("""
            SELECT
                p.id_prescripcion,
                p.indicacion_dosis,
                p.duracion_dias,
                p.cantidad_surtir,
                cm.nombre_generico,
                cm.presentacion,
                ec.id_encuentro,
                ec.fecha_inicio,
                m_per.nombre || ' ' || m_per.primer_apellido AS medico_nombre
            FROM prescripciones p
            JOIN encuentros_clinicos ec ON p.id_encuentro = ec.id_encuentro
            JOIN usuarios_sistema us ON ec.id_medico = us.id_usuario
            JOIN personas m_per ON us.id_persona = m_per.id_persona
            LEFT JOIN cat_medicamentos cm ON p.codigo_medicamento_ssa = cm.codigo_medicamento_ssa
            WHERE ec.id_paciente = :id_paciente
            ORDER BY ec.fecha_inicio DESC
        """)
        recetas_result = await db.execute(recetas_query, {"id_paciente": id_pac})
        recetas_rows = recetas_result.fetchall()

        recetas = [
            {
                "id": str(r[0]),
                "tipo_documento": "RECETA",
                "fecha": r[7].isoformat() if r[7] else None,
                "descripcion": f"{r[4] or 'Medicamento'} — {r[1]}",
                "medicamento": r[4],
                "presentacion": r[5],
                "duracion_dias": r[2],
                "cantidad": r[3],
                "id_encuentro": str(r[6]),
                "medico": r[8],
                "pdf_disponible": False,
                "pdf_endpoint": f"/encuentros/{r[6]}/prescripciones/pdf",
            }
            for r in recetas_rows
        ]

        # ── 3. Solicitudes de estudio ────────────────────────────────
        solicitudes_query = text("""
            SELECT
                se.id_solicitud,
                se.tipo_estudio,
                se.descripcion,
                se.fecha_solicitud,
                ec.id_encuentro,
                m_per.nombre || ' ' || m_per.primer_apellido AS medico_nombre,
                (SELECT COUNT(*) FROM resultados_laboratorio rl WHERE rl.id_solicitud = se.id_solicitud) AS num_resultados
            FROM solicitudes_estudio se
            JOIN encuentros_clinicos ec ON se.id_encuentro = ec.id_encuentro
            JOIN usuarios_sistema us ON ec.id_medico = us.id_usuario
            JOIN personas m_per ON us.id_persona = m_per.id_persona
            WHERE ec.id_paciente = :id_paciente
            ORDER BY se.fecha_solicitud DESC
        """)
        solicitudes_result = await db.execute(solicitudes_query, {"id_paciente": id_pac})
        solicitudes_rows = solicitudes_result.fetchall()

        solicitudes = [
            {
                "id": str(r[0]),
                "tipo_documento": "SOLICITUD_ESTUDIO",
                "tipo_estudio": r[1],
                "fecha": r[3].isoformat() if r[3] else None,
                "descripcion": f"{r[1]}: {r[2]}",
                "medico": r[5],
                "tiene_resultados": (r[6] or 0) > 0,
                "num_resultados": r[6] or 0,
                "pdf_disponible": False,
                "pdf_endpoint": f"/solicitudes/{r[0]}/pdf",
            }
            for r in solicitudes_rows
        ]

        # ── 4. Referencias médicas ───────────────────────────────────
        referencias_query = text("""
            SELECT
                r.id_referencia,
                r.estado,
                r.motivo_referencia,
                r.fecha_emision,
                est.nombre AS establecimiento_destino,
                esp.nombre AS especialidad_destino,
                m_per.nombre || ' ' || m_per.primer_apellido AS medico_nombre
            FROM referencias_medicas r
            JOIN encuentros_clinicos ec ON r.id_encuentro_origen = ec.id_encuentro
            JOIN usuarios_sistema us ON ec.id_medico = us.id_usuario
            JOIN personas m_per ON us.id_persona = m_per.id_persona
            LEFT JOIN establecimientos est ON r.id_establecimiento_destino = est.id_establecimiento
            LEFT JOIN cat_especialidades_medicas esp ON r.id_especialidad_destino = esp.id_especialidad
            WHERE ec.id_paciente = :id_paciente
            ORDER BY r.fecha_emision DESC
        """)
        referencias_result = await db.execute(referencias_query, {"id_paciente": id_pac})
        referencias_rows = referencias_result.fetchall()

        referencias = [
            {
                "id": str(r[0]),
                "tipo_documento": "REFERENCIA",
                "estado": r[1],
                "fecha": r[3].isoformat() if r[3] else None,
                "descripcion": f"Ref. a {r[4] or 'N/A'} — {r[5] or 'N/A'}",
                "motivo": r[2],
                "establecimiento_destino": r[4],
                "especialidad_destino": r[5],
                "medico": r[6],
                "pdf_disponible": False,
                "pdf_endpoint": f"/referencias/{r[0]}/pdf",
            }
            for r in referencias_rows
        ]

        return {
            "data": {
                "notas": notas,
                "recetas": recetas,
                "solicitudes": solicitudes,
                "referencias": referencias,
                "total": len(notas) + len(recetas) + len(solicitudes) + len(referencias),
            },
            "message": "Documentos del paciente obtenidos exitosamente",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al listar documentos del paciente {id_paciente}: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener documentos del paciente")
