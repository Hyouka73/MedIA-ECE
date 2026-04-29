"""
Dependencias reutilizables de FastAPI
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_token
from app.database.session import get_db

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Valida el JWT y devuelve la info del usuario autenticado."""
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def require_role(*roles: str):
    """Dependencia que verifica que el usuario tenga uno de los roles requeridos."""
    # Soporte para llamadas con lista: require_role(["ROL1", "ROL2"])
    flat_roles = roles
    if len(roles) == 1 and isinstance(roles[0], list):
        flat_roles = roles[0]
        
    async def inner(current_user: dict = Depends(get_current_user)):
        if current_user.get("rol") not in flat_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Roles permitidos: {', '.join(flat_roles)}",
            )
        return current_user
    return inner
