me

**SISTEMA MedSys**

Expediente Clínico Electrónico — Distrito de Salud I, Chiapas

**DOCUMENTO 7**

**Diseño UI/UX del Sistema**

*Paleta de colores · Layout · Módulos · Componentes shadcn/ui · NOM-004/024/151*

*Usar el siguiente archivo como ejemplo, revisar correctamente cada campo, los requisitos normativos son importantes.*

[https://drive.google.com/file/d/12SyboAHt\_dO4nn1KkR67psGq9rQOmMGJ/view?usp=sharing](https://drive.google.com/file/d/12SyboAHt_dO4nn1KkR67psGq9rQOmMGJ/view?usp=sharing) 

| Fuente tipográfica | DM Sans (400, 500, 600, 700, 800\) |
| :---- | :---- |
| **Framework UI** | React 18 \+ Vite \+ shadcn/ui \+ Tailwind CSS |
| **Ciclo escolar** | 8° Semestre IDTS — UNACH, Enero–Junio 2026 |

# **1\. Paleta de Colores**

La paleta de colores de MedSys está diseñada para uso en contexto hospitalario con turnos de 8 horas o más. Las decisiones cromáticas son respuestas directas a los requisitos normativos y de ergonomía visual del prototipo medsys-v2.jsx.

## **1.1 Tokens de Color Principales**

| Hex | Nombre | Uso principal | Justificación |
| :---- | :---- | :---- | :---- |
| \#EDEBE6 | **Fondo base cálido** | Color de página principal | *Temperatura cálida reduce fatiga visual en turnos largos vs. fondo blanco puro. Decisión validada en prototipo — NO MODIFICAR* |
| \#FFFFFF | **Superficie cards** | Tarjetas, formularios, paneles | *Contraste máximo sobre fondo cálido para contenido de lectura activa* |
| \#1B4F8A | **Azul institucional** | Header, botones primarios, acentos | *Identidad institucional SSA. Contraste WCAG AA con texto blanco* |
| \#2D8653 | **Verde éxito / firma** | Firma electrónica, estados exitosos | *Señal de acción completada. Evita verde saturado que fatiga la vista* |
| \#D97706 | **Ámbar advertencia** | Alertas moderadas, validaciones | *Advertencia visible sin alarma clínica. Usada en alergias moderadas* |
| \#DC2626 | **Rojo crítico / alerta** | Alergias graves, errores críticos | *Señal de riesgo clínico inMedSysto. Consistente con semáforo de salud* |
| \#1E293B | **Texto principal** | Texto de formularios y contenido | *Near-black sobre fondo cálido — más cómodo que negro puro \#000000* |
| \#64748B | **Texto secundario** | Labels, subtítulos, meta-info | *Jerarquía visual sin saturar la pantalla de información secundaria* |

## **1.2 Tokens de Color del Sidebar**

| Hex | Nombre | Uso | Nota |
| :---- | :---- | :---- | :---- |
| \#101E33 | **Sidebar fondo** | Fondo del menú lateral | *Azul marino oscuro. Contraste con contenido principal sin ser negro puro* |
| \#162540 | **Sidebar hover** | Estado hover de ítems del menú | *Diferenciación sutil del estado activo sin parpadeo agresivo* |
| \#F5F2EC | **Superficie alterna** | Fondos secundarios, zebra tables | *Mantiene familia cálida en superficies secundarias* |

## **1.3 Colores Semánticos del Sistema**

| Contexto | Color | Ejemplo de uso |
| :---- | :---- | :---- |
| Alergia ALTA severidad | \#DC2626 — Rojo crítico | Badge rojo con icono de advertencia en expediente y TopBar de consulta |
| Alergia MODERADA severidad | \#D97706 — Ámbar | Badge ámbar en lista de alergias del expediente |
| Barrera lingüística detectada | \#D97706 — Ámbar | Callout de advertencia en módulo de encuentros cuando id\_lengua\_materna \!= Español |
| Encuentro clínico ABIERTO | \#1B4F8A — Azul | Badge en lista de pacientes del dashboard del médico |
| Nota FIRMADA (inmutable) | \#2D8653 — Verde | Sello de firma en vista de nota \+ badge en historial |
| Referencia URGENTE | \#DC2626 — Rojo | Badge urgente en bandeja de referencias recibidas |
| Incidente CRITICO | \#DC2626 — Rojo parpadeante | Indicador en sidebar para AUDITOR y SUPERADMIN |

# **2\. Tipografía**

La fuente seleccionada para MedSys es DM Sans, una tipografía sans-serif diseñada para alta densidad de información. Se importa desde Google Fonts y se usa en cinco pesos para establecer jerarquía visual.

| Peso | Nombre del peso | Uso principal | Contexto específico |
| :---- | :---- | :---- | :---- |
| 400 — Regular | Normal | Texto de párrafos, instrucciones | Cuerpo de nota SOAP, descripciones de campos |
| 500 — Medium | Medium | Labels de formularios, items de lista | Etiquetas de campos, items del sidebar |
| 600 — SemiBold | SemiBold | Subtítulos de sección, badges | Encabezados de tarjetas, nombres de módulos |
| 700 — Bold | Bold | Títulos de pantalla, datos críticos | Nombre del paciente, diagnóstico principal |
| 800 — ExtraBold | ExtraBold | Títulos de vista principales | Encabezado del TopBar, nombre del sistema |

Importación en index.html:

\<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800\&display=swap" rel="stylesheet"\>

# **3\. Layout del Sistema**

## **3.1 Estructura General de la Interfaz**

MedSys usa un layout de tres zonas fijas: Sidebar izquierdo (ancho fijo 220px), TopBar horizontal superior (altura fija 56px) y Área de contenido principal (ocupa el espacio restante, scroll vertical).

| SIDEBAR — Especificaciones |
| :---- |
| Ancho: 220px fijo (colapsable a 56px en resoluciones \< 1280px) |
| Fondo: \#101E33 (azul marino oscuro) |
| Organización: 2 grupos — CLÍNICA y SISTEMA |
| Grupo CLÍNICA: Dashboard, Pacientes, Expediente, Consulta, Referencias, Documentos |
| Grupo SISTEMA: Auditoría (AUDITOR+), Administración (ADMIN+), Seguridad (SUPERADMIN) |
| Footer del sidebar: Avatar \+ nombre del usuario \+ badge de rol \+ indicador de conexión |
| Items con tooltip al colapsar (nombre del módulo al hacer hover) |
| Item activo: fondo \#162540 \+ borde izquierdo 3px \#1B4F8A |
| El rol del usuario está siempre visible en el sidebar (decisión del prototipo — NO CAMBIAR) |
|  |

| TOPBAR — Especificaciones |
| :---- |
| Altura: 56px fijo |
| Fondo: \#FFFFFF con border-bottom 1px \#DAD4CC |
| Zona izquierda: breadcrumb de la vista actual \+ (en módulo Consulta) número de expediente visible |
| Zona central: (solo en módulo Consulta) CLUES \+ nombre del establecimiento \+ turno |
| Zona derecha: notificaciones \+ avatar del usuario \+ botón de cierre de sesión |
| NOM-004: el número de expediente debe estar visible en el TopBar desde el inicio de la consulta |
| NOM-024: CLUES y nombre de la unidad deben aparecer en el header de notas imprimibles |
|  |

## **3.2 Reglas de Responsividad**

| Breakpoint | Resolución | Comportamiento |
| :---- | :---- | :---- |
| Desktop | \>= 1280px | Layout completo. Sidebar expandido 220px. Todas las columnas de tablas visibles |
| Laptop | 1024px–1279px | Sidebar reducido a 180px. Cards en grid 2 columnas |
| Tablet | 768px–1023px | Sidebar colapsado a 56px con iconos. Contenido a 1 columna |
| Móvil | \< 768px | Sidebar oculto (drawer hamburguesa). Solo para consultas emergentes — no diseño principal |

*Nota: MedSys está diseñado principalmente para uso en computadoras de escritorio y laptops en las unidades médicas. El diseño responsivo para móvil es funcional pero no es el caso de uso principal.*

# **4\. Módulos y Sus Pantallas**

## **4.1 Dashboard (Pantalla de Inicio — Condicional por Rol)**

El dashboard es la primera pantalla que ve el usuario después del login. Su contenido es completamente diferente según el rol, evitando mostrar información irrelevante o no autorizada.

| Rol | Widgets y contenido del Dashboard |
| :---- | :---- |
| MEDICO\_GENERAL / ESPECIALISTA | Cards: (1) Pacientes del día con encuentro activo, (2) Encuentros abiertos sin firma, (3) Alertas de alergia de pacientes en cola, (4) Referencias pendientes de respuesta. Acceso rápido a última consulta. |
| ENFERMERIA | Lista de pacientes en espera de registro de signos vitales. Ordenada por hora de llegada. Badge de alerta si hay paciente esperando \> 30 minutos. |
| ADMINISTRADOR | Cards: usuarios activos (total, nuevos hoy), configuraciones pendientes, establecimientos bajo su gestión, alertas de cuentas sin 2FA activo. |
| AUDITOR\_SEGURIDAD | Redirige directo a la bitácora de incidentes activos. No muestra widgets clínicos. Top de tipos de evento más frecuentes en las últimas 24h. |
| SUPERADMIN | Métricas del sistema: usuarios activos ahora, carga de BD, top de endpoints más llamados, incidentes activos, alertas de Azure Monitor pendientes. |

## **4.2 Módulo Pacientes**

El buscador de pacientes es la puerta de entrada a todos los flujos clínicos. Incluye tres pantallas principales:

### **Pantalla: Buscador de Pacientes**

* Barra de búsqueda principal con búsqueda por nombre, primer apellido, número de expediente o CURP

* Filtros de refinamiento: municipio, localidad, lengua materna (para clínicas con alta población indígena)

* Resultados en tabla con columnas: nombre completo, fecha de nacimiento, expediente, última consulta, alerta de alergia (icono rojo si tiene alergias de severidad alta)

* Botón destacado: Registrar nuevo paciente

### **Pantalla: Registro de Nuevo Paciente**

* Formulario en dos columnas para desktop

* Campos obligatorios: nombre, primer apellido, fecha de nacimiento, sexo, localidad INEGI, lengua materna

* Campos opcionales: CURP, segundo apellido, teléfono, dirección estructurada (calle, colonia, CP) o referencia geográfica libre

* Selector de localidad con autocompletado: busca en cat\_localidades filtrado por municipio. Muestra nombre \+ tipo (URBANA/RURAL)

* El campo lengua materna activa automáticamente la alerta de barrera lingüística si el valor no es 'Español'

### **Pantalla: Perfil del Paciente**

* Header con: nombre completo, edad calculada automáticamente, sexo, número de expediente

* Badge de alerta de alergia en el header si tiene alergias de severidad ALTA

* Alerta de barrera lingüística si lengua\_materna \!= Español

* Secciones: Datos generales, Alergias (con jerarquía visual por severidad), Acciones: Nueva consulta, Ver expediente

## **4.3 Módulo Expediente**

El expediente clínico es la historia médica completa del paciente. Se organiza en tabs para diferenciar los tipos de antecedentes.

### **Tabs del Módulo Expediente**

| Tab | Contenido |
| :---- | :---- |
| Heredofamiliares | Antecedentes de enfermedades en familia directa (padre, madre, hermanos, abuelos). Campo de selección múltiple \+ notas libres. |
| Patológicos | Enfermedades previas del paciente: diabetes, hipertensión, cirugías, hospitalizaciones, traumatismos. Fecha y descripción por episodio. |
| No Patológicos | Hábitos: tabaquismo, alcoholismo, actividad física, alimentación. Inmunizaciones completas o parciales. |
| Ginecoobstétricos | Solo visible si sexo \= F. Menarca, FUR, gestas, partos, cesáreas, abortos, método anticonceptivo. Requerido por NOM-004. |
| Inmunizaciones | Historial de vacunas: tipo, fecha de aplicación, próxima dosis. Esquema de vacunación IMSS/SSA. |

## **4.4 Módulo Consulta — Stepper SOAP**

El stepper es el componente central del sistema. Tiene 5 pasos secuenciales con estados visuales de completitud. El diseño del stepper es una decisión de UX correcta del prototipo que NO debe modificarse.

| Paso | Nombre | Contenido del paso | Actor principal |
| :---- | :---- | :---- | :---- |
| 1 | Signos Vitales | Tensión arterial sistólica/diastólica, FC, temperatura, peso, talla, saturación O2. Timestamp automático al guardar. | Enfermería |
| 2 | Subjetivo (S) | Motivo de consulta y síntomas referidos. Textarea con contador de caracteres. Timestamp automático al avanzar. | Médico |
| 3 | Objetivo (O) | Exploración física estructurada: general, cabeza y cuello, tórax, abdomen, extremidades. Hallazgos positivos y negativos relevantes. | Médico |
| 4 | Análisis / CIE-10 | Diagnóstico con autocompletado CIE-10. Input con búsqueda por código (ej: E11) o descripción (ej: diabetes). Muestra hasta 10 sugerencias. Diagnóstico principal \+ hasta 4 secundarios. | Médico |
| 5 | Plan y Firma | Plan terapéutico, prescripción de medicamentos del Cuadro Básico, indicaciones al paciente. Botón de firma con validación TOTP. Sello post-firma. | Médico |

| ESTADOS DEL STEPPER — Indicadores Visuales |
| :---- |
| Pendiente: círculo gris con número de paso. El usuario no ha iniciado este paso. |
| En progreso: círculo azul primario (\#1B4F8A) pulsante. El usuario está en este paso. |
| Completado: círculo verde (\#2D8653) con checkmark. Datos guardados en BD. |
| Error: círculo rojo (\#DC2626) con X. Datos inválidos o guardado fallido. |
| Firmado (Paso 5): sello especial verde con candado y timestamp. Estado inmutable. |
| Línea conectora entre pasos: gris (\#DAD4CC) cuando siguiente paso pendiente, azul cuando completo. |
|  |

## **4.5 Sello Visual Post-Firma — NOM-151**

Después de que el médico confirma la firma con contraseña \+ TOTP, la nota queda inmutable y el sistema muestra el siguiente sello visual en la pantalla y en el PDF generado:

| SELLO DE FIRMA ELECTRÓNICA — Especificación Visual |
| :---- |
| Componente: Card con fondo verde claro (\#EAF6F0), borde izquierdo 4px verde (\#2D8653) |
| Icono: checkmark circular verde grande (24px) a la izquierda |
| Línea 1 — Bold: 'Nota médica firmada electronicamente' |
| Línea 2: 'Firmado · \[fecha DD/MMM/YYYY\] · \[hora HH:MM:SS CST\]' |
| Línea 3: 'SHA-256: \[primeros 32 caracteres del hash\]...' |
| Línea 4: 'Dr./Dra. \[Nombre completo\] · Cédula profesional: \[numero\]' |
| Línea 5: '\[CLUES del establecimiento\] · \[Nombre de la unidad médica\]' |
| Botones: 'Descargar PDF de la nota' (primario) | 'Ver expediente completo' (secundario) |
| Estado del stepper: todo el componente stepper queda deshabilitado visualmente (opacity 0.6) con badge 'FIRMADA' superpuesto |
|  |

## **4.6 Módulo Referencias**

Implementa el Sistema de Referencia y Contrarreferencia (SRC) normado. Tiene tres vistas:

### **Vista: Emitir Referencia**

* Selección del establecimiento destino con buscador por nombre o CLUES

* Selector de especialidad con validación en tiempo real contra establecimientos\_especialidades del destino

* Nivel de urgencia: toggle URGENTE / PROGRAMADA con diferenciación visual clara

* Diagnóstico CIE-10 de referencia con el mismo autocompletado del módulo Consulta

* Campo de motivo clínico (textarea, máximo 500 caracteres)

* Botón: Emitir referencia con confirmación modal

### **Vista: Bandeja de Referencias Recibidas**

* Lista de referencias recibidas con: folio, establecimiento origen, paciente, especialidad, urgencia, fecha, estado

* Filtros: estado (PENDIENTE/ACEPTADA/ATENDIDA/CERRADA), urgencia, fecha

* Badge URGENTE en rojo para referencias urgentes sin aceptar

* Acciones: Aceptar referencia, Ver detalle, Responder (contrarreferencia)

### **Vista: Contrarreferencia**

* Formulario para responder al establecimiento emisor

* Campos: diagnóstico definitivo (CIE-10), tratamiento instaurado, indicaciones de seguimiento, fecha de próxima cita sugerida

## **4.7 Módulo Auditoría**

Accesible para AUDITOR\_SEGURIDAD, ADMINISTRADOR y SUPERADMIN. Tiene dos sub-vistas:

### **Vista: Bitácora de Accesos**

* Tabla paginada con 20 registros por página

* Columnas: timestamp, usuario, acción, módulo, resultado (éxito/error), IP, nivel de severidad

* Filtros: rango de fechas, tipo de evento, usuario específico, nivel de severidad, módulo

* Exportar a PDF (genera reporte forense con encabezado institucional)

* Los registros son de solo lectura. No hay botones de edición o eliminación (inmutabilidad)

### **Vista: Incidentes de Seguridad**

* Lista de incidentes con: folio, tipo, severidad (badge de color), estado, fecha de apertura, responsable

* Estado CRÍTICO/ABIERTO: badge rojo parpadeante para máxima visibilidad

* Vista de detalle del incidente: timeline completo de estados, acciones registradas, causa raíz (cuando disponible)

* Solo SUPERADMIN puede crear, actualizar y cerrar incidentes

## **4.8 Módulo Administración**

* CRUD completo de usuarios: alta, edición de rol, activar/desactivar cuenta, forzar cambio de contraseña

* Tabla de usuarios con: nombre, rol, establecimiento, último acceso, estado (activo/inactivo/bloqueado)

* Configuración de especialidades por establecimiento (activa/inactiva con fecha de alta)

* Vista de establecimientos: CLUES, nombre, nivel de atención, municipio, especialidades activas

## **4.9 Módulo Seguridad (Solo SUPERADMIN)**

* Lista de sesiones activas en tiempo real: usuario, IP, hora de inicio, tiempo de expiración del JWT

* Botón por sesión: Invalidar sesión (agrega token a sesiones\_invalidas)

* Lista de cuentas bloqueadas con motivo y fecha de bloqueo

* Acciones masivas: Invalidar todas las sesiones (logout forzado de todo el sistema)

# **5\. Componentes shadcn/ui — Especificaciones**

shadcn/ui provee los componentes base que se personalizan con los tokens de color de MedSys. Los siguientes componentes son los más relevantes para el sistema.

| Componente shadcn/ui | Uso en MedSys | Personalización |
| :---- | :---- | :---- |
| Button | Todas las acciones del sistema | Variantes: primary (\#1B4F8A), success (\#2D8653), destructive (\#DC2626), ghost, outline |
| Input | Formularios de pacientes, usuarios, filtros | Border focus: \#1B4F8A, error: \#DC2626. Font: DM Sans 13px |
| Combobox / Command | Autocompletado CIE-10 y medicamentos | Dropdown con búsqueda. Muestra código \+ descripción. Max 10 resultados. Delay 300ms |
| Badge | Roles, estados, severidades, urgencias | Variantes de color mapeadas a tokens semánticos del sistema |
| Alert / Callout | Alerta de alergia, barrera lingüística, avisos normativos | Variantes: info (azul), warning (ámbar), critical (rojo). Border izquierdo de color semántico |
| Table | Listados de pacientes, bitácora, referencias | Sticky header, hover de fila (\#EEF3FB), paginación integrada |
| Dialog / Modal | Confirmación de firma, alta de usuario, detalle de incidente | Overlay semitransparente. Foco bloqueado dentro del modal. |
| Tabs | Módulo Expediente (4 tipos de antecedentes) | Border-bottom activo: \#1B4F8A. Font: DM Sans 600 |
| Select | Municipio, especialidad, rol, nivel de urgencia | Estilizado con tokens. Placeholder con texto descriptivo |
| Skeleton | Estado de carga de listas y cards | Color: \#E2DDD4. Animación pulse. Altura proporcional al contenido real |
| Toast / Sonner | Confirmaciones de éxito, errores de API | Posición: bottom-right. Auto-dismiss 4s. Variantes éxito/error/info |

# **6\. Estados de Componentes**

Cada componente interactivo en MedSys tiene cuatro estados bien definidos. La consistencia en los estados reduce la carga cognitiva del usuario médico.

| Estado | Indicador visual | Ejemplo en MedSys | Acción del usuario |
| :---- | :---- | :---- | :---- |
| Loading / Cargando | Skeleton animation \+ spinner en botón | Cargando lista de pacientes, guardando nota SOAP | Esperar. Input deshabilitado durante carga |
| Error | Border rojo \+ mensaje debajo del campo \+ Toast de error | CIE-10 no encontrado, campo requerido vacío, error de red | Corregir el campo o reintentar la acción |
| Empty / Vacío | Ilustración simple \+ mensaje descriptivo \+ CTA | Sin pacientes en espera, sin referencias recibidas | El CTA sugiere la acción posible |
| Success / Exitoso | Toast verde \+ cambio de estado en el componente | Firma completada, paciente registrado, referencia emitida | Continuar con el flujo o navegar al siguiente paso |

# **7\. Requisitos Normativos en la UI**

Los siguientes requisitos son mandatorios por normativa. No son preferencias de diseño. Cada uno está derivado de NOM-004, NOM-024 o NOM-151 y fue identificado en las notas técnicas pendientes (NOTAS\_PENDIENTES.md).

| Requisito normativo | Implementación en UI | Norma | Estado |
| :---- | :---- | :---- | :---- |
| Número de expediente visible en TopBar de consulta | Mostrar 'EXP-YYYY-NNNNN' en zona izquierda del TopBar desde el momento en que se abre la vista Consulta | NOM-004 art. 5.1 | PENDIENTE de implementar |
| Autocompletado CIE-10 en campo diagnóstico | Reemplazar el textarea libre con Combobox conectado a cat\_cie10. Búsqueda por código y por descripción en español | NOM-024-SSA3-2012 | PENDIENTE de implementar |
| CLUES y nombre del establecimiento en notas imprimibles | Incluir en el header del PDF generado: CLUES, nombre de la unidad, turno, consultorio, fecha de impresión | NOM-024-SSA3-2012 | PENDIENTE de implementar |
| Timestamp en cada paso del stepper SOAP | Guardar automáticamente TIMESTAMPTZ al avanzar cada paso. Mostrar hora en la vista comprimida del stepper | NOM-004 art. 5.10 | PENDIENTE de implementar |
| Sello visual de inmutabilidad post-firma | Componente card con SHA-256, fecha, hora, médico, cédula y CLUES visible en pantalla y en PDF | NOM-151-SCFI-2016 | PENDIENTE de implementar |
| Vista de impresión/PDF de nota finalizada | Botón 'Descargar nota' que genera PDF formateado con todos los campos obligatorios de NOM-004 | NOM-004 / NOM-151 | PENDIENTE de implementar |

| DECISIONES DE DISEÑO QUE NO SE MODIFICAN |
| :---- |
| Fondo cálido \#EDEBE6 — reduce fatiga visual en turnos 8h+. Decisión validada. |
| Login con flujo 2FA de 6 dígitos — cumple NOM-024. Mantener exactamente el diseño del prototipo. |
| Alergias con jerarquía visual por severidad (rojo/ámbar) — mejor que ECE real IMSS. |
| Sidebar con grupos Clínica/Sistema \+ rol del usuario siempre visible. |
| Stepper SOAP con estados de completitud — mejor UX que tabs sin estado. |
| Fuente DM Sans — correcta para densidad de información médica. |
|  |

