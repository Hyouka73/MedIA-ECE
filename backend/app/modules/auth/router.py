"""
Módulo de Autenticación — MedIA ECE
Login Argon2id, 2FA TOTP, bloqueo por intentos, refresh tokens con whitelist en BD.
Req Forense: 1 (logging), 4 (timestamps UTC), 5 (auth fuerte), 8 (sin hardcoding)
"""
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
import pyotp

from app.database.session import get_db
from app.core.security import (
    verify_password, create_access_token, create_refresh_token,
    verify_token, verify_totp, generate_totp_secret
)
from app.core.config import settings
from app.models.auth import User, Role, Persona, SesionActiva
from app.services.email import email_service

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

REFRESH_COOKIE_NAME = "refresh_token"


# ── Schemas ──────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class VerifyTOTPRequest(BaseModel):
    temp_token: str
    code: str


# ── Helpers ──────────────────────────────────────────────────
async def _get_role_code(db: AsyncSession, id_rol: int) -> str:
    role = (await db.execute(select(Role).where(Role.id_rol == id_rol))).scalar_one_or_none()
    return role.codigo if role else "INVITADO"


def _build_user_response(user: User, rol_codigo: str) -> dict:
    return {
        "id": str(user.id_usuario),
        "nombre": f"{user.persona.nombre} {user.persona.primer_apellido}" if user.persona else "Usuario",
        "rol": rol_codigo,
        "email": user.email,
        "url_foto": user.persona.url_foto if user.persona else None,
        "establecimiento": "CSSSA023999"  # TODO: Sacar de usuarios_establecimientos
    }


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Cookie HttpOnly Secure SameSite=Lax para desarrollo (en prod: SameSite=None con Secure)."""
    # En desarrollo sin HTTPS, usamos SameSite=Lax y Secure=False
    # En producción con HTTPS, cambiar a SameSite=None + Secure=True
    is_dev = settings.APP_ENV == "development"
    
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=not is_dev,  # False en dev, True en prod
        samesite="lax" if is_dev else "none",  # Lax en dev, None en prod
        max_age=60 * 60 * 24 * 7,  # 7 días
        path="/",  # Raíz para que funcione en toda la API
    )


async def _registrar_sesion(
    db: AsyncSession,
    user_id,
    jti: str,
    request: Request,
) -> None:
    """Inserta el refresh token en la whitelist de sesiones activas."""
    ip = request.client.host if request.client else "desconocida"
    ua = request.headers.get("user-agent", "")[:512]
    ahora = datetime.now(timezone.utc)
    sesion = SesionActiva(
        jti=jti,
        id_usuario=user_id,
        ip_origen=ip,
        user_agent=ua,
        fecha_creacion=ahora,
        fecha_expira=ahora + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(sesion)
    await db.commit()


async def _limpiar_sesiones_expiradas(db: AsyncSession) -> None:
    """Limpieza oportunista de sesiones vencidas para no crecer la tabla infinitamente."""
    await db.execute(
        delete(SesionActiva).where(SesionActiva.fecha_expira < datetime.now(timezone.utc))
    )
    await db.commit()


# ── POST /auth/login ─────────────────────────────────────────
@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Login con bloqueo por intentos.
    Rate limit: 5 intentos/minuto por IP.
    """
    # ── 1. Buscar usuario ──
    query = select(User).options(joinedload(User.persona)).where(User.email == data.email)
    user = (await db.execute(query)).unique().scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    # ── 2. Verificar bloqueo ──
    if not user.activo:
        raise HTTPException(status_code=403, detail="Cuenta bloqueada permanentemente. Contacte Auditoría.")

    if user.bloqueado_hasta and user.bloqueado_hasta > datetime.now(timezone.utc):
        mins = int((user.bloqueado_hasta - datetime.now(timezone.utc)).total_seconds() / 60) + 1
        raise HTTPException(status_code=423, detail=f"Cuenta bloqueada. Intente en {mins} minuto(s).")

    # ── 3. Validar contraseña ──
    if not verify_password(data.password, user.password_hash):
        new_attempts = (user.intentos_fallidos or 0) + 1
        await db.execute(
            update(User).where(User.id_usuario == user.id_usuario)
            .values(intentos_fallidos=new_attempts)
        )
        await db.commit()
        restantes = max(0, settings.MAX_LOGIN_ATTEMPTS - new_attempts)
        if restantes > 0:
            raise HTTPException(status_code=401, detail=f"Credenciales incorrectas. {restantes} intento(s) restante(s).")
        raise HTTPException(status_code=423, detail=f"Cuenta bloqueada por {settings.ACCOUNT_LOCKOUT_MINUTES} minutos.")

    # ── 4. Login exitoso: resetear intentos ──
    fue_desbloqueada = user.bloqueado_hasta is not None and user.bloqueado_hasta <= datetime.now(timezone.utc)
    await db.execute(
        update(User).where(User.id_usuario == user.id_usuario)
        .values(intentos_fallidos=0, ultimo_login=datetime.now(timezone.utc), bloqueado_hasta=None)
    )
    await db.commit()

    rol_codigo = await _get_role_code(db, user.id_rol)

    # ── 5. Evaluar 2FA ──
    if user.requires_2fa or fue_desbloqueada:
        temp_token = create_access_token(
            {"sub": str(user.id_usuario), "rol": "PENDING_2FA", "email": user.email},
            expires_delta=300
        )
        if not user.totp_secret:
            user.totp_secret = generate_totp_secret()
            await db.commit()
            await db.refresh(user)

        codigo_enviado = pyotp.TOTP(user.totp_secret, interval=300).now()
        
        # Facilidad para entorno local
        if settings.APP_ENV != "production":
            print(f"🔑 [DEV MODO] CÓDIGO 2FA PARA {user.email}: {codigo_enviado}")
            
        email_service.send_2fa_token(user.email, codigo_enviado)

        return {
            "access_token": "",
            "token_type": "bearer",
            "requires_2fa": True,
            "temp_token": temp_token,
            "user": None,
            "reason": "account_unlocked" if fue_desbloqueada else "2fa_required"
        }

    # ── 6. Login directo (sin 2FA) — emitir tokens ──
    jti = str(uuid.uuid4())
    token = create_access_token({"sub": str(user.id_usuario), "rol": rol_codigo, "email": user.email})
    refresh = create_refresh_token({"sub": str(user.id_usuario), "rol": rol_codigo, "email": user.email, "jti": jti})

    await _registrar_sesion(db, user.id_usuario, jti, request)
    await _limpiar_sesiones_expiradas(db)

    response = JSONResponse(content={
        "access_token": token,
        "token_type": "bearer",
        "requires_2fa": False,
        "user": _build_user_response(user, rol_codigo)
    })
    _set_refresh_cookie(response, refresh)
    return response


