import asyncio
import asyncpg
import os

HOST = "media-pg-server.postgres.database.azure.com"
DB = "media_prod"
USER = "mediaadmin"
PASS = "M3di4#_26"

sql_files = [
    r"d:\MEDSYS\database\01_schema.sql",
    r"d:\MEDSYS\database\02_triggers.sql",
    r"d:\MEDSYS\database\03_seeds_geograficos.sql",
    r"d:\MEDSYS\database\04_seeds_clinicos.sql",
    r"d:\MEDSYS\database\05_seeds_sistema.sql",
    r"d:\MEDSYS\database\06_seeds_superadmin.sql"
]

async def run_sql_files():
    try:
        print("🔌 Conectando a Azure PostgreSQL...")
        # Flexible Server requiere SSL (require se manda en el context u omitimos para que lo maneje asyncpg)
        conn = await asyncpg.connect(host=HOST, database=DB, user=USER, password=PASS, ssl='require')
        print("✅ Conectado a media_prod")

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
