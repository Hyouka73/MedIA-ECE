# MedIA — Expediente Clínico Electrónico
**Distrito de Salud I · Tuxtla Gutiérrez, Chiapas**

MedIA es un sistema de Expediente Clínico Electrónico (ECE) desarrollado para la UNACH. Cumple **NOM-004-SSA3-2012**, **NOM-024-SSA3-2012** y **NOM-151-SCFI-2016**.

## Arquitectura
| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python 3.11 + FastAPI + SQLAlchemy async |
| Base de Datos | PostgreSQL 15 (Docker en dev, Azure Flexible Server en prod) |
| Autenticación | JWT en memoria + 2FA TOTP + Argon2id |

```
d:\MEDSYS\
├── backend/             # API FastAPI (Python)
│   ├── app/
│   │   ├── modules/     # Un módulo por dominio (auth, personas, pacientes…)
│   │   ├── core/        # Config, seguridad JWT, dependencias DI
│   │   ├── database/    # Sesión SQLAlchemy async
│   │   └── middleware/  # Auditoría forense
│   ├── requirements.txt
│   └── alembic.ini
├── frontend/            # SPA React + Vite
│   └── src/
│       ├── components/  # layout/, ui/ (Badge, Button, Card…)
│       ├── context/     # AuthContext (JWT en memoria)
│       ├── pages/       # auth/, dashboard/ …
│       └── utils/       # permissions.js (RBAC)
├── database/            # SQL ejecutado por Docker al iniciar
│   ├── 01_schema.sql    # DDL 40 tablas
│   ├── 02_triggers.sql  # 6 triggers normativos + 3 vistas
│   ├── 03_seeds_geograficos.sql
│   ├── 04_seeds_clinicos.sql
│   ├── 05_seeds_sistema.sql  # Roles, módulos, permisos RBAC
│   └── 06_seeds_superadmin.sql
├── scripts/             # Automatización
│   ├── setup_windows.ps1   # ← correr esto en la primera vez
│   └── deploy_azure.ps1    # Referencia Azure CLI
├── docker-compose.yml
└── README.md
```

---

## Arranque Rápido (Windows)

**Primera vez (instala todo):**
```powershell
.\scripts\setup_windows.ps1
```

**Arranque diario (3 terminales separadas):**
```powershell
# Opción A (Elegir esta si quieres un solo comando para abrir las 3 terminales):
.\scripts\launch_dev.ps1

# Opción B (Manual):
# 1. Base de datos
docker compose up -d
# 2. Backend (FastAPI)
cd backend; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload
# 3. Frontend (React)
cd frontend; npm run dev
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend Swagger | http://localhost:8000/docs |
| Adminer (BD Visual) | http://localhost:8080 |

### 🛠️ Acceso a Adminer (Visualizar BD)
Para ver las tablas y datos del ECE desde Adminer:
- **Sistema:** `PostgreSQL`
- **Servidor:** `media_db_dev` (nombre interno del contenedor)
- **Usuario:** `media_dev`
- **Contraseña:** `dev_pass_changeme`
- **Base de Datos:** `media_db`

## Variables de Env (Locales)
```bash
# Ya creados automáticamente por el script de setup:
backend/.env
frontend/.env
```
Los valores reales en producción se gestionan mediante **Azure Key Vault**.

## Credenciales de Desarrollo
- Email: `admin@media.local`  
- Contraseña: `MedIA2026!`

> **Nunca usar estas credenciales en producción.**


## Arquitectura

El sistema está dividido en las siguientes capas y tecnologías principales:
- **Frontend**: React 18, Vite, shadcn/ui.
- **Backend**: Python 3.11, FastAPI, SQLAlchemy (Pydantic v2).
- **Base de Datos**: PostgreSQL 15.

Este repositorio está organizado con las siguientes carpetas clave:
- `/backend`: Código fuente y API de FastAPI.
- `/frontend`: SPA en React y UI Institucional.
- `/database`: Migraciones y seeds SQL que Docker ejecuta automáticamente.

---

## Arranque Rápido para Desarrollo Local

El entorno local requiere Docker instalado para la base de datos PostgreSQL.

### 1. Variables de Entorno
Copia las plantillas y reemplaza los valores sensibles (solo local, nunca enviar `.env` a Git):
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Iniciar Servicios

Puedes usar los scripts en la carpeta \`scripts/\` para facilitar el arranque Automático:
- **Windows**: `.\scripts\setup_windows.ps1`
- **Linux/Mac**: `./scripts/start_dev.sh`

O ejecutar manualmente:
```bash
docker compose up -d
```

### 3. Migraciones y Semillas (Seeds)
Las tablas y seeds iniciales (como los catálogos del INEGI y CIE-10) se ejecutarán automáticamente por docker gracias al mapeo del volumen `/database`.

Si necesitas usar scripts de backend manualmente:
```bash
./scripts/migrate.sh   # Corre migraciones de Alembic si aplica
./scripts/seed.sh      # Ejecuta python localmente para inicializar.
```

## Credenciales de Desarrollo
- Usuario Superadmin por defecto: `admin@media.local`
- Contraseña por defecto: `MedIA2026!` (Deberá cambiarse tras el primer ingreso).

**Importante:** Nunca usar estas credenciales en producción.
