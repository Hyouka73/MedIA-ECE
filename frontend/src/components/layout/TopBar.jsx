import React from 'react'
import { Bell, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'

export default function TopBar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <header className="h-14 bg-white border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-10 shadow-sm">
            <div className="flex-1 min-w-0 flex items-center gap-4">
                {/* Titulo dinámico (CLUES / Expediente) */}
                <div>
                    <h1 className="text-sm font-semibold text-text-primary leading-none">Distrito de Salud I</h1>
                    <p className="text-xs text-text-secondary mt-1">CS Tuxtla Gutiérrez • Turno Matutino</p>
                </div>
            </div>

            <div className="flex items-center gap-3 ml-4">
                <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-full transition-colors relative">
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-semantic-error rounded-full border border-white"></span>
                </button>
                <div className="h-6 w-px bg-border mx-1"></div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 p-1.5 rounded-md text-sm text-text-primary">
                        <Avatar nombre={user?.nombre} className="w-7 h-7 bg-primary-hover text-white text-xs" />
                        <div className="hidden sm:block">
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

