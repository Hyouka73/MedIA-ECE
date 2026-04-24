import React, { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, ShieldX, MapPin, Search, CheckCircle2, Archive } from 'lucide-react';
import apiClient from '../../../api/client';
import { 
  C, 
  getItemsFromResponse, 
  getResultado, 
  estadoColor, 
  getEvento, 
  getModulo, 
  badgeResultado, 
  getResultadoLabel, 
  getIp, 
  formatDate, 
  canTransition, 
  Bdg, 
  ActionBtn 
} from '../../../utils/auditoria.utils';

const IncidentesDrawer = ({ open, onClose, token, refreshKey, userRole, onIncidentUpdated }) => {
  const [incidentes, setIncidentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  
  // Dependiendo de tu implementación exacta, ajustamos si exportas normalize desde utils
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
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 8000,
          opacity: open ? 1 : 0, pointerEvents: open ? "all" : "none", transition: "opacity 0.3s ease"
        }}
      />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 560, maxWidth: "95vw",
        background: C.bg, boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", zIndex: 8001,
        transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex", flexDirection: "column", overflowY: "auto"
      }}>
        <div style={{
          padding: "16px 22px", borderBottom: `1px solid ${C.bd}`, background: C.sf,
          display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 1
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.th }}>Histórico de Incidentes</div>
            <div style={{ fontSize: 11, color: C.ts, marginTop: 2 }}>Incidentes críticos activos consultados en múltiples páginas</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={fetchIncidentes}
              style={{
                background: "none", border: `1px solid ${C.bd}`, borderRadius: 7, padding: "5px 10px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.ts
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
          <div style={{ background: "#EEF3FB", border: "1px solid #C8D6EC", borderRadius: 10, padding: "12px 14px", fontSize: 11, color: C.ts }}>
            “Investigar” mueve el incidente a <strong>EN INVESTIGACIÓN</strong>, lo que representa la fase de contención y análisis técnico del evento.
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: C.td }}>Cargando histórico de incidentes...</div>
          ) : incidentes.length === 0 ? (
            <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 32, textAlign: "center", color: C.td }}>
              Sin incidentes críticos activos en el histórico consultado
            </div>
          ) : (
            incidentes.map((inc) => {
              const detalles = inc.detalles || {};
              const resultado = getResultado(inc);
              const borderColor = estadoColor(resultado);

              return (
                <div key={inc.id_auditoria} style={{ background: C.cd, border: `1px solid ${C.bd}`, borderLeft: `5px solid ${borderColor}`, borderRadius: "0 10px 10px 0", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 10 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: borderColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <ShieldX size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.th }}>{getEvento(inc)}</div>
                        <div style={{ fontSize: 10, color: C.tm }}>Módulo: {getModulo(inc)}</div>
                      </div>
                    </div>
                    <Bdg v={badgeResultado(resultado)}>{getResultadoLabel(resultado)}</Bdg>
                  </div>

                  <div style={{ background: "#F8FAFC", borderRadius: 7, padding: "10px 12px", marginBottom: 12, fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
                    {detalles.alerta ? (
                      <div style={{ fontWeight: 700, color: C.r600, marginBottom: 4 }}>⚠️ {detalles.alerta}</div>
                    ) : (
                      <div>Evento crítico registrado por el sistema de auditoría.</div>
                    )}
                    <div style={{ marginTop: 6, display: "flex", gap: 12, fontSize: 11, color: C.ts, flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} /> {getIp(inc)}</span>
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

export default IncidentesDrawer;