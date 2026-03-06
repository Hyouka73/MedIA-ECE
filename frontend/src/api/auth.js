/**
 * API — Módulo de Autenticación
 * Funciones de llamada a /auth/* centralizadas.
 */
import api from './client';

export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    verify2FA: (temp_token, code) => api.post('/auth/2fa/verify', { temp_token, code }),
    refresh: () => api.post('/auth/refresh'),
    logout: () => api.post('/auth/logout'),
};
