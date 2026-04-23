/**
 * API — Módulo de Pacientes, Personas y Expediente Clínico
 * Servicios centralizados para gestión de pacientes y datos clínicos
 */
import api from './client';

export const pacientesAPI = {
    // ── Personas ──────────────────────────────────────────
    // GET /personas — Listar personas
    getPersonas: (params) => api.get('/personas', { params }),
    // GET /personas/:id — Obtener persona por ID
    getPersona: (id) => api.get(`/personas/${id}`),
    // POST /personas — Crear persona
    createPersona: (data) => api.post('/personas', data),
    // PATCH /personas/:id — Actualizar persona
    updatePersona: (id, data) => api.patch(`/personas/${id}`, data),
    
    // ── Pacientes ─────────────────────────────────────────
    // GET /pacientes — Lista paginada
    getPacientes: (params) => api.get('/pacientes', { params }),
    // GET /pacientes/:id — Detalle del paciente
    getPaciente: (id) => api.get(`/pacientes/${id}`),
    // POST /pacientes — Crear paciente
    createPaciente: (data) => api.post('/pacientes', data),
    // PUT /pacientes/:id — Actualizar paciente
    updatePaciente: (id, data) => api.put(`/pacientes/${id}`, data),
    // DELETE /pacientes/:id — Eliminar paciente (soft delete)
    deletePaciente: (id) => api.delete(`/pacientes/${id}`),
    
    // ── Expediente Clínico ─────────────────────────────────
    // GET /pacientes/:id/expediente — Expediente (compatibilidad con frontend)
    getExpediente: (id) => api.get(`/pacientes/${id}/expediente`),
    // GET /expediente/:id — Expediente completo con antecedentes
    getExpedienteCompleto: (id) => api.get(`/expediente/${id}`),
    // POST /expediente/:id/alergias — Agregar alergia
    addAlergia: (id, data) => api.post(`/expediente/${id}/alergias`, data),
    // POST /expediente/:id/antecedentes/patologicos — Agregar antecedente
    addAntecedente: (id, data) => api.post(`/expediente/${id}/antecedentes/patologicos`, data),
    // POST /expediente/:id/inmunizaciones — Agregar inmunización
    addInmunizacion: (id, data) => api.post(`/expediente/${id}/inmunizaciones`, data),
    
    // ── Catálogos INEGI ────────────────────────────────────
    // GET /catalogos/estados — Lista de estados
    getEstados: () => api.get('/catalogos/estados'),
    // GET /catalogos/municipios?estado={clave} — Municipios por estado
    getMunicipios: (estado) => api.get('/catalogos/municipios', { params: { estado } }),
    // GET /catalogos/localidades?municipio={clave} — Localidades por municipio
    getLocalidades: (municipio) => api.get('/catalogos/localidades', { params: { municipio } }),
    // GET /catalogos/lenguas — Lenguas indígenas
    getLenguas: () => api.get('/catalogos/lenguas'),
};
