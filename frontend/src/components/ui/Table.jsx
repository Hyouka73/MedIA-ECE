import React from 'react';
import { cn } from './Badge';

/**
 * Table — Componente base composable para tablas paginadas (Doc7 §4)
 * Uso: <Table>
 *        <TableHeader><TableRow><TableHead>Nombre</TableHead></TableRow></TableHeader>
 *        <TableBody><TableRow><TableCell>Dr. López</TableCell></TableRow></TableBody>
 *      </Table>
 */
export function Table({ className, children, ...props }) {
    return (
        <div className="w-full overflow-auto rounded-lg border border-border">
            <table className={cn("w-full caption-bottom text-sm", className)} {...props}>
                {children}
            </table>
        </div>
    );
}

export function TableHeader({ className, children, ...props }) {
    return <thead className={cn("bg-background/50", className)} {...props}>{children}</thead>;
}

export function TableBody({ className, children, ...props }) {
    return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props}>{children}</tbody>;
}

export function TableRow({ className, children, ...props }) {
    return (
        <tr
            className={cn("border-b border-border transition-colors hover:bg-background/30", className)}
            {...props}
        >
            {children}
        </tr>
    );
}

export function TableHead({ className, children, ...props }) {
    return (
        <th
            className={cn(
                "h-10 px-4 text-left align-middle font-semibold text-text-secondary text-xs uppercase tracking-wider",
                className
            )}
            {...props}
        >
            {children}
        </th>
    );
}

export function TableCell({ className, children, ...props }) {
    return (
        <td className={cn("px-4 py-3 align-middle text-sm text-text-primary", className)} {...props}>
            {children}
        </td>
    );
}
