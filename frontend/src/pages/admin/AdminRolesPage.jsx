import React, { useState } from 'react'
import { ShieldCheck, ChevronLeft, Info, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Callout } from '../../components/ui/Callout'

/* Definición de Módulos y Acciones del Sistema MedIA */
const MODULOS  = ['Dashboard', 'Pacientes', 'Expediente', 'Consulta', 'Referencias', 'Documentos', 'Auditoría', 'Administración']
const ACCIONES = ['leer', 'crear', 'editar', 'eliminar']

const BADGE_VARIANT = {
  SUPERADMIN:        'error',
  OMNIADMIN:         'error',
  ADMINISTRADOR:     'blue',
  AUDITOR_SEGURIDAD: 'amber',
  MEDICO_GENERAL:    'success',
  ESPECIALISTA:      'success',
  ENFERMERIA:        'default',
}

/* Matriz de Permisos (Req. Seguridad Forense) */
const MATRIZ = {
  SUPERADMIN:        { Dashboard: [1,1,1,1], Pacientes: [1,1,1,1], Expediente: [1,1,1,1], Consulta: [1,1,1,1], Referencias: [1,1,1,1], Documentos: [1,1,1,1], 'Auditoría': [1,1,1,1], 'Administración': [1,1,1,1] },
  OMNIADMIN:         { Dashboard: [1,1,1,1], Pacientes: [1,1,1,1], Expediente: [1,1,1,1], Consulta: [1,1,1,1], Referencias: [1,1,1,1], Documentos: [1,1,1,1], 'Auditoría': [1,1,1,1], 'Administración': [1,1,1,1] },
  ADMINISTRADOR:     { Dashboard: [1,0,0,0], Pacientes: [1,1,1,0], Expediente: [1,0,0,0], Consulta: [0,0,0,0], Referencias: [1,0,0,0], Documentos: [1,0,0,0], 'Auditoría': [1,0,0,0], 'Administración': [1,1,1,1] },
  MEDICO_GENERAL:    { Dashboard: [1,0,0,0], Pacientes: [1,1,1,0], Expediente: [1,1,1,0], Consulta: [1,1,1,0], Referencias: [1,1,0,0], Documentos: [1,1,0,0], 'Auditoría': [0,0,0,0], 'Administración': [0,0,0,0] },
  ESPECIALISTA:      { Dashboard: [1,0,0,0], Pacientes: [1,1,1,0], Expediente: [1,1,1,0], Consulta: [1,1,1,0], Referencias: [1,1,0,0], Documentos: [1,1,0,0], 'Auditoría': [0,0,0,0], 'Administración': [0,0,0,0] },
  ENFERMERIA:        { Dashboard: [1,0,0,0], Pacientes: [1,0,0,0], Expediente: [0,0,0,0], Consulta: [1,1,0,0], Referencias: [0,0,0,0], Documentos: [0,0,0,0], 'Auditoría': [0,0,0,0], 'Administración': [0,0,0,0] },
  AUDITOR_SEGURIDAD: { Dashboard: [1,0,0,0], Pacientes: [0,0,0,0], Expediente: [0,0,0,0], Consulta: [0,0,0,0], Referencias: [0,0,0,0], Documentos: [0,0,0,0], 'Auditoría': [1,0,0,0], 'Administración': [0,0,0,0] },
}

const CheckIcon = () => (
  <div className="bg-[#DCFCE7] p-1 rounded-full inline-flex items-center justify-center">
    <svg className="w-3 h-3 text-[#166534]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  </div>
)
const CrossIcon = () => (
  <div className="bg-[#F1F5F9] p-1 rounded-full inline-flex items-center justify-center">
    <svg className="w-3 h-3 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </div>
)

export default function AdminRolesPage() {
  const navigate = useNavigate()
  const [rolActivo, setRolActivo] = useState('SUPERADMIN')
  const roles = Object.keys(MATRIZ)

  return (
    <div className="space-y-6">
      {/* Navegación */}
      <button onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1B4F8A] transition-colors group w-fit">
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Volver al Panel
      </button>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Matriz de Roles y Permisos</h1>
          <p className="text-sm text-[#64748B]">Configuración de privilegios de acceso al Expediente Clínico</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F8FAFC] border border-[#DAD4CC] rounded-lg">
          <ShieldCheck size={14} className="text-[#1B4F8A]" />
          <span className="text-[10px] font-bold text-[#1B4F8A] uppercase">Modo Edición</span>
        </div>
      </div>

      <Callout variant="info" icon={<Info size={16} />}>
        Los permisos están definidos por la política de seguridad institucional en la tabla{' '}
        <code className="bg-[#E2DDD4] px-1.5 py-0.5 rounded text-[11px] font-mono font-bold text-[#1B4F8A]">
          auth_permisos_rol
        </code>. 
        Para cambios en la matriz, el oficial de seguridad debe emitir un ticket de cambio.
      </Callout>

      {/* Selector de Roles */}
      <div className="flex flex-wrap gap-3 p-1 bg-[#F5F2EC] rounded-2xl w-fit border border-[#DAD4CC]">
        {roles.map(rol => (
          <button 
            key={rol} 
            onClick={() => setRolActivo(rol)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              rolActivo === rol 
              ? 'bg-white shadow-sm text-[#1B4F8A] scale-105' 
              : 'text-[#64748B] hover:text-[#1B4F8A] hover:bg-white/50'
            }`}
          >
            {rol.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Tabla de Matriz */}
      <div className="bg-white border border-[#DAD4CC] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#DAD4CC] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant={BADGE_VARIANT[rolActivo] ?? 'default'}>
              {rolActivo.replace(/_/g, ' ')}
            </Badge>
            <span className="text-xs font-medium text-[#64748B]">Permisos de ejecución por módulo</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold text-[#94A3B8] uppercase">
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-[#166534] rounded-full"/> Activo</div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-[#94A3B8] rounded-full"/> Inactivo</div>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F5F2EC]/50">
              <th className="text-left px-6 py-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider w-48">Módulo del Sistema</th>
              {ACCIONES.map(a => (
                <th key={a} className="text-center px-4 py-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{a}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULOS.map(modulo => {
              const permisos = MATRIZ[rolActivo]?.[modulo] ?? [0,0,0,0]
              const hasAccess = permisos.some(p => p === 1)
              return (
                <tr key={modulo} className={`border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC] ${!hasAccess ? 'bg-[#F9FAFB]/50' : ''}`}>
                  <td className={`px-6 py-4 font-semibold text-xs ${hasAccess ? 'text-[#1E293B]' : 'text-[#94A3B8]'}`}>
                    {modulo}
                  </td>
                  {permisos.map((p, j) => (
                    <td key={j} className="px-4 py-4 text-center">
                      <button 
                        onClick={() => {
                          // TODO: Implementar guardado real en POST /admin/roles/{id}/permisos
                          console.log(`Cambiando permiso ${ACCIONES[j]} en módulo ${modulo} para rol ${rolActivo}`)
                        }}
                        className="hover:scale-110 transition-transform"
                      >
                        {p === 1 ? <CheckIcon /> : <CrossIcon />}
                      </button>
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-[#94A3B8] text-center italic">
        Esta matriz cumple con los controles de acceso lógicos establecidos en la NOM-024-SSA3-2012 para sistemas de ECE.
      </p>
    </div>
  )
}