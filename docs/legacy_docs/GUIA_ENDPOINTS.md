# Guía de Uso — API de Pacientes y Expediente Clínico

**Servidor Backend:** `http://localhost:8000/api`

---

## 1. Personas

### Crear una persona (paso previo a paciente)

```bash
curl -X POST "http://localhost:8000/api/personas" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Rosa",
    "primer_apellido": "García",
    "segundo_apellido": "Hernández",
    "curp": "GAHR860723MDFGRR09",
    "fecha_nacimiento": "1986-07-23",
    "sexo": "F",
    "telefono": "55 1234-5678",
    "id_lengua_materna": null,
    "id_localidad": "071010001"
  }'
```

**Respuesta (201 Created):**
```json
{
  "data": {
    "id_persona": "550e8400-e29b-41d4-a716-446655440000",
    "nombre": "Rosa",
    "primer_apellido": "García",
    "segundo_apellido": "Hernández",
    "curp": "GAHR860723MDFGRR09",
    "fecha_nacimiento": "1986-07-23",
    "sexo": "F",
    "telefono": "55 1234-5678",
    "alerta_barrera_linguistica": false
  },
  "message": "Persona creada exitosamente"
}
```

### Listar personas

```bash
curl -X GET "http://localhost:8000/api/personas?page=1&limit=10&search=García" \
  -H "Authorization: Bearer {token}"
```

---

## 2. Pacientes

### Crear paciente + persona (en una transacción)

```bash
curl -X POST "http://localhost:8000/api/pacientes" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "persona": {
      "nombre": "Juan",
      "primer_apellido": "López",
      "segundo_apellido": "Morales",
      "curp": "LOMJ850512HDFNRN03",
      "fecha_nacimiento": "1985-05-12",
      "sexo": "M",
      "telefono": "916-555-0123",
      "id_localidad": "071010001"
    },
    "grupo_sanguineo": "O+"
  }'
```

**Respuesta (201 Created):**
```json
{
  "data": {
    "id_paciente": "660e8400-e29b-41d4-a716-446655440001",
    "numero_expediente": "EXP-2026-000001",
    "id_persona": "770e8400-e29b-41d4-a716-446655440002",
    "grupo_sanguineo": "O+",
    "fecha_registro": "2026-04-20T10:30:45.123456Z",
    "persona": {
      "id_persona": "770e8400-e29b-41d4-a716-446655440002",
      "nombre": "Juan",
      "primer_apellido": "López",
      "segundo_apellido": "Morales"
    }
  },
  "message": "Paciente y persona creados exitosamente"
}
```

### Listar pacientes

```bash
curl -X GET "http://localhost:8000/api/pacientes?page=1&limit=10&search=López" \
  -H "Authorization: Bearer {token}"
```

**Respuesta:**
```json
{
  "data": {
    "items": [
      {
        "id_paciente": "660e8400-e29b-41d4-a716-446655440001",
        "numero_expediente": "EXP-2026-000001",
        "nombre": "Juan",
        "primer_apellido": "López",
        "grupo_sanguineo": "O+",
        "edad": 41,
        "telefono": "916-555-0123"
      }
    ],
    "pages": 1,
    "total": 1,
    "page": 1,
    "limit": 10
  },
  "message": "Lista de pacientes obtenida exitosamente"
}
```

### Obtener detalle del paciente

```bash
curl -X GET "http://localhost:8000/api/pacientes/660e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer {token}"
```

### Actualizar datos clínicos del paciente

```bash
curl -X PUT "http://localhost:8000/api/pacientes/660e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"grupo_sanguineo": "AB-"}'
```

### Eliminar paciente (soft delete)

```bash
curl -X DELETE "http://localhost:8000/api/pacientes/660e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer {token}"
```

---

## 3. Expediente Clínico

### Obtener expediente completo (con antecedentes)

**Requiere:** Encuentro activo con el paciente (Regla 1)

```bash
curl -X GET "http://localhost:8000/api/expediente/660e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer {token}"
```

**Respuesta (200 OK):**
```json
{
  "data": {
    "id_paciente": "660e8400-e29b-41d4-a716-446655440001",
    "numero_expediente": "EXP-2026-000001",
    "grupo_sanguineo": "O+",
    "edad": 41,
    "persona": {
      "id_persona": "770e8400-e29b-41d4-a716-446655440002",
      "nombre": "Juan López Morales",
      "curp": "LOMJ850512HDFNRN03",
      "alerta_barrera_linguistica": false
    },
    "antecedentes": {
      "heredofamiliares": {
        "diabetes": true,
        "hipertension": false,
        "cardiopatia": false,
        "neoplasia": false,
        "detalles": "Padre con diabetes tipo 2"
      },
      "patologicos": [
        {
          "id_ap": "880e8400-e29b-41d4-a716-446655440003",
          "enfermedad": "Diabetes Mellitus Tipo 2",
          "fecha_diagnostico": "2015-03-15",
          "tratamiento_actual": "Metformina 500mg c/12h"
        }
      ],
      "no_patologicos": {
        "tabaquismo": false,
        "alcoholismo": false,
        "drogas": false,
        "detalles": null
      }
    },
    "alergias": [
      {
        "id_alergia": "990e8400-e29b-41d4-a716-446655440004",
        "alergia": "Penicilina",
        "severidad": "CRITICA",
        "fecha_registro": "2026-01-10T08:00:00Z"
      }
    ],
    "inmunizaciones": [
      {
        "id_inmunizacion": "aa0e8400-e29b-41d4-a716-446655440005",
        "vacuna": "COVID-19 (Pfizer)",
        "fecha_aplicacion": "2026-02-15",
        "dosis": "3/3"
      }
    ]
  },
  "message": "Expediente clínico obtenido exitosamente"
}
```