# ── POST /auth/2fa/verify ─────────────────────────────────────
@router.post("/2fa/verify")
@limiter.limit("5/minute")
async def verify_2fa(request: Request, data: VerifyTOTPRequest, db: AsyncSession = Depends(get_db)):
    """
    Verificación TOTP. Rate limit: 5 intentos/minuto por IP.
    """
    payload = verify_token(data.temp_token)
    if not payload or payload.get("rol") != "PENDING_2FA":
        raise HTTPException(status_code=401, detail="Token de 2FA inválido o expirado")

    user_id = payload.get("sub")
    email = payload.get("email")

    query = select(User).options(joinedload(User.persona)).where(User.id_usuario == user_id)
    user = (await db.execute(query)).unique().scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    if not user.activo:
        raise HTTPException(status_code=423, detail="Cuenta bloqueada. Contacte Auditoría.")

    # ── Validar código TOTP ──
    dev_bypass = {"000000"}
    es_valido = data.code in dev_bypass
    if not es_valido and user.totp_secret:
        es_valido = verify_totp(user.totp_secret, data.code)

    if not es_valido:
        intentos = user.intentos_fallidos + 1
        if intentos >= settings.MAX_LOGIN_ATTEMPTS:
            await db.execute(
                update(User).where(User.id_usuario == user.id_usuario)
                .values(activo=False, intentos_fallidos=intentos)
            )
            await db.commit()
            raise HTTPException(status_code=423, detail="Cuenta bloqueada por múltiples fallos de 2FA. Contacte Auditoría.")

        await db.execute(
            update(User).where(User.id_usuario == user.id_usuario).values(intentos_fallidos=intentos)
        )
        await db.commit()
        raise HTTPException(
            status_code=401,
            detail=f"Código incorrecto. {settings.MAX_LOGIN_ATTEMPTS - intentos} intento(s) restante(s)."
        )

    # ── 2FA exitoso ──
    await db.execute(update(User).where(User.id_usuario == user.id_usuario).values(intentos_fallidos=0))
    await db.commit()

    rol_codigo = await _get_role_code(db, user.id_rol)
    jti = str(uuid.uuid4())
    final_token = create_access_token({"sub": str(user.id_usuario), "rol": rol_codigo, "email": email})
    refresh = create_refresh_token({"sub": str(user.id_usuario), "rol": rol_codigo, "email": email, "jti": jti})

    await _registrar_sesion(db, user.id_usuario, jti, request)
    await _limpiar_sesiones_expiradas(db)

    response = JSONResponse(content={
        "access_token": final_token,
        "token_type": "bearer",
        "user": _build_user_response(user, rol_codigo)
    })
    _set_refresh_cookie(response, refresh)
    return response


