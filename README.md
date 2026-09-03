# 🏥 MedSys / MedIA — Expediente Clínico Electrónico (ECE)

<p align="center">
  <img src="frontend/public/logo.png" width="120" alt="MedSys Logo" />
</p>

<p align="center">
  <strong>Sistema Integral de Gestión Hospitalaria y Expediente Clínico Electrónico Normativo</strong><br>
  <em>Desarrollado como proyecto académico en colaboración con la UNACH para el Distrito de Salud I (Tuxtla Gutiérrez, Chiapas).</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11-blue?logo=python" alt="Python 3.11" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql" alt="PostgreSQL 15" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Normativa-NOM--004--SSA3--2012-red" alt="NOM-004" />
</p>

---

## 📋 Descripción del Proyecto

**MedSys-ECE** es una plataforma web integral de Expediente Clínico Electrónico diseñada para digitalizar, estructurar y salvaguardar la información médica de pacientes en centros de salud y hospitales de primer y segundo nivel. 

El sistema fue concebido bajo estrictos estándares de ingeniería de software médico y apego riguroso al marco legal mexicano de salud digital:
- **NOM-004-SSA3-2012:** Del expediente clínico (estructura de notas médicas SOAP, historia clínica, consentimientos y notas de evolución).
- **NOM-024-SSA3-2012:** Sistemas de información de registro electrónico para la salud e interoperabilidad.
- **NOM-151-SCFI-2016:** Requisitos que deben observarse para la conservación de mensajes de datos y digitalización de documentos (trazabilidad y no repudio).

---

## ⚡ Características Principales

- **Gestión Clínica Completa (NOM-004-SSA3-2012):**
  - Registro de pacientes con validación de CURP y homoclave.
  - Creación y consulta de notas médicas bajo metodología SOAP (Subjetivo, Objetivo, Análisis, Plan).
  - Catálogo de diagnósticos estandarizados CIE-10 y catálogo de medicamentos.
  - Generación de recetas médicas y reportes clínicos en PDF vectorizado mediante WeasyPrint.
- **Seguridad Médica y Control de Acceso (RBAC):**
  - Control de acceso granular por roles: Administrador, Médico General, Especialista, Enfermería, Recepción y Farmacia.
  - Autenticación multifactor obligatoria (2FA TOTP con cifrado Fernet).
  - Manejo seguro de sesiones: Tokens JWT en memoria + Refresh Tokens rotativos en cookies `HttpOnly; Secure; SameSite=Strict`.
  - Hashing de contraseñas de alta resistencia con **Argon2id**.
  - Whitelist de sesiones activas (`jti`) y revocación inmediata de tokens.
- **Trazabilidad Forense Inmutable:**
  - Middleware de auditoría que registra cada lectura, escritura o intento de acceso sobre expedientes médicos para cumplimiento legal.
  - Detección de intentos de fuerza bruta con bloqueo automático de cuentas por tiempo definido.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías / Librerías |
|:---|:---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Context API |
| **Backend API** | Python 3.11, FastAPI, Pydantic v2, SQLAlchemy (Async / asyncpg), Alembic |
| **Base de Datos** | PostgreSQL 15 (40 tablas normalizadas, triggers de integridad y vistas analíticas) |
| **Seguridad & Auth** | Passlib (Argon2id), PyJWT, Cryptography (Fernet), PyOTP, SlowAPI (Rate Limiting) |
| **Generación de Reportes** | WeasyPrint, Jinja2 Templates (PDFs clínicos normativos) |
| **Infraestructura Local** | Docker, Docker Compose, Adminer |

---

## 🏛️ Estructura del Código

```text
MedSys-ECE/
├── backend/                  # API REST construida con FastAPI
│   ├── app/
│   │   ├── modules/          # Arquitectura modular (auth, personas, pacientes, notas...)
│   │   ├── core/             # Configuración, seguridad criptográfica y dependencias
│   │   ├── database/         # Sesión asíncrona de SQLAlchemy
│   │   └── middleware/       # Middleware de auditoría forense
│   ├── requirements.txt      # Dependencias de Python
│   └── alembic.ini           # Control de versiones de base de datos
├── frontend/                 # SPA construida con React + Vite
│   ├── src/
│   │   ├── components/       # Componentes visuales y de layout
│   │   ├── context/          # Contexto de autenticación y permisos
│   │   ├── pages/            # Vistas clínicas, consultas y administración
│   │   └── utils/            # RBAC y validaciones normativas
├── database/                 # Scripts DDL y semillas ejecutadas por Docker
│   ├── 01_schema.sql         # Definición de 40 tablas relacionales
│   ├── 02_triggers.sql       # Triggers normativos y vistas
│   └── seeds/                # Catálogos geográficos (INEGI) y del sistema
└── docker-compose.yml        # Orquestación de base de datos local y Adminer
```

---

## 🚀 Guía de Instalación y Ejecución Local

### Prerrequisitos
- **Docker Desktop** instalado y en ejecución
- **Python 3.11+**
- **Node.js 18+** y npm

### 1. Clonar el repositorio
```bash
git clone https://github.com/Hyouka73/MedIA-ECE.git
cd MedIA-ECE
```

### 2. Configurar Variables de Entorno
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```
*(Edita `backend/.env` con tus claves locales si deseas personalizar puertos o credenciales).*

### 3. Iniciar la Base de Datos (Docker)
```bash
docker compose up -d
```
Esto levantará PostgreSQL 15 en el puerto `5432` y aplicará automáticamente los esquemas y catálogos de `database/`.

### 4. Iniciar el Backend (FastAPI)
```bash
cd backend
python -m venv venv

# En Windows:
.\venv\Scripts\Activate.ps1
# En Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API y Documentación interactiva Swagger: `http://localhost:8000/docs`
- Especificación OpenAPI (ReDoc): `http://localhost:8000/redoc`

### 5. Iniciar el Frontend (React)
En una terminal separada:
```bash
cd frontend
npm install
npm run dev
```
- Aplicación web: `http://localhost:5173`

---

## 👥 Tipo de Proyecto y Reconocimientos
- **Naturaleza:** Proyecto Académico Universitario (UNACH).
- **Propósito:** Prototipado y desarrollo de un sistema de salud público adaptado a las necesidades operativas de centros de atención primaria en el estado de Chiapas, México.
- **Desarrollador Principal:** [Hyouka73](https://github.com/Hyouka73)
