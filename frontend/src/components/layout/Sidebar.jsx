import React, { useState, useEffect } from 'react'
import {
  Home,
  Users,
  FileText,
  ClipboardList,
  Send,
  FileBox,
  ShieldAlert,
  Settings,
  AlertCircle,
  X,
  User,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import apiClient from '../../api/client'

const NAV_ITEMS = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', group: 'GLOBAL', href: '/dashboard', public: true },
    { id: 'pacientes', icon: Users, label: 'Pacientes', group: 'GLOBAL', href: '/pacientes', moduleCode: 'PACIENTES', hideForRoles: ['AUDITOR_SEGURIDAD'] },
    { id: 'referencias', icon: Send, label: 'Referencias', group: 'GLOBAL', href: '/referencias', moduleCode: 'ENCUENTROS', hideForRoles: ['ENFERMERIA', 'RECEPCIONISTA', 'ADMINISTRADOR', 'AUDITOR_SEGURIDAD'] },
    
    // Rutas de Contexto de Paciente
    { id: 'expediente', icon: FileText, label: 'Expediente', group: 'PACIENTE', href: '/expediente', moduleCode: 'EXPEDIENTE', requiresPatientFlow: true },
    { id: 'consulta', icon: ClipboardList, label: 'Consulta', group: 'PACIENTE', href: '/consulta', moduleCode: 'ENCUENTROS', requiresPatientFlow: true, hideForRoles: ['ENFERMERIA', 'RECEPCIONISTA', 'ADMINISTRADOR', 'AUDITOR_SEGURIDAD'] },
    { id: 'documentos', icon: FileBox, label: 'Estudios/Docs', group: 'PACIENTE', href: '/documentos', moduleCode: 'ESTUDIOS', requiresPatientFlow: true, hideForRoles: ['RECEPCIONISTA', 'ADMINISTRADOR', 'AUDITOR_SEGURIDAD'] },
    { id: 'recetas', icon: AlertCircle, label: 'Recetas', group: 'PACIENTE', href: '/pacientes/:id/recetas', moduleCode: 'RECETAS', requiresPatientFlow: true, hideForRoles: ['ENFERMERIA', 'RECEPCIONISTA', 'ADMINISTRADOR', 'AUDITOR_SEGURIDAD'] },

    { id: 'auditoria', icon: ShieldAlert, label: 'Auditoría', group: 'SISTEMA', href: '/audit/logs', moduleCode: 'AUDITORIA', hideForRoles: ['MEDICO_GENERAL', 'ESPECIALISTA', 'ENFERMERIA', 'RECEPCIONISTA', 'ADMINISTRADOR'] },
    { id: 'admin', icon: Settings, label: 'Administración', group: 'SISTEMA', href: '/admin', moduleCode: 'ADMIN', hideForRoles: ['MEDICO_GENERAL', 'ESPECIALISTA', 'ENFERMERIA', 'RECEPCIONISTA', 'AUDITOR_SEGURIDAD'] },
]

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { pathname, search } = location
  const { user } = useAuth()
  const [hasCritical, setHasCritical] = useState(false)
  const [activePatientData, setActivePatientData] = useState(null)

  // Extraer ID de paciente de la URL
  const query = new URLSearchParams(search)
  const queryPacienteId = query.get('id_paciente')
  const expedienteMatch = pathname.match(/^\/expediente\/([^/]+)/)
  const pacienteSubRouteMatch = pathname.match(/^\/pacientes\/([^/]+)\/(editar|antecedentes|recetas)$/)

  const activePatientId = queryPacienteId || expedienteMatch?.[1] || pacienteSubRouteMatch?.[1] || null

  useEffect(() => {
    const checkCritical = async () => {
      if (!user || !user.permisos?.AUDITORIA?.puede_leer) return
      try {
        const res = await apiClient.get('/auditoria/stats')
        setHasCritical(res.data.criticos > 0)
      } catch (e) {
        if (e.response?.status !== 401) console.error('Error en polling de seguridad:', e)
      }
    }
    checkCritical()
    const timer = setInterval(checkCritical, 60000)
    return () => clearInterval(timer)
  }, [user])

  useEffect(() => {
    if (activePatientId) {
      apiClient.get(`/pacientes/${activePatientId}`)
        .then(res => {
          const p = res.data.data
          setActivePatientData({
            id: p.id_paciente,
            nombre: `${p.persona.nombre} ${p.persona.primer_apellido}`,
            foto: p.persona.url_foto
          })
        })
        .catch(() => setActivePatientData({ id: activePatientId, nombre: 'Paciente' }))
    } else {
      setActivePatientData(null)
    }
  }, [activePatientId])

  const filterItems = (group) => {
    return NAV_ITEMS.filter((item) => {
      if (item.group !== group) return false
      
      // SUPERADMIN y OMNIADMIN tienen acceso total por definición
      if (user?.rol === 'SUPERADMIN' || user?.rol === 'OMNIADMIN') return true

      if (item.public) return true
      if (item.hideForRoles && user && item.hideForRoles.includes(user.rol)) return false
      if (!user || !user.permisos) return false
      
      const modulePerms = user.permisos[item.moduleCode]
      return modulePerms?.puede_leer === true
    })
  }

  const buildHref = (item) => {
    if (!item.requiresPatientFlow) return item.href
    switch (item.id) {
      case 'expediente': return `/expediente/${activePatientId}`
      case 'consulta': return `/consulta/nueva?id_paciente=${activePatientId}`
      case 'documentos': return `/documentos?id_paciente=${activePatientId}`
      case 'recetas': return `/pacientes/${activePatientId}/recetas`
      default: return item.href
    }
  }

  const isItemActive = (item) => {
    if (item.id === 'pacientes') return pathname.startsWith('/pacientes') && !activePatientId
    if (item.id === 'expediente') return pathname.startsWith('/expediente')
    if (item.id === 'consulta') return pathname.startsWith('/consulta')
    if (item.id === 'recetas') return pathname.startsWith(`/pacientes/${activePatientId}/recetas`)
    return pathname.startsWith(item.href)
  }

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-[260px] bg-sidebar text-white flex-shrink-0 flex flex-col h-full transition-transform duration-300 border-r border-sidebar-hover
      md:static md:translate-x-0
      ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
    `}>
      {/* Header Logo */}
      <div className="h-14 flex items-center justify-between px-4 font-bold text-lg border-b border-sidebar-hover">
        <span className="text-white">
          Med<span className="text-primary-300">IA</span>
        </span>
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {/* GLOBAL SECTION */}
        <div className="px-3 mb-6">
          <div className="px-2 mb-2 text-xs font-semibold text-gray-400 tracking-wider uppercase">
            Navegación
          </div>
          <ul className="space-y-1">
            {filterItems('GLOBAL').map((item) => (
              <li key={item.id}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isItemActive(item)
                      ? 'bg-sidebar-hover text-white border-l-4 border-primary'
                      : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
                  }`}
                >
                  <item.icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* PATIENT CONTEXT SECTION */}
        {activePatientData && (
          <div className="px-3 mb-6 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="px-2 mb-2 flex justify-between items-center">
              <span className="text-[10px] font-bold text-primary-300 tracking-wider uppercase">
                Paciente Activo
              </span>
              <button 
                onClick={() => navigate('/pacientes')}
                className="text-gray-500 hover:text-white transition-colors"
                title="Cerrar contexto"
              >
                <X size={12} />
              </button>
            </div>
            
            {/* Patient Badge */}
            <div className="mx-1 mb-3 p-2 bg-sidebar-hover/40 border border-sidebar-hover rounded-lg flex items-center gap-2">
              <Avatar
                nombre={activePatientData.nombre}
                url_foto={activePatientData.foto}
                className="w-8 h-8 ring-1 ring-primary-300/30"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{activePatientData.nombre}</p>
                <p className="text-[9px] text-primary-300 uppercase font-medium">En Atención</p>
              </div>
            </div>

            <ul className="space-y-1">
              {filterItems('PACIENTE').map((item) => (
                <li key={item.id}>
                  <Link
                    to={buildHref(item)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors border-l-4 ${
                      isItemActive(item)
                        ? 'bg-sidebar-hover border-primary text-white'
                        : 'border-transparent text-gray-300 hover:bg-sidebar-hover hover:text-white'
                    }`}
                  >
                    <item.icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* SYSTEM SECTION */}
        <div className="px-3 mt-auto">
          <div className="px-2 mb-2 text-xs font-semibold text-gray-400 tracking-wider uppercase">
            Sistema
          </div>
          <ul className="space-y-1">
            {filterItems('SISTEMA').map((item) => {
              const isActive = pathname.startsWith(item.href)
              const isCriticalAlert = (item.id === 'auditoria') && hasCritical

              return (
                <li key={item.id}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      isActive ? 'bg-sidebar-hover text-white border-l-4 border-primary' : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
                    }`}
                  >
                    <item.icon size={18} className={isCriticalAlert ? 'text-red-500 animate-pulse' : ''} />
                    <span className={`text-sm font-medium ${isCriticalAlert ? 'text-red-500 font-bold' : ''}`}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* User Footer */}
      <div className="border-t border-sidebar-hover text-white">
        <Link
          to="/perfil"
          className="p-4 flex items-center gap-3 hover:bg-sidebar-hover transition-colors group"
        >
          <Avatar
            nombre={user?.nombre}
            url_foto={user?.url_foto}
            className="w-9 h-9 bg-primary"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate text-white">{user?.nombre || 'Usuario'}</p>
            <p className="text-[10px] text-gray-400 truncate uppercase font-bold tracking-tight">
              {user?.rol?.replace('_', ' ')}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  )
}