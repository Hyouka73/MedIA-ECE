import React, { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Power, KeyRound, Pencil, ChevronLeft, ShieldCheck, UserCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { Dialog } from '../../components/ui/Dialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import {
  fetchUsuarios, crearUsuario, editarUsuario,
  cambiarEstadoUsuario, forzarPassword,
  fetchEstablecimientos, fetchRoles
} from '../../api/admin_service'

const ROLES = ['MEDICO_GENERAL', 'ESPECIALISTA', 'ENFERMERIA', 'ADMINISTRADOR', 'AUDITOR_SEGURIDAD', 'SUPERADMIN']

const ESTADO_VARIANT = {
  activo:    'success',
  inactivo:  'default',
  bloqueado: 'error',
}

function UsuarioModal({ usuario, token, onClose, onSaved }) {
  const isEdit = Boolean(usuario?.id_usuario)
  const [form, setForm] = useState({
    nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    email: '',
    rol: '',
    cedula_profesional: '',
    password: '',
    fecha_nacimiento: '',
    sexo: '',
    id_establecimiento: '',
  })
  const [establecimientos, setEstablecimientos] = useState([])
  const [rolesDisponibles, setRolesDisponibles] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    fetchEstablecimientos(token).then(setEstablecimientos).catch(console.error)
    fetchRoles(token).then(setRolesDisponibles).catch(console.error)
  }, [token])

  // Sincronizar el formulario cuando se abre el modal para editar
  useEffect(() => {
    if (usuario && isEdit) {
      setForm({
        nombre: usuario.nombre || '',
        primer_apellido: usuario.primer_apellido || '',
        segundo_apellido: usuario.segundo_apellido || '',
        email: usuario.email || '',
        rol: usuario.rol || '',
        cedula_profesional: usuario.cedula_profesional || '',
        password: '', 
        fecha_nacimiento: usuario.fecha_nacimiento || '',
        sexo: usuario.sexo || '',
        id_establecimiento: usuario.id_establecimiento || '',
      })
    }
  }, [usuario, isEdit])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setError('')
    
    // Clean empty strings to null to prevent FastAPI 422 UUID parsing errors
    const payload = { ...form }
    if (!payload.id_establecimiento) payload.id_establecimiento = null
    if (!payload.segundo_apellido) payload.segundo_apellido = null
    
    try {
      if (isEdit) await editarUsuario(usuario.id_usuario, payload, token)
      else         await crearUsuario(payload, token)
      onSaved()
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail[0].msg || 'Error de validación en los datos ingresados.')
      } else {
        setError(detail || 'Error al guardar los cambios.')
      }
    } finally { setSaving(false) }
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title={isEdit ? 'Editar Perfil de Personal' : 'Nuevo Registro Institucional'}
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 pt-2">
        <Input label="Nombre(s) *" value={form.nombre} onChange={set('nombre')} required />
        <Input label="Primer Apellido *" value={form.primer_apellido} onChange={set('primer_apellido')} required />
        <Input label="Segundo Apellido" value={form.segundo_apellido} onChange={set('segundo_apellido')} />
        <Input label="Correo Institucional *" value={form.email} onChange={set('email')} required type="email" />

        <Select
          label="Rol Asignado *"
          value={form.rol}
          onChange={set('rol')}
          required
          options={rolesDisponibles.map(r => ({ value: r.codigo, label: r.nombre }))}
          placeholder="Seleccionar rol"
        />

        {(form.rol === 'MEDICO_GENERAL' || form.rol === 'ESPECIALISTA') && (
          <Input 
            label="Cédula Profesional *" 
            value={form.cedula_profesional} 
            onChange={set('cedula_profesional')} 
            placeholder="Ej: 12345678"
            required 
          />
        )}

        <Select
          label="Establecimiento Asignado"
          value={form.id_establecimiento}
          onChange={set('id_establecimiento')}
          options={establecimientos.map(e => ({ value: e.id_establecimiento, label: `${e.clues} - ${e.nombre}` }))}
          placeholder="Sin establecimiento (Global)"
        />

        <Input 
          label="Fecha de Nacimiento *" 
          value={form.fecha_nacimiento} 
          onChange={set('fecha_nacimiento')} 
          required 
          type="date" 
        />

        <Select
          label="Sexo *"
          value={form.sexo}
          onChange={set('sexo')}
          required
          options={[
            { value: 'M', label: 'Hombre (Masculino)' },
            { value: 'F', label: 'Mujer (Femenino)' },
            { value: 'X', label: 'No especificado' },
          ]}
          placeholder="Seleccionar sexo"
        />

        {!isEdit && (
          <Input label="Contraseña Temporal *" value={form.password} onChange={set('password')} required type="password" />
        )}

        {error && (
          <div className="col-span-2 text-xs font-bold text-[#DC2626] bg-[#FEF2F2] border border-[#DC2626]/30 rounded-lg px-3 py-2">
            ⚠️ {error}
          </div>
        )}

        <div className="col-span-2 flex justify-end gap-3 pt-4 border-t border-[#F1F5F9] mt-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" isLoading={saving}>
            {isEdit ? 'Guardar Cambios' : 'Crear Cuenta'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export default function AdminUsuariosPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [usuarios, setUsuarios]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [busqueda, setBusqueda]   = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [modal, setModal]         = useState(null)

  const cargar = useCallback(() => {
    if (!token) return
    setLoading(true)
    fetchUsuarios(token)
      .then(data => setUsuarios(Array.isArray(data) ? data : []))
      .catch(() => setUsuarios([]))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => { cargar() }, [cargar])

  const filtrados = usuarios.filter(u => {
    const txt = busqueda.toLowerCase()
    const nombreCompleto = `${u.nombre} ${u.primer_apellido} ${u.segundo_apellido}`.toLowerCase()
    return (
      (!txt || nombreCompleto.includes(txt) || u.email?.toLowerCase().includes(txt) || u.id_usuario?.toLowerCase().includes(txt)) &&
      (!filtroRol || u.rol === filtroRol)
    )
  })

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1B4F8A] transition-colors group w-fit">
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Volver al Panel
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Personal del Distrito</h1>
          <p className="text-sm text-[#64748B]">Gestión de identidades y privilegios</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setModal({})}>
          Registrar Personal
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-[#DAD4CC] shadow-sm">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nombre, correo o ID..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            prefix={<Search size={16} className="text-[#94A3B8]" />}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select
            value={filtroRol}
            onChange={e => setFiltroRol(e.target.value)}
            options={ROLES.map(r => ({ value: r, label: r.replace(/_/g, ' ') }))}
            placeholder="Todos los roles"
          />
        </div>
      </div>

      <div className="bg-white border border-[#DAD4CC] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#DAD4CC] bg-[#F5F2EC]/50">
              <th className="text-left px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Nombre del Personal</th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Datos Civiles</th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Contacto / Rol</th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Estatus</th>
              <th className="text-center px-6 py-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {loading ? (
              <tr><td colSpan={5} className="py-20 text-center"><Spinner className="mx-auto" /></td></tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState icon={<Search size={40} />} title="Sin resultados" description="No se encontró personal con esos criterios." />
                </td>
              </tr>
            ) : filtrados.map(u => {
              const estado = u.bloqueado ? 'bloqueado' : u.activo ? 'activo' : 'inactivo'
              // Lógica: Si tiene nombre mostrarlo, si no, mostrar ID
              const displayNombre = u.nombre ? `${u.nombre} ${u.primer_apellido}` : `ID: ${u.id_usuario?.substring(0,8)}...`
              
              return (
                <tr key={u.id_usuario} className="hover:bg-[#F8FAFC] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#1E293B]">{displayNombre}</div>
                    {u.nombre && <div className="text-[10px] text-[#94A3B8] font-mono">UUID: {u.id_usuario?.substring(0,8)}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-[#64748B]">
                      <span className="font-bold">Sexo:</span> {u.sexo === 'M' ? 'Hombre' : u.sexo === 'F' ? 'Mujer' : 'N/E'}
                    </div>
                    <div className="text-xs text-[#64748B]">
                      <span className="font-bold">Nac:</span> {u.fecha_nacimiento}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-[#64748B] mb-1">{u.email}</div>
                    <Badge variant={u.rol_nombre === 'Super Administrador' || u.rol_nombre === 'Omni Administrador' ? 'error' : 'blue'}>
                      {u.rol_nombre || 'SIN ROL'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={ESTADO_VARIANT[estado]} dot>{estado}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="xs" icon={<Pencil size={14} />} 
                        onClick={() => setModal(u)} title="Editar datos" />
                      
                      <Button 
                        variant="ghost" size="xs" 
                        icon={<Power size={14} className={u.activo ? "text-[#DC2626]" : "text-[#2D8653]"} />} 
                        onClick={() => cambiarEstadoUsuario(u.id_usuario, !u.activo, token).then(cargar)} 
                        title={u.activo ? "Desactivar" : "Activar"}
                      />
                      
                      <Button variant="ghost" size="xs" icon={<KeyRound size={14} className="text-[#D97706]" />} 
                        onClick={() => { if(window.confirm('¿Resetear contraseña de este usuario?')) forzarPassword(u.id_usuario, token) }} 
                        title="Resetear Clave" />
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
          token={token}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); cargar() }}
        />
      )}
    </div>
  )
}