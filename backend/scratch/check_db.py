import asyncio
import sys
import os

sys.path.append(os.getcwd())

from app.database.session import engine
from sqlalchemy import text

async def check_patient_allergies():
    patient_id = '9550ee52-996c-43ae-8edf-e99df818a6bd'
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT alergia FROM alergias WHERE id_paciente = :pid"), {"pid": patient_id})
        rows = res.fetchall()
        print(f"DEBUG_DATA_START")
        if not rows:
            print("P5_MSG: No alergias.")
        for row in rows:
            print(f"P5_ALERGIA: '{row[0]}'")
        print(f"DEBUG_DATA_END")

if __name__ == "__main__":
    asyncio.run(check_patient_allergies())
