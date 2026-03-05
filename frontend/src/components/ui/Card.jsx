import React from 'react';
import { cn } from './Badge';

export function Card({ className, ...props }) {
    return (
        <div className={cn("rounded-xl border border-border bg-white text-text-primary shadow-sm", className)} {...props} />
    )
}

export function CardHeader({ className, ...props }) {
    return (
        <div className={cn("flex flex-col space-y-1.5 p-6 border-b border-border/50", className)} {...props} />
    )
}

export function CardTitle({ className, ...props }) {
    return (
        <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
    )
}

export function CardContent({ className, ...props }) {
    return (
        <div className={cn("p-6 pt-6", className)} {...props} />
    )
}
