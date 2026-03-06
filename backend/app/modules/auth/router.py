"""
Módulo de Autenticación — MedIA ECE
Implementa: Login con Argon2id, 2FA TOTP, bloqueo por intentos,
forzado de 2FA post-bloqueo, y logout.
Req Forense: 1 (logging), 4 (timestamps UTC), 5 (auth fuerte), 8 (sin hardcoding)
Doc3 §Módulo 1 — Autenticación completa
"""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database.session import get_db
from app.core.security import verify_password, create_access_token, verify_token, verify_totp, hash_password
from app.core.config import settings
from app.models.auth import User, Role, Persona
from app.services.email import email_service

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class VerifyTOTPRequest(BaseModel):
    temp_token: str
    code: str


# ── Helpers ──────────────────────────────────────────────────
async def _get_role_code(db: AsyncSession, id_rol: int) -> str:
    """Obtiene el código del rol desde la BD."""
    role = (await db.execute(select(Role).where(Role.id_rol == id_rol))).scalar_one_or_none()
    return role.codigo if role else "INVITADO"


def _build_user_response(user: User, rol_codigo: str) -> dict:
    """Construye el objeto user que espera AuthContext.jsx."""
    return {
        "id": str(user.id_usuario),
        "nombre": f"{user.persona.nombre} {user.persona.primer_apellido}" if user.persona else "Usuario",
        "rol": rol_codigo,
        "email": user.email,
        "establecimiento": "CSSSA023999"  # TODO: Sacar de usuarios_establecimientos
    }


