import asyncio
import asyncpg

async def check():
    conn = await asyncpg.connect('postgresql://MedSys_dev:dev_pass_changeme@localhost:5432/MedSys_db')
    result = await conn.fetchrow('SELECT * FROM pacientes WHERE id_paciente = $1', '48d6bb01-cf42-4797-ba38-7527936f8968')
    print('Paciente:', result)
    if result:
        persona = await conn.fetchrow('SELECT * FROM personas WHERE id_persona = $1', result['id_persona'])
        print('Persona:', persona)
    await conn.close()

if __name__ == "__main__":
    asyncio.run(check())