import React, { forwardRef } from 'react';
import { cn } from './Badge';

/**
 * Textarea — Área de texto redimensionable con label y error (medsys-v2.jsx §TA)
 *
 * Props: label, value, onChange, placeholder, rows, error, className
 */
export const Textarea = forwardRef(({
    className,
    label,
    error,
    rows = 3,
    ...props
}, ref) => {
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label className="text-[11px] font-semibold text-text-secondary tracking-[0.03em] uppercase">
                    {label}
                </label>
            )}
            <textarea
                ref={ref}
                rows={rows}
                className={cn(
                    "flex w-full rounded-lg border bg-white text-sm text-text-primary",
                    "px-3 py-2.5",
                    "resize-vertical leading-relaxed",
                    "transition-all duration-150",
                    "placeholder:text-[#A9A097]",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                    error
                        ? "border-[#BA2E45] ring-2 ring-[#FBDAE0]"
                        : "border-border",
                    className
                )}
                {...props}
            />
            {error && (
                <span className="flex items-center gap-1 text-[11px] text-[#BA2E45] mt-0.5">
                    <span>⚠</span> {error}
                </span>
            )}
        </div>
    );
});
Textarea.displayName = 'Textarea';
