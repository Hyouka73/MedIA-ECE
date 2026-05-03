

**SISTEMA MedSys**

Expediente Clínico Electrónico — Distrito de Salud I, Chiapas

**DOCUMENTO 5**

**Seeds y Catálogos del Sistema**

*INEGI · DGIS-OMS · INALI · SSA · Roles y Permisos CRUD*

| Tarea asignada | Persona 5 — Responsable de Seeds |
| :---- | :---- |
| **Versión** | 1.0 — Catálogos iniciales |
| **Ciclo escolar** | 8° Semestre IDTS — UNACH, Enero–Junio 2026 |

# **1\. Inventario de Catálogos del Sistema**

MedSys requiere 11 catálogos que deben estar disponibles en la base de datos antes de que el sistema sea usable. Se dividen en tres categorías: catálogos externos de instituciones gubernamentales, catálogos del sistema (seeds fijos) y datos iniciales de configuración.

| Catálogo | Fuente oficial | Registros aprox. | Frecuencia actualización | Responsable |
| :---- | :---- | :---- | :---- | :---- |
| cat\_estados | INEGI — Marco Geoestadístico | 32 estados | Muy rara (cambios territoriales) | Persona 5 |
| cat\_municipios | INEGI — clave 07 Chiapas | 124 municipios | Rara (nuevos municipios) | Persona 5 |
| cat\_localidades | INEGI — localidades urbanas y rurales Chiapas | \~5,000 localidades | Censal (cada 5 años) | Persona 5 |
| cat\_cie10 | DGIS / OMS — versión vigente | \~14,400 códigos | Publicación DGIS (irregular) | Persona 5 |
| cat\_medicamentos | Cuadro Básico SSA | \~900 medicamentos | Anual (SSA publica lista) | Persona 5 |
| cat\_lenguas\_indigenas | INALI — variantes Chiapas | \~30 variantes activas | Decenal (con INEGI) | Persona 5 |
| cat\_especialidades\_medicas | Listado normado SSA/CONASUMED | \~60 especialidades | Rara (nuevas especialidades) | Persona 5 |
| cat\_modulos | Seed fijo del sistema (8 módulos) | 8 registros | Nunca (cambio requiere release) | Equipo dev |
| roles | Seed fijo (6 roles) | 6 registros | Nunca | Equipo dev |
| permisos\_rol | Seed — matriz CRUD completa | \~192 permisos | Nunca (cambio \= release) | Equipo dev |
| usuario superadmin | Seed inicial único | 1 registro | Una sola vez | Persona 5 \+ Dev Lead |

# **2\. Catálogos INEGI — Geográficos**

## **2.1 cat\_estados — 32 estados de la República**

Fuente: INEGI Marco Geoestadístico Nacional. URL de descarga: https://www.inegi.org.mx/app/biblioteca/ficha.html?upc=702825292463

Para MedSys solo es estrictamente necesario el registro del estado de Chiapas (clave '07'), aunque se siembra el catálogo completo para futuras expansiones del sistema a otros distritos sanitarios.

\-- 02\_seeds\_geograficos.sql  
\-- Fragmento: cat\_estados (primeros registros)  
INSERT INTO cat\_estados (clave\_estado, nombre\_estado) VALUES  
  ('01', 'Aguascalientes'),  
  ('02', 'Baja California'),  
  ('03', 'Baja California Sur'),  
  \-- ... (registros 04-06)  
  ('07', 'Chiapas'),  
  \-- ... (registros 08-32)  
  ('32', 'Zacatecas')  
ON CONFLICT (clave\_estado) DO NOTHING;

## **2.2 cat\_municipios — 124 municipios de Chiapas**

Fuente: INEGI Marco Geoestadístico, capa de municipios, filtrado por clave\_estado \= '07'. Chiapas tiene 124 municipios con sus respectivas claves de 3 dígitos (001 a 124). La secuencia exacta varía por el orden de incorporación histórica.

