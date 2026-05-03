# 🛡️ Seguridad Clínica y Auditoría (Persona 5)

## 📋 Resumen del Cambio
Se ha aplicado la migración `7d8e9f0a1b2c` para fortalecer el sistema de auditoría y la gestión de seguridad clínica (alergias).

## 🚀 Cambios Realizados

### 1. Expansión de Bitácora de Auditoría (`auditoria_accesos`)
*   **Columnas Afectadas:** `modulo_funcion`, `tipo_evento` (de 50/100 a **255 chars**) y `resultado` (de 20 a **100 chars**).
*   **Razón:** Para cumplir con la **NOM-024** y estándares de **Cómputo Forense**, los registros deben ser claros y descriptivos. Los límites anteriores provocaban errores de *"value too long"* al intentar registrar alertas críticas de seguridad (ej. bloqueos por alergias).
*   **Impacto Técnico:** Se manejó la dependencia de la vista `v_auditoria_estadistica` durante la alteración para evitar errores de PostgreSQL.

### 2. Borrado Lógico en Alergias (`alergias`)
*   **Nuevas Columnas:** `eliminado_en`, `eliminado_por`, `motivo_baja`.
*   **Razón:** En un Expediente Clínico Electrónico, **nada se borra permanentemente**. Por seguridad clínica, si una alergia fue un error o cambió, se debe conservar el historial de quién la quitó y por qué (trazabilidad total).

## ⚠️ Nota para el Equipo
Si al hacer un `git pull` ves errores de "Multiple Heads" en Alembic, asegúrate de correr:
```bash
alembic upgrade head
```
Esta migración es **crítica** para que el flujo de `Nueva Consulta` no truene al validar alergias en tiempo real.

---
*Documentación generada por el Módulo de Seguridad Clínica (Persona 5)*
