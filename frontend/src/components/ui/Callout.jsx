import React from 'react';
import { cn } from './Badge';

/**
 * Callout — Bloque de aviso normativo con barra lateral (medsys-v2.jsx §Callout)
 * Usado para avisos NOM-024, mensajes de riesgo legal, y confirmaciones críticas.
 *
 * Variants: info | warning | critical
 * Props:    level, title, children
 */
const VARIANTS = {
    info: {
        container: "bg-[#EEF3FB] border-l-[3px] border-l-[#2459A8]",
        icon: "bg-[#2459A8] text-white",
        iconLabel: "ℹ",
        title: "text-[#1A4080]",
        body: "text-[#1A4080]",
    },
    warning: {
        container: "bg-[#FEF4E4] border-l-[3px] border-l-[#B86E12]",
        icon: "bg-[#B86E12] text-white",
        iconLabel: "⚠",
        title: "text-[#8F540D]",
        body: "text-[#8F540D]",
    },
    critical: {
        container: "bg-[#FEF0F3] border-l-[3px] border-l-[#BA2E45]",
        icon: "bg-[#BA2E45] text-white",
        iconLabel: "!",
        title: "text-[#901F33]",
        body: "text-[#901F33]",
    },
};

export function Callout({ level = 'info', title, children, className }) {
    const v = VARIANTS[level] ?? VARIANTS.info;

    return (
        <div className={cn("rounded-r-lg p-3 flex gap-2.5", v.container, className)}>
            <span className={cn(
                "w-[18px] h-[18px] rounded-full flex-shrink-0 mt-0.5",
                "flex items-center justify-center",
                "text-[10px] font-extrabold leading-none",
                v.icon
            )}>
                {v.iconLabel}
            </span>
            <div>
                {title && (
                    <div className={cn("text-[12px] font-bold mb-0.5", v.title)}>
                        {title}
                    </div>
                )}
                <div className={cn("text-[12px] leading-relaxed", v.body)}>
                    {children}
                </div>
            </div>
        </div>
    );
}
