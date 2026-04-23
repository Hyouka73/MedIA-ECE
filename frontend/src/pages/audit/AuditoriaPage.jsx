import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, FileText, Download, CheckCircle, Clock } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

/* ─────────────────────────────────────────────
    ESTILOS (Sincronizados)
───────────────────────────────────────────── */
const C = {
  b500: "#2459A8", b600: "#1A4080", b700: "#112B58",
  g500: "#237A4B", g600: "#196038",
  r50: "#FEF0F3", r500: "#BA2E45", r600: "#901F33",
  bg: "#EDEBE6", sf: "#F5F2EC", cd: "#FDFAF5",
  bd: "#DAD4CC", th: "#1A1510", ts: "#5A5048", tm: "#877E74", td: "#A9A097"
};

const Bdg = ({ v = "default", children, dot }) => {
  const variants = {
    error: { bg: "#FEF0F3", color: "#901F33" },
    blue: { bg: "#EEF3FB", color: "#1A4080" },
    success: { bg: "#E6F4EA", color: "#137333" },
    warning: { bg: "#FFF4E5", color: "#B45309" },
    default: { bg: "#E2DDD4", color: "#605850" }
  };
  const cv = variants[v] || variants.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: dot ? 4 : 0,
      padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: cv.bg, color: cv.color, textTransform: "uppercase"
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: cv.color }} />}
      {children}
    </span>
  );
};

const AuditoriaPage = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, criticos: 0, documentos: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    id_usuario: '', accion: '', nivel_severidad: '', fecha_desde: '', fecha_hasta: ''
  });

  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await apiClient.get('/auditoria/stats');
      setStats(res.data);
    } catch (error) { console.error("Error stats:", error); }
  };

  const fetchLogs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/auditoria', {
        params: { page, limit: 15, ...filters }
      });
      setLogs(res.data.items || []);
    } catch (error) { 
      console.error("Error logs:", error); 
      setLogs([]);
    } finally { setLoading(false); }
  };

  // FUNCIÓN CLAVE: Cambiar el estado del incidente (Ciclo de Vida)
  const handleResolve = async (id, nuevoEstado) => {
    try {
      await apiClient.patch(`/auditoria/incidentes/${id}/estado`, { estado: nuevoEstado });
      // Refrescamos todo para que el sidebar detecte el cambio
      fetchLogs();
      fetchStats();
    } catch (error) {
      alert("Error al actualizar el estado del incidente");
    }
  };

  useEffect(() => { if (token) fetchStats(); }, [token]);
  useEffect(() => { if (token) fetchLogs(); }, [page, filters, token]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* TopBar */}
      <div style={{ padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.bd}`, background: C.sf }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.th, letterSpacing: -.3 }}>Auditoría Forense</div>
          <div style={{ fontSize: 12, color: C.ts, marginTop: 1 }}>Control de incidentes y trazabilidad legal · Persona 5</div>
        </div>
        <button style={{ background: C.b500, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <Download size={16} /> Exportar Reporte Forense
        </button>
      </div>

      <div style={{ padding: "22px 28px" }}>
        
        {/* Métricas con el contador de Críticos ABIERTOS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 22 }}>
          <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 18 }}>
            <div style={{ color: C.ts, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>EVENTOS HOY</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.b600 }}>{stats.total || 0}</div>
          </div>
          <div style={{ 
            background: stats.criticos > 0 ? "#FFF5F5" : C.cd, 
            border: stats.criticos > 0 ? `2px solid ${C.r500}` : `1px solid ${C.bd}`, 
            borderRadius: 12, padding: 18,
            transition: "all 0.3s ease"
          }}>
            <div style={{ color: stats.criticos > 0 ? C.r600 : C.ts, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>CRÍTICOS ABIERTOS <ShieldAlert size={14} className={stats.criticos > 0 ? "animate-pulse" : ""} /></div>
            <div style={{ fontSize: 28, fontWeight: 700, color: stats.criticos > 0 ? C.r500 : C.th }}>{stats.criticos || 0}</div>
          </div>
          <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 18 }}>
            <div style={{ color: C.ts, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>TRAZABILIDAD NOM-151</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.th }}>{stats.total || 0}</div>
          </div>
        </div>

        {/* Tabla */}
        <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.sf, borderBottom: `1px solid ${C.bd}` }}>
                {["Timestamp", "Usuario / IP", "Acción", "Severidad", "Estado / Gestión"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.tm, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: 40, textAlign: "center", color: C.td }}>Consultando bitácora...</td></tr>
              ) : logs.map((log, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.bd}`, background: log.nivel_severidad === 'CRITICA' && log.estado === 'ABIERTO' ? '#FFF8F8' : 'transparent' }}>
                  <td style={{ padding: "14px 20px", fontSize: 11, color: C.ts }}>
                    {new Date(log.timestamp_evento).toLocaleString()}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.th }}>{log.id_usuario ? 'Personal Médico' : 'Sistema'}</div>
                    <div style={{ fontSize: 10, color: C.tm }}>IP: {log.ip_origen || 'Local'}</div>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, color: C.b600 }}>{log.accion}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <Bdg v={log.nivel_severidad === 'CRITICA' ? 'error' : 'blue'} dot>{log.nivel_severidad}</Bdg>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Bdg v={log.estado === 'RESUELTO' ? 'success' : log.estado === 'EN_PROCESO' ? 'warning' : 'default'}>
                        {log.estado}
                      </Bdg>
                      
                      {/* BOTONES DE ACCIÓN (Persona 5) */}
                      {log.nivel_severidad === 'CRITICA' && log.estado !== 'RESUELTO' && (
                        <button 
                          onClick={() => handleResolve(log.id_auditoria, 'RESUELTO')}
                          style={{ 
                            background: C.g500, color: "#fff", border: "none", 
                            padding: "4px 8px", borderRadius: 6, fontSize: 10, 
                            cursor: "pointer", display: "flex", alignItems: "center", gap: 4 
                          }}
                        >
                          <CheckCircle size={12} /> Resolver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditoriaPage;