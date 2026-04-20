import React from 'react';
import { ShieldX, Eye, ShieldCheck, AlertTriangle, Clock } from 'lucide-react';

/* ─────────────────────────────────────────────
   TOKENS & ESTILOS (Sincronizados con MedSys)
───────────────────────────────────────────── */
const C = {
  b500: "#2459A8", b600: "#1A4080",
  r50: "#FEF0F3", r500: "#BA2E45", r600: "#901F33",
  bg: "#EDEBE6", sf: "#F5F2EC", cd: "#FDFAF5",
  bd: "#DAD4CC", th: "#1A1510", ts: "#5A5048", tm: "#877E74", td: "#A9A097"
};

const IncidentesPage = () => {
  return (
    <div style={{ 
      flex: 1, 
      display: "flex", 
      flexDirection: "column", 
      background: C.bg, 
      minHeight: "100vh", 
      fontFamily: "'DM Sans', sans-serif" 
    }}>
      
      {/* Header Estilo MedIA */}
      <div style={{ 
        padding: "14px 28px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        borderBottom: `1px solid ${C.bd}`, 
        background: C.sf 
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.th, letterSpacing: -.3 }}>Gestión de Incidentes de Seguridad</div>
          <div style={{ fontSize: 12, color: C.ts, marginTop: 1 }}>Panel de respuesta inmediata · Solo SUPERADMIN</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ 
            padding: "4px 12px", 
            borderRadius: 99, 
            background: C.r50, 
            color: C.r600, 
            fontSize: 11, 
            fontWeight: 700, 
            border: `1px solid ${C.r500}` 
          }} className="animate-pulse">
            1 CRÍTICO ACTIVO
          </span>
        </div>
      </div>

      <div style={{ padding: "22px 28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Card de Incidente Crítico Corregida */}
          <div style={{ 
            background: C.cd, 
            border: `1px solid ${C.bd}`, 
            borderLeft: `5px solid #DC2626`, // Rojo Crítico Normativo
            borderRadius: "0 12px 12px 0", 
            padding: "18px 20px",
            boxShadow: "0 4px 12px rgba(186,46,69,0.12)"
          }} className="view">
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ 
                  width: 42, height: 42, borderRadius: 10, 
                  background: "#DC2626", color: "#fff", 
                  display: "flex", alignItems: "center", justifyContent: "center" 
                }}>
                  <ShieldX size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.th, marginBottom: 2 }}>Intento de Inyección SQL Detectado</h3>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: C.td, fontWeight: 600 }}>ID: INC-9923</span>
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.td }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", textTransform: "uppercase" }}>Severidad: CRÍTICO</span>
                  </div>
                </div>
              </div>

              {/* Badge Parpadeante Normativo */}
              <span style={{ 
                display: "flex", alignItems: "center", gap: 6, 
                background: "#DC2626", color: "#fff", 
                fontSize: 10, fontWeight: 800, 
                padding: "4px 10px", borderRadius: 6 
              }} className="animate-pulse">
                <Clock size={12} /> ABIERTO / SIN ATENDER
              </span>
            </div>

            <p style={{ fontSize: 13, color: C.ts, lineHeight: 1.6, marginBottom: 18, background: "#F1F5F9", padding: "10px", borderRadius: 8, border: "1px dashed #CBD5E1" }}>
              Se detectaron caracteres maliciosos (`OR 1=1`) en el cuerpo de la petición del endpoint <code style={{ color: "#DC2626", fontWeight: 600 }}>/api/v1/prescripciones</code>. 
              <br/>IP de origen: <span style={{ fontWeight: 600 }}>189.240.x.x (Tuxtla Gtz, Chiapas)</span>
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.bd}`, pt: 16, marginTop: 10, paddingTop: 14 }}>
              <div style={{ fontSize: 11, color: C.tm, display: "flex", alignItems: "center", gap: 5 }}>
                <AlertTriangle size={14} color="#D97706" /> Origen: Firewall de Aplicación (WAF)
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={{ 
                  background: "transparent", border: `1.5px solid ${C.bd}`, 
                  color: C.th, padding: "7px 14px", borderRadius: 8, 
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6
                }}>
                  <Eye size={14} /> Ver Timeline completo
                </button>
                <button style={{ 
                  background: "#1B4F8A", border: "none", 
                  color: "#fff", padding: "7px 18px", borderRadius: 8, 
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(27,79,138,0.3)",
                  display: "flex", alignItems: "center", gap: 6
                }}>
                  <ShieldCheck size={14} /> Atender e Investigar
                </button>
              </div>
            </div>
          </div>

          {/* Incidente Secundario (Ejemplo de contraste) */}
          <div style={{ 
            background: C.cd, border: `1px solid ${C.bd}`, 
            borderLeft: `5px solid #D97706`, // Ámbar Advertencia
            borderRadius: "0 12px 12px 0", 
            padding: "14px 20px",
            opacity: 0.8
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <AlertTriangle size={20} color="#D97706" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.th }}>Sesión de usuario inusual</div>
                  <div style={{ fontSize: 11, color: C.tm }}>INC-9910 · Nivel: MEDIO · Hace 2 horas</div>
                </div>
              </div>
              <button style={{ fontSize: 12, fontWeight: 600, color: C.b500, background: "none", border: "none", cursor: "pointer" }}>Revisar</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IncidentesPage;