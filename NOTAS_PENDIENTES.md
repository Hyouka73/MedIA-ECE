# NOTAS_PENDIENTES.md — MedIA ECE

> Bloqueantes detectados durante revisiones de PRs y coordinación técnica.

## 🔴 Bloqueantes Activos

| # | Detectado en | Descripción | Responsable | Estado |
|---|---|---|---|---|
| 1 | S3 Review | CIE-10 tiene solo 9 códigos de prueba. Para búsqueda diagnóstica real se necesitan los ~14,400 del catálogo DGIS | P2 | Pendiente — funcional para demos |
| 2 | S3 Review | Cuadro Básico de Medicamentos tiene solo 9 registros. P5 necesita catálogo completo para validación de prescripciones | P2 | Pendiente — funcional para demos |
| 3 | S5 Auth | Módulo de Auditoría debe exponer vista de `sesiones_activas` por usuario (IP, user-agent, fecha) — detección de acceso inusual | P3 | Pendiente |
| 4 | S5 Auth | Cifrado Fernet del `totp_secret` en BD — actualmente texto plano en columna `totp_secret` | P3 | Pendiente (producción) |

## 🟡 Mejoras Detectadas

| # | Detectado en | Descripción | Responsable | Estado |
|---|---|---|---|---|
| 1 | S3 Review | `convert_localidades.py` para importar catálogo INEGI completo (~5,000 localidades) | P2 | Post-demo |

## ✅ Resueltos

| # | Resuelto en | Descripción |
|---|---|---|
| 1 | S3 | Hashes Argon2id truncados en semillas — regenerados correctamente |
| 2 | S3 | Bloqueo por intentos fallidos no se aplicaba — backend ahora incrementa `intentos_fallidos` |
| 3 | S3 | Auditoría solo en logger — ahora persiste en `auditoria_accesos` en BD |
| 4 | S3 | TopBar hardcoded — conectado al AuthContext con datos reales y foto de perfil |
| 5 | S3 | OMNIADMIN no aparecía en Dashboard — añadido a todas las vistas condicionales |
| 6 | S3 | JWT refresh silencioso no implementado — ahora programa renovación 60s antes de expirar |
| 7 | S4 | TOTP 2FA Dinámico — Eliminado pin quemado 123456 en favor de generación 100% aleatoria con `pyotp` y ventana 5mins. |
| 8 | S4 | Perfil de Usuario y Avatar — Backend POST /avatar conectado a Azure Blob Storage y UI sincronizada. |
| 9 | S4 | Pipeline de Producción (Azure Web App) — Corregido fallo de `No package found: backend/` ajustando artifacts y Start-up Command (`gunicorn`). |
| 10 | S5 | JWT no persistía al recargar — implementado refresh token via cookie HttpOnly + whitelist `sesiones_activas` en BD. |
| 11 | S5 | Interceptor Axios no inyectaba el Bearer token — `setTokenGetter` conectado al `AuthContext`. |
| 12 | S5 | Rate limiting en endpoints de auth — `slowapi` 5 req/min en `/login` y `/2fa/verify`, 30 req/min en `/refresh`. |
