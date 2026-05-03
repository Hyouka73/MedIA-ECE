import asyncio
import os
import sys

# Añadir el path del backend para que encuentre 'app'
sys.path.append(os.getcwd())

from app.database.session import AsyncSessionLocal
from app.models.encuentros import EspecialidadMedica, EncuentroClinico
from app.models.notas_soap import NotaMedica
from app.models.auth import Referencia
from sqlalchemy import select

async def check_specialties():
    print("--- Diagnostico de especialidades ---")
    async with AsyncSessionLocal() as db:
        try:
            res = await db.execute(select(EspecialidadMedica))
            data = res.scalars().all()
            print(f"Total de especialidades: {len(data)}")
            if len(data) == 0:
                print("!!! EL CATALOGO ESTA VACIO !!!")
            for e in data:
                print(f"ID: {e.id_especialidad} | Nombre: {e.nombre}")
        except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(check_specialties())
