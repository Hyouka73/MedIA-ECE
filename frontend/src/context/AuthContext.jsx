import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import apiClient, { setTokenGetter } from '../api/client';

// Contexto de Autenticación (Req 1 y 4 Forense - JWT in memory, NO localStorage)
const AuthContext = createContext(null);

/**
 * Decodifica el payload de un JWT sin verificar firma (solo para leer exp).
 * La verificación real la hace el backend.
 */
function decodeJwtPayload(token) {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
}

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const refreshTimerRef = useRef(null);

    // Bypass para Desarrollo Local: Para evitar hacer login constantemente mientras se desarrolla.
    // Solo se activa si VITE_APP_BYPASS_AUTH='true'
    const isDevBypass = import.meta.env.VITE_APP_BYPASS_AUTH === 'true';

    // Sincronizar el token con el cliente API para interceptores (Mantenemos el asíncrono como respaldo)
    useEffect(() => {
        setTokenGetter(() => token);
    }, [token]);

    // ── Refresh silencioso del JWT ──
    const scheduleTokenRefresh = useCallback((accessToken) => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
        }

        const payload = decodeJwtPayload(accessToken);
        if (!payload?.exp) return;

        const expiresAt = payload.exp * 1000; // ms
        const now = Date.now();
        const refreshIn = expiresAt - now - 60_000; // 60s antes de expirar

        if (refreshIn <= 0) return; // Ya expiró o está a punto

        refreshTimerRef.current = setTimeout(async () => {
            try {
                const response = await apiClient.post('/auth/refresh');
                const newToken = response.data.access_token;
                
                setTokenGetter(() => newToken); // 🔥 FIX: Sincronización inmediata
                setToken(newToken);
                scheduleTokenRefresh(newToken); 
            } catch (error) {
                console.warn('Refresh silencioso falló — sesión expirada');
                setToken(null);
                setUser(null);
                setIsAuthenticated(false);
            }
        }, refreshIn);
    }, []);

    useEffect(() => {
        if (isDevBypass) {
            const devToken = 'fake-jwt-token-for-dev';
            setTokenGetter(() => devToken); // 🔥 FIX: Sincronización inmediata
            setToken(devToken);
            setUser({
                id: '1',
                nombre: 'Dr. Desarrollo Base',
                rol: 'SUPERADMIN', // Todo los permisos
                establecimiento: 'CSSSA023999'
            });
            setIsAuthenticated(true);
            setLoading(false);
            return;
        }

        const restoreSession = async () => {
            try {
                const response = await apiClient.post('/auth/refresh', {}, {
                    withCredentials: true 
                });
                const { access_token, user: userData } = response.data;
                
                setTokenGetter(() => access_token); // 🔥 FIX: Evita el race condition al recargar página
                setToken(access_token);
                setUser(userData);
                setIsAuthenticated(true);
                scheduleTokenRefresh(access_token);
            } catch {
                // No hay sesión activa o la cookie expiró
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, [isDevBypass, scheduleTokenRefresh]);

    useEffect(() => {
        return () => {
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
    }, []);

    const login = async (email, password) => {
        try {
            const response = await apiClient.post('/auth/login', { email, password });

            // Si requiere 2FA, no guardamos NADA globalmente aún
            if (response.data.requires_2fa) {
                return {
                    requires_2fa: true,
                    tempToken: response.data.temp_token,
                    totp_configured: response.data.totp_configured,
                    reason: response.data.reason 
                };
            }

            // Si entra directo (sin 2FA), inyectamos al instante
            const finalToken = response.data.access_token;
            setTokenGetter(() => finalToken); // 🔥 FIX: Sincronización inmediata

            setToken(finalToken);
            setUser(response.data.user);
            setIsAuthenticated(true);
            scheduleTokenRefresh(finalToken);
            return { 
                success: true, 
                totp_configured: response.data.totp_configured 
            };
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    };

    const verify2FA = async (tempToken, code) => {
        const response = await apiClient.post('/auth/2fa/verify', { temp_token: tempToken, code });
        
        const finalToken = response.data.access_token;
        
        // 🔥 EL PARCHE MÁGICO: Actualiza el interceptor de inmediato, síncronamente 🔥
        // Esto garantiza que el navigate('/dashboard') ya lleve la llave puesta.
        setTokenGetter(() => finalToken); 
        
        setToken(finalToken);
        setUser(response.data.user);
        setIsAuthenticated(true);
        scheduleTokenRefresh(finalToken);
        return true;
    }

    const logout = async () => {
        try {
            if (token && token !== 'fake-jwt-token-for-dev') {
                await apiClient.post('/auth/logout');
            }
        } catch { /* no-op */ }

        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        setTokenGetter(() => null); // 🔥 Limpiamos el interceptor de golpe
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = (newUserData) => {
        setUser(prev => ({ ...prev, ...newUserData }));
    };

    return (
        <AuthContext.Provider value={{ token, user, isAuthenticated, login, verify2FA, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
export const useAuth = () => useContext(AuthContext);