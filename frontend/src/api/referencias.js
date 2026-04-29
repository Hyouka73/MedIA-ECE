import apiClient from './client';

export const referenciasAPI = {
  // Listar referencias con filtros
  getReferencias: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.id_paciente) queryParams.append('id_paciente', params.id_paciente);
    if (params.tipo) queryParams.append('tipo', params.tipo);
    if (params.estado) queryParams.append('estado', params.estado);
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

  // Responder a una referencia (aceptar/rechazar/completar)
  responderReferencia: async (id, data) => {
    const response = await apiClient.put(`/referencias/${id}/responder`, data);
    return response.data;
  },

  // Cancelar referencia
  cancelarReferencia: async (id) => {
    const response = await apiClient.put(`/referencias/${id}/cancelar`);
    return response.data;
  }
};

export default referenciasAPI;