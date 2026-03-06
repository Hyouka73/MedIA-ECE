/**
 * API — Módulo Clínico
 * Stubs para P4 — implementar encuentros, notas, signos.
 */
import api from './client';

export const clinicoAPI = {
    // Encuentros
    getEncuentros: (params) => api.get('/encuentros', { params }),
    createEncuentro: (data) => api.post('/encuentros', data),
    cerrarEncuentro: (id) => api.patch(`/encuentros/${id}/cerrar`),

    // Notas SOAP
    crearNota: (idEncuentro, data) => api.post(`/encuentros/${idEncuentro}/notas`, data),
    firmarNota: (idNota) => api.patch(`/notas/${idNota}/firmar`),
    crearEnmienda: (idNota, data) => api.post(`/notas/${idNota}/enmienda`, data),

    // Signos vitales
    registrarSignos: (data) => api.post('/signos-vitales', data),
    getSignos: (idEncuentro) => api.get('/signos-vitales', { params: { id_encuentro: idEncuentro } }),

    // Catálogos
    buscarCIE10: (q) => api.get('/catalogos/cie10', { params: { q } }),
    buscarMedicamentos: (q) => api.get('/catalogos/medicamentos', { params: { q } }),
};
