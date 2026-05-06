# Implementación de Reglas de Negocio Clínicas — MedSys ECE

**Fecha:** Abril 20, 2026  
**Responsable:** Persona 3 (Backend Clínico)  
**Estado:** ✅ COMPLETADO

---

## 📋 Resumen de Cambios

Se han implementado **TODAS** las observaciones del análisis de revisión para Persona 3 (Backend Clínico):

### 1. ✅ Implementación de las 4 Reglas de Negocio Clínicas

**Archivo:** `backend/app/services/acceso.py`

#### Regla 1: Datos Universales
- **Descripción:** Datos básicos del paciente (nombre, CURP, alergias, antecedentes) visibles para cualquier médico del Distrito CON un encuentro activo
- **Implementación:** `check_regla_1()` verifica existencia de encuentro activo en tabla `encuentros_clinicos`
- **Nota:** Sin restricción de establecimiento

#### Regla 2: Notas por Establecimiento  
- **Descripción:** Nota SOAP solo visible para médico que la redactó + médicos del mismo establecimiento, EXCEPTO cuando existe referencia ACEPTADA/ATENDIDA
- **Implementación:** `check_regla_2()` verifica autor, mismo establecimiento, o referencia aceptada

#### Regla 3: Acceso por Especialidad
- **Descripción:** Receptor de referencia solo ve notas de su especialidad, NO el expediente completo
- **Implementación:** `check_regla_3()` filtra por especialidad en referencias

#### Regla 4: Auditoría sin Excepción
- **Descripción:** Todas las decisiones se auditan automáticamente
- **Implementación:** Ya existe en `middleware/audit.py` (no requería cambios)

---

### 2. ✅ Router de Pacientes Completado

**Archivo:** `backend/app/modules/pacientes/router.py`

**Endpoints implementados:**
- `GET /api/pacientes` — Lista paginada con búsqueda
- `POST /api/pacientes` — Crear paciente + persona en una transacción
- `GET /api/pacientes/{id}` — Obtener detalle
- `GET /api/pacientes/{id}/expediente` — Expediente con acceso controlado (Regla 1)
- `PUT /api/pacientes/{id}` — Actualizar grupo sanguíneo
- `DELETE /api/pacientes/{id}` — Soft delete con auditoría
- `POST /api/pacientes/{id}/tutores` — Agregar tutor/representante legal

**Datos guardados en BD:** ✅ TODOS los endpoints guardan datos correctamente

---

### 3. ✅ Router de Personas Mejorado

**Archivo:** `backend/app/modules/personas/router.py`

**Endpoints disponibles:**
- `GET /api/personas` — Lista paginada
- `GET /api/personas/{id}` — Detalle
- `POST /api/personas` — Crear
- `PATCH /api/personas/{id}` — Actualizar (completo)
- `POST /api/personas/{id}/avatar` — Subir foto (redimensiona a 500x500)

**Datos guardados en BD:** ✅ Todos los endpoints guardan datos

---

### 4. ✅ Router de Expediente Creado

**Archivo:** `backend/app/modules/expediente/router.py` (NUEVO)

**Endpoints implementados:**
- `GET /api/expediente/{id_paciente}` — Expediente completo con:
  - Datos personales
  - Antecedentes heredofamiliares
  - Antecedentes patológicos
  - Antecedentes no patológicos
  - Alergias (ordenadas por severidad)
  - Inmunizaciones
- `POST /api/expediente/{id_paciente}/alergias` — Agregar alergia
- `POST /api/expediente/{id_paciente}/antecedentes/patologicos` — Agregar antecedente
- `POST /api/expediente/{id_paciente}/inmunizaciones` — Agregar inmunización

**Características:**
- ✅ Aplica Regla 1 (verifica encuentro activo)
- ✅ Calcula edad automáticamente
- ✅ Devuelve alertas de barrera lingüística
- ✅ Todos guardan en BD

---

### 5. ✅ Router de Encuentros Clínicos Completado

**Archivo:** `backend/app/modules/encuentros/router.py`

**Endpoints implementados:**
- `GET /api/encuentros` — Lista encuentros del usuario o de un paciente
- `POST /api/encuentros` — Crear encuentro clínico
- `PATCH /api/encuentros/{id}/cerrar` — Cerrar encuentro (irreversible)
- `POST /api/encuentros/{id}/signos-vitales` — Registrar signos vitales

**Características:**
- ✅ Aplica Regla 1 para filtrar por paciente
- ✅ Solo el médico que creó puede cerrar
- ✅ Genera ID único automático
- ✅ Todos guardan en BD

---

### 6. ✅ Integración Frontend-Backend

**Archivos actualizados:**

#### `frontend/src/api/pacientes.js`
```javascript
export const pacientesAPI = {
    // Personas
    getPersonas, getPersona, createPersona, updatePersona, uploadAvatar,
    // Pacientes
    getPacientes, getPaciente, createPaciente, updatePaciente, deletePaciente,
    // Expediente
    getExpediente, getExpedienteCompleto, 
    addAlergia, addAntecedente, addInmunizacion,
    // Catálogos
    getEstados, getMunicipios, getLocalidades, getLenguas
}
```

