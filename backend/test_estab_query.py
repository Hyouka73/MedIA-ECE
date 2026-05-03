import asyncio
import os
import sys

# Añadir el path del backend para que encuentre 'app'
sys.path.append(os.getcwd())

from app.database.session import AsyncSessionLocal
from app.models import Establecimiento, EstablecimientoEspecialidad
from sqlalchemy import select, func

async def test_query():
    print("--- Probando consulta de establecimientos ---")
    async with AsyncSessionLocal() as db:
        try:
            subq = (
                select(func.count(EstablecimientoEspecialidad.id_especialidad))
                .where(EstablecimientoEspecialidad.id_establecimiento == Establecimiento.id_establecimiento)
                .where(EstablecimientoEspecialidad.activo == True)
                .scalar_subquery()
            )
            
            query = select(
                Establecimiento.id_establecimiento,
                Establecimiento.clues,
                Establecimiento.nombre,
                subq.label("num_especialidades")
            )
            
            res = await db.execute(query)
            rows = res.all()
            print(f"Total filas encontradas: {len(rows)}")
            for r in rows:
                print(f"ID: {r.id_establecimiento} | Nombre: {r.nombre} | Especialidades: {r.num_especialidades}")
                
        except Exception as e:
            print(f"ERROR EN CONSULTA: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_query())
