# 📊 Módulo Signos Vitales — Guía de Implementación

**Módulo completado:** Días 2–3, Sprint S4  
**Estándar:** NOM-004 (Trazabilidad de auditoría)  
**Actor:** Enfermería (rol ENFERMERIA)  

---

## 📋 Resumen

Implementación completa del módulo de Signos Vitales con:
- ✅ Validación de rangos fisiológicos
- ✅ Timestamp del servidor (sin control del cliente)
- ✅ 4 endpoints REST: POST, GET, PATCH, DELETE
- ✅ Integración con stepper del frontend (paso 1)
- ✅ Vista de BD para control de acceso

---

## 🔧 Componentes Implementados

### 1. **Schemas Pydantic** (`backend/app/schemas/encuentros.py`)

```python
# Request — Solo vitales obligatorios
class SignosVitalesCreateIn(BaseModel):
    presion_sistolica: int = Field(..., ge=60, le=250)      # mmHg
    presion_diastolica: int = Field(..., ge=40, le=150)     # mmHg
    temperatura_c: float = Field(..., ge=34.0, le=42.0)     # °C
    saturacion_oxigeno: int = Field(..., ge=70, le=100)     # %
    frecuencia_cardiaca: int = Field(..., ge=30, le=220)    # lpm
    
    # Opcionales
    frecuencia_respiratoria: Optional[int] = None           # rpm
    peso_kg: Optional[float] = None                          # kg
    talla_cm: Optional[float] = None                         # cm

# Response — Incluye timestamp del servidor
class SignosVitalesOut(BaseModel):
    id_signos: uuid.UUID
    id_encuentro: uuid.UUID
    id_enfermero: Optional[uuid.UUID] = None
    presion_sistolica: int
    presion_diastolica: int
    temperatura_c: float
    saturacion_oxigeno: int
    frecuencia_cardiaca: int
    frecuencia_respiratoria: Optional[int] = None
    peso_kg: Optional[float] = None
    talla_cm: Optional[float] = None
    fecha_toma: datetime  # ← Generado por servidor, GARANTIZA trazabilidad NOM-004
```

### 2. **Servicio CRUD** (`backend/app/services/signos_vitales.py`)

```python
class SignosVitalesService:
    @staticmethod
    async def registrar_signos(db, id_encuentro, id_enfermero, data) 
        → SignosVitales
    
    @staticmethod
    async def obtener_signos_encuentro(db, id_encuentro, skip, limit)
        → tuple[List[SignosVitales], int, bool]
    
    @staticmethod
    async def obtener_signos_ultimo(db, id_encuentro)
        → Optional[SignosVitales]
    
    @staticmethod
    async def actualizar_signos(db, id_signos, id_enfermero, data)
        → SignosVitales
    
    @staticmethod
    async def eliminar_signos(db, id_signos, id_enfermero)
        → None
```

### 3. **Endpoints REST** (`backend/app/modules/encuentros/router.py`)

---

## 📡 Endpoints API

### **POST `/encuentros/{id}/signos-vitales`**
Registra signos vitales para un encuentro activo

**Request:**
```bash
POST /encuentros/550e8400-e29b-41d4-a716-446655440000/signos-vitales
Authorization: Bearer <token>
Content-Type: application/json

{
  "presion_sistolica": 120,
  "presion_diastolica": 80,
  "temperatura_c": 36.5,
  "saturacion_oxigeno": 98,
  "frecuencia_cardiaca": 72,
  "frecuencia_respiratoria": 16,
  "peso_kg": 75.5,
  "talla_cm": 175.0
}
```

**Response:** `201 Created`
```json
{
  "id_signos": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "id_encuentro": "550e8400-e29b-41d4-a716-446655440000",
  "id_enfermero": "11111111-2222-3333-4444-555555555555",
  "presion_sistolica": 120,
  "presion_diastolica": 80,
  "temperatura_c": 36.5,
  "saturacion_oxigeno": 98,
  "frecuencia_cardiaca": 72,
  "frecuencia_respiratoria": 16,
  "peso_kg": 75.5,
  "talla_cm": 175.0,
  "fecha_toma": "2024-04-23T14:30:45.123456+00:00"  ← Servidor
}
```

**Validaciones:**
- Presión sistólica: 60–250 mmHg
- Presión diastólica: 40–150 mmHg
- Temperatura: 34–42 °C
- Saturación O₂: 70–100%
- FC: 30–220 lpm
- Encuentro debe estar activo (sin `fecha_cierre`)
- Cliente NO puede enviar `fecha_toma` (siempre se asigna en BD)

