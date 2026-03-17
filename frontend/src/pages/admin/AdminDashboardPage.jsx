import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Building2, ShieldAlert, UserX, Layers, ArrowRight, ShieldCheck } from 'lucide-react'
import { fetchAdminMetrics } from '../../api/admin_service'

const MetricCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white rounded-xl border border-[#DAD4CC] p-5 flex items-start gap-4 shadow-sm">
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

const accesos = [
  { href: '/admin/usuarios',         icon: Users,       label: 'Gestionar usuarios',       desc: 'Alta, edición, activar/desactivar cuentas' },
  { href: '/admin/establecimientos', icon: Building2,   label: 'Ver establecimientos',     desc: 'Unidades médicas bajo tu gestión' },
  { href: '/admin/especialidades',   icon: Layers,      label: 'Configurar especialidades',desc: 'Activa o desactiva especialidades por unidad' },
  { href: '/admin/roles',            icon: ShieldCheck, label: 'Roles y permisos',         desc: 'Matriz de acceso por rol — solo lectura' },
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

  const cards = [
    { icon: Users,       label: 'Usuarios activos',   value: metrics?.usuarios_activos,       sub: `+${metrics?.nuevos_hoy ?? 0} nuevos hoy`, color: 'bg-[#1B4F8A]' },
    { icon: Building2,   label: 'Establecimientos',   value: metrics?.total_establecimientos, sub: 'Bajo tu gestión',                         color: 'bg-[#2D8653]' },
    { icon: ShieldAlert, label: 'Sin 2FA activo',     value: metrics?.sin_2fa,                sub: 'Cuentas en riesgo',                        color: 'bg-[#D97706]' },
    { icon: UserX,       label: 'Cuentas bloqueadas', value: metrics?.bloqueadas,             sub: 'Requieren revisión',                       color: 'bg-[#DC2626]' },
  ]

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Panel de Administración</h1>
        <p className="text-sm text-[#64748B] mt-1">Resumen del sistema bajo tu gestión</p>
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

      {/* Alerta configuraciones pendientes */}
      {!loading && metrics?.configuraciones_pendientes > 0 && (
        <div className="flex items-start gap-3 bg-white border-l-4 border-[#D97706] rounded-lg p-4 shadow-sm">
          <ShieldAlert size={18} className="text-[#D97706] mt-0.5 shrink-0" />
          <p className="text-sm text-[#1E293B]">
            Hay <strong>{metrics.configuraciones_pendientes}</strong> configuración(es) pendiente(s) de revisión.
          </p>
        </div>
      )}

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-base font-semibold text-[#1E293B] mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {accesos.map(a => (
            <Link
              key={a.href}
              to={a.href}
              className="bg-white border border-[#DAD4CC] rounded-xl p-4 flex items-center justify-between hover:border-[#1B4F8A] hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#EEF3FB] rounded-lg">
                  <a.icon size={18} className="text-[#1B4F8A]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E293B]">{a.label}</p>
                  <p className="text-xs text-[#64748B]">{a.desc}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-[#64748B] group-hover:text-[#1B4F8A] transition-colors shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
