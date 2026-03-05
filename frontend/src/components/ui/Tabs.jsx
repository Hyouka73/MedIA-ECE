import React from 'react';
import { cn } from './Badge';

/**
 * Tabs — Barra de pestañas con underline activo (medsys-v2.jsx §Patients)
 *
 * Props:
 *   tabs: string[] — labels de las pestañas
 *   value: string  — tab activo
 *   onChange: (tab: string) => void
 *   className: string (aplicado al contenedor)
 */
export function Tabs({ tabs = [], value, onChange, className }) {
    return (
        <div className={cn("flex gap-0 border-b border-border", className)}>
            {tabs.map((tab) => {
                const isActive = tab === value;
                return (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => onChange?.(tab)}
                        className={cn(
                            "px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all duration-150",
                            "focus-visible:outline-none",
                            isActive
                                ? "text-primary border-primary font-semibold"
                                : "text-text-secondary border-transparent hover:text-text-primary"
                        )}
                    >
                        {tab}
                    </button>
                );
            })}
        </div>
    );
}
