import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Building2,
  ShieldCheck,
  Layers,
  ArrowRight,
  FileSearch,
  Activity,
  UserX,
  MapPinned,
  Languages
} from 'lucide-react'
import apiClient from '../../api/client'

const MetricCard = ({ icon: Icon, label, value, sub, color, to }) => {
  const content = (
    <div className="bg-white rounded-xl border border-[#DAD4CC] p-5 flex items-start gap-4 shadow-sm hover:shadow-md hover:border-[#1B4F8A] transition-all">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={22} className="text-white" />
      </div>

      <div className="min-w-0">
        <p className="text-sm text-[#64748B] font-medium">{label}</p>
        <p className="text-2xl font-bold text-[#1E293B]">{value ?? '—'}</p>
        {sub && <p className="text-xs text-[#64748B] mt-0.5">{sub}</p>}
      </div>
    </div>
  )

  return to ? <Link to={to}>{content}</Link> : content
}

const QuickLink = ({ to, icon: Icon, label, desc }) => (
  <Link
    to={to}
    className="bg-white border border-[#DAD4CC] rounded-xl p-4 flex items-center justify-between hover:border-[#1B4F8A] hover:shadow-md transition-all group"
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="p-2 bg-[#EEF3FB] rounded-lg group-hover:bg-[#1B4F8A] transition-colors shrink-0">
        <Icon size={18} className="text-[#1B4F8A] group-hover:text-white" />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#1E293B]">{label}</p>
        <p className="text-xs text-[#64748B] line-clamp-1">{desc}</p>
      </div>
    </div>

    <ArrowRight
      size={16}
      className="text-[#64748B] group-hover:text-[#1B4F8A] transition-all transform group-hover:translate-x-1 shrink-0 ml-2"
    />
  </Link>
)

import { 
  fetchUsuarios, 
  fetchEstablecimientos, 
  fetchRoles 
} from '../../api/admin_service'

