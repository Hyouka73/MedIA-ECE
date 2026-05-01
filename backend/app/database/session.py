"""
Sesión de Base de Datos (SQLAlchemy Async)
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


from starlette.requests import Request
from sqlalchemy import text

async def get_db(request: Request = None):
    """Generador de sesiones para inyección de dependencias.
    Seta myapp.current_user para auditoría por triggers.
    """
    async with AsyncSessionLocal() as session:
        try:
            # Si hay un usuario autenticado, setear el contexto en la sesión de BD
            if request and hasattr(request.state, "user"):
                user_id = request.state.user.get("sub")
                if user_id:
                    # set_config es la forma segura de setear variables de sesión en Postgres
                    await session.execute(
                        text("SELECT set_config('myapp.current_user', :uid, false)"),
                        {"uid": str(user_id)}
                    )
            
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
