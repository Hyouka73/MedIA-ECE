import React, { useEffect, useState } from 'react'
import { Building2, MapPin, Layers, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAuth } from '../../context/AuthContext' // <--- IMPORTANTE: Para el token
import { fetchEstablecimientos } from '../../api/admin_service'

/* Configuración de variantes por Nivel de Atención */
const NIVEL_VARIANT = { 1: 'blue', 2: 'success', 3: 'error' }
const NIVEL_LABEL   = { 1: 'Primer nivel', 2: 'Segundo nivel', 3: 'Tercer nivel' }

export default function AdminEstablecimientosPage() {
  const navigate = useNavigate()
  const { token } = useAuth() // Obtenemos el token desde el contexto
  const [establecimientos, setEstablecimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    // Si no hay token, no intentamos la carga
    if (!token) return;

    fetchEstablecimientos(token) // <--- Pasamos el token a la API
      .then(data => setEstablecimientos(Array.isArray(data) ? data : []))
      .catch(() => setEstablecimientos([]))
      .finally(() => setLoading(false))
  }, [token])

  /* Filtrado reactivo en el cliente */
  const filtrados = establecimientos.filter(e => {
    const txt = busqueda.toLowerCase()
    return !txt ||
      e.nombre?.toLowerCase().includes(txt) ||
      e.clues?.toLowerCase().includes(txt) ||
      e.municipio?.toLowerCase().includes(txt)
  })

  return (
    <div className="space-y-5">
      
      {/* Navegación de regreso */}
      <button onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1B4F8A] transition-colors group w-fit">
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Volver al Panel
      </button>

      {/* Encabezado Institucional */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Establecimientos de Salud</h1>
          <p className="text-sm text-[#64748B]">Unidades médicas integradas al Distrito de Salud I (Chiapas)</p>
        </div>
        <div className="hidden sm:block text-right">
          <Badge variant="blue" dot>Total: {establecimientos.length}</Badge>
        </div>
      </div>

      {/* Barra de Búsqueda */}
      <div className="max-w-md bg-white p-3 rounded-xl border border-[#DAD4CC] shadow-sm">
        <Input
          placeholder="Buscar por nombre, CLUES o municipio..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          prefix={<MapPin size={16} className="text-[#94A3B8]" />}
          className="border-none bg-[#F8FAFC]"
        />
      </div>

      {/* Grid de Contenido */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={<Building2 size={36} className="opacity-30" />}
          title="Sin establecimientos"
          description={busqueda ? "No se encontraron unidades con ese criterio" : "No hay establecimientos registrados"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map(e => (
            <div key={e.id_establecimiento}
              className="bg-white border border-[#DAD4CC] rounded-xl p-5 shadow-sm hover:shadow-md hover:border-[#1B4F8A] transition-all cursor-default group">
              
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-[#EEF3FB] rounded-lg group-hover:bg-[#1B4F8A] transition-colors">
                  <Building2 size={22} className="text-[#1B4F8A] group-hover:text-white" />
                </div>
                <Badge variant={NIVEL_VARIANT[e.nivel_atencion] ?? 'default'}>
                  {NIVEL_LABEL[e.nivel_atencion] ?? `Nivel ${e.nivel_atencion}`}
                </Badge>
              </div>

              <h3 className="font-bold text-[#1E293B] text-base leading-tight mb-1">{e.nombre}</h3>
              <p className="text-[10px] text-[#64748B] font-mono tracking-widest uppercase mb-4">
                CLUES: <span className="text-[#1B4F8A]">{e.clues}</span>
              </p>

              <div className="space-y-2 border-t border-[#F1F5F9] pt-4">
                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <MapPin size={14} className="text-[#94A3B8]" />
                  <span>{e.municipio || 'Sin municipio asignado'}</span>
                </div>
                
                {e.especialidades_activas > 0 ? (
                  <div className="flex items-center gap-2 text-xs text-[#2D8653] font-medium">
                    <Layers size={14} />
                    <span>{e.especialidades_activas} especialidades en oferta médica</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                    <Layers size={14} />
                    <span>Sin especialidades activas</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <p className="text-[10px] text-[#94A3B8] text-center pt-5">
        Gestión de infraestructura médica bajo supervisión de OMNIADMIN
      </p>
    </div>
  )
}