"""
Generador Maestro de PDFs - MedIA-ECE
Implementación de NOM-004 y NOM-151 para:
1. Recetas Médicas
2. Solicitudes de Estudio
3. Referencias Médicas
"""
import hashlib
import io
from datetime import datetime, timezone, timedelta
from fpdf import FPDF

# --- CONSTANTES DE DISEÑO ---
AZUL_INST = (27, 79, 138)
VERDE_FIRMA = (45, 134, 83)
GRIS_TEXTO = (100, 116, 139)
FONDO_ALT = (245, 242, 236)
CST = timezone(timedelta(hours=-6))

class MedIAPDFGenerator:
    @staticmethod
    def _convertir_utc_a_cst(dt_utc: datetime) -> datetime:
        if dt_utc.tzinfo is None:
            dt_utc = dt_utc.replace(tzinfo=timezone.utc)
        return dt_utc.astimezone(CST)

    @staticmethod
    def _dibujar_header(pdf, titulo):
        pdf.set_fill_color(*AZUL_INST)
        pdf.rect(0, 0, 210, 35, 'F')
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("helvetica", "B", 20)
        pdf.set_xy(15, 10)
        pdf.cell(0, 10, "MedIA-ECE", 0, 1)
        pdf.set_font("helvetica", "", 10)
        pdf.set_x(15)
        pdf.cell(0, 5, "Sistema de Expediente Clinico Electronico", 0, 1)
        
        pdf.set_font("helvetica", "B", 14)
        pdf.set_xy(120, 12)
        pdf.cell(75, 10, titulo.upper(), 0, 1, "R")
        pdf.ln(15)
        pdf.set_text_color(0, 0, 0)

    @staticmethod
    def _dibujar_datos_paciente(pdf, paciente, expediente, edad, sexo):
        pdf.set_font("helvetica", "B", 10)
        pdf.set_text_color(*AZUL_INST)
        pdf.cell(0, 8, "DATOS DEL PACIENTE", "B", 1)
        pdf.ln(2)
        pdf.set_font("helvetica", "", 9)
        pdf.set_text_color(0, 0, 0)
        
        pdf.cell(100, 6, f"NOMBRE: {paciente}", 0)
        pdf.cell(0, 6, f"EXPEDIENTE: {expediente}", 0, 1)
        pdf.cell(100, 6, f"EDAD / SEXO: {edad} / {sexo}", 0)
        fecha_cst = MedIAPDFGenerator._convertir_utc_a_cst(datetime.now())
        pdf.cell(0, 6, f"FECHA EMISION: {fecha_cst.strftime('%d/%m/%Y %H:%M')}", 0, 1)
        pdf.ln(5)

    @staticmethod
    def _dibujar_sello_inmutabilidad(pdf, contenido_para_hash):
        pdf.set_y(-55)
        pdf.set_fill_color(*VERDE_FIRMA)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("helvetica", "B", 8)
        pdf.cell(0, 6, " DOCUMENTO FIRMADO ELECTRONICAMENTE - SELLO DE INMUTABILIDAD SHA-256 (NOM-151) ", 0, 1, "C", fill=True)
        
        pdf.set_text_color(*GRIS_TEXTO)
        pdf.set_font("courier", "", 7)
        hash_val = hashlib.sha256(str(contenido_para_hash).encode()).hexdigest()
        pdf.cell(0, 5, f"HASH: {hash_val}", 0, 1, "C")
        pdf.set_font("helvetica", "", 6)
        pdf.multi_cell(0, 4, "Este documento es una representacion impresa de un registro electronico inmutable. La integridad puede ser verificada mediante el hash SHA-256 adjunto.", 0, "C")

    @staticmethod
    def generar_receta_pdf(data_rx, data_pac, data_med):
        pdf = FPDF()
        pdf.add_page()
        MedIAPDFGenerator._dibujar_header(pdf, "Receta Medica")
        MedIAPDFGenerator._dibujar_datos_paciente(pdf, data_pac['nombre'], data_pac['expediente'], data_pac['edad'], data_pac['sexo'])
        
        # Cuerpo de la receta
        pdf.set_font("helvetica", "B", 10)
        pdf.set_text_color(*AZUL_INST)
        pdf.cell(0, 8, "PRESCRIPCION", "B", 1)
        pdf.ln(3)
        
        pdf.set_font("helvetica", "B", 12)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(0, 10, data_rx['medicamento'], 0, 1)
        pdf.set_font("helvetica", "I", 9)
        pdf.cell(0, 5, f"Presentacion: {data_rx['presentacion']}", 0, 1)
        pdf.ln(3)
        
        pdf.set_fill_color(*FONDO_ALT)
        pdf.set_font("helvetica", "B", 9)
        pdf.cell(0, 7, " INDICACIONES:", 0, 1, fill=True)
        pdf.set_font("helvetica", "", 11)
        pdf.multi_cell(0, 8, data_rx['indicaciones'], 1, "L", fill=True)
        pdf.ln(5)
        
        pdf.set_font("helvetica", "B", 9)
        pdf.cell(40, 6, "DURACION:", 0)
        pdf.set_font("helvetica", "", 10)
        pdf.cell(0, 6, data_rx['duracion'], 0, 1)
        
        # Firma médico
        pdf.set_y(-75)
        pdf.set_font("helvetica", "B", 10)
        pdf.cell(0, 8, data_med['nombre'], 0, 1, "C")
        pdf.set_font("helvetica", "", 9)
        pdf.cell(0, 5, f"Cedula Profesional: {data_med['cedula']}", 0, 1, "C")
        
        MedIAPDFGenerator._dibujar_sello_inmutabilidad(pdf, data_rx)
        return bytes(pdf.output())

    @staticmethod
    def generar_solicitud_estudio_pdf(data_estudio, data_pac, data_med):
        pdf = FPDF()
        pdf.add_page()
        MedIAPDFGenerator._dibujar_header(pdf, "Solicitud de Estudio")
        MedIAPDFGenerator._dibujar_datos_paciente(pdf, data_pac['nombre'], data_pac['expediente'], data_pac['edad'], data_pac['sexo'])
        
        pdf.set_font("helvetica", "B", 10)
        pdf.set_text_color(*AZUL_INST)
        pdf.cell(0, 8, "DETALLES DEL ESTUDIO", "B", 1)
        pdf.ln(3)
        
        if data_estudio.get('urgente'):
            pdf.set_text_color(220, 38, 38)
            pdf.set_font("helvetica", "B", 12)
            pdf.cell(0, 10, "!!! ESTUDIO URGENTE !!!", 0, 1, "C")
            pdf.ln(2)
            pdf.set_text_color(0, 0, 0)

        pdf.set_font("helvetica", "B", 11)
        pdf.cell(0, 8, f"TIPO DE ESTUDIO: {data_estudio['tipo_estudio']}", 0, 1)
        pdf.ln(2)
        
        pdf.set_fill_color(*FONDO_ALT)
        pdf.set_font("helvetica", "B", 9)
        pdf.cell(0, 7, " INDICACION CLINICA:", 0, 1, fill=True)
        pdf.set_font("helvetica", "", 10)
        pdf.multi_cell(0, 7, data_estudio['indicacion'], 1, "L", fill=True)
        
        MedIAPDFGenerator._dibujar_sello_inmutabilidad(pdf, data_estudio)
        return bytes(pdf.output())

    @staticmethod
    def generar_referencia_pdf(data_ref, data_pac, data_med):
        pdf = FPDF()
        pdf.add_page()
        MedIAPDFGenerator._dibujar_header(pdf, "Referencia Medica")
        MedIAPDFGenerator._dibujar_datos_paciente(pdf, data_pac['nombre'], data_pac['expediente'], data_pac['edad'], data_pac['sexo'])
        
        pdf.set_font("helvetica", "B", 10)
        pdf.set_text_color(*AZUL_INST)
        pdf.cell(0, 8, "DATOS DE TRASLADO / REFERENCIA", "B", 1)
        pdf.ln(3)
        
        pdf.set_font("helvetica", "B", 9)
        pdf.cell(50, 6, "UNIDAD DESTINO:", 0)
        pdf.set_font("helvetica", "", 10)
        pdf.cell(0, 6, data_ref['unidad_destino'], 0, 1)
        
        pdf.set_font("helvetica", "B", 9)
        pdf.cell(50, 6, "ESPECIALIDAD REQUERIDA:", 0)
        pdf.set_font("helvetica", "", 10)
        pdf.cell(0, 6, data_ref['especialidad'], 0, 1)
        pdf.ln(4)
        
        pdf.set_fill_color(*FONDO_ALT)
        pdf.set_font("helvetica", "B", 9)
        pdf.cell(0, 7, " MOTIVO DE REFERENCIA / DIAGNOSTICO:", 0, 1, fill=True)
        pdf.set_font("helvetica", "", 10)
        pdf.multi_cell(0, 7, data_ref['motivo'], 1, "L", fill=True)
        
        MedIAPDFGenerator._dibujar_sello_inmutabilidad(pdf, data_ref)
        return bytes(pdf.output())
