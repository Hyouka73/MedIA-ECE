"""
Configuración centralizada vía Pydantic Settings
Lee del archivo .env automáticamente
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Entorno
    APP_ENV: str = "development"
    APP_NAME: str = "MedIA-ECE"
    DEBUG: bool = True

    # Base de Datos
    DATABASE_URL: str = "postgresql+asyncpg://media_dev:dev_pass_changeme@localhost:5432/media_db"

    # JWT
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # TOTP / 2FA
    TOTP_ISSUER: str = "MedIA-ECE"
    TOTP_ENCRYPTION_KEY: str = "CHANGE_ME_IN_PRODUCTION"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    # Seguridad
    MAX_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_MINUTES: int = 30

    # Azure Blob Storage (opcional en dev)
    AZURE_STORAGE_CONNECTION_STRING: Optional[str] = None
    AZURE_BLOB_CONTAINER_LAB: str = "lab-results"
    AZURE_BLOB_CONTAINER_TUTORES: str = "tutores-docs"
    AZURE_BLOB_SAS_EXPIRY_MINUTES: int = 15



    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore"  # Ignorar variables de entorno extra que no estén definidas aquí
    }


settings = Settings()
