"""
MedIA ECE — FastAPI Backend
Punto de entrada principal de la aplicación
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.middleware.audit import AuditMiddleware
from app.middleware.auth import AuthMiddleware
from app.middleware.sanitize import SanitizeMiddleware
from app.modules.auth.router import router as auth_router
from app.modules.personas.router import router as personas_router
from app.modules.pacientes.router import router as pacientes_router
from app.modules.expediente.router import router as expediente_router
from app.modules.catalogos.router import router as catalogos_router
from app.modules.encuentros.router import router as encuentros_router
from app.modules.admin.router import router as admin_router
from app.modules.auditoria.router import router as auditoria_router
from app.modules.signosvitales.router import router as signos_router

import os

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="MedIA ECE API",
    description="Sistema de Expediente Clínico Electrónico — Distrito de Salud I · Tuxtla Gutiérrez, Chiapas",
    version="1.0.0",
    docs_url="/docs" if settings.APP_ENV != "production" else None,
    redoc_url="/redoc" if settings.APP_ENV != "production" else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── INICIALIZACIÓN DE MEMORIA FORENSE (BLACKLIST IN-MEMORY) ────────────
app.state.blacklist_tokens = set()  # Para búsqueda O(1) súper rápida en el middleware
app.state.blacklist_detalles = []   # Para listar los detalles en el Frontend de React

# Orden correcto: Sanitize → CORS → Auth → Audit
app.add_middleware(AuditMiddleware)
app.add_middleware(AuthMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SanitizeMiddleware)

# ── Routers por Módulo ──────────────────────────────────────────────────
app.include_router(auth_router,       prefix="/api/auth",       tags=["Autenticación"])
app.include_router(personas_router,   prefix="/api/personas",   tags=["Personas"])
app.include_router(pacientes_router,  prefix="/api/pacientes",  tags=["Pacientes"])
app.include_router(expediente_router, prefix="/api/expediente", tags=["Expediente"])
app.include_router(catalogos_router,  prefix="/api/catalogos",  tags=["Catálogos"])
app.include_router(encuentros_router, prefix="/api/encuentros", tags=["Encuentros"])
app.include_router(signos_router,     prefix="/api/signos-vitales", tags=["Signos Vitales"]) #signos vitales xd
app.include_router(admin_router,       prefix="/api/admin",       tags=["Administración"])
app.include_router(auditoria_router,   prefix="/api/auditoria",   tags=["Auditoría"])


# ── Persona 5: Endpoint de Seguridad Avanzada (Logs Forenses) ───────────
@app.get("/api/seguridad/logs-forenses", tags=["Auditoría"])
async def get_forensic_logs():
    log_path = os.path.join(os.getcwd(), "logs", "auditoria_forense.log")
    if not os.path.exists(log_path):
        return {"content": ["> SISTEMA: Archivo de auditoría forense no encontrado."]}
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            # Leemos las últimas 50 líneas
            lines = f.readlines()
            return {"content": lines[-50:]}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error leyendo el log forense")

# ── Blacklist de Sesiones (Implementación In-Memory Real) ──────────────
@app.get("/api/seguridad/sessions-blacklist", tags=["Auditoría"])
async def get_blacklist(request: Request):
    # Retorna directamente la lista de detalles de la memoria RAM del servidor
    return request.app.state.blacklist_detalles

from fastapi.staticfiles import StaticFiles

if settings.APP_ENV != "production":
    os.makedirs("static", exist_ok=True)
    app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", include_in_schema=False)
async def root():
    return {"status": "ok", "sistema": "MedIA ECE", "version": "1.0.0"}

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}