import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './Badge';

/**
 * Alert — Inline alert variations (medsys-v2.jsx §Callout style)
 * Variants: info | success | warning | error
 */
const ALERT_VARIANTS = {
    info: "bg-[#EEF3FB] border-[#2459A8] text-[#1A4080] icon-bg-[#2459A8]",
    success: "bg-[#E6F4EA] border-[#237A4B] text-[#196038] icon-bg-[#237A4B]",
    warning: "bg-[#FEF4E4] border-[#B86E12] text-[#8F540D] icon-bg-[#B86E12]",
    error: "bg-[#FEF0F3] border-[#BA2E45] text-[#901F33] icon-bg-[#BA2E45]",
};

const ALERT_ICONS = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '!',
};

export function Alert({ variant = 'info', title, icon, countdown, initialCountdown, children, className, ...props }) {
    const v = ALERT_VARIANTS[variant] ?? ALERT_VARIANTS.info;
    const iconLabel = icon ?? ALERT_ICONS[variant] ?? ALERT_ICONS.info;
    const iconBg = v.match(/icon-bg-\[(#[a-zA-Z0-9]+)\]/)?.[1] || '#2459A8';

    return (
        <div
            className={cn(
                "relative w-full rounded-xl border-l-[4px] p-4 flex gap-3 shadow-md overflow-hidden transition-all duration-300",
                v,
                className
            )}
            role="alert"
            {...props}
        >
            <span
                style={{ backgroundColor: iconBg }}
                className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white mt-0.5"
            >
                {iconLabel}
            </span>
            <div className="flex-1">
                {title && <div className="font-bold text-sm mb-0.5 leading-tight">{title}</div>}
                <div className="text-sm leading-relaxed">{children}</div>
            </div>

            {/* Progress bar for countdown if applicable */}
            {countdown !== undefined && (
                <div className="absolute bottom-0 left-0 h-1 bg-black/10 w-full overflow-hidden">
                    <motion.div
                        initial={{ scaleX: 1 }}
                        animate={{ scaleX: 0 }}
                        transition={{ duration: initialCountdown || countdown, ease: "linear" }}
                        style={{ originX: 0, backgroundColor: iconBg }}
                        className="h-full opacity-80"
                    />
                </div>
            )}
        </div>
    );
}

export function AlertDescription({ children, className }) {
    return <div className={cn("text-xs mt-1 opacity-90", className)}>{children}</div>;
}

// ─────────────────────────────────────────────
// TOAST SYSTEM (Real alerts that float)
// ─────────────────────────────────────────────

const ToastContext = createContext(null);

const MAX_TOASTS = 2;
const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]); // Active on screen
    const [queue, setQueue] = useState([]);   // Waiting in line

    const removeToast = useCallback((id) => {
        setToasts(prev => {
            const toast = prev.find(t => t.id === id);
            // Ejecutar callback si existe. Nunca correrá dos veces porque 
            // inmediatemente después de esto el toast es removido del array.
            if (toast && toast.onExpire) {
                toast.onExpire();
            }
            return prev.filter(t => t.id !== id);
        });
    }, []);

    const addToast = useCallback((msg, variant = 'info', options = {}) => {
        const opts = typeof options === 'number' ? { duration: options } : options;
        const { duration = DEFAULT_DURATION, countdown, onExpire } = opts;
        const id = Date.now() + Math.random();

        setQueue(prev => [...prev, { id, msg, variant, duration, countdown, initialCountdown: countdown, onExpire }]);
    }, []);

    // Promo queue to active toasts
    useEffect(() => {
        if (toasts.length < MAX_TOASTS && queue.length > 0) {
            const nextToast = queue[0];
            setQueue(prev => prev.slice(1));
            setToasts(prev => [...prev, { ...nextToast }]);

            // Start timer ONLY when it becomes active
            if (nextToast.countdown === undefined) {
                setTimeout(() => removeToast(nextToast.id), nextToast.duration);
            }
        }
    }, [toasts.length, queue, removeToast]);

    // Timer logic for countdown toasts (only for active ones)
    useEffect(() => {
        const interval = setInterval(() => {
            setToasts(prev => {
                let changed = false;
                const next = prev.map(t => {
                    if (t.countdown !== undefined && t.countdown > 0 && !t.expired) {
                        changed = true;
                        return { ...t, countdown: t.countdown - 1 };
                    }
                    if (t.countdown === 0 && !t.expired) {
                        changed = true;
                        setTimeout(() => removeToast(t.id), 0);
                        return { ...t, expired: true };
                    }
                    return t;
                });

                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {/* Toaster Container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map(t => (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, x: 50, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="pointer-events-auto"
                        >
                            <Alert
                                variant={t.variant}
                                countdown={t.countdown}
                                initialCountdown={t.initialCountdown}
                                onClick={() => removeToast(t.id)}
                                className="cursor-pointer shadow-xl border border-border/10"
                            >
                                {t.msg}
                            </Alert>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context.addToast;
}
