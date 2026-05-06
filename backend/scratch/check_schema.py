
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check_schema():
    engine = create_async_engine('postgresql+asyncpg://MedSys_dev:dev_pass_changeme@localhost:5432/MedSys_db')
    try:
        async with engine.connect() as conn:
            # Check for column 'eliminado_en' in 'alergias'
            res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'alergias' AND column_name = 'eliminado_en'"))
            has_soft_delete = len(res.fetchall()) > 0
            print(f"Has soft delete in alergias: {has_soft_delete}")
            
            # Check for column 'url_foto' in 'personas'
            res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'personas' AND column_name = 'url_foto'"))
            has_url_foto = len(res.fetchall()) > 0
            print(f"Has url_foto in personas: {has_url_foto}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_schema())
