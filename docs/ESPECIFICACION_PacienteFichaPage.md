# Especificación Técnica: PacienteFichaPage.jsx

## 📋 Descripción General

**Módulo**: Gestión de Pacientes → Registro/Edición  
**Página**: PacienteFichaPage.jsx  
**Ubicación**: `frontend/src/pages/Pacients/PacienteFichaPage.jsx`  
**Estado**: ✅ Completado  
**Versión**: 1.0  
**Fecha**: 13 de Abril, 2026

La página **PacienteFichaPage** es un formulario completo para crear nuevos pacientes o editar pacientes existentes. Integra datos personales (Persona) y datos clínicos básicos (Paciente), con validación en tiempo real y manejo de errores.

---

## 🎨 Especificaciones de Diseño

### Sistema de Tokens de Color

Se implementó el sistema **MedSys Design System** conforme a [Doc7_UIUX_MedSys.docx.pdf]:

```javascript
// Colores
- Primario:       #2459A8 (azul naval)
- Error:          #BA2E45 (rojo)
- Éxito:          #237A4B (verde)
- Fondo página:   #EDEBE6 (beige)
- Fondo card:     #FDFAF5 (blanco cálido)
- Texto heading:  #1A1510
- Texto body:     #2C2620
- Bordes:         #DAD4CC
```

### Tipografía

- **Fuente**: DM Sans
- **Tamaños**: 11px - 18px
- **Pesos**: 600 (labels), 700 (headings), 500 (botones)

---

## 🏗️ Estructura de Componentes

### Router

La página se accede MedSysnte dos rutas:

```javascript
// Crear nueva figura
<Route path="/pacientes/nuevo" element={<PacienteFichaPage />} />

// Editar existente
<Route path="/pacientes/:id/editar" element={<PacienteFichaPage />} />
```

**Parámetros**:
- `id` (opcional): UUID del paciente para edición

---

## 📊 Formulario - Campos

### Sección 1: Datos Personales

| Campo | Tipo | Requerido | Validación | Notas |
|-------|------|-----------|-----------|-------|
| Nombre | text | ✅ | No vacío | Máximo 100 chars |
| Primer Apellido | text | ✅ | No vacío | Máximo 100 chars |
| Segundo Apellido | text | ❌ | — | Máximo 100 chars |
| CURP | text | ❌ | Regex CURP | 18 caracteres, validación real |
| Fecha de Nacimiento | date | ✅ | Válida | ISO format |
| Sexo | select | ✅ | M/F/X | Género |

### Sección 2: Ubicación y Contacto

| Campo | Tipo | Requerido | Validación | Notas |
|-------|------|-----------|-----------|-------|
| Teléfono | tel | ❌ | 7-15 dígitos | Se eliminan caracteres especiales |
| Localidad | text | ❌ | — | Ej. "Chiapa de Corzo" |
| Calle y Número | text | ❌ | — | Dirección completa |
| Referencia Geográfica | textarea | ❌ | — | Descripción de ubicación |

### Sección 3: Datos Clínicos

| Campo | Tipo | Requerido | Validación | Notas |
|-------|------|-----------|-----------|-------|
| Grupo Sanguíneo | select | ❌ | [O±, A±, B±, AB±] | 8 opciones |
| Lengua Materna | text | ❌ | — | Ej. "Español", "Tzeltal" |

---

## 🔐 Control de Acceso

### Roles Autorizados

| Rol | Crear | Editar |
|-----|-------|--------|
| MEDICO_GENERAL | ❌ | ✅ |
| ESPECIALISTA | ❌ | ✅ |
| RECEPCIONISTA | ✅ | ✅ |
| ADMINISTRADOR | ✅ | ✅ |
| SUPERADMIN | ✅ | ✅ |
| OMNIADMIN | ✅ | ✅ |
| ENFERMERIA | ❌ | ❌ |

**Validación**:
```javascript
const rolesPermitidos = [
  "RECEPCIONISTA", "ADMINISTRADOR", 
  "SUPERADMIN", "OMNIADMIN"
];
```

---

## 🎯 Funcionalidades Principales

### 1. Modo Crear vs Editar

**Crear** (ruta `/pacientes/nuevo`):
- Formulario vacío
- Botón "Registrar"
- Redirige a `/pacientes` tras éxito

**Editar** (ruta `/pacientes/:id/editar`):
- Carga datos de API
- Botón "Actualizar"
- Redirige a `/expediente/{id}` tras éxito

```javascript
const [isEdit] = useState(Boolean(id));
```

### 2. Validación en Tiempo Real

