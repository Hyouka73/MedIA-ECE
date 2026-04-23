// api/catalogos.js
import apiClient from './client';

export const catalogosAPI = {
  // ✅ Obtener estados (nuevo)
  getEstados: async () => {
    const response = await apiClient.get('/catalogos/estados');
    return response.data;
  },

  // ✅ Obtener municipios por estado (corregido)
  getMunicipios: async (estadoId) => {
    const response = await apiClient.get('/catalogos/municipios', {
      params: { estado: estadoId }
    });
    return response.data;
  },

  // ✅ Obtener localidades por municipio (corregido)
  getLocalidades: async (municipioId) => {
    const response = await apiClient.get('/catalogos/localidades', {
      params: { municipio: municipioId }  // ← El backend espera "municipio", no "municipioId"
    });
    return response.data;
  },

  // ✅ Obtener lenguas indígenas (corregido)
  getLenguas: async () => {
    const response = await apiClient.get('/catalogos/lenguas');
    return response.data;
  },

  // Alias para mantener compatibilidad
  getLenguasIndigenas: async () => {
    const response = await apiClient.get('/catalogos/lenguas');
    return response.data;
  }
};

export default catalogosAPI;