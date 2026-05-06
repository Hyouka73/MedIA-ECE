"""
Módulo de Autenticación — MedSys ECE
Login Argon2id, 2FA TOTP, bloqueo por intentos, refresh tokens con whitelist en BD.
Req Forense: 1 (logging), 4 (timestamps UTC), 5 (auth fuerte), 8 (sin hardcoding)
"""
import uuid
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select, update, delete, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
import pyotp

from app.database.session import get_db
from app.core.security import (
    verify_password, create_access_token, create_refresh_token,
    verify_token, verify_totp, generate_totp_secret,
    encrypt_secret, decrypt_secret
)
from app.core.config import settings
from app.models.auth import User, Role, Persona, SesionActiva, UserTrustedIP
from app.models.encuentros import EncuentroClinico
from app.models.notas_soap import NotaMedica
from app.core.deps import get_current_user

from sqlalchemy import text

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


class ConfirmTOTPRequest(BaseModel):
    code: str


# ── Helpers ──────────────────────────────────────────────────
async def _get_role_code(db: AsyncSession, id_rol: int) -> str:
    role = (await db.execute(select(Role).where(Role.id_rol == id_rol))).scalar_one_or_none()
    return role.codigo if role else "INVITADO"


async def _get_user_context(db: AsyncSession, user_id: UUID) -> dict:
    """Obtiene el contexto completo del usuario: establecimiento y especialidad."""
    result_est = await db.execute(
        text("""
            SELECT e.clues, e.nombre, ue.id_establecimiento
            FROM usuarios_establecimientos ue
            JOIN establecimientos e ON e.id_establecimiento = ue.id_establecimiento
            WHERE ue.id_usuario = :user_id
            ORDER BY ue.es_principal DESC
            LIMIT 1
        """),
        {"user_id": str(user_id)}
    )
    est_row = result_est.fetchone()

    result_esp = await db.execute(
        text("""
            SELECT pe.id_especialidad, ce.nombre
            FROM permisos_especialidad pe
            JOIN cat_especialidades_medicas ce ON ce.id_especialidad = pe.id_especialidad
            WHERE pe.id_usuario = :user_id
            LIMIT 1
        """),
        {"user_id": str(user_id)}
    )
    esp_row = result_esp.fetchone()

    # Obtener matriz de permisos por rol
    result_perms = await db.execute(
        text("""
            SELECT m.codigo, p.puede_leer, p.puede_crear, p.puede_editar, p.puede_eliminar
            FROM permisos_rol p
            JOIN cat_modulos m ON m.id_modulo = p.id_modulo
            JOIN usuarios_sistema u ON u.id_rol = p.id_rol
            WHERE u.id_usuario = :user_id
        """),
        {"user_id": str(user_id)}
    )
    perms_rows = result_perms.fetchall()
    permisos = {
        row[0]: {
            "puede_leer": row[1],
            "puede_crear": row[2],
            "puede_editar": row[3],
            "puede_eliminar": row[4]
        }
        for row in perms_rows
    }

    return {
        "establecimiento_clues": est_row[0] if est_row else None,
        "establecimiento_nombre": est_row[1] if est_row else None,
        "id_establecimiento": str(est_row[2]) if est_row else None,
        "id_especialidad": esp_row[0] if esp_row else None,
        "especialidad_nombre": esp_row[1] if esp_row else None,
        "permisos": permisos
    }


