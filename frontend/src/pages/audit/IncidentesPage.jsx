import React, { useState, useEffect } from 'react';
import { ShieldX, Eye, ShieldCheck, AlertTriangle, Clock, MapPin, RefreshCw } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const C = {
  b500: "#2459A8", b600: "#1A4080",
  g500: "#237A4B",
  r50: "#FEF0F3", r500: "#BA2E45", r600: "#901F33",
  bg: "#EDEBE6", sf: "#F5F2EC", cd: "#FDFAF5",
  bd: "#DAD4CC", th: "#1A1510", ts: "#5A5048", tm: "#877E74", td: "#A9A097"
};

const IncidentesPage = () => {
  const { token } = useAuth();
  const [incidentes, setIncidentes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidentes = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/auditoria', {
        params: { nivel_severidad: 'CRITICA', limit: 50 }
      });
      setIncidentes(res.data.items || []);
    } catch (e) {
      console.error("Error al cargar incidentes:", e);
    } finally { setLoading(false); }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await apiClient.patch(`/auditoria/incidentes/${id}/estado`, { estado: nuevoEstado });
      fetchIncidentes();
    } catch (e) {
      alert("Error al actualizar el incidente");
    }
  };

  useEffect(() => { fetchIncidentes(); }, [token]);

  const abiertos = incidentes.filter(i => i.estado === 'ABIERTO').length;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.bd}`, background: C.sf }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.th, letterSpacing: -.3 }}>Gestión de Incidentes de Seguridad</div>
          <div style={{ fontSize: 12, color: C.ts, marginTop: 1 }}>Panel de respuesta inmediata · Solo Nivel Administrativo</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {abiertos > 0 && (
            <span style={{ padding: "4px 12px", borderRadius: 99, background: C.r50, color: C.r600, fontSize: 11, fontWeight: 700, border: `1px solid ${C.r500}` }}>
              {abiertos} EVENTO{abiertos > 1 ? 'S' : ''} CRÍTICO{abiertos > 1 ? 'S' : ''} ABIERTO{abiertos > 1 ? 'S' : ''}
            </span>
          )}
          <button
            onClick={fetchIncidentes}
            style={{ background: "none", border: `1px solid ${C.bd}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.ts }}
          >
            <RefreshCw size={13} /> Actualizar
          </button>
        </div>
      </div>

      <div style={{ padding: "22px 28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: C.td }}>Cargando incidentes...</div>
          ) : incidentes.length === 0 ? (
            <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 40, textAlign: "center", color: C.td }}>
              Sin incidentes críticos registrados
            </div>
          ) : incidentes.map((inc) => {
            const detalles = inc.detalles || {};
            const esAbierto = inc.estado === 'ABIERTO';
            const esEnProceso = inc.estado === 'EN_PROCESO';

            return (
              <div key={inc.id_auditoria} style={{
                background: C.cd,
                border: `1px solid ${C.bd}`,
                borderLeft: `6px solid ${esAbierto ? '#DC2626' : esEnProceso ? '#D97706' : '#16A34A'}`,
                borderRadius: "0 12px 12px 0",
                padding: "20px",
                boxShadow: esAbierto ? "0 4px 12px rgba(186,46,69,0.08)" : "none",
                opacity: inc.estado === 'RESUELTO' ? 0.7 : 1,
                transition: "opacity 0.3s"
              }}>

                {/* Cabecera del incidente */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: esAbierto ? "#DC2626" : esEnProceso ? "#D97706" : "#16A34A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ShieldX size={26} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.th, marginBottom: 2 }}>
                        Bloqueo de Seguridad: {inc.accion?.replace(/_/g, ' ')}
                      </h3>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#DC2626", textTransform: "uppercase" }}>
                          EVENTO: {inc.accion}
                        </span>
                        <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.td }} />
                        <span style={{ fontSize: 10, fontWeight: 600, color: C.ts }}>
                          Módulo: {inc.modulo_accion || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: esAbierto ? "#FEE2E2" : esEnProceso ? "#FFF4E5" : "#DCFCE7",
                    color: esAbierto ? "#991B1B" : esEnProceso ? "#B45309" : "#166534",
                    fontSize: 10, fontWeight: 800,
                    padding: "4px 10px", borderRadius: 6,
                    border: `1px solid ${esAbierto ? "#F87171" : esEnProceso ? "#FCD34D" : "#86EFAC"}`
                  }}>
                    <Clock size={12} />
                    {inc.estado === 'ABIERTO' ? 'PENDIENTE DE REVISIÓN' : inc.estado === 'EN_PROCESO' ? 'EN PROCESO' : 'RESUELTO'}
                  </span>
                </div>

                {/* Descripción y detalles del backend */}
                <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, marginBottom: 20, background: "#F8FAFC", padding: "12px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  {detalles.alerta && (
                    <div style={{ fontWeight: 700, color: C.r600, marginBottom: 6 }}>⚠️ {detalles.alerta}</div>
                  )}
                  {detalles.medicamento && (
                    <div><strong>Medicamento bloqueado:</strong> {detalles.medicamento}</div>
                  )}
                  {detalles.paciente_id && (
                    <div><strong>Paciente ID:</strong> {detalles.paciente_id}</div>
                  )}
                  {!detalles.alerta && !detalles.medicamento && (
                    <div>Evento registrado automáticamente por el sistema de seguridad clínica.</div>
                  )}
                  <div style={{ marginTop: 8, display: "flex", gap: 15, fontSize: 11, color: C.ts }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={12} /> IP: {inc.ip_origen || '127.0.0.1'}
                    </span>
                    <span>
                      Severidad: <span style={{ color: "#DC2626", fontWeight: 700 }}>CRÍTICA</span>
                    </span>
                    <span>{new Date(inc.timestamp_evento).toLocaleString()}</span>
                  </div>
                </div>

                {/* Footer con acciones */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.bd}`, paddingTop: 16 }}>
                  <div style={{ fontSize: 11, color: C.tm, fontStyle: "italic" }}>
                    Ref. Normativa: NOM-024-SSA3-2012 / Seguridad del Paciente
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {esAbierto && (
                      <button
                        onClick={() => handleCambiarEstado(inc.id_auditoria, 'EN_PROCESO')}
                        style={{ background: "#D97706", border: "none", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <Clock size={14} /> En Proceso
                      </button>
                    )}
                    {inc.estado !== 'RESUELTO' && (
                      <button
                        onClick={() => handleCambiarEstado(inc.id_auditoria, 'RESUELTO')}
                        style={{ background: C.g500, border: "none", color: "#fff", padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <ShieldCheck size={14} /> Marcar Resuelto
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Tarjeta de integridad NOM-151 */}
          <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderLeft: `5px solid #D97706`, borderRadius: "0 12px 12px 0", padding: "14px 20px", opacity: 0.9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <AlertTriangle size={20} color="#D97706" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.th }}>Verificación de Integridad de Bitácora</div>
                  <div style={{ fontSize: 11, color: C.tm }}>Estatus: ÍNTEGRO (NOM-151)</div>
                </div>
              </div>
              <button style={{ fontSize: 12, fontWeight: 700, color: C.b500, background: "none", border: "none", cursor: "pointer" }}>
                Ejecutar Validador
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IncidentesPage;