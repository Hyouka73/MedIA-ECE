import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { Download, ShieldAlert, Ban, Eye, Clock, RefreshCw } from 'lucide-react';
import { AgGridReact, useGridFilter } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';

// Registrar módulos de AG Grid
ModuleRegistry.registerModules([AllCommunityModule]);

import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  C,
  normalize,
  pickFirst,
  getItemsFromResponse,
  getResultado,
  esCritico,
  isActivo,
  formatDate,
  getIp,
  getEvento,
  getModulo,
  getSeveridad,
  getResultadoLabel,
  badgeResultado,
  Bdg
} from '../../utils/auditoria.utils';

// Definir el tema personalizado con la Theming API de AG Grid v33+
const mediaAuditTheme = themeQuartz.withParams({
  backgroundColor: "#ffffff",
  foregroundColor: C.th,
  headerBackgroundColor: C.sf,
  headerForegroundColor: C.th,
  headerFontWeight: "700",
  headerFontSize: "12px",
  rowHoverColor: "#F5F2EC",
  oddRowBackgroundColor: "#FBF9F6",
  accentColor: C.b500,
  fontSize: "13px",
  fontFamily: "'DM Sans', sans-serif",
  borderRadius: "12px",
  borderColor: C.bd,
  cellHorizontalPadding: 20,
  headerColumnResizeHandleColor: C.bd,
  headerColumnSeparatorColor: C.bd,
  headerColumnSeparatorHeight: "25%",
});
import { exportAuditReport } from '../../utils/auditoriaExport';