def _build_user_response(user: User, rol_codigo: str, context: dict) -> dict:
    return {
        "id": str(user.id_usuario),
        "nombre": f"{user.persona.nombre} {user.persona.primer_apellido}" if user.persona else "Usuario",
        "rol": rol_codigo,
        "email": user.email,
        "url_foto": user.persona.url_foto if user.persona else None,
        "establecimiento_clues": context.get("establecimiento_clues"),
        "establecimiento_nombre": context.get("establecimiento_nombre"),
        "id_establecimiento": context.get("id_establecimiento"),
        "id_especialidad": context.get("id_especialidad"),
        "especialidad_nombre": context.get("especialidad_nombre"),
        "permisos": context.get("permisos", {})
    }


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Cookie HttpOnly Secure SameSite=Lax para desarrollo (en prod: SameSite=None con Secure)."""
    is_dev = settings.APP_ENV == "development"
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=not is_dev,
        samesite="lax" if is_dev else "none",
        max_age=60 * 60 * 24 * 7,
        path="/",
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
@limiter.limit("30/minute")
async def login(request: Request, data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Login con bloqueo por intentos.
    Rate limit: 5 intentos/minuto por IP.
    """
    query = select(User).options(joinedload(User.persona)).where(User.email == data.email)
    user = (await db.execute(query)).unique().scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if not user.activo:
        raise HTTPException(status_code=403, detail="Cuenta bloqueada permanentemente. Contacte Auditoría.")

    if user.bloqueado_hasta and user.bloqueado_hasta > datetime.now(timezone.utc):
        mins = int((user.bloqueado_hasta - datetime.now(timezone.utc)).total_seconds() / 60) + 1
        raise HTTPException(status_code=423, detail=f"Cuenta bloqueada. Intente en {mins} minuto(s).")

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

    fue_desbloqueada = user.bloqueado_hasta is not None and user.bloqueado_hasta <= datetime.now(timezone.utc)
    await db.execute(
        update(User).where(User.id_usuario == user.id_usuario)
        .values(intentos_fallidos=0, ultimo_login=datetime.now(timezone.utc), bloqueado_hasta=None)
    )
    await db.commit()

    rol_codigo = await _get_role_code(db, user.id_rol)
    ip_cliente = request.client.host

    # ── Flujo 2FA Adaptativo ───────────────────────────────────
    # REGLA: Pedir 2FA si tiene TOTP configurado Y (es nueva IP O fue desbloqueada)
    es_ip_conocida = await _is_ip_trusted(db, user.id_usuario, ip_cliente)
    
    if user.requires_2fa and user.totp_secret and user.totp_confirmed and (not es_ip_conocida or fue_desbloqueada):
        temp_token = create_access_token(
            {"sub": str(user.id_usuario), "rol": "PENDING_2FA", "email": user.email},
            expires_delta=300
        )
        
        return {
            "access_token": "",
            "token_type": "bearer",
            "requires_2fa": True,
            "temp_token": temp_token,
            "totp_configured": True,
            "user": None,
            "reason": "account_unlocked" if fue_desbloqueada else "new_ip_detected",
        }

    # Si NO tiene TOTP configurado, permitimos el login pero el frontend 
    # detectará totp_configured=False y redirigirá a /2fa/setup.


    # ── Flujo normal ───────────────────────────────────────────
    jti = str(uuid.uuid4())
    user_context = await _get_user_context(db, user.id_usuario)

    if not user_context.get("id_establecimiento"):
        raise HTTPException(
            status_code=400,
            detail="El usuario no tiene un establecimiento asignado. Contacte al administrador."
        )

    token_data = {
        "sub": str(user.id_usuario),
        "rol": rol_codigo,
        "email": user.email,
        "jti": jti,
        "establecimiento": user_context["establecimiento_clues"],
        "id_establecimiento": user_context["id_establecimiento"],
        "id_especialidad": user_context["id_especialidad"],
    }
    token = create_access_token(token_data)
    refresh = create_refresh_token(token_data)

    await _registrar_sesion(db, user.id_usuario, jti, request)
    await _limpiar_sesiones_expiradas(db)

    response = JSONResponse(content={
        "access_token": token,
        "token_type": "bearer",
        "requires_2fa": False,
        "totp_configured": bool(user.totp_secret and user.totp_confirmed),
        "user": _build_user_response(user, rol_codigo, user_context)
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

    es_valido = False
    if user.totp_secret:
        # Descifrar para validar
        raw_secret = decrypt_secret(user.totp_secret)
        es_valido = verify_totp(raw_secret, data.code)

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

    await db.execute(
        update(User)
        .where(User.id_usuario == user.id_usuario)
        .values(intentos_fallidos=0, totp_confirmed=True)
    )
    await db.commit()

    rol_codigo = await _get_role_code(db, user.id_rol)
    jti = str(uuid.uuid4())
    user_context = await _get_user_context(db, user.id_usuario)

    # Confiar en esta IP tras verificación exitosa
    await _trust_ip(db, user.id_usuario, request.client.host, request.headers.get("user-agent", ""))


    if not user_context.get("id_establecimiento"):
        raise HTTPException(
            status_code=400,
            detail="El usuario no tiene un establecimiento asignado. Contacte al administrador."
        )

    token_data = {
        "sub": str(user.id_usuario), 
        "rol": rol_codigo, 
        "email": email,
        "jti": jti,
        "establecimiento": user_context["establecimiento_clues"],
        "id_establecimiento": user_context["id_establecimiento"],
        "id_especialidad": user_context["id_especialidad"]
    }
    final_token = create_access_token(token_data)
    refresh = create_refresh_token(token_data)

    await _registrar_sesion(db, user.id_usuario, jti, request)
    await _limpiar_sesiones_expiradas(db)

    response = JSONResponse(content={
        "access_token": final_token,
        "token_type": "bearer",
        "user": _build_user_response(user, rol_codigo, user_context),
    })
    _set_refresh_cookie(response, refresh)
    return response


# ── POST /auth/2fa/setup ──────────────────────────────────────
@router.post("/2fa/setup")
@limiter.limit("10/minute")
async def setup_2fa(
    request: Request, 
    db: AsyncSession = Depends(get_db),
    payload: dict = Depends(get_current_user)
):
    """
    Genera una nueva semilla TOTP para el usuario.
    Solo para usuarios con sesión completa.
    """
    user_id = payload.get("sub")
    
    # Obtener el usuario real de la DB
    query = select(User).where(User.id_usuario == user_id)
    user = (await db.execute(query)).scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    raw_secret = generate_totp_secret()
    user.totp_secret = encrypt_secret(raw_secret)
    user.requires_2fa = True
    user.totp_confirmed = False
    
    await db.commit()
    await db.refresh(user)
    
    # Generar URI para QR
    provisioning_uri = pyotp.TOTP(raw_secret).provisioning_uri(
        name=user.email, 
        issuer_name="MedSys"
    )
    
    return {
        "provisioning_uri": provisioning_uri,
        "secret_key": raw_secret
    }


# ── POST /auth/2fa/confirm ────────────────────────────────────
@router.post("/2fa/confirm")
async def confirm_2fa(
    request: Request,
    data: ConfirmTOTPRequest,
    db: AsyncSession = Depends(get_db),
    payload: dict = Depends(get_current_user)
):
    """
    Confirma el setup inicial del TOTP mediante el primer código válido.
    """
    user_id = payload.get("sub")
    query = select(User).where(User.id_usuario == user_id)
    user = (await db.execute(query)).scalar_one_or_none()

    if not user or not user.totp_secret:
        raise HTTPException(status_code=400, detail="El 2FA no ha sido iniciado")

    # Descifrar y verificar el código
    raw_secret = decrypt_secret(user.totp_secret)
    if not verify_totp(raw_secret, data.code):
        raise HTTPException(status_code=400, detail="Código de verificación incorrecto")

    # Si es correcto, confirmar permanentemente
    user.totp_confirmed = True
    await db.commit()

    return {"success": True, "detail": "2FA confirmado y activado correctamente"}


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

    sesion = (await db.execute(
        select(SesionActiva).where(SesionActiva.jti == jti)
    )).scalar_one_or_none()

    if not sesion:
        raise HTTPException(status_code=401, detail="Sesión revocada o inválida")

    user_id = payload.get("sub")
    query = select(User).options(joinedload(User.persona)).where(User.id_usuario == user_id)
    user = (await db.execute(query)).unique().scalar_one_or_none()

    if not user or not user.activo:
        await db.execute(delete(SesionActiva).where(SesionActiva.jti == jti))
        await db.commit()
        raise HTTPException(status_code=401, detail="Usuario inactivo o no encontrado")

    rol_codigo = await _get_role_code(db, user.id_rol)
    new_jti = str(uuid.uuid4())

    # Revocar sesión vieja antes de crear la nueva
    await db.execute(delete(SesionActiva).where(SesionActiva.jti == jti))
    await db.commit()

    user_context = await _get_user_context(db, user.id_usuario)

    if not user_context.get("id_establecimiento"):
        raise HTTPException(
            status_code=400,
            detail="El usuario no tiene un establecimiento asignado. Contacte al administrador."
        )

    token_data = {
        "sub": str(user.id_usuario),
        "rol": rol_codigo,
        "email": user.email,
        "jti": new_jti,
        "establecimiento": user_context["establecimiento_clues"],
        "id_establecimiento": user_context["id_establecimiento"],
        "id_especialidad": user_context["id_especialidad"],
    }
    new_access = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)

    await _registrar_sesion(db, user.id_usuario, new_jti, request)

    response = JSONResponse(content={
        "access_token": new_access,
        "token_type": "bearer",
        "user": _build_user_response(user, rol_codigo, user_context),
    })
    _set_refresh_cookie(response, new_refresh)
    return response


# ── POST /auth/logout ─────────────────────────────────────────
@router.post("/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """
    Cierra sesión: revoca el refresh token de la BD, limpia la cookie,
    y quema el access token en memoria (Blacklist Forense).
    """
    cookie = request.cookies.get(REFRESH_COOKIE_NAME)
    if cookie:
        payload_rt = verify_token(cookie)
        jti_rt = payload_rt.get("jti") if payload_rt else None
        if jti_rt:
            await db.execute(delete(SesionActiva).where(SesionActiva.jti == jti_rt))
            await db.commit()

    is_dev = settings.APP_ENV == "development"
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/",
        secure=not is_dev,
        samesite="lax" if is_dev else "none",
    )

    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        access_token = auth_header[7:]
        payload_at = verify_token(access_token)

        if payload_at:
            jti_at = payload_at.get("jti")
            email = payload_at.get("email", "Usuario Desconocido")
            exp = payload_at.get("exp")

            if jti_at and hasattr(request.app.state, "blacklist_tokens"):
                if jti_at not in request.app.state.blacklist_tokens:
                    request.app.state.blacklist_tokens.add(jti_at)
                    request.app.state.blacklist_detalles.append({
                        "jti": jti_at,
                        "usuario": email,
                        "motivo": "Cierre de sesión manual",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "expires_at": datetime.fromtimestamp(exp, tz=timezone.utc).isoformat() if exp else None,
                    })

    return {"detail": "Sesión cerrada y tokens revocados exitosamente"}


# ── Helpers de Adaptabilidad 2FA ──────────────────────────────
async def _is_ip_trusted(db: AsyncSession, user_id: UUID, ip: str) -> bool:
    """Verifica si la IP ya ha sido validada anteriormente para este usuario."""
    stmt = select(UserTrustedIP).where(
        UserTrustedIP.id_usuario == user_id,
        UserTrustedIP.ip_direccion == ip
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None


async def _trust_ip(db: AsyncSession, user_id: UUID, ip: str, user_agent: str):
    """Registra o actualiza una IP como confiable tras un 2FA exitoso."""
    stmt = select(UserTrustedIP).where(
        UserTrustedIP.id_usuario == user_id,
        UserTrustedIP.ip_direccion == ip
    )
    result = await db.execute(stmt)
    trusted = result.scalar_one_or_none()
    
    if not trusted:
        db.add(UserTrustedIP(
            id_usuario=user_id, 
            ip_direccion=ip, 
            user_agent=user_agent
        ))
    else:
        trusted.ultima_vez_vista = datetime.now(timezone.utc)
    # El commit se maneja en el flujo que llama a este helper
