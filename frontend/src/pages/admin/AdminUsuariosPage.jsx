import React, { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Power, KeyRound, Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { Dialog } from '../../components/ui/Dialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import {
  fetchUsuarios, crearUsuario, editarUsuario,
  cambiarEstadoUsuario, forzarPassword
} from '../../api/admin_service'

const ROLES = ['MEDICO_GENERAL', 'ESPECIALISTA', 'ENFERMERIA', 'ADMINISTRADOR', 'AUDITOR_SEGURIDAD', 'SUPERADMIN']

const ESTADO_VARIANT = {
  activo:    'success',
  inactivo:  'default',
  bloqueado: 'error',
}

function UsuarioModal({ usuario, onClose, onSaved }) {
  const isEdit = Boolean(usuario?.id_usuario)
  const [form, setForm] = useState({
    nombre:           usuario?.nombre ?? '',
    primer_apellido:  usuario?.primer_apellido ?? '',
    segundo_apellido: usuario?.segundo_apellido ?? '',
    email:            usuario?.email ?? '',
    rol:              usuario?.rol ?? '',
    password:         '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      if (isEdit) await editarUsuario(usuario.id_usuario, form)
      else        await crearUsuario(form)
      onSaved()
    } catch {
      setError('Error al guardar. Verifica los datos e intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
      description={isEdit ? 'Modifica los datos del usuario.' : 'Completa los datos para crear una nueva cuenta.'}
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 pt-2">
        <Input label="Nombre *"           value={form.nombre}           onChange={set('nombre')}           required />
        <Input label="Primer apellido *"  value={form.primer_apellido}  onChange={set('primer_apellido')}  required />
        <Input label="Segundo apellido"   value={form.segundo_apellido} onChange={set('segundo_apellido')} />
        <Input label="Correo *"           value={form.email}            onChange={set('email')}            required type="email" />

        <Select
          label="Rol *"
          value={form.rol}
          onChange={set('rol')}
          required
          options={ROLES.map(r => ({ value: r, label: r.replace(/_/g, ' ') }))}
          placeholder="Seleccionar rol"
        />

        {!isEdit && (
          <Input label="Contraseña inicial *" value={form.password} onChange={set('password')} required type="password" />
        )}

        {error && (
          <div className="col-span-2 text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#DC2626]/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="col-span-2 flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" isLoading={saving}>Guardar</Button>
        </div>
      </form>
    </Dialog>
  )
}

export default function AdminUsuariosPage() {
  const navigate = useNavigate()
  const [usuarios, setUsuarios]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [busqueda, setBusqueda]   = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [modal, setModal]         = useState(null)

  const cargar = useCallback(() => {
    setLoading(true)
    fetchUsuarios()
      .then(data => setUsuarios(Array.isArray(data) ? data : []))
      .catch(() => setUsuarios([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const filtrados = usuarios.filter(u => {
    const txt = busqueda.toLowerCase()
    return (
      (!txt || `${u.nombre} ${u.primer_apellido} ${u.email}`.toLowerCase().includes(txt)) &&
      (!filtroRol || u.rol === filtroRol)
    )
  })

  return (
    <div className="space-y-5">

      {/* Back */}
      <button onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1B4F8A] transition-colors group w-fit">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Usuarios</h1>
          <p className="text-sm text-[#64748B]">Gestión de cuentas del sistema</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setModal({})}>
          Nuevo usuario
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nombre, apellido o correo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            prefix={<Search size={15} />}
          />
        </div>
        <Select
          value={filtroRol}
          onChange={e => setFiltroRol(e.target.value)}
          options={ROLES.map(r => ({ value: r, label: r.replace(/_/g, ' ') }))}
          placeholder="Todos los roles"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white border border-[#DAD4CC] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#DAD4CC] bg-[#F5F2EC]">
              {['Nombre', 'Correo', 'Rol', 'Último acceso', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <Spinner className="mx-auto" />
                </td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={<Search size={32} className="opacity-30" />}
                    title="Sin resultados"
                    description="Ajusta los filtros o crea un nuevo usuario"
                    action={<Button size="sm" onClick={() => setModal({})}>Nuevo usuario</Button>}
                  />
                </td>
              </tr>
            ) : filtrados.map(u => {
              const estado = u.bloqueado ? 'bloqueado' : u.activo ? 'activo' : 'inactivo'
              return (
                <tr key={u.id_usuario} className="border-b border-[#DAD4CC] hover:bg-[#EEF3FB] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1E293B]">{u.nombre} {u.primer_apellido}</td>
                  <td className="px-4 py-3 text-[#64748B]">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="blue">{u.rol?.replace(/_/g, ' ')}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[#64748B]">
                    {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString('es-MX') : 'Nunca'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={ESTADO_VARIANT[estado]} dot>{estado}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="xs" icon={<Pencil size={14} />}
                        onClick={() => setModal(u)} />
                      <Button
                        variant="ghost" size="xs"
                        icon={<Power size={14} />}
                        onClick={() => cambiarEstadoUsuario(u.id_usuario, !u.activo).then(cargar)}
                      />
                      <Button variant="ghost" size="xs" icon={<KeyRound size={14} />}
                        onClick={() => forzarPassword(u.id_usuario)} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <UsuarioModal
          usuario={modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); cargar() }}
        />
      )}
    </div>
  )
}
