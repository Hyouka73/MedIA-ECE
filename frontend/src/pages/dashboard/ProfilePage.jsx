import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Camera, LogOut, Loader2, UploadCloud } from 'lucide-react';
import apiClient from '../../api/client';
import { useToast } from '../../components/ui/Alert';
import { Avatar } from '../../components/ui/Avatar';

export default function ProfilePage() {
    const { user, logout, updateUser } = useAuth();
    const { addToast } = useToast();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            addToast('Por favor selecciona una imagen válida', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const { data } = await apiClient.post('/personas/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Actualizar contexto global
            if (data?.url_foto) {
                updateUser({ url_foto: data.url_foto });
                addToast('Foto de perfil actualizada exitosamente', 'success');
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            addToast(error.response?.data?.detail || 'Error al actualizar foto', 'error');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold font-display text-text-primary mb-6">Mi Perfil</h1>

            <div className="bg-white rounded-xl shadow-sm border border-border p-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">

                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none"></div>

                {/* Left Side: Avatar Upload */}
                <div className="flex flex-col items-center gap-4 relative z-10 w-full md:w-auto">
                    <div className="relative group cursor-pointer" onClick={() => !uploading && fileInputRef.current?.click()}>
                        <Avatar
                            nombre={user?.nombre}
                            url_foto={user?.url_foto}
                            className="w-32 h-32 text-4xl bg-primary-100 text-primary-700 ring-4 ring-white shadow-xl transition-transform group-hover:scale-105"
                        />

                        {/* Overlay on hover */}
                        <div className={`absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {uploading ? (
                                <Loader2 className="text-white animate-spin w-8 h-8" />
                            ) : (
                                <>
                                    <Camera className="text-white w-8 h-8 mb-1" />
                                    <span className="text-white text-xs font-medium">Cambiar</span>
                                </>
                            )}
                        </div>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="text-sm font-semibold text-primary hover:text-primary-600 transition-colors flex items-center justify-center gap-1.5 mx-auto"
                        >
                            <UploadCloud size={16} /> Subir nueva foto
                        </button>
                        <p className="text-xs text-text-secondary mt-1 max-w-[150px]">JPEG, PNG o GIF permitidos. Máximo 5MB.</p>
                    </div>
                </div>

                {/* Right Side: Datos */}
                <div className="flex-1 space-y-6 relative z-10 w-full">

                    <div className="space-y-4">
                        <h2 className="text-lg font-bold border-b border-border pb-2">Información de Cuenta</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Nombre Completo</label>
                                <div className="text-text-primary font-medium p-3 bg-background rounded-lg border border-border">
                                    {user?.nombre || "No especificado"}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Rol en Sistema</label>
                                <div className="text-text-primary font-medium p-3 bg-background rounded-lg border border-border truncate">
                                    {(user?.rol || "INVITADO").replace(/_/g, ' ')}
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Correo Electrónico</label>
                                <div className="text-text-primary font-medium p-3 bg-background rounded-lg border border-border truncate">
                                    {user?.email || "No especificado"}
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold uppercase text-text-secondary mb-1">Establecimiento Fijo</label>
                                <div className="text-text-primary font-medium p-3 bg-background rounded-lg border border-border truncate">
                                    {user?.establecimiento || "No especificado"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border flex justify-end">
                        <button
                            onClick={logout}
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 bg-semantic-error/10 text-semantic-error hover:bg-semantic-error/20 font-semibold rounded-lg transition-colors"
                        >
                            <LogOut size={18} />
                            Cerrar Sesión Activa
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
}