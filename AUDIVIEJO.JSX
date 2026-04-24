import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldAlert,
  Download,
  Eye,
  X,
  ShieldX,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Ban,
  Lock,
  Clock,
  Search,
  CheckCircle2,
  Archive,
  FileText
} from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const C = {
  b500: "#2459A8", b600: "#1A4080",
  g500: "#237A4B", g600: "#196038",
  r50: "#FEF0F3", r500: "#BA2E45", r600: "#901F33",
  y50: "#FFF8E8", y500: "#B7791F", y600: "#975A16",
  n50: "#F8FAFC", n500: "#475569",
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

const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

const getItemsFromResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getResultado = (item) => {
  const raw = normalize(pickFirst(item?.resultado, item?.estado, 'ABIERTO'));
  if (!raw) return 'ABIERTO';
  if (raw === 'EN_PROCESO') return 'ENINVESTIGACION';
  if (raw === 'RESUELTO') return 'CERRADO';
  return raw;
};

const getResultadoLabel = (resultado) => {
  const r = normalize(resultado);
  if (r === 'ENINVESTIGACION') return 'EN INVESTIGACIÓN';
  return r || 'ABIERTO';
};

const getEvento = (item) =>
  pickFirst(item?.tipo_evento, item?.accion, item?.evento, 'EVENTO');

const getModulo = (item) =>
  pickFirst(item?.modulo_funcion, item?.modulo_accion, item?.modulo, 'AUDITORIA');

const getIp = (item) =>
  pickFirst(item?.direccion_ip, item?.ip_origen, item?.ip, item?.cliente_ip, '127.0.0.1');

const getSeveridad = (item) =>
  normalize(pickFirst(item?.nivel_severidad, item?.severidad, 'MEDIO'));

const esCritico = (item) => {
  const sev = getSeveridad(item);
  return sev === 'CRITICO' || sev === 'CRITICA';
};

const isActivo = (item) => {
  const resultado = getResultado(item);
  return !['ERRADICADO', 'CERRADO'].includes(resultado);
};

const canTransition = (estadoActual, next) => {
  const map = {
    ABIERTO: ['ENINVESTIGACION', 'CERRADO'],
    ENINVESTIGACION: ['ERRADICADO', 'CERRADO'],
    ERRADICADO: ['CERRADO'],
    CERRADO: []
  };
  return (map[normalize(estadoActual)] || []).includes(normalize(next));
};

const badgeResultado = (resultado) => {
  const r = normalize(resultado);
  if (r === 'ABIERTO') return 'error';
  if (r === 'ENINVESTIGACION') return 'warning';
  if (r === 'ERRADICADO') return 'success';
  if (r === 'CERRADO') return 'neutral';
  return 'default';
};

const estadoColor = (resultado) => {
  const r = normalize(resultado);
  if (r === 'ABIERTO') return '#DC2626';
  if (r === 'ENINVESTIGACION') return '#D97706';
  if (r === 'ERRADICADO') return '#16A34A';
  if (r === 'CERRADO') return '#64748B';
  return C.tm;
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const safeJson = (value) => {
  try {
    return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
  } catch {
    return String(value);
  }
};

const Bdg = ({ v = "default", children, dot }) => {
  const variants = {
    error: { bg: "#FEF0F3", color: "#901F33" },
    warning: { bg: "#FFF4E5", color: "#B45309" },
    success: { bg: "#E6F4EA", color: "#137333" },
    blue: { bg: "#EEF3FB", color: "#1A4080" },
    neutral: { bg: "#E2E8F0", color: "#475569" },
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

const ActionBtn = ({ onClick, disabled, color, children, title }) => (
  <button
    title={title}
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled ? C.bd : color,
      border: "none",
      color: disabled ? C.ts : "#fff",
      padding: "7px 11px",
      borderRadius: 7,
      fontSize: 11,
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.7 : 1,
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }}
  >
    {children}
  </button>
);

const ExportModal = ({ open, onClose, onExport, loading }) => {
  const [pages, setPages] = useState(3);
  const [includeIncidents, setIncludeIncidents] = useState(true);

  useEffect(() => {
    if (open) {
      setPages(3);
      setIncludeIncidents(true);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9500
    }}>
      <div style={{
        width: 480,
        maxWidth: '95vw',
        background: C.cd,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          padding: '16px 22px',
          borderBottom: `1px solid ${C.bd}`,
          background: C.sf,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.th }}>Exportar reporte PDF</div>
            <div style={{ fontSize: 11, color: C.ts, marginTop: 2 }}>
              Selecciona el alcance del reporte forense
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.tm }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: '#EEF3FB',
            border: '1px solid #C8D6EC',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 12,
            color: C.ts
          }}>
            La vista de auditoría es paginada, por eso aquí eliges cuántas páginas incluir en el PDF.
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.th, marginBottom: 8 }}>
              Páginas de bitácora a exportar
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={pages}
              onChange={(e) => setPages(Math.max(1, Math.min(20, Number(e.target.value || 1))))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid ${C.bd}`,
                background: '#fff',
                color: C.th,
                fontSize: 14
              }}
            />
            <div style={{ marginTop: 6, fontSize: 11, color: C.tm }}>
              Ejemplo: 3 páginas = hasta 45 registros si tu tabla usa 15 por página.
            </div>
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: C.sf,
            border: `1px solid ${C.bd}`,
            borderRadius: 10,
            padding: '12px 14px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={includeIncidents}
              onChange={(e) => setIncludeIncidents(e.target.checked)}
            />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.th }}>Incluir incidentes críticos activos</div>
              <div style={{ fontSize: 11, color: C.ts }}>
                Agrega una segunda sección con el listado de incidentes críticos.
              </div>
            </div>
          </label>
        </div>

        <div style={{
          padding: '14px 22px',
          borderTop: `1px solid ${C.bd}`,
          background: C.sf,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: `1px solid ${C.bd}`,
              color: C.th,
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>

          <button
            onClick={() => onExport({ pages, includeIncidents })}
            disabled={loading}
            style={{
              background: C.b500,
              border: 'none',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <FileText size={14} /> {loading ? 'Generando...' : 'Generar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DetalleModal = ({ log, onClose, onUpdateEstado, canManage, updatingEstado }) => {
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
        width: 680,
        maxWidth: "95vw",
        maxHeight: "90vh",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
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
            <div style={{ fontSize: 15, fontWeight: 700, color: C.th }}>Detalle del Evento / Incidente</div>
            <div style={{ fontSize: 11, color: C.ts, marginTop: 2 }}>
              ID: {log.id_auditoria} · {formatDate(log.timestamp_evento)}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.tm }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Bdg v={critico ? "error" : "blue"} dot>{getSeveridad(log)}</Bdg>
            <Bdg v={badgeResultado(resultado)}>{getResultadoLabel(resultado)}</Bdg>
            {critico && isActivo(log) && <Bdg v="error">ACTIVO</Bdg>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              ["Evento", getEvento(log)],
              ["Módulo", getModulo(log)],
              ["Usuario", pickFirst(log.id_usuario, log.usuario, 'Sistema')],
              ["IP Origen", getIp(log)],
              ["Resultado / Estado", getResultadoLabel(resultado)],
              ["Timestamp", formatDate(log.timestamp_evento)]
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
                <div style={{ fontSize: 13, fontWeight: 600, color: C.th, wordBreak: 'break-word' }}>{val}</div>
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
                Información del incidente
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {detalles.alerta && (
                  <div style={{ fontSize: 13, color: C.r600, fontWeight: 700 }}>
                    ⚠️ {detalles.alerta}
                  </div>
                )}

                {Object.entries(detalles).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 12, color: C.ts }}>
                    <strong>{k}:</strong> {typeof v === "object" ? safeJson(v) : String(v)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{
            background: '#FFF8E8',
            border: '1px solid #F3D9A8',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 12,
            color: C.ts
          }}>
            <strong>¿Qué hace “Investigar”?</strong> Cambia el incidente de <strong>ABIERTO</strong> a <strong>EN INVESTIGACIÓN</strong>. Eso indica que ya entró a seguimiento formal, se documentan acciones de contención y se analiza causa raíz antes de erradicar o cerrar.
          </div>

          <div style={{ fontSize: 11, color: C.tm, fontStyle: "italic" }}>
            Ref. Normativa: NOM-024-SSA3-2012 / NOM-151-SCFI-2016
          </div>
        </div>

        <div style={{
          padding: "14px 24px",
          borderTop: `1px solid ${C.bd}`,
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          background: C.sf,
          flexWrap: "wrap"
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

          {critico && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ActionBtn
                color={C.y500}
                disabled={!canManage || !canTransition(resultado, 'ENINVESTIGACION') || updatingEstado}
                onClick={() => onUpdateEstado(log, 'ENINVESTIGACION')}
                title="Mover a ENINVESTIGACION"
              >
                <Search size={13} /> Investigar
              </ActionBtn>

              <ActionBtn
                color={C.g500}
                disabled={!canManage || !canTransition(resultado, 'ERRADICADO') || updatingEstado}
                onClick={() => onUpdateEstado(log, 'ERRADICADO')}
                title="Mover a ERRADICADO"
              >
                <CheckCircle2 size={13} /> Erradicar
              </ActionBtn>

              <ActionBtn
                color={C.b500}
                disabled={!canManage || !canTransition(resultado, 'CERRADO') || updatingEstado}
                onClick={() => onUpdateEstado(log, 'CERRADO')}
                title="Mover a CERRADO"
              >
                <Archive size={13} /> Cerrar
              </ActionBtn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const IncidentesDrawer = ({ open, onClose, token, refreshKey, userRole, onIncidentUpdated }) => {
  const [incidentes, setIncidentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const canManage = userRole === 'SUPERADMIN' || userRole === 'OMNIADMIN';

  const fetchIncidentes = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const requests = [1, 2, 3].map(page =>
        apiClient.get('/auditoria/incidentes/criticos', {
          params: { page, limit: 50 },
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      const responses = await Promise.all(requests);
      const merged = responses.flatMap(res => getItemsFromResponse(res?.data));

      const uniqueMap = new Map();
      merged.forEach(item => uniqueMap.set(item.id_auditoria, item));

      const uniqueItems = Array.from(uniqueMap.values()).sort((a, b) =>
        new Date(b.timestamp_evento).getTime() - new Date(a.timestamp_evento).getTime()
      );

      setIncidentes(uniqueItems);
    } catch (e) {
      console.error("Error incidentes:", e);
      setIncidentes([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (open) fetchIncidentes();
  }, [open, fetchIncidentes, refreshKey]);

  const handleUpdateEstado = async (inc, nuevoEstado) => {
    if (!token || !canManage) return;
    setUpdatingId(inc.id_auditoria);
    try {
      await apiClient.patch(
        `/auditoria/incidentes/${inc.id_auditoria}/estado`,
        { estado: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchIncidentes();
      onIncidentUpdated?.();
    } catch (e) {
      console.error("Error actualizando estado:", e);
      alert(e?.response?.data?.detail || 'No se pudo actualizar el estado del incidente');
    } finally {
      setUpdatingId(null);
    }
  };

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
        width: 560,
        maxWidth: "95vw",
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
            <div style={{ fontSize: 15, fontWeight: 700, color: C.th }}>Histórico de Incidentes</div>
            <div style={{ fontSize: 11, color: C.ts, marginTop: 2 }}>
              Incidentes críticos activos consultados en múltiples páginas
            </div>
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
          <div style={{
            background: "#EEF3FB",
            border: "1px solid #C8D6EC",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 11,
            color: C.ts
          }}>
            “Investigar” mueve el incidente a <strong>EN INVESTIGACIÓN</strong>, lo que representa la fase de contención y análisis técnico del evento.
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: C.td }}>
              Cargando histórico de incidentes...
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
              Sin incidentes críticos activos en el histórico consultado
            </div>
          ) : (
            incidentes.map((inc) => {
              const detalles = inc.detalles || {};
              const resultado = getResultado(inc);
              const borderColor = estadoColor(resultado);

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
                    marginBottom: 10,
                    gap: 10
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

                    <Bdg v={badgeResultado(resultado)}>{getResultadoLabel(resultado)}</Bdg>
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
                    {detalles.alerta ? (
                      <div style={{ fontWeight: 700, color: C.r600, marginBottom: 4 }}>
                        ⚠️ {detalles.alerta}
                      </div>
                    ) : (
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
                      <span>{formatDate(inc.timestamp_evento)}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: 'wrap' }}>
                    <ActionBtn
                      color={C.y500}
                      disabled={!canManage || !canTransition(resultado, 'ENINVESTIGACION') || updatingId === inc.id_auditoria}
                      onClick={() => handleUpdateEstado(inc, 'ENINVESTIGACION')}
                    >
                      <Search size={12} /> Investigar
                    </ActionBtn>

                    <ActionBtn
                      color={C.g500}
                      disabled={!canManage || !canTransition(resultado, 'ERRADICADO') || updatingId === inc.id_auditoria}
                      onClick={() => handleUpdateEstado(inc, 'ERRADICADO')}
                    >
                      <CheckCircle2 size={12} /> Erradicar
                    </ActionBtn>

                    <ActionBtn
                      color={C.b500}
                      disabled={!canManage || !canTransition(resultado, 'CERRADO') || updatingId === inc.id_auditoria}
                      onClick={() => handleUpdateEstado(inc, 'CERRADO')}
                    >
                      <Archive size={12} /> Cerrar
                    </ActionBtn>
                  </div>
                </div>
              );
            })
          )}
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
        maxWidth: "95vw",
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

  const exportAuditReport = useCallback(async ({ pages, includeIncidents }) => {
    if (!token) return;

    setExportLoading(true);
    try {
      const pageRequests = Array.from({ length: pages }, (_, i) =>
        apiClient.get('/auditoria', {
          params: { page: i + 1, limit },
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      const baseRequests = [
        apiClient.get('/auditoria/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        ...pageRequests
      ];

      if (includeIncidents) {
        baseRequests.push(
          apiClient.get('/auditoria/incidentes/criticos', {
            params: { page: 1, limit: 100 },
            headers: { Authorization: `Bearer ${token}` }
          })
        );
      }

      const responses = await Promise.all(baseRequests);
      const statsRes = responses[0];
      const logResponses = responses.slice(1, 1 + pages);
      const criticosRes = includeIncidents ? responses[responses.length - 1] : null;

      const exportStats = statsRes?.data || {};
      const mergedLogs = logResponses.flatMap(r => getItemsFromResponse(r?.data));
      const uniqueMap = new Map();
      mergedLogs.forEach(item => uniqueMap.set(item.id_auditoria ?? `${item.timestamp_evento}-${getEvento(item)}`, item));
      const exportLogs = Array.from(uniqueMap.values());

      const exportCriticos = includeIncidents ? getItemsFromResponse(criticosRes?.data || []) : [];

      const rows = exportLogs.map((log) => `
        <tr>
          <td>${formatDate(log.timestamp_evento)}</td>
          <td>${pickFirst(log.id_usuario, log.usuario, 'Sistema')}</td>
          <td>${getIp(log)}</td>
          <td>${getEvento(log)}</td>
          <td>${getModulo(log)}</td>
          <td>${getSeveridad(log)}</td>
          <td>${getResultadoLabel(getResultado(log))}</td>
        </tr>
      `).join('');

      const incidentRows = exportCriticos.map((inc) => `
        <tr>
          <td>${inc.id_auditoria}</td>
          <td>${getEvento(inc)}</td>
          <td>${getModulo(inc)}</td>
          <td>${getSeveridad(inc)}</td>
          <td>${getResultadoLabel(getResultado(inc))}</td>
          <td>${getIp(inc)}</td>
          <td>${formatDate(inc.timestamp_evento)}</td>
        </tr>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8" />
            <title>Reporte Forense de Auditoría</title>
            <style>
              * { box-sizing: border-box; }
              body {
                font-family: Arial, sans-serif;
                color: #1A1510;
                margin: 0;
                padding: 24px;
                background: #fff;
              }
              .header {
                border-bottom: 2px solid #1B4F8A;
                padding-bottom: 16px;
                margin-bottom: 20px;
              }
              .title {
                font-size: 24px;
                font-weight: 700;
                color: #1B4F8A;
                margin-bottom: 4px;
              }
              .subtitle {
                font-size: 12px;
                color: #5A5048;
                margin-top: 4px;
              }
              .grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
                margin: 20px 0;
              }
              .card {
                border: 1px solid #DAD4CC;
                border-radius: 10px;
                padding: 12px;
                background: #FDFAF5;
              }
              .card .label {
                font-size: 11px;
                color: #5A5048;
                text-transform: uppercase;
                font-weight: 700;
                margin-bottom: 6px;
              }
              .card .value {
                font-size: 22px;
                font-weight: 700;
              }
              h2 {
                margin: 24px 0 12px;
                font-size: 16px;
                color: #1A1510;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              th, td {
                border: 1px solid #DAD4CC;
                padding: 8px 10px;
                font-size: 11px;
                text-align: left;
                vertical-align: top;
              }
              th {
                background: #F5F2EC;
                text-transform: uppercase;
                color: #5A5048;
              }
              .note {
                margin-top: 24px;
                padding: 12px 14px;
                border-left: 4px solid #D97706;
                background: #FFF8E8;
                font-size: 11px;
                color: #5A5048;
              }
              .page-break { page-break-before: always; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">Reporte Forense de Auditoría</div>
              <div class="subtitle">MedIA ECE Chiapas · Generado: ${formatDate(new Date().toISOString())}</div>
              <div class="subtitle">Rol exportador: ${userRole || 'NO_IDENTIFICADO'} · Páginas exportadas: ${pages} · Registros incluidos: ${exportLogs.length}</div>
              <div class="subtitle">Trazabilidad legal, bitácora de accesos e incidentes para documentación institucional</div>
            </div>

            <div class="grid">
              <div class="card">
                <div class="label">Eventos hoy</div>
                <div class="value">${Number(exportStats?.eventos_hoy || 0)}</div>
              </div>
              <div class="card">
                <div class="label">Incidentes críticos activos</div>
                <div class="value">${Number(exportStats?.criticos || 0)}</div>
              </div>
              <div class="card">
                <div class="label">Total histórico</div>
                <div class="value">${Number(exportStats?.total || 0)}</div>
              </div>
              <div class="card">
                <div class="label">Tokens bloqueados</div>
                <div class="value">${blacklistCount}</div>
              </div>
            </div>

            <h2>Bitácora de accesos y eventos</h2>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Usuario</th>
                  <th>IP</th>
                  <th>Evento</th>
                  <th>Módulo</th>
                  <th>Severidad</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${rows || `<tr><td colspan="7">Sin registros disponibles</td></tr>`}
              </tbody>
            </table>

            ${includeIncidents ? `
              <div class="page-break"></div>
              <h2>Incidentes críticos activos</h2>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Evento</th>
                    <th>Módulo</th>
                    <th>Severidad</th>
                    <th>Estado</th>
                    <th>IP</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  ${incidentRows || `<tr><td colspan="7">Sin incidentes críticos activos</td></tr>`}
                </tbody>
              </table>
            ` : ''}

            <div class="note">
              Documento generado para soporte institucional. La exportación PDF del módulo de auditoría es un requisito funcional del sistema; los registros se presentan en modo solo lectura para preservar la trazabilidad y la integridad forense.
            </div>

            <script>
              window.onload = function () { window.print(); };
            </script>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank', 'width=1200,height=900');
      if (!printWindow) {
        alert('El navegador bloqueó la ventana de impresión. Permite popups para exportar el PDF.');
        setExportLoading(false);
        return;
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      setExportOpen(false);
    } catch (e) {
      console.error('Error exportando reporte:', e);
      alert('No se pudo generar el reporte PDF de auditoría');
    } finally {
      setExportLoading(false);
    }
  }, [token, userRole, blacklistCount]);

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: C.bg,
      minHeight: "100vh",
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <style>{`
        @keyframes pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.04); }
        }
      `}</style>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={exportAuditReport}
        loading={exportLoading}
      />

      {logSeleccionado && (
        <DetalleModal
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

      <div style={{
        padding: "14px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${C.bd}`,
        background: C.sf
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.th, letterSpacing: -0.3 }}>
            Auditoría Forense
          </div>
          <div style={{ fontSize: 12, color: C.ts, marginTop: 1 }}>
            Trazabilidad legal, incidentes críticos y control de sesiones · NOM-151
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setExportOpen(true)}
            style={{
              background: C.b500,
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer"
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
              HISTÓRICO DE INCIDENTES
              <ShieldAlert
                size={14}
                style={criticosActivos > 0 ? { animation: "pulse 1.5s ease-in-out infinite" } : {}}
              />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: criticosActivos > 0 ? C.r500 : C.th }}>
              {criticosActivos}
            </div>
            <div style={{ fontSize: 10, color: criticosActivos > 0 ? C.r600 : C.tm, marginTop: 4 }}>
              Clic para revisar incidentes críticos activos →
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
            <div style={{ fontSize: 28, fontWeight: 700, color: C.th }}>{totalHistorico}</div>
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
                const activo = critico && isActivo(log);

                return (
                  <tr
                    key={log.id_auditoria || i}
                    style={{
                      borderBottom: `1px solid ${C.bd}`,
                      background: activo ? '#FFF8F8' : 'transparent'
                    }}
                  >
                    <td style={{ padding: "14px 20px", fontSize: 11, color: C.ts }}>
                      {formatDate(log.timestamp_evento)}
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
                        <Bdg v={badgeResultado(resultado)}>{getResultadoLabel(resultado)}</Bdg>

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

                        {critico && activo && (
                          <span style={{
                            fontSize: 10,
                            color: C.r600,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
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
              disabled={logs.length < limit}
              onClick={() => setPage(p => p + 1)}
              style={{
                padding: "6px 14px",
                borderRadius: 7,
                border: `1px solid ${C.bd}`,
                background: C.sf,
                fontSize: 12,
                cursor: logs.length < limit ? "default" : "pointer",
                opacity: logs.length < limit ? 0.4 : 1
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
