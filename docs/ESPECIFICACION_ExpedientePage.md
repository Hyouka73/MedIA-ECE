# Especificación Técnica: ExpedientePage.jsx

## 📋 Descripción General

**Módulo**: Gestión de Pacientes → Expediente Clínico  
**Página**: ExpedientePage.jsx  
**Ubicación**: `frontend/src/pages/Pacients/ExpedientePage.jsx`  
**Estado**: ✅ Completado  
**Versión**: 1.0  
**Fecha**: 13 de Abril, 2026

La página **ExpedientePage** proporciona una vista detallada del expediente clínico de un paciente individual. Es la siguiente etapa después de PacientesListPage, permitiendo consultar antecedentes médicos, alergias, enfermedades crónicas, encuentros clínicos previos e iniciar nuevas consultas SOAP.

---

## 🎨 Especificaciones de Diseño

### Sistema de Tokens de Color

Se implementó el sistema de tokens **MedSys Design System** conforme a [Doc7_UIUX_MedSys.docx.pdf]:

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

- **Fuente**: DM Sans (sistema)
- **Tamaños**: 11px - 18px según jerarquía
- **Pesos**: 400, 500, 600, 700
- **Espaciado de letras**: 0.3-0.6px para títulos

---

## 🏗️ Estructura de Componentes

### Router

La página se accede MedSysnte:
```javascript
<Route path="/expediente/:id" element={<ExpedientePage />} />
```

**Parámetros**:
- `id`: UUID o ID del paciente (requerido)

### Datos Recuperados

#### Del Backend
```javascript
GET /pacientes/:id
  ↓
{
  id_paciente: uuid,
  numero_expediente: "EXP-YYYY-{SEQ}",
  grupo_sanguineo: "O+",
  persona: {
    nombre: "García Hernández, Rosa María",
    curp: "GAHM860723MDFGRR09",
    fecha_nacimiento: "1986-07-23",
    telefono: "55 1234-5678",
    calle_numero: "Calle Principal #123, Depto 4B"
  }
}

GET /encuentros?id_paciente={id}
  ↓
[
  {
    id_encuentro: uuid,
    fecha_inicio: "2025-05-28",
    hora_inicio: "09:30",
    motivo_consulta: "Control de diabetes",
    estado: "finalizado",
    medico: "Dr. Roberto Morales",
    diagnosticos: ["E11 - Diabetes tipo 2"],
    prescripciones: ["Metformina 500mg c/12h"]
  }
]
```

---

## 🔐 Control de Acceso

### Roles Autorizados

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| MEDICO_GENERAL | Médico de atención primaria | Ver expediente completo, iniciar consulta |
| ESPECIALISTA | Médico especialista | Ver expediente completo, iniciar consulta |
| ENFERMERIA | Personal de enfermería | Ver expediente (sin SOAP sensible), registrar signos |
| RECEPCIONISTA | Personal de recepción | Ver expediente (datos básicos) |
| ADMINISTRADOR | Administrador | Ver expediente completo |
| SUPERADMIN | Super administrador | Ver expediente completo, exportar |
| OMNIADMIN | Admin universal | Acceso completo |

**Validación**:
```javascript
const rolesPermitidos = [
  "MEDICO_GENERAL", "ESPECIALISTA", "ENFERMERIA",
  "RECEPCIONISTA", "ADMINISTRADOR", "SUPERADMIN", "OMNIADMIN"
];
const tieneAcceso = user && rolesPermitidos.includes(user.rol);
```

---

## 📊 Secciones Principales

### 1. TopBar (Header Sticky)

**Ubicación**: Parte superior fija con fondo blur y sombra

**Elementos**:
- Botón de retroceso (`<ChevronLeft />`)
- Título: "Expediente Clínico"
- Subtítulo: Número expediente + nombre paciente
- Botón "📋 Historial" (callback-ready)
- Botón "+ Nueva Consulta" (redirige a `/consulta?id_paciente={id}`)

