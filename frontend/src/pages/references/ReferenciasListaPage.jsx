import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { referenciasAPI } from '../../api/referencias';
import { AlertCircle, ChevronLeft, Plus, Search, Filter } from 'lucide-react';

export default function ReferenciasListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [referencias, setReferencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const rolesPermitidos = [
    "MEDICO_GENERAL", "ESPECIALISTA", "ENFERMERIA",
    "ADMINISTRADOR", "SUPERADMIN", "OMNIADMIN",
  ];

  const tieneAcceso = user && rolesPermitidos.includes(user.rol);

  useEffect(() => {
    if (!tieneAcceso) return;
    loadReferencias();
  }, [page, filtroTipo, filtroEstado, tieneAcceso]);

  const loadReferencias = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (filtroTipo) params.tipo = filtroTipo;
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

  const getUrgenciaColor = (urgencia) => {
    switch (urgencia) {
      case 'EMERGENCIA': return { bg: '#FFEBEE', color: '#BA2E45', text: '🔴 Emergencia' };
      case 'URGENTE': return { bg: '#FFF3E0', color: '#E8921F', text: '🟡 Urgente' };
      default: return { bg: '#E8F5E9', color: '#237A4B', text: '🟢 Normal' };
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE': return { bg: '#FFF3E0', color: '#E8921F' };
      case 'ACEPTADA': return { bg: '#E3F2FD', color: '#2459A8' };
      case 'COMPLETADA': return { bg: '#E8F5E9', color: '#237A4B' };
      case 'RECHAZADA': return { bg: '#FFEBEE', color: '#BA2E45' };
      case 'CANCELADA': return { bg: '#F5F5F5', color: '#5A5048' };
      default: return { bg: '#F5F5F5', color: '#5A5048' };
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
              <p style={{ color: "#5A5048", fontSize: 12, margin: "4px 0 0 0" }}>Interconsultas, derivaciones y contra-referencias</p>
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
        <select value={filtroTipo} onChange={(e) => { setFiltroTipo(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, backgroundColor: "#fff" }}>
          <option value="">Todos los tipos</option>
          <option value="INTERCONSULTA">Interconsulta</option>
          <option value="DERIVACION">Derivación</option>
          <option value="CONTRARREFERENCIA">Contra-referencia</option>
        </select>
        <select value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, backgroundColor: "#fff" }}>
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="ACEPTADA">Aceptada</option>
          <option value="COMPLETADA">Completada</option>
          <option value="RECHAZADA">Rechazada</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#5A5048" }}>⏳ Cargando referencias...</div>
        ) : referencias.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#5A5048" }}>
            <Filter size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p>No se encontraron referencias médicas</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {referencias.map(ref => {
              const urgenciaStyle = getUrgenciaColor(ref.urgencia);
              const estadoStyle = getEstadoColor(ref.estado);
              
              return (
                <div key={ref.id_referencia}
                  onClick={() => navigate(`/referencias/${ref.id_referencia}`)}
                  style={{ padding: 16, background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10, cursor: "pointer", transition: "all 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1A1510", margin: "0 0 4px 0" }}>
                        {ref.tipo === 'INTERCONSULTA' ? '🔬' : ref.tipo === 'DERIVACION' ? '🏥' : '↩️'} {ref.tipo}
                      </h3>
                      <p style={{ fontSize: 12, color: "#5A5048", margin: 0 }}>Paciente: {ref.paciente_nombre}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: urgenciaStyle.bg, color: urgenciaStyle.color }}>
                        {urgenciaStyle.text}
                      </span>
                      <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: estadoStyle.bg, color: estadoStyle.color }}>
                        {ref.estado}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "#2C2620", margin: "0 0 4px 0" }}>
                    <strong>Motivo:</strong> {ref.motivo_referencia}
                  </p>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#5A5048" }}>
                    <span>👨‍⚕️ {ref.medico_emisor}</span>
                    <span>📅 {new Date(ref.fecha_creacion).toLocaleDateString('es-MX')}</span>
                    {ref.establecimiento_destino && <span>🏥 {ref.establecimiento_destino}</span>}
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