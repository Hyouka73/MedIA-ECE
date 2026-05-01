import apiClient from './client';

/**
 * Módulo de Laboratorio — API Service (P5)
 */
export const uploadResultadoLab = async (idSolicitud, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(`/laboratorio/upload?id_solicitud=${idSolicitud}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getSasToken = async (idResultado) => {
    const response = await apiClient.get(`/laboratorio/${idResultado}/token`);
    return response.data;
};

export const getResultadosBySolicitud = async (idSolicitud) => {
    const response = await apiClient.get(`/laboratorio/solicitud/${idSolicitud}/resultados`);
    return response.data;
};
