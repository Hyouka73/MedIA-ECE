import asyncio
import asyncpg
from uuid import uuid4

DATABASE_URL = "postgresql://media_dev:dev_pass_changeme@localhost:5432/media_db"

async def create_demo_patient():
    try:
        print("🔌 Conectando a PostgreSQL...")
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Conectado")

        patient_id = "48d6bb01-cf42-4797-ba38-7527936f8968"
        persona_id = str(uuid4())

        # Insert persona
        await conn.execute("""
            INSERT INTO personas (id_persona, nombre, primer_apellido, segundo_apellido, curp, fecha_nacimiento, sexo, telefono, calle_numero)
            VALUES ($1, 'García Hernández', 'Rosa', 'María', 'GAHM860723MDFGRR09', '1986-07-23', 'F', '55 1234-5678', 'Calle Principal #123')
        """, persona_id)

        # Insert paciente
        await conn.execute("""
            INSERT INTO pacientes (id_paciente, id_persona, numero_expediente, grupo_sanguineo)
            VALUES ($1, $2, 'EXP-2025-148320005', 'O+')
        """, patient_id, persona_id)

        print("✅ Paciente demo creado")
        await conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(create_demo_patient())