\-- Fragmento cat\_municipios Chiapas (clave\_estado \= '07')  
INSERT INTO cat\_municipios (clave\_municipio, clave\_estado, nombre\_municipio) VALUES  
  ('001', '07', 'Acacoyagua'),  
  ('002', '07', 'Acala'),  
  ('003', '07', 'Acapetahua'),  
  ('004', '07', 'Altamirano'),  
  ('005', '07', 'Amatan'),  
  \-- ... continua hasta municipio 124  
  ('101', '07', 'Tuxtla Gutierrez'),  \-- Sede Distrito I  
  \-- ...  
  ('124', '07', 'Zinacantán')  
ON CONFLICT (clave\_municipio) DO NOTHING;

## **2.3 cat\_localidades — Localidades urbanas y rurales de Chiapas**

Fuente: INEGI Catálogo de Localidades (ITER). Solo se siembran las localidades del estado 07 (Chiapas). El archivo ITER se descarga en formato DBF o CSV desde: https://www.inegi.org.mx/app/descarga/?ti=6

**Procedimiento de conversión desde CSV a SQL:**

1. Descargar ITER\_07XLSX10.xlsx desde INEGI (última versión del Censo 2020\)

2. Abrir en Excel o Python/pandas, filtrar por ENT \= '07'

3. Extraer columnas: CVE\_LOC (clave\_localidad), CVE\_MUN (clave\_municipio), NOM\_LOC (nombre\_localidad), TIPO (tipologia: urbana/rural basada en POBTOT \> 2500\)

4. Generar el INSERT con Python:

\# scripts/seeds/convert\_localidades.py  
import pandas as pd

df \= pd.read\_excel('ITER\_07XLSX10.xlsx')  
df \= df\[df\['ENT'\] \== 7\]

with open('03\_seeds\_localidades.sql', 'w') as f:  
    f.write('INSERT INTO cat\_localidades (clave\_localidad, clave\_municipio, nombre\_localidad, tipo) VALUES\\n')  
    for \_, row in df.iterrows():  
        clave\_loc \= f"{row\['ENT'\]:02d}{row\['MUN'\]:03d}{row\['LOC'\]:04d}"  
        clave\_mun \= f"{row\['MUN'\]:03d}"  
        nombre \= str(row\['NOM\_LOC'\]).replace("'", "''")  
        tipo \= 'URBANA' if row\['POBTOT'\] \> 2500 else 'RURAL'  
        f.write(f"  ('{clave\_loc}', '{clave\_mun}', '{nombre}', '{tipo}'),\\n")  
    f.write('ON CONFLICT (clave\_localidad) DO NOTHING;')

print(f'Localidades generadas: {len(df)}')

# **3\. Catálogos Clínicos — DGIS, OMS, SSA, INALI**

## **3.1 cat\_cie10 — Diagnósticos CIE-10 (DGIS/OMS)**

Fuente oficial: Dirección General de Información en Salud (DGIS) — Secretaría de Salud. La versión vigente para México es CIE-10 Modificación Clínica. El archivo se descarga desde: https://www.gob.mx/salud/acciones-y-programas/estadisticas-y-sistemas-de-informacion

Este catálogo es crítico para la normatividad: la NOM-024-SSA3-2012 exige que todos los diagnósticos en el expediente clínico electrónico usen el código CIE-10 oficial vigente. El campo diagnóstico de la UI debe usar autocompletado conectado a este catálogo (gap identificado en NOTAS\_PENDIENTES.md).

\-- Fragmento cat\_cie10  
INSERT INTO cat\_cie10 (id\_cie10, codigo\_cie, descripcion) VALUES  
  (1,    'A00',   'Colera'),  
  (2,    'A00.0', 'Colera debida a Vibrio cholerae 01, biotipo cholerae'),  
  (3,    'A00.1', 'Colera debida a Vibrio cholerae 01, biotipo El Tor'),  
  (4,    'A00.9', 'Colera, no especificada'),  
  \-- ... 14,400+ registros  
  (5789, 'E11',   'Diabetes mellitus tipo 2'),  
  (5790, 'E11.0', 'Diabetes mellitus tipo 2 con coma'),  
  (5791, 'E11.9', 'Diabetes mellitus tipo 2 sin complicaciones'),  
  \-- ... continua  
  (14400,'Z99.9', 'Dependencia de dispositivo no especificado')  
