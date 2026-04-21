import React from 'react';
import { ShieldX, Eye, ShieldCheck, AlertTriangle, Clock, MapPin } from 'lucide-react';

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
      
      {/* Header de Seguridad */}
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
          <div style={{ fontSize: 12, color: C.ts, marginTop: 1 }}>Panel de respuesta inmediata · Solo Nivel Administrativo</div>
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
          }}>
            1 EVENTO CRÍTICO DETECTADO
          </span>
        </div>
      </div>

      <div style={{ padding: "22px 28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Tarjeta de Incidente: Bloqueo de Alergia (Sincronizado con el Backend) */}
          <div style={{ 
            background: C.cd, 
            border: `1px solid ${C.bd}`, 
            borderLeft: `6px solid #DC2626`, 
            borderRadius: "0 12px 12px 0", 
            padding: "20px",
            boxShadow: "0 4px 12px rgba(186,46,69,0.08)"
          }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ 
                  width: 44, height: 44, borderRadius: 10, 
                  background: "#DC2626", color: "#fff", 
                  display: "flex", alignItems: "center", justifyContent: "center" 
                }}>
                  <ShieldX size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: C.th, marginBottom: 2 }}>Bloqueo de Seguridad: Riesgo Clínico</h3>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#DC2626", textTransform: "uppercase", letterSpacing: 0.5 }}>EVENTO: INTENTO_RIESGO_ALERGIA</span>
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.td }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.ts }}>Módulo: CLINICO_PRESCIPCION</span>
                  </div>
                </div>
              </div>

              <span style={{ 
                display: "flex", alignItems: "center", gap: 6, 
                background: "#FEE2E2", color: "#991B1B", 
                fontSize: 10, fontWeight: 800, 
                padding: "4px 10px", borderRadius: 6, border: "1px solid #F87171"
              }}>
                <Clock size={12} /> PENDIENTE DE REVISIÓN
              </span>
            </div>

            <div style={{ 
              fontSize: 13, color: "#334155", lineHeight: 1.6, marginBottom: 20, 
              background: "#F8FAFC", padding: "12px", borderRadius: 8, border: "1px solid #E2E8F0" 
            }}>
              <strong>Descripción:</strong> Se ha bloqueado automáticamente una orden médica debido a una coincidencia exacta en el catálogo de alergias críticas del paciente. El sistema impidió la generación del folio de receta para evitar una reacción adversa grave.
              <div style={{ marginTop: 8, display: "flex", gap: 15, fontSize: 11, color: C.ts }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> IP Origen: 127.0.0.1</span>
                <span>Severidad: <span style={{color: "#DC2626", fontWeight: 700}}>CRÍTICA</span></span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.bd}`, paddingTop: 16 }}>
              <div style={{ fontSize: 11, color: C.tm, fontStyle: "italic" }}>
                Referencia Normativa: NOM-024-SSA3-2012 / Seguridad del Paciente
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={{ 
                  background: "transparent", border: `1px solid ${C.bd}`, 
                  color: C.th, padding: "8px 16px", borderRadius: 8, 
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6
                }}>
                  <Eye size={14} /> Detalles Forenses
                </button>
                <button style={{ 
                  background: C.b600, border: "none", 
                  color: "#fff", padding: "8px 20px", borderRadius: 8, 
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6
                }}>
                  <ShieldCheck size={14} /> Archivar Incidente
                </button>
              </div>
            </div>
          </div>

          {/* Tarjeta Informativa: Auditoría de Acceso */}
          <div style={{ 
            background: C.cd, border: `1px solid ${C.bd}`, 
            borderLeft: `5px solid #D97706`, 
            borderRadius: "0 12px 12px 0", 
            padding: "14px 20px",
            opacity: 0.9
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <AlertTriangle size={20} color="#D97706" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.th }}>Verificación de Integridad de Bitácora</div>
                  <div style={{ fontSize: 11, color: C.tm }}>Último chequeo: Hace 5 minutos · Estatus: ÍNTEGRO (NOM-151)</div>
                </div>
              </div>
              <button style={{ fontSize: 12, fontWeight: 700, color: C.b500, background: "none", border: "none", cursor: "pointer" }}>Ejecutar Validador</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IncidentesPage;