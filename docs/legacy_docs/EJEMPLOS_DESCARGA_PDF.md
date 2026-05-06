# Ejemplos de Uso — Endpoint GET /notas/{id}/pdf

## 1. cURL (Línea de Comandos)

### Descargar PDF directamente

```bash
#!/bin/bash
# Variables
API_URL="http://localhost:8000"
NOTA_ID="550e8400-e29b-41d4-a716-446655440000"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Descargar PDF
curl -X GET "${API_URL}/notas/${NOTA_ID}/pdf" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/pdf" \
  -o "Nota_SOAP_${NOTA_ID}.pdf" \
  -v

# -v: Mostrar headers de request/response
# -o: Guardar en archivo
```

### Con validación de respuesta

```bash
curl -X GET "http://localhost:8000/notas/550e8400-e29b-41d4-a716-446655440000/pdf" \
  -H "Authorization: Bearer ${TOKEN}" \
  -w "\nStatus: %{http_code}\n" \
  -o nota.pdf

# Códigos esperados:
# 200: PDF generado exitosamente
# 404: Nota no encontrada
# 403: Nota no firmada
# 400: Datos incompletos
```

---

## 2. JavaScript/TypeScript (Frontend React)

### Función Helper para Descargar

```javascript
// utils/pdf.js
export async function descargarPDF(notaId, token) {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/notas/${notaId}/pdf`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error descargando PDF');
    }

    // Crear blob del PDF
    const blob = await response.blob();
    
    // Crear URL temporal
    const url = window.URL.createObjectURL(blob);
    
    // Crear elemento <a> para descargar
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nota_SOAP_${notaId}.pdf`;
    
    // Trigger descarga
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error descargando PDF:', error);
    throw error;
  }
}
```

### Componente React

```jsx
// components/NotaSOAPViewer.jsx
import React, { useState } from 'react';
import { descargarPDF } from '../utils/pdf';

export default function NotaSOAPViewer({ nota, token }) {
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState(null);

  const handleDescargarPDF = async () => {
    setDescargando(true);
    setError(null);

    try {
      // Solo permitir descargar si está firmada
      if (!nota.esta_firmada) {
        setError('La nota debe estar firmada antes de descargar PDF');
        return;
      }

      await descargarPDF(nota.id_nota, token);
    } catch (err) {
      setError(err.message);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="nota-viewer">
      <h3>{nota.tipo_nota}</h3>

      {/* Estado de firma */}
      <div className={`firma-badge ${nota.esta_firmada ? 'firmada' : 'borrador'}`}>
        {nota.esta_firmada ? '🔒 Firmada' : '📝 Borrador'}
      </div>

      {/* Botón descargar */}
      <button
        onClick={handleDescargarPDF}
        disabled={!nota.esta_firmada || descargando}
        className="btn-descargar-pdf"
      >
        {descargando ? 'Descargando...' : '📥 Descargar PDF'}
      </button>

      {/* Mostrar error */}
      {error && <div className="error-message">{error}</div>}

      {/* Hash SHA-256 (para auditoría) */}
      {nota.esta_firmada && nota.pdf_hash && (
        <div className="hash-info">
          <small>
            Hash: <code>{nota.pdf_hash}</code>
          </small>
        </div>
      )}
    </div>
  );
}
```

### Hook Custom (para reutilizar lógica)

```typescript
// hooks/usePDFDownload.ts
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export function usePDFDownload() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(
    async (notaId: string, notaFirmada: boolean) => {
      if (!notaFirmada) {
        setError('La nota debe estar firmada');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/notas/${notaId}/pdf`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/pdf',
            },
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Nota_SOAP_${notaId}.pdf`;
        link.click();
        URL.revokeObjectURL(url);

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  return { download, loading, error };
}
```

---

## 3. Python (Backend/Scripts)

### Cliente HTTP simple

```python
# scripts/download_pdf.py
import requests
import sys
from pathlib import Path

def descargar_pdf_nota(nota_id: str, token: str, api_url: str = "http://localhost:8000"):
    """Descarga PDF de una nota SOAP"""
    
    url = f"{api_url}/notas/{nota_id}/pdf"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/pdf",
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        # Guardar PDF
        output_path = Path(f"Nota_SOAP_{nota_id}.pdf")
        output_path.write_bytes(response.content)
        print(f"✓ PDF descargado: {output_path}")
        return output_path
    
    elif response.status_code == 404:
        print("✗ Error 404: Nota no encontrada")
        return None
    
    elif response.status_code == 403:
        print("✗ Error 403: Nota no firmada")
        return None
    
    else:
        data = response.json()
        print(f"✗ Error {response.status_code}: {data.get('detail')}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python download_pdf.py <nota_id> <token>")
        sys.exit(1)
    
    nota_id = sys.argv[1]
    token = sys.argv[2]
    
    descargar_pdf_nota(nota_id, token)
```

### Con requests-async (para aplicaciones async)

```python
# services/pdf_client.py
import aiohttp
from pathlib import Path
from typing import Optional

class PDFClient:
    def __init__(self, api_url: str = "http://localhost:8000"):
        self.api_url = api_url
    
    async def descargar_pdf(
        self, 
        nota_id: str, 
        token: str
    ) -> Optional[Path]:
        """Descarga PDF de nota SOAP"""
        
        url = f"{self.api_url}/notas/{nota_id}/pdf"
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/pdf",
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                
                if response.status == 200:
                    content = await response.read()
                    output = Path(f"Nota_SOAP_{nota_id}.pdf")
                    output.write_bytes(content)
                    return output
                
                elif response.status == 403:
                    raise ValueError("Nota no firmada")
                
                elif response.status == 404:
                    raise FileNotFoundError("Nota no encontrada")
                
                else:
                    error = await response.json()
                    raise RuntimeError(f"Error {response.status}: {error.get('detail')}")

# Uso
if __name__ == "__main__":
    import asyncio
    
    client = PDFClient()
    nota_id = "550e8400-e29b-41d4-a716-446655440000"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    
    result = asyncio.run(client.descargar_pdf(nota_id, token))
    print(f"PDF guardado en: {result}")
```

