"""
Middleware de Autenticación JWT
Valida el token en el header Authorization y bloquea acceso si está inválido
o si el jti está en la lista negra (sesiones_invalidas)
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.security import verify_token

# Rutas que NO requieren autenticación (deben coincidir con el prefijo /api)
PUBLIC_PATHS = {
    "/api/auth/login", 
    "/api/auth/2fa/verify", 
    "/api/health", 
    "/", 
    "/health",
    "/docs",
    "/redoc", 
    "/openapi.json"
}


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in PUBLIC_PATHS or request.url.path.startswith("/docs"):
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                {"detail": "Token de autenticación requerido"},
                status_code=401
            )

        token = auth_header[7:]
        payload = verify_token(token)
        if not payload:
            return JSONResponse(
                {"detail": "Token inválido o expirado"},
                status_code=401
            )

        # Bloquear acceso a todo si solo tiene un token temporal de 2FA
        if payload.get("rol") == "PENDING_2FA":
            return JSONResponse(
                {"detail": "Debe completar el proceso de 2FA para acceder"},
                status_code=403
            )

        # TODO Persona 3: verificar que el jti no está en sesiones_invalidas (BD)
        request.state.user = payload
        return await call_next(request)