### Agregar alergia al paciente

```bash
curl -X POST "http://localhost:8000/api/expediente/660e8400-e29b-41d4-a716-446655440001/alergias" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "alergia": "Ibuprofeno",
    "severidad": "MODERADA"
  }'
```

**Respuesta (201 Created):**
```json
{
  "data": {
    "alergia": "Ibuprofeno",
    "severidad": "MODERADA"
  },
  "message": "Alergia registrada exitosamente"
}
```

### Agregar antecedente patológico

```bash
curl -X POST "http://localhost:8000/api/expediente/660e8400-e29b-41d4-a716-446655440001/antecedentes/patologicos" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "enfermedad": "Hipertensión Arterial",
    "fecha_diagnostico": "2020-06-10",
    "tratamiento_actual": "Lisinopril 10mg c/24h"
  }'
```

### Agregar inmunización

```bash
curl -X POST "http://localhost:8000/api/expediente/660e8400-e29b-41d4-a716-446655440001/inmunizaciones" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "vacuna": "Influenza 2026",
    "fecha_aplicacion": "2026-04-20",
    "dosis": "1/1"
  }'
```

---

## 4. Encuentros Clínicos

### Crear encuentro

```bash
curl -X POST "http://localhost:8000/api/encuentros" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "id_paciente": "660e8400-e29b-41d4-a716-446655440001",
    "id_establecimiento": "bb0e8400-e29b-41d4-a716-446655440006",
    "id_especialidad": 1,
    "motivo_consulta": "Control de diabetes"
  }'
```

**Respuesta (201 Created):**
```json
{
  "data": {
    "id_encuentro": "cc0e8400-e29b-41d4-a716-446655440007",
    "motivo_consulta": "Control de diabetes",
    "fecha_inicio": "2026-04-20T14:30:00.000000Z"
  },
  "message": "Encuentro clínico creado exitosamente"
}
```

### Listar encuentros del usuario

```bash
curl -X GET "http://localhost:8000/api/encuentros" \
  -H "Authorization: Bearer {token}"
```

### Listar encuentros de un paciente

**Requiere:** Estar en encuentro activo con el paciente (Regla 1)

```bash
curl -X GET "http://localhost:8000/api/encuentros?id_paciente=660e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer {token}"
```

### Registrar signos vitales

```bash
curl -X POST "http://localhost:8000/api/encuentros/cc0e8400-e29b-41d4-a716-446655440007/signos-vitales" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "peso_kg": 78.5,
    "talla_cm": 175,
    "temperatura_c": 37.0,
    "frecuencia_cardiaca": 72,
    "frecuencia_respiratoria": 16,
    "presion_sistolica": 130,
    "presion_diastolica": 85,
    "saturacion_oxigeno": 98
  }'
```

### Cerrar encuentro (irreversible)

```bash
curl -X PATCH "http://localhost:8000/api/encuentros/cc0e8400-e29b-41d4-a716-446655440007/cerrar" \
  -H "Authorization: Bearer {token}"
```

---

## 5. Códigos de Error

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| 200 | OK | GET exitoso |
| 201 | Creado | POST/PUT exitoso |
| 400 | Solicitud inválida | CURP duplicado, campos faltantes |
| 403 | Acceso denegado | Sin encuentro activo (Regla 1) |
| 404 | No encontrado | Paciente/persona inexistente |
| 422 | Datos inválidos | Email malformado, severidad inválida |
| 500 | Error interno | Error en la BD |

---

## 6. Cumplimiento de Reglas de Negocio

### Regla 1: Datos Universales
✅ `GET /expediente/{id}` valida que tengas encuentro activo

Respuesta si NO cumples:
```json
{
  "detail": "No tienes acceso al expediente clínico de este paciente. Requiere un encuentro activo."
}
```

### Regla 4: Auditoría
✅ TODOS los accesos se registran en `auditoria_accesos`
- IP origen
- Usuario ID
- Módulo/función
- Tipo de evento (READ, CREATE, UPDATE, DELETE)
- Resultado (EXITOSO, DENEGADO, ERROR)
- Timestamp UTC

---

## 📝 Notas Prácticas

1. **Token JWT:** El header `Authorization: Bearer {token}` es obligatorio en todos los endpoints
2. **UUIDs:** Todos los IDs son UUID versión 4 (36 caracteres)
3. **Timestamps:** Siempre en ISO 8601 con timezone UTC
4. **Búsqueda:** Case-insensitive, soporta búsqueda parcial
5. **Paginación:** Page 1 = primeros 10 items, incrementar `page` para siguiente
6. **Localidades:** Usar IDs válidos del catálogo INEGI. Ejemplos válidos:
   - `071010001` = Tuxtla Gutiérrez (capital)
   - `071010034` = Copoya
   - `071010052` = El Jobo
   - O dejar `null` si no se conoce la localidad

---

## 🔧 Troubleshooting

### Mensaje: "Persona no encontrada" al crear paciente
→ Primero crear la persona con `POST /personas`, luego crear paciente

### Mensaje: "Acceso denegado al expediente clínico"
→ Necesitas tener un encuentro activo con el paciente
→ Crear encuentro primero con `POST /encuentros`

### Mensaje: "CURP ya registrado"
→ El CURP ya existe, usar otro o actualizar persona existente

---

**Última actualización:** Abril 20, 2026
