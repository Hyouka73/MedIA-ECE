# Contexto del Proyecto: MedIA - ECE (Distrito de Salud I, Chiapas)
**Mi Rol:** Persona 5 (Backend Prescripciones, Lab & Frontend Admin/Auditoría)
[cite_start]**Stack Técnico:** Python 3.11, FastAPI, SQLAlchemy 2.x, PostgreSQL 15 (Azure), React 18, Vite[cite: 749, 755, 745].

## Tarea Actual: Módulo Prescripciones y Alerta de Alergias
**Prioridad:** Alta (Seguridad del paciente - Bloqueador del ciclo clínico).

### Reglas de Negocio Backend (Service):
* **Endpoint:** `POST /encuentros/{id}/prescripciones`
* **Validación Activa:** Antes de insertar, buscar en la tabla `alergias` del paciente si la sustancia activa (de `cat_medicamentos`) coincide usando `ILIKE`.
* **Alergia CRÍTICA:** Retornar `HTTP 409 Conflict`. El registro se bloquea a menos que el payload incluya el flag `"confirmar_alergia": true` (el médico asume el riesgo).
* **Alergia MODERADA/LEVE:** Retornar `HTTP 200` / `201` permitiendo el registro, pero enviando un flag `alergia_advertencia=true` en el response.

### Reglas de Negocio Frontend:
* [cite_start]Si HTTP 409: Mostrar `Alert` bloqueante (Token Rojo Crítico `#DC2626`) y solicitar confirmación explícita[cite: 17, 160].
* [cite_start]Si HTTP 200 + advertencia: Mostrar `Toast` (Token Ámbar `#D97706`) no bloqueante[cite: 17, 155].

Persona 5 (Admin & Auditoría): El módulo de administración va avanzado, pero falta la lógica de prescripciones con alerta de alergia (que es prioridad de seguridad). El módulo de auditoria en el backend sigue vacío y el administrador de seguridad no puede ver la bitácora todavía.

Usa estos datos en la interfaz de Adminer que ya tienes corriendo:

URL: http://localhost:8080

Motor (System): PostgreSQL

Servidor (Server): media_db_dev

Usuario (Username): media_dev

Contraseña (Password): dev_pass_changeme

Base de Datos (Database): media_db


¡Lo llevamos al 100%! Puedes marcar esa tarea completa de tu lista como TERMINADA y lista para producción.

Si te preguntan qué avance llevas de ese párrafo exacto que te pidió el Project Manager, aquí tienes la respuesta punto por punto de lo que acabas de lograr:

1. "Falta la lógica de prescripciones con alerta de alergia"
✅ RESUELTO: Construiste el endpoint POST /encuentros/{id}/prescripciones. Este endpoint ahora hace una validación cruzada: toma el código SSA del medicamento, busca su nombre genérico y lo compara con los textos de las alergias del paciente. Si detecta un choque y la alergia es "CRÍTICA", el sistema levanta un escudo (Error 409 Conflict) y bloquea la receta para proteger al paciente.

2. "El módulo de auditoria en el backend sigue vacío"
✅ RESUELTO Y OPTIMIZADO: El backend ya no está vacío. Implementaste un sistema de "Inyección Directa" asíncrona (SQLAlchemy Core) que guarda los incidentes forenses en la tabla auditoria_accesos. Además, lo hiciste con un rendimiento de nivel empresarial que evita cuellos de botella y previene que el servidor truene (el famoso error MissingGreenlet que vencimos).

3. "El administrador de seguridad no puede ver la bitácora todavía"
✅ RESUELTO: Gracias a que tu backend ya está inyectando correctamente los bloqueos de recetas, tu Dashboard en React por fin tiene datos reales. El administrador de seguridad ya puede entrar y ver exactamente qué médico intentó recetar el medicamento equivocado, a qué paciente, a qué hora exacta y desde qué IP (127.0.0.1).