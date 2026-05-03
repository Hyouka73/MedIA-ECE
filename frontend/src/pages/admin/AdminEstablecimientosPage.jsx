import React, { useEffect, useState, useCallback } from 'react'
import { Building2, MapPin, Layers, ChevronLeft, Plus, Pencil, Save, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Dialog } from '../../components/ui/Dialog'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { fetchEstablecimientos, crearEstablecimiento, editarEstablecimiento } from '../../api/admin_service'
import api from '../../api/client'

/* Configuración de variantes por Nivel de Atención */
const NIVEL_VARIANT = { 1: 'blue', 2: 'success', 3: 'error' }

function EstablecimientoModal({ estab, token, onClose, onSaved }) {
  const isEdit = Boolean(estab?.id_establecimiento)
  const [form, setForm] = useState({
    clues: estab?.clues || '',
    nombre: estab?.nombre || '',
    nivel_atencion: estab?.nivel_atencion || 1,
    id_localidad: estab?.id_localidad || '',
  })
  const [municipios, setMunicipios] = useState([])
  const [localidades, setLocalidades] = useState([])
  const [idMunicipio, setIdMunicipio] = useState(estab?.id_localidad ? estab.id_localidad.substring(0, 5) : '')
  const [loadingCats, setLoadingCats] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  // Cargar municipios de Chiapas (07) al inicio
  useEffect(() => {
    api.get('/catalogos/municipios?estado=07')
      .then(res => {
        setMunicipios(res.data.data || [])
        setLoadingCats(false)
      })
      .catch(console.error)
  }, [])

  // Cargar localidades cuando cambie el municipio
  useEffect(() => {
    if (!idMunicipio) {
      setLocalidades([])
      return
    }
    api.get(`/catalogos/localidades?municipio=${idMunicipio}`)
      .then(res => setLocalidades(res.data.data || []))
      .catch(console.error)
  }, [idMunicipio])

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.clues.length !== 11) {
      setError('La CLUES debe tener exactamente 11 caracteres')
      return
    }
    if (!form.id_localidad) {
      setError('Debe seleccionar una localidad del catálogo')
      return
    }

    setSaving(true); setError('')
    try {
      if (isEdit) await editarEstablecimiento(estab.id_establecimiento, form)
      else         await crearEstablecimiento(form)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar los cambios')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={true} onClose={onClose} title={isEdit ? 'Editar Unidad Médica' : 'Registrar Nueva Unidad'}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-[11px] text-amber-800 leading-tight">
          <p className="font-bold mb-1">⚖️ CUMPLIMIENTO NOM-024 / NOM-004:</p>
          Seleccione el municipio y la localidad oficial para garantizar la trazabilidad epidemiológica.
        </div>

        <Input 
          label="CLUES (Clave Federal) *" 
          value={form.clues} 
          onChange={e => setForm({...form, clues: e.target.value.toUpperCase()})} 
          required 
          maxLength={11}
          placeholder="Ej: CSSSA000123" 
        />
        <Input label="Nombre de la Unidad *" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required />
        
        <Select
          label="Nivel de Atención *"
          value={form.nivel_atencion}
          onChange={e => setForm({...form, nivel_atencion: parseInt(e.target.value)})}
          options={[
            { value: 1, label: 'Primer Nivel' },
            { value: 2, label: 'Segundo Nivel' },
            { value: 3, label: 'Tercer Nivel' },
          ]}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Municipio *"
            value={idMunicipio}
            onChange={e => {
              setIdMunicipio(e.target.value)
              setForm(f => ({ ...f, id_localidad: '' }))
            }}
            required
            options={municipios.map(m => ({ value: m.id_municipio, label: m.nombre }))}
            placeholder={loadingCats ? "Cargando..." : "Seleccionar municipio"}
          />

          <Select
            label="Localidad *"
            value={form.id_localidad}
            onChange={e => setForm({...form, id_localidad: e.target.value})}
            required
            disabled={!idMunicipio}
            options={localidades.map(l => ({ value: l.id_localidad, label: l.nombre }))}
            placeholder={idMunicipio ? "Seleccionar localidad" : "Elija municipio primero"}
          />
        </div>

        {error && <div className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded">⚠️ {error}</div>}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" loading={saving} icon={<Save size={16} />}>
            Guardar Unidad
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export default function AdminEstablecimientosPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [establecimientos, setEstablecimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null)

  const cargar = useCallback(() => {
    if (!token) return
    setLoading(true)
    fetchEstablecimientos(token)
      .then(data => setEstablecimientos(Array.isArray(data) ? data : []))
      .catch(() => setEstablecimientos([]))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => { cargar() }, [cargar])

  const filtrados = establecimientos.filter(e => {
    const txt = busqueda.toLowerCase()
    return !txt || e.nombre?.toLowerCase().includes(txt) || e.clues?.toLowerCase().includes(txt)
  })

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1B4F8A] transition-colors group w-fit">
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Volver al Panel
      </button>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Unidades Médicas</h1>
          <p className="text-sm text-[#64748B]">Infraestructura de salud del Distrito I</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setModal({})}>
          Registrar Unidad
        </Button>
      </div>

      <div className="max-w-md bg-white p-3 rounded-xl border border-[#DAD4CC] shadow-sm">
        <Input
          placeholder="Buscar unidad..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          prefix={<MapPin size={16} className="text-[#94A3B8]" />}
          className="border-none bg-[#F8FAFC]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : filtrados.length === 0 ? (
        <EmptyState icon={<Building2 size={36} />} title="Sin resultados" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(e => (
            <div key={e.id_establecimiento} className="bg-white border border-[#DAD4CC] rounded-xl p-5 shadow-sm hover:shadow-md transition-all group relative">
              <div className="flex justify-between mb-4">
                <div className="p-2 bg-[#EEF3FB] rounded-lg text-[#1B4F8A]">
                  <Building2 size={20} />
                </div>
                <div className="flex gap-2">
                   <Badge variant={NIVEL_VARIANT[e.nivel_atencion] ?? 'default'}>
                    Nivel {e.nivel_atencion}
                  </Badge>
                  <button onClick={() => setModal(e)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 rounded-md transition-all">
                    <Pencil size={14} className="text-gray-500" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-[#1E293B] mb-1">{e.nombre}</h3>
              <p className="text-[10px] text-[#1B4F8A] font-mono mb-3 uppercase">CLUES: {e.clues}</p>
              
              <div className="border-t pt-3 mt-3 flex items-center justify-between text-xs text-[#64748B]">
                <div className="flex items-center gap-1">
                  <MapPin size={12} />
                  <span>Chiapas</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <EstablecimientoModal 
          estab={modal} 
          token={token} 
          onClose={() => setModal(null)} 
          onSaved={() => { setModal(null); cargar() }} 
        />
      )}

      <p className="text-[10px] text-[#94A3B8] text-center pt-5">
        Gestión de infraestructura médica bajo supervisión de OMNIADMIN
      </p>
    </div>
  )
}