ON CONFLICT (id\_cie10) DO NOTHING;

Procedimiento de conversión desde archivo DGIS:

5. Descargar archivo CIE-10 de DGIS (formato XLS o CSV)

6. Limpiar caracteres especiales y tildes problemáticas

7. Ejecutar script Python que genera los INSERTs por lotes de 1000 registros

8. Copiar al directorio db/migrations/ con nombre 03\_seeds\_cie10.sql

## **3.2 cat\_medicamentos — Cuadro Básico SSA**

Fuente: Secretaría de Salud — Cuadro Básico y Catálogo de Medicamentos del Sector Salud. Disponible en: https://www.csg.gob.mx/descargas/pdf/priorizacion/cuadro-basico/med/catalogo/2022/EDICION\_2022\_CBCM.pdf

\-- Fragmento cat\_medicamentos (Cuadro Básico SSA)  
INSERT INTO cat\_medicamentos (id\_medicamento, codigo\_medicamento\_ssa, nombre\_generico) VALUES  
  (gen\_random\_uuid(), '010.000.0193.00', 'Acetaminofen (Paracetamol)'),  
  (gen\_random\_uuid(), '010.000.0280.00', 'Aciclovir'),  
  (gen\_random\_uuid(), '010.000.0313.00', 'Acido Acetilsalicilico'),  
  (gen\_random\_uuid(), '010.000.1736.00', 'Albendazol'),  
  (gen\_random\_uuid(), '010.000.0001.00', 'Amikacina'),  
  \-- ... \~900 medicamentos del Cuadro Basico  
  (gen\_random\_uuid(), '010.000.5567.00', 'Metformina')  
ON CONFLICT (codigo\_medicamento\_ssa) DO NOTHING;

## **3.3 cat\_lenguas\_indigenas — INALI, variantes de Chiapas**

Fuente: Instituto Nacional de Lenguas Indígenas (INALI) — Catálogo de lenguas indígenas nacionales. Chiapas concentra más de 12 grupos etnolingüísticos. Este catálogo es crítico para la seguridad del paciente: activa alerta de barrera lingüística en el módulo de encuentros clínicos.

\-- cat\_lenguas\_indigenas — Variantes relevantes en Chiapas  
INSERT INTO cat\_lenguas\_indigenas (id\_lengua, variante\_especifica) VALUES  
  (1,  'Espanol'),  
  (2,  'Tseltal (tseltal del norte)'),  
  (3,  'Tseltal (tseltal del sur)'),  
  (4,  'Tsotsil (tsotsil de Simojovel)'),  
  (5,  'Tsotsil (tsotsil de Zinacatan)'),  
  (6,  'Chol (chol de Tila)'),  
  (7,  'Chol (chol de Tumbalá)'),  
  (8,  'Tojolabal'),  
  (9,  'Zoque (zoque del norte)'),  
  (10, 'Zoque (zoque del sur)'),  
  (11, 'Mam (mam de Chiapas)'),  
  (12, 'Kanjobal (qanjobal)'),  
  (13, 'Jacalteco (popti)'),  
  (14, 'Mocho'),  
  (15, 'Lacandón'),  
  (16, 'Chuj'),  
  (17, 'Ixil'),  
  (18, 'Chuuj'),  
  (19, 'Lengua de Senas Mexicana (LSM)'),  
  (20, 'Otra lengua no catalogada')  
ON CONFLICT (id\_lengua) DO NOTHING;

## **3.4 cat\_especialidades\_medicas — Listado Normado**

