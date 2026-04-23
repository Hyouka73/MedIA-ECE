import React from 'react';
import { AlertTriangle, Languages } from 'lucide-react';

/**
 * Alerta visual de barrera lingüística
 * Se muestra cuando el paciente tiene una lengua materna diferente al español
 */
export const BarreraLinguisticaAlert = ({ 
  paciente, 
  size = 'medium',
  showLabel = true 
}) => {
  // Validar si debe mostrarse la alerta
  if (!paciente?.persona?.alerta_barrera_linguistica) {
    return null;
  }

  const tieneLengua = paciente.persona.id_lengua_materna != null;
  const lenguaMaterna = paciente.persona.id_lengua_materna;

  const styles = {
    small: {
      container: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        background: '#FFF3E0',
        border: '1px solid #E8921F',
        borderRadius: '4px',
        fontSize: '11px',
        color: '#B86E12',
      },
      icon: 12
    },
    medium: {
      container: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: '#FFF3E0',
        border: '1.5px solid #E8921F',
        borderRadius: '8px',
        marginBottom: '16px',
      },
      icon: 20
    },
    large: {
      container: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 20px',
        background: '#FFF3E0',
        border: '2px solid #E8921F',
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(232, 146, 31, 0.15)',
      },
      icon: 24
    }
  };

  const currentStyle = styles[size] || styles.medium;

  return (
    <div style={currentStyle.container}>
      <Languages size={currentStyle.icon} style={{ color: '#E8921F', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontSize: size === 'small' ? 11 : 13, 
          fontWeight: 600, 
          color: '#B86E12',
          marginBottom: size === 'small' ? 0 : 4 
        }}>
          ⚠️ Barrera Lingüística Detectada
        </div>
        {showLabel && size !== 'small' && (
          <div style={{ fontSize: 12, color: '#5A5048' }}>
            {tieneLengua ? (
              <>El paciente requiere atención en lengua indígena (ID: {lenguaMaterna})</>
            ) : (
              <>Se recomienda verificar la lengua materna del paciente</>
            )}
            <div style={{ marginTop: 4, fontSize: 11 }}>
              Asegure disponibilidad de intérprete o material en lengua indígena.
            </div>
          </div>
        )}
      </div>
      <AlertTriangle size={currentStyle.icon} style={{ color: '#E8921F', flexShrink: 0 }} />
    </div>
  );
};

export default BarreraLinguisticaAlert;