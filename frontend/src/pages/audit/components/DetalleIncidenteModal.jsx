import React from 'react';
import { X, Search, CheckCircle2, Archive } from 'lucide-react';
import { 
  C, 
  getResultado, 
  esCritico, 
  getSeveridad, 
  badgeResultado, 
  getResultadoLabel, 
  isActivo, 
  getEvento, 
  getModulo, 
  pickFirst, 
  getIp, 
  formatDate, 
  safeJson, 
  canTransition, 
  Bdg, 
  ActionBtn 
} from '../../../utils/auditoria.utils';

const DetalleIncidenteModal = ({ log, onClose, onUpdateEstado, canManage, updatingEstado }) => {
  if (!log) return null;

  const detalles = log.detalles || {};
  const resultado = getResultado(log);
  const critico = esCritico(log);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
    }}>
      <div style={{
        background: C.cd, borderRadius: 14, width: 680, maxWidth: "95vw",
        maxHeight: "90vh", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        overflow: "hidden", display: "flex", flexDirection: "column"
      }}>
        <div style={{
          padding: "16px 24px", borderBottom: `1px solid ${C.bd}`, display: "flex",
          justifyContent: "space-between", alignItems: "center", background: critico ? "#FEF0F3" : C.sf
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
                <div style={{ fontSize: 10, fontWeight: 700, color: C.tm, textTransform: "uppercase", marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.th, wordBreak: 'break-word' }}>{val}</div>
              </div>
            ))}
          </div>

          {Object.keys(detalles).length > 0 && (
            <div style={{ background: "#F1F5F9", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.tm, textTransform: "uppercase", marginBottom: 8 }}>
                Información del incidente
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {detalles.alerta && (
                  <div style={{ fontSize: 13, color: C.r600, fontWeight: 700 }}>⚠️ {detalles.alerta}</div>
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
            background: '#FFF8E8', border: '1px solid #F3D9A8', borderRadius: 8,
            padding: '12px 14px', fontSize: 12, color: C.ts
          }}>
            <strong>¿Qué hace “Investigar”?</strong> Cambia el incidente de <strong>ABIERTO</strong> a <strong>EN INVESTIGACIÓN</strong>. Eso indica que ya entró a seguimiento formal, se documentan acciones de contención y se analiza causa raíz antes de erradicar o cerrar.
          </div>

          <div style={{ fontSize: 11, color: C.tm, fontStyle: "italic" }}>
            Ref. Normativa: NOM-024-SSA3-2012 / NOM-151-SCFI-2016
          </div>
        </div>

        <div style={{
          padding: "14px 24px", borderTop: `1px solid ${C.bd}`, display: "flex",
          justifyContent: "space-between", gap: 10, background: C.sf, flexWrap: "wrap"
        }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: `1px solid ${C.bd}`, color: C.th,
              padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer"
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

export default DetalleIncidenteModal;