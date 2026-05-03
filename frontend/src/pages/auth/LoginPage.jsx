import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, Lock } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { OtpInput } from '../../components/ui/OtpInput';
import { useToast } from '../../components/ui/Alert';

export default function LoginPage() {
    const { login, verify2FA } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [step, setStep] = useState(1); // 1 = Credenciales, 2 = 2FA OTP
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [tempToken, setTempToken] = useState(null);
    const [isLocked, setIsLocked] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (step === 2 && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [step, timeLeft]);

    const resetForm = () => {
        setStep(1);
        setOtp('');
        setTempToken(null);
        setLoading(false);
        setIsLocked(false);
    };

    const handleError = (err) => {
        const msg = err.response?.data?.detail || 'Error en la operación.';
        const msgLower = msg.toLowerCase();

        // Clasificar tipo de bloqueo según texto del backend
        const isPermanent = msgLower.includes('permanentemente') ||
            msgLower.includes('desactivada') ||
            msgLower.includes('auditoría');

        const isTemporary = msgLower.includes('bloquead') ||
            msgLower.includes('minutos') ||
            msgLower.includes('intente');

        if (isPermanent) {
            setIsLocked(true);
            // Bloqueo definitivo: se muestra el mensaje y la pantalla queda bloqueada sin limpiar
            toast(msg, 'error');
        } else if (isTemporary) {
            setIsLocked(true);
            // Bloqueo temporal: mensaje (que incluye el tiempo real) con un timer visual (6s) para luego permitir reintentar con otra cuenta
            toast(msg, 'error', {
                countdown: 6,
                onExpire: () => resetForm()
            });
        } else {
            toast(msg, 'error');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await login(email, password);
            
            if (!res.totp_configured) {
                // Si no tiene TOTP configurado, lo mandamos a configurar (ya tiene token completo)
                toast('Configuración de seguridad requerida.', 'info');
                navigate('/2fa/setup');
                return;
            }

            if (res.requires_2fa) {
                setTempToken(res.tempToken);
                setStep(2);
                setTimeLeft(30);
                toast('Ingrese su código de autenticación.', 'info');
            } else {
                toast('Inicio de sesión exitoso.', 'success');
                navigate('/dashboard');
            }
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const handle2FA = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) return;

        setLoading(true);
        try {
            const success = await verify2FA(tempToken, otp);
            if (success) {
                toast('Identidad verificada.', 'success');
                navigate('/dashboard');
            }
        } catch (err) {
            handleError(err);
            setOtp('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 antialiased text-text-primary">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-border p-8 overflow-hidden relative">

                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="MedSys Logo" className="w-10 h-10 object-contain" />
                        <span className="text-2xl font-bold tracking-tight">Med<span className="text-primary">Sys</span></span>
                    </div>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            label="Correo Electrónico"
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="usuario@imss.gob.mx"
                            disabled={loading || isLocked}
                        />
                        <Input
                            label="Contraseña"
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading || isLocked}
                        />
                        <Button type="submit" full isLoading={loading} disabled={isLocked}>
                            Continuar →
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handle2FA} className="space-y-4">
                        <div className="text-center mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#EEF3FB] border border-[#D4E1F5] flex items-center justify-center text-3xl mx-auto mb-4">
                                🔐
                            </div>
                            <p className="text-sm font-semibold text-text-primary">Verificación en dos pasos</p>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                                Ingresa los 6 dígitos generados por tu aplicación de autenticación.
                            </p>
                        </div>
                        <OtpInput
                            value={otp}
                            onChange={setOtp}
                            autoFocus
                            disabled={loading || isLocked}
                        />
                        <Button
                            type="submit"
                            full
                            isLoading={loading}
                            disabled={otp.length < 6 || isLocked}
                        >
                            Verificar y entrar ✓
                        </Button>
                        <p className="w-full text-center pt-2">
                            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">
                                El código se actualiza automáticamente cada 30s
                            </span>
                        </p>
                        <button
                            type="button"
                            onClick={() => { setStep(1); setOtp(''); }}
                            className="w-full text-xs text-text-secondary hover:text-text-primary text-center pt-2"
                            disabled={isLocked}
                        >
                            ← Regresar
                        </button>
                    </form>
                )}
            </div>
            <p className="mt-8 text-xs text-text-secondary text-center max-w-sm">
                Sistema de Expediente Clínico Electrónico MedSys. Acceso restringido y auditado.
            </p>
        </div>
    );
}

