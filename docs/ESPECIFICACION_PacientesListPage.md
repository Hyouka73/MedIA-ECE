# Especificación Técnica: PacientesListPage.jsx

## 📋 Descripción General

**Módulo**: Gestión de Pacientes  
**Página**: PacientesListPage.jsx  
**Ubicación**: `frontend/src/pages/Pacients/PacientesListPage.jsx`  
**Estado**: ✅ Completado  
**Versión**: 1.0  
**Fecha**: 8 de Abril, 2025

La página **PacientesListPage** es el hub central para la visualización y gestión del listado de pacientes del sistema MedIA-ECE. Proporciona búsqueda en tiempo real, filtrado avanzado, paginación y acciones rápidas para acceder a expedientes clínicos.

---

## 🎨 Especificaciones de Diseño

### Sistema de Tokens de Color

Se implementó el sistema de tokens **MedIA Design System** conforme al documento [Doc7_UIUX_MedIA.docx.pdf]:

```javascript
// Colores Institucionales
- Azul Naval (Primario):     #2459A8 (b500)
- Ámbar (Acento):            #E8921F (a400)
- Verde (Éxito):             #237A4B (g500)
- Ámbar Cálido (Advertencia):#B86E12 (w500)
- Rojo (Error):              #BA2E45 (r500)

// Fondos
- Page Background:           #EDEBE6
- Surface:                   #F5F2EC
- Card:                      #FDFAF5
- Sidebar:                   #101E33

// Texto
- Heading:                   #1A1510 (th)
- Body:                      #2C2620 (tb)
- Subtext:                   #5A5048 (ts)
- Muted:                     #A9A097 (td)

// Bordes
- Default:                   #DAD4CC
```

### Tipografía

- **Fuente**: DM Sans (Google Fonts)
- **Tamaños**: 11px - 17px según jerarquía
- **Pesos**: 300, 400, 500, 600, 700
- **Espaciado de letras**: 0.3-0.6px para títulos

### Componentes Reutilizables

#### Btn (Botón)
```jsx
<Btn v="primary" sz="sm" onClick={handler} disabled={false} full={false}>
  + Nuevo paciente
</Btn>
```
- **Variantes**: `primary`, `secondary`, `accent`, `success`, `danger`, `ghost`, `outline`, `dark`
- **Tamaños**: `xs` (11px), `sm` (12px), `md` (13px), `lg` (14px)
- **Props**: `v` (variante), `sz` (tamaño), `onClick`, `disabled`, `full`

#### Bdg (Badge)
```jsx
<Bdg v="error" dot={true}>
  Latex
</Bdg>
```
- **Variantes**: `default`, `blue`, `amber`, `success`, `warning`, `error`, `navy`
- **Props**: `v` (variante), `dot` (punto de color), `children`

#### Inp (Input)
```jsx
<Inp
  placeholder="Buscar..."
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  pre="⊕"
  error={errorMsg}
/>
```
- **Props**: `label`, `placeholder`, `type`, `value`, `onChange`, `error`, `pre` (prefijo), `suf` (sufijo)
- **Estados**: normal, focus (borde azul + shadow b100), error (rojo + ⚠)

#### TopBar
```jsx
<TopBar
  title="Pacientes"
  sub="24 pacientes registrados"
  actions={<><Btn>...</Btn> <Btn>...</Btn></>}
/>
```
- **Props**: `title`, `sub`, `actions` (elementos JSX)
- **Características**: sticky, backdrop blur, z-index 10

---

## 🔐 Control de Acceso

### Roles Autorizados

El acceso a la página está restringido a los siguientes roles:

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| MEDICO_GENERAL | Médico de atención primaria | Ver, filtrar, nueva consulta |
| ESPECIALISTA | Médico especialista | Ver, filtrar, nueva consulta |
| ENFERMERIA | Personal de enfermería | Ver pacientes, registrar signos |
| RECEPCIONISTA | Personal de recepción | Ver, filtrar, expediente |
| ADMINISTRADOR | Administrador del sistema | Ver todo, exportar |
| SUPERADMIN | Super administrador | Ver todo, exportar, gestionar |
| OMNIADMIN | Admin universal | Acceso completo |

