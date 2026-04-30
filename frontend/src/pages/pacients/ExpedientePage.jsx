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

        // ===== CORREGIDO: Usar getExpedienteCompleto que SÍ existe =====
        try {
          const expRes = await pacientesAPI.getExpedienteCompleto(id)
          const expData = extraerObjeto(expRes)
          antecedentesData = expData?.antecedentes || expData || {}
          console.log('📦 Antecedentes cargados:', antecedentesData)
        } catch (err) {
          console.warn('No se pudieron cargar antecedentes', err)
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#EDEBE6' }}>
      <div
        style={{
          padding: '16px 28px',
          background: '#FDFAF5',
          borderBottom: '1px solid #DAD4CC',
          backdropFilter: 'blur(12px)',
          zIndex: 10,
          boxShadow: '0 1px 3px rgba(26,21,16,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/pacientes')}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#2C2620',
                padding: '4px 8px',
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 style={{ color: '#1A1510', fontSize: 18, fontWeight: 700, margin: 0 }}>
                Expediente Clínico
              </h1>
              <p style={{ color: '#5A5048', fontSize: 12, margin: '4px 0 0 0' }}>
                {paciente.numero_expediente} · {paciente.persona?.nombre || paciente.nombre}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {(['RECEPCIONISTA', 'ADMINISTRADOR', 'SUPERADMIN', 'OMNIADMIN'].includes(user.rol) || canAccess(user.permisos, 'PACIENTES', 'puede_editar')) && (
              <button
                onClick={() => navigate(`/pacientes/${paciente.id_paciente}/editar`)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1.5px solid #2459A8',
                  color: '#2459A8',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                Editar Usuario
              </button>
            )}

            {(['MEDICO_GENERAL', 'ESPECIALISTA', 'SUPERADMIN', 'OMNIADMIN'].includes(user.rol) || canAccess(user.permisos, 'EXPEDIENTE', 'puede_editar')) && (
              <button
                onClick={() => navigate(`/pacientes/${paciente.id_paciente}/antecedentes`)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1.5px solid #2459A8',
                  color: '#2459A8',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                Agregar Antecedentes
              </button>
            )}

            {['MEDICO_GENERAL', 'ESPECIALISTA', 'SUPERADMIN', 'OMNIADMIN'].includes(user.rol) && (
              <button
                onClick={() => navigate(`/consulta/nueva?id_paciente=${paciente.id_paciente}`)}
                style={{
                  padding: '8px 16px',
                  background: '#2459A8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                + Nueva Consulta
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px' }}>
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'flex-start',
            marginBottom: 20,
            padding: '18px 20px',
            background: '#F5F2EC',
            border: '1px solid #DAD4CC',
            borderRadius: 12,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              flexShrink: 0,
              background: 'linear-gradient(135deg, #5B7ABC, #2459A8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {initials}
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#1A1510', fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>
              {paciente.persona?.nombre || `${paciente.nombre || ''} ${paciente.primer_apellido || ''}`}
            </h2>

            <div style={{ color: '#2C2620', fontSize: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span>{calcularEdad(paciente?.persona?.fecha_nacimiento)} años</span>
              <span>·</span>
              <span>Nac. {paciente.persona?.fecha_nacimiento || 'N/A'}</span>
              <span>·</span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: '#F5969C',
                  color: '#BA2E45',
                  fontWeight: 600,
                  fontSize: 11,
                }}
              >
                Grupo {paciente.grupo_sanguineo || 'N/A'}
              </span>
              <span>·</span>
              <span>📞 {paciente.persona?.telefono || paciente.persona?.telefono_contacto || 'N/A'}</span>
            </div>

            <p style={{ color: '#5A5048', fontSize: 10, margin: '6px 0 0 0', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
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

        <div
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: '1px solid #DAD4CC',
            marginBottom: 18,
            overflowX: 'auto',
          }}
        >
          {['Antecedentes', 'Medicamentos', 'Estudios', 'Notas', 'Encuentros'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 18px',
                border: 'none',
                background: 'transparent',
                fontSize: 13,
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? '#2459A8' : '#2C2620',
                borderBottom: `2px solid ${activeTab === tab ? '#2459A8' : 'transparent'}`,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Antecedentes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['RECEPCIONISTA', 'ADMINISTRADOR', 'SUPERADMIN', 'OMNIADMIN'].includes(user.rol) || canAccess(user.permisos, 'PACIENTES', 'puede_editar')) && (
                <button
                  onClick={() => navigate(`/pacientes/${paciente.id_paciente}/editar`)}
                  style={{
                    padding: '8px 16px',
                    background: '#2459A8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <FileText size={14} /> Editar Usuario
                </button>
              )}

              {(['MEDICO_GENERAL', 'ESPECIALISTA', 'SUPERADMIN', 'OMNIADMIN'].includes(user.rol) || canAccess(user.permisos, 'EXPEDIENTE', 'puede_editar')) && (
                <button
                  onClick={() => navigate(`/pacientes/${paciente.id_paciente}/antecedentes`)}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1.5px solid #2459A8',
                    color: '#2459A8',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <PlusCircle size={14} /> Agregar Antecedentes
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ padding: 18, background: '#FDFAF5', border: '1px solid #DAD4CC', borderRadius: 10 }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: '#5A5048', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 14 }}>
                  Enfermedades Crónicas
                </h3>

                {patologicos.length > 0 ? (
                  patologicos.map((item, i) => (
                    <div key={item.id_antecedente || i} style={{ display: 'flex', gap: 9, marginBottom: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8921F', marginTop: 5, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#1A1510', lineHeight: 1.45 }}>
                        {obtenerTextoAntecedente(item)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 13, color: '#5A5048', fontStyle: 'italic' }}>
                    Sin enfermedades crónicas registradas
                  </div>
                )}
              </div>

              <div style={{ padding: 18, background: '#FDFAF5', border: '1px solid #DAD4CC', borderRadius: 10 }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: '#5A5048', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 14 }}>
                  Resumen Clínico
                </h3>

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
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#5A5048' }}>{label}</span>
                    <span style={{ fontSize: 12, color: '#1A1510', fontWeight: 500, textAlign: 'right' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Medicamentos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {medicamentos.length > 0 ? (
              medicamentos.map((med, i) => (
                <div
                  key={med._key || i}
                  style={{
                    padding: 16,
                    background: '#FDFAF5',
                    border: '1px solid #DAD4CC',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: 14, fontWeight: 700, color: '#1A1510' }}>
                        {obtenerNombreMedicamento(med)}
                      </h4>
                      <p style={{ margin: '0 0 4px 0', fontSize: 12, color: '#5A5048' }}>
                        {[med.dosis, med.via_administracion, med.frecuencia].filter(Boolean).join(' · ') || 'Sin detalle de prescripción'}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#5A5048' }}>
                        {formatearFecha(med.fecha_inicio)}
                      </div>
                      <div style={{ fontSize: 11, color: '#2459A8', fontWeight: 600 }}>
                        {med.motivo_consulta || 'Encuentro clínico'}
                      </div>
                    </div>
                  </div>

                  {med.indicaciones && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #E7E0D8' }}>
                      <p style={{ margin: 0, fontSize: 12, color: '#1A1510' }}>
                        <strong>Indicaciones:</strong> {med.indicaciones}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#5A5048', fontSize: 13 }}>
                <Pill size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                Sin medicamentos registrados
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {notas?.length > 0 ? (
              notas.map((nota, i) => (
                <div
                  key={nota.id_nota || i}
                  style={{
                    padding: 16,
                    background: '#FDFAF5',
                    border: '1px solid #DAD4CC',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ color: '#1A1510', fontSize: 14, fontWeight: 700, margin: '0 0 4px 0' }}>
                        Nota SOAP
                      </h4>
                      <div style={{ fontSize: 12, color: '#5A5048' }}>
                        {formatearFecha(nota.fecha_inicio)} · {nota.motivo_consulta}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '4px 10px',
                        background: nota.esta_firmada ? '#E8F5E9' : '#FFF4D6',
                        color: nota.esta_firmada ? '#237A4B' : '#9A6700',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {nota.esta_firmada ? '✓ Firmada' : '✍ Borrador'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, fontSize: 13, color: '#1A1510' }}>
                    {nota.subjetivo && (
                      <div><strong style={{ color: '#2459A8' }}>S:</strong> {nota.subjetivo}</div>
                    )}
                    {nota.objetivo && (
                      <div><strong style={{ color: '#2459A8' }}>O:</strong> {nota.objetivo}</div>
                    )}
                    {nota.analisis && (
                      <div><strong style={{ color: '#2459A8' }}>A:</strong> {nota.analisis}</div>
                    )}
                    {nota.plan && (
                      <div><strong style={{ color: '#2459A8' }}>P:</strong> {nota.plan}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#5A5048', fontSize: 13 }}>
                <FileText size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                Sin notas clínicas registradas
              </div>
            )}
          </div>
        )}

        {activeTab === 'Encuentros' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {encuentros?.length > 0 ? (
              encuentros.map((encuentro) => (
                <div
                  key={encuentro.id_encuentro}
                  style={{
                    padding: 16,
                    background: '#FDFAF5',
                    border: '1px solid #DAD4CC',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() =>
                    setExpandedEncuentro(
                      expandedEncuentro === encuentro.id_encuentro ? null : encuentro.id_encuentro
                    )
                  }
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <h4 style={{ color: '#1A1510', fontSize: 13, fontWeight: 600, margin: '0 0 6px 0' }}>
                        {encuentro.motivo_consulta}
                      </h4>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#5A5048', flexWrap: 'wrap' }}>
                        <span>📅 {formatearFecha(encuentro.fecha_inicio)}</span>
                        <span>🕐 {encuentro.hora_inicio}</span>
                        <span>👨‍⚕️ {encuentro.medico}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          background: encuentro.estado === 'abierto' ? '#FFF4D6' : '#E8F5E9',
                          color: encuentro.estado === 'abierto' ? '#9A6700' : '#237A4B',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {encuentro.estado === 'abierto' ? '⏳ Abierto' : `✓ ${encuentro.estado}`}
                      </span>

                      {encuentro.estado === 'abierto' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/consulta/nueva?id_encuentro=${encuentro.id_encuentro}&id_paciente=${paciente?.id_paciente || id}`)
                          }}
                          style={{
                            background: '#1B4F8A',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          Continuar Consulta
                        </button>
                      )}
                    </div>
                  </div>

                  {expandedEncuentro === encuentro.id_encuentro && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #DAD4CC' }}>
                      {encuentro.diagnosticos?.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <p style={{ color: '#5A5048', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
                            Diagnósticos
                          </p>
                          {encuentro.diagnosticos.map((dx, i) => (
                            <p key={i} style={{ fontSize: 12, color: '#1A1510', margin: '4px 0' }}>
                              • {typeof dx === 'string' ? dx : dx.descripcion_narrativa || dx.descripcion || dx.codigo_cie || 'Diagnóstico'}
                            </p>
                          ))}
                        </div>
                      )}

                      {encuentro.prescripciones?.length > 0 && (
                        <div>
                          <p style={{ color: '#5A5048', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
                            Prescripciones
                          </p>
                          {encuentro.prescripciones.map((rx, i) => (
                            <p key={i} style={{ fontSize: 12, color: '#1A1510', margin: '4px 0' }}>
                              • {typeof rx === 'string' ? rx : `${obtenerNombreMedicamento(rx)}${rx.dosis ? ` - ${rx.dosis}` : ''}`}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#5A5048', fontSize: 13 }}>
                <Clock size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                Sin encuentros registrados
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}