```javascript
const validateForm = () => {
  const newErrors = {};
  
  if (!form.nombre?.trim()) 
    newErrors.nombre = "Nombre requerido";
  
  if (form.curp && !/^[A-ZÑ]{6}\d{8}[HM][A-Z]{3}[0-9A-Z]\d$/.test(form.curp))
    newErrors.curp = "CURP inválido";
  
  if (form.telefono && !/^\d{7,15}$/.test(...))
    newErrors.telefono = "Teléfono inválido";
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### 3. Manejo de Errores

- **Campo inválido**: Border rojo + icono ⚠ + mensaje
- **Error general**: Banner rojo con AlertCircle
- **Error de API**: Captura y muestra en banner

### 4. Estados de Guardado

- **Normal**: Botón azul habilitado
- **Guardando**: Botón opacidad 0.6, cursor not-allowed
- **Éxito**: Banner verde + redirección (1.5s)
- **Error**: Banner rojo con opción de reintentar

---

## 🔗 Integración con API

### Endpoints Consumidos

| Método | Endpoint | Descripción |
|--------|----------|-----------|
| GET | `/pacientes/:id` | Obtener datos para edición |
| POST | `/pacientes` | Crear nuevo paciente (future) |
| PUT | `/pacientes/:id` | Actualizar paciente (future) |

### Estructura de Datos Enviados

```javascript
{
  // Persona
  nombre: string,
  primer_apellido: string,
  segundo_apellido?: string,
  curp?: string,
  fecha_nacimiento: date,
  sexo: "M" | "F" | "X",
  
  // Ubicación
  id_localidad?: string,
  calle_numero?: string,
  referencia_geografica?: string,
  
  // Contacto
  telefono?: string,
  id_lengua_materna?: string,
  
  // Clínico
  grupo_sanguineo?: string,
}
```

---

## 👁️ Estados Visuales

### Loading
```
⏳ Cargando datos del paciente...
```

### Error de Acceso
```
⛔ Acceso Denegado
No tienes permisos para registrar pacientes.
[← Volver]
```

### Error de Validación
```
┌─────────────────────────────────────────┐
│ ⚠ Por favor, completa los campos...    │
└─────────────────────────────────────────┘

[Nombre] [Primer Apellido]
  ↑ (border rojo)
  ⚠ Nombre requerido
```

### Éxito
```
┌─────────────────────────────────────────┐
│ ✓ Paciente registrado exitosamente      │
└─────────────────────────────────────────┘
(Redirección en 1.5 segundos)
```

---

## 📱 Responsividad

- **Desktop** (1280px+): Grid 2 columnas
- **Tablet** (768px): Grid 2 columnas (ajustado)
- **Mobile** (<768px): Grid 1 columna, full-width

**Overflow Management**:
- Contenido: `flex: 1; overflowY: auto`
- TopBar: sticky con z-index: 10
- Form: scroll vertical si excede viewport

---

## 🧪 Casos de Prueba

| # | Escenario | Entrada | Salida |
|---|-----------|---------|--------|
| 1 | Crear sin nombre | Submit vacío | Error: "Nombre requerido" |
| 2 | CURP inválido | "123456789" | Error: "CURP inválido" |
| 3 | Teléfono válido | "55 1234-5678" | ✅ Acepta |
| 4 | Crear exitoso | Datos completos | ✓ Redirige a /pacientes |
| 5 | Editar exitoso | ID válido + cambios | ✓ Redirige a /expediente/{id} |
| 6 | API error | Timeout | Error: muestra mensaje |
| 7 | Sin permisos | Rol restringido | Alert acceso denegado |
| 8 | Cancelar | Click botón | ← Volver (navigate(-1)) |

---

## 🔍 Notas de Implementación

### Validaciones Implementadas

1. **Nombre y Apellido**: No vacío, no solo espacios
2. **CURP**: Formato oficial mexicano (18 caracteres)
3. **Teléfono**: 7-15 dígitos (se procesan caracteres no numéricos)
4. **Fecha**: ISO format válido
5. **Email**: No validado (future con backend)

### Estados Iniciales

```javascript
const [form, setForm] = useState({
  nombre: "",
  primer_apellido: "",
  segundo_apellido: "",
  curp: "",
  fecha_nacimiento: "",
  sexo: "M",
  // ... resto de campos
});

const [errors, setErrors] = useState({});
const [saving, setSaving] = useState(false);
const [error, setError] = useState(null);
const [successMsg, setSuccessMsg] = useState("");
```

### Validación en Submit

```javascript
const validateForm = () => {
  // Validar todos los campos
  // Retornar true si todo está bien
};

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    setError("Por favor, completa los campos requeridos");
    return;
  }
  
  try {
    // POST/PUT a API
    setSuccessMsg("Guardado exitosamente");
    setTimeout(() => navigate(...), 1500);
  } catch (err) {
    setError(err.message);
  }
};
```

---

## 🚀 Mejoras Futuras

- [ ] Autocompletado de localidad (INEGI catalog)
- [ ] Búsqueda inversa de CURP (validación RFC)
- [ ] Upload de foto de perfil
- [ ] Precarga de alergias
- [ ] Integración con cédula de identificación
- [ ] Búsqueda de personas existentes (deduplicación)
- [ ] Generación automática de CURP si falta

---

## 📝 Referencias

- **Schemas Backend**: [pacientes.py](../backend/app/schemas/pacientes.py)
- **API Services**: [pacientes.js](../src/api/pacientes.js)
- **Diseño UI**: [medsys-v2.jsx](./medsys-v2.jsx)
- **AdminUsuariosPage**: Referencia de modal form pattern

---

_Especificación v1.0 — Compatible con MedSys-ECE backend Q2 2026_
