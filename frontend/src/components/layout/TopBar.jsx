import React, { useState, useEffect, useRef } from 'react'
import { Bell, LogOut, Menu, ShieldAlert, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'
import apiClient from '../../api/client'

export default function TopBar({ onMenuToggle }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState([])
    const dropdownRef = useRef(null)

    const isAdmin = user?.rol === 'ADMINISTRADOR' || user?.rol === 'SUPERADMIN' || user?.rol === 'OMNIADMIN'

    useEffect(() => {
        if (showNotifications && isAdmin) {
            fetchNotifications()
        }
    }, [showNotifications])

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const fetchNotifications = async () => {
        try {
            const { data } = await apiClient.get('/auditoria/incidentes/criticos?limit=5')
            setNotifications(data.items || [])
        } catch (error) {
            console.error("Error fetching notifications:", error)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <header className="h-14 bg-white border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-20 shadow-sm relative">
            <div className="flex-1 min-w-0 flex items-center gap-3">
                <button 
                  onClick={onMenuToggle}
                  className="p-2 -ml-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-md md:hidden transition-colors"
                >
                  <Menu size={20} />
                </button>
                
                <div className="hidden xs:block">
                    <h1 className="text-sm font-semibold text-text-primary leading-none">Distrito de Salud I</h1>
                    <p className="text-xs text-text-secondary mt-1">CS Tuxtla Gutiérrez • Turno Matutino</p>
                </div>
            </div>

            <div className="flex items-center gap-3 ml-4">
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-background text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-background'}`}
                    >
                        <Bell size={18} />
                        {isAdmin && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-semantic-error rounded-full border border-white"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white border border-border rounded-lg shadow-xl overflow-hidden z-30">
                            <div className="p-3 border-b border-border bg-background flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Notificaciones</span>
                                {isAdmin && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">ALERTA DE SEGURIDAD</span>}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map((n, i) => (
                                        <div key={i} className="p-3 border-b border-border last:border-0 hover:bg-slate-50 transition-colors cursor-pointer">
                                            <div className="flex gap-3">
                                                <div className="mt-1 text-semantic-error">
                                                    <ShieldAlert size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-text-primary">{n.tipo_evento}</p>
                                                    <p className="text-[11px] text-text-secondary mt-0.5">{n.modulo_funcion}</p>
                                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-text-muted">
                                                        <Clock size={10} />
                                                        {new Date(n.timestamp_evento).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center">
                                        <Bell size={24} className="mx-auto text-text-muted mb-2 opacity-20" />
                                        <p className="text-xs text-text-secondary">No tienes notificaciones pendientes</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-2 border-t border-border bg-slate-50 text-center">
                                <button 
                                    onClick={() => { setShowNotifications(false); navigate('/auditoria'); }}
                                    className="text-[11px] font-semibold text-primary hover:underline"
                                >
                                    Ver todo el historial
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-border mx-1"></div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 p-1.5 rounded-md text-sm text-text-primary">
                        <Avatar nombre={user?.nombre} url_foto={user?.url_foto} className="w-7 h-7 bg-primary-hover text-white text-xs flex-shrink-0" />
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-medium leading-none">{user?.nombre || 'Usuario'}</p>
                            <p className="text-[10px] text-text-secondary uppercase tracking-tight mt-0.5">
                                {user?.rol?.replace('_', ' ') || 'INVITADO'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-text-secondary hover:text-semantic-error hover:bg-red-50 rounded-full transition-colors ml-1"
                        title="Cerrar sesión"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    )
}

