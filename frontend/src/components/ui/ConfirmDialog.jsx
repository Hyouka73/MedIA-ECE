import React from 'react';
import { cn } from './Badge';

/**
 * ConfirmDialog — Modal de confirmación para acciones destructivas o irreversibles
 * Construido sobre el dialog nativo accesible del browser (backdrop nativo).
 *
 * Props:
 *   open:          bool
 *   onClose:       () => void        — llamado al cerrar sin confirmar
 *   onConfirm:     () => void        — llamado al confirmar
 *   title:         string
 *   description:   string | ReactNode
 *   confirmLabel:  string   (default: "Confirmar")
 *   cancelLabel:   string   (default: "Cancelar")
 *   variant:       "danger" | "primary"  (default: "danger")
 *   isLoading:     bool
 */
export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = '¿Estás seguro?',
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
    isLoading = false,
}) {
    if (!open) return null;

    const confirmCls = variant === 'danger'
        ? "bg-[#BA2E45] border-[#BA2E45] text-white hover:brightness-105"
        : "bg-primary border-primary text-white hover:brightness-105";

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
            onClick={onClose}
        >
            {/* Panel */}
            <div
                className={cn(
                    "relative w-full max-w-sm bg-white rounded-2xl shadow-2xl",
                    "border border-border p-6 flex flex-col gap-4",
                    "animate-in fade-in zoom-in-95 duration-150"
                )}
                onClick={e => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-secondary hover:text-text-primary text-xl leading-none"
                    aria-label="Cerrar"
                >
                    ×
                </button>

                {/* Icon for danger */}
                {variant === 'danger' && (
                    <div className="w-12 h-12 rounded-full bg-[#FEF0F3] border border-[#FBDAE0] flex items-center justify-center mx-auto">
                        <span className="text-[#BA2E45] text-xl">!</span>
                    </div>
                )}

                <div className="text-center">
                    <h2 className="text-base font-bold text-text-primary leading-tight mb-1">
                        {title}
                    </h2>
                    {description && (
                        <p className="text-sm text-text-secondary leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>

                <div className="flex gap-2 mt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-text-primary hover:bg-background transition-colors disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "flex-1 h-10 rounded-lg border text-sm font-medium transition-all active:scale-[0.98]",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            confirmCls
                        )}
                    >
                        {isLoading ? '…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
