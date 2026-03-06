import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Users, ClipboardList, ShieldAlert, Settings, FileText } from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth();

    if (!user) return null;

    // Render condicional basado en Casos de Uso por Actor
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-text-primary">
                    Bienvenido, {user.nombre}
                </h2>
                <p className="text-text-secondary">
                    Estás accediendo bajo el rol de <span className="font-semibold text-primary">{user.rol}</span>
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* VISTAS CLÍNICAS */}
                {(user.rol === 'MEDICO_GENERAL' || user.rol === 'ESPECIALISTA' || user.rol === 'OMNIADMIN') && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Pacientes Pendientes</CardTitle>
                            <Users className="h-4 w-4 text-text-secondary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">12</div>
                            <p className="text-xs text-text-secondary mt-1">En sala de espera</p>
                        </CardContent>
                    </Card>
                )}

                {(user.rol === 'ENFERMERIA' || user.rol === 'OMNIADMIN') && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Toma de Signos</CardTitle>
                            <ClipboardList className="h-4 w-4 text-text-secondary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">5</div>
                            <p className="text-xs text-text-secondary mt-1">Pacientes en fila</p>
                        </CardContent>
                    </Card>
                )}

                {/* RECEPCIONISTA */}
                {(user.rol === 'RECEPCIONISTA' || user.rol === 'OMNIADMIN') && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Registro del Día</CardTitle>
                            <FileText className="h-4 w-4 text-text-secondary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">45</div>
                            <p className="text-xs text-text-secondary mt-1">Pacientes inscritos hoy</p>
                        </CardContent>
                    </Card>
                )}


                {/* SISTEMA & ADMIN */}
                {(user.rol === 'SUPERADMIN' || user.rol === 'ADMINISTRADOR' || user.rol === 'OMNIADMIN') && (
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Gestión Administrativa</CardTitle>
                            <Settings className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">3</div>
                            <p className="text-xs text-text-secondary mt-1">Solicitudes de personal nuevas</p>
                        </CardContent>
                    </Card>
                )}

                {(user.rol === 'AUDITOR_SEGURIDAD' || user.rol === 'OMNIADMIN') && (
                    <Card className="bg-red-50 border-red-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-semantic-error">Alertas de Seguridad</CardTitle>
                            <ShieldAlert className="h-4 w-4 text-semantic-error" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-semantic-error">2</div>
                            <p className="text-xs text-semantic-error/80 mt-1">Incidentes críticos pendientes de revisión</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="mt-8 pt-8 border-t border-border">
                <p className="text-sm text-text-secondary max-w-2xl">
                    Vista adaptativa generada según la matriz de accesos (Docs 3 y 6).
                    La estructura de componentes compartidos como este Dashboard está lista.
                </p>
            </div>
        </div>
    );
}
