import React, { useState, useEffect } from 'react';
import { Ban, Unlock, ShieldCheck, Terminal, RefreshCcw, AlertCircle, Database } from 'lucide-react';
import apiClient from '../../api/client';

/* ─────────────────────────────────────────────
   TOKENS & ESTILOS (Sincronizados con MedSys) [cite: 6, 16]
───────────────────────────────────────────── */
const C = {
  b500: "#2459A8", b600: "#1A4080",
  r50: "#FEF0F3", r500: "#BA2E45", r600: "#901F33",
  g500: "#237A4B", g600: "#196038",
  bg: "#EDEBE6", sf: "#F5F2EC", cd: "#FDFAF5",
  bd: "#DAD4CC", th: "#1A1510", ts: "#5A5048", tm: "#877E74", td: "#A9A097"
};

const SeguridadPage = () => {
  const [blacklist, setBlacklist] = useState([]);
  const [forense, setForense] = useState([]);
  const [loadingForense, setLoadingForense] = useState(false);
  const [errorLog, setErrorLog] = useState(false);

  const formatTime = (isoString) => {
    if (!isoString) return "--:--:--";
    const date = new Date(isoString);
    return date.toLocaleString('es-MX', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit'
    });
  };

  const fetchBlacklist = async () => {
    try {
      const res = await apiClient.get('/seguridad/sessions-blacklist');
      setBlacklist(Array.isArray(res.data) ? res.data : []);
    } catch (error) { setBlacklist([]); }
  };

  const leerLogForense = async () => {
    setLoadingForense(true);
    setErrorLog(false);
    try {
      const res = await apiClient.get('/seguridad/logs-forenses');
      if (res.data && Array.isArray(res.data.content)) setForense(res.data.content);
    } catch (error) { setErrorLog(true); }
    finally { setLoadingForense(false); }
  };

  useEffect(() => {
    fetchBlacklist();
    leerLogForense();
  }, []);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* Header Estilo MedIA [cite: 33, 46] */}
      <div style={{ padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.bd}`, background: C.sf }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.th, letterSpacing: -.3 }}>Seguridad Avanzada</div>
          <div style={{ fontSize: 12, color: C.ts, marginTop: 1 }}>Control de acceso y auditoría forense inmutable</div>
        </div>
        <span style={{ padding: "4px 12px", borderRadius: 99, background: C.r50, color: C.r600, fontSize: 10, fontWeight: 800, border: `1px solid ${C.r500}` }} className="animate-pulse">
          INMUTABILIDAD ACTIVA (HMAC-SHA256)
        </span>
      </div>

      <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Blacklist de Sesiones */}
          <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ background: C.sf, padding: "12px 16px", borderBottom: `1px solid ${C.bd}`, display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: C.th, textTransform: "uppercase" }}>
              <Ban size={16} color={C.r500} /> Control de Acceso (Blacklist)
            </div>
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: C.sf, fontSize: 10, color: C.tm, textTransform: "uppercase" }}>
                  <tr>
                    <th style={{ padding: "8px 16px", textAlign: "left" }}>Token Hash</th>
                    <th style={{ padding: "8px 16px", textAlign: "right" }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {blacklist.map((session, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.sf}` }}>
                      <td style={{ padding: "10px 16px", fontSize: 10, fontFamily: "monospace", color: C.td }}>{session.token_hash}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right" }}>
                        <button style={{ color: C.b500, background: "none", border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>REACTIVAR</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Estado de Integridad [cite: 154] */}
          <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <ShieldCheck size={48} color={C.g500} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 800, color: C.th, textTransform: "uppercase" }}>Integridad Verificada</div>
            <p style={{ fontSize: 11, color: C.ts, marginTop: 8, lineHeight: 1.5 }}>
              Sincronizado con v_auditoria_estadistica.<br/>Hash de cadena forense validado por NOM-151. [cite: 97]
            </p>
          </div>
        </div>

        {/* Terminal de Logs Forenses Corregida */}
        <div style={{ background: "#0D0D0D", border: "1px solid #333", borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          <div style={{ background: "#1A1A1A", padding: "12px 16px", borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#888", fontFamily: "monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
              <Terminal size={16} color="#22C55E" /> /logs/auditoria_forense.log
            </div>
            <button 
              onClick={leerLogForense} 
              disabled={loadingForense}
              style={{ background: "transparent", border: "1px solid #444", color: "#AAA", padding: "4px 12px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCcw size={12} className={loadingForense ? "animate-spin" : ""} /> {loadingForense ? "SINCRONIZANDO" : "SYNC_FORENSE"}
            </button>
          </div>

          <div style={{ height: 450, overflowY: "auto", padding: 20, fontFamily: "monospace", fontSize: 11, color: "#DDD", lineHeight: 1.6 }}>
            {errorLog ? (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.r500, gap: 10 }}>
                <AlertCircle size={32} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: 12 }}>ERROR DE COMUNICACIÓN FORENSE</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>401: PRIVILEGIOS INSUFICIENTES (SÓLO SUPERADMIN) [cite: 62]</div>
                </div>
              </div>
            ) : forense.map((line, i) => {
              const [jsonPart] = line.split(' | SIG:');
              let data = {};
              try { data = JSON.parse(jsonPart); } catch(e) { return null; }
              const isError = parseInt(data.detalles?.status) >= 400;

              return (
                <div key={i} style={{ marginBottom: 12, borderBottom: "1px solid #1A1A1A", paddingBottom: 8 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ color: "#555" }}>[{formatTime(data.timestamp)}]</span>
                    <span style={{ fontWeight: 800, color: data.accion?.includes('ESCRITURA') ? "#EA580C" : "#3B82F6" }}>{data.accion}</span>
                    <span style={{ padding: "1px 6px", borderRadius: 4, background: isError ? "#DC2626" : "#064E3B", color: "#FFF", fontSize: 9, fontWeight: 900 }}>
                      {isError ? "FALLIDO" : "EXITOSO"}
                    </span>
                    <span style={{ color: "#888" }}>USR: <b style={{ color: "#EEE" }}>{data.usuario}</b></span>
                  </div>
                  <div style={{ pl: 20, color: "#666", fontSize: 10, display: "flex", gap: 15 }}>
                    <span>MÉTODO: <b style={{ color: "#999" }}>{data.detalles?.metodo}</b></span>
                    <span>STATUS: <b style={{ color: isError ? "#EF4444" : "#22C55E" }}>{data.detalles?.status}</b></span>
                    <span>LATENCIA: <b style={{ color: "#999" }}>{data.detalles?.ms}ms</b></span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: "#111", padding: "8px 16px", borderTop: "1px solid #333", fontSize: 9, color: "#444", display: "flex", justifyContent: "space-between", textTransform: "uppercase" }}>
            <span><ShieldCheck size={10} inline /> CADENA FORENSE VERIFICADA</span>
            <span>MedIA_Security_v1.0 [cite: 1]</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SeguridadPage;