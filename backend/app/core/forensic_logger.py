import json
import hmac
import hashlib
import os
from datetime import datetime, timezone
from app.core.config import settings
import logging

# Ensure logs directory exists
LOGS_DIR = os.path.join(os.getcwd(), 'logs')
os.makedirs(LOGS_DIR, exist_ok=True)

FORENSIC_LOG_FILE = os.path.join(LOGS_DIR, "auditoria_forense.log")

# A signature secret to sign logs (could be in .env, using JWT_SECRET_KEY as fallback)
FORENSIC_SECRET = getattr(settings, "JWT_SECRET_KEY", "default-forensic-secret")

logger = logging.getLogger("media.forensics")

def log_forensic_event(
    usuario: str, 
    accion: str, 
    resultado: str, 
    ip: str = "0.0.0.0", 
    hash_archivo: str = None, 
    detalles: dict = None
):
    """
    Req 1 - Logging Forense (Requerimientos proyecto finales.pdf)
    Registra toda acción en un archivo independiente, con timestamp ISO8601,
    y protegido mediante firma digital (HMAC) para asegurar inmutabilidad manual.
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    
    event_data = {
        "timestamp": timestamp,
        "usuario": usuario or "SISTEMA",
        "accion": accion,
        "resultado": resultado,
        "ip": ip,
    }
    
    if hash_archivo:
        event_data["hash_archivo"] = hash_archivo
        
    if detalles:
        event_data["detalles"] = detalles

    # Sort keys for consistent serialization
    serialized_event = json.dumps(event_data, sort_keys=True, ensure_ascii=False)
    
    # Create digital signature of the event to detect manual tampering
    signature = hmac.new(
        FORENSIC_SECRET.encode('utf-8'), 
        serialized_event.encode('utf-8'), 
        hashlib.sha256
    ).hexdigest()
    
    log_line = f"{serialized_event} | SIG:{signature}\n"
    
    try:
        # Append-only (archivo independiente)
        with open(FORENSIC_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(log_line)
    except Exception as e:
        logger.error(f"Fallo crítico escribiendo log forense: {e}")
