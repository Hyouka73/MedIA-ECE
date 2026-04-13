# Guía Rápida: ExpedientePage.jsx

## 🚀 Inicio Rápido

### Acceso a la página
```javascript
// Desde PacientesListPage
<button onClick={() => navigate(`/expediente/${paciente.id}`)}>
  📋 Ver
</button>

// URL directa
/expediente/123e4567-e89b-12d3-a456-426614174000
```

### Estructura base
```jsx
import ExpedientePage from './pages/Pacients/ExpedientePage';

// Dentro del router
<Route path="/expediente/:id" element={<ExpedientePage />} />
```

---

## 🎯 Props y Estado

### useParams
```javascript
const { id } = useParams(); // UUID del paciente
```

### Estados Principales
```javascript
const [paciente, setPaciente] = useState(null);
const [encuentros, setEncuentros] = useState([]);
const [activeTab, setActiveTab] = useState("Antecedentes");
const [expandedEncuentro, setExpandedEncuentro] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

---

## 🎨 Colores Clave

| Uso | Hex | Var |
|-----|-----|-----|
| Primario (botones, borders) | `#2459A8` | `C.b500` |
| Acento (puntos, resaltados) | `#E8921F` | `C.a400` |
| Éxito (fond alergias moderadas) | `#237A4B` | `C.g500` |
| Error (fondo alergias altas) | `#BA2E45` | `C.r500` |
| Advertencia | `#B86E12` | `C.w500` |
| Fondo página | `#EDEBE6` |  |
| Fondo card | `#FDFAF5` |  |
| Texto heading | `#1A1510` | `C.th` |
| Texto body | `#2C2620` | `C.tb` |
| Texto muted | `#5A5048` | `C.ts` |

---

## 🔄 Flujo de Datos

```
PacientesListPage
        ↓ (navigate)
ExpedientePage
        ↓ (useParams)
Carga pacientesAPI.getPaciente(id)
        ↓
Carga clinicoAPI.getEncuentros(id)
        ↓
Renderiza perfil + tabs + encuentros
        ↓ (click "Nueva Consulta")
ConsultaPage (/consulta?id_paciente={id})
```

---

## 📋 Funciones Clave

### Cargar expediente
```javascript
const loadExpediente = async () => {
  try {
    setLoading(true);
    const pacRes = await pacientesAPI.getPaciente(id);
    setPaciente(pacRes.data || generarPacienteDemo(id));
    
    const encRes = await clinicoAPI.getEncuentros({ id_paciente: id });
    setEncuentros(encRes.data?.items || generarEncuentrosDemo());
  } catch (err) {
    setError(err.message);
    // Fallback a datos demo
    setPaciente(generarPacienteDemo(id));
  } finally {
    setLoading(false);
  }
};
```

### Expandir/Colapsar encuentro
```javascript
const toggleEncuentro = (id) => {
  setExpandedEncuentro(
    expandedEncuentro === id ? null : id
  );
};
```

### Navegar a nueva consulta
```javascript
onClick={() => navigate(`/consulta?id_paciente=${paciente.id_paciente}`)}
```

---

## 🛠️ Customización Común

### Agregar nueva pestaña

1. **Agregar al array de tabs** (línea ~190):
```javascript
{["Antecedentes", "Medicamentos", "Estudios", "Notas", "Encuentros", "Mi Nueva Pestaña"].map((tab) => (
```

2. **Agregar sección de contenido** (línea ~270):
```javascript
{activeTab === "Mi Nueva Pestaña" && (
  <div>
    {/* Tu contenido aquí */}
  </div>
)}
```

### Cambiar colores

Buscar y reemplazar el color en inline styles:
```javascript
// De
background: "#BA2E45"   // Rojo
color: "#2459A8"        // Azul

// A
background: "#237A4B"   // Verde
color: "#E8921F"        // Ámbar
```

### Agregar campo a perfil

En la sección de "Datos Principales" (línea ~140):
```javascript
<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
  <span>Mi dato: {paciente.miDato}</span>
  <span>·</span>
  {/* resto... */}
</div>
```

---

## 🐛 Debugging

### Verificar carga de datos
```javascript
console.log("Paciente:", paciente);
console.log("Encuentros:", encuentros);
console.log("Rol usuario:", user.rol);
console.log("Tiene acceso:", tieneAcceso);
```

### Test modo demo
```javascript
// Comentar la llamada a API
// const pacRes = await pacientesAPI.getPaciente(id);
setPaciente(generarPacienteDemo(id));
```

### Verificar estado de pestañas
```javascript
console.log("Tab activa:", activeTab);
console.log("Encuentro expandido:", expandedEncuentro);
```

---

## ⚠️ Errores Comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| Página en blanco | Sin `id` en params | Verificar route `/expediente/:id` |
| "Acceso denegado" | Rol no autorizado | Agregar rol a `rolesPermitidos` |
| Botones no funcionan | Navigate import faltante | `import { useNavigate }` |
| Datos no cargan | API timeout | Check console, usar datos demo |
| Tabs no cambian | Estado no actualiza | Verificar `onClick={() => setActiveTab(tab)}` |

---

## 🚀 Performance Tips

1. **Lazy load encuentros**
   - Solo fetch si tab "Encuentros" está activo
   ```javascript
   useEffect(() => {
     if (activeTab !== "Encuentros") return;
     // cargar encuentros
   }, [activeTab]);
   ```

2. **Cachear paciente**
   - Guardar en context para no refetch en vistas siguientes
   ```javascript
   const { paciente: cached } = usePaciente();
   const paciente = cached || newData;
   ```

3. **Debounce búsquedas**
   - Si se agrega filtro de encuentros
   ```javascript
   useEffect(() => {
     const timer = setTimeout(() => filtrar(), 300);
     return () => clearTimeout(timer);
   }, [searchTerm]);
   ```

---

## 📖 Enlaces Rápidos

- **Componentes similares**: [PacientesListPage.jsx](../src/pages/Pacients/PacientesListPage.jsx)
- **Diseño UI**: [medsys-v2.jsx](./medsys-v2.jsx)
- **API services**: [pacientes.js](../src/api/pacientes.js), [clinico.js](../src/api/clinico.js)
- **Contexto Auth**: [AuthContext.jsx](../src/context/AuthContext.jsx)
- **Especificación completa**: [ESPECIFICACION_ExpedientePage.md](./ESPECIFICACION_ExpedientePage.md)

---

## 🆘 Soporte

Para dudas sobre:
- **Estilos MedIA**: Revisar [Doc7_UIUX_MedIA.pdf](./Doc7_UIUX_MedIA.docx.pdf)
- **Normativa NOM**: Consultar [NOTAS_PENDIENTES.md](./NOTAS_PENDIENTES.md)
- **Datos backend**: Ver [pacientes.py](../backend/app/schemas/pacientes.py)

---

_Guía v1.0 — Mantenida con ExpedientePage.jsx_
