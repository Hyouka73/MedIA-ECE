/**
 * Hook: useEncuentro — Manejo de encuentro clínico activo
 * Stub para P4 — implementar lógica de fetch y stepper.
 */
import { useState, useCallback } from 'react';
import { clinicoAPI } from '../api/clinico';

export function useEncuentro() {
    const [encuentro, setEncuentro] = useState(null);
    const [signos, setSignos] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const abrirEncuentro = useCallback(async (data) => {
        setLoading(true);
        try {
            const res = await clinicoAPI.createEncuentro(data);
            setEncuentro(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al abrir encuentro');
        } finally {
            setLoading(false);
        }
    }, []);

    const cerrarEncuentro = useCallback(async (id) => {
        setLoading(true);
        try {
            await clinicoAPI.cerrarEncuentro(id);
            setEncuentro(prev => prev ? { ...prev, fecha_cierre: new Date().toISOString() } : null);
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al cerrar encuentro');
        } finally {
            setLoading(false);
        }
    }, []);

    return { encuentro, signos, loading, error, abrirEncuentro, cerrarEncuentro };
}