\-- cat\_especialidades\_medicas  
INSERT INTO cat\_especialidades\_medicas (id\_especialidad, nombre\_especialidad) VALUES  
  (1,  'Medicina General'),  
  (2,  'Medicina Familiar'),  
  (3,  'Pediatría'),  
  (4,  'Ginecología y Obstetricia'),  
  (5,  'Medicina Interna'),  
  (6,  'Cirugía General'),  
  (7,  'Urgencias'),  
  (8,  'Odontología General'),  
  (9,  'Enfermería General'),  
  (10, 'Nutrición'),  
  (11, 'Psicología Clínica'),  
  (12, 'Trabajo Social'),  
  (13, 'Ortopedia y Traumatología'),  
  (14, 'Dermatología'),  
  (15, 'Oftalmología')  
ON CONFLICT (id\_especialidad) DO NOTHING;

# **4\. Seeds Fijos del Sistema**

## **4.1 cat\_modulos — 8 Módulos del Sistema**

Este seed es fijo y refleja los módulos funcionales de MedSys. Cualquier cambio requiere una nueva versión del sistema (nunca se actualiza en producción directamente).

\-- cat\_modulos (seed fijo, no modificar en produccion)  
INSERT INTO cat\_modulos (id\_modulo, nombre\_modulo, descripcion) VALUES  
  (1, 'DASHBOARD',       'Panel de inicio condicional por rol'),  
  (2, 'PACIENTES',       'Búsqueda, registro y perfil de pacientes'),  
  (3, 'EXPEDIENTE',      'Historia clínica: antecedentes e inmunizaciones'),  
  (4, 'CONSULTA',        'Stepper SOAP: signos, nota, CIE-10, receta, firma'),  
  (5, 'REFERENCIAS',     'Sistema de referencia y contrarreferencia (SRC)'),  
  (6, 'DOCUMENTOS',      'Descarga PDF de receta, nota y solicitudes'),  
  (7, 'AUDITORIA',       'Bitácora filtrable e incidentes de seguridad'),  
  (8, 'ADMINISTRACION',  'CRUD usuarios, roles, establecimientos'),  
  (9, 'SEGURIDAD',       'Sesiones activas, invalidar tokens, bloqueos')  
ON CONFLICT (id\_modulo) DO NOTHING;

## **4.2 roles — 6 Roles del Sistema**

\-- Tabla roles  
INSERT INTO roles (id\_rol, nombre\_rol, descripcion) VALUES  
  (1, 'MEDICO\_GENERAL',      'Médico de primer nivel, acceso a consulta y expediente propio'),  
  (2, 'MEDICO\_ESPECIALISTA', 'Médico con especialidad registrada, acceso cross-establecimiento con referencia'),  
  (3, 'ENFERMERIA',          'Personal de enfermería: signos vitales y triage'),  
  (4, 'ADMINISTRADOR',       'Gestión de usuarios, establecimientos y catálogos del nodo'),  
  (5, 'AUDITOR\_SEGURIDAD',   'Solo lectura de bitácoras, incidentes y reportes de acceso'),  
  (6, 'SUPERADMIN',          'Acceso total al sistema incluyendo métricas y sesiones activas')  
ON CONFLICT (id\_rol) DO NOTHING;

## **4.3 permisos\_rol — Matriz CRUD Completa**

Se generan 9 módulos x 6 roles \= 54 combinaciones de acceso, cada una con flags de CREATE, READ, UPDATE, DELETE. La siguiente tabla muestra la matriz simplificada antes de los INSERTs SQL.

| Módulo | MED\_GEN | MED\_ESP | ENFERMER | ADMIN | AUDITOR | SUPERADM |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| DASHBOARD | R | R | R | R | R | CRUD |
| PACIENTES | CR | CR | R | CRUD | R | CRUD |
| EXPEDIENTE | CRUD | CRUD | R | R | R | CRUD |
| CONSULTA | CRUD | CRUD | CR | \- | R | CRUD |
| REFERENCIAS | CRUD | CRUD | R | R | R | CRUD |
| DOCUMENTOS | CR | CR | R | R | R | CRUD |
| AUDITORIA | \- | \- | \- | R | R | CRUD |
| ADMINISTRACION | \- | \- | \- | CRUD | \- | CRUD |
| SEGURIDAD | \- | \- | \- | \- | R | CRUD |

