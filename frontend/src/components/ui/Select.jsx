import React, { forwardRef } from 'react';
import { cn } from './Badge';

/**
 * Select — Selector nativo estilizado con label y error (medsys-v2.jsx design tokens)
 *
 * Props: label, value, onChange, options [{value, label}], placeholder, error, className
 */
export const Select = forwardRef(({
    className,
    label,
    error,
    options = [],
    placeholder,
    ...props
}, ref) => {
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label className="text-[11px] font-semibold text-text-secondary tracking-[0.03em] uppercase">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    ref={ref}
                    className={cn(
                        "flex w-full rounded-lg border bg-white text-sm text-text-primary",
                        "px-3 py-2 h-10 pr-9 appearance-none",
                        "transition-all duration-150",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                        error
                            ? "border-[#BA2E45] ring-2 ring-[#FBDAE0]"
                            : "border-border",
                        className
                    )}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {/* Chevron icon */}
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </div>
            {error && (
                <span className="flex items-center gap-1 text-[11px] text-[#BA2E45] mt-0.5">
                    <span>⚠</span> {error}
                </span>
            )}
        </div>
    );
});
Select.displayName = 'Select';
