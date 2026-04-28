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
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import apiClient from '../../api/client'

const NAV_ITEMS = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', group: 'CLÍNICA', href: '/dashboard', public: true },
    { id: 'pacientes', icon: Users, label: 'Pacientes', group: 'CLÍNICA', href: '/pacientes', moduleCode: 'PACIENTES' },
    
    // Rutas que requieren flujo de paciente marcadas con requiresPatientFlow
    { id: 'expediente', icon: FileText, label: 'Expediente', group: 'CLÍNICA', href: '/expediente', moduleCode: 'EXPEDIENTE', requiresPatientFlow: true },
    { id: 'consulta', icon: ClipboardList, label: 'Consulta', group: 'CLÍNICA', href: '/consulta', moduleCode: 'ENCUENTROS', requiresPatientFlow: true },
    { id: 'referencias', icon: Send, label: 'Referencias', group: 'CLÍNICA', href: '/referencias', moduleCode: 'ENCUENTROS', requiresPatientFlow: false },
    { id: 'documentos', icon: FileBox, label: 'Documentos', group: 'CLÍNICA', href: '/documentos', moduleCode: 'ESTUDIOS', requiresPatientFlow: true },
    
    { id: 'auditoria', icon: ShieldAlert, label: 'Auditoría', group: 'SISTEMA', href: '/audit/logs', moduleCode: 'AUDITORIA' },
    { id: 'admin', icon: Settings, label: 'Administración', group: 'SISTEMA', href: '/admin', moduleCode: 'ADMIN' },
]