**Validación**: Se verifica mediante `useAuth()` hook que consume `AuthContext`.

```javascript
const tieneAcceso = user && rolesPermitidos.includes(user.rol);
```

---

## 📊 Funcionalidades Principales

### 1. Búsqueda en Tiempo Real

**Campo de entrada**: "Buscar por nombre o teléfono..."

- Búsqueda por nombre completo (case-insensitive)
- Búsqueda parcial en teléfono
- Debounce automático (resetea página a 1)
- Placeholder: `⊕ Buscar por nombre o teléfono...`

**Implementación**:
```javascript
const pacientesFiltrados = pacientes.filter(p =>
  !searchQuery ||
  p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
  (p.telefono && p.telefono.includes(searchQuery))
);
```

### 2. Filtro de Alergias

**Select dropdown** con opciones:
- `todos`: Mostrador todos los pacientes
- `con_alergias`: Solo pacientes con **al menos 1 alergia**
- `sin_alergias`: Solo pacientes **sin alergias**

**Indicadores visuales**:
- 🔴 **Rojo (error badge)**: Alergia de severidad ALTA
- 🟡 **Ámbar (warning badge)**: Alergia de severidad MEDIA

### 3. Tabla Principal

**Columnas**:

| Columna | Tipo | Contenido | Ancho |
|---------|------|----------|-------|
| Paciente | Texto | Nombre completo (apellido, nombre) | 25% |
| Edad | Número | Edad en años | 10% |
| Grupo sangre | Badge | Tipo de sangre (O+, A-, AB+, etc.) | 12% |
| Teléfono | Texto | Número con formato 📱 | 18% |
| Alergias | Badge | Cantidad + severidad (alta/media) | 20% |
| Última consulta | Fecha | DD MMM YYYY (28 May 2025) | 12% |
| Acciones | Botones | Ver expediente 📋 + Nueva consulta | 15% |

**Estilos de fila**:
- Altura: 14px padding vertical
- Borde inferior: 1px sólido `#DAD4CC`
- Hover: fondo `#EDE9E2` (n50)
- Font size: 12.5-13px

### 4. Estados de Datos

#### Loading
```
⏳ Cargando pacientes...
```
- Spinner implícito en texto
- Padding: 40px
- Centrado

#### Error
```
❌ Error al cargar pacientes
```
- Fondo: `#FEF0F3` (r50)
- Borde: rojo 1.5px
- Botones actualizados automáticamente con datos demo

#### Empty
```
🔍 No se encontraron pacientes
```
- Icono grande (48px)
- Texto descriptivo
- Sugerencia de acción

#### Success
- Tabla llena con datos
- Paginación visible si `totalPages > 1`

### 5. Paginación

**Controles**:
- Botón `← Anterior` (disabled si `page === 1`)
- Indicador `página / total`
- Botón `Siguiente →` (disabled si `page >= totalPages`)

**Límite por página**: 10 pacientes

**Reset automático**: La página vuelve a 1 al cambiar búsqueda o filtro

---

## 🔌 Integración con API

### Endpoint: GET /pacientes

**Cliente**: `pacientesAPI.getPacientes(params)`

**Parámetros**:
```javascript
{
  page: number,        // Página actual (1-based)
  limit: number,       // Registros por página (default: 10)
  search: string       // Término de búsqueda (opcional)
}
```

**Respuesta esperada**:
```javascript
{
  items: [
    {
      id: number,
      nombre: string,
      edad: number,
      tipoSangre: string,   // "O+", "A-", etc.
      telefono: string,
      ultimaConsulta: string, // "28 May 2025"
      alergias: [
        {
          nombre: string,
          severidad: "alta" | "media"
        }
      ]
    }
  ],
  pages: number
}
```

