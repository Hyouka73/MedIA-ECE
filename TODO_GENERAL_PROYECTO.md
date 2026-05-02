# 🚀 TODO List: Finalización MedIA-ECE
Este documento centraliza los pendientes críticos para alcanzar el cumplimiento total de las normas **NOM-024**, **NOM-004** y **NOM-151**, asegurando un sistema forense y clínicamente seguro.

---

## 🛠️ I. Infraestructura y Nube (Prioridad: Crítica)
*El sistema debe dejar de ser una "isla local" para operar en la arquitectura escalable de Azure.*

- [ ] **Migración a Azure Blob Storage:** Mover el almacenamiento de PDFs de Laboratorio de `/static/` a contenedores de Azure.
- [ ] **Seguridad de Archivos (SAS Tokens):** Implementar la generación de tokens temporales (15 min) para la visualización de documentos externos.
- [ ] **Configuración de Producción:** Preparar el `Dockerfile` y variables de entorno para el deploy en Azure App Service.

## 📄 II. Documentación Clínica (Fábrica de PDFs)
*Garantizar que el paciente pueda llevar sus documentos impresos con validez legal.*

- [ ] **PDF de Solicitud de Estudios:** Generar el formato para laboratorio y gabinete (incluyendo flag de "Urgente" y diagnóstico relacionado).
- [ ] **PDF de Referencia Médica:** Generar el documento oficial para traslados entre unidades del Distrito de Salud I.
- [ ] **Estándar Visual NOM:** Asegurar que todos los PDFs utilicen la tipografía DM Sans y el azul institucional (#1B4F8A) definido en el manual de identidad.

## 🛡️ III. Lógica de Negocio y Seguridad Forense
*Asegurar que las reglas de privacidad se cumplan a nivel de servidor (Backend).*

- [ ] **Blindaje de Reglas 2 y 3:** Validar que un médico de una unidad distinta NO pueda leer notas SOAP a menos que exista una referencia activa y aceptada.
- [ ] **Registro de Descarga en Auditoría:** Cada vez que alguien genere o descargue un PDF, debe quedar un rastro en `auditoria_accesos`.
- [ ] **Verificación de Integridad:** Implementar la comparación del Hash SHA-256 al momento de abrir un archivo de laboratorio para detectar alteraciones.

## 🎨 IV. Estabilización y UI/UX
*Pulido final de la experiencia de usuario.*

- [ ] **Polling de Alertas:** Asegurar que el indicador de "Incidente Crítico" en el sidebar se actualice automáticamente (cada 60s) para avisar al Auditor.
- [ ] **Consistencia de Badge:** Revisar que todos los módulos (Admin, Audit, Lab) usen los mismos colores semánticos definidos en el manual (Rojo #DC2626 para críticos, etc.).
- [ ] **Pruebas de Flujo de "Punta a Punta":** Validar que una consulta iniciada en recepción termine correctamente en farmacia con su receta descargable.

## 🚀 V. Fase de Lanzamiento (Semana 8)
- [ ] **Deploy a Producción:** Subida final a Azure.
- [ ] **Limpieza de Base de Datos:** Ejecutar seeds finales y eliminar datos de prueba.
- [ ] **Certificación Interna:** Revisión final de cumplimiento normativo antes de la demo.

---
> "La seguridad del paciente es el corazón de MedIA. El cumplimiento forense es nuestra armadura." 🛡️🩺
