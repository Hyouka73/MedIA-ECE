"""
Generador de PDF para Notas SOAP
Implementación de NOM-004 y NOM-151 para generación on-demand de PDFs firmados
Incluye: datos CLUES, cédula médico, número expediente, fecha CST, contenido SOAP,
hash SHA-256 y sello visual de inmutabilidad.
No persiste en Azure — se devuelve como respuesta binaria.
"""
import hashlib
import io
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple

from weasyprint import HTML, CSS
from weasyprint.css.targets import TargetCollector

from app.models.notas_soap import NotaMedica, NotaSOAP
from app.models.encuentros import EncuentroClinico
from app.models.auth import User, Persona, Establecimiento


# ── CONSTANTES DE DISEÑO (NOM-004, NOM-151, DOC7 §1.1) ─────────────────────

PALETA_COLORES = {
    "fondo_base": "#EDEBE6",           # Cálido, reduce fatiga visual
    "blanco": "#FFFFFF",                # Superficie cards
    "azul_institucional": "#1B4F8A",   # SSA, header, acentos
    "verde_firma": "#2D8653",           # ✅ Sello de firma/inmutabilidad
    "ámbar_advertencia": "#D97706",     # Alertas moderadas
    "rojo_crítico": "#DC2626",          # Alergias graves, errores
    "texto_principal": "#1E293B",       # Near-black
    "texto_secundario": "#64748B",      # Labels, subtítulos
    "sidebar_fondo": "#101E33",         # Azul marino
}

TIPOGRAFIA = {
    "familia": "DM Sans, sans-serif",
    "pesos": {
        "regular": 400,      # Párrafos, instrucciones
        "medium": 500,       # Labels, items de lista
        "semibold": 600,     # Subtítulos, badges
        "bold": 700,         # Títulos
        "extrabold": 800,    # Títulos principales
    }
}

# Zona horaria CST (UTC-6, sin horario de verano en Chiapas)
CST = timezone(timedelta(hours=-6))