export default function Sidebar() {
  const location = useLocation()
  const { pathname, search } = location
  const { user } = useAuth()
  const [hasCritical, setHasCritical] = useState(false)

  useEffect(() => {
    const checkCritical = async () => {
      // Usar permisos en lugar de roles fijos
      if (!user || !user.permisos?.AUDITORIA?.puede_leer) return

      try {
        const res = await apiClient.get('/auditoria/stats')
        setHasCritical(res.data.criticos > 0)
      } catch (e) {
        if (e.response?.status !== 401) {
          console.error('Error en polling de seguridad:', e)
        }
      }
    }

    checkCritical()
    const timer = setInterval(checkCritical, 60000)
    return () => clearInterval(timer)
  }, [user])

  const filterItems = (group) => {
    return NAV_ITEMS.filter((item) => {
      if (item.group !== group) return false
      
      // El Dashboard es público para cualquier usuario autenticado
      if (item.public) return true

      // Lógica de privilegios mínimos: Consultar matriz de permisos cargada en AuthContext
      if (!user || !user.permisos) return false
      
      const modulePerms = user.permisos[item.moduleCode]
      return modulePerms?.puede_leer === true
    })
  }

  const itemsClinica = filterItems('CLÍNICA')
  const itemsSistema = filterItems('SISTEMA')

  const query = new URLSearchParams(search)
  const queryPacienteId = query.get('id_paciente')

  const expedienteMatch = pathname.match(/^\/expediente\/([^/]+)/)
  const editarPacienteMatch = pathname.match(/^\/pacientes\/([^/]+)\/editar$/)

  const activePatientId =
    queryPacienteId ||
    expedienteMatch?.[1] ||
    editarPacienteMatch?.[1] ||
    null

  const inPacientes = pathname.startsWith('/pacientes')
  const inExpediente = /^\/expediente\/[^/]+/.test(pathname)
  const inConsulta = pathname.startsWith('/consulta/nueva')
  const inReferencias = pathname.startsWith('/referencias')
  const inDocumentos = pathname.startsWith('/documentos')

  const getAllowedFlowItems = () => {
    if (inReferencias) {
      return new Set(['pacientes', 'consulta', 'referencias'])
    }

    if (inConsulta) {
      return new Set(['pacientes', 'expediente', 'consulta'])
    }

    if (inExpediente) {
      return new Set(['pacientes', 'expediente'])
    }

    if (inDocumentos) {
      return new Set(['pacientes'])
    }

    if (inPacientes) {
      return new Set(['pacientes'])
    }

    return null
  }

  const allowedFlowItems = getAllowedFlowItems()

  const buildHref = (item) => {
    if (!item.requiresPatientFlow) return item.href

    switch (item.id) {
      case 'expediente':
        return activePatientId ? `/expediente/${activePatientId}` : '/expediente'

      case 'consulta':
        return activePatientId ? `/consulta/nueva?id_paciente=${activePatientId}` : '/consulta/nueva'

      case 'referencias':
        return activePatientId ? `/referencias?id_paciente=${activePatientId}` : '/referencias'

      case 'documentos':
        return activePatientId ? `/documentos?id_paciente=${activePatientId}` : '/documentos'

      default:
        return item.href
    }
  }

  const isItemActive = (item) => {
    switch (item.id) {
      case 'pacientes':
        return pathname.startsWith('/pacientes')
      case 'expediente':
        return /^\/expediente\/[^/]+/.test(pathname)
      case 'consulta':
        return pathname.startsWith('/consulta/nueva')
      case 'referencias':
        return pathname.startsWith('/referencias')
      case 'documentos':
        return pathname.startsWith('/documentos')
      default:
        return pathname.startsWith(item.href)
    }
  }

  const isItemDisabled = (item) => {
    if (!item.requiresPatientFlow) return false

    if (!activePatientId) return true

    if (!allowedFlowItems) return true

    if (item.id === 'documentos') return true

    return !allowedFlowItems.has(item.id)
  }

  return (
    <aside className="w-[220px] bg-sidebar text-white flex-shrink-0 flex flex-col h-full transition-all border-r border-sidebar-hover hidden md:flex">
      <div className="h-14 flex items-center px-4 font-bold text-lg border-b border-sidebar-hover">
        <span className="text-white">
          Med<span className="text-primary-300">IA</span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {itemsClinica.length > 0 && (
          <>
            <div className="px-3 mb-2 text-xs font-semibold text-gray-400 tracking-wider uppercase">
              Clínica
            </div>

            <ul className="space-y-1 px-2 mb-6">
              {itemsClinica.map((item) => {
                const isActive = isItemActive(item)
                const isDisabled = isItemDisabled(item)
                const href = buildHref(item)

                if (isDisabled) {
                  return (
                    <li key={item.id}>
                      <div
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-500 opacity-50 cursor-not-allowed select-none"
                        title="Este módulo no está disponible en la etapa actual del flujo"
                      >
                        <item.icon size={18} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    </li>
                  )
                }

                return (
                  <li key={item.id}>
                    <Link
                      to={href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-sidebar-hover text-white border-l-4 border-primary'
                          : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
                      }`}
                    >
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
            <div className="px-3 mb-2 text-xs font-semibold text-gray-400 tracking-wider uppercase">
              Sistema
            </div>

            <ul className="space-y-1 px-2">
              {itemsSistema.map((item) => {
                const isActive = pathname.startsWith(item.href)
                const isCriticalAlert =
                  (item.id === 'auditoria' || item.id === 'seguridad') && hasCritical

                return (
                  <li key={item.id}>
                    <Link
                      to={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-sidebar-hover text-white border-l-4 border-primary'
                          : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
                      }`}
                    >
                      <item.icon
                        size={18}
                        className={isCriticalAlert ? 'text-[#DC2626] animate-pulse' : ''}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isCriticalAlert ? 'text-[#DC2626] font-bold' : ''
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </nav>

      {hasCritical && (
        <div className="px-4 mb-4">
          <Link
            to="/audit/logs"
            className="bg-[#DC2626] text-white text-[10px] font-black p-2 rounded flex items-center gap-2 animate-pulse uppercase cursor-pointer hover:bg-red-700 transition-colors"
          >
            <AlertCircle size={14} />
            Incidente Crítico Pendiente
          </Link>
        </div>
      )}

      <div className="border-t border-sidebar-hover text-white">
        <Link
          to="/perfil"
          className="p-4 flex flex-col gap-3 hover:bg-sidebar-hover transition-colors block cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Avatar
              nombre={user?.nombre}
              url_foto={user?.url_foto}
              className="w-8 h-8 bg-primary text-xs flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">
                {user?.nombre || 'Usuario'}
              </p>
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