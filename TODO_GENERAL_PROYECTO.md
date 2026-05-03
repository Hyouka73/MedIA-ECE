# 🚀 TODO List: Finalización y Blindaje MedIA-ECE
> **Estado:** Auditoría Técnica Completada (Mayo 2026)
> **Objetivo:** Cumplimiento total NOM-024, NOM-004 y NOM-151.

---

## 🛠️ I. Infraestructura y Datos (Cimientos Legales)
- [x] **Alineación de BD (NOM-151):** Verificado. El sistema utiliza propiedades derivadas para `id_medico` y cuenta con `fecha_firma` y `pdf_hash` en la tabla `notas_medicas`.
- [x] **Trigger de Inmutabilidad:** Verificado en `02_triggers.sql`. El trigger `tr_notes_protection` ya protege las notas contra ediciones post-firma.
- [ ] **Azure Blob Storage:** Implementar `blob_service.py` para subir resultados de laboratorio externos y generar **SAS Tokens**.
- [ ] **Hash Forense en Archivos:** Registrar el SHA-256 de cada PDF de laboratorio subido en la bitácora de auditoría.

## 📄 II. Documentación Clínica (Pulido y Calidad Visual)
- [ ] **Rediseño Institucional de PDFs (Nota, Receta, Referencia):**
    - [ ] Registrar y aplicar fuente **DM Sans** (vía `pdf.add_font`).
    - [ ] Sustituir cuadros azules por Header oficial con Logos del Distrito I.
    - [ ] Implementar maquetación profesional (columnas y espaciado legal).
    - [ ] Asegurar que los datos derivados (Médico/Cédula) aparezcan en el sello de firma.

## 🛡️ III. Lógica de Negocio y Seguridad
- [ ] **CORRECCIÓN CRÍTICA (acceso.py):** 
    - [ ] Corregir nombres de tablas (`referencias` -> `referencias_medicas`).
    - [ ] Corregir columnas (`id_especialista_receptor` -> `id_establecimiento_destino`).
    - [ ] Sincronizar Regla 2 con la estructura real de `notas_medicas` (vía encuentro).
- [ ] **Blindaje de Referencias:** Restringir el acceso para que solo el hospital destino pueda responder a la referencia.
- [x] **Alerta de Alergia Crítica:** Backend ya devuelve 409 Conflict y bloquea si hay coincidencia (Verificado).
- [ ] **Trazabilidad de Pasos:** Guardar timestamps automáticos por sección del stepper SOAP.

## 🎨 IV. Frontend y UX Clínica
- [ ] **Bandeja de Entrada "Mis Referencias":** Crear vista filtrada para que el médico vea solo lo que le han enviado a su unidad/especialidad.
- [ ] **Sello Visual de Firma:** Componente React para mostrar el estado "FIRMADO" con hash en el historial.
- [ ] **Contexto en Header:** Mostrar el Número de Expediente en el `TopBar` durante la consulta.
- [ ] **Semáforo de Signos Vitales:** Alertas visuales para rangos fuera de la normalidad.

---
> "La seguridad del paciente es el corazón de MedIA. El cumplimiento forense es nuestra armadura." 🛡️🩺
