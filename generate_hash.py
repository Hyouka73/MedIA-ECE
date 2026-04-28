# # generate_hash.py
# from argon2 import PasswordHasher
# ph = PasswordHasher()
# print(ph.hash("MedIA2026!"))
# # temporal solo paara añadir un usuario enfermero a la DB, luego se eliminará este script.

# # -- 1. Creamos la Persona
# # INSERT INTO personas (id_persona, nombre, primer_apellido, segundo_apellido, curp, fecha_nacimiento, sexo)
# # VALUES (
# #     gen_random_uuid(), 
# #     'Elena', 
# #     'Ramírez', 
# #     'Santos', 
# #     'RASE900101MCHXNN01', 
# #     '1990-01-01', 
# #     'F'
# # ) RETURNING id_persona;

# # -- 2. Creamos el Usuario vinculado
# # -- RECUERDA: Copia el UUID que te devuelva la consulta anterior y ponlo en 'ID_PERSONA_GENERADA'
# # INSERT INTO usuarios_sistema (
# #     id_usuario, 
# #     id_persona, 
# #     email, 
# #     password_hash, 
# #     id_rol, 
# #     activo, 
# #     requires_2fa
# # )
# # VALUES (
# #     gen_random_uuid(), 
# #     'ID_PERSONA_GENERADA', 
# #     'algo@media.com',
# #     'AQUI VA EL HASH', -- Hash de "MedIA2026!"
# #     4, -- ID 4 es ENFERMERIA según tu tabla
# #     true,
# #     false
# # );

# #especialista@media.com
# #enfermeria@media.com

# ## Contexto del problema para tu compañero:

# ### Lo que se ha hecho hasta ahora:

# 1. **Componente `NuevaConsultaPage.jsx`**: Flujo de 4 pasos para crear una consulta médica (motivo → diagnóstico CIE-10 → exploración física → plan terapéutico).

# 2. **Fix del paso 3→4 (pantalla en blanco)**: El paso 4 se renderiza solo con `currentStep === 4`, ya no depende de `encuentroId`. La validación del ID se hace en `manejarPaso4`.

# 3. **Fix de signos vitales**: Solo se envían si los 5 campos obligatorios están dentro de los rangos del schema (presión 60-250/40-150, temp 34-42°C, SpO₂ 70-100%, FC 30-220). Si no, se omite el registro.

# 4. **Fix de `extraerMensajeError`**: Ahora maneja arrays de errores de Pydantic (422 de FastAPI) convirtiéndolos a string legible.

# 5. **Fix de `clinicoAPI.js`**: La URL de `crearNota` se corrigió a `/encuentros/encuentros/{id}/notas` (doble "encuentros") porque en `main.py` el router de notas tiene prefijo `/api/encuentros` y la ruta interna es `/encuentros/{id}/notas`.

# 6. **Fix del router de notas (`notas_soap/router.py`)**: Se cambió `current_user.id` por `UUID(current_user["sub"])` en las 4 funciones (crear_nota, actualizar_nota, firmar_nota, crear_enmienda) porque `get_current_user` devuelve un dict, no un objeto.

# 7. **Fix del modelo `EncuentroClinico`**: Se comentó la columna `tipo_consulta` porque no existe en la base de datos.

# ### Problema actual (403 Forbidden al cerrar encuentro):

# **Síntoma**: `PATCH /api/encuentros/{id}/cerrar` devuelve 403 Forbidden.

# **Causa**: En `encuentros/router.py`, la función `cerrar_encuentro` compara `encuentro[0]` (id_medico guardado en BD) con `current_user["sub"]` (usuario logueado). No coinciden.

# **Posibles razones**:
# - El token de autenticación cambió durante la sesión
# - El `current_user["sub"]` no es el mismo UUID que se guardó al crear el encuentro
# - Hay algún problema con la renovación del token en el frontend

# ### Lo que hay que hacer:

# 1. **Para desbloquear las pruebas AHORA**: Comentar la validación de autoría en `app/modules/encuentros/router.py` línea ~209:
# ```python
# # if encuentro[0] != current_user["sub"]:
# #     raise HTTPException(status_code=403, detail="No autorizado")
# ```

# 2. **Para investigar la causa raíz**: Agregar prints de debug:
# ```python
# print(f"id_medico en BD: {encuentro[0]}")
# print(f"current_user['sub']: {current_user['sub']}")
# ```
# Y verificar por qué no coinciden los UUIDs.

# ### Archivos modificados:
# - `src/api/clinico.js` - URL de crearNota
# - `src/pages/NuevaConsultaPage.jsx` - Flujo completo
# - `app/modules/notas_soap/router.py` - current_user["sub"]
# - `app/models/encuentros.py` - tipo_consulta comentado
# - `app/modules/encuentros/router.py` - Por modificar (comentar validación 403)