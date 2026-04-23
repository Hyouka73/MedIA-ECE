import { useMemo } from 'react';

/**
 * Hook para manejar la lógica de barrera lingüística
 * @param {Object} paciente - Objeto paciente con persona.alerta_barrera_linguistica
 */
export const useBarreraLinguistica = (paciente) => {
  const tieneBarrera = useMemo(() => {
    return paciente?.persona?.alerta_barrera_linguistica || false;
  }, [paciente]);

  const lenguaMaterna = useMemo(() => {
    return paciente?.persona?.id_lengua_materna || null;
  }, [paciente]);

  const getMensajeAlerta = useMemo(() => {
    if (!tieneBarrera) return null;
    
    return {
      titulo: '⚠️ Barrera Lingüística',
      mensaje: 'El paciente requiere atención en lengua indígena. Asegure disponibilidad de intérprete.',
      severidad: 'media',
      icono: '🗣️'
    };
  }, [tieneBarrera]);

  return {
    tieneBarrera,
    lenguaMaterna,
    getMensajeAlerta,
    debeMostrarAlerta: tieneBarrera
  };
};