\-- permisos\_rol (fragmento — MEDICO\_GENERAL)  
INSERT INTO permisos\_rol (id\_permiso, id\_rol, id\_modulo, puede\_crear, puede\_leer, puede\_actualizar, puede\_eliminar) VALUES  
  (gen\_random\_uuid(), 1, 1, FALSE, TRUE,  FALSE, FALSE),  \-- DASHBOARD  
  (gen\_random\_uuid(), 1, 2, TRUE,  TRUE,  FALSE, FALSE),  \-- PACIENTES  
  (gen\_random\_uuid(), 1, 3, TRUE,  TRUE,  TRUE,  FALSE),  \-- EXPEDIENTE  
  (gen\_random\_uuid(), 1, 4, TRUE,  TRUE,  TRUE,  FALSE),  \-- CONSULTA  
  (gen\_random\_uuid(), 1, 5, TRUE,  TRUE,  TRUE,  FALSE),  \-- REFERENCIAS  
  (gen\_random\_uuid(), 1, 6, TRUE,  TRUE,  FALSE, FALSE),  \-- DOCUMENTOS  
  (gen\_random\_uuid(), 1, 7, FALSE, FALSE, FALSE, FALSE),  \-- AUDITORIA  
  (gen\_random\_uuid(), 1, 8, FALSE, FALSE, FALSE, FALSE),  \-- ADMINISTRACION  
  (gen\_random\_uuid(), 1, 9, FALSE, FALSE, FALSE, FALSE)   \-- SEGURIDAD  
ON CONFLICT DO NOTHING;  
\-- NOTA: Replicar para id\_rol 2-6 ajustando los booleanos segun la matriz.

## **4.4 permisos\_especialidad — Seed Inicial por Rol**

Controlat qué especialidades puede ver un médico en otros establecimientos. Al momento del seed, todos los médicos generales tienen acceso solo a MEDICINA\_GENERAL (id\_especialidad \= 1). Las demás se habilitan desde el panel de administración.

\-- permisos\_especialidad (seed inicial por establecimiento)  
\-- Se ejecuta despues de poblar establecimientos\_especialidades  
\-- Ejemplo: UMF-01 Tuxtla solo tiene Medicina General activa  
INSERT INTO permisos\_especialidad  
  (id\_permiso\_esp, id\_establecimiento, id\_especialidad, id\_rol, activo)  
SELECT  
  gen\_random\_uuid(),  
  e.id\_establecimiento,  
  1,  \-- Medicina General  
  r.id\_rol,  
  TRUE  
FROM establecimientos e  
CROSS JOIN roles r  
WHERE r.id\_rol IN (1, 2, 3\)  \-- Solo roles clínicos  
ON CONFLICT DO NOTHING;

## **4.5 Usuario SUPERADMIN Inicial**

Este es el único usuario que se crea como seed. Debe cambiarse la contraseña en el primer inicio de sesión. La contraseña se hashea con Argon2id antes de insertar. NUNCA se inserta en texto plano.

| Procedimiento de Creacion del Superadmin |
| :---- |
| 1\. Generar hash Argon2id desde Python: |
|    python3 \-c "from argon2 import PasswordHasher; print(PasswordHasher().hash('TempPass\#2026\!'))" |
| 2\. Copiar el hash resultante al INSERT SQL |
| 3\. Generar TOTP secret: python3 \-c "import pyotp; print(pyotp.random\_base32())" |
| 4\. El TOTP secret se cifra con AES-256 antes de guardarse en la BD |
| 5\. Registrar la cuenta en app de autenticador (ej: Google Authenticator) usando el QR |
|  |

