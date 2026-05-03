import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSignature,
  Search,
  Stethoscope,
  UserCircle,
  X,
  Play
} from 'lucide-react'
import { clinicoAPI } from '../../api/clinico'
import { useAuth } from '../../context/AuthContext'

const Field = ({ label, children, error, hint }) => (
  <div>
    <label className="block text-[11px] font-semibold text-[#5A5048] uppercase mb-1.5 tracking-wide">
      {label}
    </label>
    {children}
    {hint && !error && <span className="text-[10px] text-gray-400 mt-1 block">{hint}</span>}
    {error && <span className="text-[10px] text-red-500 mt-1 block">⚠ {error}</span>}
  </div>
)

const inputCls =
  'w-full px-3 py-2 border border-[#DAD4CC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] bg-white'

const textareaCls =
  'w-full px-3 py-2 border border-[#DAD4CC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] bg-white resize-none'

const NavButtons = ({ onPrev, onNext, loadingNext, labelNext = 'Continuar', disabledNext = false, isSubmit = false }) => (
  <div className="flex justify-between pt-6 border-t border-[#DAD4CC]">
    {onPrev ? (
      <button type="button" onClick={onPrev}
        className="flex items-center gap-1 text-sm text-[#5A5048] hover:text-[#1A1510] transition-colors">
        <ChevronLeft size={16} /> Anterior
      </button>
    ) : <span />}
    <button type="button" onClick={onNext} disabled={loadingNext || disabledNext}
      className={`${isSubmit ? 'bg-[#2D8653] hover:bg-[#236b41]' : 'bg-[#1B4F8A] hover:bg-[#153d6b]'} text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}>
      {loadingNext ? 'Guardando...' : labelNext}
      {!loadingNext && !isSubmit && <ChevronRight size={16} />}
      {!loadingNext && isSubmit && <CheckCircle2 size={16} />}
    </button>
  </div>
)

export default function NuevaConsultaPage() {
  const [searchParams] = useSearchParams()
  const idPaciente = searchParams.get('id_paciente')
  const paramIdEncuentro = searchParams.get('id_encuentro')
  const navigate = useNavigate()
  const { user } = useAuth()

  const [encuentroId, setEncuentroId] = useState(paramIdEncuentro || null)
  const [currentStep, setCurrentStep] = useState(paramIdEncuentro ? 2 : 0) // 0 = Iniciar
  const [pasosCompletados, setPasosCompletados] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState('')
  const [cieQuery, setCieQuery] = useState('')
  const [cieResultados, setCieResultados] = useState([])
  const [cieLoading, setCieLoading] = useState(false)

  const [signosReadOnly, setSignosReadOnly] = useState(false)

  const [formData, setFormData] = useState({
    motivo_consulta: '',
    // Signos
    peso: '', talla: '', tension_sistolica: '', tension_diastolica: '', fc: '', temp: '', spo2: '',
    // Subjetivo
    sintomas: '',
    // Objetivo
    exploracion_general: '', cabeza_cuello: '', torax: '', abdomen: '', extremidades: '',
    // Análisis
    diagnosticos: [],
    // Plan
    plan_terapeutico: '', 
    prescripciones: [], // Ahora es un array estructurado
  })

  const [medQuery, setMedQuery] = useState('')
  const [medResultados, setMedResultados] = useState([])
  const [medLoading, setMedLoading] = useState(false)

  // Estados para Alerta de Alergia (Persona 5 PRO)
  const [alertaAlergia, setAlertaAlergia] = useState(null)
  const [confirmarRiesgo, setConfirmarRiesgo] = useState(false)

  const pasos = useMemo(() => [
    { id: 1, nombre: 'Signos Vitales', icon: <Activity size={18} /> },
    { id: 2, nombre: 'Subjetivo', icon: <UserCircle size={18} /> },
    { id: 3, nombre: 'Objetivo', icon: <Stethoscope size={18} /> },
    { id: 4, nombre: 'Análisis', icon: <Search size={18} /> },
    { id: 5, nombre: 'Plan y Cierre', icon: <ClipboardList size={18} /> },
  ], [])

  const set = (key, value) => {
    setErrorGlobal('')
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const getNumericOrNull = (value, parser = parseFloat) => {
    if (value === '' || value === null || value === undefined) return null
    const parsed = parser(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  useEffect(() => {
    if (paramIdEncuentro) {
      // Cargar signos vitales si estamos retomando
      clinicoAPI.getSignos(paramIdEncuentro).then((res) => {
        if (res.data?.data) {
          const s = res.data.data
          setFormData(prev => ({
            ...prev,
            peso: s.peso_kg || '',
            talla: s.talla_cm || '',
            tension_sistolica: s.presion_sistolica || '',
            tension_diastolica: s.presion_diastolica || '',
            fc: s.frecuencia_cardiaca || '',
            temp: s.temperatura_c || '',
            spo2: s.saturacion_oxigeno || '',
            motivo_consulta: s.motivo_consulta || prev.motivo_consulta
          }))
          setSignosReadOnly(true)
          setPasosCompletados([1])
        }
      }).catch(err => console.error("Error cargando signos", err))
    }
  }, [paramIdEncuentro])

  useEffect(() => {
    let active = true
    const run = async () => {
      if (cieQuery.trim().length < 3) { setCieResultados([]); return }
      setCieLoading(true)
      try {
        const resp = await clinicoAPI.buscarCIE10(cieQuery.trim())
        const raw = resp?.data?.data || resp?.data || resp || []
        const lista = Array.isArray(raw) ? raw : []
        if (active) setCieResultados(lista.slice(0, 10))
      } catch {
        if (active) setCieResultados([])
      } finally {
        if (active) setCieLoading(false)
      }
    }
    const t = setTimeout(run, 300)
    return () => { active = false; clearTimeout(t) }
  }, [cieQuery])

  useEffect(() => {
    let active = true
    const run = async () => {
      if (medQuery.trim().length < 3) { setMedResultados([]); return }
      setMedLoading(true)
      try {
        const resp = await clinicoAPI.buscarMedicamentos(medQuery.trim())
        const lista = resp?.data?.data || []
        if (active) setMedResultados(lista.slice(0, 10))
      } catch {
        if (active) setMedResultados([])
      } finally {
        if (active) setMedLoading(false)
      }
    }
    const t = setTimeout(run, 300)
    return () => { active = false; clearTimeout(t) }
  }, [medQuery])

  const agregarDiagnostico = (item) => {
    if (formData.diagnosticos.length >= 5) return
    if (formData.diagnosticos.some((d) => d.id === item.id)) return
    setFormData((prev) => ({
      ...prev,
      diagnosticos: [...prev.diagnosticos, { id: item.id, codigo: item.codigo, descripcion: item.descripcion, tipo: prev.diagnosticos.length === 0 ? 'PRINCIPAL' : 'SECUNDARIO' }],
    }))
    setCieQuery(''); setCieResultados([]); setErrorGlobal('')
  }

  const eliminarDiagnostico = (id) => {
    setFormData((prev) => {
      const next = prev.diagnosticos.filter((d) => d.id !== id).map((d, i) => ({ ...d, tipo: i === 0 ? 'PRINCIPAL' : 'SECUNDARIO' }))
      return { ...prev, diagnosticos: next }
    })
  }

  const agregarMedicamento = async (med, ignorar = false) => {
    setMedLoading(true)
    setErrorGlobal('')
    try {
      // Verificar Alergia (Persona 5 Safety Check)
      await clinicoAPI.addPrescripcion(encuentroId, {
        codigo_medicamento_ssa: med.codigo_ssa || med.id,
        nombre_medicamento: med.nombre_generico,
        alerta_ignorada: ignorar,
        solo_verificar: true // Un flag para que el backend solo chequee y no guarde aún
      })

      // Si pasa la verificación, lo añadimos localmente
      setFormData(prev => ({
        ...prev,
        prescripciones: [...prev.prescripciones, { ...med, indicaciones: '' }]
      }))
      setMedQuery('')
      setMedResultados([])
    } catch (e) {
      if (e.response?.status === 409) {
        setAlertaAlergia({ ...e.response.data.detail, med_temp: med })
      } else {
        setErrorGlobal('Error al verificar medicamento')
      }
    } finally {
      setMedLoading(false)
    }
  }

  // --- HANDLERS PASOS ---

  const crearEncuentroInicial = async () => {
    if (!formData.motivo_consulta.trim()) {
      setErrorGlobal('El motivo de consulta es obligatorio para iniciar.')
      return
    }
    setLoading(true)
    setErrorGlobal('')
    try {
      const resp = await clinicoAPI.createEncuentro({
        id_paciente: idPaciente,
        motivo_consulta: formData.motivo_consulta.trim(),
        tipo_consulta: 'SUBSECUENTE'
      })
      const data = resp?.data || resp
      const nuevoId = data?.id_encuentro || data?.data?.id_encuentro || data?.id
      if (!nuevoId) throw new Error('La API no devolvió el id del encuentro.')
      setEncuentroId(nuevoId)
      setCurrentStep(1)
    } catch (error) {
      setErrorGlobal(error.response?.data?.detail || error.message || 'Error al crear encuentro')
    } finally {
      setLoading(false)
    }
  }

  const manejarPaso1 = async () => {
    if (signosReadOnly) {
      setCurrentStep(2)
      return
    }
    const sistolica = getNumericOrNull(formData.tension_sistolica, parseInt)
    const diastolica = getNumericOrNull(formData.tension_diastolica, parseInt)
    const temp = getNumericOrNull(formData.temp, parseFloat)
    const spo2 = getNumericOrNull(formData.spo2, parseFloat)
    const fc = getNumericOrNull(formData.fc, parseInt)
    
    const todosPresentes = sistolica !== null && diastolica !== null && temp !== null && spo2 !== null && fc !== null
    
    if (todosPresentes) {
      setLoading(true)
      try {
        await clinicoAPI.registrarSignos(encuentroId, {
          presion_sistolica: sistolica, presion_diastolica: diastolica, temperatura_c: temp,
          saturacion_oxigeno: Math.round(spo2), frecuencia_cardiaca: fc,
          peso_kg: getNumericOrNull(formData.peso, parseFloat), talla_cm: getNumericOrNull(formData.talla, parseFloat)
        })
        setPasosCompletados(prev => [...prev, 1])
      } catch (err) {
        setErrorGlobal('Error al guardar signos. Puede continuar sin ellos si lo desea.')
      } finally {
        setLoading(false)
      }
    }
    setCurrentStep(2)
  }

  const manejarPaso2 = () => {
    if (!formData.sintomas.trim()) {
      setErrorGlobal('Describa los síntomas en el apartado subjetivo.')
      return
    }
    setErrorGlobal('')
    setPasosCompletados(prev => [...prev, 2])
    setCurrentStep(3)
  }

  const manejarPaso3 = () => {
    setPasosCompletados(prev => [...prev, 3])
    setCurrentStep(4)
  }

  const manejarPaso4 = async () => {
    if (formData.diagnosticos.length === 0) {
      setErrorGlobal('Seleccione al menos un diagnóstico CIE-10.')
      return
    }
    setLoading(true)
    setErrorGlobal('')
    try {
      const principal = formData.diagnosticos[0]
      await clinicoAPI.addDiagnostico(encuentroId, {
        codigo_cie: principal.codigo, tipo: 'DEFINITIVO', observaciones: 'Diagnóstico principal'
      })
      setPasosCompletados(prev => [...prev, 4])
      setCurrentStep(5)
    } catch (err) {
      setErrorGlobal('Error al guardar diagnóstico')
    } finally {
      setLoading(false)
    }
  }

  const manejarPaso5 = async () => {
    if (!formData.plan_terapeutico.trim()) {
      setErrorGlobal('El plan terapéutico es obligatorio para cerrar.')
      return
    }
    setLoading(true)
    setErrorGlobal('')
    try {
      // 1. Guardar Notas SOAP
      const respNota = await clinicoAPI.crearNota(encuentroId, {
        tipo_nota: 'EVOLUCION',
        subjetivo: formData.sintomas,
        objetivo: [formData.exploracion_general, formData.cabeza_cuello, formData.torax, formData.abdomen, formData.extremidades].filter(Boolean).join('\n'),
        analisis: formData.diagnosticos.map(d => d.descripcion).join(', '),
        plan: formData.plan_terapeutico
      })
      const idNota = respNota.data?.id_nota || respNota.data?.id
      if (idNota) await clinicoAPI.firmarNota(idNota)

      // 2. Guardar Prescripciones Finales
      for (const p of formData.prescripciones) {
        await clinicoAPI.addPrescripcion(encuentroId, {
          codigo_medicamento_ssa: p.codigo_ssa || p.id,
          nombre_medicamento: p.nombre_generico,
          indicacion_dosis: p.indicaciones || 'Según indicación médica',
          duracion_dias: 7,
          cantidad_surtir: 1,
          alerta_ignorada: true // Si ya llegó aquí es que ya se autorizó
        })
      }

      await clinicoAPI.cerrarEncuentro(encuentroId)
      navigate(`/expediente/${idPaciente}`)
    } catch (error) {
      setErrorGlobal('Error al finalizar la consulta')
    } finally {
      setLoading(false)
    }
  }

  if (!idPaciente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <div className="text-center p-10">
          <AlertTriangle size={40} className="text-amber-500 mx-auto mb-4" />
          <p className="text-[#1A1510] font-bold">No se especificó un paciente.</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-[#1B4F8A] underline text-sm">Regresar</button>
        </div>
      </div>
    )
  }

  if (user?.rol === 'ENFERMERIA') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <div className="text-center p-10">
          <AlertTriangle size={40} className="text-red-500 mx-auto mb-4" />
          <p className="text-[#1A1510] font-bold">Acceso Denegado</p>
          <p className="text-sm text-[#5A5048] max-w-sm mt-2">
            El personal de enfermería no tiene permisos para crear o completar encuentros clínicos completos.
            Para registrar signos vitales de un paciente, utilice el módulo de Triaje desde su Dashboard.
          </p>
          <button onClick={() => navigate('/dashboard')} className="mt-6 bg-[#2D8653] text-white px-4 py-2 rounded font-bold">Ir al Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col font-sans">
      <header className="bg-white border-b border-[#DAD4CC] px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate(`/expediente/${idPaciente}`)}
            className="flex items-center gap-2 text-sm text-[#5A5048] hover:text-[#1A1510] transition-colors">
            <ChevronLeft size={18} /> Volver al expediente
          </button>
          <div className="h-8 w-px bg-[#DAD4CC]" />
          <div>
            <h1 className="text-lg font-bold text-[#1A1510]">Nueva Consulta Médica</h1>
            <p className="text-xs text-[#5A5048]">Paciente ID: {idPaciente}</p>
            {formData.motivo_consulta && (
              <p className="text-xs text-[#1B4F8A] font-semibold mt-0.5 max-w-md truncate">
                Motivo: {formData.motivo_consulta}
              </p>
            )}
          </div>
        </div>

        {currentStep > 0 && (
          <div className="flex items-center gap-1">
            {pasos.map((step, idx) => {
              const isCompleted = pasosCompletados.includes(step.id)
              const isActive = currentStep === step.id
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center min-w-[68px]">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        isActive ? 'bg-[#1B4F8A] text-white ring-4 ring-blue-100' : isCompleted || step.id < currentStep ? 'bg-[#2D8653] text-white cursor-pointer hover:bg-[#236b41]' : 'bg-[#DAD4CC] text-gray-500'
                      }`}
                      onClick={() => { if(isCompleted || step.id < currentStep) setCurrentStep(step.id) }}
                    >
                      {isCompleted ? <CheckCircle2 size={15} /> : step.id}
                    </div>
                    <span 
                      className={`text-[9px] mt-0.5 font-medium uppercase tracking-wide ${isActive ? 'text-[#1B4F8A]' : isCompleted || step.id < currentStep ? 'text-[#2D8653] cursor-pointer hover:text-[#236b41]' : 'text-gray-400'}`}
                      onClick={() => { if(isCompleted || step.id < currentStep) setCurrentStep(step.id) }}
                    >
                      {step.nombre}
                    </span>
                  </div>
                  {idx < pasos.length - 1 && (
                    <div className={`w-8 h-[2px] mb-3 flex-shrink-0 ${isCompleted ? 'bg-[#2D8653]' : 'bg-[#DAD4CC]'}`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        )}
      </header>

      {errorGlobal && (
        <div className="mx-8 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 whitespace-pre-line">{errorGlobal}</p>
        </div>
      )}

      <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-xl border border-[#DAD4CC] shadow-sm p-8 space-y-6">

          {/* PASO 0: Crear Encuentro */}
          {currentStep === 0 && (
            <div className="space-y-5 text-center">
              <h2 className="text-[#1B4F8A] font-bold text-xl mb-4">Iniciar Consulta</h2>
              <p className="text-sm text-[#5A5048] max-w-md mx-auto mb-6">
                Ingrese el motivo de consulta. Al iniciar, el encuentro se registrará en el sistema y podrá ser derivado a enfermería para la toma de signos vitales.
              </p>
              <div className="text-left max-w-lg mx-auto">
                <Field label="Motivo de consulta (En palabras del paciente) *">
                  <textarea className={textareaCls} rows={3}
                    placeholder="Ej: Dolor de cabeza intenso desde hace 3 días..."
                    value={formData.motivo_consulta}
                    onChange={(e) => set('motivo_consulta', e.target.value)} />
                </Field>
                <div className="mt-6 flex justify-end">
                  <button onClick={crearEncuentroInicial} disabled={loading}
                    className="bg-[#1B4F8A] text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#153d6b] transition-colors">
                    {loading ? 'Iniciando...' : 'Iniciar Encuentro Médico'} <Play size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PASO 1: Signos */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <h2 className="text-[#1B4F8A] font-bold flex items-center gap-2 text-base">
                  <Activity size={20} /> Signos Vitales
                </h2>
                {signosReadOnly && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Tomados por Enfermería ✓</span>}
              </div>
              
              {!signosReadOnly && (
                <p className="text-xs text-[#5A5048] -mt-2">
                  Puede registrarlos usted mismo, o dejar la consulta abierta para que Enfermería los tome.
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field label="Peso (kg)">
                  <input type="number" className={inputCls} value={formData.peso} onChange={(e) => set('peso', e.target.value)} disabled={signosReadOnly} />
                </Field>
                <Field label="Talla (cm)">
                  <input type="number" className={inputCls} value={formData.talla} onChange={(e) => set('talla', e.target.value)} disabled={signosReadOnly} />
                </Field>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#5A5048] uppercase mb-2 tracking-wide">Tensión arterial (mmHg)</label>
                <div className="flex items-center gap-3">
                  <input type="number" className={`${inputCls} text-center`} placeholder="Sistólica" value={formData.tension_sistolica} onChange={(e) => set('tension_sistolica', e.target.value)} disabled={signosReadOnly} />
                  <span className="text-gray-400 font-bold text-lg">/</span>
                  <input type="number" className={`${inputCls} text-center`} placeholder="Diastólica" value={formData.tension_diastolica} onChange={(e) => set('tension_diastolica', e.target.value)} disabled={signosReadOnly} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="FC (lpm)"><input type="number" className={inputCls} value={formData.fc} onChange={(e) => set('fc', e.target.value)} disabled={signosReadOnly} /></Field>
                <Field label="Temp (°C)"><input type="number" className={inputCls} value={formData.temp} onChange={(e) => set('temp', e.target.value)} disabled={signosReadOnly} /></Field>
                <Field label="SpO2 (%)"><input type="number" className={inputCls} value={formData.spo2} onChange={(e) => set('spo2', e.target.value)} disabled={signosReadOnly} /></Field>
              </div>

              {!signosReadOnly && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mt-4 flex items-start gap-3">
                  <Activity className="text-orange-500 mt-0.5" size={18} />
                  <div className="text-sm text-orange-800">
                    <strong>¿Desea que enfermería tome los signos?</strong>
                    <p className="mt-1">Puede regresar al dashboard. El encuentro quedará abierto en el panel de Enfermería.</p>
                  </div>
                </div>
              )}

              <NavButtons onNext={manejarPaso1} loadingNext={loading} labelNext={signosReadOnly ? "Continuar" : "Guardar y Continuar"} />
            </div>
          )}

          {/* PASO 2: Subjetivo */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <h2 className="text-[#1B4F8A] font-bold flex items-center gap-2 text-base"><UserCircle size={20} /> Subjetivo (SOAP)</h2>
              <Field label="Motivo de Consulta (Registrado)">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">{formData.motivo_consulta || 'Sin motivo inicial'}</div>
              </Field>
              <Field label="Síntomas y Evolución *">
                <textarea className={textareaCls} rows={5} placeholder="Describa síntomas, tiempo de evolución, características..." value={formData.sintomas} onChange={(e) => set('sintomas', e.target.value)} />
              </Field>
              <NavButtons onPrev={() => setCurrentStep(1)} onNext={manejarPaso2} loadingNext={false} />
            </div>
          )}

          {/* PASO 3: Objetivo */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <h2 className="text-[#1B4F8A] font-bold flex items-center gap-2 text-base"><Stethoscope size={20} /> Objetivo (Exploración)</h2>
              <Field label="Exploración general"><textarea className={textareaCls} rows={2} value={formData.exploracion_general} onChange={(e) => set('exploracion_general', e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Cabeza y cuello"><textarea className={textareaCls} rows={2} value={formData.cabeza_cuello} onChange={(e) => set('cabeza_cuello', e.target.value)} /></Field>
                <Field label="Tórax y cardiopulmonar"><textarea className={textareaCls} rows={2} value={formData.torax} onChange={(e) => set('torax', e.target.value)} /></Field>
                <Field label="Abdomen"><textarea className={textareaCls} rows={2} value={formData.abdomen} onChange={(e) => set('abdomen', e.target.value)} /></Field>
                <Field label="Extremidades"><textarea className={textareaCls} rows={2} value={formData.extremidades} onChange={(e) => set('extremidades', e.target.value)} /></Field>
              </div>
              <NavButtons onPrev={() => setCurrentStep(2)} onNext={manejarPaso3} loadingNext={false} />
            </div>
          )}

          {/* PASO 4: Diagnóstico */}
          {currentStep === 4 && (
             <div className="space-y-5">
             <h2 className="text-[#1B4F8A] font-bold flex items-center gap-2 text-base">
               <Search size={20} /> Diagnóstico CIE-10
             </h2>
             <div className="relative">
               <Search className="absolute left-3 top-3 text-gray-400" size={18} />
               <input type="text" className="w-full pl-10 pr-4 py-2 border border-[#DAD4CC] rounded-lg focus:ring-2 focus:ring-[#1B4F8A] outline-none text-sm" placeholder="Buscar diagnóstico (ej: E11)" value={cieQuery} onChange={(e) => setCieQuery(e.target.value)} disabled={formData.diagnosticos.length >= 5} />
               {cieResultados.length > 0 && (
                 <div className="absolute z-20 w-full bg-white border border-[#DAD4CC] rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto">
                   {cieResultados.map((item) => (
                     <div key={item.id} className="p-3 flex justify-between items-center border-b hover:bg-blue-50 cursor-pointer" onClick={() => agregarDiagnostico(item)}>
                       <div><span className="font-bold text-[#1B4F8A] text-sm">{item.codigo}</span> <span className="text-sm text-gray-600">{item.descripcion}</span></div>
                       <span className="text-gray-400">+</span>
                     </div>
                   ))}
                 </div>
               )}
             </div>
             <div className="flex flex-wrap gap-2">
               {formData.diagnosticos.map((d, index) => (
                 <div key={d.id} className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                   <span className="text-xs font-black bg-[#1B4F8A] text-white px-1.5 py-0.5 rounded">{d.codigo}</span>
                   <span className="text-xs text-blue-900 font-medium">{d.descripcion}</span>
                   <button type="button" onClick={() => eliminarDiagnostico(d.id)} className="text-blue-300 hover:text-red-500 ml-1"><X size={13} /></button>
                 </div>
               ))}
             </div>
             <NavButtons onPrev={() => setCurrentStep(3)} onNext={manejarPaso4} loadingNext={loading} disabledNext={formData.diagnosticos.length === 0} />
           </div>
          )}

          {/* PASO 5: Plan */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <h2 className="text-[#1B4F8A] font-bold flex items-center gap-2 text-base"><FileSignature size={20} /> Plan y Cierre</h2>
              <Field label="Plan terapéutico *"><textarea className={textareaCls} rows={4} value={formData.plan_terapeutico} onChange={(e) => set('plan_terapeutico', e.target.value)} /></Field>
              
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-[#1B4F8A] flex items-center gap-2">
                  <ClipboardList size={16} /> Receta Médica Estructurada
                </h3>
                
                {/* Buscador de Medicamentos */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-2 border border-[#DAD4CC] rounded-xl focus:ring-2 focus:ring-[#1B4F8A] outline-none text-sm bg-gray-50/50" 
                    placeholder="Buscar medicamento por nombre o sustancia..." 
                    value={medQuery} 
                    onChange={(e) => setMedQuery(e.target.value)} 
                  />
                  {medLoading && <div className="absolute right-3 top-2.5 animate-spin h-4 w-4 border-2 border-[#1B4F8A] border-t-transparent rounded-full" />}
                  
                  {medResultados.length > 0 && (
                    <div className="absolute z-30 w-full bg-white border border-[#DAD4CC] rounded-xl shadow-2xl mt-1 max-h-60 overflow-y-auto">
                      {medResultados.map((m) => (
                        <div 
                          key={m.codigo_medicamento_ssa} 
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 transition-colors"
                          onClick={() => agregarMedicamento(m)}
                        >
                          <p className="text-xs font-bold text-[#1B4F8A]">{m.nombre_generico}</p>
                          <p className="text-[10px] text-gray-500">{m.presentacion} • {m.forma_farmaceutica}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lista de medicamentos agregados */}
                <div className="space-y-2">
                  {formData.prescripciones.map((p, idx) => (
                    <div key={idx} className="p-3 bg-white border border-[#DAD4CC] rounded-xl shadow-sm flex flex-col gap-2 animate-in slide-in-from-right-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-[#1A1510]">{p.nombre_generico}</p>
                          <p className="text-[10px] text-gray-500 uppercase">{p.presentacion}</p>
                        </div>
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, prescripciones: prev.prescripciones.filter((_, i) => i !== idx) }))}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        className="w-full px-3 py-1.5 bg-gray-50 border-none rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#1B4F8A]" 
                        placeholder="Indicaciones (ej: 1 cada 8 horas por 7 días)"
                        value={p.indicaciones}
                        onChange={(e) => {
                          const list = [...formData.prescripciones];
                          list[idx].indicaciones = e.target.value;
                          set('prescripciones', list);
                        }}
                      />
                    </div>
                  ))}
                  {formData.prescripciones.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl">
                      <p className="text-xs text-gray-400 italic">No hay medicamentos agregados a la receta.</p>
                    </div>
                  )}
                </div>
              </div>

              <NavButtons onPrev={() => setCurrentStep(4)} onNext={manejarPaso5} loadingNext={loading} labelNext="Finalizar y Cerrar Encuentro" isSubmit={true} />
            </div>
          )}

        </div>

        {/* Modal de Alerta de Seguridad Clínica (Persona 5 PRO) */}
        {alertaAlergia && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-red-500 animate-in zoom-in-95 duration-300">
              <div className="bg-red-600 p-6 text-white text-center">
                <AlertTriangle size={56} className="mx-auto mb-3 animate-pulse" />
                <h3 className="text-xl font-black uppercase tracking-tighter">¡Alerta de Seguridad Clínica!</h3>
                <p className="text-sm opacity-90 mt-1">Riesgo de Reacción Alérgica Detectado</p>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <p className="text-red-900 text-sm font-medium leading-relaxed">
                    {alertaAlergia.mensaje}
                  </p>
                  <div className="mt-3 pt-3 border-t border-red-200 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-red-600 uppercase">Gravedad del riesgo</span>
                    <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full uppercase">
                      {alertaAlergia.severidad || 'CRÍTICA'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="confirmRiesgo" 
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    checked={confirmarRiesgo}
                    onChange={(e) => setConfirmarRiesgo(e.target.checked)}
                  />
                  <label htmlFor="confirmRiesgo" className="text-xs text-gray-600 leading-tight">
                    Confirmo que he revisado el historial del paciente y asumo la responsabilidad clínica de esta prescripción.
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      setAlertaAlergia(null);
                      setConfirmarRiesgo(false);
                    }}
                    className="px-4 py-3 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Cancelar Receta
                  </button>
                  <button 
                    disabled={!confirmarRiesgo}
                    onClick={() => {
                      const med = alertaAlergia.med_temp;
                      setAlertaAlergia(null);
                      setConfirmarRiesgo(false);
                      if (med) agregarMedicamento(med, true); // Re-intentar agregando el medicamento
                    }}
                    className="px-4 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-red-200"
                  >
                    Ignorar y Agregar
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                <p className="text-[10px] text-gray-400">Esta acción quedará registrada en la bitácora de seguridad con su firma digital.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}