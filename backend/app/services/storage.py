import uuid
import logging
from typing import Optional
from typing import BinaryIO
from datetime import datetime, timedelta, timezone
import os

from app.core.config import settings

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self.connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
        self.blob_service_client = None

        if self.connection_string:
            self.blob_service_client = self._create_blob_service_client()
        else:
            logger.warning("AZURE_STORAGE_CONNECTION_STRING no está definido. Almacenamiento en nube desactivado.")

    def _create_blob_service_client(self):
        try:
            from azure.storage.blob import BlobServiceClient

            return BlobServiceClient.from_connection_string(self.connection_string)
        except Exception as e:
            logger.error(f"Azure Storage falló inicialización: {e}")
            return None

    def _get_container_client(self, container_name: str):
        if not self.blob_service_client:
            raise Exception("Azure Blob Storage no configurado en entorno.")

        try:
            from azure.core.exceptions import ResourceExistsError
        except Exception:
            ResourceExistsError = Exception

        container_client = self.blob_service_client.get_container_client(container_name)
        try:
            container_client.create_container()
            logger.info(f"Container '{container_name}' creado en Azure Storage.")
        except ResourceExistsError:
            pass # Ya existe
        
        return container_client

    async def upload_file(self, file_content: BinaryIO, extension: str, container_name: str, content_type: str = "application/octet-stream") -> Optional[str]:
        """
        Sube un archivo de forma síncrona/en un thread.
        Crea nombres únicos (UUIDs)
        """
        if not self.blob_service_client:
            logger.warning(f"Upload simulado local: {extension} en {container_name}")
            static_dir = os.path.join(os.getcwd(), 'static', container_name)
            os.makedirs(static_dir, exist_ok=True)
            
            filename = f"simulado-{uuid.uuid4()}{extension}"
            file_path = os.path.join(static_dir, filename)
            
            file_content.seek(0)
            with open(file_path, 'wb') as f:
                f.write(file_content.read())
                
            return f"http://localhost:8000/static/{container_name}/{filename}"

        filename = f"{uuid.uuid4()}{extension}"
        container_client = self._get_container_client(container_name)
        blob_client = container_client.get_blob_client(filename)

        try:
            # Read and upload
            file_content.seek(0)
            blob_client.upload_blob(file_content.read(), overwrite=True, content_settings={"content_type": content_type})
            logger.info(f"Blob subido a {blob_client.url}")
            return blob_client.url
        except Exception as e:
            logger.error(f"Fallo al subir a Blob: {e}")
            return None

storage_service = StorageService()