// Componentes
import ExportAuditModal from './components/ExportAuditModal';
import DetalleIncidenteModal from './components/DetalleIncidenteModal';
import IncidentesDrawer from './components/IncidentesDrawer';
import BlacklistDrawer from './components/BlacklistDrawer';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: obtiene el valor transformado de un nodo usando el valueGetter
// de la columna o, como fallback, el campo directo.
// Se define FUERA del componente para que sea una referencia estable.
// ─────────────────────────────────────────────────────────────────────────────
function getValueFromNode(node, column, api) {
  if (!node?.data) return null;
  try {
    const colDef = column?.getColDef?.();
    if (!colDef) return null;

    let val = null;
    // 1. Usar el valueGetter de la columna (igual que hace la celda)
    if (typeof colDef.valueGetter === 'function') {
      val = colDef.valueGetter({ data: node.data, node, api, column });
    } else if (colDef.field) {
      // 2. Fallback: campo directo
      val = node.data[colDef.field];
    }

    const finalVal = val != null ? String(val) : null;
    // console.log(`[Filter Debug] getValueFromNode (${column?.getColId()}):`, { val: finalVal });
    return finalVal;
  } catch (e) {
    console.error('[Filter Debug] Error en getValueFromNode:', e);
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomMultiSelectFilter — Filtro multi-select con chips para AG Grid v33
// ─────────────────────────────────────────────────────────────────────────────
const CustomMultiSelectFilter = ({ api, column, filterParams, onModelChange }) => {
  console.log(`[Filter Debug] RENDER CustomMultiSelectFilter:`, { columnId: column?.getColId() });
  const [uniqueValues, setUniqueValues] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const selectedRef = useRef(new Set());
  const [searchText, setSearchText] = useState('');

  const filterName = filterParams?.title || 'Elementos';

  // ── Poblar valores únicos ────────────────────────────────────────────────
  const populateValues = useCallback(() => {
    if (!api) return;
    const vals = new Set();
    api.forEachNode(node => {
      const v = getValueFromNode(node, column, api);
      if (v != null && v !== '') vals.add(v);
    });
    const sorted = Array.from(vals).sort();
    setUniqueValues(sorted);
  }, [api, column]);

  useEffect(() => {
    if (!api) return;
    populateValues();
    api.addEventListener('rowDataUpdated', populateValues);
    return () => {
      try { api.removeEventListener('rowDataUpdated', populateValues); } catch (_) { }
    };
  }, [api, populateValues]);

  // ── Hook Oficial de AG Grid v33 ───────────────────────────────────────────
  useGridFilter({
    doesFilterPass: (params) => {
      if (selectedRef.current.size === 0) return true;
      const val = getValueFromNode(params.node, column, api);
      return val != null && selectedRef.current.has(val);
    },
    afterGuiAttached: () => populateValues(),
  });

  // ── Notificar al grid que el filtro cambió ────────────────────────────────
  const applyFilter = useCallback((nextSet) => {
    selectedRef.current = nextSet;
    setSelected(new Set(nextSet));
    // onModelChange(model) es el contrato de useGridFilter + reactiveCustomComponents
    // null = filtro inactivo, { values: [...] } = filtro activo → dispara doesFilterPass
    const model = nextSet.size > 0 ? { values: Array.from(nextSet) } : null;
    onModelChange(model);
  }, [onModelChange]);

  const toggle = (v) => {
    const next = new Set(selectedRef.current);
    if (next.has(v)) next.delete(v); else next.add(v);
    applyFilter(next);
  };

  const selectAllVisible = () => {
    const visible = uniqueValues.filter(v => v.toLowerCase().includes(searchText.toLowerCase()));
    applyFilter(new Set(visible));
  };

  const clearAll = () => applyFilter(new Set());

  const filteredValues = uniqueValues.filter(v =>
    v.toLowerCase().includes(searchText.toLowerCase())
  );

  if (!api) return null;

  return (
    <div style={{
      padding: '8px 10px', minWidth: 200, maxWidth: 280, maxHeight: 380,
      display: 'flex', flexDirection: 'column', background: '#fff',
      border: `1px solid ${C.bd}`, borderRadius: 10,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        fontSize: 9, fontWeight: 800, color: C.tm, marginBottom: 10,
        textTransform: 'uppercase', letterSpacing: 0.8,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${C.sf}`, paddingBottom: 6
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 3, height: 10, background: C.b500, borderRadius: 1.5 }} />
          {filterName}
        </span>
        <span style={{ fontSize: 8, background: C.sf, color: C.ts, padding: '1px 6px', borderRadius: 5, border: `1px solid ${C.bd}` }}>
          {selected.size} SELECC.
        </span>
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Filtrar opciones..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{
            width: '100%', padding: '7px 10px', border: `1px solid ${C.bd}`,
            borderRadius: 8, fontSize: 11, outline: 'none', background: C.cd,
            transition: 'all 0.2s', color: C.th, boxSizing: 'border-box'
          }}
          onFocus={e => { e.target.style.borderColor = C.b500; e.target.style.boxShadow = `0 0 0 2px ${C.b500}18`; }}
          onBlur={e => { e.target.style.borderColor = C.bd; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Acciones rápidas */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button onClick={selectAllVisible} style={{
          flex: 1, padding: '5px 8px', fontSize: 10, fontWeight: 700,
          background: C.sf, border: `1px solid ${C.bd}`, borderRadius: 6,
          cursor: 'pointer', color: C.ts
        }}>Todos</button>
        <button onClick={clearAll} style={{
          flex: 1, padding: '5px 8px', fontSize: 10, fontWeight: 700,
          background: C.sf, border: `1px solid ${C.bd}`, borderRadius: 6,
          cursor: 'pointer', color: C.ts
        }}>Limpiar</button>
      </div>

      {/* Chips */}
      <div style={{
        flex: 1, overflowY: 'auto', minHeight: 100, maxHeight: 240, paddingRight: 4,
        display: 'flex', flexWrap: 'wrap', gap: 6, alignContent: 'flex-start'
      }}>
        {filteredValues.length === 0 ? (
          <div style={{ width: '100%', fontSize: 11, color: C.tm, textAlign: 'center', padding: '30px 0', fontStyle: 'italic' }}>
            Sin resultados
          </div>
        ) : (
          filteredValues.map(v => {
            const isSelected = selected.has(v);
            return (
              <button
                key={v}
                onClick={() => toggle(v)}
                style={{
                  padding: '5px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s', border: '1.2px solid',
                  background: isSelected ? C.b500 : '#fff',
                  color: isSelected ? '#fff' : C.ts,
                  borderColor: isSelected ? C.b500 : C.bd,
                  boxShadow: isSelected ? `0 2px 6px ${C.b500}20` : 'none',
                  whiteSpace: 'nowrap',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                {v}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AuditoriaPage
// ─────────────────────────────────────────────────────────────────────────────
const AuditoriaPage = () => {
  const { token, user } = useAuth();
  const gridRef = useRef();
  const userRole = normalize(pickFirst(user?.rol, user?.role, user?.tipo_rol, ''));
  const canManageIncidents = userRole === 'SUPERADMIN' || userRole === 'OMNIADMIN';

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, criticos: 0, eventos_hoy: 0 });
  const [blacklistCount, setBlacklistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [logSeleccionado, setLogSeleccionado] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [blacklistOpen, setBlacklistOpen] = useState(false);
  const [drawerRefreshKey, setDrawerRefreshKey] = useState(0);
  const [blacklistRefreshKey] = useState(0);
  const [updatingEstado, setUpdatingEstado] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/auditoria', {
        params: { page: 1, limit: 5000 },
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(getItemsFromResponse(res?.data));
    } catch (e) {
      console.error("Error logs:", e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiClient.get('/auditoria/stats', { headers: { Authorization: `Bearer ${token}` } });
      setStats(res.data || { total: 0, criticos: 0, eventos_hoy: 0 });
    } catch (e) { console.error("Error stats:", e); }
  }, [token]);

  const fetchBlacklistCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiClient.get('/seguridad/sessions-blacklist', { headers: { Authorization: `Bearer ${token}` } });
      setBlacklistCount(Array.isArray(res.data) ? res.data.length : 0);
    } catch (e) { console.error("Error blacklist count:", e); setBlacklistCount(0); }
  }, [token]);

  useEffect(() => {
    if (token) { fetchStats(); fetchBlacklistCount(); fetchLogs(); }
  }, [token, fetchStats, fetchBlacklistCount, fetchLogs]);

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
      setLogSeleccionado({ ...log, resultado: nuevoEstado });
      handleIncidentUpdated();
    } catch (e) { console.error("Error actualizando estado:", e); }
    finally { setUpdatingEstado(false); }
  };

  const columnDefs = useMemo(() => [
    {
      field: 'timestamp_evento',
      headerName: 'Fecha y Hora',
      valueFormatter: p => formatDate(p.value),
      sortable: true,
      filter: 'agDateColumnFilter',
      minWidth: 180,
      sort: 'desc'
    },
    {
      field: 'id_usuario',
      headerName: 'Usuario',
      valueFormatter: p => p.value ? `${String(p.value).slice(0, 8)}...` : 'Sistema',
      sortable: true,
      filter: 'agTextColumnFilter',
      flex: 1
    },
    {
      field: 'ip_origen',
      headerName: 'IP',
      valueGetter: p => getIp(p.data),
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 130
    },
    {
      field: 'accion',
      headerName: 'Evento / Acción',
      valueGetter: p => getEvento(p.data),
      sortable: true,
      filter: CustomMultiSelectFilter,
      filterParams: { title: 'Acciones' },
      flex: 1,
      cellStyle: { fontWeight: '700', color: C.b600 }
    },
    {
      field: 'modulo_accion',
      headerName: 'Módulo',
      valueGetter: p => getModulo(p.data),
      sortable: true,
      filter: CustomMultiSelectFilter,
      filterParams: { title: 'Módulos' },
      width: 140
    },
    {
      field: 'nivel_severidad',
      headerName: 'Severidad',
      valueGetter: p => getSeveridad(p.data),
      cellRenderer: p => {
        const critico = esCritico(p.data);
        return <Bdg v={critico ? 'error' : 'blue'} dot>{p.value}</Bdg>;
      },
      sortable: true,
      filter: CustomMultiSelectFilter,
      filterParams: { title: 'Severidad' },
      width: 140
    },
    {
      field: 'resultado',
      headerName: 'Resultado / Gestión',
      valueGetter: p => getResultadoLabel(getResultado(p.data)),
      minWidth: 200,
      filter: CustomMultiSelectFilter,
      filterParams: { title: 'Resultados' },
      cellRenderer: p => {
        const resultado = getResultado(p.data);
        const critico = esCritico(p.data);
        const activo = critico && isActivo(p.data);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: '100%' }}>
            <Bdg v={badgeResultado(resultado)}>{p.value}</Bdg>
            <button
              onClick={() => setLogSeleccionado(p.data)}
              style={{
                background: "transparent", border: `1px solid ${C.bd}`, color: C.ts,
                padding: "4px 8px", borderRadius: 6, fontSize: 10, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4, transition: 'all 0.2s'
              }}
            >
              <Eye size={12} /> Ver
            </button>
            {activo && (
              <div title="Requiere seguimiento" style={{ color: C.r600 }}>
                <Clock size={14} style={{ animation: "pulse 1.5s infinite" }} />
              </div>
            )}
          </div>
        );
      }
    }
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    filter: true,
    floatingFilter: false,
    suppressHeaderMenuButton: false,
    sortable: true
  }), []);

  const handleExport = async ({ pages, includeIncidents }) => {
    setExportLoading(true);
    try {
      await exportAuditReport({ pages, includeIncidents, token, limit: 1000, userRole, blacklistCount });
      setExportOpen(false);
    } catch (e) { console.error('Error exportando reporte:', e); }
    finally { setExportLoading(false); }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.bg, minHeight: "100vh" }}>
      <style>{`@keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.35; transform:scale(1.08); } }`}</style>

      <ExportAuditModal open={exportOpen} onClose={() => setExportOpen(false)} onExport={handleExport} loading={exportLoading} />

      {logSeleccionado && (
        <DetalleIncidenteModal
          log={logSeleccionado}
          onClose={() => setLogSeleccionado(null)}
          onUpdateEstado={handleUpdateEstadoFromModal}
          canManage={canManageIncidents}
          updatingEstado={updatingEstado}
        />
      )}

      <IncidentesDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} token={token} refreshKey={drawerRefreshKey} userRole={userRole} onIncidentUpdated={handleIncidentUpdated} />
      <BlacklistDrawer open={blacklistOpen} onClose={() => setBlacklistOpen(false)} token={token} refreshKey={blacklistRefreshKey} />

      <div style={{ padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.bd}`, background: C.sf }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32, flex: 1, overflow: 'hidden' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.th, letterSpacing: -0.3, whiteSpace: 'nowrap' }}>Auditoría Forense</div>
            <div style={{ fontSize: 11, color: C.ts, marginTop: 1, whiteSpace: 'nowrap' }}>Trazabilidad legal · NOM-151</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={fetchLogs} style={{ background: "none", border: `1px solid ${C.bd}`, padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: C.ts }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
          <button onClick={() => setExportOpen(true)} style={{ background: C.b500, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <Download size={16} /> Exportar PDF
          </button>
        </div>
      </div>

      <div style={{ padding: "16px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 22 }}>
          <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 18 }}>
            <div style={{ color: C.ts, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>EVENTOS HOY</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.b600 }}>{stats?.eventos_hoy || 0}</div>
          </div>
          <div onClick={() => setDrawerOpen(true)} style={{ background: Number(stats?.criticos) > 0 ? "#FFF5F5" : C.cd, border: Number(stats?.criticos) > 0 ? `2px solid ${C.r500}` : `1px solid ${C.bd}`, borderRadius: 12, padding: 18, cursor: "pointer" }}>
            <div style={{ color: Number(stats?.criticos) > 0 ? C.r600 : C.ts, fontSize: 12, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>INCIDENTES CRÍTICOS <ShieldAlert size={14} /></div>
            <div style={{ fontSize: 28, fontWeight: 700, color: Number(stats?.criticos) > 0 ? C.r500 : C.th }}>{stats?.criticos || 0}</div>
          </div>
          <div onClick={() => setBlacklistOpen(true)} style={{ background: blacklistCount > 0 ? C.y50 : C.cd, border: blacklistCount > 0 ? `2px solid ${C.y500}` : `1px solid ${C.bd}`, borderRadius: 12, padding: 18, cursor: "pointer" }}>
            <div style={{ color: blacklistCount > 0 ? C.y600 : C.ts, fontSize: 12, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>TOKENS BLOQUEADOS <Ban size={14} /></div>
            <div style={{ fontSize: 28, fontWeight: 700, color: blacklistCount > 0 ? C.y500 : C.th }}>{blacklistCount}</div>
          </div>
          <div style={{ background: C.cd, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 18 }}>
            <div style={{ color: C.ts, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>TOTAL HISTÓRICO</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.th }}>{stats?.total || 0}</div>
          </div>
        </div>

        <div style={{ height: "calc(100vh - 240px)", background: "#fff", borderRadius: 16, border: `1px solid ${C.bd}`, overflow: "hidden" }}>
          <AgGridReact
            ref={gridRef}
            theme={mediaAuditTheme}
            rowData={logs}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={20}
            headerHeight={48}
            rowHeight={52}
            reactiveCustomComponents={true}
            onFilterChanged={() => console.log('[Filter Debug] GRID EVENT: onFilterChanged fired')}
          />
        </div>
      </div>
    </div>
  );
};

export default AuditoriaPage;