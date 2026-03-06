"""
Schemas Pydantic v2 — Autenticación
Contratos de request/response para el módulo Auth (Doc3 §Módulo 1)
"""
from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    nombre: str
    rol: str
    email: str
    establecimiento: Optional[str] = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    requires_2fa: bool = False
    user: Optional[UserOut] = None  # None si requires_2fa=True (aún no autenticado del todo)
    temp_token: Optional[str] = None  # Solo presente cuando requires_2fa=True


class TotpVerifyIn(BaseModel):
    temp_token: str
    code: str


class TotpSetupOut(BaseModel):
    secret: str
    qr_uri: str
