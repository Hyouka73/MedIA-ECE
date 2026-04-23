# Guía Rápida: PacienteFichaPage.jsx

## 🚀 Inicio Rápido

### Acceso a la página

```javascript
// Crear nuevo paciente
<button onClick={() => navigate('/pacientes/nuevo')}>
  + Nuevo Paciente
</button>

// Editar paciente existente
<button onClick={() => navigate(`/pacientes/${id}/editar`)}>
  ✏️ Editar
</button>
```

### URLs directas
```
/pacientes/nuevo                    # Crear
/pacientes/123e4567-e89b/editar    # Editar
```

---

## 🎯 Props y Estado

### useParams
```javascript
const { id } = useParams(); // Undefined para crear, UUID para editar
const [isEdit] = useState(Boolean(id));
```

### Estados Principales
```javascript
const [form, setForm] = useState({...});       // Datos del formulario
const [errors, setErrors] = useState({});      // Validaciones
const [saving, setSaving] = useState(false);   // Estado de guardado
const [error, setError] = useState(null);      // Error general
const [successMsg, setSuccessMsg] = useState(""); // Mensaje éxito
```

---

## 🎨 Colores Clave

| Uso | Hex | Uso |
|-----|-----|-----|
| Primario (botones) | `#2459A8` | Texto activo |
| Error (borders, text) | `#BA2E45` | Campos inválidos |
| Éxito (backgrounds) | `#237A4B` | Mensajes positivos |
| Fondo página | `#EDEBE6` | Background general |
| Fondo card | `#FDFAF5` | Formulario |
| Texto normal | `#2C2620` | Body text |
| Texto opaco | `#5A5048` | Labels, hints |
| Bordes | `#DAD4CC` | Inputs, separadores |

---

## 🔄 Flujo de Datos

```
PacientesListPage
    ↓
[+ Nuevo Paciente]  →  /pacientes/nuevo
    ↓
PacienteFichaPage (isEdit=false)
    ↓
Form submit
    ↓
POST /pacientes
    ↓
✓ navigate(/pacientes)
```

O para edición:

```
ExpedientePage
    ↓
[Editar datos]  →  /pacientes/{id}/editar
    ↓
PacienteFichaPage (isEdit=true)
    ↓
GET /pacientes/{id} → carga form
    ↓
PUT /pacientes/{id}
    ↓
✓ navigate(/expediente/{id})
```

---

## 📋 Funciones Clave

### Actualizar campo
```javascript
const updateField = (key, value) => {
  setForm(prev => ({ ...prev, [key]: value }));
  // Limpiar error del campo
  if (errors[key]) {
    setErrors(prev => ({ ...prev, [key]: "" }));
  }
};

// Uso
<input
  value={form.nombre}
  onChange={(e) => updateField("nombre", e.target.value)}
/>
```

### Validar formulario
```javascript
const validateForm = () => {
  const newErrors = {};
  
  if (!form.nombre?.trim()) 
    newErrors.nombre = "Nombre requerido";
  
  if (form.curp && !/^[A-ZÑ]{6}\d{8}[HM][A-Z]{3}[0-9A-Z]\d$/.test(form.curp))
    newErrors.curp = "CURP inválido";
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### Guardar paciente
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    setError("Por favor, completa los campos requeridos");
    return;
  }
  
  try {
    setSaving(true);
    
    if (isEdit) {
      // await pacientesAPI.updatePaciente(id, form);
      setSuccessMsg("Paciente actualizado exitosamente");
      setTimeout(() => navigate(`/expediente/${id}`), 1500);
    } else {
      // const res = await pacientesAPI.createPaciente(form);
      setSuccessMsg("Paciente registrado exitosamente");
      setTimeout(() => navigate("/pacientes"), 1500);
    }
  } catch (err) {
    setError(err.response?.data?.detail || "Error al guardar");
  } finally {
    setSaving(false);
  }
};
```

---

## 🛠️ Customización Común

### Agregar nuevo campo

1. **Agregar al estado inicial**:
```javascript
const [form, setForm] = useState({
  // ... campos existentes
  miCampo: "",  // ← NUEVO
});
```

2. **Agregar input en HTML**:
```javascript
<div>
  <label>Mi Campo</label>
  <input
    value={form.miCampo}
    onChange={(e) => updateField("miCampo", e.target.value)}
  />
</div>
```

3. **Agregar validación (opcional)**:
```javascript
if (!form.miCampo) 
  newErrors.miCampo = "Campo requerido";
```

### Cambiar colores de error

Buscar `#BA2E45` en el archivo y reemplazar por nuevo color:

```javascript
// De
border: `1.5px solid ${errors.nombre ? "#BA2E45" : "#DAD4CC"}`

// A
border: `1.5px solid ${errors.nombre ? "#E8921F" : "#DAD4CC"}` // Ámbar
```

### Cambiar roles permitidos

```javascript
const rolesPermitidos = [
  "RECEPCIONISTA",      // ← modificar
  "ADMINISTRADOR",
  "SUPERADMIN",
  "OMNIADMIN",
];
```

---

## 🐛 Debugging

### Ver estado del formulario
```javascript
console.log("Formulario:", form);
console.log("Errores:", errors);
console.log("¿Editando?:", isEdit);
```

### Simular carga exitosa
```javascript
// En handleSubmit, comentar async/await
setSuccessMsg("Paciente registrado exitosamente");
setTimeout(() => navigate("/pacientes"), 1500);
```

### Ver datos cargados en edición
```javascript
useEffect(() => {
  if (isEdit && form !== initialForm) {
    console.log("Datos cargados:", form);
  }
}, [form, isEdit]);
```

---

## ⚠️ Errores Comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| "Acceso Denegado" siempre | Rol no en `rolesPermitidos` | Agregar rol a lista |
| Campos no guardan | Sin `onChange` | Verificar `updateField` conexión |
| Validación no funciona | Regex incorrecta | Testear en console |
| Botón no responde al click | Handler faltante | `onClick={() => handleSubmit(e)}` |
| Redirección no ocurre | `navigate` import faltante | `import { useNavigate }` |

---

## 🚀 Performance Tips

1. **Memoizar formulario**
   ```javascript
   const updateField = useCallback((key, value) => {
     setForm(prev => ({ ...prev, [key]: value }));
   }, [errors]);
   ```

2. **Validación debounced**
   ```javascript
   useEffect(() => {
     const timer = setTimeout(() => validateForm(), 300);
     return () => clearTimeout(timer);
   }, [form]);
   ```

3. **Cache de paciente cargado**
   ```javascript
   const { paciente: cached } = usePaciente();
   if (cached?.id_paciente === id) {
     setForm(cached);
   }
   ```

---

## 📖 Enlaces Rápidos

- **Componente similar**: [AdminUsuariosPage.jsx](../src/pages/admin/AdminUsuariosPage.jsx)
- **Schemas backend**: [pacientes.py](../backend/app/schemas/pacientes.py)
- **API services**: [pacientes.js](../src/api/pacientes.js)
- **Especificación completa**: [ESPECIFICACION_PacienteFichaPage.md](./ESPECIFICACION_PacienteFichaPage.md)

---

## 🆘 Soporte

Para dudas:
- **Estilos UX**: [Doc7_UIUX_MedIA.pdf](./Doc7_UIUX_MedIA.docx.pdf)
- **Validaciones**: Regex en `validateForm()`
- **Backend**: Revisar schemas en `pacientes.py`

---

_Guía v1.0 — Mantenida con PacienteFichaPage.jsx_