\-- Seed usuario superadmin — HASH DE EJEMPLO, reemplazar con hash real  
INSERT INTO personas (id\_persona, nombre, primer\_apellido, fecha\_nacimiento,  
  sexo, clave\_localidad, id\_lengua\_materna, creado\_en)  
VALUES (  
  gen\_random\_uuid(), 'SUPERADMIN', 'SISTEMA', '1990-01-01',  
  'M', '070010001', 1, NOW()  
);

INSERT INTO usuarios\_sistema (id\_usuario, id\_persona, id\_rol, username,  
  password\_hash, totp\_secret\_encrypted, activo, forzar\_cambio\_password)  
SELECT  
  gen\_random\_uuid(),  
  p.id\_persona,  
  6,  \-- SUPERADMIN  
  'superadmin',  
  '\<HASH\_ARGON2ID\_AQUI\>',  
  '\<TOTP\_SECRET\_CIFRADO\_AES256\_AQUI\>',  
  TRUE,  
  TRUE   \-- Forzar cambio en primer login  
FROM personas p  
WHERE p.primer\_apellido \= 'SISTEMA' AND p.nombre \= 'SUPERADMIN';

# **5\. Integración con Docker — Ejecución Automática de Seeds**

El directorio db/migrations/ se monta como volumen read-only en el contenedor de PostgreSQL. Docker ejecuta automáticamente todos los archivos .sql en orden lexicográfico al primer arranque. La estructura de archivos debe ser:

db/migrations/  
  01\_schema.sql          \-- DDL: CREATE TABLE, triggers, indices  
  02\_indices.sql         \-- Indices adicionales de rendimiento  
  03\_seeds\_catalogos.sql \-- Seeds: estados, municipios, localidades  
  04\_seeds\_clinicos.sql  \-- Seeds: CIE-10, medicamentos, lenguas  
  05\_seeds\_sistema.sql   \-- Seeds: modulos, roles, permisos\_rol  
  06\_seeds\_superadmin.sql-- Seed: usuario superadmin inicial

| Validacion del Orden de Ejecucion |
| :---- |
| Los archivos DEBEN existir antes del primer docker compose up |
| Si el volumen postgres\_data ya existe, Docker NO re-ejecuta los scripts |
| Para forzar re-inicializacion: docker compose down \-v (BORRA TODOS LOS DATOS) |
| En produccion Azure, los scripts se ejecutan manualmente via psql o Azure Data Studio |
| Nunca usar \--force-recreate en produccion sin respaldo previo (PITR configurado) |
|  |

# **6\. Procedimiento de Actualización de Catálogos**

## **6.1 Actualización de CIE-10 cuando DGIS publica nueva versión**

9. Descargar nueva versión del archivo CIE-10 de DGIS

10. Comparar con versión anterior usando script Python de diff:

\# scripts/seeds/diff\_cie10.py  
import pandas as pd

old \= pd.read\_sql('SELECT codigo\_cie, descripcion FROM cat\_cie10', conn)  
new\_data \= pd.read\_excel('CIE10\_DGIS\_nueva\_version.xlsx')

nuevos \= new\_data\[\~new\_data\['codigo\_cie'\].isin(old\['codigo\_cie'\])\]  
modificados \= new\_data\[new\_data\['codigo\_cie'\].isin(old\['codigo\_cie'\]) &  
                       (new\_data\['descripcion'\] \!= old\['descripcion'\])\]

print(f'Codigos nuevos: {len(nuevos)}')  
print(f'Descripciones modificadas: {len(modificados)}')

11. Los códigos nuevos se insertan con INSERT ... ON CONFLICT DO NOTHING

12. Las descripciones modificadas se actualizan solo si el código no tiene diagnósticos asociados en diagnosticos\_encuentro (integridad referencial)

13. Si hay códigos con diagnósticos activos con descripción modificada, agregar nuevo registro y marcar el anterior como deprecated \= TRUE (soft deprecation)

14. Invalidar cache CDN del catálogo: POST /admin/cache/invalidate con body {'catalogo': 'cat\_cie10'}

