/**
 * Hook: usePaciente — Manejo de datos de paciente activo
 * Stub para P3 — implementar lógica de fetch y cache.
 */
import { useState, useCallback } from 'react';
import { pacientesAPI } from '../api/pacientes';

export function usePaciente() {
    const [paciente, setPaciente] = useState(null);
    const [expediente, setExpediente] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const cargarPaciente = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const res = await pacientesAPI.getPaciente(id);
            setPaciente(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al cargar paciente');
        } finally {
            setLoading(false);
        }
    }, []);

    const cargarExpediente = useCallback(async (id) => {
        setLoading(true);
        try {
            const res = await pacientesAPI.getExpediente(id);
            setExpediente(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al cargar expediente');
        } finally {
            setLoading(false);
        }
    }, []);

    return { paciente, expediente, loading, error, cargarPaciente, cargarExpediente };
}
