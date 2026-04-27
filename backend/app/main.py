"""
MedIA ECE — FastAPI Backend
Punto de entrada principal de la aplicación (Versión Unificada)
"""
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.middleware.audit import AuditMiddleware
from app.middleware.auth import AuthMiddleware
from app.middleware.sanitize import SanitizeMiddleware

# Routers base
from app.modules.auth.router import router as auth_router
from app.modules.personas.router import router as personas_router
from app.modules.pacientes.router import router as pacientes_router
from app.modules.expediente.router import router as expediente_router
from app.modules.catalogos.router import router as catalogos_router
from app.modules.encuentros.router import router as encuentros_router
from app.modules.admin.router import router as admin_router
from app.modules.auditoria.router import router as auditoria_router
from app.modules.signosvitales.router import router as signos_router

# RUTEADOR DE NOTAS SOAP
from app.modules.notas_soap.router import router as notas_router  # Import DIRECTO
# Si no existe, el app romperá en arranque, no habrá 404 silencioso

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

# MEMORIA FORENSE
app.state.blacklist_tokens = set()
app.state.blacklist_detalles = []

# MIDDLEWARES
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

# RUTAS POR MÓDULO
app.include_router(auth_router,       prefix="/api/auth",       tags=["Autenticación"])
app.include_router(personas_router,   prefix="/api/personas",   tags=["Personas"])
app.include_router(pacientes_router,  prefix="/api/pacientes",  tags=["Pacientes"])
app.include_router(expediente_router, prefix="/api/expediente", tags=["Expediente"])
app.include_router(catalogos_router,  prefix="/api/catalogos",  tags=["Catálogos"])
app.include_router(encuentros_router, prefix="/api/encuentros", tags=["Encuentros"])
app.include_router(signos_router,     prefix="/api/encuentros", tags=["Signos Vitales"])

# RUTA DE NOTAS SOAP (CRÍTICA)
app.include_router(notas_router,      prefix="/api/encuentros", tags=["Notas SOAP"])

# OTROS
app.include_router(admin_router,       prefix="/api/admin",       tags=["Administración"])
app.include_router(auditoria_router,   prefix="/api/auditoria",   tags=["Auditoría"])

# SEGURIDAD
@app.get("/api/seguridad/logs-forenses", tags=["Auditoría"])
async def get_forensic_logs():
    log_path = os.path.join(os.getcwd(), "logs", "auditoria_forense.log")
    if not os.path.exists(log_path):
        return {"content": ["> SISTEMA: Archivo de auditoría forense no encontrado."]}
    with open(log_path, "r", encoding="utf-8") as f:
        return {"content": f.readlines()[-50:]}

@app.get("/api/seguridad/sessions-blacklist", tags=["Auditoría"])
async def get_blacklist(request: Request):
    return request.app.state.blacklist_detalles

if settings.APP_ENV != "production":
    os.makedirs("static", exist_ok=True)
    app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", include_in_schema=False)
async def root():
    return {"status": "ok", "sistema": "MedIA ECE", "version": "1.0.0"}