---

### **GET `/encuentros/{id}/signos-vitales?skip=0&limit=50`**
Obtiene signos vitales del encuentro (más recientes primero)

**Request:**
```bash
GET /encuentros/550e8400-e29b-41d4-a716-446655440000/signos-vitales
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "signos": [
    {
      "id_signos": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "id_encuentro": "550e8400-e29b-41d4-a716-446655440000",
      "presion_sistolica": 120,
      "presion_diastolica": 80,
      "temperatura_c": 36.5,
      "saturacion_oxigeno": 98,
      "frecuencia_cardiaca": 72,
      "fecha_toma": "2024-04-23T14:30:45.123456+00:00"
    }
  ],
  "total": 1,
  "encuentro_activo": true
}
```

---

### **GET `/encuentros/{id}` (actualizado)**
Detalle de encuentro incluye signos vitales

**Response:** `200 OK`
```json
{
  "id_encuentro": "550e8400-e29b-41d4-a716-446655440000",
  "id_paciente": "...",
  "id_medico": "...",
  "fecha_inicio": "2024-04-23T14:00:00+00:00",
  "fecha_cierre": null,
  "motivo_consulta": "Control rutinario",
  "tipo_consulta": "SUBSECUENTE",
  "signos_vitales": [  ← NUEVO: Lista de SignosVitalesOut
    {
      "id_signos": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "presion_sistolica": 120,
      "presion_diastolica": 80,
      "temperatura_c": 36.5,
      "saturacion_oxigeno": 98,
      "frecuencia_cardiaca": 72,
      "fecha_toma": "2024-04-23T14:30:45.123456+00:00"
    }
  ],
  "notas": [],
  "diagnosticos": []
}
```

---

### **PATCH `/encuentros/{id}/signos-vitales/{signos_id}`**
Actualiza un registro de signos

**Request:**
```bash
PATCH /encuentros/550e8400-e29b-41d4-a716-446655440000/signos-vitales/a1b2c3d4-e5f6-7890-1234-567890abcdef
Authorization: Bearer <token>
Content-Type: application/json

{
  "presion_sistolica": 125,
  "presion_diastolica": 82,
  "temperatura_c": 36.6,
  "saturacion_oxigeno": 97,
  "frecuencia_cardiaca": 74
}
```

**Response:** `200 OK` (objeto actualizado)

**Restricciones:**
- Solo el enfermero que registró puede actualizar
- Timestamp original (`fecha_toma`) NO se modifica

---

### **DELETE `/encuentros/{id}/signos-vitales/{signos_id}`**
Elimina un registro

**Request:**
```bash
DELETE /encuentros/550e8400-e29b-41d4-a716-446655440000/signos-vitales/a1b2c3d4-e5f6-7890-1234-567890abcdef
Authorization: Bearer <token>
```

**Response:** `204 No Content`

**Restricciones:**
- Solo el enfermero que registró puede eliminar

---

## 🎨 Integración Frontend — Stepper Paso 1 (Signos)

### Estado "Completo" del Paso 1

El paso 1 (Signos) se marca completo cuando:

```javascript
// Pseudocódigo
const esCompleto = () => {
  const vitales = ultimosSignosVitales;  // GET /encuentros/{id}
  
  return vitales && 
    // Todos los campos obligatorios tienen valor
    vitales.presion_sistolica !== null &&
    vitales.presion_diastolica !== null &&
    vitales.temperatura_c !== null &&
    vitales.saturacion_oxigeno !== null &&
    vitales.frecuencia_cardiaca !== null &&
    
    // Todos están dentro de rango
    vitales.presion_sistolica >= 60 && vitales.presion_sistolica <= 250 &&
    vitales.presion_diastolica >= 40 && vitales.presion_diastolica <= 150 &&
    vitales.temperatura_c >= 34 && vitales.temperatura_c <= 42 &&
    vitales.saturacion_oxigeno >= 70 && vitales.saturacion_oxigeno <= 100 &&
    vitales.frecuencia_cardiaca >= 30 && vitales.frecuencia_cardiaca <= 220;
};
```

### Flujo de UI Esperado

