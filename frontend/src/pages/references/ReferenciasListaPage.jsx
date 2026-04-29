import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { referenciasAPI } from '../../api/referencias';
import { AlertCircle, ChevronLeft, Plus, Filter } from 'lucide-react';

export default function ReferenciasListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [referencias, setReferencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState('');

  const rolesPermitidos = [
    "MEDICO_GENERAL", "ESPECIALISTA", "ENFERMERIA",
    "ADMINISTRADOR", "SUPERADMIN", "OMNIADMIN",
  ];

  const tieneAcceso = user && rolesPermitidos.includes(user.rol);

  useEffect(() => {
    if (!tieneAcceso) return;
    loadReferencias();
  }, [page, filtroEstado, tieneAcceso]);

  const loadReferencias = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (filtroEstado) params.estado = filtroEstado;
      
      const data = await referenciasAPI.getReferencias(params);
      setReferencias(data.data?.items || []);
      setTotalPages(data.data?.pages || 1);
    } catch (err) {
      console.error('Error cargando referencias:', err);
      setError('No se pudieron cargar las referencias');
    } finally {
      setLoading(false);
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

  if (!tieneAcceso) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px" }}>
        <AlertCircle size={48} style={{ color: "#BA2E45", marginBottom: "16px" }} />
        <h2 style={{ color: "#1A1510", fontSize: 18, fontWeight: 600 }}>Acceso Denegado</h2>
        <p style={{ color: "#5A5048", fontSize: 14 }}>No tienes permisos para ver referencias médicas.</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#EDEBE6" }}>
      {/* TopBar */}
      <div style={{ padding: "16px 28px", background: "#FDFAF5", borderBottom: "1px solid #DAD4CC" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 style={{ color: "#1A1510", fontSize: 18, fontWeight: 700, margin: 0 }}>Referencias Médicas</h1>
              <p style={{ color: "#5A5048", fontSize: 12, margin: "4px 0 0 0" }}>Sistema de Referencia y Contrarreferencia (SRC)</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/referencias/nueva')}
            style={{ padding: "10px 20px", background: "#2459A8", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}
          >
            <Plus size={16} /> Nueva Referencia
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ padding: "16px 28px", background: "#FDFAF5", borderBottom: "1px solid #DAD4CC", display: "flex", gap: 12 }}>
        <select value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, backgroundColor: "#fff" }}>
          <option value="">Todos los estados</option>
          <option value="EMITIDA">📤 Emitida</option>
          <option value="ACEPTADA">✅ Aceptada</option>
          <option value="ATENDIDA">🩺 Atendida</option>
          <option value="RECHAZADA">❌ Rechazada</option>
        </select>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#5A5048" }}>⏳ Cargando referencias...</div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: 40, color: "#BA2E45" }}>
            <AlertCircle size={32} style={{ marginBottom: 8 }} />
            <p>{error}</p>
          </div>
        ) : referencias.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#5A5048" }}>
            <Filter size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p>No se encontraron referencias médicas</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {referencias.map(ref => {
              const estadoStyle = getEstadoStyle(ref.estado);
              
              return (
                <div key={ref.id_referencia}
                  onClick={() => navigate(`/referencias/${ref.id_referencia}`)}
                  style={{ padding: 16, background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#2459A8"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "#DAD4CC"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1A1510", margin: "0 0 4px 0" }}>
                        👤 {ref.paciente_nombre}
                      </h3>
                      <p style={{ fontSize: 12, color: "#5A5048", margin: 0 }}>
                        Exp: {ref.numero_expediente}
                      </p>
                    </div>
                    <span style={{ padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: estadoStyle.bg, color: estadoStyle.color }}>
                      {estadoStyle.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "#2C2620", margin: "0 0 8px 0" }}>
                    <strong>Motivo:</strong> {ref.motivo_referencia?.length > 120 ? ref.motivo_referencia.substring(0, 120) + '...' : ref.motivo_referencia}
                  </p>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#5A5048", flexWrap: "wrap" }}>
                    <span>👨‍⚕️ {ref.medico_emisor}</span>
                    {ref.especialidad_destino && <span>🏥 → {ref.especialidad_destino}</span>}
                    {ref.establecimiento_destino && <span>📍 {ref.establecimiento_destino}</span>}
                    <span>📅 {new Date(ref.fecha_emision).toLocaleDateString('es-MX')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: "8px 16px", border: "1.5px solid #DAD4CC", borderRadius: 6, background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}>
              Anterior
            </button>
            <span style={{ padding: "8px 16px", fontSize: 13, color: "#5A5048" }}>Página {page} de {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              style={{ padding: "8px 16px", border: "1.5px solid #DAD4CC", borderRadius: 6, background: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.5 : 1 }}>
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}