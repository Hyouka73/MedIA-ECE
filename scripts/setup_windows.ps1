<#
.SYNOPSIS
    Script de inicialización para MedSys ECE en entorno Windows
.DESCRIPTION
    Este script automatiza el levantamiento de todo el entorno de desarrollo local.
#>

Write-Host "Iniciando Setup Automático de MedSys ECE..." -ForegroundColor Cyan

# 1. Variables de Entorno
Write-Host "`n[1/4] Configurando variables de entorno..." -ForegroundColor Yellow
if (-Not (Test-Path "backend\.env")) {
    Copy-Item -Path "backend\.env.example" -Destination "backend\.env"
    Write-Host " -> backend/.env creado desde plantilla." -ForegroundColor Green
} else {
    Write-Host " -> backend/.env ya existe. Omitiendo." -ForegroundColor DarkGray
}

if (-Not (Test-Path "frontend\.env")) {
    Copy-Item -Path "frontend\.env.example" -Destination "frontend\.env"
    Write-Host " -> frontend/.env creado desde plantilla." -ForegroundColor Green
} else {
    Write-Host " -> frontend/.env ya existe. Omitiendo." -ForegroundColor DarkGray
}

# 2. Levantar la Base de Datos
Write-Host "`n[2/4] Levantando PostgreSQL con Docker Compose..." -ForegroundColor Yellow
docker compose up -d

Write-Host " -> Esperando a que PostgreSQL inicie (15 segundos)..." -ForegroundColor DarkGray
Start-Sleep -Seconds 15

# 3. Frontend Dependencies
Write-Host "`n[3/4] Instalando dependencias del Frontend..." -ForegroundColor Yellow
if (Test-Path "frontend\package.json") {
    Push-Location frontend
    npm install
    Pop-Location
    Write-Host " -> Dependencias de React instaladas." -ForegroundColor Green
} else {
    Write-Host " -> No se encontró package.json en frontend/." -ForegroundColor Red
}

# 4. Backend - Entorno Virtual
Write-Host "`n[4/5] Configurando backend (Entorno Virtual Python)..." -ForegroundColor Yellow
if (Test-Path "backend\requirements.txt") {
    Push-Location backend
    # Usamos .venv para ser consistentes con lo que tenías antes
    if (-Not (Test-Path ".venv")) {
        python -m venv .venv
        Write-Host " -> Entorno virtual .venv creado." -ForegroundColor Green
    }
    # Activación y carga de librerías
    & ".\.venv\Scripts\Activate.ps1"
    pip install -r requirements.txt --quiet
    deactivate
    Pop-Location
    Write-Host " -> Dependencias del backend instaladas." -ForegroundColor Green
} else {
    Write-Host " -> No se encontró requirements.txt en backend/." -ForegroundColor Red
}

# 5. Mensaje Final
Write-Host "`n[5/5] Setup Completo!" -ForegroundColor Cyan
Write-Host ""
Write-Host "===== COMO ARRANCAR EL SISTEMA =====" -ForegroundColor Cyan
Write-Host "1. Base de datos ya levantada (Docker)."
Write-Host "2. Backend FastAPI -> abre una PWS nueva y ejecuta:"
Write-Host "   cd backend; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000" -ForegroundColor Yellow
Write-Host "3. Frontend React -> abre otra PWS nueva y ejecuta:"
Write-Host "   cd frontend; npm run dev" -ForegroundColor Yellow
Write-Host "4. Adminer (BD visual) -> http://localhost:8080"
Write-Host "   Backend API Docs -> http://localhost:8000/docs"
Write-Host "   Frontend -> http://localhost:5173"
Write-Host ""
Write-Host "Lanzando el entorno ahora mismo..." -ForegroundColor Green
& ".\scripts\launch_dev.ps1"