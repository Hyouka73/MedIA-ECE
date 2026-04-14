import React, { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Callout } from '../../components/ui/Callout'

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
  <svg className="w-4 h-4 text-[#2D8653] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)
const CrossIcon = () => (
  <svg className="w-3.5 h-3.5 text-[#DAD4CC] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export default function AdminRolesPage() {
  const navigate = useNavigate()
  const [rolActivo, setRolActivo] = useState('SUPERADMIN')
  const roles = Object.keys(MATRIZ)

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
        <h1 className="text-2xl font-bold text-[#1E293B]">Roles y Permisos</h1>
        <p className="text-sm text-[#64748B]">Matriz de acceso por rol — solo visualización</p>
      </div>

      <Callout variant="info" icon={<ShieldCheck size={16} />}>
        Los permisos están definidos en la base de datos según la tabla{' '}
        <code className="bg-[#F5F2EC] px-1 rounded text-xs"></code>.
        Esta vista es de solo lectura. Para modificar permisos contacta al <strong>SUPERADMIN</strong>.
      </Callout>

      <div className="flex flex-wrap gap-2">
        {roles.map(rol => (
          <button key={rol} onClick={() => setRolActivo(rol)}
            className={`transition-all ${rolActivo === rol ? 'ring-2 ring-offset-1 ring-[#1B4F8A]/40 rounded-full' : 'opacity-60 hover:opacity-100'}`}>
            <Badge variant={BADGE_VARIANT[rol] ?? 'default'}>
              {rol.replace(/_/g, ' ')}
            </Badge>
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#DAD4CC] rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-[#DAD4CC] bg-[#F5F2EC] flex items-center gap-3">
          <Badge variant={BADGE_VARIANT[rolActivo] ?? 'default'}>{rolActivo.replace(/_/g, ' ')}</Badge>
          <span className="text-xs text-[#64748B]">— permisos por módulo</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#DAD4CC]">
              <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide w-40">Módulo</th>
              {ACCIONES.map(a => (
                <th key={a} className="text-center px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">{a}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULOS.map(modulo => {
              const permisos = MATRIZ[rolActivo]?.[modulo] ?? [0,0,0,0]
              return (
                <tr key={modulo} className={`border-b border-[#DAD4CC] transition-colors hover:bg-[#EEF3FB] ${!permisos.some(p=>p===1) ? 'opacity-40' : ''}`}>
                  <td className="px-5 py-3 font-medium text-[#1E293B]">{modulo}</td>
                  {permisos.map((p, j) => (
                    <td key={j} className="px-4 py-3 text-center">{p === 1 ? <CheckIcon /> : <CrossIcon />}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-6 text-xs text-[#64748B]">
        <div className="flex items-center gap-2"><CheckIcon /><span>Permitido</span></div>
        <div className="flex items-center gap-2"><CrossIcon /><span>Sin acceso</span></div>
      </div>
    </div>
  )
}
