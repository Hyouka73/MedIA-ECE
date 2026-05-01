"""
Seguridad: JWT, hashing Argon2id, TOTP
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Union

from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
import pyotp

from app.core.config import settings

# Argon2id para hashing de contraseñas
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[Union[timedelta, int]] = None) -> str:
    """
    Genera un JWT firmado con HS256.
    expires_delta acepta timedelta o int (segundos).
    Req Forense 4: iat y exp en UTC.
    """
    to_encode = data.copy()
    if isinstance(expires_delta, int):
        expires_delta = timedelta(seconds=expires_delta)
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None


def get_fernet() -> Optional[Fernet]:
    """
    Obtiene la instancia de Fernet para cifrado/descifrado.
    La clave DEBE ser la misma siempre, definida en settings.
    """
    try:
        encryption_key = getattr(settings, 'TOTP_ENCRYPTION_KEY', None)
        
        if not encryption_key:
            print("ERROR: TOTP_ENCRYPTION_KEY no está configurada")
            return None
        
        return Fernet(encryption_key.encode())
    except Exception as e:
        print(f"Error al inicializar Fernet: {e}")
        return None


def encrypt_secret(secret: str) -> str:
    """Cifra la semilla TOTP antes de guardarla en DB."""
    fernet = get_fernet()
    if not fernet:
        raise ValueError("TOTP encryption not properly configured")
    
    return fernet.encrypt(secret.encode()).decode()


def decrypt_secret(encrypted_secret: str) -> str:
    """Descifra la semilla TOTP para validación."""
    if not encrypted_secret:
        return ""
    
    fernet = get_fernet()
    if not fernet:
        raise ValueError("TOTP encryption not properly configured")
    
    try:
        decrypted = fernet.decrypt(encrypted_secret.encode()).decode()
        return decrypted
    except Exception as e:
        # Si hay error, podría ser que el dato no esté cifrado o la clave cambió
        print(f"Error decrypting secret: {e}")
        # Si no parece un token de Fernet (no empieza con gAAAAA), asumir que está en texto plano
        if not encrypted_secret.startswith('gAAAAA'):
            return encrypted_secret
        raise


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def create_refresh_token(data: dict) -> str:
    """
    Genera un JWT de refresh (larga duración, 7 días).
    Lleva type='refresh' para distinguirlo del access token.
    Se envía solo como cookie HttpOnly — nunca en el body.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc), "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_totp(secret: str, code: str) -> bool:
    # Cambio a estándar de 30s para compatibilidad con Google Authenticator
    totp = pyotp.TOTP(secret, interval=30)
    # valid_window=1 permite un margen extra de ±30s por desincronización
    return totp.verify(code, valid_window=1)