/**
 * API Client — Configuración base de Axios (Doc2 §1.1)
 * Interceptores para adjuntar JWT y manejar errores globales.
 */
import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

/**
 * Interceptor: Adjunta el token JWT a cada request.
 * Se configura desde AuthContext al hacer login.
 */
let _getToken = () => null;
export function setTokenGetter(fn) { _getToken = fn; }

api.interceptors.request.use((config) => {
    const token = _getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            // Token expiró — el refresh silencioso debería haberlo renovado
            console.warn('401 — Token expirado o inválido');
        }
        return Promise.reject(error);
    }
);

export default api;
