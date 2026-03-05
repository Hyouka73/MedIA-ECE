import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Badge — Etiqueta semántica de estado (medsys-v2.jsx §Bdg)
 *
 * Variants: default | blue | amber | success | warning | error | navy
 * Props:    variant, dot (bool), children
 */
export function Badge({ children, variant = "default", dot = false, className, ...props }) {
    const variants = {
        // Sistema base (medsys-v2 colores)
        default: "bg-[#E2DDD4] text-[#605850]",
        blue: "bg-[#D4E1F5] text-[#1A4080]",
        amber: "bg-[#FAE2C2] text-[#C9720E]",
        success: "bg-[#C3E8D3] text-[#196038]",
        warning: "bg-[#FCECC8] text-[#8F540D]",
        error: "bg-[#FBDAE0] text-[#901F33]",
        navy: "bg-[#112B58] text-white",

        // Aliases semánticos clínicos (Doc7 §1.3)
        critica: "bg-[#FBDAE0] text-[#901F33] font-bold",
        moderada: "bg-[#FCECC8] text-[#8F540D] font-bold",
        firmada: "bg-[#C3E8D3] text-[#196038]",
        abierto: "bg-[#D4E1F5] text-[#1A4080]",
        info: "bg-[#D4E1F5] text-[#1A4080]",
    };

    const dotColor = {
        default: "#605850",
        blue: "#2459A8",
        amber: "#C9720E",
        success: "#237A4B",
        warning: "#B86E12",
        error: "#BA2E45",
        navy: "#fff",
        critica: "#BA2E45",
        moderada: "#B86E12",
        firmada: "#237A4B",
        abierto: "#2459A8",
        info: "#2459A8",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-[0.02em]",
                variants[variant] ?? variants.default,
                className
            )}
            {...props}
        >
            {dot && (
                <span
                    style={{ background: dotColor[variant] ?? dotColor.default }}
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                />
            )}
            {children}
        </span>
    );
}
