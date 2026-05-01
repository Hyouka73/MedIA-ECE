import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Copy, Check, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Alert';
import apiClient from '../../api/client';

export default function Setup2FA() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    
    const [setupData, setSetupData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchSetup = async () => {
            try {
                const res = await apiClient.post('/auth/2fa/setup');
                setSetupData(res.data);
            } catch (err) {
                console.error('2FA Setup Error:', err);
                const detail = err.response?.data?.detail || 'Error de conexión';
                toast(`Error: ${detail}`, 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSetup();
    }, []);

    const handleCopy = () => {
        if (!setupData?.secret_key) return;
        navigator.clipboard.writeText(setupData.secret_key);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast('Clave copiada al portapapeles', 'success');
    };

    const handleComplete = () => {
        updateUser({ totp_configured: true });
        toast('2FA configurado correctamente', 'success');
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 antialiased text-text-primary">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-border p-8 overflow-hidden relative">
                
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={32} className="text-primary" />
                        <span className="text-2xl font-bold tracking-tight">Med<span className="text-primary">IA</span></span>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-text-primary">Configura tu Seguridad</h2>
                    <p className="text-sm text-text-secondary mt-2">
                        Para proteger tu cuenta, es necesario configurar la autenticación en dos pasos.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Paso 1: Escaneo QR */}
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col items-center">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Paso 1: Escanear QR</div>
                        {setupData?.provisioning_uri && (
                            <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                                <QRCodeSVG 
                                    value={setupData.provisioning_uri} 
                                    size={180}
                                    includeMargin={true}
                                    level="M"
                                />
                            </div>
                        )}
                        <p className="text-xs text-text-secondary mt-4 text-center leading-relaxed">
                            Abre Google Authenticator o tu app preferida y escanea el código superior.
                        </p>
                    </div>

                    {/* Paso 2: Backup Key */}
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Paso 2: Llave de Respaldo</div>
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-3">
                            <code className="flex-1 font-mono text-sm font-bold text-primary break-all">
                                {setupData?.secret_key}
                            </code>
                            <button 
                                onClick={handleCopy}
                                className="p-2 hover:bg-slate-50 rounded-md transition-colors text-slate-400 hover:text-primary"
                                title="Copiar llave"
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-text-secondary mt-2 leading-relaxed">
                            Guarda esta llave en un lugar seguro. Te servirá si pierdes acceso a tu dispositivo.
                        </p>
                    </div>

                    <Button full size="lg" onClick={handleComplete} className="group">
                        ¡Listo, ya lo tengo! <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
            
            <p className="mt-8 text-xs text-text-secondary text-center max-w-sm">
                Al completar este paso, tu cuenta estará protegida con autenticación multifactor (MFA).
            </p>
        </div>
    );
}
