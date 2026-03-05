# ══ MedIA ECE — Launcher de Desarrollo ════════════════════════════════════
# Abre 3 terminales independientes para cada servicio.
# Asegúrate de haber corrido .\scripts\setup_windows.ps1 previamente.
# ══════════════════════════════════════════════════════════════════════════

Write-Host "Lanzando el entorno de desarrollo para MedIA ECE..." -ForegroundColor Cyan

# Terminal 1: Base de Datos (Docker)
Write-Host "[1/3] Iniciando PostgreSQL..." -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "docker compose up" -WorkingDirectory (Get-Location) -Wait:$false

# Terminal 2: Backend (FastAPI + Uvicorn)
Write-Host "[2/3] Iniciando Backend API..." -ForegroundColor Yellow
$backendCmd = ".\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000"
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "$backendCmd" -WorkingDirectory (Join-Path (Get-Location) "backend") -Wait:$false

# Terminal 3: Frontend (React + Vite)
Write-Host "[3/3] Iniciando Frontend React..." -ForegroundColor Yellow
$frontendCmd = "npm run dev"
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "$frontendCmd" -WorkingDirectory (Join-Path (Get-Location) "frontend") -Wait:$false

Write-Host "`nServicios lanzados en ventanas separadas." -ForegroundColor Green
Write-Host "Revisa cada terminal por posibles errores." -ForegroundColor White
