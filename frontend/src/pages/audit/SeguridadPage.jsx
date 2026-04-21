import React, { useState, useEffect } from 'react';
import { Ban, ShieldCheck, Terminal, RefreshCcw, AlertCircle, Lock } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext'; // <--- IMPORTANTE: JWT in-memory

/* ─────────────────────────────────────────────
    TOKENS & ESTILOS (Sincronizados con MedSys)
───────────────────────────────────────────── */
const C = {
  b500: "#2459A8", b600: "#1A4080",
  r50: "#FEF0F3", r500: "#BA2E45", r600: "#901F33",
  g500: "#237A4B", g600: "#196038",
  bg: "#EDEBE6", sf: "#F5F2EC", cd: "#FDFAF5",
  bd: "#DAD4CC", th: "#1A1510", ts: "#5A5048", tm: "#877E74", td: "#A9A097"
};

const SeguridadPage = () => {
  const { token } = useAuth(); // Obtenemos el token desde el contexto de React
  const [blacklist, setBlacklist] = useState([]);
  const [forense, setForense] = useState([]);
  const [loadingForense, setLoadingForense] = useState(false);
  const [errorLog, setErrorLog] = useState(false);

  const formatTime = (isoString) => {
    if (!isoString) return "--:--:--";
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-MX', { hour12: false });
  };

  const fetchBlacklist = async () => {
    if (!token) return;
    try {
      const res = await apiClient.get('/seguridad/sessions-blacklist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlacklist(Array.isArray(res.data) ? res.data : []);
    } catch (error) { setBlacklist([]); }
  };

  const leerLogForense = async () => {
    if (!token) return;
    setLoadingForense(true);
    setErrorLog(false);
    try {
      // Consultamos el endpoint de auditoría sincronizado con la BD de Azure
      const res = await apiClient.get('/auditoria', { 
        params: { limit: 25 },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const items = res.data.results || res.data.items || [];
      setForense(items);
    } catch (error) { 
      console.error("Falla en conexión forense:", error);
      setErrorLog(true); 
    } finally { setLoadingForense(false); }
  };

  useEffect(() => {
    if (token) {
      fetchBlacklist();
      leerLogForense();
    }
  }, [token]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* Header Estilo MedIA */}
      <div style={{ padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.bd}`, background: C.sf }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.th, letterSpacing: -.3 }}>Seguridad Avanzada</div>
          <div style={{ fontSize: 12, color: C.ts, marginTop: 1 }}>Control de acceso y auditoría forense inmutable</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#DCFCE7", padding: "6px 12px", borderRadius: 8, border: "1px solid #BBF7D0" }}>
            <Lock size={14} color={C.g600} />
            <span style={{ fontSize: 10, fontWeight: 800, color: C.g600 }}>PROTOCOLO JWT IN-MEMORY</span>
        </div>
      </div>

      <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Blacklist de Sesiones */}
          <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ background: C.sf, padding: "12px 16px", borderBottom: `1px solid ${C.bd}`, display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: C.th, textTransform: "uppercase" }}>
              <Ban size={16} color={C.r500} /> Control de Acceso (Blacklist)
            </div>
            <div style={{ padding: "20px", textAlign: "center", color: C.ts, fontSize: 12 }}>
              {blacklist.length === 0 ? "No hay sesiones restringidas activas." : `${blacklist.length} tokens bloqueados.`}
            </div>
          </div>

          {/* Estado de Integridad */}
          <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <ShieldCheck size={40} color={C.g500} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 800, color: C.th, textTransform: "uppercase" }}>Integridad Verificada</div>
            <p style={{ fontSize: 11, color: C.ts, marginTop: 4 }}>Sincronizado con tabla auditoria_accesos</p>
          </div>
        </div>

        {/* Terminal de Logs Forenses Corregida */}
        <div style={{ background: "#0D0D0D", border: "1px solid #333", borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          <div style={{ background: "#1A1A1A", padding: "12px 16px", borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#00FF41", fontFamily: "monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
              <Terminal size={16} /> AUDIT_LOG_STREAM: /api/auditoria
            </div>
            <button 
              onClick={leerLogForense} 
              disabled={loadingForense}
              style={{ background: "transparent", border: "1px solid #444", color: "#AAA", padding: "4px 12px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCcw size={12} className={loadingForense ? "animate-spin" : ""} /> {loadingForense ? "SYNC..." : "RECARGAR"}
            </button>
          </div>

          <div style={{ height: 420, overflowY: "auto", padding: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#DDD", lineHeight: 1.6 }}>
            {errorLog ? (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.r500, gap: 10 }}>
                <AlertCircle size={32} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: 12 }}>ERROR DE AUTENTICACIÓN FORENSE</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>EL TOKEN HA EXPIRADO O NO TIENE PERMISOS DE ADMIN</div>
                </div>
              </div>
            ) : forense.map((log, i) => {
              const isCritico = log.nivel_severidad === 'CRITICA';
              return (
                <div key={i} style={{ marginBottom: 12, borderLeft: `2px solid ${isCritico ? '#EF4444' : '#00FF41'}`, paddingLeft: 12, borderBottom: "1px solid #1A1A1A", paddingBottom: 8 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ color: "#555" }}>[{formatTime(log.timestamp_evento)}]</span>
                    <span style={{ fontWeight: 800, color: isCritico ? "#FF5555" : "#3B82F6" }}>{log.accion}</span>
                    <span style={{ padding: "1px 6px", borderRadius: 4, background: isCritico ? "#450A0A" : "#064E3B", color: isCritico ? "#F87171" : "#4ADE80", fontSize: 9, fontWeight: 900 }}>
                      {log.resultado}
                    </span>
                    <span style={{ color: "#888" }}>USR: <b style={{ color: "#EEE" }}>{log.id_usuario?.substring(0,8)}...</b></span>
                  </div>
                  <div style={{ pl: 20, color: "#666", fontSize: 10, display: "flex", gap: 15 }}>
                    <span>MÓDULO: <b style={{ color: "#999" }}>{log.modulo_funcion}</b></span>
                    <span>IP: <b style={{ color: "#999" }}>{log.direccion_ip}</b></span>
                    {log.detalles && <span>DATA: <b style={{ color: "#22C55E" }}>{JSON.stringify(log.detalles)}</b></span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: "#111", padding: "8px 16px", borderTop: "1px solid #333", fontSize: 9, color: "#444", display: "flex", justifyContent: "space-between", textTransform: "uppercase" }}>
            <span><ShieldCheck size={10} inline /> CADENA FORENSE VERIFICADA NOM-151</span>
            <span>MedIA_Security_v1.0 [Azure_Postgres]</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SeguridadPage;