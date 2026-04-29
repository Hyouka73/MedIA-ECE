import apiClient from './client';

export const referenciasAPI = {
  // Listar referencias con filtros
  getReferencias: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.estado) queryParams.append('estado', params.estado);
    if (params.id_paciente) queryParams.append('id_paciente', params.id_paciente);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const url = `/referencias${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  // Obtener detalle de una referencia
  getReferenciaById: async (id) => {
    const response = await apiClient.get(`/referencias/${id}`);
    return response.data;
  },

  // Crear nueva referencia
  createReferencia: async (data) => {
    const response = await apiClient.post('/referencias', data);
    return response.data;
  },

  // Responder a una referencia (aceptar/rechazar)
  responderReferencia: async (id, data) => {
    const response = await apiClient.put(`/referencias/${id}/responder`, data);
    return response.data;
  },

  // Cancelar referencia (se mapea a RECHAZADA en BD)
  cancelarReferencia: async (id) => {
    const response = await apiClient.put(`/referencias/${id}/cancelar`);
    return response.data;
  },

  // Marcar como atendida
  atenderReferencia: async (id) => {
    const response = await apiClient.put(`/referencias/${id}/atender`);
    return response.data;
  },

  // Catálogos para el formulario
  getEstablecimientos: async () => {
    const response = await apiClient.get('/referencias/catalogos/establecimientos');
    return response.data;
  },

  getEspecialidades: async () => {
    const response = await apiClient.get('/referencias/catalogos/especialidades');
    return response.data;
  },
};

export default referenciasAPI;