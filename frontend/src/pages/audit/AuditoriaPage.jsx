import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, ShieldAlert, Ban, Eye, Clock } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  C, 
  normalize, 
  pickFirst, 
  getItemsFromResponse, 
  getResultado, 
  esCritico, 
  isActivo, 
  formatDate, 
  getIp, 
  getEvento, 
  getModulo, 
  getSeveridad, 
  getResultadoLabel, 
  badgeResultado, 
  Bdg 
} from '../../utils/auditoria.utils';
import { exportAuditReport } from '../../utils/auditoriaExport';

// Importando los componentes fragmentados
import ExportAuditModal from './components/ExportAuditModal';
import DetalleIncidenteModal from './components/DetalleIncidenteModal';
import IncidentesDrawer from './components/IncidentesDrawer';
import BlacklistDrawer from './components/BlacklistDrawer';

const AuditoriaPage = () => {
  const { token, user } = useAuth();
  const userRole = normalize(pickFirst(user?.rol, user?.role, user?.tipo_rol, ''));
  const canManageIncidents = userRole === 'SUPERADMIN' || userRole === 'OMNIADMIN';

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, criticos: 0, eventos_hoy: 0 });
  const [blacklistCount, setBlacklistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [logSeleccionado, setLogSeleccionado] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [blacklistOpen, setBlacklistOpen] = useState(false);
  const [drawerRefreshKey, setDrawerRefreshKey] = useState(0);
  const [blacklistRefreshKey] = useState(0);
  const [updatingEstado, setUpdatingEstado] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const limit = 15;

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiClient.get('/auditoria/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data || { total: 0, criticos: 0, eventos_hoy: 0 });
    } catch (e) {
      console.error("Error stats:", e);
    }
  }, [token]);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/auditoria', {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` }
      });
      const items = getItemsFromResponse(res?.data);
      setLogs(items);
    } catch (e) {
      console.error("Error logs:", e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  const fetchBlacklistCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiClient.get('/seguridad/sessions-blacklist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlacklistCount(Array.isArray(res.data) ? res.data.length : 0);
    } catch (e) {
      console.error("Error blacklist count:", e);
      setBlacklistCount(0);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchBlacklistCount();
    }
  }, [token, fetchStats, fetchBlacklistCount]);

  useEffect(() => {
    if (token) fetchLogs();
  }, [token, fetchLogs]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchStats();
      fetchBlacklistCount();
    }, 60000);
    return () => clearInterval(interval);
  }, [token, fetchStats, fetchBlacklistCount]);

  const handleIncidentUpdated = useCallback(() => {
    fetchStats();
    fetchLogs();
    setDrawerRefreshKey(prev => prev + 1);
  }, [fetchStats, fetchLogs]);

  const handleUpdateEstadoFromModal = async (log, nuevoEstado) => {
    if (!token || !canManageIncidents) return;
    setUpdatingEstado(true);
    try {
      await apiClient.patch(
        `/auditoria/incidentes/${log.id_auditoria}/estado`,
        { estado: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = { ...log, resultado: nuevoEstado };
      setLogSeleccionado(updated);
      handleIncidentUpdated();
    } catch (e) {
      console.error("Error actualizando estado:", e);
      alert(e?.response?.data?.detail || 'No se pudo actualizar el estado del incidente');
    } finally {
      setUpdatingEstado(false);
    }
  };

  const criticosActivos = useMemo(() => Number(stats?.criticos || 0), [stats]);
  const eventosHoy = useMemo(() => Number(stats?.eventos_hoy || 0), [stats]);
  const totalHistorico = useMemo(() => Number(stats?.total || 0), [stats]);

  const handleExport = async ({ pages, includeIncidents }) => {
    setExportLoading(true);
    try {
      await exportAuditReport({ pages, includeIncidents, token, limit, userRole, blacklistCount });
      setExportOpen(false);
    } catch (e) {
      console.error('Error exportando reporte:', e);
      alert(e.message || 'No se pudo generar el reporte PDF de auditoría');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", background: C.bg,
      minHeight: "100vh", fontFamily: "'DM Sans', sans-serif"
    }}>
      <style>{`
        @keyframes pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.04); }
        }
      `}</style>

      <ExportAuditModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
        loading={exportLoading}
      />

      {logSeleccionado && (
        <DetalleIncidenteModal
          log={logSeleccionado}
          onClose={() => setLogSeleccionado(null)}
          onUpdateEstado={handleUpdateEstadoFromModal}
          canManage={canManageIncidents}
          updatingEstado={updatingEstado}
        />
      )}

      <IncidentesDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        token={token}
        refreshKey={drawerRefreshKey}
        userRole={userRole}
        onIncidentUpdated={handleIncidentUpdated}
      />

      <BlacklistDrawer
        open={blacklistOpen}
        onClose={() => setBlacklistOpen(false)}
        token={token}
        refreshKey={blacklistRefreshKey}
      />

      <div style={{ padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.bd}`, background: C.sf }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.th, letterSpacing: -0.3 }}>Auditoría Forense</div>
          <div style={{ fontSize: 12, color: C.ts, marginTop: 1 }}>Trazabilidad legal, incidentes críticos y control de sesiones · NOM-151</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setExportOpen(true)}
            style={{
              background: C.b500, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8,
              fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer"
            }}
          >
            <Download size={16} /> Exportar PDF
          </button>
        </div>
      </div>

      <div style={{ padding: "22px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 22 }}>
          <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 18 }}>
            <div style={{ color: C.ts, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>EVENTOS HOY</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.b600 }}>{eventosHoy}</div>
          </div>

          <div
            onClick={() => setDrawerOpen(true)}
            style={{
              background: criticosActivos > 0 ? "#FFF5F5" : C.cd, border: criticosActivos > 0 ? `2px solid ${C.r500}` : `1px solid ${C.bd}`,
              borderRadius: 12, padding: 18, transition: "all 0.3s ease", cursor: "pointer"
            }}
          >
            <div style={{ color: criticosActivos > 0 ? C.r600 : C.ts, fontSize: 12, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              INCIDENTES CRÍTICOS 
              <ShieldAlert size={14} style={criticosActivos > 0 ? { animation: "pulse 1.5s ease-in-out infinite" } : {}} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: criticosActivos > 0 ? C.r500 : C.th }}>{criticosActivos}</div>
            <div style={{ fontSize: 10, color: criticosActivos > 0 ? C.r600 : C.tm, marginTop: 4 }}>Clic para revisar incidentes críticos activos →</div>
          </div>

          <div
            onClick={() => setBlacklistOpen(true)}
            style={{
              background: blacklistCount > 0 ? C.y50 : C.cd, border: blacklistCount > 0 ? `2px solid ${C.y500}` : `1px solid ${C.bd}`,
              borderRadius: 12, padding: 18, transition: "all 0.3s ease", cursor: "pointer"
            }}
          >
            <div style={{ color: blacklistCount > 0 ? C.y600 : C.ts, fontSize: 12, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              TOKENS BLOQUEADOS
              <Ban size={14} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: blacklistCount > 0 ? C.y500 : C.th }}>{blacklistCount}</div>
            <div style={{ fontSize: 10, color: blacklistCount > 0 ? C.y600 : C.tm, marginTop: 4 }}>Clic para ver sesiones revocadas →</div>
          </div>

          <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 18 }}>
            <div style={{ color: C.ts, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>TOTAL HISTÓRICO (NOM-151)</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.th }}>{totalHistorico}</div>
          </div>
        </div>

        <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.sf, borderBottom: `1px solid ${C.bd}` }}>
                {["Timestamp", "Usuario", "IP", "Evento", "Módulo", "Severidad", "Resultado / Gestión"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 10, fontWeight: 700, color: C.tm, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ padding: 40, textAlign: "center", color: C.td }}>Consultando bitácora...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: 40, textAlign: "center", color: C.td }}>Sin eventos registrados</td></tr>
              ) : logs.map((log, i) => {
                const resultado = getResultado(log);
                const critico = esCritico(log);
                const activo = critico && isActivo(log);

                return (
                  <tr key={log.id_auditoria || i} style={{ borderBottom: `1px solid ${C.bd}`, background: activo ? '#FFF8F8' : 'transparent' }}>
                    <td style={{ padding: "14px 20px", fontSize: 11, color: C.ts }}>{formatDate(log.timestamp_evento)}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.th }}>{log.id_usuario ? `${String(log.id_usuario).slice(0, 8)}...` : 'Sistema'}</div>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 11, color: C.ts }}>{getIp(log)}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.b600 }}>{getEvento(log)}</div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ fontSize: 10, color: C.tm }}>{getModulo(log)}</div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <Bdg v={critico ? 'error' : 'blue'} dot>{getSeveridad(log)}</Bdg>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Bdg v={badgeResultado(resultado)}>{getResultadoLabel(resultado)}</Bdg>
                        <button
                          onClick={() => setLogSeleccionado(log)}
                          style={{
                            background: "transparent", border: `1px solid ${C.bd}`, color: C.ts, padding: "3px 8px",
                            borderRadius: 6, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                          }}
                        >
                          <Eye size={11} /> Ver
                        </button>
                        {critico && activo && (
                          <span style={{ fontSize: 10, color: C.r600, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} /> Requiere seguimiento
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.bd}`, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${C.bd}`, background: C.sf, fontSize: 12, cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1 }}
            >
              ← Anterior
            </button>
            <span style={{ padding: "6px 14px", fontSize: 12, color: C.ts }}>Página {page}</span>
            <button
              disabled={logs.length < limit}
              onClick={() => setPage(p => p + 1)}
              style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${C.bd}`, background: C.sf, fontSize: 12, cursor: logs.length < limit ? "default" : "pointer", opacity: logs.length < limit ? 0.4 : 1 }}
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditoriaPage;