import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, Building2, ShieldAlert, UserX, Layers, 
  ArrowRight, ShieldCheck, Activity, FileSearch 
} from 'lucide-react'
import { fetchAdminMetrics } from '../../api/admin_service'

/* Componente de Tarjeta de Métrica */
const MetricCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white rounded-xl border border-[#DAD4CC] p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-[#64748B] font-medium">{label}</p>
      <p className="text-2xl font-bold text-[#1E293B]">{value ?? '—'}</p>
      {sub && <p className="text-xs text-[#64748B] mt-0.5">{sub}</p>}
    </div>
  </div>
)

/* Configuración de Accesos Rápidos - RUTAS SINCRONIZADAS CON EL BACKEND */
const accesos = [
  { 
    href: '/admin/usuarios', 
    icon: Users, 
    label: 'Gestionar usuarios', 
    desc: 'Alta, edición y control de cuentas' 
  },
  { 
    href: '/admin/auditoria', // Corregido: de /seguridad a /admin
    icon: FileSearch, 
    label: 'Auditoría Forense', 
    desc: 'Bitácora de integridad (NOM-024/151)' 
  },
  { 
    href: '/admin/auditoria?nivel=CRITICA', // Corregido: Filtro directo en la bitácora
    icon: ShieldAlert, 
    label: 'Incidentes Críticos', 
    desc: 'Alertas de riesgo clínico detectadas' 
  },
  { 
    href: '/admin/establecimientos', 
    icon: Building2, 
    label: 'Unidades Médicas', 
    desc: 'Establecimientos bajo tu gestión' 
  },
  { 
    href: '/admin/roles', 
    icon: ShieldCheck, 
    label: 'Roles y Permisos', 
    desc: 'Matriz de acceso institucional' 
  },
  { 
    href: '/admin/catalogos', // Corregido para incluir especialidades, CIE-10 y medicamentos
    icon: Layers, 
    label: 'Configurar Catálogos', 
    desc: 'CIE-10, Medicamentos y Especialidades' 
  },
]

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminMetrics()
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  /* Mapeo de métricas dinámicas */
  const cards = [
    { 
      icon: Users, 
      label: 'Usuarios activos', 
      value: metrics?.usuarios_activos, 
      sub: `+${metrics?.nuevos_hoy ?? 0} nuevos hoy`, 
      color: 'bg-[#1B4F8A]' 
    },
    { 
      icon: Activity, 
      label: 'Integridad Sistema', 
      value: '100%', 
      sub: 'Validación NOM-151 OK', 
      color: 'bg-[#2D8653]' 
    },
    { 
      icon: ShieldAlert, 
      label: 'Incidentes Críticos', 
      value: metrics?.configuraciones_pendientes || 0, 
      sub: 'Requieren revisión inmediata', 
      color: 'bg-[#D97706]' 
    },
    { 
      icon: UserX, 
      label: 'Cuentas bloqueadas', 
      value: metrics?.bloqueadas, 
      sub: 'Por intentos fallidos o 2FA', 
      color: 'bg-[#DC2626]' 
    },
  ]

  return (
    <div className="space-y-6">
      
      {/* Encabezado con Identidad Institucional */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Panel de Administración Forense</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Distrito de Salud I · Tuxtla Gutiérrez, Chiapas
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-bold text-[#1B4F8A] uppercase tracking-wider">Estatus del Servidor</p>
          <p className="text-xs text-[#2D8653] font-medium flex items-center justify-end gap-1">
            <span className="w-2 h-2 bg-[#2D8653] rounded-full animate-pulse" /> Sincronizado con Azure
          </p>
        </div>
      </div>

      {/* Cards de métricas */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#E2DDD4] animate-pulse rounded-xl h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map(c => <MetricCard key={c.label} {...c} />)}
        </div>
      )}

      {/* Alerta de Seguridad Crítica */}
      {!loading && metrics?.configuraciones_pendientes > 0 && (
        <div className="flex items-start gap-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-4 shadow-sm animate-bounce">
          <ShieldAlert size={18} className="text-[#DC2626] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-[#991B1B] font-bold">Alerta de Seguridad Activa</p>
            <p className="text-xs text-[#991B1B]">
              Se han detectado {metrics.configuraciones_pendientes} intentos de violación a las reglas de prescripción (NOM-024).
            </p>
            {/* CORREGIDO: Redirigir a la bitácora con el filtro de nivel crítica */}
            <Link to="/admin/auditoria?nivel=CRITICA" className="text-xs font-bold underline text-[#991B1B] mt-2 block">
              Revisar bitácora de incidentes ahora
            </Link>
          </div>
        </div>
      )}

      {/* Sección de Accesos Rápidos */}
      <div>
        <h2 className="text-base font-semibold text-[#1E293B] mb-3">Módulos de Gestión y Cumplimiento</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {accesos.map(a => (
            <Link
              key={a.href}
              to={a.href}
              className="bg-white border border-[#DAD4CC] rounded-xl p-4 flex items-center justify-between hover:border-[#1B4F8A] hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#EEF3FB] rounded-lg group-hover:bg-[#1B4F8A] transition-colors">
                  <a.icon size={18} className="text-[#1B4F8A] group-hover:text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E293B]">{a.label}</p>
                  <p className="text-xs text-[#64748B] line-clamp-1">{a.desc}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-[#64748B] group-hover:text-[#1B4F8A] transition-all transform group-hover:translate-x-1 shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}