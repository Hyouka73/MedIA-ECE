import React, { useEffect, useState } from 'react'
import { Building2, MapPin, Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { fetchEstablecimientos } from '../../api/admin_service'

const NIVEL_VARIANT = { 1: 'blue', 2: 'success', 3: 'error' }
const NIVEL_LABEL   = { 1: 'Primer nivel', 2: 'Segundo nivel', 3: 'Tercer nivel' }

export default function AdminEstablecimientosPage() {
  const navigate = useNavigate()
  const [establecimientos, setEstablecimientos] = useState([])
  const [loading, setLoading]                   = useState(true)
  const [busqueda, setBusqueda]                 = useState('')

  useEffect(() => {
    fetchEstablecimientos()
      .then(data => setEstablecimientos(Array.isArray(data) ? data : []))
      .catch(() => setEstablecimientos([]))
      .finally(() => setLoading(false))
  }, [])

  const filtrados = establecimientos.filter(e => {
    const txt = busqueda.toLowerCase()
    return !txt ||
      e.nombre?.toLowerCase().includes(txt) ||
      e.clues?.toLowerCase().includes(txt) ||
      e.municipio?.toLowerCase().includes(txt)
  })

  return (
    <div className="space-y-5">

      <button onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1B4F8A] transition-colors group w-fit">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </button>

      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Establecimientos</h1>
        <p className="text-sm text-[#64748B]">Unidades médicas bajo tu gestión</p>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Buscar por nombre, CLUES o municipio..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          prefix={<MapPin size={15} />}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={<Building2 size={36} className="opacity-30" />}
          title="Sin establecimientos"
          description="No se encontraron unidades con ese criterio"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map(e => (
            <div key={e.id_establecimiento}
              className="bg-white border border-[#DAD4CC] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-[#EEF3FB] rounded-lg">
                  <Building2 size={20} className="text-[#1B4F8A]" />
                </div>
                <Badge variant={NIVEL_VARIANT[e.nivel_atencion] ?? 'default'}>
                  {NIVEL_LABEL[e.nivel_atencion] ?? `Nivel ${e.nivel_atencion}`}
                </Badge>
              </div>
              <h3 className="font-semibold text-[#1E293B] text-sm leading-snug mb-1">{e.nombre}</h3>
              <p className="text-xs text-[#64748B] font-mono mb-3">CLUES: {e.clues}</p>
              <div className="flex items-center gap-1 text-xs text-[#64748B]">
                <MapPin size={12} /><span>{e.municipio}</span>
              </div>
              {e.especialidades_activas > 0 && (
                <div className="flex items-center gap-1 text-xs text-[#64748B] mt-1">
                  <Layers size={12} /><span>{e.especialidades_activas} especialidades activas</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
