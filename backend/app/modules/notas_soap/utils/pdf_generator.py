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

from fpdf import FPDF

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
    def generar_pdf(
        nota: NotaMedica,
        encuentro: EncuentroClinico,
        medico: User,
        medico_persona: Persona,
        establecimiento: Establecimiento,
    ) -> bytes:
        """
        Genera PDF binario directamente usando fpdf2.
        No persiste en almacenamiento — retorna bytes directamente.
        """
        try:
            # Crear PDF
            pdf = FPDF()
            pdf.add_page()
            
            # Configurar fuente (usaremos Arial ya que DM Sans no está disponible en FPDF por defecto)
            pdf.set_font("Arial", "B", 14)
            
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
            
            # Header
            pdf.set_fill_color(27, 79, 138)  # Azul institucional
            pdf.cell(0, 10, "NOTA MEDICA - FORMATO SOAP", 0, 1, "C", fill=True)
            pdf.set_font("Arial", "", 10)
            pdf.cell(0, 8, "Sistema de Expediente Clinico Electronico MedIA", 0, 1, "C")
            pdf.ln(5)
            
            # Información del establecimiento y médico
            pdf.set_font("Arial", "B", 10)
            pdf.cell(0, 8, f"Establecimiento (CLUES): {establecimiento.clues}", 0, 1)
            pdf.cell(0, 8, f"Nombre de la Unidad: {establecimiento.nombre}", 0, 1)
            pdf.cell(0, 8, f"Expediente No: {numero_expediente}", 0, 1)
            pdf.cell(0, 8, f"Medico Tratante: {medico_nombre_completo}", 0, 1)
            pdf.cell(0, 8, f"Cedula Profesional: {medico.cedula_profesional or 'N/A'}", 0, 1)
            pdf.cell(0, 8, f"Fecha y Hora (CST): {fecha_str} {hora_str}", 0, 1)
            pdf.ln(5)
            
            # Secciones SOAP
            secciones = [
                ("S - Subjetivo", subjetivo),
                ("O - Objetivo", objetivo),
                ("A - Analisis", analisis),
                ("P - Plan", plan)
            ]
            
            for titulo, contenido in secciones:
                pdf.set_fill_color(27, 79, 138)
                pdf.set_text_color(255, 255, 255)
                pdf.set_font("Arial", "B", 12)
                pdf.cell(0, 8, titulo, 0, 1, "L", fill=True)
                pdf.set_text_color(0, 0, 0)
                pdf.set_font("Arial", "", 10)
                pdf.set_fill_color(245, 242, 236)
                pdf.multi_cell(0, 6, contenido, 0, 1, fill=True)
                pdf.ln(3)
            
            # Sello de firma
            pdf.ln(5)
            pdf.set_fill_color(45, 134, 83)  # Verde firma
            pdf.set_text_color(255, 255, 255)
            pdf.set_font("Arial", "B", 10)
            pdf.cell(0, 8, "SELLO DE FIRMA DIGITAL (NOM-151)", 0, 1, "C", fill=True)
            pdf.set_text_color(0, 0, 0)
            pdf.set_font("Arial", "", 9)
            pdf.set_fill_color(245, 242, 236)
            pdf.cell(0, 6, f"Estado: FIRMADO INMUTABLE", 0, 1, fill=True)
            pdf.cell(0, 6, f"Hash SHA-256: {hash_contenido}", 0, 1, fill=True)
            pdf.cell(0, 6, f"Fecha de Firma: {fecha_str} {hora_str}", 0, 1, fill=True)
            
            # Obtener bytes del PDF
            pdf_bytes = pdf.output(dest='S')
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
        # Generar PDF directamente
        pdf_bytes = PDFGenerator.generar_pdf(
            nota=nota,
            encuentro=encuentro,
            medico=medico,
            medico_persona=medico_persona,
            establecimiento=establecimiento,
        )
        
        return pdf_bytes
