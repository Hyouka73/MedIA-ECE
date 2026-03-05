import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../utils/permissions';
import { Spinner } from './ui/Spinner';

export default function ProtectedRoute({ module = null, action = 'VER' }) {
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

    // Verificación RBAC fina por módulo
    if (module && user) {
        const hasPermission = canAccess(user.rol, module, action);
        if (!hasPermission) {
            // OMNIADMIN y SUPERADMIN siempre pasan en DEV
            const bypassRoles = ['SUPERADMIN', 'OMNIADMIN'];
            if (!bypassRoles.includes(user.rol)) {
                return <Navigate to="/403" replace />;
            }
        }
    }

    return <Outlet />;
}