class PDFGenerator:
    """Generador de PDFs para notas SOAP con firma digital"""

    @staticmethod
    def convertir_utc_a_cst(dt_utc: datetime) -> datetime:
        """Convierte timestamp UTC a CST (UTC-6)"""
        if dt_utc.tzinfo is None:
            dt_utc = dt_utc.replace(tzinfo=timezone.utc)
        return dt_utc.astimezone(CST)

    @staticmethod
    def generar_hash_contenido(nota_soap: NotaSOAP) -> str:
        """
        Genera hash SHA-256 del contenido SOAP completo.
        Orden: Subjetivo|Objetivo|Análisis|Plan (NOM-151)
        """
        contenido = f"{nota_soap.subjetivo or ''}|{nota_soap.objetivo or ''}|{nota_soap.analisis or ''}|{nota_soap.plan or ''}"
        return hashlib.sha256(contenido.encode('utf-8')).hexdigest()

    @staticmethod
    def generar_html_nota(
        nota: NotaMedica,
        encuentro: EncuentroClinico,
        medico: User,
        medico_persona: Persona,
        establecimiento: Establecimiento,
    ) -> str:
        """
        Genera HTML de la nota SOAP con estilos NOM-004/NOM-151.
        Incluye: CLUES, cédula médico, número expediente, fecha CST,
        contenido SOAP, hash SHA-256, sello visual de inmutabilidad.
        """
        # Convertir fecha a CST
        fecha_consulta_cst = PDFGenerator.convertir_utc_a_cst(encuentro.fecha_inicio)
        fecha_str = fecha_consulta_cst.strftime("%d/%m/%Y")
        hora_str = fecha_consulta_cst.strftime("%H:%M:%S")

        # Generar hash
        hash_contenido = PDFGenerator.generar_hash_contenido(nota.soap_detalle)
        
        # Nombre completo del médico
        medico_nombre_completo = f"{medico_persona.nombre} {medico_persona.primer_apellido}"
        if medico_persona.segundo_apellido:
            medico_nombre_completo += f" {medico_persona.segundo_apellido}"

        # Obtener número de expediente del paciente
        numero_expediente = encuentro.paciente.numero_expediente if encuentro.paciente else "N/A"

        # Construir contenido SOAP con validación
        subjetivo = nota.soap_detalle.subjetivo or "(No registrado)"
        objetivo = nota.soap_detalle.objetivo or "(No registrado)"
        analisis = nota.soap_detalle.analisis or "(No registrado)"
        plan = nota.soap_detalle.plan or "(No registrado)"

        # HTML con estilos NOM-004/NOM-151
        html_content = f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nota SOAP - Expediente {numero_expediente}</title>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap" rel="stylesheet">
            <style>
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}

                @page {{
                    size: letter;
                    margin: 0.75in;
                    @bottom-center {{
                        content: "Página " counter(page) " de " counter(pages);
                        font-family: {TIPOGRAFIA['familia']};
                        font-size: 10px;
                        color: {PALETA_COLORES['texto_secundario']};
                    }}
                }}

                body {{
                    font-family: {TIPOGRAFIA['familia']}, sans-serif;
                    color: {PALETA_COLORES['texto_principal']};
                    background-color: {PALETA_COLORES['fondo_base']};
                    line-height: 1.6;
                }}

                .contenedor {{
                    max-width: 8.5in;
                    background-color: {PALETA_COLORES['blanco']};
                    padding: 1.5rem;
                    border: 1px solid #DAD4CC;
                }}

                /* ENCABEZADO — NOM-004 */
                .header {{
                    border-bottom: 2px solid {PALETA_COLORES['azul_institucional']};
                    padding-bottom: 1rem;
                    margin-bottom: 1.5rem;
                }}

                .header__titulo {{
                    font-size: 14px;
                    font-weight: {TIPOGRAFIA['pesos']['bold']};
                    color: {PALETA_COLORES['azul_institucional']};
                    margin-bottom: 0.5rem;
                }}

                .header__subtitulo {{
                    font-size: 10px;
                    color: {PALETA_COLORES['texto_secundario']};
                    margin-bottom: 0.5rem;
                }}

                .header__grid {{
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    font-size: 11px;
                    margin-top: 0.75rem;
                }}

                .header__item {{
                    display: flex;
                    flex-direction: column;
                }}

                .header__label {{
                    font-weight: {TIPOGRAFIA['pesos']['semibold']};
                    color: {PALETA_COLORES['texto_secundario']};
                    font-size: 9px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }}

                .header__valor {{
                    color: {PALETA_COLORES['texto_principal']};
                    font-weight: {TIPOGRAFIA['pesos']['medium']};
                    margin-top: 0.2rem;
                }}

                /* SECCIÓN SOAP */
                .seccion {{
                    margin-bottom: 1.5rem;
                }}

                .seccion__titulo {{
                    font-size: 12px;
                    font-weight: {TIPOGRAFIA['pesos']['bold']};
                    color: {PALETA_COLORES['blanco']};
                    background-color: {PALETA_COLORES['azul_institucional']};
                    padding: 0.5rem 0.75rem;
                    margin-bottom: 0.75rem;
                    border-left: 3px solid {PALETA_COLORES['verde_firma']};
                    display: inline-block;
                }}

                .seccion__contenido {{
                    font-size: 11px;
                    line-height: 1.6;
                    color: {PALETA_COLORES['texto_principal']};
                    padding: 0.75rem;
                    background-color: #F5F2EC;
                    border-left: 2px solid {PALETA_COLORES['azul_institucional']};
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }}

                /* FIRMA Y HASH — NOM-151 */
                .firma {{
                    border-top: 2px solid {PALETA_COLORES['verde_firma']};
                    padding-top: 1rem;
                    margin-top: 1.5rem;
                    background-color: #F5F2EC;
                    padding: 0.75rem;
                    border-radius: 4px;
                }}

                .firma__titulo {{
                    font-size: 11px;
                    font-weight: {TIPOGRAFIA['pesos']['semibold']};
                    color: {PALETA_COLORES['verde_firma']};
                    text-transform: uppercase;
                    margin-bottom: 0.75rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }}

                .firma__check {{
                    width: 16px;
                    height: 16px;
                    background-color: {PALETA_COLORES['verde_firma']};
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 12px;
                }}

                .firma__contenido {{
                    font-size: 10px;
                    line-height: 1.5;
                    color: {PALETA_COLORES['texto_principal']};
                }}

                .firma__fila {{
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                    padding-bottom: 0.25rem;
                    border-bottom: 1px dotted {PALETA_COLORES['texto_secundario']};
                }}

                .firma__label {{
                    font-weight: {TIPOGRAFIA['pesos']['semibold']};
                    color: {PALETA_COLORES['texto_secundario']};
                }}

                .firma__valor {{
                    color: {PALETA_COLORES['texto_principal']};
                    font-family: monospace;
                    word-break: break-all;
                    max-width: 60%;
                }}

                .sello {{
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background-color: {PALETA_COLORES['verde_firma']};
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    font-weight: {TIPOGRAFIA['pesos']['semibold']};
                    font-size: 10px;
                    margin-top: 0.75rem;
                    text-transform: uppercase;
                }}

                .sello__icono {{
                    font-size: 14px;
                }}

                /* TABLA GRID PARA RESPONSIVIDAD */
                @media print {{
                    body {{
                        background-color: white;
                    }}
                    .contenedor {{
                        box-shadow: none;
                        border: none;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="contenedor">
                <!-- ENCABEZADO NOM-004 -->
                <div class="header">
                    <div class="header__titulo">📋 NOTA MÉDICA — FORMATO SOAP</div>
                    <div class="header__subtitulo">Sistema de Expediente Clínico Electrónico MedIA</div>
                    
                    <div class="header__grid">
                        <div class="header__item">
                            <span class="header__label">Establecimiento (CLUES)</span>
                            <span class="header__valor">{establecimiento.clues}</span>
                        </div>
                        <div class="header__item">
                            <span class="header__label">Nombre de la Unidad</span>
                            <span class="header__valor">{establecimiento.nombre}</span>
                        </div>
                        <div class="header__item">
                            <span class="header__label">Expediente Nº</span>
                            <span class="header__valor">{numero_expediente}</span>
                        </div>
                        <div class="header__item">
                            <span class="header__label">Médico Tratante</span>
                            <span class="header__valor">{medico_nombre_completo}</span>
                        </div>
                        <div class="header__item">
                            <span class="header__label">Cédula Profesional</span>
                            <span class="header__valor">{medico.cedula_profesional or "N/A"}</span>
                        </div>
                        <div class="header__item">
                            <span class="header__label">Fecha y Hora (CST)</span>
                            <span class="header__valor">{fecha_str} {hora_str}</span>
                        </div>
                    </div>
                </div>

                <!-- CONTENIDO SOAP -->
                <div class="seccion">
                    <div class="seccion__titulo">S — Subjetivo</div>
                    <div class="seccion__contenido">{subjetivo}</div>
                </div>

                <div class="seccion">
                    <div class="seccion__titulo">O — Objetivo</div>
                    <div class="seccion__contenido">{objetivo}</div>
                </div>

                <div class="seccion">
                    <div class="seccion__titulo">A — Análisis</div>
                    <div class="seccion__contenido">{analisis}</div>
                </div>

                <div class="seccion">
                    <div class="seccion__titulo">P — Plan</div>
                    <div class="seccion__contenido">{plan}</div>
                </div>

                <!-- SELLO DE FIRMA Y HASH — NOM-151 -->
                <div class="firma">
                    <div class="firma__titulo">
                        <div class="firma__check">✓</div>
                        Sello de Firma Digital (NOM-151)
                    </div>
                    <div class="firma__contenido">
                        <div class="firma__fila">
                            <span class="firma__label">Estado:</span>
                            <span class="firma__valor">FIRMADO ✓ INMUTABLE</span>
                        </div>
                        <div class="firma__fila">
                            <span class="firma__label">Hash SHA-256:</span>
                            <span class="firma__valor">{hash_contenido}</span>
                        </div>
                        <div class="firma__fila">
                            <span class="firma__label">Fecha de Firma:</span>
                            <span class="firma__valor">{fecha_str} {hora_str}</span>
                        </div>
                    </div>
                    <div class="sello">
                        <span class="sello__icono">🔒</span>
                        Documento Firmado
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        return html_content

    @staticmethod
    def generar_pdf(html_content: str) -> bytes:
        """
        Genera PDF binario a partir de HTML usando WeasyPrint.
        No persiste en almacenamiento — retorna bytes directamente.
        """
        try:
            pdf_bytes = HTML(string=html_content).write_pdf()
            return pdf_bytes
        except Exception as e:
            raise RuntimeError(f"Error generando PDF: {str(e)}")

    @staticmethod
    async def generar_pdf_nota_soap(
        nota: NotaMedica,
        encuentro: EncuentroClinico,
        medico: User,
        medico_persona: Persona,
        establecimiento: Establecimiento,
    ) -> bytes:
        """
        Pipeline completo de generación de PDF.
        Retorna bytes del PDF listo para descarga.
        
        Args:
            nota: Nota SOAP con detalle
            encuentro: Encuentro clínico con paciente
            medico: Usuario médico (contiene cedula_profesional)
            medico_persona: Datos personales del médico (nombre, apellidos)
            establecimiento: Establecimiento CLUES
            
        Returns:
            bytes: PDF binario
            
        Raises:
            RuntimeError: Si falla generación de PDF
        """
        # Generar HTML
        html = PDFGenerator.generar_html_nota(
            nota=nota,
            encuentro=encuentro,
            medico=medico,
            medico_persona=medico_persona,
            establecimiento=establecimiento,
        )
        
        # Generar PDF
        pdf_bytes = PDFGenerator.generar_pdf(html)
        
        return pdf_bytes