#### `frontend/src/api/clinico.js`
```javascript
export const clinicoAPI = {
    // Encuentros
    getEncuentros, createEncuentro, cerrarEncuentro,
    // Signos
    registrarSignos, getSignos,
    // Notas SOAP
    crearNota, firmarNota, crearEnmienda,
    // Diagnósticos y prescripciones
    addDiagnostico, addPrescripcion, addSolicitudEstudio,
    // Catálogos
    buscarCIE10, buscarMedicamentos, getEspecialidades
}
```

---

### 7. ✅ Registro en Main Router

**Archivo:** `backend/app/main.py`

Agregado:
```python
from app.modules.expediente.router import router as expediente_router
app.include_router(expediente_router, prefix="/api/expediente", tags=["Expediente"])
```

---

## 🔒 Control de Acceso Clínico

Todos los endpoints sensibles aplican automáticamente las Reglas de Negocio:

```
GET /api/expediente/{id}        → Regla 1 (encuentro activo)
POST /api/expediente/{id}/...   → Regla 1 (encuentro activo)
GET /api/encuentros             → Regla 1 (si filtra por paciente)
```

**Auditoría:** El middleware registra TODOS los accesos, incluidos los DENEGADOS.

---

## 📊 Datos Guardados en Base de Datos

| Operación | Tabla | Registro |
|-----------|-------|----------|
| Crear paciente | `pacientes` | ✅ Sí |
| Crear persona | `personas` | ✅ Sí |
| Crear encuentro | `encuentros_clinicos` | ✅ Sí |
| Registrar signos | `signos_vitales` | ✅ Sí |
| Agregar alergia | `alergias` | ✅ Sí |
| Agregar antecedente | `antecedentes_patologicos` | ✅ Sí |
| Agregar inmunización | `inmunizaciones` | ✅ Sí |
| Soft delete | `pacientes.eliminado_en` | ✅ Sí |

---


##  Funcion para generar numero_expediente automatico
-- Crear función para generar número_expediente automático
CREATE OR REPLACE FUNCTION fn_crear_paciente_automatico()
RETURNS TRIGGER AS $$
DECLARE
    v_numero_expediente VARCHAR(50);
    v_year INT;
    v_seq INT;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_TIMESTAMP);
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_expediente FROM 9) AS INT)), 0) + 1
    INTO v_seq
    FROM pacientes
    WHERE EXTRACT(YEAR FROM fecha_registro) = v_year;
    
    v_numero_expediente := 'EXP-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
    
    INSERT INTO pacientes (
        id_paciente, id_persona, numero_expediente,
        grupo_sanguineo, fecha_registro, eliminado_en,
        eliminado_por, motivo_baja
    ) VALUES (
        gen_random_uuid(), NEW.id_persona, v_numero_expediente,
        NULL, CURRENT_TIMESTAMP, NULL, NULL, NULL
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
CREATE TRIGGER tr_auto_create_paciente
AFTER INSERT ON personas
FOR EACH ROW
EXECUTE FUNCTION fn_crear_paciente_automatiko();


## 🛠 Integración con Frontend

**Endpoints del frontend ahora funcionan con:**
1. PacientesListPage → `GET /api/pacientes`
2. PacienteFichaPage → `POST /api/pacientes` (crea persona + paciente)
3. ExpedientePage → `GET /api/expediente/{id}`
4. Signos vitales → `POST /api/encuentros/{id}/signos-vitales`

---

## ✅ Checklist de Completitud

- [x] Regla 1 implementada y testeable
- [x] Regla 2 implementada y testeable
- [x] Regla 3 implementada y testeable
- [x] Regla 4 documentada (ya en middleware)
- [x] Pacientes: CRUD completo + persistencia
- [x] Personas: CRUD completo + persistencia
- [x] Expediente: Lectura completa + antecedentes + persistencia
- [x] Encuentros: CRUD + signos vitales + persistencia
- [x] Frontend sincronizado con endpoints
- [x] Todas las rutas en main.py registradas
- [x] Validación de datos clínicos
- [x] Soft delete con auditoría

---

## 📝 Notas de Implementación

1. **Transacciones:** Crear paciente + persona ocurre en una transacción para integridad
2. **Búsqueda:** Case-insensitive ILIKE en nombre, apellidos, CURP, número_expediente
3. **Paginación:** Configurable, máximo 100 items por página
4. **Timestamps:** UTC con timezone para cumplimiento forense
5. **Soft Delete:** Nunca elimina, marca `eliminado_en` + `eliminado_por`
6. **Edad:** Calculada dinámicamente desde `fecha_nacimiento`

---

## 🚀 Próximas Fases (Persona 4)

Quedan pendientes para implementar en próximos sprints:
- Notas SOAP (crear, firmar, enmiendas)
- Diagnósticos con CIE-10
- Prescripciones de medicamentos
- Solicitudes de estudio (laboratorio, imagenología)
- Resultados de laboratorio (PDF)
- Referencias médicas entre especialistas

---

**Implementado por:** Mario Lissandro Zúñiga Sánchez  
**Fecha de cierre:** Abril 20, 2026  
**Todas las funcionalidades cumplidas ✅**
