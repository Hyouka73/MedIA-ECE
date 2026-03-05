import React from 'react';
import { cn } from './Badge';

export function Avatar({ nombre, className, role }) {
    const initials = nombre
        ? nombre.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
        : 'US';

    return (
        <div className={cn("rounded-full flex items-center justify-center font-bold uppercase", className)}>
            {initials}
        </div>
    );
}