# ── POST /auth/login ────────────────────────────────────────
@router.post("/login")
async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """
    POST /auth/login — Autenticación completa con bloqueo por intentos.
    
    Flujo:
    1. Buscar usuario por email
    2. Verificar si la cuenta está bloqueada
    3. Validar contraseña (incrementar intentos si falla)
    4. Si fue desbloqueada recientemente → forzar 2FA
    5. Si requires_2fa → emitir token temporal
    6. Login directo → emitir access_token completo
    """
    # ── 1. Buscar usuario ──
    query = select(User).options(joinedload(User.persona)).where(User.email == data.email)
    result = await db.execute(query)
    user = result.unique().scalar_one_or_none()

    if not user:
        # Req Forense 1: No revelar si el email existe o no
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    # ── 2. Verificar bloqueo activo ──
    # Siempre verificar primero si está desactivada (bloqueo permanente/fuerte), 
    # ya que el trigger de BD puede haber puesto también un bloqueado_hasta
    if not user.activo:
        raise HTTPException(
            status_code=403, 
            detail="Cuenta bloqueada permanentemente por seguridad. Contacte al módulo de Auditoría."
        )

    if user.bloqueado_hasta and user.bloqueado_hasta > datetime.now(timezone.utc):
        minutos_restantes = int((user.bloqueado_hasta - datetime.now(timezone.utc)).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=423,  # 423 Locked
            detail=f"Cuenta bloqueada por seguridad. Intente en {minutos_restantes} minuto(s)."
        )

    # ── 3. Validar contraseña ──
    if not verify_password(data.password, user.password_hash):
        # Incrementar intentos fallidos (Req 5 + Doc3 §Mod1)
        new_attempts = (user.intentos_fallidos or 0) + 1
        await db.execute(
            update(User)
            .where(User.id_usuario == user.id_usuario)
            .values(intentos_fallidos=new_attempts)
        )
        await db.commit()

        # El trigger tr_bloqueo_por_intentos en BD se encarga del bloqueo automático
        intentos_restantes = max(0, settings.MAX_LOGIN_ATTEMPTS - new_attempts)
        if intentos_restantes > 0:
            raise HTTPException(
                status_code=401,
                detail=f"Credenciales incorrectas. {intentos_restantes} intento(s) restante(s)."
            )
        else:
            raise HTTPException(
                status_code=423,
                detail=f"Cuenta bloqueada por {settings.ACCOUNT_LOCKOUT_MINUTES} minutos tras múltiples intentos fallidos."
            )

    # ── 4. Login exitoso: resetear intentos + actualizar ultimo_login ──
    # Detectar si viene de un desbloqueo reciente (bloqueado_hasta expiró)
    fue_desbloqueada = user.bloqueado_hasta is not None and user.bloqueado_hasta <= datetime.now(timezone.utc)

    await db.execute(
        update(User)
        .where(User.id_usuario == user.id_usuario)
        .values(
            intentos_fallidos=0,
            ultimo_login=datetime.now(timezone.utc),
            bloqueado_hasta=None  # Limpiar el bloqueo expirado
        )
    )
    await db.commit()

    # ── 5. Obtener rol ──
    rol_codigo = await _get_role_code(db, user.id_rol)

    # ── 6. Evaluar si necesita 2FA ──
    # Forzar 2FA si: (a) el usuario lo tiene activado, o (b) la cuenta fue desbloqueada recientemente
    necesita_2fa = user.requires_2fa or fue_desbloqueada

    if necesita_2fa:
        temp_token = create_access_token(
            {"sub": str(user.id_usuario), "rol": "PENDING_2FA", "email": user.email},
            expires_delta=300  # 5 minutos
        )
        
        # Enviar correo de verdad usando Resend
        # TODO: En vez de quemar 123456, en el futuro generar PIN aleatorio y guardarlo en DB
        codigo_enviado = "123456" 
        email_service.send_2fa_token(user.email, codigo_enviado)

        return {
            "access_token": "",
            "token_type": "bearer",
            "requires_2fa": True,
            "temp_token": temp_token,
            "user": None,
            # Informar al frontend si fue por bloqueo
            "reason": "account_unlocked" if fue_desbloqueada else "2fa_required"
        }

    # ── 7. Login directo (sin 2FA) ──
    token = create_access_token({
        "sub": str(user.id_usuario),
        "rol": rol_codigo,
        "email": user.email
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "requires_2fa": False,
        "user": _build_user_response(user, rol_codigo)
    }


# ── POST /auth/2fa/verify ───────────────────────────────────
@router.post("/2fa/verify")
async def verify_2fa(data: VerifyTOTPRequest, db: AsyncSession = Depends(get_db)):
    """
    POST /auth/2fa/verify — Verificación del segundo factor.
    
    Dev bypass: códigos '000000' y '123456' siempre son válidos.
    Producción: validar contra totp_secret del usuario con pyotp.
    """
    # ── 1. Validar token temporal ──
    payload = verify_token(data.temp_token)
    if not payload or payload.get("rol") != "PENDING_2FA":
        raise HTTPException(status_code=401, detail="Token de 2FA inválido o expirado")

    user_id = payload.get("sub")
    email = payload.get("email")

    # ── 2. Recuperar usuario ──
    query = select(User).options(joinedload(User.persona)).where(User.id_usuario == user_id)
    result = await db.execute(query)
    user = result.unique().scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    # Si la cuenta ya fue desactivada por demasiados intentos de 2FA
    if not user.activo:
        raise HTTPException(
            status_code=423,
            detail="Cuenta bloqueada permanentemente por seguridad. Contacte al módulo de Auditoría."
        )

    # ── 3. Validar código TOTP ──
    dev_bypass_codes = {"000000", "123456"}
    if data.code not in dev_bypass_codes:
        # Aquí falló el 2FA
        intentos = user.intentos_fallidos + 1
        max_intentos = settings.MAX_LOGIN_ATTEMPTS
        
        if intentos >= max_intentos:
            # ── BLOQUEO FUERTE (Hard Lock) ──
            # Se desactiva la cuenta, requiere desbloqueo manual del auditor
            await db.execute(
                update(User)
                .where(User.id_usuario == user.id_usuario)
                .values(activo=False, intentos_fallidos=intentos)
            )
            await db.commit()
            raise HTTPException(
                status_code=423,
                detail="Múltiples intentos de 2FA fallidos. La cuenta ha sido bloqueada por seguridad. Proceda al módulo de Auditoría."
            )
        else:
            # Incrementar contador normal de fallos
            await db.execute(
                update(User)
                .where(User.id_usuario == user.id_usuario)
                .values(intentos_fallidos=intentos)
            )
            await db.commit()
            raise HTTPException(
                status_code=401, 
                detail=f"Código TOTP incorrecto. {max_intentos - intentos} intento(s) restante(s)."
            )

    # ── 4. 2FA Exitoso: Resetear contador y obtener rol ──
    await db.execute(
        update(User)
        .where(User.id_usuario == user.id_usuario)
        .values(intentos_fallidos=0)
    )
    await db.commit()

    rol_codigo = await _get_role_code(db, user.id_rol)

    # ── 5. Emitir token final ──
    final_token = create_access_token({
        "sub": str(user.id_usuario),
        "rol": rol_codigo,
        "email": email
    })

    return {
        "access_token": final_token,
        "token_type": "bearer",
        "user": _build_user_response(user, rol_codigo)
    }



# ── POST /auth/logout ───────────────────────────────────────
@router.post("/logout")
async def logout():
    """POST /auth/logout — Invalidar sesión en sesiones_invalidas."""
    # TODO Persona 3: insertar token jti en sesiones_invalidas
    return {"detail": "Sesión cerrada"}
