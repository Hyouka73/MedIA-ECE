import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, FileText, Download } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext'; // <--- IMPORTACIÓN CRÍTICA

/* ─────────────────────────────────────────────
    TOKENS & ESTILOS (Sincronizados con MedSys)
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
    default: { bg: "#E2DDD4", color: "#605850" }
  };
  const cv = variants[v] || variants.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: dot ? 4 : 0,
      padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: cv.bg, color: cv.color
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: cv.color }} />}
      {children}
    </span>
  );
};

const AuditoriaPage = () => {
  const { token } = useAuth(); // <--- OBTENEMOS EL TOKEN EN MEMORIA
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
      const res = await apiClient.get('/auditoria/stats', {
        headers: { Authorization: `Bearer ${token}` } // Inyectamos token
      });
      setStats(res.data);
    } catch (error) { console.error("Error stats:", error); }
  };

  const fetchLogs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/auditoria', {
        params: { page, limit: 15, ...filters },
        headers: { Authorization: `Bearer ${token}` } // Inyectamos token
      });
      setLogs(res.data.results || res.data.items || []);
    } catch (error) { 
      console.error("Error logs:", error); 
      setLogs([]);
    } finally { setLoading(false); }
  };

  // Efecto condicionado a la existencia del token
  useEffect(() => { 
    if (token) {
      fetchStats(); 
    }
  }, [token]);

  useEffect(() => { 
    if (token) {
      fetchLogs(); 
    }
  }, [page, filters, token]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* TopBar Institucional */}
      <div style={{ padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.bd}`, background: C.sf }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.th, letterSpacing: -.3 }}>Auditoría de Sistema</div>
          <div style={{ fontSize: 12, color: C.ts, marginTop: 1 }}>Bitácora de integridad y accesos · NOM-024 / NOM-151</div>
        </div>
        <button style={{ background: C.b500, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <Download size={16} /> Exportar Reporte Forense
        </button>
      </div>

      <div style={{ padding: "22px 28px" }}>
        
        {/* Métricas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 22 }}>
          <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 18 }}>
            <div style={{ color: C.ts, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>TOTAL EVENTOS <Activity size={14} inline /></div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.b600 }}>{stats.total || 0}</div>
          </div>
          <div style={{ background: C.cd, border: `1.5px solid ${C.r500}`, borderRadius: 12, padding: 18 }}>
            <div style={{ color: C.r600, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>INCIDENTES CRÍTICOS <ShieldAlert size={14} inline /></div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.r500 }}>{stats.criticos || 0}</div>
          </div>
          <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 18, borderLeft: `4px solid ${C.b500}` }}>
            <div style={{ color: C.ts, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>INTEGRIDAD (NOM-151)</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.th }}>{stats.documentos || 0}</div>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ background: C.sf, padding: 16, borderRadius: 12, border: `1px solid ${C.bd}`, marginBottom: 22, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {['id_usuario', 'accion', 'nivel_severidad', 'fecha_desde', 'fecha_hasta'].map((f) => (
            <div key={f} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.tm, textTransform: "uppercase" }}>{f.replace('_', ' ')}</label>
              <input 
                name={f} 
                type={f.includes('fecha') ? "date" : "text"} 
                placeholder="Filtrar..." 
                onChange={handleFilterChange} 
                style={{ padding: "8px", borderRadius: 8, border: `1px solid ${C.bd}`, fontSize: 12 }} 
              />
            </div>
          ))}
        </div>

        {/* Tabla de Auditoría */}
        <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.sf, borderBottom: `1px solid ${C.bd}` }}>
                {["ID Auditoría", "Timestamp", "Usuario", "Acción", "Severidad"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.tm, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: 40, textAlign: "center", color: C.td }}>Sincronizando con base de datos...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: 40, textAlign: "center", color: C.td }}>No se encontraron registros de auditoría.</td></tr>
              ) : logs.map((log, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.bd}` }}>
                  <td style={{ padding: "14px 20px", fontSize: 11, color: C.tm }}>#{log.id_auditoria}</td>
                  <td style={{ padding: "14px 20px", fontSize: 12, fontFamily: "monospace", color: C.ts }}>
                    {log.timestamp_evento ? new Date(log.timestamp_evento).toLocaleString('es-MX') : '---'}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 600, color: C.th }}>
                    {log.id_usuario ? `${log.id_usuario.substring(0, 8)}...` : 'Sistema'}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, color: C.b600, textTransform: "uppercase" }}>
                    {log.accion}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <Bdg v={log.nivel_severidad === 'CRITICA' ? 'error' : 'blue'} dot>
                      {log.nivel_severidad || 'INFO'}
                    </Bdg>
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