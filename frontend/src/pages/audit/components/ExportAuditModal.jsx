import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { C } from '../../../utils/auditoria.utils';

const ExportAuditModal = ({ open, onClose, onExport, loading }) => {
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
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9500
    }}>
      <div style={{
        width: 480, maxWidth: '95vw', background: C.cd,
        borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          padding: '16px 22px', borderBottom: `1px solid ${C.bd}`, background: C.sf,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.th }}>Exportar reporte PDF</div>
            <div style={{ fontSize: 11, color: C.ts, marginTop: 2 }}>Selecciona el alcance del reporte forense</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.tm }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: '#EEF3FB', border: '1px solid #C8D6EC', borderRadius: 10,
            padding: '12px 14px', fontSize: 12, color: C.ts
          }}>
            La vista de auditoría es paginada, por eso aquí eliges cuántas páginas incluir en el PDF.
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.th, marginBottom: 8 }}>
              Páginas de bitácora a exportar
            </label>
            <input
              type="number" min={1} max={20} value={pages}
              onChange={(e) => setPages(Math.max(1, Math.min(20, Number(e.target.value || 1))))}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: `1px solid ${C.bd}`, background: '#fff', color: C.th, fontSize: 14
              }}
            />
            <div style={{ marginTop: 6, fontSize: 11, color: C.tm }}>
              Ejemplo: 3 páginas = hasta 45 registros si tu tabla usa 15 por página.
            </div>
          </div>

          <label style={{
            display: 'flex', alignItems: 'center', gap: 10, background: C.sf,
            border: `1px solid ${C.bd}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer'
          }}>
            <input type="checkbox" checked={includeIncidents} onChange={(e) => setIncludeIncidents(e.target.checked)} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.th }}>Incluir incidentes críticos activos</div>
              <div style={{ fontSize: 11, color: C.ts }}>Agrega una segunda sección con el listado de incidentes críticos.</div>
            </div>
          </label>
        </div>

        <div style={{
          padding: '14px 22px', borderTop: `1px solid ${C.bd}`, background: C.sf,
          display: 'flex', justifyContent: 'flex-end', gap: 10
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: `1px solid ${C.bd}`, color: C.th,
              padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onExport({ pages, includeIncidents })}
            disabled={loading}
            style={{
              background: C.b500, border: 'none', color: '#fff', padding: '8px 14px',
              borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <FileText size={14} /> {loading ? 'Generando...' : 'Generar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportAuditModal;