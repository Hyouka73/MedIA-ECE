import React, { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Lock } from 'lucide-react';
import apiClient from '../../../api/client';
import { C, pickFirst, Bdg } from '../../../utils/auditoria.utils';

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
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 8100,
          opacity: open ? 1 : 0, pointerEvents: open ? "all" : "none", transition: "opacity 0.3s ease"
        }}
      />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 460, maxWidth: "95vw",
        background: C.bg, boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", zIndex: 8101,
        transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex", flexDirection: "column", overflowY: "auto"
      }}>
        <div style={{
          padding: "16px 22px", borderBottom: `1px solid ${C.bd}`, background: C.sf,
          display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 1
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.th }}>Blacklist de Sesiones</div>
            <div style={{ fontSize: 11, color: C.ts, marginTop: 2 }}>Tokens o sesiones revocadas</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={fetchBlacklist}
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

        <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#EEF3FB", border: "1px solid #C8D6EC", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <Lock size={16} color={C.b600} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.th }}>JWT In-Memory</div>
              <div style={{ fontSize: 11, color: C.ts }}>Revocación de sesiones sincronizada con seguridad.</div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: C.td }}>Cargando blacklist...</div>
          ) : blacklist.length === 0 ? (
            <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 32, textAlign: "center", color: C.td }}>
              ✅ No hay sesiones restringidas activas
            </div>
          ) : (
            blacklist.map((item, i) => (
              <div key={item?.id || item?.jti || i} style={{ background: C.cd, border: `1px solid ${C.bd}`, borderLeft: `5px solid ${C.y500}`, borderRadius: "0 10px 10px 0", padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.th }}>{pickFirst(item?.usuario, item?.user_id, item?.sub, 'Sesión bloqueada')}</div>
                    <div style={{ fontSize: 10, color: C.tm }}>JTI: {pickFirst(item?.jti, item?.token_id, '—')}</div>
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

export default BlacklistDrawer;