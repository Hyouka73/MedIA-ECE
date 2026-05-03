# 🚀 Guía Rápida: PacientesListPage.jsx

## Inicio Rápido

### Importar en App.jsx

```jsx
import PacientesListPage from './pages/Pacients/PacientesListPage';

// En tu router:
<Route path="/pacientes" element={<PacientesListPage />} />
```

### Dependencias Requeridas

```jsx
// Debe estar disponible:
- useAuth() hook (AuthContext)
- pacientesAPI.getPacientes() (api/pacientes.js)
- AuthContext está en context/AuthContext.jsx
```

---

## Estructura de Componente

```
PacientesListPage
├── TopBar (título + acciones)
├── Filtros (búsqueda + select alergias)
├── Tabla
│   ├── Encabezados
│   ├── Filas (pacientes)
│   └── Estados (loading, error, empty)
└── Paginación + Resumen
```

---

## Props y States

### States principales

```javascript
const [pacientes, setPacientes] = useState([]);      // Lista de pacientes
const [loading, setLoading] = useState(true);        // Loading state
const [error, setError] = useState(null);            // Error message
const [searchQuery, setSearchQuery] = useState("");   // Búsqueda
const [page, setPage] = useState(1);                 // Página actual
const [totalPages, setTotalPages] = useState(1);     // Total páginas
const [filterAlergias, setFilterAlergias] = useState("todos"); // Filtro
```

### Props de componentes internos

#### Btn
```jsx
<Btn v="primary" sz="md" onClick={fn} disabled={false} full={false}>
  Texto
</Btn>
```

#### Bdg
```jsx
<Bdg v="error" dot={true}>Contenido</Bdg>
```

#### Inp
```jsx
<Inp
  placeholder="..."
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  pre="⊕"
  error={errorMsg}
/>
```

---

## Colores Clave

| Variable | Color | Uso |
|----------|-------|-----|
| `C.b500` | #2459A8 | Primario (botones) |
| `C.a400` | #E8921F | Acento (acentos) |
| `C.r500` | #BA2E45 | Error/Alergias altas |
| `C.w500` | #B86E12 | Advertencia |
| `C.g500` | #237A4B | Éxito |
| `C.th` | #1A1510 | Texto principal |
| `C.tm` | #877E74 | Texto secundario |
| `C.bd` | #DAD4CC | Bordes |

---

## Funciones de Acción Comunes

### Limpiar búsqueda
```javascript
setSearchQuery("");
setPage(1);
```

### Cambiar filtro
```javascript
setFilterAlergias(nuevoFiltro);
setPage(1);
```

### Manejador de nuevo paciente
```javascript
const handleNewPaciente = () => {
  navigate('/pacientes/nuevo');
};
```

### Manejador de expediente
```javascript
const handleVerExpediente = (pacienteId) => {
  navigate(`/expediente/${pacienteId}`);
};
```

---

## Customización Común

### Cambiar columnas de tabla

Busca la sección `Tabla de pacientes`:

```javascript
{["Paciente", "Edad", "Grupo sangre", ...].map((header) => (
  <th>...</th>
))}
```

Añade el header y luego la celda correspondiente en `<tbody>`:

```jsx
<td style={{ padding: "14px 20px" }}>
  {paciente.nombreDelCampo}
</td>
```

### Cambiar límite de paginación

```javascript
// Cambiar de 10 a 20:
const params = {
  page: page,
  limit: 20,  // ← Aquí
  search: searchQuery,
};
```

### Añadir nuevo filtro

```javascript
const [miNuevoFiltro, setMiNuevoFiltro] = useState("valor");

// En select:
<select value={miNuevoFiltro} onChange={(e) => setMiNuevoFiltro(e.target.value)}>
  <option value="opcion1">Opción 1</option>
  <option value="opcion2">Opción 2</option>
</select>

// En filtrado:
const pacientesFiltrados = pacientes.filter(p => {
  // Tu lógica aquí
  return cumpleCondicion;
});
```

---

## Debugging

### Ver estado actual
```javascript
console.log("User:", user);
console.log("Pacientes:", pacientes);
console.log("Loading:", loading);
console.log("Error:", error);
```

### Testear API
```javascript
// En DevTools > Network
// GET /api/v1/pacientes?page=1&limit=10&search=...
```

### Datos Demo
Automáticamente se cargan si:
1. La API falla
2. Los `pacientes` están vacíos

---

## Errores Comunes

### "Cannot read property 'rol' of null"
**Causa**: `user` no está cargado  
**Solución**: Verifica que `AuthContext` esté correctamente inicializado

### "pacientesAPI is not defined"
**Causa**: Falta importar la API  
**Solución**:
```jsx
import { pacientesAPI } from '../../api/pacientes';
```

### "Table showing no data despite loading false"
**Causa**: Datos vacíos o API retorna formato diferente  
**Solución**: 
```javascript
console.log(response.data); // Verifica estructura
// Asegúrate que respuesta sea: { items: [...], pages: 1 }
```

### Estilos no se aplican
**Causa**: Falta la importación de estilos globales  
**Solución**: Los estilos están **inline** en el componente, no requiere import

---

## Performance Tips

### Optimizar búsqueda (sin debounce)
```javascript
// Agregar debounce manual:
const [searchQuery, setSearchQuery] = useState("");
const [debounceTimer, setDebounceTimer] = useState(null);

const handleSearch = (value) => {
  clearTimeout(debounceTimer);
  setDebounceTimer(
    setTimeout(() => {
      setSearchQuery(value);
      setPage(1);
    }, 300)
  );
};
```

### Lazy load del expediente
```javascript
const handleVerExpediente = async (id) => {
  const data = await pacientesAPI.getExpediente(id);
  // Usar data para renderizar expediente
};
```

---

## Enlaces Útiles

- 📖 [Especificación Completa](./ESPECIFICACION_PacientesListPage.md)
- 🎨 [Diseño MedSys](./Doc7_UIUX_MedSys.docx.pdf)
- 🔌 [API Reference](../backend/app/modules/pacientes/router.py)
- 🛠 [AuthContext](../frontend/src/context/AuthContext.jsx)

---

**Version**: 1.0  
**Última actualización**: 8 de Abril, 2025
