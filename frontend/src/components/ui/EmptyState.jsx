import React from 'react';
import { cn } from './Badge';

/**
 * EmptyState — Placeholder centrado para listas y tablas vacías
 *
 * Props:
 *   icon:        ReactNode  — ícono grande (emoji, lucide, etc.)
 *   title:       string     — título corto
 *   description: string     — texto de apoyo (opcional)
 *   action:      ReactNode  — botón o link de acción (opcional)
 *   className:   string
 */
export function EmptyState({ icon, title, description, action, className }) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center text-center",
            "py-16 px-6 gap-3",
            className
        )}>
            {icon && (
                <span className="text-4xl select-none">{icon}</span>
            )}
            {title && (
                <p className="text-sm font-semibold text-text-primary mt-1">{title}</p>
            )}
            {description && (
                <p className="text-xs text-text-secondary max-w-xs leading-relaxed">{description}</p>
            )}
            {action && (
                <div className="mt-2">{action}</div>
            )}
        </div>
    );
}
