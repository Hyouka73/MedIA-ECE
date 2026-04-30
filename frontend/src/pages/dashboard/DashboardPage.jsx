import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Users, ClipboardList, ShieldAlert, Settings, FileText, Activity, Stethoscope, ChevronRight } from 'lucide-react';
import { clinicoAPI } from '../../api/clinico';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [pendientesSignos, setPendientesSignos] = useState([]);
    const [encuentrosConSignos, setEncuentrosConSignos] = useState([]);

    useEffect(() => {
        if (!user) return;

        if (user.rol === 'ENFERMERIA' || user.rol === 'OMNIADMIN') {
            clinicoAPI.getEncuentrosPendientesSignos()
                .then(res => setPendientesSignos(res.data.data.items || []))
                .catch(err => console.error(err));
        }

        if (user.rol === 'MEDICO_GENERAL' || user.rol === 'ESPECIALISTA' || user.rol === 'OMNIADMIN') {
            clinicoAPI.getEncuentrosConSignos()
                .then(res => setEncuentrosConSignos(res.data.data.items || []))
                .catch(err => console.error(err));
        }
    }, [user]);

    if (!user) return null;

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
                {/* VISTAS CLÍNICAS - MÉDICO */}
                {(user.rol === 'MEDICO_GENERAL' || user.rol === 'ESPECIALISTA' || user.rol === 'OMNIADMIN') && (
                    <Card className="col-span-1 md:col-span-2 lg:col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-50/50">
                            <CardTitle className="text-sm font-bold text-[#1B4F8A] flex items-center gap-2">
                                <Stethoscope size={16} /> Consultas por Retomar
                            </CardTitle>
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{encuentrosConSignos.length}</span>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {encuentrosConSignos.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No hay consultas pendientes con signos vitales tomados.</p>
                            ) : (
                                <div className="space-y-3">
                                    {encuentrosConSignos.map(enc => (
                                        <div key={enc.id_encuentro} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-colors group">
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{enc.paciente_nombre}</p>
                                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{enc.motivo_consulta}</p>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/consulta/nueva?id_encuentro=${enc.id_encuentro}&id_paciente=${enc.id_paciente}`)}
                                                className="text-[#1B4F8A] opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-blue-200 p-1.5 rounded-md hover:bg-blue-600 hover:text-white"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* VISTAS ENFERMERIA */}
                {(user.rol === 'ENFERMERIA' || user.rol === 'OMNIADMIN') && (
                    <Card className="col-span-1 md:col-span-2 lg:col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-green-50/50">
                            <CardTitle className="text-sm font-bold text-[#2D8653] flex items-center gap-2">
                                <Activity size={16} /> Pacientes para Triaje
                            </CardTitle>
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">{pendientesSignos.length}</span>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {pendientesSignos.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No hay pacientes esperando toma de signos.</p>
                            ) : (
                                <div className="space-y-3">
                                    {pendientesSignos.map(enc => (
                                        <div key={enc.id_encuentro} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:border-green-200 hover:bg-green-50/30 transition-colors group">
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{enc.paciente_nombre}</p>
                                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{enc.motivo_consulta}</p>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/consulta/triaje?id_encuentro=${enc.id_encuentro}&id_paciente=${enc.id_paciente}&motivo=${encodeURIComponent(enc.motivo_consulta)}`)}
                                                className="text-[#2D8653] opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-green-200 px-2 py-1 text-xs font-bold rounded-md hover:bg-[#2D8653] hover:text-white"
                                            >
                                                Tomar Signos
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
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
        </div>
    );
}
