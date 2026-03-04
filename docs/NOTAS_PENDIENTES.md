# MedSys — Notas técnicas pendientes
> Generado por análisis de diseño + NOM-024-SSA3-2012 / NOM-151-SCFI-2016  
> Fecha: 3 Jun 2025 · Para revisión del agente siguiente

---

## Gaps funcionales respecto a normativa real

Estos puntos **no son capricho de diseño**, están exigidos por norma:

### 1. Autocompletado CIE-10 en campo de diagnóstico
- El campo de "Diagnóstico principal" actualmente es un textarea libre
- En producción **debe conectarse al catálogo CIE-10 oficial** con búsqueda por código o por descripción
- Sugerencia de implementación: input con dropdown de resultados, al seleccionar guarda código + descripción

### 2. Número de expediente visible en header de consulta
- La NOM-004 exige que cada nota muestre el número de expediente del paciente
- Actualmente solo aparece en la pantalla de firma (`Folio: EXP-2025-14832`)
- Debe estar en el `TopBar` de la vista de Consulta SOAP desde el inicio

### 3. Datos del establecimiento siempre presentes
- CLUES (Clave Única de Establecimientos de Salud), nombre de unidad, turno y consultorio
- Parcialmente cubiertos en el subtitle del TopBar — pero deberían ser parte del header de cada nota imprimible/firmada

### 4. Timestamp completo en notas SOAP
- La NOM exige hora:minuto exactos en cada sección de la nota, no solo al firmar
- Implementar: guardar automáticamente la hora al avanzar cada paso del stepper

### 5. Sello visual de inmutabilidad post-firma
- Tras firmar, la nota debería mostrar un componente tipo:
  ```
  ✅ Firmado · 03/Jun/2025 · 09:47:22 CST
  SHA-256: a3f29d1e... (hash del documento)
  Dr. R. Morales · Cédula: 1234567 · UMF-42
  ```
- Esto comunica la inmutabilidad que exige NOM-151 de forma tangible para el médico

---

## Mejoras de UX que quedaron pendientes (nice-to-have)

- **Receta electrónica**: el Plan del SOAP debería poder generar una receta imprimible con los datos del médico, paciente y medicamentos estructurados (no solo texto libre)
- **Campo de alergias interactivo**: en lugar de leerlas solo, el médico debería poder agregar/confirmar alergias durante la consulta con un modal rápido
- **Vista de impresión/PDF** de la nota médica finalizada (la norma exige que sea exportable)
- **Indicador de conexión/sincronización**: en sistemas hospitalarios la conectividad es crítica, un badge de estado en el sidebar sería útil

---

## Lo que ya está bien y **no tocar**

- Paleta cálida de fondos (`#EDEBE6` base) — decisión correcta para fatiga visual en turnos de 8h+
- Flujo login con 2FA (OTP de 6 dígitos) — cumple NOM-024
- Bitácora de accesos en panel de Seguridad — cumple requisito de trazabilidad
- Alergias con jerarquía visual por severidad (🔴 alta / 🟡 moderada) — mejor que el ECE real del IMSS
- Sidebar con grupos "Clínica / Sistema" + rol del usuario siempre visible
- Stepper del SOAP con estados de completitud — mucho mejor UX que tabs sin estado
- Fuente DM Sans — correcta para densidad de información médica

---

## Referencia normativa rápida

| Norma | Aplica a |
|---|---|
| NOM-024-SSA3-2012 | Expediente clínico electrónico — intercambio de información |
| NOM-004-SSA3-2012 | Del expediente clínico — contenido obligatorio de notas |
| NOM-151-SCFI-2016 | Firma electrónica — validez legal de documentos digitales |
| NOM-035-STPS-2018 | Indirecta — factores de riesgo psicosocial, UX cómoda reduce fatiga |

---

_Nota generada como handoff. El diseño base en `medsys-v2.jsx` está funcional como prototipo. Los gaps de arriba son para la fase de producción real._
