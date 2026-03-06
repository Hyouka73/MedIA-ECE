/**
 * API — Módulo de Pacientes y Personas
 * Stubs para P3 — implementar los endpoints aquí.
 */
import api from './client';

export const pacientesAPI = {
    // GET /personas — Buscar personas
    getPersonas: (params) => api.get('/personas', { params }),
    // POST /personas — Crear persona
    createPersona: (data) => api.post('/personas', data),
    // GET /pacientes — Lista paginada
    getPacientes: (params) => api.get('/pacientes', { params }),
    // GET /pacientes/:id — Detalle
    getPaciente: (id) => api.get(`/pacientes/${id}`),
    // GET /pacientes/:id/expediente — Expediente completo
    getExpediente: (id) => api.get(`/pacientes/${id}/expediente`),
};
