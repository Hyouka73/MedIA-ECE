import React, { useState, useEffect } from 'react'
import { Home, Users, FileText, ClipboardList, Send, FileBox, ShieldAlert, Settings, Shield, AlertCircle } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import apiClient from '../../api/client' // Importante para el token

const NAV_ITEMS = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', group: 'CLÍNICA', href: '/dashboard', roles: ['*'] },
    { id: 'pacientes', icon: Users, label: 'Pacientes', group: 'CLÍNICA', href: '/pacientes', roles: ['SUPERADMIN', 'OMNIADMIN', 'RECEPCIONISTA', 'MEDICO_GENERAL', 'ESPECIALISTA', 'ENFERMERIA', 'ESTADISTICA'] },
    { id: 'expediente', icon: FileText, label: 'Expediente', group: 'CLÍNICA', href: '/expediente', roles: ['SUPERADMIN', 'OMNIADMIN', 'MEDICO_GENERAL', 'ESPECIALISTA'] },
    { id: 'consulta', icon: ClipboardList, label: 'Consulta', group: 'CLÍNICA', href: '/consulta', roles: ['SUPERADMIN', 'OMNIADMIN', 'MEDICO_GENERAL', 'ESPECIALISTA', 'ENFERMERIA'] },
    { id: 'referencias', icon: Send, label: 'Referencias', group: 'CLÍNICA', href: '/referencias', roles: ['SUPERADMIN', 'OMNIADMIN', 'MEDICO_GENERAL', 'ESPECIALISTA'] },
    { id: 'documentos', icon: FileBox, label: 'Documentos', group: 'CLÍNICA', href: '/documentos', roles: ['SUPERADMIN', 'OMNIADMIN', 'MEDICO_GENERAL', 'ESPECIALISTA'] },
    
    { id: 'auditoria', icon: ShieldAlert, label: 'Auditoría', group: 'SISTEMA', href: '/audit/logs', roles: ['SUPERADMIN', 'OMNIADMIN', 'AUDITOR_SEGURIDAD'] },
    { id: 'admin', icon: Settings, label: 'Administración', group: 'SISTEMA', href: '/admin', roles: ['SUPERADMIN', 'OMNIADMIN', 'ADMINISTRADOR'] },
    { id: 'seguridad', icon: Shield, label: 'Seguridad', group: 'SISTEMA', href: '/audit/seguridad', roles: ['SUPERADMIN', 'OMNIADMIN', 'AUDITOR_SEGURIDAD'] },
]

export default function Sidebar() {
    const { pathname } = useLocation()
    const { user } = useAuth()
    const [hasCritical, setHasCritical] = useState(false)

    useEffect(() => {
        const checkCritical = async () => {
            try {
                // Usamos apiClient para incluir el token automáticamente
                const res = await apiClient.get('/incidentes/critical-check')
                setHasCritical(res.data.count > 0)
            } catch (e) {
                // Silenciamos el error en consola si es 401 para no saturar
                if (e.response?.status !== 401) {
                    console.error("Error en polling de seguridad:", e)
                }
            }
        }
        const timer = setInterval(checkCritical, 60000)
        checkCritical()
        return () => clearInterval(timer)
    }, [])

    const filterItems = (group) => {
        return NAV_ITEMS.filter(item => {
            if (item.group !== group) return false
            if (user?.rol === 'OMNIADMIN') return true
            if (item.roles.includes('*')) return true
            return item.roles.includes(user?.rol)
        })
    }

    const itemsClinica = filterItems('CLÍNICA')
    const itemsSistema = filterItems('SISTEMA')

    return (
        <aside className="w-[220px] bg-sidebar text-white flex-shrink-0 flex flex-col h-full transition-all border-r border-sidebar-hover hidden md:flex">
            <div className="h-14 flex items-center px-4 font-bold text-lg border-b border-sidebar-hover">
                <span className="text-white">Med<span className="text-primary-300">IA</span></span>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                {itemsClinica.length > 0 && (
                    <>
                        <div className="px-3 mb-2 text-xs font-semibold text-gray-400 tracking-wider uppercase">Clínica</div>
                        <ul className="space-y-1 px-2 mb-6">
                            {itemsClinica.map(item => {
                                const isActive = pathname.startsWith(item.href)
                                return (
                                    <li key={item.id}>
                                        <Link to={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-sidebar-hover text-white border-l-4 border-primary' : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'}`}>
                                            <item.icon size={18} />
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </>
                )}

                {itemsSistema.length > 0 && (
                    <>
                        <div className="px-3 mb-2 text-xs font-semibold text-gray-400 tracking-wider uppercase">Sistema</div>
                        <ul className="space-y-1 px-2">
                            {itemsSistema.map(item => {
                                const isActive = pathname.startsWith(item.href)
                                return (
                                    <li key={item.id}>
                                        <Link to={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-sidebar-hover text-white border-l-4 border-primary' : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'}`}>
                                            <item.icon size={18} />
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </>
                )}
            </nav>

            {hasCritical && (
                <div className="px-4 mb-2">
                    <div className="bg-[#DC2626] text-white text-[10px] font-black p-2 rounded flex items-center gap-2 animate-pulse uppercase">
                        <AlertCircle size={14} />
                        Incidente Crítico
                    </div>
                </div>
            )}

            <div className="border-t border-sidebar-hover text-white">
                <Link to="/perfil" className="p-4 flex flex-col gap-3 hover:bg-sidebar-hover transition-colors block cursor-pointer">
                    <div className="flex items-center gap-3">
                        <Avatar nombre={user?.nombre} url_foto={user?.url_foto} className="w-8 h-8 bg-primary text-xs flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-white">{user?.nombre || 'Usuario'}</p>
                            <p className="text-[10px] text-gray-400 truncate uppercase font-bold tracking-tight">
                                {user?.rol?.replace('_', ' ') || 'INVITADO'}
                            </p>
                        </div>
                    </div>
                </Link>
            </div>
        </aside>
    )
}