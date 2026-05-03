# Troubleshooting — Errores Comunes en MedSys-ECE

## ❌ Error: Foreign Key Constraint Violation

### Síntoma
```
ERROR: insert or update on table "personas" violates foreign key constraint "personas_id_localidad_fkey"
DETAIL: Key (id_localidad)=(070010001) is not present in table "cat_localidades".
```

### Causa
El `id_localidad` usado no existe en el catálogo. La BD valida que todas las localidades referencias deben existir.

### Solución

**Opción 1: Usar NULL (más seguro)**
```bash
curl -X POST "http://localhost:8000/api/personas" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "primer_apellido": "López",
    "fecha_nacimiento": "1985-05-12",
    "sexo": "M",
    "id_localidad": null
  }'
```

**Opción 2: Consultar localidades válidas primero**
```bash
# Consultar qué localidades existen
psql -U postgres -d MedSys_db_dev -c \
  "SELECT id_localidad, nombre FROM cat_localidades LIMIT 10;"
```

**Localidades válidas precargadas:**
- `071010001` = Tuxtla Gutiérrez (capital)
- `071010034` = Copoya
- `071010052` = El Jobo

---

## ⚠️ Advertencia: Validaciones de Dominio

Estas constraints se aplican a nivel de BD para garantizar integridad:

| Campo | Constraint | Ejemplo Válido |
|-------|-----------|---|
| `id_localidad` | Debe existir en `cat_localidades` | `071010001` o `null` |
| `id_lengua_materna` | Debe existir en `cat_lenguas_indigenas` | `1-50` o `null` |
| `sexo` | Solo `M`, `F`, `X` | `M` |
| `curp` | Único en tabla | No repetir mismo CURP |
| `id_persona` en `pacientes` | Único + FK válida | UUID válido |

---

## 🔍 Diagnóstico: Inspeccionar la BD

### Ver localidades disponibles
```bash
docker exec MedSys_db_dev psql -U postgres -d MedSys_db_dev \
  -c "SELECT id_localidad, nombre, id_municipio FROM cat_localidades LIMIT 20;"
```

### Ver lenguas indígenas
```bash
docker exec MedSys_db_dev psql -U postgres -d MedSys_db_dev \
  -c "SELECT id_lengua, nombre FROM cat_lenguas_indigenas;"
```

### Ver especialidades
```bash
docker exec MedSys_db_dev psql -U postgres -d MedSys_db_dev \
  -c "SELECT id_especialidad, nombre FROM cat_especialidades_medicas;"
```

---

## ✅ Mejor Práctica: Crear Persona sin Localidad

Para evitar errores de integridad referencial, **dejar campos opcionales como NULL**:

```json
{
  "nombre": "Rosa",
  "primer_apellido": "García",
  "segundo_apellido": "Hernández",
  "curp": "GAHR860723MDFGRR09",
  "fecha_nacimiento": "1986-07-23",
  "sexo": "F",
  "telefono": "55 1234-5678",
  "id_localidad": null,
  "id_lengua_materna": null,
  "calle_numero": null,
  "referencia_geografica": null
}
```

---

## 🚀 Workaround Rápido

Si necesitas probar rápidamente sin lookups:

```bash
# 1. Crear persona sin localidad
curl -X POST "http://localhost:8000/api/personas" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","primer_apellido":"User","fecha_nacimiento":"1990-01-01","sexo":"M"}'

# 2. Crear paciente con esa persona
curl -X POST "http://localhost:8000/api/pacientes" \
  -H "Content-Type: application/json" \
  -d '{"persona":{"nombre":"Test2","primer_apellido":"User2","fecha_nacimiento":"1991-01-01","sexo":"F"},"grupo_sanguineo":"O+"}'

# 3. Listar personas creadas
curl "http://localhost:8000/api/personas?page=1&limit=5"
```

---

## 📝 Notas Importantes

✅ **Todos los campos con `ON DELETE RESTRICT` no pueden ser NULL**  
✅ **id_localidad, id_lengua_materna, etc. SÍ pueden ser NULL**  
✅ **El middleware audita TODOS los errores de integridad**  
✅ **Soft delete preserva datos (no elimina realmente)**  

---

**Última actualización:** Abril 20, 2026
