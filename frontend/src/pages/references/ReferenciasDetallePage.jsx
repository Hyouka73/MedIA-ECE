import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { referenciasAPI } from '../../api/referencias';
import { AlertCircle, ChevronLeft, CheckCircle, XCircle, Stethoscope } from 'lucide-react';

export default function ReferenciaDetallePage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [referencia, setReferencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accion, setAccion] = useState('');
  const [procesando, setProcesando] = useState(false);

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
      setProcesando(true);
      await referenciasAPI.responderReferencia(id, { estado });
      loadReferencia();
      setAccion('');
    } catch (err) {
      console.error('Error al responder:', err);
      alert(err.response?.data?.detail || 'Error al procesar la respuesta');
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelar = async () => {
    if (!confirm('¿Estás seguro de cancelar esta referencia? Se marcará como RECHAZADA.')) return;
    try {
      setProcesando(true);
      await referenciasAPI.cancelarReferencia(id);
      loadReferencia();
    } catch (err) {
      console.error('Error al cancelar:', err);
      alert(err.response?.data?.detail || 'Error al cancelar la referencia');
    } finally {
      setProcesando(false);
    }
  };

  const handleAtender = async () => {
    try {
      setProcesando(true);
      await referenciasAPI.atenderReferencia(id);
      loadReferencia();
    } catch (err) {
      console.error('Error al marcar como atendida:', err);
      alert(err.response?.data?.detail || 'Error al actualizar la referencia');
    } finally {
      setProcesando(false);
    }
  };

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case 'EMITIDA': return { bg: '#FFF3E0', color: '#E8921F', label: '📤 Emitida' };
      case 'ACEPTADA': return { bg: '#E3F2FD', color: '#2459A8', label: '✅ Aceptada' };
      case 'ATENDIDA': return { bg: '#E8F5E9', color: '#237A4B', label: '🩺 Atendida' };
      case 'RECHAZADA': return { bg: '#FFEBEE', color: '#BA2E45', label: '❌ Rechazada' };
      default: return { bg: '#F5F5F5', color: '#5A5048', label: estado };
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

  const estadoStyle = getEstadoStyle(referencia.estado);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#EDEBE6", minHeight: "100vh" }}>
      {/* TopBar */}
      <div style={{ padding: "16px 28px", background: "#FDFAF5", borderBottom: "1px solid #DAD4CC" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate('/referencias')} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: "#1A1510", fontSize: 18, fontWeight: 700, margin: 0 }}>Detalle de Referencia</h1>
            <p style={{ color: "#5A5048", fontSize: 12, margin: "4px 0 0 0" }}>
              ID: {referencia.id_referencia?.substring(0, 8)}...
            </p>
          </div>
          <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: estadoStyle.bg, color: estadoStyle.color }}>
            {estadoStyle.label}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: "28px", maxWidth: 800, margin: "0 auto" }}>
        {/* Info principal */}
        <div style={{ background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1A1510", marginBottom: 16 }}>
            Información de la Referencia
          </h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase", fontWeight: 600 }}>Paciente</label>
              <p style={{ fontSize: 14, color: "#1A1510", fontWeight: 500, margin: "4px 0 0 0" }}>{referencia.paciente_nombre}</p>
              <p style={{ fontSize: 11, color: "#5A5048", margin: "2px 0 0 0" }}>Exp: {referencia.numero_expediente}</p>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase", fontWeight: 600 }}>Médico Emisor</label>
              <p style={{ fontSize: 14, color: "#1A1510", margin: "4px 0 0 0" }}>{referencia.medico_emisor}</p>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase", fontWeight: 600 }}>Establecimiento Destino</label>
              <p style={{ fontSize: 14, color: "#1A1510", margin: "4px 0 0 0" }}>{referencia.establecimiento_destino || 'N/A'}</p>
              {referencia.establecimiento_destino_clues && (
                <p style={{ fontSize: 11, color: "#5A5048", margin: "2px 0 0 0" }}>CLUES: {referencia.establecimiento_destino_clues}</p>
              )}
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase", fontWeight: 600 }}>Especialidad Destino</label>
              <p style={{ fontSize: 14, color: "#1A1510", margin: "4px 0 0 0" }}>{referencia.especialidad_destino || 'N/A'}</p>
            </div>
            {referencia.establecimiento_origen && (
              <div>
                <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase", fontWeight: 600 }}>Establecimiento Origen</label>
                <p style={{ fontSize: 14, color: "#1A1510", margin: "4px 0 0 0" }}>{referencia.establecimiento_origen}</p>
              </div>
            )}
            <div>
              <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase", fontWeight: 600 }}>Fecha de Emisión</label>
              <p style={{ fontSize: 14, color: "#1A1510", margin: "4px 0 0 0" }}>
                {referencia.fecha_emision ? new Date(referencia.fecha_emision).toLocaleString('es-MX') : 'N/A'}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, color: "#5A5048", textTransform: "uppercase", fontWeight: 600 }}>Motivo de Referencia</label>
            <p style={{ fontSize: 13, color: "#1A1510", background: "#F5F2EC", padding: 12, borderRadius: 6, margin: "6px 0 0 0", lineHeight: "1.6" }}>
              {referencia.motivo_referencia}
            </p>
          </div>
        </div>

        {/* Fecha de respuesta (si existe) */}
        {referencia.fecha_respuesta && (
          <div style={{ background: referencia.estado === 'RECHAZADA' ? "#FFEBEE" : "#E8F5E9", border: `1.5px solid ${referencia.estado === 'RECHAZADA' ? "#BA2E45" : "#237A4B"}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: referencia.estado === 'RECHAZADA' ? "#BA2E45" : "#237A4B", marginBottom: 8 }}>
              {referencia.estado === 'RECHAZADA' ? '❌ Referencia Rechazada' : referencia.estado === 'ATENDIDA' ? '🩺 Referencia Atendida' : '✅ Referencia Aceptada'}
            </h3>
            <p style={{ fontSize: 12, color: "#5A5048" }}>
              Fecha de respuesta: {new Date(referencia.fecha_respuesta).toLocaleString('es-MX')}
            </p>
          </div>
        )}

        {/* Acciones según estado */}
        {referencia.estado === 'EMITIDA' && (
          <div style={{ background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1A1510", marginBottom: 12 }}>Acciones</h3>
            
            {accion === 'responder' ? (
              <div>
                <p style={{ fontSize: 12, color: "#5A5048", marginBottom: 12 }}>
                  Seleccione la acción para esta referencia:
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleResponder('ACEPTADA')} disabled={procesando}
                    style={{ padding: "10px 20px", background: "#237A4B", color: "#fff", border: "none", borderRadius: 6, cursor: procesando ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, opacity: procesando ? 0.6 : 1 }}>
                    <CheckCircle size={16} /> Aceptar
                  </button>
                  <button onClick={() => handleResponder('RECHAZADA')} disabled={procesando}
                    style={{ padding: "10px 20px", background: "#BA2E45", color: "#fff", border: "none", borderRadius: 6, cursor: procesando ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, opacity: procesando ? 0.6 : 1 }}>
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
                  Responder Referencia
                </button>
                <button onClick={handleCancelar} disabled={procesando}
                  style={{ padding: "10px 20px", background: "#BA2E45", color: "#fff", border: "none", borderRadius: 6, cursor: procesando ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500, opacity: procesando ? 0.6 : 1 }}>
                  Cancelar Referencia
                </button>
              </div>
            )}
          </div>
        )}

        {/* Acción: Marcar como atendida (solo si está ACEPTADA) */}
        {referencia.estado === 'ACEPTADA' && (
          <div style={{ background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1A1510", marginBottom: 12 }}>Acciones</h3>
            <p style={{ fontSize: 12, color: "#5A5048", marginBottom: 12 }}>
              El paciente fue atendido en este establecimiento. Marcar como atendida para completar el ciclo de referencia.
            </p>
            <button onClick={handleAtender} disabled={procesando}
              style={{ padding: "10px 20px", background: "#237A4B", color: "#fff", border: "none", borderRadius: 6, cursor: procesando ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, opacity: procesando ? 0.6 : 1 }}>
              <Stethoscope size={16} /> Marcar como Atendida
            </button>
          </div>
        )}
      </div>
    </div>
  );
}