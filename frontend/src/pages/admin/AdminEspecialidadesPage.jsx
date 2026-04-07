import React, { useEffect, useState } from 'react'
import { ChevronDown, Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { Select } from '../../components/ui/Select'
import { fetchEstablecimientos, fetchEspecialidades, toggleEspecialidad } from '../../api/admin_service'

export default function AdminEspecialidadesPage() {
  const navigate = useNavigate()
  const [establecimientos, setEstablecimientos] = useState([])
  const [selected, setSelected]                 = useState('')
  const [especialidades, setEspecialidades]     = useState([])
  const [loadingEstab, setLoadingEstab]         = useState(true)
  const [loadingEsp, setLoadingEsp]             = useState(false)

  useEffect(() => {
    fetchEstablecimientos()
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        setEstablecimientos(arr)
        if (arr.length) setSelected(String(arr[0].id_establecimiento))
      })
      .catch(() => setEstablecimientos([]))
      .finally(() => setLoadingEstab(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoadingEsp(true)
    fetchEspecialidades(selected)
      .then(data => setEspecialidades(Array.isArray(data) ? data : []))
      .catch(() => setEspecialidades([]))
      .finally(() => setLoadingEsp(false))
  }, [selected])

  const handleToggle = async (esp) => {
    await toggleEspecialidad(selected, esp.id_especialidad, !esp.activa)
    setEspecialidades(prev =>
      prev.map(e => e.id_especialidad === esp.id_especialidad ? { ...e, activa: !e.activa } : e)
    )
  }

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
        <h1 className="text-2xl font-bold text-[#1E293B]">Especialidades</h1>
        <p className="text-sm text-[#64748B]">Configura las especialidades por establecimiento</p>
      </div>

      <div className="max-w-sm">
        <Select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          disabled={loadingEstab}
          options={establecimientos.map(e => ({
            value: String(e.id_establecimiento),
            label: `${e.nombre} — ${e.clues}`
          }))}
          placeholder="Seleccionar establecimiento"
        />
      </div>

      <div className="bg-white border border-[#DAD4CC] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#DAD4CC] bg-[#F5F2EC]">
              {['Especialidad', 'Fecha de alta', 'Estado', 'Acción'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loadingEsp ? (
              <tr><td colSpan={4} className="py-16 text-center"><Spinner className="mx-auto" /></td></tr>
            ) : especialidades.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState
                    icon={<Layers size={32} className="opacity-30" />}
                    title="Sin especialidades"
                    description="No hay especialidades configuradas para este establecimiento"
                  />
                </td>
              </tr>
            ) : especialidades.map(esp => (
              <tr key={esp.id_especialidad} className="border-b border-[#DAD4CC] hover:bg-[#EEF3FB] transition-colors">
                <td className="px-4 py-3 font-medium text-[#1E293B]">{esp.nombre}</td>
                <td className="px-4 py-3 text-[#64748B]">
                  {esp.fecha_alta ? new Date(esp.fecha_alta).toLocaleDateString('es-MX') : '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={esp.activa ? 'success' : 'default'} dot>
                    {esp.activa ? 'Activa' : 'Inactiva'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant={esp.activa ? 'danger' : 'success'}
                    onClick={() => handleToggle(esp)}
                  >
                    {esp.activa ? 'Desactivar' : 'Activar'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
