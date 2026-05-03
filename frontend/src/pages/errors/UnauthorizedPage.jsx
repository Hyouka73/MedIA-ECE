import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Home, Lock, ShieldX } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function UnauthorizedPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 antialiased text-text-primary">
            {/* Subtle medical background pattern or glow */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#1B4F8A 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="max-w-lg w-full relative z-10"
            >
                <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl border border-border text-center overflow-hidden relative">
                    {/* Decorative accent top bar */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-semantic-error" />

                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8 flex justify-center"
                    >
                        <div className="bg-semantic-error/10 w-20 h-20 rounded-2xl flex items-center justify-center">
                            <ShieldX size={44} className="text-semantic-error" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h1 className="text-7xl font-black text-text-primary/5 mb-[-2rem] select-none tracking-tighter">
                            403
                        </h1>
                        <h2 className="text-3xl font-bold text-text-primary mb-3">
                            Acceso Denegado
                        </h2>
                        <p className="text-text-secondary text-base mb-10 leading-relaxed max-w-sm mx-auto">
                            Tu rol actual no tiene permisos para visualizar este módulo o realizar esta acción. 
                            Por favor, verifica con el personal de sistemas.
                        </p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-3 justify-center"
                    >
                        <Button 
                            variant="secondary" 
                            className="px-6"
                            onClick={() => navigate(-1)}
                            icon={<ArrowLeft size={18} />}
                        >
                            Regresar
                        </Button>
                        <Button 
                            variant="primary"
                            className="px-6"
                            onClick={() => navigate('/dashboard')}
                            icon={<Home size={18} />}
                        >
                            Ir al Inicio
                        </Button>
                    </motion.div>

                    <div className="mt-12 pt-8 border-t border-border/50">
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-text-secondary/60 uppercase tracking-widest">
                            <Lock size={12} />
                            Entorno Clínico Protegido
                        </div>
                    </div>
                </div>

                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 text-center text-xs text-text-secondary"
                >
                    MedSys — Sistema de Gestión Clínica • 2026
                </motion.p>
            </motion.div>
        </div>
    );
}
