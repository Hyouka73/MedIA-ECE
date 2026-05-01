import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { clinicoAPI } from "../../api/clinico";
import { pacientesAPI } from "../../api/pacientes";
import { Spinner } from "../../components/ui/Spinner";

// ── Tokens MedIA (Doc 7) ──────────────────────────────────────────────────────
const T = {
  bg: "#EDEBE6",
  surface: "#FFFFFF",
  alt: "#F5F2EC",
  blue: "#1B4F8A",
  green: "#2D8653",
  amber: "#D97706",
  red: "#DC2626",
  text: "#1E293B",
  muted: "#64748B",
  border: "#DAD4CC",
  hover: "#EEF3FB",
  sidebarBg: "#101E33",
};

// ── Iconos SVG inline ─────────────────────────────────────────────────────────
const IconSearch = ({ size = 14, color = T.muted }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconPlus = ({ size = 13, color = "#fff" }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const IconTrash = ({ size = 13 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconInfo = ({ size = 12 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconCheck = ({ size = 16, color = T.green }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconClock = ({ size = 13 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
  </svg>
);
const IconShield = ({ size = 11 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconDoc = ({ size = 14 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={T.amber} strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// ── Estilos comunes ───────────────────────────────────────────────────────────
const s = {
  label: { fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 3 },
  input: {
    height: 32, border: `1px solid ${T.border}`, borderRadius: 5,
    padding: "0 10px", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
    color: T.text, background: T.surface, outline: "none", width: "100%",
    transition: "border .15s",
  },
  select: {
    height: 32, border: `1px solid ${T.border}`, borderRadius: 5,
    padding: "0 8px", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
    color: T.text, background: T.surface, outline: "none", width: "100%",
  },
  textarea: {
    border: `1px solid ${T.border}`, borderRadius: 5,
    padding: "7px 10px", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
    color: T.text, background: T.surface, outline: "none",
    resize: "vertical", minHeight: 56, width: "100%",
    transition: "border .15s",
  },
};

// ── Componente campo de formulario ───────────────────────────────────────────
const Field = ({ label, children, full }) => (
  <div style={{ gridColumn: full ? "1 / -1" : undefined, display: "flex", flexDirection: "column" }}>
    <span style={s.label}>{label}</span>
    {children}
  </div>
);

// ── Tarjeta de medicamento prescrito ─────────────────────────────────────────
const RxCard = ({ item, index, onChange, onRemove, isHistorical }) => {
  const { drug, dosis, frecuencia, via, duracion, cantidad, indicEsp, fecha_prescripcion } = item;

  const update = (key) => (e) => onChange(item.id || item.id_prescripcion, key, e.target.value);

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, background: T.alt, overflow: "hidden", opacity: isHistorical ? 0.85 : 1 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ width: 22, height: 22, background: isHistorical ? T.muted : T.blue, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
          {index + 1}
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text, flex: 1 }}>
          {drug.nombre_generico}
          <span style={{ fontSize: 10, fontWeight: 500, color: T.muted, background: T.alt, border: `1px solid ${T.border}`, padding: "1px 6px", borderRadius: 3, marginLeft: 8 }}>
            {drug.forma_farmaceutica}
          </span>
          {isHistorical && (
            <span style={{ fontSize: 10, color: T.muted, marginLeft: 10, fontWeight: 500 }}>
              📅 {new Date(fecha_prescripcion).toLocaleDateString()}
            </span>
          )}
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, color: isHistorical ? T.muted : T.blue, background: isHistorical ? "#F1F5F9" : "#EEF3FB", padding: "2px 7px", borderRadius: 3 }}>
          {isHistorical ? "Historial" : "Nueva Prescripción"}
        </span>
        <span style={{ fontSize: 10, fontFamily: "monospace", color: T.muted, marginLeft: 4 }}>
          {drug.codigo_medicamento_ssa}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Field label="Presentación">
          <input
            style={{ ...s.input, background: T.alt, color: T.muted, cursor: "default" }}
            value={drug.presentacion || "N/A"}
            readOnly
          />
        </Field>

        <Field label="Dosis">
          <input style={s.input} placeholder="ej: 1 tableta" value={dosis} onChange={update("dosis")} readOnly={isHistorical} />
        </Field>

        <Field label="Frecuencia">
          <select style={s.select} value={frecuencia} onChange={update("frecuencia")} disabled={isHistorical}>
            <option value="">Seleccionar...</option>
            <option>Cada 6 horas</option>
            <option>Cada 8 horas</option>
            <option>Cada 12 horas</option>
            <option>Una vez al día</option>
            <option>Dos veces al día</option>
            <option>Tres veces al día</option>
            <option>Según necesidad (SOS)</option>
          </select>
        </Field>

        <Field label="Duración">
          <input style={s.input} placeholder="ej: 7 días" value={duracion} onChange={update("duracion")} readOnly={isHistorical} />
        </Field>

        <Field label="Vía de administración">
          <select style={s.select} value={via} onChange={update("via")} disabled={isHistorical}>
            <option value="">Seleccionar...</option>
            <option>Oral</option>
            <option>Intravenosa</option>
            <option>Intramuscular</option>
            <option>Subcutánea</option>
            <option>Tópica</option>
            <option>Inhalatoria</option>
            <option>Sublingual</option>
            <option>Rectal</option>
          </select>
        </Field>

        <Field label="Cantidad a dispensar">
          <input style={s.input} placeholder="ej: 20 tabletas" value={cantidad} onChange={update("cantidad")} readOnly={isHistorical} />
        </Field>

        <Field label="Indicaciones específicas" full>
          <input
            style={s.input}
            placeholder="ej: Tomar con alimentos, evitar sol directo..."
            value={indicEsp}
            onChange={update("indicEsp")}
            readOnly={isHistorical}
          />
        </Field>
      </div>

      {/* Indicaciones del catálogo */}
      {drug.indicaciones && (
        <div style={{ margin: "0 14px 10px", padding: "8px 10px", background: "#EEF3FB", borderRadius: 5, border: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.blue, textTransform: "uppercase", letterSpacing: ".4px" }}>Indicación del catálogo: </span>
          <span style={{ fontSize: 11, color: T.muted }}>{drug.indicaciones}</span>
        </div>
      )}

      {/* Footer */}
      {!isHistorical && (
        <div style={{ padding: "8px 14px", background: T.surface, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => onRemove(item.id)}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", color: T.red, border: `1px solid ${T.red}`, padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}
          >
            <IconTrash size={12} /> Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

// ── Dropdown de búsqueda ──────────────────────────────────────────────────────
const SearchDropdown = ({ query, onSelect }) => {
  const [hits, setHits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setHits([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await clinicoAPI.buscarMedicamentos(query);
        setHits(res.data.data || []);
      } catch (err) {
        console.error("Error buscando medicamentos:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (query.length < 3) return null;

  return (
    <div style={{ position: "absolute", top: 40, left: 0, right: 80, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, zIndex: 100, maxHeight: 240, overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,.08)" }}>
      {loading ? (
        <div style={{ padding: "10px 14px", textAlign: "center" }}><Spinner size="sm" /></div>
      ) : hits.length === 0 ? (
        <div style={{ padding: "10px 14px", fontSize: 12, color: T.muted }}>Sin resultados en el catálogo</div>
      ) : (
        hits.map((d, i) => (
          <div
            key={d.id}
            onClick={() => onSelect(d)}
            style={{
              padding: "10px 14px", cursor: "pointer",
              borderBottom: i < hits.length - 1 ? `.5px solid ${T.alt}` : "none",
              transition: "background .1s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = T.hover}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{d.nombre_generico}</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: T.muted, background: T.alt, border: `1px solid ${T.border}`, padding: "1px 5px", borderRadius: 3 }}>{d.forma_farmaceutica || "N/A"}</span>
              <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: T.blue, background: "#EEF3FB", padding: "1px 6px", borderRadius: 3, fontFamily: "monospace" }}>{d.codigo_ssa}</span>
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{d.presentacion || "Sin presentación"}</div>
          </div>
        ))
      )}
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function RecetasTab({ pacienteId: propPacienteId }) {
  const { id: paramPacienteId } = useParams();
  const pacienteId = propPacienteId || paramPacienteId;

  const [rxItems, setRxItems] = useState([]);
  const [historicalRx, setHistoricalRx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const [firmado, setFirmado] = useState(false);
  const searchRef = useRef(null);
  let nextId = useRef(1);

  const fetchHistory = useCallback(async () => {
    console.log("RecetasTab: fetchHistory para pacienteId:", pacienteId);
    // Si no hay pacienteId, no cargamos historial pero quitamos el loading
    if (!pacienteId) {
      console.log("RecetasTab: No hay pacienteId, deteniendo carga");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await pacientesAPI.getPrescripciones(pacienteId);
      console.log("RecetasTab: Respuesta del historial:", res.data);
      const history = (res.data.data || []).map(item => ({
        ...item,
        drug: {
          nombre_generico: item.nombre_generico,
          codigo_medicamento_ssa: item.codigo_medicamento_ssa,
          forma_farmaceutica: item.forma_farmaceutica,
          presentacion: item.presentacion
        },
        dosis: item.indicacion_dosis,
        duracion: `${item.duracion_dias} días`,
        cantidad: `${item.cantidad_surtir} unidades`,
        via: "", 
        frecuencia: "",
        indicEsp: ""
      }));
      setHistoricalRx(history);
    } catch (err) {
      console.error("Error al cargar historial:", err);
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  const addDrug = (drug) => {
    setRxItems((prev) => [...prev, {
      id: nextId.current++,
      drug: {
        ...drug,
        codigo_medicamento_ssa: drug.codigo_ssa // Adaptar del catálogo real
      },
      dosis: "", frecuencia: "", via: "", duracion: "", cantidad: "", indicEsp: "",
    }]);
    setQuery("");
    setShowSearch(false);
  };

  const removeDrug = (id) => setRxItems((prev) => prev.filter((r) => r.id !== id));

  const updateField = (id, key, val) =>
    setRxItems((prev) => prev.map((r) => r.id === id ? { ...r, [key]: val } : r));

  const handleFirmar = async () => {
    if (rxItems.length === 0) return;
    
    setLoading(true);
    try {
      for (const item of rxItems) {
        const payload = {
          codigo_medicamento_ssa: item.drug.codigo_medicamento_ssa,
          indicacion_dosis: `${item.dosis} | ${item.frecuencia} | ${item.via} | ${item.indicEsp}`.trim(),
          duracion_dias: parseInt(item.duracion) || 1,
          cantidad_surtir: parseInt(item.cantidad) || 1
        };
        await pacientesAPI.addPrescripcion(pacienteId, payload);
      }
      setFirmado(true);
      setRxItems([]); // Limpiar los items recién firmados
      fetchHistory(); // Recargar historial
    } catch (err) {
      console.error("Error al firmar recetas:", err);
      alert(err.response?.data?.detail || "Error al guardar las recetas. Asegúrese de que el paciente tenga un encuentro activo.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 60, width: "100%", flexDirection: "column", gap: 10 }}>
        <Spinner className="w-8 h-8" />
        <div style={{ color: T.muted, fontSize: 14 }}>Cargando recetas...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: T.bg, minHeight: "100vh", padding: 20 }}>

      {/* TopBar — NOM-004 art. 5.1 + NOM-024 */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderRadius: "8px 8px 0 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: T.muted }}>
          <span>Pacientes</span>
          <span style={{ color: T.border }}>/</span>
          <span>Expediente</span>
          <span style={{ color: T.border }}>/</span>
          <span style={{ color: T.text, fontWeight: 600 }}>Recetas e Historial</span>
          <span style={{ background: T.blue, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4, letterSpacing: ".3px" }}>
            {pacienteId ? `PAC-${pacienteId.slice(0, 8)}` : "EXP-CONSULTA"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.muted }}>
          <IconClock size={13} />
          {new Date().toLocaleDateString("es-MX", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: "none", borderRadius: "0 0 8px 8px", padding: 20 }}>

        {/* Encabezado sección */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, background: T.blue, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", fontStyle: "italic" }}>
              Rx
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Prescripción de medicamentos</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: T.muted }}>Cuadro Básico SSA</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 10, color: T.muted, display: "flex", alignItems: "center", gap: 3 }}>
              <IconInfo size={11} /> NOM-004 art. 5.12
            </span>
            {!firmado && (
              <button
                onClick={() => setShowSearch(true)}
                style={{ background: T.blue, color: "#fff", border: "none", padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                <IconPlus /> Agregar medicamento
              </button>
            )}
          </div>
        </div>

        {/* Buscador */}
        {showSearch && !firmado && (
          <div style={{ position: "relative", marginBottom: 16, display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <IconSearch />
              </div>
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre genérico o código SSA (ej: amoxicilina, 010101)..."
                style={{ ...s.input, height: 36, paddingLeft: 32 }}
                onFocus={(e) => e.target.style.borderColor = T.blue}
                onBlur={(e) => e.target.style.borderColor = T.border}
              />
              <SearchDropdown query={query} onSelect={addDrug} />
            </div>
            <button
              onClick={() => { setShowSearch(false); setQuery(""); }}
              style={{ background: "transparent", color: T.blue, border: `1px solid ${T.blue}`, padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Lista de recetas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20, minHeight: 40 }}>
          {rxItems.length === 0 && historicalRx.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 20px", color: T.muted }}>
              <div style={{ width: 44, height: 44, background: T.alt, borderRadius: "50%", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                💊
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>Sin medicamentos prescritos</div>
              <div style={{ fontSize: 12 }}>Haga clic en "Agregar medicamento" para iniciar la prescripción</div>
            </div>
          ) : (
            <>
              {rxItems.map((item, i) => (
                <RxCard
                  key={item.id}
                  item={item}
                  index={i}
                  onChange={updateField}
                  onRemove={firmado ? undefined : removeDrug}
                />
              ))}
              {historicalRx.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", marginBottom: 10, borderBottom: `1px solid ${T.border}`, pb: 5 }}>
                    Historial de Recetas
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {historicalRx.map((item, i) => (
                      <RxCard
                        key={item.id_prescripcion}
                        item={item}
                        index={i}
                        isHistorical
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sello inmutabilidad (post-firma) — NOM-151 */}
        {firmado && (
          <div style={{ background: "#EAF6F0", border: "none", borderLeft: `4px solid ${T.green}`, borderRadius: "0 8px 8px 0", padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <IconCheck size={24} color={T.green} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Nota médica firmada electrónicamente</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                Firmado · {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })} · {new Date().toLocaleTimeString("es-MX")} CST
              </div>
              <div style={{ fontSize: 11, color: T.muted, fontFamily: "monospace", marginTop: 2 }}>
                SHA-256: {Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}...
              </div>
              <div style={{ fontSize: 12, color: T.text, marginTop: 2 }}>
                Dr./Dra. Sistema MedIA · Cédula profesional: 00000000
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={{ background: T.green, color: "#fff", border: "none", padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>
                  Descargar PDF de la nota
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Indicaciones generales al paciente */}
        {rxItems.length > 0 && (
          <div style={{ background: T.alt, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 12, fontWeight: 700, color: T.text }}>
              <IconDoc />
              Indicaciones generales al paciente
            </div>
            <textarea
              style={{ ...s.textarea, opacity: firmado ? 0.6 : 1 }}
              placeholder="Indicaciones de uso, cuidados generales, signos de alarma para regresar a consulta..."
              value={indicaciones}
              onChange={(e) => setIndicaciones(e.target.value.slice(0, 500))}
              disabled={firmado}
              onFocus={(e) => !firmado && (e.target.style.borderColor = T.blue)}
              onBlur={(e) => e.target.style.borderColor = T.border}
            />
            <div style={{ fontSize: 11, color: T.muted, textAlign: "right", marginTop: 3 }}>
              {indicaciones.length}/500 caracteres
            </div>
          </div>
        )}

        {/* Banner de firma — NOM-151 */}
        {rxItems.length > 0 && !firmado && (
          <div style={{ background: T.blue, borderRadius: 8, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                Receta lista para firma electrónica
              </div>
              <div style={{ color: "rgba(255,255,255,.75)", fontSize: 12 }}>
                {rxItems.length} medicamento{rxItems.length !== 1 ? "s" : ""} prescritos · Los registros quedarán inmutables tras la firma · NOM-151-SCFI-2016
              </div>
            </div>
            <button
              onClick={handleFirmar}
              style={{ background: "#fff", color: T.blue, border: "none", padding: "8px 18px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Firmar nota y receta
            </button>
          </div>
        )}

        {/* Nota normativa */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: T.muted }}>
          <IconShield />
          Prescripción conforme a NOM-004-SSA3-2010 art. 5.12 — Solo medicamentos del Cuadro Básico y Catálogo de Insumos del SPSS
        </div>
      </div>
    </div>
  );
}