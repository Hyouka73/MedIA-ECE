"""
Middleware de Auditoría — Req 1 y 3 Cómputo Forense
Registra CADA petición HTTP en la tabla auditoria_accesos (persistente, inmutable).
El trigger tr_audit_no_changes impide UPDATE/DELETE en la tabla.
"""
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from sqlalchemy import text
import logging

logger = logging.getLogger("media.audit")


class AuditMiddleware(BaseHTTPMiddleware):
    EXCLUDED_PATHS = {"/api/health", "/health", "/", "/docs", "/redoc", "/openapi.json"}

    def _classify_event(self, method: str, path: str, status: int) -> tuple:
        """
        Clasifica el evento para auditoria_accesos.
        Returns: (tipo_evento, nivel_severidad)
        Req Forense 5: tipos documentados de acciones críticas.
        """
        # Login fallido
        if "/auth/login" in path and status == 401:
            return "LOGIN_FALLIDO", "MEDIO"
        if "/auth/login" in path and status == 423:
            return "CUENTA_BLOQUEADA", "ALTO"
        if "/auth/login" in path and status == 200:
            return "LOGIN_EXITOSO", "BAJO"
        if "/auth/2fa" in path and status == 200:
            return "VERIFICACION_2FA", "BAJO"
        if "/auth/2fa" in path and status == 401:
            return "2FA_FALLIDO", "MEDIO"
        if "/auth/2fa" in path and status == 423:
            return "CUENTA_BLOQUEADA", "ALTO"
        if "/auth/logout" in path:
            return "LOGOUT", "BAJO"
        # Sanitización bloqueó algo
        if status == 400 and method == "GET":
            return "INTENTO_SQLI", "CRITICO"
        # Acceso denegado
        if status == 403:
            return "ACCESO_DENEGADO", "ALTO"
        if status == 401:
            return "NO_AUTENTICADO", "MEDIO"
        # Operaciones de encuentros clínicos (Regla 4)
        if "/encuentros" in path:
            if method == "POST" and status == 201:
                return "APERTURA_ENCUENTRO", "MEDIO"
            if method == "PATCH" and "/cerrar" in path and status == 200:
                return "CIERRE_ENCUENTRO", "MEDIO"
            if method == "GET":
                return "LECTURA_ENCUENTROS", "BAJO"
        # Sanitización bloqueó algo
        if status == 400 and method == "GET":
            return "INTENTO_SQLI", "CRITICO"
        
        return "ACCESO_GENERAL", "BAJO"

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.EXCLUDED_PATHS or request.url.path.startswith("/static"):
            return await call_next(request)

        start_time = time.time()
        response = await call_next(request)
        duration_ms = round((time.time() - start_time) * 1000, 2)

        # Extraer info del usuario del token JWT (si existe)
        user_id = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            from app.core.security import verify_token
            payload = verify_token(auth_header[7:])
            if payload:
                user_id = payload.get("sub")

        # Clasificar evento
        tipo_evento, nivel_severidad = self._classify_event(
            request.method, request.url.path, response.status_code
        )

        # Construir modulo_funcion (Req 3: trazabilidad)
        modulo_funcion = f"{request.method} {request.url.path}"

        client_ip = request.client.host if request.client else "0.0.0.0"
        resultado = "EXITOSO" if response.status_code < 400 else (
            "DENEGADO" if response.status_code in (401, 403, 423) else "FALLIDO"
        )

        # ── Persistir en auditoria_accesos (Req 1 Forense) ──
        try:
            import uuid as uuid_mod
            from app.database.session import AsyncSessionLocal
            try:
                uid_val = uuid_mod.UUID(user_id) if user_id else None
            except (ValueError, TypeError):
                uid_val = None
            async with AsyncSessionLocal() as audit_session:
                await audit_session.execute(
                    text("""
                        INSERT INTO auditoria_accesos 
                        (id_usuario, direccion_ip, modulo_funcion, tipo_evento, resultado, nivel_severidad, detalles)
                        VALUES (:uid, CAST(:ip AS inet), :mod, :tipo, :resultado, :sev, CAST(:detalles AS jsonb))
                    """),
                    {
                        "uid": uid_val,
                        "ip": client_ip,
                        "mod": modulo_funcion[:200],
                        "tipo": tipo_evento,
                        "resultado": resultado,
                        "sev": nivel_severidad,
                        "detalles": f'{{"status": {response.status_code}, "ms": {duration_ms}}}'
                    }
                )
                await audit_session.commit()
        except Exception as e:
            # Fallback: si la BD falla, al menos queda en log (nunca perder el evento)
            logger.error("AUDIT_DB_FAIL | %s | error=%s", modulo_funcion, str(e))

        # Log estructurado como respaldo (Req 1: archivo independiente)
        from app.core.forensic_logger import log_forensic_event
        
        # Opcional: hash de petición si requiriera rastreo, pero dejemos None por defecto.
        # "resultado" forense es EXITO o FALLO general
        log_forensic_event(
            usuario=user_id or "ANÓNIMO",
            accion=f"{tipo_evento} -> {request.method} {request.url.path}",
            resultado=resultado,
            ip=client_ip,
            detalles={"status": response.status_code, "ms": duration_ms}
        )
        return response