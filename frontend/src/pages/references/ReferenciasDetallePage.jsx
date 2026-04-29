import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { referenciasAPI } from '../../api/referencias';
import { AlertCircle, ChevronLeft, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ReferenciaDetallePage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [referencia, setReferencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [accion, setAccion] = useState('');

  useEffect(() => {
    loadReferencia();
  }, [id]);

  const loadReferencia = async () => {
    try {
      setLoading(true);
      const data = await referenciasAPI.getReferenciaById(id);
      setReferencia(data.data);
    } catch (err) {
      console.error('Error cargando referencia:', err);
      setError('No se pudo cargar la referencia');
    } finally {
      setLoading(false);
    }
  };

  const handleResponder = async (estado) => {
    try {
      await referenciasAPI.responderReferencia(id, { estado, respuesta });
      loadReferencia();
      setRespuesta('');
      setAccion('');
    } catch (err) {
      console.error('Error al responder:', err);
      alert('Error al procesar la respuesta');
    }
  };

  const handleCancelar = async () => {
    if (!confirm('¿Estás seguro de cancelar esta referencia?')) return;
    try {
      await referenciasAPI.cancelarReferencia(id);
      loadReferencia();
    } catch (err) {
      console.error('Error al cancelar:', err);
      alert('Error al cancelar la referencia');
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#5A5048" }}>⏳ Cargando referencia...</div>;
  }

  if (error || !referencia) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <AlertCircle size={48} style={{ color: "#BA2E45", marginBottom: 16 }} />
        <p style={{ color: "#5A5048" }}>{error || 'Referencia no encontrada'}</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: 16, padding: "10px 20px", background: "#2459A8", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
          ← Volver
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#EDEBE6", minHeight: "100vh" }}>
      {/* TopBar */}
      <div style={{ padding: "16px 28px", background: "#FDFAF5", borderBottom: "1px solid #DAD4CC" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 style={{ color: "#1A1510", fontSize: 18, fontWeight: 700, margin: 0 }}>Detalle de Referencia</h1>
            <p style={{ color: "#5A5048", fontSize: 12, margin: "4px 0 0 0" }}>
              {referencia.tipo} · {referencia.estado}
            </p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: "28px", maxWidth: 800, margin: "0 auto" }}>
        {/* Info principal */}
        <div style={{ background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1A1510", marginBottom: 16 }}>
            {referencia.tipo === 'INTERCONSULTA' ? '🔬 Interconsulta' : referencia.tipo === 'DERIVACION' ? '🏥 Derivación' : '↩️ Contra-referencia'}
          </h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase" }}>Paciente</label>
              <p style={{ fontSize: 13, color: "#1A1510", fontWeight: 500 }}>{referencia.paciente_nombre}</p>
              <p style={{ fontSize: 11, color: "#5A5048" }}>Exp: {referencia.numero_expediente}</p>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase" }}>Médico Emisor</label>
              <p style={{ fontSize: 13, color: "#1A1510" }}>{referencia.medico_emisor}</p>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase" }}>Urgencia</label>
              <p style={{ fontSize: 13, color: "#1A1510", fontWeight: 600 }}>{referencia.urgencia}</p>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase" }}>Estado</label>
              <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: "#E3F2FD", color: "#2459A8" }}>
                {referencia.estado}
              </span>
            </div>
            {referencia.establecimiento_destino && (
              <div>
                <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase" }}>Establecimiento Destino</label>
                <p style={{ fontSize: 13, color: "#1A1510" }}>{referencia.establecimiento_destino}</p>
              </div>
            )}
            <div>
              <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase" }}>Fecha Creación</label>
              <p style={{ fontSize: 13, color: "#1A1510" }}>{new Date(referencia.fecha_creacion).toLocaleString('es-MX')}</p>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase" }}>Diagnóstico de Envío</label>
            <p style={{ fontSize: 13, color: "#1A1510", background: "#F5F2EC", padding: 12, borderRadius: 6 }}>{referencia.diagnostico_envio}</p>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase" }}>Motivo de Referencia</label>
            <p style={{ fontSize: 13, color: "#1A1510", background: "#F5F2EC", padding: 12, borderRadius: 6 }}>{referencia.motivo_referencia}</p>
          </div>

          {referencia.resumen_clinico && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase" }}>Resumen Clínico</label>
              <p style={{ fontSize: 13, color: "#1A1510", background: "#F5F2EC", padding: 12, borderRadius: 6 }}>{referencia.resumen_clinico}</p>
            </div>
          )}

          {referencia.hallazgos_relevantes && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase" }}>Hallazgos Relevantes</label>
              <p style={{ fontSize: 13, color: "#1A1510", background: "#F5F2EC", padding: 12, borderRadius: 6 }}>{referencia.hallazgos_relevantes}</p>
            </div>
          )}

          {referencia.tratamiento_actual && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase" }}>Tratamiento Actual</label>
              <p style={{ fontSize: 13, color: "#1A1510", background: "#F5F2EC", padding: 12, borderRadius: 6 }}>{referencia.tratamiento_actual}</p>
            </div>
          )}

          {referencia.observaciones && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase" }}>Observaciones</label>
              <p style={{ fontSize: 13, color: "#1A1510", background: "#F5F2EC", padding: 12, borderRadius: 6 }}>{referencia.observaciones}</p>
            </div>
          )}
        </div>

        {/* Respuesta (si existe) */}
        {referencia.respuesta && (
          <div style={{ background: "#E8F5E9", border: "1.5px solid #237A4B", borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#237A4B", marginBottom: 8 }}>✓ Respuesta Recibida</h3>
            <p style={{ fontSize: 13, color: "#1A1510" }}>{referencia.respuesta}</p>
            {referencia.medico_receptor && (
              <p style={{ fontSize: 11, color: "#5A5048", marginTop: 8 }}>Respondido por: {referencia.medico_receptor}</p>
            )}
            {referencia.fecha_respuesta && (
              <p style={{ fontSize: 11, color: "#5A5048" }}>Fecha: {new Date(referencia.fecha_respuesta).toLocaleString('es-MX')}</p>
            )}
          </div>
        )}

        {/* Acciones (solo si está pendiente) */}
        {referencia.estado === 'PENDIENTE' && (
          <div style={{ background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1A1510", marginBottom: 12 }}>Responder a esta Referencia</h3>
            
            {accion === 'responder' ? (
              <div>
                <textarea
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  rows={4}
                  style={{ width: "100%", padding: 10, border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => handleResponder('ACEPTADA')}
                    style={{ padding: "10px 20px", background: "#237A4B", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle size={16} /> Aceptar
                  </button>
                  <button onClick={() => handleResponder('RECHAZADA')}
                    style={{ padding: "10px 20px", background: "#BA2E45", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                    <XCircle size={16} /> Rechazar
                  </button>
                  <button onClick={() => setAccion('')}
                    style={{ padding: "10px 20px", background: "transparent", border: "1.5px solid #DAD4CC", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setAccion('responder')}
                  style={{ padding: "10px 20px", background: "#2459A8", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                  Responder
                </button>
                <button onClick={handleCancelar}
                  style={{ padding: "10px 20px", background: "#BA2E45", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                  Cancelar Referencia
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}