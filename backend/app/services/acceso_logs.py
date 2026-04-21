import os
from fastapi import APIRouter, HTTPException

router = APIRouter()

# Localizamos la carpeta 'logs' que está en la raíz de MedIA-ECE
LOGS_DIR = os.path.join(os.getcwd(), 'logs')
FORENSIC_LOG_FILE = os.path.join(LOGS_DIR, "auditoria_forense.log")

@router.get("/api/seguridad/logs-forenses")
async def get_forensic_logs():
    """
    Lee las últimas líneas del log forense firmado digitalmente.
    """
    if not os.path.exists(FORENSIC_LOG_FILE):
        return {"content": ["> SISTEMA: El archivo auditoria_forense.log aún no ha sido generado."]}

    try:
        with open(FORENSIC_LOG_FILE, "r", encoding="utf-8") as f:
            # Traemos las últimas 50 líneas para que la terminal no se sature
            lineas = f.readlines()
            ultimas_lineas = lineas[-50:]
            return {"content": ultimas_lineas}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al leer el sistema de archivos: {str(e)}")