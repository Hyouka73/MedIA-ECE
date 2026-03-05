import React, { forwardRef } from 'react';
import { cn } from './Badge';

/**
 * Input — Campo de texto base con label, prefijo, sufijo y error (medsys-v2.jsx §Inp)
 *
 * Props: label, type, value, onChange, placeholder, error, prefix, suffix, autoFocus, className
 * prefix/suffix: ReactNode (icon or string shown inside the input box)
 */
export const Input = forwardRef(({
    className,
    type = 'text',
    label,
    error,
    prefix,
    suffix,
    ...props
}, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label className="text-[11px] font-semibold text-text-secondary tracking-[0.03em] uppercase">
                    {label}
                </label>
            )}
            <div className="relative flex items-center">
                {prefix && (
                    <span className="absolute left-3 text-text-secondary text-sm pointer-events-none flex items-center">
                        {prefix}
                    </span>
                )}
                <input
                    type={inputType}
                    ref={ref}
                    className={cn(
                        "flex w-full rounded-lg border bg-white text-sm text-text-primary",
                        "px-3 py-2 h-10",
                        "transition-all duration-150",
                        "placeholder:text-[#A9A097]",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                        error
                            ? "border-[#BA2E45] ring-2 ring-[#FBDAE0]"
                            : "border-border",
                        prefix ? "pl-9" : "",
                        (suffix || isPassword) ? "pr-10" : "",
                        className
                    )}
                    {...props}
                />

                {/* Suffix or Password Toggle */}
                <div className="absolute right-3 flex items-center gap-1.5">
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-[#A9A097] hover:text-text-primary transition-colors p-1"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            )}
                        </button>
                    )}
                    {suffix && (
                        <span className="text-text-secondary text-xs pointer-events-none flex items-center">
                            {suffix}
                        </span>
                    )}
                </div>
            </div>
            {error && (
                <span className="flex items-center gap-1 text-[11px] text-[#BA2E45] mt-0.5">
                    <span>⚠</span> {error}
                </span>
            )}
        </div>
    );
});
Input.displayName = 'Input';
