import apiClient from './client';

export const documentosAPI = {
  /**
   * Lista todos los documentos clínicos de un paciente.
   * Devuelve: { notas, recetas, solicitudes, referencias, total }
   */
  getDocumentos: async (id_paciente) => {
    const response = await apiClient.get('/documentos', {
      params: { id_paciente },
    });
    return response.data;
  },

  /**
   * Descarga el PDF de un documento.
   * NOTA: Los endpoints PDF se implementarán con WeasyPrint en el futuro.
   * Por ahora esta función está preparada pero los endpoints no existen aún.
   *
   * @param {string} pdfEndpoint - Ruta relativa del endpoint PDF (ej: /notas/{id}/pdf)
   */
  descargarPDF: async (pdfEndpoint) => {
    const response = await apiClient.get(pdfEndpoint, {
      responseType: 'blob',
    });
    // Crear link de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `documento_${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default documentosAPI;