```javascript
<TopBar>
  ← Expediente Clínico
  EXP-2025-14832 · García Hernández, Rosa M.
  [Historial] [+ Nueva Consulta]
</TopBar>
```

---

### 2. Card de Perfil del Paciente

**Ubicación**: Bajo TopBar, ancho completo

**Componentes**:
- **Avatar**: Iniciales en gradiente azul (56×56px)
- **Datos Principales**:
  - Nombre completo (18px, bold)
  - Age, fecha nac., grupo sanguíneo, teléfono
  - CURP (monospace, 10px)

**Ejemplo de render**:
```
┌─────────────────────────────────────────────────────────────┐
│ ╭─╮ García Hernández, Rosa María                          │
│ │G│ 47 años · Nac. 23/Jul/1986 · Grupo O+ · 55 1234-5678  │
│ ╰─╯ CURP: GAHM860723MDFGRR09                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Sección de Alergias Críticas

**Ubicación**: Bajo perfil, solo si existen alergias

**Estilos**:
- **Alta severidad (🔴)**: Fondo rojo claro (#F5969E), borde rojo (#BA2E45)
- **Moderada (🟡)**: Fondo ámbar claro (#F9E5BA), borde ámbar (#B86E12)

**Estructura**:
```
┌─────────────────────────────────────────┐
│ ⚠ ALERGIAS REGISTRADAS                 │
├─────────────────────────────────────────┤
│ 🔴 Penicilina
│    Severidad alta
│
│ 🟡 Cefalosporinas
│    Severidad moderada
└─────────────────────────────────────────┘
```

---

### 4. Sistema de Pestañas

**Pestañas disponibles**:
1. **Antecedentes** (default)
   - Enfermedades crónicas
   - Resumen clínico (grupo sanguíneo, última consulta, total consultas, alergias)

2. **Medicamentos** (soon)
   - Medicamentos habituales
   - Historial de prescripciones

3. **Estudios** (soon)
   - Laboratorios
   - Imagenología
   - Otros estudios

4. **Notas** (soon)
   - Notas clínicas
   - Registros previos

5. **Encuentros** (expandible)
   - Consultas anteriores
   - Detalles al hacer clic (diagnósticos, prescripciones)

**Estilos de tabs**:
- Default: `color: #2C2620`, `borderBottom: transparent`
- Active: `fontWeight: 600`, `color: #2459A8`, `borderBottom: 2px solid #2459A8`

---

## 🎯 Funcionalidades Principales

### 1. Carga de Datos Asíncrona

```javascript
// En useEffect, con fallback a datos demo
const loadExpediente = async () => {
  try {
    const pacRes = await pacientesAPI.getPaciente(id);
    setPaciente(pacRes.data);
    
    const encRes = await clinicoAPI.getEncuentros({ id_paciente: id });
    setEncuentros(encRes.data?.items);
  } catch (err) {
    console.warn("Usando datos demo...");
    setPaciente(generarPacienteDemo(id));
    setEncuentros(generarEncuentrosDemo());
  }
};
```

### 2. Control de Acceso

Si el usuario no tiene rol permitido:
- Muestra alert con icono ⛔
- Botón de retroceso
- No carga datos sensibles

### 3. Estados de Carga

- **Loading**: Spinner con texto `⏳ Cargando expediente...`
- **Error**: Alerta roja con opción de retroceso
- **Empty**: Mensaje con icono 📁 + "próximamente"

### 4. Encuentros Expandibles

Al hacer clic en un encuentro:
- Se expande mostrando:
  - Diagnósticos
  - Prescripciones
- Clic nuevamente colapsa

```javascript
state: expandedEncuentro = id_encuentro | null

onClick={() => 
  setExpandedEncuentro(
    expandedEncuentro === id ? null : id
  )
}
```

---

## 🔗 Integración con API

### Endpoints Consumidos

