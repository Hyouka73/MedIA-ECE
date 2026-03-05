import React from 'react';
import { cn } from './Badge';
import { Spinner } from './Spinner';

/**
 * Button — Componente base con 8 variantes y 4 tamaños (medsys-v2.jsx §Btn)
 *
 * Variants: primary | secondary | accent | success | danger | ghost | outline | dark
 * Sizes:    xs | sm | md (default) | lg
 * Props:    variant, size, full, disabled, isLoading, icon (ReactNode), children
 */
export function Button({
    className,
    variant = 'primary',
    size = 'md',
    full = false,
    disabled = false,
    isLoading = false,
    icon,
    children,
    ...props
}) {
    const base = [
        "inline-flex items-center justify-center gap-1.5",
        "font-medium rounded-md border tracking-[0.01em]",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
        "active:scale-[0.98]",
        "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
        full ? "w-full" : "",
    ].join(" ");

    const variants = {
        primary: "bg-primary   border-primary   text-white shadow-sm hover:brightness-110",
        secondary: "bg-white     border-border     text-primary hover:bg-background shadow-sm",
        accent: "bg-[#E8921F] border-[#E8921F] text-white shadow-sm hover:brightness-110",
        success: "bg-semantic-success border-semantic-success text-white shadow-sm hover:brightness-105",
        danger: "bg-semantic-error border-semantic-error text-white shadow-sm hover:brightness-105",
        ghost: "bg-transparent border-transparent text-text-secondary hover:bg-background hover:text-text-primary",
        outline: "bg-transparent border-border text-text-primary hover:bg-background",
        dark: "bg-[#2C2620]  border-[#2C2620] text-white shadow-sm hover:brightness-110",
    };

    const sizes = {
        xs: "h-7  px-2.5 text-[11px] rounded",
        sm: "h-8  px-3   text-xs",
        md: "h-10 px-4   text-sm",
        lg: "h-11 px-6   text-sm",
    };

    return (
        <button
            className={cn(base, variants[variant] ?? variants.primary, sizes[size] ?? sizes.md, className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading
                ? <Spinner className="w-4 h-4" />
                : icon && <span className="flex-shrink-0">{icon}</span>
            }
            {children}
        </button>
    );
}
