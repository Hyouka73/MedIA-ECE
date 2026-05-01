import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useParams, useNavigate } from 'react-router-dom'
import { pacientesAPI } from '../../api/pacientes'
import { clinicoAPI } from '../../api/clinico'
import { AlertCircle, ChevronLeft, Clock, FileText, Pill, PlusCircle, TrendingUp } from 'lucide-react'
import BarreraLinguisticaAlert from '../../components/ui/BarreraLinguisticaAlert'
import { canAccess } from '../../utils/permissions'

export default function ExpedientePage() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(null)
  const [encuentros, setEncuentros] = useState([])
  const [medicamentos, setMedicamentos] = useState([])
  const [notas, setNotas] = useState([])
  const [antecedentes, setAntecedentes] = useState({})
  const [inmunizaciones, setInmunizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('Antecedentes')
  const [expandedEncuentro, setExpandedEncuentro] = useState(null)

  const rolesPermitidos = [
    'MEDICO_GENERAL',
    'ESPECIALISTA',
    'ENFERMERIA',
    'RECEPCIONISTA',
    'ADMINISTRADOR',
    'SUPERADMIN',
    'OMNIADMIN',
  ]

  const tieneAcceso = user && rolesPermitidos.includes(user.rol)

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--
    return edad
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A'
    try {
      return new Date(fecha).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
    } catch {
      return fecha
    }
  }

  const formatearHora = (fecha) => {
    if (!fecha) return 'N/A'
    try {
      return new Date(fecha).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'N/A'
    }
  }

  const extraerObjeto = (res) => res?.data?.data || res?.data || {}

  const extraerLista = (res) => {
    if (Array.isArray(res?.data?.data?.items)) return res.data.data.items
    if (Array.isArray(res?.data?.data)) return res.data.data
    if (Array.isArray(res?.data?.items)) return res.data.items
    if (Array.isArray(res?.data)) return res.data
    return []
  }

  const normalizarAlergias = (lista = []) =>
    lista.map((a) => ({
      ...a,
      nombre: a.nombre || a.sustancia || a.alergia || a.descripcion || 'Alergia registrada',
      severidad: (a.severidad || '').toLowerCase(),
    }))

  const normalizarEncuentros = (lista = []) =>
    lista.map((enc) => ({
      ...enc,
      hora_inicio: enc.hora_inicio || formatearHora(enc.fecha_inicio),
      medico:
        enc.medico ||
        enc.nombre_medico ||
        enc.medico_responsable ||
        enc.nombre_medico_responsable ||
        'Médico no disponible',
      estado: enc.estado || (enc.fecha_cierre ? 'finalizado' : 'abierto'),
      diagnosticos: Array.isArray(enc.diagnosticos) ? enc.diagnosticos : [],
      prescripciones: Array.isArray(enc.prescripciones) ? enc.prescripciones : [],
    }))

  const obtenerTextoAntecedente = (item) => {
    if (typeof item === 'string') return item
    return (
      item?.descripcion ||
      item?.descripcion_patologia ||
      item?.tipo_patologia ||
      item?.categoria ||
      item?.familiar ||
      item?.enfermedad ||
      'Antecedente registrado'
    )
  }

  const obtenerNombreMedicamento = (med) =>
    med?.medicamento?.nombre_generico ||
    med?.nombre_generico ||
    med?.nombre ||
    med?.descripcion ||
    'Medicamento'

  const generarPacienteDemo = (pacienteId) => ({
    id_paciente: pacienteId,
    numero_expediente: `EXP-2025-${String(14832).padStart(5, '0')}`,
    nombre: 'Rosa María',
    primer_apellido: 'García',
    segundo_apellido: 'Hernández',
    persona: {
      nombre: 'Rosa María García Hernández',
      curp: 'GAHR860723MDFGRR09',
      fecha_nacimiento: '1986-07-23',
      sexo: 'F',
      telefono: '55 1234-5678',
      calle_numero: 'Calle Principal #123, Depto 4B',
      id_lengua_materna: null,
      alerta_barrera_linguistica: false,
    },
    grupo_sanguineo: 'O+',
    alergias: [
      { nombre: 'Penicilina', severidad: 'alta' },
      { nombre: 'Cefalosporinas', severidad: 'media' },
    ],
  })

  const generarEncuentrosDemo = () => [
    {
      id_encuentro: '1',
      fecha_inicio: '2025-05-28T09:30:00',
      hora_inicio: '09:30',
      motivo_consulta: 'Control de diabetes',
      estado: 'finalizado',
      medico: 'Dr. Roberto Morales',
      diagnosticos: ['E11 - Diabetes tipo 2 sin complicaciones'],
      prescripciones: ['Metformina 500mg c/12h', 'Lisinopril 5mg c/24h'],
    },
    {
      id_encuentro: '2',
      fecha_inicio: '2025-04-10T14:15:00',
      hora_inicio: '14:15',
      motivo_consulta: 'Dolor de cabeza',
      estado: 'finalizado',
      medico: 'Dra. Patricia López',
      diagnosticos: ['G43 - Migraña'],
      prescripciones: ['Ibuprofeno 400mg c/8h'],
    },
  ]

  useEffect(() => {
    if (!tieneAcceso || !id) return

    const loadExpediente = async () => {
      try {
        setLoading(true)
        setError(null)

        const pacRes = await pacientesAPI.getPaciente(id)
        const pacienteData = extraerObjeto(pacRes)

        if (!pacienteData || Object.keys(pacienteData).length === 0) {
          throw new Error('No se recibieron datos del paciente')
        }

        let alergiasData = []
        let antecedentesData = {}
        let inmunizacionesData = []

        try {
          if (typeof pacientesAPI.getAlergias === 'function') {
            const alergRes = await pacientesAPI.getAlergias(id)
            alergiasData = extraerLista(alergRes)
          }
        } catch (err) {
          console.warn('No se pudieron cargar alergias', err)
        }

        // ===== RESTAURADO: Lógica de extracción de versiones anteriores (Funcionaba en refactor) =====
        try {
          // Usamos el endpoint de expediente que devuelve la estructura completa
          const expRes = await pacientesAPI.getExpediente(id)
          const dataFull = extraerObjeto(expRes)
          
          // Buscamos los antecedentes donde sea que estén (raíz o anidados)
          const rawAnt = dataFull.antecedentes || dataFull
          
          antecedentesData = {
            heredofamiliares: rawAnt.heredofamiliares || rawAnt.antecedentes_heredofamiliares || {},
            patologicos: Array.isArray(rawAnt.patologicos) ? rawAnt.patologicos : (Array.isArray(rawAnt.antecedentes_patologicos) ? rawAnt.antecedentes_patologicos : []),
            no_patologicos: rawAnt.no_patologicos || rawAnt.antecedentes_no_patologicos || {}
          }
          
          // También extraemos alergias e inmunizaciones si vienen en este paquete
          if (Array.isArray(dataFull.alergias) && dataFull.alergias.length > 0) alergiasData = dataFull.alergias
          if (Array.isArray(dataFull.inmunizaciones) && dataFull.inmunizaciones.length > 0) inmunizacionesData = dataFull.inmunizaciones
          
          console.log('✅ Antecedentes recuperados (Legacy Mode):', antecedentesData)
        } catch (err) {
          console.error('❌ Error en extracción legacy:', err)
        }

        try {
          if (typeof pacientesAPI.getInmunizaciones === 'function') {
            const inmRes = await pacientesAPI.getInmunizaciones(id)
            inmunizacionesData = extraerLista(inmRes)
          }
        } catch (err) {
          console.warn('No se pudieron cargar inmunizaciones', err)
        }

        setPaciente({
          ...pacienteData,
          alergias: normalizarAlergias(
            pacienteData.alergias?.length ? pacienteData.alergias : alergiasData
          ),
        })

        setAntecedentes(antecedentesData || {})
        setInmunizaciones(inmunizacionesData || [])

        try {
          const encRes = await clinicoAPI.getEncuentros({ id_paciente: id, page: 1, limit: 20 })
          const encuentrosData = normalizarEncuentros(extraerLista(encRes))
          setEncuentros(encuentrosData)

          if (typeof clinicoAPI.getPrescripciones === 'function' && encuentrosData.length > 0) {
            const prescripcionesPorEncuentro = await Promise.all(
              encuentrosData.map(async (enc) => {
                try {
                  const rxRes = await clinicoAPI.getPrescripciones(enc.id_encuentro)
                  const rxItems = extraerLista(rxRes)
                  return rxItems.map((rx, index) => ({
                    ...rx,
                    _key: `${enc.id_encuentro}-${rx.id_prescripcion || index}`,
                    id_encuentro: enc.id_encuentro,
                    fecha_inicio: enc.fecha_inicio,
                    motivo_consulta: enc.motivo_consulta,
                  }))
                } catch (err) {
                  return (enc.prescripciones || []).map((rx, index) => ({
                    _key: `${enc.id_encuentro}-fallback-${index}`,
                    nombre_generico: typeof rx === 'string' ? rx : obtenerNombreMedicamento(rx),
                    dosis: typeof rx === 'string' ? '' : rx.dosis,
                    via_administracion: typeof rx === 'string' ? '' : rx.via_administracion,
                    frecuencia: typeof rx === 'string' ? '' : rx.frecuencia,
                    indicaciones: typeof rx === 'string' ? '' : rx.indicaciones,
                    fecha_inicio: enc.fecha_inicio,
                    motivo_consulta: enc.motivo_consulta,
                  }))
                }
              })
            )
            setMedicamentos(prescripcionesPorEncuentro.flat())
          } else {
            const medsFallback = encuentrosData.flatMap((enc) =>
              (enc.prescripciones || []).map((rx, index) => ({
                _key: `${enc.id_encuentro}-inline-${index}`,
                nombre_generico: typeof rx === 'string' ? rx : obtenerNombreMedicamento(rx),
                dosis: typeof rx === 'string' ? '' : rx.dosis,
                via_administracion: typeof rx === 'string' ? '' : rx.via_administracion,
                frecuencia: typeof rx === 'string' ? '' : rx.frecuencia,
                indicaciones: typeof rx === 'string' ? '' : rx.indicaciones,
                fecha_inicio: enc.fecha_inicio,
                motivo_consulta: enc.motivo_consulta,
              }))
            )
            setMedicamentos(medsFallback)
          }

          if (typeof clinicoAPI.getNotasEncuentro === 'function' && encuentrosData.length > 0) {
            const notasPromises = await Promise.all(
              encuentrosData.map(async (enc) => {
                try {
                  const notasRes = await clinicoAPI.getNotasEncuentro(enc.id_encuentro)
                  const notasItems = extraerObjeto(notasRes) || extraerLista(notasRes)
                  const lista = Array.isArray(notasItems) ? notasItems : (notasRes?.data?.data ? notasRes.data.data : [])
                  return lista.map((nota) => ({
                    ...nota,
                    id_encuentro: enc.id_encuentro,
                    motivo_consulta: enc.motivo_consulta,
                    fecha_inicio: enc.fecha_inicio,
                  }))
                } catch (err) {
                  return []
                }
              })
            )
            setNotas(notasPromises.flat())
          }
        } catch (err) {
          console.warn('Encuentros no disponibles, usando datos demo', err)
          const demoEncuentros = generarEncuentrosDemo()
          setEncuentros(demoEncuentros)
          setMedicamentos(
            demoEncuentros.flatMap((enc) =>
              (enc.prescripciones || []).map((rx, index) => ({
                _key: `${enc.id_encuentro}-demo-${index}`,
                nombre_generico: typeof rx === 'string' ? rx : obtenerNombreMedicamento(rx),
                fecha_inicio: enc.fecha_inicio,
                motivo_consulta: enc.motivo_consulta,
              }))
            )
          )
        }
      } catch (err) {
        console.error('Error cargando expediente:', err)
        setError(err?.response?.data?.detail || err.message || 'Error al cargar expediente')

        if (process.env.NODE_ENV === 'development') {
          setPaciente(generarPacienteDemo(id))
          const demoEncuentros = generarEncuentrosDemo()
          setEncuentros(demoEncuentros)
          setMedicamentos(
            demoEncuentros.flatMap((enc) =>
              (enc.prescripciones || []).map((rx, index) => ({
                _key: `${enc.id_encuentro}-dev-${index}`,
                nombre_generico: typeof rx === 'string' ? rx : obtenerNombreMedicamento(rx),
                fecha_inicio: enc.fecha_inicio,
                motivo_consulta: enc.motivo_consulta,
              }))
            )
          )
        }
      } finally {
        setLoading(false)
      }
    }

    loadExpediente()
  }, [id, tieneAcceso])

  if (!tieneAcceso) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <AlertCircle size={48} style={{ color: '#BA2E45', marginBottom: '16px' }} />
        <h2 style={{ color: '#1A1510', fontSize: 18, fontWeight: 600, marginBottom: '8px' }}>
          Acceso Denegado
        </h2>
        <p style={{ color: '#5A5048', fontSize: 14 }}>
          No tienes permisos para ver expedientes clínicos.
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: '24px',
            padding: '10px 20px',
            background: '#2459A8',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          ← Volver
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: 14, color: '#5A5048', animation: 'pulse 2s infinite' }}>
          ⏳ Cargando expediente...
        </div>
      </div>
    )
  }

  if (error && !paciente) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <AlertCircle size={48} style={{ color: '#BA2E45', marginBottom: '16px' }} />
        <h2 style={{ color: '#1A1510', fontSize: 18, fontWeight: 600, marginBottom: '8px' }}>
          Error al cargar expediente
        </h2>
        <p style={{ color: '#5A5048', fontSize: 14, marginBottom: '24px' }}>
          {error}
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px',
            background: '#2459A8',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          ← Volver
        </button>
      </div>
    )
  }

  if (!paciente) return null

  const initials = (() => {
    const nombre = paciente.persona?.nombre || paciente.nombre || ''
    const apellido = paciente.persona?.primer_apellido || paciente.primer_apellido || ''
    return `${nombre[0] || ''}${apellido[0] || ''}`.toUpperCase() || 'P'
  })()

  // ===== CORREGIDO: Soporta tanto ARRAY como OBJETO =====
  const patologicos = Array.isArray(antecedentes?.patologicos)
    ? antecedentes.patologicos
    : Array.isArray(antecedentes?.antecedentes_patologicos)
      ? antecedentes.antecedentes_patologicos
      : []

  const heredoData = antecedentes?.heredofamiliares || antecedentes?.antecedentes_heredofamiliares || {}
  const noPatData = antecedentes?.no_patologicos || antecedentes?.antecedentes_no_patologicos || {}

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header Sticky */}
      <div className="px-4 py-4 md:px-7 bg-[#FDFAF5]/80 backdrop-blur-md border-b border-border z-10 sticky top-0 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/pacientes')}
              className="p-1.5 -ml-2 text-text-primary hover:bg-black/5 rounded-full transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-text-primary truncate">
                Expediente Clínico
              </h1>
              <p className="text-xs text-text-secondary mt-0.5 truncate">
                {paciente.numero_expediente} · {paciente.persona?.nombre || paciente.nombre}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['RECEPCIONISTA', 'ADMINISTRADOR', 'SUPERADMIN', 'OMNIADMIN'].includes(user.rol) || canAccess(user.permisos, 'PACIENTES', 'puede_editar')) && (
              <button
                onClick={() => navigate(`/pacientes/${paciente.id_paciente}/editar`)}
                className="px-3 py-1.5 text-xs font-semibold text-primary border-1.5 border-primary rounded-md hover:bg-primary/5 transition-all whitespace-nowrap"
              >
                Editar Usuario
              </button>
            )}

            {(['MEDICO_GENERAL', 'ESPECIALISTA', 'SUPERADMIN', 'OMNIADMIN'].includes(user.rol) || canAccess(user.permisos, 'EXPEDIENTE', 'puede_editar')) && (
              <button
                onClick={() => navigate(`/pacientes/${paciente.id_paciente}/antecedentes`)}
                className="px-3 py-1.5 text-xs font-semibold text-primary border-1.5 border-primary rounded-md hover:bg-primary/5 transition-all whitespace-nowrap"
              >
                Agregar Antecedentes
              </button>
            )}

            {['MEDICO_GENERAL', 'ESPECIALISTA', 'SUPERADMIN', 'OMNIADMIN'].includes(user.rol) && (
              <button
                onClick={() => navigate(`/consulta/nueva?id_paciente=${paciente.id_paciente}`)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-md hover:bg-primary-hover shadow-md shadow-primary/20 transition-all whitespace-nowrap"
              >
                + Nueva Consulta
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-7">
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center mb-6 p-5 bg-[#F5F2EC] border border-border rounded-xl">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#5B7ABC] to-[#2459A8] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary/20 shrink-0">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-text-primary truncate">
              {paciente.persona?.nombre || `${paciente.nombre || ''} ${paciente.primer_apellido || ''}`}
            </h2>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-primary mt-1.5">
              <span>{calcularEdad(paciente?.persona?.fecha_nacimiento)} años</span>
              <span className="hidden xs:inline text-border">•</span>
              <span>Nac. {paciente.persona?.fecha_nacimiento || 'N/A'}</span>
              <span className="hidden xs:inline text-border">•</span>
              <span className="px-2 py-0.5 rounded bg-[#F5969C] text-[#BA2E45] font-bold text-[10px]">
                Grupo {paciente.grupo_sanguineo || 'N/A'}
              </span>
              <span className="hidden xs:inline text-border">•</span>
              <span className="flex items-center gap-1">📞 {paciente.persona?.telefono || paciente.persona?.telefono_contacto || 'N/A'}</span>
            </div>

            <p className="text-[10px] text-text-secondary mt-2 font-mono tracking-wider">
              CURP: {paciente.persona?.curp || 'N/A'}
            </p>
          </div>
        </div>

        {paciente?.persona?.alerta_barrera_linguistica && (
          <BarreraLinguisticaAlert paciente={paciente} size="large" />
        )}

        {paciente.alergias && paciente.alergias.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#5A5048',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#BA2E45',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                !
              </span>
              Alergias Registradas
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {paciente.alergias.map((alergia, i) => {
                const sev = (alergia.severidad || '').toLowerCase()
                const isHigh = ['alta', 'critica', 'crítica'].includes(sev)

                return (
                  <div
                    key={alergia.id_alergia || i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: isHigh ? '#F5969E' : '#F9E5BA',
                      border: `1.5px solid ${isHigh ? '#BA2E45' : '#B86E12'}`,
                      boxShadow: `0 2px 8px ${isHigh ? '#BA2E4530' : '#B86E1230'}`,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{isHigh ? '🔴' : '🟡'}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isHigh ? '#BA2E45' : '#B86E12' }}>
                        {alergia.nombre}
                      </div>
                      <div style={{ fontSize: 10, color: isHigh ? '#BA2E45' : '#B86E12', marginTop: 1 }}>
                        {isHigh ? 'Severidad alta' : 'Severidad moderada'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex border-b border-border mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {['Antecedentes', 'Medicamentos', 'Estudios', 'Notas', 'Encuentros'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab 
                ? 'text-primary border-primary bg-primary/5' 
                : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-black/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Antecedentes' && (
          <div className="space-y-5 animate-in fade-in duration-500">
            <div className="flex flex-wrap gap-3">
              {(['RECEPCIONISTA', 'ADMINISTRADOR', 'SUPERADMIN', 'OMNIADMIN'].includes(user.rol) || canAccess(user.permisos, 'PACIENTES', 'puede_editar')) && (
                <button
                  onClick={() => navigate(`/pacientes/${paciente.id_paciente}/editar`)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-primary rounded-md hover:bg-primary-hover shadow-sm transition-all"
                >
                  <FileText size={14} /> Editar Usuario
                </button>
              )}

              {(['MEDICO_GENERAL', 'ESPECIALISTA', 'SUPERADMIN', 'OMNIADMIN'].includes(user.rol) || canAccess(user.permisos, 'EXPEDIENTE', 'puede_editar')) && (
                <button
                  onClick={() => navigate(`/pacientes/${paciente.id_paciente}/antecedentes`)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-primary border-1.5 border-primary rounded-md hover:bg-primary/5 transition-all"
                >
                  <PlusCircle size={14} /> Agregar Antecedentes
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="p-5 bg-[#FDFAF5] border border-border rounded-xl shadow-sm">
                <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-4 border-b border-border/50 pb-2">
                  Enfermedades Crónicas
                </h3>

                {patologicos.length > 0 ? (
                  <div className="space-y-3">
                    {patologicos.map((item, i) => (
                      <div key={item.id_antecedente || i} className="flex gap-3 items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                        <span className="text-sm text-text-primary leading-relaxed font-medium">
                          {obtenerTextoAntecedente(item)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-text-secondary italic">Sin enfermedades crónicas registradas</p>
                  </div>
                )}
              </div>

              <div className="p-5 bg-[#FDFAF5] border border-border rounded-xl shadow-sm">
                <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-4 border-b border-border/50 pb-2">
                  Resumen Clínico
                </h3>

                <div className="space-y-3.5">
                  {[
                    ['Grupo Sanguíneo', paciente.grupo_sanguineo || 'N/A'],
                    ['Última Consulta', encuentros?.length ? formatearFecha(encuentros[0]?.fecha_inicio) : 'N/A'],
                    ['Total Consultas', encuentros?.length || '0'],
                    ['Alergias', paciente.alergias?.length ? `${paciente.alergias.length} registrada(s)` : 'Ninguna'],
                    ['Vacunas', inmunizaciones?.length ? `${inmunizaciones.length} registrada(s)` : 'Ninguna'],
                    ['Diabetes Heredofamiliar', heredoData?.diabetes ? '✅ Sí' : '❌ No'],
                    ['Hipertensión Heredofamiliar', heredoData?.hipertension ? '✅ Sí' : '❌ No'],
                    ['Tabaquismo', noPatData?.tabaquismo ? '✅ Sí' : '❌ No'],
                    ['Alcoholismo', noPatData?.alcoholismo ? '✅ Sí' : '❌ No'],
                    ['🌐 Lengua Materna', paciente.persona?.nombre_lengua || (paciente.persona?.id_lengua_materna ? `ID: ${paciente.persona.id_lengua_materna}` : 'No especificada')],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center gap-4 group">
                      <span className="text-[12px] text-text-secondary group-hover:text-text-primary transition-colors">{label}</span>
                      <span className="text-[12px] text-text-primary font-bold text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Medicamentos' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {medicamentos.length > 0 ? (
              medicamentos.map((med, i) => (
                <div
                  key={med._key || i}
                  className="p-4 bg-[#FDFAF5] border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-text-primary mb-1 truncate">
                        {obtenerNombreMedicamento(med)}
                      </h4>
                      <p className="text-xs text-text-secondary">
                        {[med.dosis, med.via_administracion, med.frecuencia].filter(Boolean).join(' · ') || 'Sin detalle de prescripción'}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <span className="text-[10px] text-text-secondary bg-black/5 px-2 py-1 rounded">
                        {formatearFecha(med.fecha_inicio)}
                      </span>
                      <span className="text-[11px] text-primary font-bold">
                        {med.motivo_consulta || 'Encuentro clínico'}
                      </span>
                    </div>
                  </div>

                  {med.indicaciones && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs text-text-primary leading-relaxed">
                        <strong className="text-text-secondary">Indicaciones:</strong> {med.indicaciones}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-text-secondary">
                <Pill size={40} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm">Sin medicamentos registrados</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Estudios' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FDFAF5', border: '1px dashed #DAD4CC', borderRadius: 10, color: '#5A5048', fontSize: 13 }}>
            <TrendingUp size={40} style={{ margin: '0 auto 16px', opacity: 0.3, color: '#2459A8' }} />
            <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: 14, color: '#1A1510' }}>Módulo de Estudios en Desarrollo</p>
            <p style={{ margin: 0, opacity: 0.8 }}>El historial de laboratorios e imagenología estará disponible en una próxima actualización.</p>
          </div>
        )}

        {activeTab === 'Notas' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {notas?.length > 0 ? (
              notas.map((nota, i) => (
                <div
                  key={nota.id_nota || i}
                  className="p-5 bg-[#FDFAF5] border border-border rounded-xl shadow-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
                        Nota Clínica {nota.esta_firmada ? '✓' : '(Borrador)'}
                      </h4>
                      <p className="text-[11px] text-text-secondary">
                        {formatearFecha(nota.fecha_inicio)} · {nota.motivo_consulta}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {nota.subjetivo && (
                      <div className="text-sm">
                        <span className="font-bold text-primary mr-2 text-xs">S:</span>
                        <span className="text-text-primary italic">"{nota.subjetivo}"</span>
                      </div>
                    )}
                    {nota.objetivo && (
                      <div className="text-sm">
                        <span className="font-bold text-primary mr-2 text-xs">O:</span>
                        <span className="text-text-primary">{nota.objetivo}</span>
                      </div>
                    )}
                    {nota.analisis && (
                      <div className="text-sm">
                        <span className="font-bold text-primary mr-2 text-xs">A:</span>
                        <span className="text-text-primary">{nota.analisis}</span>
                      </div>
                    )}
                    {nota.plan && (
                      <div className="text-sm">
                        <span className="font-bold text-primary mr-2 text-xs">P:</span>
                        <span className="text-text-primary">{nota.plan}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-text-secondary">
                <FileText size={40} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm">Sin notas clínicas registradas</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Encuentros' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {encuentros?.length > 0 ? (
              encuentros.map((encuentro) => (
                <div
                  key={encuentro.id_encuentro}
                  className="p-4 bg-[#FDFAF5] border border-border rounded-xl shadow-sm hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() =>
                    setExpandedEncuentro(
                      expandedEncuentro === encuentro.id_encuentro ? null : encuentro.id_encuentro
                    )
                  }
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
                        {encuentro.motivo_consulta}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-text-secondary">
                        <span className="flex items-center gap-1.5">📅 {formatearFecha(encuentro.fecha_inicio)}</span>
                        <span className="flex items-center gap-1.5">🕐 {encuentro.hora_inicio}</span>
                        <span className="flex items-center gap-1.5 font-medium text-text-primary">👨‍⚕️ {encuentro.medico}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight ${
                        encuentro.estado === 'abierto' 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {encuentro.estado === 'abierto' ? '⏳ Abierto' : `✓ ${encuentro.estado}`}
                      </span>

                      {encuentro.estado === 'abierto' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/consulta/nueva?id_encuentro=${encuentro.id_encuentro}&id_paciente=${paciente?.id_paciente || id}`)
                          }}
                          className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-md hover:bg-primary-hover shadow-sm"
                        >
                          Continuar
                        </button>
                      )}
                    </div>
                  </div>

                  {expandedEncuentro === encuentro.id_encuentro && (
                    <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                      {encuentro.diagnosticos?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">
                            Diagnósticos
                          </p>
                          <div className="space-y-1.5">
                            {encuentro.diagnosticos.map((dx, i) => (
                              <div key={i} className="text-xs text-text-primary flex gap-2">
                                <span className="text-primary">•</span>
                                <span>{typeof dx === 'string' ? dx : dx.descripcion_narrativa || dx.descripcion || dx.codigo_cie}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {encuentro.prescripciones?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">
                            Prescripciones
                          </p>
                          <div className="space-y-1.5">
                            {encuentro.prescripciones.map((rx, i) => (
                              <div key={i} className="text-xs text-text-primary flex gap-2">
                                <span className="text-primary-300">•</span>
                                <span>{typeof rx === 'string' ? rx : `${obtenerNombreMedicamento(rx)}${rx.dosis ? ` - ${rx.dosis}` : ''}`}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-text-secondary">
                <Clock size={40} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm">Sin encuentros registrados</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}