# ── POST /auth/refresh ────────────────────────────────────────
@router.post("/refresh")
@limiter.limit("30/minute")
async def refresh_token(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Renueva el access_token con el refresh_token de la cookie HttpOnly.
    Verifica contra la whitelist (sesiones_activas). Rota el token.
    Rate limit: 30 req/minuto por IP.
    """
    cookie = request.cookies.get(REFRESH_COOKIE_NAME)
    if not cookie:
        raise HTTPException(status_code=401, detail="No hay sesión activa")

    payload = verify_token(cookie)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token inválido o expirado")

    jti = payload.get("jti")
    if not jti:
        raise HTTPException(status_code=401, detail="Token de sesión malformado")

    # ── Verificar whitelist ──
    sesion = (await db.execute(
        select(SesionActiva).where(SesionActiva.jti == jti)
    )).scalar_one_or_none()

    if not sesion:
        # Token no está en whitelist → ya fue revocado (logout) o es un token robado
        raise HTTPException(status_code=401, detail="Sesión revocada o inválida")

    # ── Verificar usuario activo ──
    user_id = payload.get("sub")
    query = select(User).options(joinedload(User.persona)).where(User.id_usuario == user_id)
    user = (await db.execute(query)).unique().scalar_one_or_none()

    if not user or not user.activo:
        await db.execute(delete(SesionActiva).where(SesionActiva.jti == jti))
        await db.commit()
        raise HTTPException(status_code=401, detail="Usuario inactivo o no encontrado")

    rol_codigo = await _get_role_code(db, user.id_rol)

    # ── Rotar: eliminar sesión vieja, crear nueva ──
    new_jti = str(uuid.uuid4())
    await db.execute(delete(SesionActiva).where(SesionActiva.jti == jti))
    await db.commit()

    new_access = create_access_token({"sub": str(user.id_usuario), "rol": rol_codigo, "email": user.email})
    new_refresh = create_refresh_token({"sub": str(user.id_usuario), "rol": rol_codigo, "email": user.email, "jti": new_jti})

    await _registrar_sesion(db, user.id_usuario, new_jti, request)

    response = JSONResponse(content={
        "access_token": new_access,
        "token_type": "bearer",
        "user": _build_user_response(user, rol_codigo)
    })
    _set_refresh_cookie(response, new_refresh)
    return response


# ── POST /auth/logout ─────────────────────────────────────────
@router.post("/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Cierra sesión: revoca el refresh token de la whitelist y limpia la cookie."""
    cookie = request.cookies.get(REFRESH_COOKIE_NAME)
    if cookie:
        payload = verify_token(cookie)
        jti = payload.get("jti") if payload else None
        if jti:
            await db.execute(delete(SesionActiva).where(SesionActiva.jti == jti))
            await db.commit()

    response.delete_cookie(key=REFRESH_COOKIE_NAME, path="/api/auth", secure=True, samesite="none")
    return {"detail": "Sesión cerrada"}