export default function AdminDashboardPage() {
  const [usuarios, setUsuarios] = useState([])
  const [establecimientos, setEstablecimientos] = useState([])
  const [roles, setRoles] = useState([])
  const [estados, setEstados] = useState([])
  const [lenguas, setLenguas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      try {
        // Ejecutamos peticiones en paralelo pero manejamos errores individualmente
        const results = await Promise.allSettled([
          fetchUsuarios(),
          fetchEstablecimientos(),
          fetchRoles(),
          apiClient.get('/catalogos/estados'),
          apiClient.get('/catalogos/lenguas')
        ])

        if (results[0].status === 'fulfilled') setUsuarios(results[0].value)
        if (results[1].status === 'fulfilled') setEstablecimientos(results[1].value)
        if (results[2].status === 'fulfilled') setRoles(results[2].value)
        
        if (results[3].status === 'fulfilled') {
          const res = results[3].value
          setEstados(Array.isArray(res?.data?.data) ? res.data.data : [])
        }
        
        if (results[4].status === 'fulfilled') {
          const res = results[4].value
          setLenguas(Array.isArray(res?.data?.data) ? res.data.data : [])
        }

      } catch (error) {
        console.error('Error crítico en dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const usuariosActivos = useMemo(() => usuarios.length, [usuarios])

  const cuentasRestringidas = useMemo(() => {
    return usuarios.filter((u) =>
      u?.bloqueado === true ||
      u?.is_blocked === true ||
      u?.estatus === 'BLOQUEADO' ||
      u?.estado === 'BLOQUEADO' ||
      u?.activo === false
    ).length
  }, [usuarios])

  const totalEstablecimientos = useMemo(() => establecimientos.length, [establecimientos])
  const totalRoles = useMemo(() => roles.length, [roles])
  const totalEstados = useMemo(() => estados.length, [estados])
  const totalLenguas = useMemo(() => lenguas.length, [lenguas])

  const cards = [
    {
      icon: Users,
      label: 'Usuarios activos',
      value: usuariosActivos,
      sub: 'Cuentas vigentes del sistema',
      color: 'bg-[#1B4F8A]',
      to: '/admin/usuarios'
    },
    {
      icon: Building2,
      label: 'Unidades médicas',
      value: totalEstablecimientos,
      sub: 'Establecimientos registrados',
      color: 'bg-[#2D8653]',
      to: '/admin/establecimientos'
    },
    {
      icon: ShieldCheck,
      label: 'Roles configurados',
      value: totalRoles,
      sub: 'Perfiles de acceso institucional',
      color: 'bg-[#B7791F]',
      to: '/admin/roles'
    },
    {
      icon: UserX,
      label: 'Cuentas restringidas',
      value: cuentasRestringidas,
      sub: 'Bloqueadas o inactivas',
      color: 'bg-[#BA2E45]',
      to: '/admin/usuarios?estado=restringido'
    }
  ]

  const quickLinks = [
    {
      to: '/admin/usuarios',
      icon: Users,
      label: 'Gestionar Personal',
      desc: 'Alta, edición y control de cuentas institucionales'
    },
    {
      to: '/admin/establecimientos',
      icon: Building2,
      label: 'Unidades Médicas',
      desc: 'Catálogo de clínicas y niveles de atención'
    },
    {
      to: '/admin/especialidades',
      icon: Layers,
      label: 'Oferta de Especialidades',
      desc: 'Asignación de servicios médicos por unidad'
    },
    {
      to: '/admin/roles',
      icon: ShieldCheck,
      label: 'Matriz de Permisos',
      desc: 'Gobernanza de acceso y perfiles forenses'
    },
    {
      to: '/audit/logs',
      icon: FileSearch,
      label: 'Auditoría Forense',
      desc: 'Bitácora e incidentes de seguridad'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Panel de Administración</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Distrito de Salud I · Tuxtla Gutiérrez, Chiapas
          </p>
        </div>

        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-bold text-[#1B4F8A] uppercase tracking-wider">
            Estado del sistema
          </p>
          <p className="text-xs text-[#2D8653] font-medium flex items-center justify-end gap-1">
            <span className="w-2 h-2 bg-[#2D8653] rounded-full animate-pulse" />
            Servicios administrativos disponibles
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#E2DDD4] animate-pulse rounded-xl h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-4">
        <div className="bg-white border border-[#DAD4CC] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={18} className="text-[#1B4F8A]" />
            <h2 className="text-base font-semibold text-[#1E293B]">Resumen institucional</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-3 rounded-lg bg-[#F8FAFC] px-4 py-3">
              <div>
                <p className="font-semibold text-[#1E293B]">Cobertura geográfica</p>
                <p className="text-xs text-[#64748B]">Estados disponibles en catálogo INEGI</p>
              </div>
              <div className="flex items-center gap-2 text-[#1B4F8A] font-bold">
                <MapPinned size={16} />
                {totalEstados}
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-lg bg-[#F8FAFC] px-4 py-3">
              <div>
                <p className="font-semibold text-[#1E293B]">Lenguas registradas</p>
                <p className="text-xs text-[#64748B]">Catálogo para barrera lingüística</p>
              </div>
              <div className="flex items-center gap-2 text-[#2D8653] font-bold">
                <Languages size={16} />
                {totalLenguas}
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-lg bg-[#F8FAFC] px-4 py-3">
              <div>
                <p className="font-semibold text-[#1E293B]">Gobernanza de acceso</p>
                <p className="text-xs text-[#64748B]">Roles y cuentas institucionales activos</p>
              </div>
              <span className="text-[#B7791F] font-bold">
                {totalRoles} roles · {usuariosActivos} usuarios
              </span>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-lg bg-[#F8FAFC] px-4 py-3">
              <div>
                <p className="font-semibold text-[#1E293B]">Supervisión operativa</p>
                <p className="text-xs text-[#64748B]">Auditoría centralizada sin accesos duplicados</p>
              </div>
              <span className="text-[#BA2E45] font-bold">Centralizada</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#DAD4CC] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileSearch size={18} className="text-[#1B4F8A]" />
            <h2 className="text-base font-semibold text-[#1E293B]">Acciones prioritarias</h2>
          </div>

          <div className="space-y-3">
            <Link
              to="/admin/usuarios"
              className="flex items-center justify-between rounded-lg border border-[#DAD4CC] bg-[#FDFAF5] px-4 py-3 hover:border-[#1B4F8A] transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">Registrar Nuevo Personal</p>
                <p className="text-xs text-[#64748B]">
                  Alta de médicos, enfermeras y administrativos
                </p>
              </div>
              <ArrowRight size={16} className="text-[#64748B]" />
            </Link>

            <Link
              to="/admin/especialidades"
              className="flex items-center justify-between rounded-lg border border-[#DAD4CC] bg-[#FDFAF5] px-4 py-3 hover:border-[#1B4F8A] transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">Oferta Médica</p>
                <p className="text-xs text-[#64748B]">
                  Configurar especialidades disponibles por unidad
                </p>
              </div>
              <ArrowRight size={16} className="text-[#64748B]" />
            </Link>

            <Link
              to="/audit/logs"
              className="flex items-center justify-between rounded-lg border border-[#DAD4CC] bg-[#FDFAF5] px-4 py-3 hover:border-[#1B4F8A] transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">Abrir Auditoría Forense</p>
                <p className="text-xs text-[#64748B]">
                  Revisar bitácora e incidentes de seguridad
                </p>
              </div>
              <ArrowRight size={16} className="text-[#64748B]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Sección de Módulos eliminada por redundancia con QuickLinks y Sidebar */}
    </div>
  )
}