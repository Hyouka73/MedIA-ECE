"""
Middleware de Sanitización de Entradas
Protección contra XSS (bleach) e inyección SQL (regex) en parámetros de query
Doc2 §1.2 — capa de seguridad de entrada
"""
import re
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
import logging

logger = logging.getLogger("media.sanitize")

# Patrones SQL injection básicos
SQL_INJECTION_PATTERNS = [
    r"(\bUNION\b.*\bSELECT\b)",
    r"(\bDROP\b.*\bTABLE\b)",
    r"(\bINSERT\b.*\bINTO\b)",
    r"(\bEXEC\b|\bEXECUTE\b)",
    r"(--|;--)",
    r"(\bOR\b\s+\d+=\d+)",
    r"(<script.*?>)",
]
COMBINED = re.compile("|".join(SQL_INJECTION_PATTERNS), re.IGNORECASE)


class SanitizeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Revisar query string
        query_string = str(request.url.query)
        if COMBINED.search(query_string):
            logger.warning("INTENTO_SQLI_XSS detectado desde %s — ruta: %s",
                           request.client.host if request.client else "?",
                           request.url.path)
            return JSONResponse(
                {"detail": "Petición bloqueada por política de seguridad"},
                status_code=400
            )
        return await call_next(request)
