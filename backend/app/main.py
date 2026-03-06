"""
MedIA ECE — FastAPI Backend
Punto de entrada principal de la aplicación
"""
from fastapi import FastAPI
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
from app.modules.catalogos.router import router as catalogos_router
from app.modules.encuentros.router import router as encuentros_router
from app.modules.admin.router import router as admin_router
from app.modules.auditoria.router import router as auditoria_router

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

# Orden correcto: Sanitize → CORS → Auth → Audit
# (Starlette aplica middlewares en orden inverso de declaración)
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
# Se agrega prefijo internacional /api para consistencia con el proxy del frontend
app.include_router(auth_router,       prefix="/api/auth",       tags=["Autenticación"])
app.include_router(personas_router,   prefix="/api/personas",   tags=["Personas"])
app.include_router(pacientes_router,  prefix="/api/pacientes",  tags=["Pacientes"])
app.include_router(catalogos_router,  prefix="/api/catalogos",  tags=["Catálogos"])
app.include_router(encuentros_router, prefix="/api/encuentros", tags=["Encuentros"])
app.include_router(admin_router,      prefix="/api/admin",      tags=["Administración"])
app.include_router(auditoria_router,  prefix="/api/auditoria",  tags=["Auditoría"])


@app.get("/", include_in_schema=False)
async def root():
    return {"status": "ok", "sistema": "MedIA ECE", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

