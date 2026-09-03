import asyncio
import asyncpg
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://MedSys_dev:your_password@localhost:5432/MedSys_db")

sql_files = [
    "database/01_schema.sql",
    "database/02_triggers.sql",
    "database/03_seeds_geograficos.sql",
    "database/04_seeds_clinicos.sql",
    "database/05_seeds_sistema.sql",
    "database/06_seeds_superadmin.sql"
]

async def run_sql_files():
    try:
        print("🔌 Conectando a PostgreSQL local...")
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Conectado a MedSys_db")

        for file in sql_files:
            print(f"📄 Ejecutando {os.path.basename(file)}...")
            with open(file, 'r', encoding='utf-8') as f:
                sql = f.read()
                
            try:
                await conn.execute(sql)
                print("   ✓ Éxito")
            except Exception as e:
                print(f"   ❌ Error: {e}")
                
        await conn.close()
        print("🎉 Todos los scripts aplicados.")
    except Exception as e:
        print(f"❌ Error crítico: {e}")

if __name__ == "__main__":
    asyncio.run(run_sql_files())