import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldAlert,
  Download,
  CheckCircle,
  Clock,
  Eye,
  X,
  ShieldX,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Ban,
  Lock
} from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const C = {
  b500: "#2459A8", b600: "#1A4080",
  g500: "#237A4B", g600: "#196038",
  r50: "#FEF0F3", r500: "#BA2E45", r600: "#901F33",
  y50: "#FFF8E8", y500: "#B7791F", y600: "#975A16",
  bg: "#EDEBE6", sf: "#F5F2EC", cd: "#FDFAF5",
  bd: "#DAD4CC", th: "#1A1510", ts: "#5A5048", tm: "#877E74", td: "#A9A097"
};

const pickFirst = (...values) => {
  for (const v of values) {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      return String(v);
    }
  }
  return '';
};

const getResultado = (item) =>
  pickFirst(item?.resultado, item?.estado, 'PENDIENTE').toUpperCase();

const getEvento = (item) =>
  pickFirst(item?.tipo_evento, item?.accion, item?.evento, 'EVENTO');

const getModulo = (item) =>
  pickFirst(item?.modulo_funcion, item?.modulo_accion, item?.modulo, 'AUDITORIA');

const getIp = (item) =>
  pickFirst(item?.direccion_ip, item?.ip_origen, item?.ip, item?.cliente_ip, '127.0.0.1');

const getSeveridad = (item) =>
  pickFirst(item?.nivel_severidad, 'MEDIO').toUpperCase();

const esCritico = (item) => getSeveridad(item) === 'CRITICO';

const badgeResultado = (resultado) => {
  if (resultado === 'RESUELTO' || resultado === 'EXITOSO') return 'success';
  if (resultado === 'EN_PROCESO') return 'warning';
  if (resultado === 'DENEGADO' || resultado === 'FALLIDO' || resultado === 'ABIERTO') return 'error';
  return 'default';
};

const Bdg = ({ v = "default", children, dot }) => {
  const variants = {
    error:   { bg: "#FEF0F3", color: "#901F33" },
    blue:    { bg: "#EEF3FB", color: "#1A4080" },
    success: { bg: "#E6F4EA", color: "#137333" },
    warning: { bg: "#FFF4E5", color: "#B45309" },
    default: { bg: "#E2DDD4", color: "#605850" }
  };

  const cv = variants[v] || variants.default;

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: dot ? 4 : 0,
      padding: "2px 8px",
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 700,
      background: cv.bg,
      color: cv.color,
      textTransform: "uppercase"
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: cv.color }} />}
      {children}
    </span>
  );
};

