# Guía de Generación de PDFs — Notas SOAP (S5, días 1–2)

## Descripción General

Se ha implementado el **endpoint GET `/notas/{id}/pdf`** para generar PDFs de notas SOAP firmadas con sello digital NOM-151.

### Características

✅ **Generación On-Demand**: El PDF se genera dinámicamente en cada solicitud (no persiste en Azure)  
✅ **Cumplimiento NOM-004/NOM-151**: Incluye firma digital, hash SHA-256 e inmutabilidad  
✅ **Diseño NOM-004**: Estilos Doc7 §1.1 (DM Sans, colores institucionales)  
✅ **Conversión CST**: Fecha y hora convertidas de UTC a CST (UTC-6)  
✅ **Sello Visual**: Color verde #2D8653 para indicar firma/inmutabilidad  
✅ **Solo Notas Firmadas**: El PDF solo se genera para notas con `esta_firmada = TRUE`

---

## Arquitectura (Doc6 §Capa 5)

### Flujo Completo

```
GET /notas/{id}/pdf (Médico/Enfermería)
    ↓
NotaSOAPService.obtener_nota_para_pdf(db, id_nota)
    ↓ [Carga relaciones anidadas]
PDFGenerator.generar_pdf_nota_soap(nota, encuentro, medico, persona, establecimiento)
    ↓
    - generar_html_nota() → HTML con estilos NOM-004
    - generar_hash_contenido() → SHA-256 del SOAP
    - generar_pdf(html) → Bytes usando WeasyPrint
    ↓
Response binaria (Content-Type: application/pdf)
```

### Decisión: No Persistir PDFs

| Aspecto | Decisión | Razón |
|---------|----------|-------|
| **Almacenamiento** | No se persiste en Azure Blob | Solo PDFs externos se guardan |
| **Integridad** | Generación dinámica | Garantiza correspondencia con hash SHA-256 |
| **Rendimiento** | WeasyPrint on-demand | Carga mínima de BD + generación rápida |
| **Compliance** | NOM-151 satisfecho | Hash inmutable en BD, PDF regenerable |

---

## Archivos Modificados/Creados

### 1. `backend/app/modules/notas_soap/utils/pdf_generator.py` (COMPLETO)

**Clase Principal**: `PDFGenerator`

```python
class PDFGenerator:
    """Generador de PDFs para notas SOAP con firma digital"""
    
    @staticmethod
    def convertir_utc_a_cst(dt_utc: datetime) -> datetime:
        """Convierte UTC a CST (UTC-6, sin horario de verano)"""
    
    @staticmethod
    def generar_hash_contenido(nota_soap: NotaSOAP) -> str:
        """SHA-256 del contenido SOAP (Subjetivo|Objetivo|Análisis|Plan)"""
    
    @staticmethod
    def generar_html_nota(...) -> str:
        """HTML con estilos NOM-004/NOM-151, colores Doc7 §1.1"""
    
    @staticmethod
    def generar_pdf(html_content: str) -> bytes:
        """Convierte HTML a PDF binario con WeasyPrint"""
    
    @staticmethod
    async def generar_pdf_nota_soap(...) -> bytes:
        """Pipeline completo: HTML → Hash → PDF"""
```

**Constantes de Diseño (Doc7 §1.1)**:

```python
PALETA_COLORES = {
    "fondo_base": "#EDEBE6",        # Cálido, reduce fatiga
    "azul_institucional": "#1B4F8A",# SSA
    "verde_firma": "#2D8653",       # ✅ Inmutabilidad
    "texto_principal": "#1E293B",   # Near-black
    ...
}

TIPOGRAFIA = {
    "familia": "DM Sans",
    "pesos": {400, 500, 600, 700, 800}
}

CST = timezone(timedelta(hours=-6))  # UTC-6
```

### 2. `backend/app/modules/notas_soap/router.py`

**Nuevo Endpoint**:

```python
@router.get("/notas/{id_nota}/pdf")
async def descargar_pdf_nota(
    id_nota: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role(["MEDICO_GENERAL", "ESPECIALISTA", "ENFERMERIA"])),
) -> Response:
```

**Validaciones**:
- ✓ Nota existe
- ✓ Nota está firmada (`esta_firmada = TRUE`)
- ✓ Todas las relaciones cargadas

**Response**:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="Nota_SOAP_{id}.pdf"`
- `Cache-Control: no-cache, no-store, must-revalidate`

### 3. `backend/app/services/notas_soap.py`

**Nuevo Método**:

```python
@staticmethod
async def obtener_nota_para_pdf(
    db: AsyncSession,
    id_nota: UUID,
) -> NotaMedica:
```

**Carga de Relaciones**:
```
NotaMedica
  └─ encuentro → EncuentroClinico
      ├─ paciente → Paciente (para número_expediente)
      ├─ establecimiento → Establecimiento (para CLUES)
      └─ medico → User (para cedula_profesional)
          └─ persona → Persona (para nombre/apellidos)
  └─ soap_detalle → NotaSOAP (para S, O, A, P)
```

---

## Contenido del PDF (NOM-004, NOM-151)

### Encabezado (CLUES y Datos del Médico)

```
┌──────────────────────────────────────────────────┐
│ 📋 NOTA MÉDICA — FORMATO SOAP                    │
│ Sistema de Expediente Clínico Electrónico MedIA │
├──────────────────────────────────────────────────┤
│ Establecimiento (CLUES)    │ Nombre de la Unidad │
│ Expediente Nº              │ Médico Tratante     │
│ Cédula Profesional         │ Fecha y Hora (CST)  │
└──────────────────────────────────────────────────┘
```

### Contenido SOAP

Cada sección (S, O, A, P) con:
- Título azul institucional (#1B4F8A)
- Borde izquierdo verde firma (#2D8653)
- Fondo ligero (#F5F2EC)
- Fuente DM Sans 11px

### Sello de Firma (NOM-151)

```
╔═══════════════════════════════════════════════════╗
║ ✓ SELLO DE FIRMA DIGITAL (NOM-151)               ║
║                                                   ║
║ Estado:     FIRMADO ✓ INMUTABLE                  ║
║ Hash SHA-256: [hash de 64 caracteres]            ║
║ Fecha de Firma: dd/mm/yyyy HH:MM:SS              ║
║                                                   ║
║ 🔒 Documento Firmado                             ║
╚═══════════════════════════════════════════════════╝
```

---

## Ejemplo de Uso

### 1. Obtener PDF de una Nota Firmada

```bash
curl -X GET "http://localhost:8000/encuentros/notas/550e8400-e29b-41d4-a716-446655440000/pdf" \
  -H "Authorization: Bearer <JWT>" \
  -H "Accept: application/pdf" \
  -o nota_soap.pdf
```

### 2. Validar Antes de Descargar

```python
# En frontend, verificar que nota.esta_firmada = True
if (nota.esta_firmada) {
    // Mostrar botón "Descargar PDF"
    const response = await fetch(`/notas/${nota.id}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Nota_SOAP_${nota.id}.pdf`;
        a.click();
    }
}
```

### 3. Registrar en Bitácora (Auditoría)

El endpoint no registra automáticamente descarga de PDFs. Para auditoría:

```python
# En la capa de middleware, registrar:
# - Usuario que descargó
# - Nota descargada
# - Timestamp
# - IP origen (para trazabilidad NOM-004)
```

---

## Validaciones y Errores

### HTTP 404 — Nota No Encontrada

```json
{
  "detail": "Nota no encontrada"
}
```

### HTTP 403 — Nota No Firmada

```json
{
  "detail": "Solo se pueden descargar PDFs de notas firmadas (NOM-151)"
}
```

### HTTP 400 — Datos Incompletos

```json
{
  "detail": "Error: Datos incompletos de la nota"
}
```

---

## Cumplimiento Normativo

### NOM-004 (Expediente Clínico)

✅ **Datos Obligatorios**:
- CLUES del establecimiento
- Nombre y cédula profesional del médico
- Número de expediente del paciente
- Fecha y hora de la consulta (en CST, según Doc6)
- Contenido clínico completo (SOAP)

✅ **Trazabilidad**:
- Nombre del médico firmante
- Cédula profesional
- Hash SHA-256 del contenido
- Fecha y hora en zona horaria de la unidad médica

### NOM-151 (Firma Electrónica Avanzada)

✅ **Firma Digital**:
- Hash SHA-256 del contenido SOAP
- Flag `esta_firmada = TRUE` en BD (inmutable via trigger)
- Sello visual con color verde #2D8653
- Timestamp de firma en CST

✅ **Integridad**:
- PDF regenerable desde datos inmutables en BD
- Hash verificable en cualquier momento
- No requiere certificado X.509 (simplicidad)

### Doc6 §Capa 5 — Arquitectura

✅ **Blob Storage**: Solo para PDFs externos (reportes, órdenes, etc.)  
✅ **Notas Clínicas**: PDF on-demand, no persiste  
✅ **Decisión Documentada**: Ver Doc6 §Diagrama 1, Capa 5

### Doc7 §1.1 / §1.3 — UI/UX

✅ **Tipografía**: DM Sans (400, 500, 600, 700)  
✅ **Colores**: Paleta institucional completa  
✅ **Verde Firma**: #2D8653 para sello de inmutabilidad  
✅ **Fondo Cálido**: #EDEBE6 para reducir fatiga visual

---

## Flujo de Implementación (S5, días 1–2)

### Día 1

- [x] Crear `PDFGenerator` con métodos de conversión CST y hash
- [x] Crear plantilla HTML con estilos NOM-004/NOM-151
- [x] Integrar WeasyPrint para generación de PDF

### Día 2

- [x] Agregar endpoint `GET /notas/{id}/pdf` en router
- [x] Crear método `obtener_nota_para_pdf` en servicio
- [x] Validar nota firmada y relaciones completas
- [x] Testing en Postman/curl
- [x] Documentación (este archivo)

---

## Próximas Mejoras

1. **Auditoría de Descargas**: Registrar en bitácora quién y cuándo descargó
2. **Firma Digital Avanzada**: Integrar certificado X.509 (NOM-151 nivel 2)
3. **Compresión**: Comprimir PDF antes de enviar (Content-Encoding: gzip)
4. **Watermark**: Agregar marca de agua "COPIA ELECTRÓNICA" si nota < 30 días
5. **Enmiendas Visibles**: Mostrar enmiendas (addendums) al final del PDF
6. **Traducción Trilingüe**: Español, Lengua Materna, Inglés (para consultas)

---

## Referencias

📎 **Doc6** — Infraestructura (Diagrama 1, Capa 5)  
📎 **Doc7** — UI/UX (§1.1 Tipografía, §1.3 Colores)  
📎 **Doc3** — Módulo 6 (Notas Médicas y SOAP)  
📎 **NOM-004** — Expediente Clínico  
📎 **NOM-151** — Firma Electrónica Avanzada

---

## Soporte

Para errores o preguntas:

1. Verificar logs de error en `backend/logs/`
2. Validar que WeasyPrint está instalado: `pip list | grep -i weasyprint`
3. Verificar ruta de fonts en sistema operativo
4. Consultar doc de WeasyPrint: https://doc.courtbouillon.org/weasyprint/

