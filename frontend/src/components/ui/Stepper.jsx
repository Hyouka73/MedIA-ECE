import React from 'react';
import { cn } from './Badge';

/**
 * Stepper — Indicador de pasos horizontal para flujos multi-paso (medsys-v2.jsx §Consult)
 * Usado en Consulta SOAP (S → O → A → P → Firma).
 *
 * Props:
 *   steps: { key: string, label: string, desc?: string }[]
 *   current: number (index 0-based del paso activo)
 *   onStep: (index: number) => void (opcional, para navegación directa a un paso)
 */
export function Stepper({ steps = [], current = 0, onStep, className }) {
    return (
        <div className={cn("flex items-center bg-white border border-border rounded-xl p-4", className)}>
            {steps.map((step, i) => {
                const isDone = i < current;
                const isActive = i === current;
                const isLast = i === steps.length - 1;

                return (
                    <div key={step.key ?? i} className={cn("flex items-center", !isLast && "flex-1")}>
                        {/* Step node */}
                        <div className="flex flex-col items-center gap-1">
                            <button
                                type="button"
                                onClick={() => onStep?.(i)}
                                className={cn(
                                    "w-9 h-9 rounded-full border-2 flex items-center justify-center",
                                    "text-xs font-bold transition-all duration-150",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                                    isDone && "bg-[#237A4B] border-[#237A4B] text-white",
                                    isActive && "bg-primary  border-primary  text-white shadow-[0_0_0_4px_#D4E1F5]",
                                    !isDone && !isActive && "bg-[#E2DDD4] border-transparent text-[#877E74]",
                                    onStep ? "cursor-pointer" : "cursor-default"
                                )}
                            >
                                {isDone ? '✓' : step.key}
                            </button>
                            <div className="text-center min-w-[56px]">
                                <div className={cn(
                                    "text-[11px] font-semibold leading-none",
                                    isActive ? "text-primary" : "text-text-secondary"
                                )}>
                                    {step.label}
                                </div>
                                {step.desc && (
                                    <div className="text-[9.5px] text-[#A9A097] mt-0.5">
                                        {step.desc}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Connector line */}
                        {!isLast && (
                            <div className={cn(
                                "flex-1 h-0.5 mx-1.5 mb-5 transition-colors duration-300",
                                isDone ? "bg-[#237A4B]" : "bg-[#E2DDD4]"
                            )} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
