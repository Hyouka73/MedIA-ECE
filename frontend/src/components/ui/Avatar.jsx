import React from 'react';
import { cn } from './Badge';

export function Avatar({ nombre, url_foto, className, role }) {
    const initials = nombre
        ? nombre.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
        : 'US';

    if (url_foto) {
        return (
            <div className={cn("rounded-full flex items-center justify-center overflow-hidden", className)}>
                <img src={url_foto} alt="Avatar" className="w-full h-full object-cover" />
            </div>
        );
    }

    return (
        <div className={cn("rounded-full flex items-center justify-center font-bold uppercase", className)}>
            {initials}
        </div>
    );
}
