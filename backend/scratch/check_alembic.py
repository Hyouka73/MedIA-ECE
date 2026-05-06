
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check_alembic_version():
    engine = create_async_engine("postgresql+asyncpg://MedSys_dev:dev_pass_changeme@localhost:5432/MedSys_db")
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT version_num FROM alembic_version"))
        versions = result.fetchall()
        print(f"Current alembic versions: {[v[0] for v in versions]}")

if __name__ == "__main__":
    asyncio.run(check_alembic_version())
