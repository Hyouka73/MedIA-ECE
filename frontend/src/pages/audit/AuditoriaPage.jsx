import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, FileText, Download, Search } from 'lucide-react';
import apiClient from '../../api/client';

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

/* Componentes Primitivos Reutilizables */
const Bdg = ({ v = "default", children, dot }) => {
  const variants = {
    error: { bg: C.r50, color: C.r600 },
    blue: { bg: "#EEF3FB", color: C.b600 },
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
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, criticos: 0, documentos: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    id_usuario: '', tipo_evento: '', nivel_severidad: '', fecha_desde: '', fecha_hasta: ''
  });

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/auditoria/stats');
      setStats(res.data);
    } catch (error) { console.error("Error stats:", error); }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/auditoria', {
        params: { page, limit: 15, ...filters }
      });
      setLogs(res.data.results || []);
    } catch (error) { console.error("Error logs:", error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchLogs(); }, [page, filters]);

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
        
        {/* Métricas con estilo de Cards MedIA */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 22 }}>
          <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: C.ts, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              TOTAL ACCESOS <Activity size={18} color={C.b500} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.b600 }}>{stats.total || 0}</div>
          </div>

          <div style={{ background: C.cd, border: `1.5px solid ${C.r500}`, borderRadius: 12, padding: 18, boxShadow: "0 2px 8px rgba(186,46,69,.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: C.r600, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              INCIDENTES CRÍTICOS <ShieldAlert size={18} className="animate-pulse" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.r500 }}>{stats.criticos || 0}</div>
          </div>

          <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 18, borderLeft: `4px solid ${C.b500}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: C.ts, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              DOCUMENTOS SHA-256 <FileText size={18} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.th }}>{stats.documentos || 0}</div>
          </div>
        </div>

        {/* Filtros Estilizados */}
        <div style={{ background: C.sf, padding: 16, borderRadius: 12, border: `1px solid ${C.bd}`, marginBottom: 22, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {['id_usuario', 'tipo_evento', 'nivel_severidad', 'fecha_desde', 'fecha_hasta'].map((f) => (
            <div key={f} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.tm, textTransform: "uppercase" }}>{f.replace('_', ' ')}</label>
              {f === 'nivel_severidad' ? (
                <select name={f} onChange={handleFilterChange} style={{ padding: "8px", borderRadius: 8, border: `1px solid ${C.bd}`, fontSize: 12, background: "#fff" }}>
                  <option value="">TODAS</option>
                  <option value="INFO">INFO</option>
                  <option value="ALTO">ALTO</option>
                  <option value="CRÍTICO">CRÍTICO</option>
                </select>
              ) : (
                <input 
                  name={f} 
                  type={f.includes('fecha') ? "date" : "text"} 
                  placeholder="Buscar..." 
                  onChange={handleFilterChange} 
                  style={{ padding: "8px", borderRadius: 8, border: `1px solid ${C.bd}`, fontSize: 12, background: "#fff" }} 
                />
              )}
            </div>
          ))}
        </div>

        {/* Tabla de Auditoría (Inmutable / Solo Lectura) */}
        <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.sf, borderBottom: `1px solid ${C.bd}` }}>
                {["Timestamp", "Usuario", "Evento", "Severidad", "Firma Hash (SHA-256)"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.tm, textTransform: "uppercase", letterSpacing: .5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: 40, textAlign: "center", color: C.td, fontSize: 13 }}>Sincronizando con bitácora central...</td></tr>
              ) : logs.map((log, i) => (
                <tr key={i} style={{ borderBottom: i < logs.length - 1 ? `1px solid ${C.bd}` : "none", transition: "background .1s" }} onMouseEnter={e => e.currentTarget.style.background = "#F5F2EC"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 20px", fontSize: 12, fontFamily: "monospace", color: C.ts }}>{new Date(log.fecha_hora).toLocaleString()}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 600, color: C.th }}>{log.usuario_nombre}</td>
                  <td style={{ padding: "14px 20px", fontSize: 11, fontWeight: 700, color: C.b600, textTransform: "uppercase" }}>{log.tipo_evento}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <Bdg v={log.nivel_severidad === 'CRÍTICO' ? 'error' : 'blue'} dot>
                      {log.nivel_severidad}
                    </Bdg>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 10, fontFamily: "monospace", color: C.td }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <FileText size={12} /> {log.hash_sha256?.substring(0, 24)}...
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