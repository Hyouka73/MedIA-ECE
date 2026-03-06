import resend
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        if settings.RESEND_API_KEY:
            resend.api_key = settings.RESEND_API_KEY
        else:
            logger.warning("RESEND_API_KEY no configurado. Los correos se imprimirán en consola.")

    def send_2fa_token(self, to_email: str, token: str):
        if not settings.RESEND_API_KEY:
            print(f"[{__name__}] 📧 Correo Simulado a {to_email}")
            print(f"Tu código de acceso es: {token}")
            return True

        try:
            params = {
                "from": settings.RESEND_FROM_EMAIL,
                "to": [to_email],
                "subject": "Código de Acceso (2FA) - MedIA ECE",
                "html": f"""
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; max-width: 500px;">
                    <h2 style="color: #0d47a1;">Validación de Acceso</h2>
                    <p>Hola,</p>
                    <p>Has solicitado iniciar sesión en el expediente clínico electrónico MedIA. Usa el siguiente código para completar tu inicio de sesión:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; border-radius: 3px; margin: 20px 0;">
                        {token}
                    </div>
                    <p style="font-size: 12px; color: #757575;">Este código expirará en unos minutos. Si no solicitaste este acceso, por favor ignora este correo y notifica a tu administrador.</p>
                </div>
                """
            }
            email = resend.Emails.send(params)
            logger.info(f"Correo 2FA enviado a {to_email}. ID: {email.get('id')}")
            return True
        except Exception as e:
            logger.error(f"Error enviando correo con Resend a {to_email}: {e}")
            return False

email_service = EmailService()
