import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../utils/permissions';
import { Spinner } from './ui/Spinner';

export default function ProtectedRoute({ module = null, action = 'puede_leer' }) {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Spinner className="w-8 h-8" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Verificación RBAC fina por módulo usando la matriz dinámica del backend
    if (module && user) {
        const hasPermission = canAccess(user.permisos, module, action);
        
        if (!hasPermission) {
            console.warn(`[BROKEN_ACCESS_CONTROL_MITIGATION] Intento de acceso no autorizado a módulo: ${module}`);
            return <Navigate to="/403" replace />;
        }
    }

    return <Outlet />;
}