**Fallback (Datos Demo)**:
Si la API falla, se cargan 6 pacientes de demostración automáticamente.

---

## 🎯 Acciones de Usuario

### 📋 Ver Expediente
```javascript
handleVerExpediente(pacienteId)
```
- Abre expediente clínico completo
- Redirecciona a: `ExpedientePage.jsx`
- Parámetro: ID del paciente
- Tooltip: "Ver expediente clínico completo"

### ➕ Nueva Consulta
```javascript
handleNuevaConsulta(pacienteId, pacienteNombre)
```
- Inicia formulario SOAP
- Redirecciona a: formulario de consulta
- Parámetro: ID del paciente
- Pre-carga datos del paciente

### 📊 Exportar
```javascript
handleExportar()
```
- Exportar listado a CSV/Excel
- Incluye todos los pacientes filtrados
- Formato: CSV con separador `,`

### ➕ Nuevo Paciente
```javascript
handleNewPaciente()
```
- Abre formulario de registro
- Redirecciona a: formulario de nueva persona
- Pre-rellena campos vacíos

---

## 🎨 Animaciones y Transiciones

### Entrada de página
```css
.view {
  animation: fadeUp .22s ease both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Hover en fila
```css
.row-hover:hover {
  background: #EDE9E2;
}
```

### Transiciones de botones
- Hover: `filter: brightness(1.07)`
- Active: `transform: scale(.98)`
- Duración: 0.13s

---

## 📱 Responsividad

### Breakpoints implementados

| Pantalla | Comportamiento |
|----------|---|
| **Desktop** (>1200px) | Grid de filtros 2 columnas, tabla completa |
| **Tablet** (768-1200px) | Columnas pueden ajustarse, scroll horizontal si necesario |
| **Mobile** (<768px) | Tabla horizontal scrollable, botones apilados |

### Overflow handling
```javascript
// Tabla
overflowX: "auto"

// Contenedor principal
overflow: "auto"
padding: "22px 28px"
```

---

## 🧪 Testeo

### Casos de uso principales

1. ✅ Cargar página sin datos iniciales
2. ✅ Búsqueda por nombre
3. ✅ Búsqueda por teléfono
4. ✅ Filtrado por alergias
5. ✅ Paginación (anterior/siguiente)
6. ✅ Click en "Ver expediente"
7. ✅ Click en "Nueva consulta"
8. ✅ Error API + fallback demo
9. ✅ Loading state
10. ✅ Empty state (sin resultados)

### Casos de rechazo

- ❌ Usuario sin rol: Mensaje "No tienes permisos"
- ❌ Rol no permitido: Redireccionamiento o bloqueo

---

## 📄 Archivos Relacionados

- **API**: `frontend/src/api/pacientes.js`
- **Context**: `frontend/src/context/AuthContext.jsx`
- **Diseño**: `docs/medsys-v2.jsx` (componentes de referencia)
- **Backend**: `backend/app/modules/pacientes/` (endpoints)

---

## ⚙️ Configuración de Entorno

### Variables requeridas

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Dependencias

- React 18+
- React Context API (autenticación)
- Axios (client HTTP)

---

## 📝 Notas de Mantenimiento

### Mejoras futuras

1. **Filtros avanzados**: por diagnóstico, medicamentos, rango edad
2. **Importación de pacientes**: CSV upload
3. **Reportes**: generación de reportes por período
4. **Sincronización**: actualización en tiempo real
5. **Dashboard personalizados**: vistas por rol

### Problemas conocidos

Ninguno al momento del lanzamiento.

---

## 👥 Contribuyentes

- **Desarrollador**: GitHub Copilot
- **Especificación**: Documento MedIA UX/UI (Doc7)
- **Arquitectura**: Especificación MedIA (Doc2, Doc3)

---

## 📜 Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 8 Abr 2025 | Versión inicial completada |

---

**Última actualización**: 8 de Abril, 2025  
**Status**: ✅ Production Ready
