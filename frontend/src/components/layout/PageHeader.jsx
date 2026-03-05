import React from 'react';
import { cn } from '../ui/Badge';

/**
 * PageHeader — Cabecera sticky por módulo/página (medsys-v2.jsx §TopBar)
 * Diferente al global TopBar de navegación. Este es el header de contenido de cada vista.
 *
 * Props:
 *   title:    string | ReactNode
 *   subtitle: string | ReactNode (opcional)
 *   actions:  ReactNode (botones, badges, etc.)
 *   className: string
 */
export function PageHeader({ title, subtitle, actions, className }) {
    return (
        <div className={cn(
            "px-7 py-3.5 flex items-center justify-between",
            "border-b border-border bg-background/80",
            "sticky top-0 z-10 backdrop-blur-sm",
            className
        )}>
            <div>
                <h2 className="text-[17px] font-bold text-text-primary tracking-tight leading-none">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-xs text-text-secondary mt-0.5">
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
