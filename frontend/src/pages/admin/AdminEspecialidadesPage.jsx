import React, { useEffect, useState } from 'react'
import { ChevronLeft, Layers, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { Select } from '../../components/ui/Select'
import { useAuth } from '../../context/AuthContext' // <--- IMPORTANTE para el token
import { fetchEstablecimientos, fetchEspecialidades, toggleEspecialidad } from '../../api/admin_service'

export default function AdminEspecialidadesPage() {
  const navigate = useNavigate()
  const { token } = useAuth() // Obtenemos el token en memoria
  const [establecimientos, setEstablecimientos] = useState([])
  const [selected, setSelected] = useState('')
  const [especialidades, setEspecialidades] = useState([])
  const [loadingEstab, setLoadingEstab] = useState(true)
  const [loadingEsp, setLoadingEsp] = useState(false)

  // Carga inicial de establecimientos
  useEffect(() => {
    if (!token) return;
    fetchEstablecimientos(token) // Pasamos el token a la API
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        setEstablecimientos(arr)
        if (arr.length) setSelected(String(arr[0].id_establecimiento))
      })
      .catch(() => setEstablecimientos([]))
      .finally(() => setLoadingEstab(false))
  }, [token])

  // Carga de especialidades al cambiar selección
  useEffect(() => {
    if (!selected || !token) return
    setLoadingEsp(true)
    fetchEspecialidades(selected, token) // Pasamos el token a la API
      .then(data => setEspecialidades(Array.isArray(data) ? data : []))
      .catch(() => setEspecialidades([]))
      .finally(() => setLoadingEsp(false))
  }, [selected, token])

  const handleToggle = async (esp) => {
    try {
      // Registrar este cambio en el backend requiere autenticación
      await toggleEspecialidad(selected, esp.id_especialidad, !esp.activa, token)
      
      setEspecialidades(prev =>
        prev.map(e => e.id_especialidad === esp.id_especialidad ? { ...e, activa: !e.activa } : e)
      )
    } catch (error) {
      console.error("Error al modificar especialidad:", error)
    }
  }

  return (
    <div className="space-y-5">
      {/* Botón Volver optimizado */}
      <button onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1B4F8A] transition-colors group w-fit">
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Volver al Panel
      </button>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Especialidades por Unidad</h1>
          <p className="text-sm text-[#64748B]">Configura la oferta médica para el Distrito de Salud</p>
        </div>
        {/* Badge de seguridad para la vista */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#F5F2EC] border border-[#DAD4CC] rounded-lg">
          <ShieldCheck size={14} className="text-[#237A4B]" />
          <span className="text-[10px] font-bold text-[#196038] uppercase">Cambios Auditados</span>
        </div>
      </div>

      <div className="max-w-md bg-white p-4 rounded-xl border border-[#DAD4CC] shadow-sm">
        <label className="block text-xs font-bold text-[#64748B] uppercase mb-2">Seleccionar Establecimiento</label>
        <Select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          disabled={loadingEstab}
          options={establecimientos.map(e => ({
            value: String(e.id_establecimiento),
            label: `${e.nombre} (${e.clues})`
          }))}
          placeholder="Seleccionar establecimiento"
        />
      </div>

      <div className="bg-white border border-[#DAD4CC] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#DAD4CC] bg-[#F5F2EC]">
              {['Especialidad', 'Fecha de Registro', 'Estado', 'Acción'].map(h => (
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
                    description="No hay especialidades registradas en esta unidad médica."
                  />
                </td>
              </tr>
            ) : especialidades.map(esp => (
              <tr key={esp.id_especialidad} className="border-b border-[#DAD4CC] hover:bg-[#EEF3FB] transition-colors">
                <td className="px-4 py-3">
                  <div className="font-semibold text-[#1E293B]">{esp.nombre}</div>
                  <div className="text-[10px] text-[#94A3B8] font-mono">{esp.id_especialidad}</div>
                </td>
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
                    className="w-24 justify-center"
                  >
                    {esp.activa ? 'Desactivar' : 'Activar'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-[#94A3B8] italic">
        * Cualquier modificación en la activación de especialidades genera un evento de auditoría de configuración.
      </p>
    </div>
  )
}