15. Documentar la actualización en la bitácora del sistema con: fecha, versión DGIS anterior, versión nueva, número de registros modificados

## **6.2 Actualización de Cuadro Básico SSA**

La SSA publica actualizaciones del Cuadro Básico tipicamente una vez al año. El procedimiento es similar: comparar, insertar nuevos medicamentos, nunca eliminar los que ya tienen prescripciones asociadas (ON DELETE RESTRICT en la FK).

# **7\. Checklist de Persona 5 — Tarea de Seeds**

La Persona 5 es responsable de la preparación de todos los archivos de seeds y su integración en el pipeline de Docker. El siguiente checklist debe completarse antes de la semana 3 del proyecto.

| CHECKLIST DE SEEDS — PERSONA 5 |
| :---- |
| Entrega esperada: Semana 3 del proyecto |
| Archivos a entregar: db/migrations/03\_\*.sql hasta 06\_\*.sql |
| Validacion requerida: docker compose up && psql \-c 'SELECT COUNT(\*) FROM cat\_cie10;' |
|  |

### **Fase 1 — Catálogos INEGI (Días 1-2)**

* \[ \] Descargar Marco Geoestadístico INEGI de inegi.org.mx

* \[ \] Generar 03\_seeds\_geograficos.sql con cat\_estados (32 registros)

* \[ \] Filtrar y generar INSERT para cat\_municipios Chiapas (124 registros)

* \[ \] Ejecutar script convert\_localidades.py con ITER\_07 más reciente

* \[ \] Validar: SELECT COUNT(\*) FROM cat\_localidades WHERE tipo='RURAL'; (debe ser \> 0\)

### **Fase 2 — Catálogos Clínicos (Días 3-4)**

* \[ \] Descargar archivo CIE-10 de DGIS/SSA

* \[ \] Ejecutar script de conversión, generar 04\_seeds\_cie10.sql

* \[ \] Validar conteo de registros CIE-10 (esperado: \> 14,000)

* \[ \] Descargar Cuadro Básico SSA más reciente (PDF o Excel oficial)

* \[ \] Transcribir/convertir medicamentos a SQL con codigo\_medicamento\_ssa

* \[ \] Completar cat\_lenguas\_indigenas con variantes INALI Chiapas (mínimo 15 variantes)

* \[ \] Completar cat\_especialidades\_medicas (mínimo 15 especialidades)

### **Fase 3 — Seeds del Sistema (Día 5\)**

* \[ \] Generar 05\_seeds\_sistema.sql: cat\_modulos (8), roles (6), permisos\_rol (54 registros)

* \[ \] Validar matriz de permisos con el equipo de backend

* \[ \] Generar hash Argon2id para password temporal del superadmin

* \[ \] Generar TOTP secret y QR para el superadmin

* \[ \] Registrar credentials iniciales en documento seguro compartido con Dev Lead (NUNCA en Git)

* \[ \] Generar 06\_seeds\_superadmin.sql con hash incluido (no contraseña)

### **Fase 4 — Validación Docker (Día 6\)**

* \[ \] Copiar todos los archivos SQL a db/migrations/

* \[ \] Ejecutar docker compose down \-v && docker compose up \-d

* \[ \] Validar que PostgreSQL levantó sin errores: docker logs MedSys\_postgres

* \[ \] Ejecutar consultas de validación:

  * SELECT COUNT(\*) FROM cat\_estados; \-- Esperado: 32

  * SELECT COUNT(\*) FROM cat\_municipios WHERE clave\_estado='07'; \-- Esperado: 124

  * SELECT COUNT(\*) FROM cat\_cie10; \-- Esperado: \> 14,000

  * SELECT COUNT(\*) FROM roles; \-- Esperado: 6

  * SELECT COUNT(\*) FROM permisos\_rol; \-- Esperado: 54

* \[ \] Notificar al equipo que los seeds están listos para revisión

* \[ \] Crear Pull Request con los archivos de seeds para revisión del Dev Lead