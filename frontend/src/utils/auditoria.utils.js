import React from 'react';

export const C = {
  b500: "#2459A8", b600: "#1A4080",
  g500: "#237A4B", g600: "#196038",
  r50: "#FEF0F3", r500: "#BA2E45", r600: "#901F33",
  y50: "#FFF8E8", y500: "#B7791F", y600: "#975A16",
  n50: "#F8FAFC", n500: "#475569",
  bg: "#EDEBE6", sf: "#F5F2EC", cd: "#FDFAF5",
  bd: "#DAD4CC", th: "#1A1510", ts: "#5A5048", tm: "#877E74", td: "#A9A097"
};

export const pickFirst = (...values) => {
  for (const v of values) {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      return String(v);
    }
  }
  return '';
};

export const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

export const getItemsFromResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export const getResultado = (item) => {
  const raw = normalize(pickFirst(item?.resultado, item?.estado, 'ABIERTO'));
  if (!raw) return 'ABIERTO';
  if (raw === 'EN_PROCESO') return 'ENINVESTIGACION';
  if (raw === 'RESUELTO') return 'CERRADO';
  return raw;
};

export const getResultadoLabel = (resultado) => {
  const r = normalize(resultado);
  if (r === 'ENINVESTIGACION') return 'EN INVESTIGACIÓN';
  return r || 'ABIERTO';
};

export const getEvento = (item) =>
  pickFirst(item?.tipo_evento, item?.accion, item?.evento, 'EVENTO');

export const getModulo = (item) =>
  pickFirst(item?.modulo_funcion, item?.modulo_accion, item?.modulo, 'AUDITORIA');

export const getIp = (item) =>
  pickFirst(item?.direccion_ip, item?.ip_origen, item?.ip, item?.cliente_ip, '127.0.0.1');

export const getSeveridad = (item) =>
  normalize(pickFirst(item?.nivel_severidad, item?.severidad, 'MEDIO'));

export const esCritico = (item) => {
  const sev = getSeveridad(item);
  return sev === 'CRITICO' || sev === 'CRITICA';
};

export const isActivo = (item) => {
  const resultado = getResultado(item);
  return !['ERRADICADO', 'CERRADO'].includes(resultado);
};

export const canTransition = (estadoActual, next) => {
  const map = {
    ABIERTO: ['ENINVESTIGACION', 'CERRADO'],
    ENINVESTIGACION: ['ERRADICADO', 'CERRADO'],
    ERRADICADO: ['CERRADO'],
    CERRADO: []
  };
  return (map[normalize(estadoActual)] || []).includes(normalize(next));
};

export const badgeResultado = (resultado) => {
  const r = normalize(resultado);
  if (r === 'ABIERTO') return 'error';
  if (r === 'ENINVESTIGACION') return 'warning';
  if (r === 'ERRADICADO') return 'success';
  if (r === 'CERRADO') return 'neutral';
  return 'default';
};

export const estadoColor = (resultado) => {
  const r = normalize(resultado);
  if (r === 'ABIERTO') return '#DC2626';
  if (r === 'ENINVESTIGACION') return '#D97706';
  if (r === 'ERRADICADO') return '#16A34A';
  if (r === 'CERRADO') return '#64748B';
  return C.tm;
};

export const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

export const safeJson = (value) => {
  try {
    return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
  } catch {
    return String(value);
  }
};

// --- COMPONENTES REESCRITOS EN JS NATIVO (Sin JSX) ---

export const Bdg = ({ v = "default", children, dot }) => {
  const variants = {
    error: { bg: "#FEF0F3", color: "#901F33" },
    warning: { bg: "#FFF4E5", color: "#B45309" },
    success: { bg: "#E6F4EA", color: "#137333" },
    blue: { bg: "#EEF3FB", color: "#1A4080" },
    neutral: { bg: "#E2E8F0", color: "#475569" },
    default: { bg: "#E2DDD4", color: "#605850" }
  };

  const cv = variants[v] || variants.default;

  // Si lleva el "dot" (puntito), lo creamos como un elemento puro
  const dotElement = dot ? React.createElement('span', {
    style: { width: 5, height: 5, borderRadius: "50%", background: cv.color }
  }) : null;

  return React.createElement('span', {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: dot ? 4 : 0,
      padding: "2px 8px",
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 700,
      background: cv.bg,
      color: cv.color,
      textTransform: "uppercase"
    }
  }, dotElement, children);
};

export const ActionBtn = ({ onClick, disabled, color, children, title }) => {
  return React.createElement('button', {
    title: title,
    onClick: onClick,
    disabled: disabled,
    style: {
      background: disabled ? C.bd : color,
      border: "none",
      color: disabled ? C.ts : "#fff",
      padding: "7px 11px",
      borderRadius: 7,
      fontSize: 11,
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.7 : 1,
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, children);
};