```
1. Enfermería abre encuentro (GET /encuentros/{id})
2. Ve paso 1 incompleto (signos_vitales está vacío)
3. Completa formulario de vitales (con validación en frontend)
4. Envía: POST /encuentros/{id}/signos-vitales
5. Servidor retorna con fecha_toma del servidor
6. Frontend marca paso 1 como ✅ Completado
7. Desbloquea paso 2 (Notas)
```

---

## 🔐 Autenticación y Autorización

**Rol requerido:** `ENFERMERIA`  
**Superadmin puede:** Registrar, actualizar y eliminar signos

```python
# Endpoints requieren:
@Depends(require_role("ENFERMERIA", "SUPERADMIN"))
```

---

## 🗄️ Base de Datos

### Tabla `signos_vitales` (ya existe)
```sql
CREATE TABLE signos_vitales (
    id_signos UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_encuentro UUID REFERENCES encuentros_clinicos(id_encuentro) ON DELETE CASCADE,
    id_enfermero UUID REFERENCES usuarios_sistema(id_usuario) ON DELETE RESTRICT,
    
    presion_sistolica INT,
    presion_diastolica INT,
    temperatura_c DECIMAL(4,2),
    frecuencia_cardiaca INT,
    frecuencia_respiratoria INT,
    saturacion_oxigeno INT,
    peso_kg DECIMAL(5,2),
    talla_cm DECIMAL(5,2),
    
    fecha_toma TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Vista `v_signos_encuentro` (ya existe)
```sql
-- Control de acceso: Enfermería puede ver signos pero no notas SOAP
SELECT 
    sv.id_signos,
    sv.id_encuentro,
    sv.fecha_toma,
    sv.peso_kg,
    sv.presion_sistolica,
    sv.presion_diastolica,
    ec.fecha_inicio AS fecha_encuentro,
    ec.motivo_consulta
FROM signos_vitales sv
JOIN encuentros_clinicos ec ON sv.id_encuentro = ec.id_encuentro;
```

---

## 🔍 Trazabilidad NOM-004

**Garantía de auditoría:**

1. ✅ `id_enfermero` — Quién registró
2. ✅ `fecha_toma` — Cuándo se registró (timestamp del servidor, inmutable)
3. ✅ `id_encuentro` — A qué encuentro corresponde
4. ✅ Todos los vitales — Qué se registró

**Cliente NO puede enviar `fecha_toma`:**
```python
# ❌ INCORRECTO (será ignorado):
POST /encuentros/{id}/signos-vitales
{
  "temperatura_c": 36.5,
  "fecha_toma": "2024-04-23T10:00:00+00:00"  ← IGNORADO
}

# ✅ CORRECTO:
POST /encuentros/{id}/signos-vitales
{
  "temperatura_c": 36.5
  # fecha_toma se asigna en BD automáticamente
}
```

---

## 📝 Ejemplo Completo — Frontend (React/TypeScript)

```typescript
import { useState } from 'react';

interface SignosVitales {
  id_signos?: string;
  presion_sistolica: number;
  presion_diastolica: number;
  temperatura_c: number;
  saturacion_oxigeno: number;
  frecuencia_cardiaca: number;
  frecuencia_respiratoria?: number;
  peso_kg?: number;
  talla_cm?: number;
}

interface Validacion {
  campo: string;
  min: number;
  max: number;
  unidad: string;
}

const VALIDACIONES: Validacion[] = [
  { campo: 'presion_sistolica', min: 60, max: 250, unidad: 'mmHg' },
  { campo: 'presion_diastolica', min: 40, max: 150, unidad: 'mmHg' },
  { campo: 'temperatura_c', min: 34, max: 42, unidad: '°C' },
  { campo: 'saturacion_oxigeno', min: 70, max: 100, unidad: '%' },
  { campo: 'frecuencia_cardiaca', min: 30, max: 220, unidad: 'lpm' },
];