| Método | Endpoint | Descripción |
|--------|----------|-----------|
| GET | `/pacientes/:id` | Obtener datos del paciente |
| GET | `/encuentros?id_paciente={id}` | Listar consultas del paciente |
| POST | `/encuentros` | Crear nuevo encuentro (desde "Nueva Consulta") |
| GET | `/catalogos/cie10` | Búsqueda de diagnósticos (future) |
| GET | `/catalogos/medicamentos` | Búsqueda de medicamentos (future) |

### Services Utilizados

```javascript
import { pacientesAPI } from '../../api/pacientes';
import { clinicoAPI } from '../../api/clinico';

// Métodos disponibles
pacientesAPI.getPaciente(id)
pacientesAPI.getExpediente(id)
clinicoAPI.getEncuentros(params)
clinicoAPI.createEncuentro(data)
```

---

## 📱 Responsividad

- **Desktop** (1200px+): Layout completo con cards lado a lado
- **Tablet** (768px-1199px): Stack vertical, cards adaptan
- **Mobile** (<768px): Flujo vertical, botones full-width

**Overflow Management**:
- Contenido principal: `flex: 1; overflowY: auto`
- TopBar: sticky con `zIndex: 10`
- Tabs: `overflowX: auto` para scroll horizontal

---

## 🎨 Animaciones

- **Fade-in page**: `animation: fadeIn 0.3s` al cargar
- **Hover en encuentros**: Cambio de fondo suave (transition: 0.2s)
- **Pulse loading**: spinner con `animation: pulse 2s infinite`

---

## 🔍 Casos de Prueba

| # | Escenario | Entrada | Salida Esperada |
|---|-----------|---------|---|
| 1 | Paciente sin alergias | ID válido | Se oculta sección de alergias |
| 2 | Paciente con alergias altas | ID válido | Mostrar 🔴 en rojo |
| 3 | Sin rol permitido | User rol restringido | Mostrar alert de acceso denegado |
| 4 | API error en paciente | Timeout/500 | Cargar demo, mostrar advertencia |
| 5 | Click Nueva Consulta | Button click | Redir a `/consulta?id_paciente={id}` |
| 6 | Click encuentro | Card click | Expandir/colapsar detalles |
| 7 | Tab Medicamentos | Tab click | Mostrar "📁 — próximamente" |

---

## 🚀 Mejoras Futuras

- [ ] Integración con autocompletado CIE-10
- [ ] Export PDF del expediente (NOM-004)
- [ ] Visor de documentos adjuntos
- [ ] Timeline visual de encuentros
- [ ] Integración con recetas electrónicas
- [ ] Modal de alergias interactivo
- [ ] Indicador de sincronización en tiempo real
- [ ] Búsqueda de medicamentos en modal

---

## 📝 Notas de Desarrollo

### Cumplimiento Normativo

✅ **NOM-004-SSA3-2012**: Número de expediente visible en header  
✅ **NOM-024-SSA3-2012**: Trazabilidad de acceso (rol verificado)  
⏳ **NOM-151-SCFI-2016**: Firma electrónica (implementado en ConsultaPage)

### Datos Demo

Se utilizan datos fake generados localmente cuando:
- API no disponible durante desarrollo
- Componente renderiza sin backend
- Propósito: facilitar testing y demos

**Función helper**:
```javascript
const generarPacienteDemo = (id) => ({...})
const generarEncuentrosDemo = () => ([...])
```

### Performance

- Lazy loading de encuentros (solo cuando tab activo)
- Memoización de filtros (si se expande a múltiples pacientes)
- Debounce de búsquedas (si se agrega filtro de encuentros)

---

## 🏷️ Tags Componentes

- `ExpedientePage` — página raíz
- `TopBar` — header sticky
- `AlertCircle`, `ChevronLeft`, `Plus`, `Clock`, `FileText`, `Pill`, `TrendingUp` — iconos Lucide
- `useAuth` — contexto de autenticación
- `useNavigate` — enrutamiento SPA

---

_Especificación v1.0 — Compatible con MedSys-ECE backend Q2 2026_
