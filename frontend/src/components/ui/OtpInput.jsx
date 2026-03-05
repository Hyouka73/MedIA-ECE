import React, { useRef, forwardRef } from 'react';
import { cn } from './Badge';

/**
 * OtpInput — 6 inputs separados para código TOTP / OTP (medsys-v2.jsx §Login 2FA)
 *
 * Props:
 *   value: string (máx 6 chars, se divide en chars individualmente)
 *   onChange: (newValue: string) => void  — siempre emite el string completo de 6 chars
 *   autoFocus: bool
 *   disabled: bool
 *   className: string (aplicado a cada input)
 */
export function OtpInput({ value = '', onChange, autoFocus = false, disabled = false, className }) {
    const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');
    const refs = useRef([]);

    const handleChange = (index, raw) => {
        if (!/^[0-9]*$/.test(raw)) return;
        const char = raw.slice(-1); // tomar solo el último char
        const next = [...digits];
        next[index] = char;
        onChange?.(next.join(''));

        if (char && index < 5) {
            refs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            refs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange?.(pasted.padEnd(6, '').slice(0, 6));
        const focusIdx = Math.min(pasted.length, 5);
        refs.current[focusIdx]?.focus();
    };

    return (
        <div className="flex gap-2 justify-center">
            {digits.map((digit, index) => (
                <input
                    key={index}
                    ref={el => refs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    disabled={disabled}
                    autoFocus={autoFocus && index === 0}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={cn(
                        "w-12 h-14 rounded-lg border text-center text-2xl font-bold",
                        "transition-all duration-150",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        digit
                            ? "border-primary bg-[#EEF3FB] text-text-primary"
                            : "border-border bg-white text-text-primary",
                        className
                    )}
                />
            ))}
        </div>
    );
}