export function SignosVitalesForm({ id_encuentro }: { id_encuentro: string }) {
  const [vitales, setVitales] = useState<SignosVitales>({
    presion_sistolica: 0,
    presion_diastolica: 0,
    temperatura_c: 0,
    saturacion_oxigeno: 0,
    frecuencia_cardiaca: 0,
  });

  const [errores, setErrores] = useState<Record<string, string>>({});

  // Validar rango de un campo
  const validarRango = (campo: string, valor: number): boolean => {
    const validacion = VALIDACIONES.find(v => v.campo === campo);
    if (!validacion) return true;
    return valor >= validacion.min && valor <= validacion.max;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);

    // Validar rango en tiempo real
    const esValido = validarRango(name, numValue);
    setErrores(prev => ({
      ...prev,
      [name]: esValido ? '' : `Valor fuera de rango`
    }));

    setVitales(prev => ({
      ...prev,
      [name]: numValue
    }));
  };

  const esCompleto = (): boolean => {
    return VALIDACIONES.every(v => {
      const valor = vitales[v.campo as keyof SignosVitales];
      return valor && validarRango(v.campo, valor);
    });
  };

  const handleRegistrar = async () => {
    if (!esCompleto()) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }

    try {
      const response = await fetch(
        `/api/encuentros/${id_encuentro}/signos-vitales`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vitales)
          // NO incluir fecha_toma: el servidor lo genera
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Signos registrados:', data);
        console.log('📅 Timestamp del servidor:', data.fecha_toma);
        // Marcar paso 1 como completo
      }
    } catch (error) {
      console.error('Error registrando signos:', error);
    }
  };

  return (
    <div className="signos-vitales-form">
      {VALIDACIONES.map(v => (
        <div key={v.campo} className="form-group">
          <label>{v.campo} ({v.unidad})</label>
          <input
            type="number"
            name={v.campo}
            value={vitales[v.campo as keyof SignosVitales] || ''}
            onChange={handleChange}
            placeholder={`${v.min}–${v.max}`}
            className={errores[v.campo] ? 'error' : ''}
          />
          {errores[v.campo] && (
            <span className="error-text">{errores[v.campo]}</span>
          )}
        </div>
      ))}

      <button
        onClick={handleRegistrar}
        disabled={!esCompleto()}
        className="btn-primary"
      >
        Registrar Signos
      </button>

      <div className="paso-status">
        Paso 1 (Signos): {esCompleto() ? '✅ Completado' : '⏳ Incompleto'}
      </div>
    </div>
  );
}
```

---

## 📂 Archivos Afectados

| Archivo | Cambios |
|---------|---------|
| `backend/app/schemas/encuentros.py` | ✅ `SignosVitalesCreateIn`, `SignosVitalesOut`, `SignosVitalesListOut` |
| `backend/app/services/signos_vitales.py` | ✅ Nuevo servicio CRUD completo |
| `backend/app/modules/encuentros/router.py` | ✅ 4 endpoints + actualización GET /{id} |
| `backend/app/models/encuentros.py` | ✅ Ya existe modelo `SignosVitales` |
| `backend/database/01_schema.sql` | ✅ Ya existe tabla `signos_vitales` |
| `backend/database/02_triggers.sql` | ✅ Ya existe vista `v_signos_encuentro` |

---

## 🧪 Testing

### Pruebas manuales con cURL

```bash
# 1. Registrar signos
curl -X POST http://localhost:8000/api/encuentros/550e8400-e29b-41d4-a716-446655440000/signos-vitales \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "presion_sistolica": 120,
    "presion_diastolica": 80,
    "temperatura_c": 36.5,
    "saturacion_oxigeno": 98,
    "frecuencia_cardiaca": 72
  }'

# 2. Obtener signos
curl http://localhost:8000/api/encuentros/550e8400-e29b-41d4-a716-446655440000/signos-vitales \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Obtener detalle (incluye signos)
curl http://localhost:8000/api/encuentros/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ Checklist

- [x] Validaciones de rango fisiológico
- [x] Timestamp del servidor (garantiza NOM-004)
- [x] POST para registrar signos
- [x] GET para listar signos
- [x] PATCH para actualizar
- [x] DELETE para eliminar
- [x] Integración en GET /encuentros/{id}
- [x] Autorización por rol (ENFERMERIA)
- [x] Control de ownership (solo quien registró puede modificar)
- [x] Uso de vista v_signos_encuentro
- [ ] Frontend: Implementar stepper paso 1
 
---

## 🔮 Próximas Tareas

**P5 — Paso 2: Notas SOAP**
- POST /encuentros/{id}/notas-soap
- Guardará Subjetivo, Objetivo, Análisis, Plan
- Marcará como "Completo" cuando esté firmado

**P6 — Paso 3: Diagnósticos**
- POST /encuentros/{id}/diagnosticos
- Múltiples diagnósticos por encuentro

**Frontend:**
- Componente Stepper con 3 pasos
- Paso 1: SignosVitalesForm (este módulo)
- Paso 2: NotasSOAPForm
- Paso 3: DiagnosticosForm

---

**Documento generado:** 2024-04-23  
**Estado:** ✅ Implementación completa
