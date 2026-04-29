import bleach
from typing import Optional

def sanitize_input(text: Optional[str]) -> Optional[str]:
    """
    Limpia etiquetas HTML peligrosas de una cadena de texto para prevenir ataques XSS.
    Utiliza la librería bleach para permitir un subconjunto seguro de etiquetas si es necesario,
    o eliminar todas las etiquetas por defecto.
    """
    if text is None:
        return None
    
    if not isinstance(text, str):
        return text

    # Por defecto, eliminamos TODAS las etiquetas HTML para campos de texto plano
    # Si en el futuro se requiere Markdown o HTML básico, se pueden configurar tags permitidos aquí.
    return bleach.clean(text, tags=[], attributes={}, strip=True)
