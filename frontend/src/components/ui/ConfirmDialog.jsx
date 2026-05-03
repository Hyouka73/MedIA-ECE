import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';

/**
 * ConfirmDialog — Modal de confirmación con diseño institucional.
 */
export function ConfirmDialog({ 
  open, 
  onClose, 
  onConfirm, 
  title = "Confirmar acción", 
  description = "¿Está seguro de realizar esta acción?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger", // danger | primary | warning
  loading = false
}) {
  const variantStyles = {
    danger: {
      icon: <AlertTriangle className="text-red-600" size={24} />,
      bg: "bg-red-50",
      button: "danger"
    },
    primary: {
      icon: <AlertTriangle className="text-blue-600" size={24} />,
      bg: "bg-blue-50",
      button: "primary"
    },
    warning: {
      icon: <AlertTriangle className="text-amber-600" size={24} />,
      bg: "bg-amber-50",
      button: "warning"
    }
  };

  const current = variantStyles[variant] || variantStyles.danger;

  return (
    <Dialog open={open} onClose={onClose} className="max-w-sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className={`p-4 rounded-full ${current.bg} mb-4`}>
          {current.icon}
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-8 px-2">
          {description}
        </p>

        <div className="flex flex-col w-full gap-2">
          <Button 
            variant={current.button} 
            onClick={onConfirm} 
            loading={loading}
            className="w-full justify-center py-3"
          >
            {confirmText}
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
            className="w-full justify-center py-3 border-gray-200"
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
