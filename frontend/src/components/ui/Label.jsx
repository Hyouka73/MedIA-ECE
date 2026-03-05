import React, { forwardRef } from 'react';
import { cn } from './Badge';

export const Label = forwardRef(({ className, ...props }, ref) => (
    <label
        ref={ref}
        className={cn(
            "text-sm font-medium leading-none text-text-secondary peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1 block",
            className
        )}
        {...props}
    />
));
Label.displayName = 'Label';
