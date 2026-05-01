/**
 * API — Módulo Clínico
 * Servicios para encuentros, notas SOAP, signos vitales, diagnósticos, prescripciones
 */
import api from './client';

export const clinicoAPI = {
  // ── Encuentros Clínicos ────────────────────────────────
  // GET /encuentros — Lista de encuentros (propios o de un paciente)
  getEncuentros: (params) => api.get('/encuentros', { params }),

  getEncuentrosPendientesSignos: () => api.get('/encuentros', { params: { pendientes_signos: true } }),
  getEncuentrosConSignos: () => api.get('/encuentros', { params: { con_signos: true } }),

  // POST /encuentros — Crear nuevo encuentro
  createEncuentro: (data) => api.post('/encuentros', data),

  // PATCH /encuentros/:id/cerrar — Cerrar encuentro (irreversible)
  cerrarEncuentro: (id) => api.patch(`/encuentros/${id}/cerrar`),

  // ── Signos Vitales ─────────────────────────────────────
  // POST /encuentros/:id/signos-vitales — Registrar signos vitales
  registrarSignos: (idEncuentro, data) =>
    api.post(`/encuentros/${idEncuentro}/signos-vitales`, data),

  // GET /encuentros/:id/signos-vitales — Obtener signos de un encuentro
  getSignos: (idEncuentro) =>
    api.get(`/encuentros/${idEncuentro}/signos-vitales`),

  // ── Notas SOAP ─────────────────────────────────────────
  // GET /encuentros/:id/notas — Obtener notas SOAP
  getNotasEncuentro: (idEncuentro) =>
    api.get(`/encuentros/${idEncuentro}/notas`),

  // POST /encuentros/:id/notas — Crear nota SOAP
  crearNota: (idEncuentro, data) =>
    api.post(`/encuentros/${idEncuentro}/notas`, data),

  // PATCH /notas/:id/firmar — Firmar nota (irreversible)
  firmarNota: (idNota) =>
    api.patch(`/encuentros/notas/${idNota}/firmar`),

  // POST /notas/:id/enmienda — Crear enmienda a nota firmada
  crearEnmienda: (idNota, data) =>
    api.post(`/encuentros/notas/${idNota}/enmienda`, data),

  // ── Diagnósticos ───────────────────────────────────────
  // POST /encuentros/:id/diagnosticos — Agregar diagnóstico
  addDiagnostico: (idEncuentro, data) =>
    api.post(`/encuentros/${idEncuentro}/diagnosticos`, data),

  // ── Prescripciones ─────────────────────────────────────
  // GET /encuentros/:id/prescripciones — Obtener prescripciones de un encuentro
  getPrescripciones: (idEncuentro) =>
    api.get(`/encuentros/${idEncuentro}/prescripciones`),

  // POST /encuentros/:id/prescripciones — Agregar prescripción
  addPrescripcion: (idEncuentro, data) =>
    api.post(`/encuentros/${idEncuentro}/prescripciones`, data),

  // ── Solicitudes de Estudio ─────────────────────────────
  // POST /encuentros/:id/solicitudes-estudio — Solicitar estudio
  addSolicitudEstudio: (idEncuentro, data) =>
    api.post(`/encuentros/${idEncuentro}/solicitudes-estudio`, data),

  // ── Catálogos Clínicos ─────────────────────────────────
  // GET /catalogos/cie10 — Buscar diagnóstico CIE-10
  buscarCIE10: (q) =>
    api.get('/catalogos/cie10', { params: { q } }),

  // GET /catalogos/medicamentos — Buscar medicamento
  buscarMedicamentos: (q) =>
    api.get('/catalogos/medicamentos', { params: { q } }),

  // GET /catalogos/especialidades — Lista de especialidades
  getEspecialidades: () =>
    api.get('/catalogos/especialidades'),
};