const DetalleModal = ({ log, onClose, onResolve }) => {
  if (!log) return null;

  const detalles = log.detalles || {};
  const resultado = getResultado(log);
  const critico = esCritico(log);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999
    }}>
      <div style={{
        background: C.cd,
        borderRadius: 14,
        width: 560,
        maxWidth: "95vw",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        overflow: "hidden"
      }}>
        <div style={{
          padding: "16px 24px",
          borderBottom: `1px solid ${C.bd}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: critico ? "#FEF0F3" : C.sf
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.th }}>Detalle del Evento</div>
            <div style={{ fontSize: 11, color: C.ts, marginTop: 2 }}>
              ID: {log.id_auditoria} · {new Date(log.timestamp_evento).toLocaleString()}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.tm }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Bdg v={critico ? "error" : "blue"} dot>{getSeveridad(log)}</Bdg>
            <Bdg v={badgeResultado(resultado)}>{resultado}</Bdg>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              ["Evento", getEvento(log)],
              ["Módulo", getModulo(log)],
              ["Usuario", pickFirst(log.id_usuario, 'Sistema')],
              ["IP Origen", getIp(log)]
            ].map(([label, val]) => (
              <div key={label} style={{ background: C.sf, borderRadius: 8, padding: "10px 14px" }}>
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.tm,
                  textTransform: "uppercase",
                  marginBottom: 4
                }}>
                  {label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.th }}>{val}</div>
              </div>
            ))}
          </div>

          {Object.keys(detalles).length > 0 && (
            <div style={{ background: "#F1F5F9", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                color: C.tm,
                textTransform: "uppercase",
                marginBottom: 8
              }}>
                Información del Incidente
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {detalles.alerta && (
                  <div style={{ fontSize: 13, color: C.r600, fontWeight: 700 }}>
                    ⚠️ {detalles.alerta}
                  </div>
                )}

                {Object.entries(detalles).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 12, color: C.ts }}>
                    <strong>{k}:</strong> {typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, color: C.tm, fontStyle: "italic" }}>
            Ref. Normativa: NOM-024-SSA3-2012 / NOM-151-SCFI-2016
          </div>
        </div>

        <div style={{
          padding: "14px 24px",
          borderTop: `1px solid ${C.bd}`,
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          background: C.sf
        }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: `1px solid ${C.bd}`,
              color: C.th,
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Cerrar
          </button>

          {critico && resultado !== "RESUELTO" && (
            <>
              <button
                onClick={() => { onResolve(log.id_auditoria, "EN_PROCESO"); onClose(); }}
                style={{
                  background: "#B45309",
                  border: "none",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Clock size={14} /> En Proceso
              </button>

              <button
                onClick={() => { onResolve(log.id_auditoria, "RESUELTO"); onClose(); }}
                style={{
                  background: C.g500,
                  border: "none",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <CheckCircle size={14} /> Marcar Resuelto
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const IncidentesDrawer = ({ open, onClose, token, refreshKey }) => {
  const [incidentes, setIncidentes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchIncidentes = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const res = await apiClient.get('/auditoria', {
        params: { limit: 50, nivel_severidad: 'CRITICO' },
        headers: { Authorization: `Bearer ${token}` }
      });

      const items = Array.isArray(res?.data?.items) ? res.data.items : (Array.isArray(res?.data?.results) ? res.data.results : []);
      const filtrados = items.filter(item => esCritico(item) && getResultado(item) !== 'RESUELTO');
      setIncidentes(filtrados);
    } catch (e) {
      console.error("Error incidentes:", e);
      setIncidentes([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await apiClient.patch(`/auditoria/incidentes/${id}/estado`, { estado: nuevoEstado });
      await fetchIncidentes();
    } catch (e) {
      alert("Error al actualizar el incidente");
    }
  };

  useEffect(() => {
    if (open) fetchIncidentes();
  }, [open, fetchIncidentes, refreshKey]);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 8000,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transition: "opacity 0.3s ease"
        }}
      />

      <div style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 520,
        background: C.bg,
        boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
        zIndex: 8001,
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto"
      }}>
        <div style={{
          padding: "16px 22px",
          borderBottom: `1px solid ${C.bd}`,
          background: C.sf,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 1
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.th }}>Incidentes Críticos</div>
            <div style={{ fontSize: 11, color: C.ts, marginTop: 2 }}>Eventos críticos pendientes de atención</div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={fetchIncidentes}
              style={{
                background: "none",
                border: `1px solid ${C.bd}`,
                borderRadius: 7,
                padding: "5px 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                color: C.ts
              }}
            >
              <RefreshCw size={12} /> Actualizar
            </button>

            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.tm }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: C.td }}>
              Cargando incidentes críticos...
            </div>
          ) : incidentes.length === 0 ? (
            <div style={{
              background: C.cd,
              border: `1px solid ${C.bd}`,
              borderRadius: 12,
              padding: 32,
              textAlign: "center",
              color: C.td
            }}>
              ✅ Sin incidentes críticos pendientes
            </div>
          ) : (
            incidentes.map((inc) => {
              const detalles = inc.detalles || {};
              const resultado = getResultado(inc);
              const borderColor =
                resultado === 'ABIERTO' ? '#DC2626'
                : resultado === 'EN_PROCESO' ? '#D97706'
                : '#16A34A';

              return (
                <div
                  key={inc.id_auditoria}
                  style={{
                    background: C.cd,
                    border: `1px solid ${C.bd}`,
                    borderLeft: `5px solid ${borderColor}`,
                    borderRadius: "0 10px 10px 0",
                    padding: "16px"
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 10
                  }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: borderColor,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <ShieldX size={18} />
                      </div>

                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.th }}>
                          {getEvento(inc)}
                        </div>
                        <div style={{ fontSize: 10, color: C.tm }}>
                          Módulo: {getModulo(inc)}
                        </div>
                      </div>
                    </div>

                    <Bdg v={badgeResultado(resultado)}>{resultado}</Bdg>
                  </div>

                  <div style={{
                    background: "#F8FAFC",
                    borderRadius: 7,
                    padding: "10px 12px",
                    marginBottom: 12,
                    fontSize: 12,
                    color: "#334155",
                    lineHeight: 1.6
                  }}>
                    {detalles.alerta && (
                      <div style={{ fontWeight: 700, color: C.r600, marginBottom: 4 }}>
                        ⚠️ {detalles.alerta}
                      </div>
                    )}

                    {!detalles.alerta && (
                      <div>Evento crítico registrado por el sistema de auditoría.</div>
                    )}

                    <div style={{
                      marginTop: 6,
                      display: "flex",
                      gap: 12,
                      fontSize: 11,
                      color: C.ts,
                      flexWrap: "wrap"
                    }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <MapPin size={11} /> {getIp(inc)}
                      </span>
                      <span>{new Date(inc.timestamp_evento).toLocaleString()}</span>
                    </div>
                  </div>

                  {resultado !== 'RESUELTO' && (
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => handleCambiarEstado(inc.id_auditoria, 'EN_PROCESO')}
                        style={{
                          background: "#D97706",
                          border: "none",
                          color: "#fff",
                          padding: "6px 12px",
                          borderRadius: 7,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <Clock size={12} /> En Proceso
                      </button>

                      <button
                        onClick={() => handleCambiarEstado(inc.id_auditoria, 'RESUELTO')}
                        style={{
                          background: C.g500,
                          border: "none",
                          color: "#fff",
                          padding: "6px 12px",
                          borderRadius: 7,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <ShieldCheck size={12} /> Marcar Resuelto
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}

          <div style={{
            background: C.cd,
            border: `1px solid ${C.bd}`,
            borderLeft: `4px solid #D97706`,
            borderRadius: "0 10px 10px 0",
            padding: "12px 16px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <AlertTriangle size={16} color="#D97706" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.th }}>Integridad de Bitácora</div>
                  <div style={{ fontSize: 11, color: C.tm }}>Estatus: ÍNTEGRO (NOM-151)</div>
                </div>
              </div>
              <button style={{ fontSize: 11, fontWeight: 700, color: C.b500, background: "none", border: "none", cursor: "pointer" }}>
                Validar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const BlacklistDrawer = ({ open, onClose, token, refreshKey }) => {
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBlacklist = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const res = await apiClient.get('/seguridad/sessions-blacklist', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBlacklist(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error blacklist:", e);
      setBlacklist([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (open) fetchBlacklist();
  }, [open, fetchBlacklist, refreshKey]);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 8100,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transition: "opacity 0.3s ease"
        }}
      />

      <div style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 460,
        background: C.bg,
        boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
        zIndex: 8101,
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto"
      }}>
        <div style={{
          padding: "16px 22px",
          borderBottom: `1px solid ${C.bd}`,
          background: C.sf,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 1
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.th }}>Blacklist de Sesiones</div>
            <div style={{ fontSize: 11, color: C.ts, marginTop: 2 }}>Tokens o sesiones revocadas</div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={fetchBlacklist}
              style={{
                background: "none",
                border: `1px solid ${C.bd}`,
                borderRadius: 7,
                padding: "5px 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                color: C.ts
              }}
            >
              <RefreshCw size={12} /> Actualizar
            </button>

            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.tm }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            background: "#EEF3FB",
            border: "1px solid #C8D6EC",
            borderRadius: 10,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10
          }}>
            <Lock size={16} color={C.b600} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.th }}>JWT In-Memory</div>
              <div style={{ fontSize: 11, color: C.ts }}>Revocación de sesiones sincronizada con seguridad.</div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: C.td }}>
              Cargando blacklist...
            </div>
          ) : blacklist.length === 0 ? (
            <div style={{
              background: C.cd,
              border: `1px solid ${C.bd}`,
              borderRadius: 12,
              padding: 32,
              textAlign: "center",
              color: C.td
            }}>
              ✅ No hay sesiones restringidas activas
            </div>
          ) : (
            blacklist.map((item, i) => (
              <div
                key={item?.id || item?.jti || i}
                style={{
                  background: C.cd,
                  border: `1px solid ${C.bd}`,
                  borderLeft: `5px solid ${C.y500}`,
                  borderRadius: "0 10px 10px 0",
                  padding: "14px 16px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.th }}>
                      {pickFirst(item?.usuario, item?.user_id, item?.sub, 'Sesión bloqueada')}
                    </div>
                    <div style={{ fontSize: 10, color: C.tm }}>
                      JTI: {pickFirst(item?.jti, item?.token_id, '—')}
                    </div>
                  </div>

                  <Bdg v="warning">BLOQUEADO</Bdg>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 11, color: C.ts }}>
                  <div><strong>Motivo:</strong> {pickFirst(item?.motivo, item?.reason, 'Revocación manual o cierre seguro')}</div>
                  <div><strong>Fecha:</strong> {pickFirst(item?.created_at, item?.fecha, item?.timestamp, '—')}</div>
                  <div><strong>Expira:</strong> {pickFirst(item?.expires_at, item?.exp, '—')}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

const AuditoriaPage = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, criticos: 0, eventos_hoy: 0 });
  const [blacklistCount, setBlacklistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [logSeleccionado, setLogSeleccionado] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [blacklistOpen, setBlacklistOpen] = useState(false);
  const [drawerRefreshKey, setDrawerRefreshKey] = useState(0);
  const [blacklistRefreshKey, setBlacklistRefreshKey] = useState(0);

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
        params: { page, limit: 15 },
        headers: { Authorization: `Bearer ${token}` }
      });

      const items = Array.isArray(res?.data?.items)
        ? res.data.items
        : (Array.isArray(res?.data?.results) ? res.data.results : []);

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

  const handleResolve = async (id, nuevoEstado) => {
    try {
      await apiClient.patch(
        `/auditoria/incidentes/${id}/estado`,
        { estado: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await Promise.all([fetchLogs(), fetchStats()]);
      setDrawerRefreshKey(prev => prev + 1);
    } catch (e) {
      alert("Error al actualizar el estado del incidente");
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchBlacklistCount();
    }
  }, [token, fetchStats, fetchBlacklistCount]);

  useEffect(() => {
    if (token) fetchLogs();
  }, [token, fetchLogs]);

  const criticosActivos = useMemo(() => Number(stats?.criticos || 0), [stats]);
  const eventosHoy = useMemo(() => Number(stats?.eventos_hoy || 0), [stats]);

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: C.bg,
      minHeight: "100vh",
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

      {logSeleccionado && (
        <DetalleModal
          log={logSeleccionado}
          onClose={() => setLogSeleccionado(null)}
          onResolve={handleResolve}
        />
      )}

      <IncidentesDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        token={token}
        refreshKey={drawerRefreshKey}
      />

      <BlacklistDrawer
        open={blacklistOpen}
        onClose={() => setBlacklistOpen(false)}
        token={token}
        refreshKey={blacklistRefreshKey}
      />

      <div style={{
        padding: "14px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${C.bd}`,
        background: C.sf
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.th, letterSpacing: -.3 }}>
            Auditoría Forense
          </div>
          <div style={{ fontSize: 12, color: C.ts, marginTop: 1 }}>
            Trazabilidad legal, incidentes críticos y control de sesiones · NOM-151
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={{
            background: C.b500,
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer"
          }}>
            <Download size={16} /> Exportar
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
              background: criticosActivos > 0 ? "#FFF5F5" : C.cd,
              border: criticosActivos > 0 ? `2px solid ${C.r500}` : `1px solid ${C.bd}`,
              borderRadius: 12,
              padding: 18,
              transition: "all 0.3s ease",
              cursor: "pointer"
            }}
          >
            <div style={{
              color: criticosActivos > 0 ? C.r600 : C.ts,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              CRÍTICOS DETECTADOS
              <ShieldAlert
                size={14}
                style={criticosActivos > 0 ? { animation: "pulse 1.5s ease-in-out infinite" } : {}}
              />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: criticosActivos > 0 ? C.r500 : C.th }}>
              {criticosActivos}
            </div>
            <div style={{ fontSize: 10, color: criticosActivos > 0 ? C.r600 : C.tm, marginTop: 4 }}>
              Clic para revisar eventos críticos →
            </div>
          </div>

          <div
            onClick={() => setBlacklistOpen(true)}
            style={{
              background: blacklistCount > 0 ? C.y50 : C.cd,
              border: blacklistCount > 0 ? `2px solid ${C.y500}` : `1px solid ${C.bd}`,
              borderRadius: 12,
              padding: 18,
              transition: "all 0.3s ease",
              cursor: "pointer"
            }}
          >
            <div style={{
              color: blacklistCount > 0 ? C.y600 : C.ts,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              TOKENS BLOQUEADOS
              <Ban size={14} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: blacklistCount > 0 ? C.y500 : C.th }}>
              {blacklistCount}
            </div>
            <div style={{ fontSize: 10, color: blacklistCount > 0 ? C.y600 : C.tm, marginTop: 4 }}>
              Clic para ver sesiones revocadas →
            </div>
          </div>

          <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 18 }}>
            <div style={{ color: C.ts, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>TOTAL HISTÓRICO (NOM-151)</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.th }}>{stats.total || 0}</div>
          </div>
        </div>

        <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.sf, borderBottom: `1px solid ${C.bd}` }}>
                {["Timestamp", "Usuario", "IP", "Evento", "Módulo", "Severidad", "Resultado / Gestión"].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 20px",
                      textAlign: "left",
                      fontSize: 10,
                      fontWeight: 700,
                      color: C.tm,
                      textTransform: "uppercase"
                    }}
                  >
                    {h}
                  </th>
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

                return (
                  <tr
                    key={log.id_auditoria || i}
                    style={{
                      borderBottom: `1px solid ${C.bd}`,
                      background: critico && resultado !== 'RESUELTO' ? '#FFF8F8' : 'transparent'
                    }}
                  >
                    <td style={{ padding: "14px 20px", fontSize: 11, color: C.ts }}>
                      {new Date(log.timestamp_evento).toLocaleString()}
                    </td>

                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.th }}>
                        {log.id_usuario ? `${String(log.id_usuario).slice(0, 8)}...` : 'Sistema'}
                      </div>
                    </td>

                    <td style={{ padding: "14px 20px", fontSize: 11, color: C.ts }}>
                      {getIp(log)}
                    </td>

                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.b600 }}>
                        {getEvento(log)}
                      </div>
                    </td>

                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ fontSize: 10, color: C.tm }}>
                        {getModulo(log)}
                      </div>
                    </td>

                    <td style={{ padding: "14px 20px" }}>
                      <Bdg v={critico ? 'error' : 'blue'} dot>{getSeveridad(log)}</Bdg>
                    </td>

                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Bdg v={badgeResultado(resultado)}>{resultado}</Bdg>

                        <button
                          onClick={() => setLogSeleccionado(log)}
                          style={{
                            background: "transparent",
                            border: `1px solid ${C.bd}`,
                            color: C.ts,
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 10,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                          }}
                        >
                          <Eye size={11} /> Ver
                        </button>

                        {critico && resultado !== 'RESUELTO' && (
                          <button
                            onClick={() => handleResolve(log.id_auditoria, 'RESUELTO')}
                            style={{
                              background: C.g500,
                              color: "#fff",
                              border: "none",
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 10,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4
                            }}
                          >
                            <CheckCircle size={11} /> Resolver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{
            padding: "12px 20px",
            borderTop: `1px solid ${C.bd}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8
          }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={{
                padding: "6px 14px",
                borderRadius: 7,
                border: `1px solid ${C.bd}`,
                background: C.sf,
                fontSize: 12,
                cursor: page === 1 ? "default" : "pointer",
                opacity: page === 1 ? 0.4 : 1
              }}
            >
              ← Anterior
            </button>

            <span style={{ padding: "6px 14px", fontSize: 12, color: C.ts }}>
              Página {page}
            </span>

            <button
              disabled={logs.length < 15}
              onClick={() => setPage(p => p + 1)}
              style={{
                padding: "6px 14px",
                borderRadius: 7,
                border: `1px solid ${C.bd}`,
                background: C.sf,
                fontSize: 12,
                cursor: logs.length < 15 ? "default" : "pointer",
                opacity: logs.length < 15 ? 0.4 : 1
              }}
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