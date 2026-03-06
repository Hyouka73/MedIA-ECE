import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from './Badge';

/**
 * Dialog (Modal) — Componente base reutilizable
 * Uso: <Dialog open={isOpen} onClose={() => setIsOpen(false)} title="Crear Paciente">
 *        <form>...</form>
 *      </Dialog>
 */
export function Dialog({ open, onClose, title, description, children, className }) {
    const dialogRef = useRef(null);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    // Cerrar con ESC
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose?.(); };
        if (open) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
                onClick={onClose}
            />
            {/* Panel */}
            <div
                ref={dialogRef}
                className={cn(
                    "relative z-10 bg-white rounded-xl shadow-2xl border border-border w-full max-w-lg mx-4 animate-in zoom-in-95 fade-in duration-200",
                    className
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-3">
                    <div>
                        {title && <h2 className="text-lg font-semibold text-text-primary">{title}</h2>}
                        {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-background rounded-full transition-colors text-text-secondary"
                    >
                        <X size={18} />
                    </button>
                </div>
                {/* Body */}
                <div className="px-6 pb-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function DialogFooter({ children, className }) {
    return (
        <div className={cn("flex justify-end gap-2 mt-4 pt-4 border-t border-border", className)}>
            {children}
        </div>
    );
}
