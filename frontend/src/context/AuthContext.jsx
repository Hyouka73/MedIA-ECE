import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import apiClient from '../api/client';

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

    // ── Refresh silencioso del JWT ──
    // Calcula cuándo expira el token y programa un refresh 60 segundos antes
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
                setToken(newToken);
                scheduleTokenRefresh(newToken); // Re-programar con el nuevo token
            } catch (error) {
                console.warn('Refresh silencioso falló — sesión expirada');
                setToken(null);
                setUser(null);
                setIsAuthenticated(false);
            }
        }, refreshIn);
    }, []);

    useEffect(() => {
        // Si estamos en desarrollo y activamos el bypass
        if (isDevBypass) {
            setToken('fake-jwt-token-for-dev');
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

        // Flujo Real: intentar refresh silencioso si hay session cookie HttpOnly
        // Por ahora solo cortamos el loading
        setLoading(false);
    }, [isDevBypass]);

    // Cleanup del timer
    useEffect(() => {
        return () => {
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
    }, []);

    const login = async (email, password) => {
        try {
            const response = await apiClient.post('/auth/login', { email, password });

            // Si requiere 2FA
            if (response.data.requires_2fa) {
                return {
                    requires_2fa: true,
                    tempToken: response.data.temp_token,
                    reason: response.data.reason // 'account_unlocked' | '2fa_required'
                };
            }

            setToken(response.data.access_token);
            setUser(response.data.user);
            setIsAuthenticated(true);
            scheduleTokenRefresh(response.data.access_token);
            return { success: true };
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    };

    const verify2FA = async (tempToken, code) => {
        // Re-throw para que el componente pueda leer error.response.data.detail
        // (mensajes de lockout del backend, intentos restantes, etc.)
        const response = await apiClient.post('/auth/2fa/verify', { temp_token: tempToken, code });
        setToken(response.data.access_token);
        setUser(response.data.user);
        setIsAuthenticated(true);
        scheduleTokenRefresh(response.data.access_token);
        return true;
    }

    const logout = async () => {
        // Intentar invalidar en backend (Req Forense 1)
        try {
            if (token && token !== 'fake-jwt-token-for-dev') {
                await apiClient.post('/auth/logout');
            }
        } catch { /* no-op */ }

        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
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

export const useAuth = () => useContext(AuthContext);