---

## 4. Postman

### Configuración de Colección

```json
{
  "name": "Notas SOAP — PDF",
  "item": [
    {
      "name": "Descargar PDF Nota",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          },
          {
            "key": "Accept",
            "value": "application/pdf",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/notas/{{nota_id}}/pdf",
          "host": ["{{baseUrl}}"],
          "path": ["notas", "{{nota_id}}", "pdf"]
        }
      },
      "response": []
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8000"
    },
    {
      "key": "token",
      "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    {
      "key": "nota_id",
      "value": "550e8400-e29b-41d4-a716-446655440000"
    }
  ]
}
```

### Pre-request Script (obtener token automático)

```javascript
// Pre-request Script
const loginUrl = pm.environment.get('baseUrl') + '/auth/login';
const loginData = {
  email: pm.environment.get('user_email'),
  password: pm.environment.get('user_password')
};

pm.sendRequest({
  url: loginUrl,
  method: 'POST',
  body: {
    mode: 'raw',
    raw: JSON.stringify(loginData)
  },
  header: {
    'Content-Type': 'application/json'
  }
}, function(err, response) {
  if (!err) {
    const token = response.json().access_token;
    pm.environment.set('token', token);
  }
});
```

---

## 5. PowerShell (Windows)

```powershell
# download_pdf.ps1
param(
    [string]$NotaId,
    [string]$Token,
    [string]$ApiUrl = "http://localhost:8000"
)

$headers = @{
    "Authorization" = "Bearer $Token"
    "Accept" = "application/pdf"
}

$uri = "$ApiUrl/notas/$NotaId/pdf"
$outputFile = "Nota_SOAP_$NotaId.pdf"

try {
    Write-Host "Descargando PDF..." -ForegroundColor Cyan
    
    Invoke-WebRequest `
        -Uri $uri `
        -Headers $headers `
        -OutFile $outputFile
    
    Write-Host "✓ PDF descargado: $outputFile" -ForegroundColor Green
    
    # Abrir con programa predeterminado
    Start-Process $outputFile
}
catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 6. HTTPie (CLI alternativa a curl)

```bash
# Instalación: brew install httpie (o pip install httpie)

# Descargar PDF
http GET http://localhost:8000/notas/550e8400-e29b-41d4-a716-446655440000/pdf \
  "Authorization: Bearer ${TOKEN}" \
  "Accept: application/pdf" \
  > nota.pdf

# Con headers verbosos
http --headers GET http://localhost:8000/notas/550e8400-e29b-41d4-a716-446655440000/pdf \
  "Authorization: Bearer ${TOKEN}"
```

---

## 7. Manejo de Errores — Todos los Lenguajes

### Códigos HTTP y Respuestas

| Status | Error | Solución |
|--------|-------|----------|
| **200** | — | OK, PDF descargado ✓ |
| **404** | `"detail": "Nota no encontrada"` | Verificar `id_nota` |
| **403** | `"detail": "Solo se pueden descargar PDFs de notas firmadas (NOM-151)"` | Firmar nota primero |
| **400** | `"detail": "Error: Datos incompletos de la nota"` | Verificar encuentro, paciente, médico |
| **401** | `"detail": "Not authenticated"` | Token inválido o expirado |
| **403** | `"detail": "Not enough permissions"` | Usuario no tiene rol autorizado |

---

## 8. Testing Automatizado

### Pytest (Python)

```python
# tests/test_pdf_endpoint.py
import pytest
from httpx import AsyncClient
from uuid import uuid4

@pytest.mark.asyncio
async def test_descargar_pdf_nota_200(client: AsyncClient, token: str, nota_id: str):
    """Test descarga exitosa de PDF"""
    response = await client.get(
        f"/notas/{nota_id}/pdf",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 0

@pytest.mark.asyncio
async def test_descargar_pdf_nota_404(client: AsyncClient, token: str):
    """Test nota no encontrada"""
    fake_id = uuid4()
    response = await client.get(
        f"/notas/{fake_id}/pdf",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 404
    assert "no encontrada" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_descargar_pdf_nota_403_no_firmada(client: AsyncClient, token: str, nota_id_no_firmada: str):
    """Test intento descargar PDF de nota no firmada"""
    response = await client.get(
        f"/notas/{nota_id_no_firmada}/pdf",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
    assert "firmada" in response.json()["detail"].lower()
```

---

## 9. Validación de Hash

```python
# utils/verify_pdf.py
import hashlib
from pathlib import Path

def verificar_integridad_pdf(pdf_path: Path, hash_esperado: str) -> bool:
    """Verifica que el hash SHA-256 del PDF coincida"""
    contenido = pdf_path.read_bytes()
    hash_actual = hashlib.sha256(contenido).hexdigest()
    return hash_actual == hash_esperado

# Uso
pdf_path = Path("Nota_SOAP_550e8400.pdf")
hash_bd = "a1b2c3d4e5f6..."  # Del campo nota.pdf_hash

if verificar_integridad_pdf(pdf_path, hash_bd):
    print("✓ PDF íntegro")
else:
    print("✗ PDF modificado")
```

