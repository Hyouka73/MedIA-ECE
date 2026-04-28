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
} from 'lucide-react'
import { clinicoAPI } from '../../api/clinico'


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

const NavButtons = ({ onPrev, onNext, loadingNext, labelNext = 'Continuar', disabledNext = false }) => (
  <div className="flex justify-between pt-6 border-t border-[#DAD4CC]">
    {onPrev ? (
      <button type="button" onClick={onPrev}
        className="flex items-center gap-1 text-sm text-[#5A5048] hover:text-[#1A1510] transition-colors">
        <ChevronLeft size={16} /> Anterior
      </button>
    ) : <span />}
    <button type="button" onClick={onNext} disabled={loadingNext || disabledNext}
      className="bg-[#1B4F8A] text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#153d6b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
      {loadingNext ? 'Guardando...' : labelNext}
      {!loadingNext && <ChevronRight size={16} />}
    </button>
  </div>
)

export default function NuevaConsultaPage() {
  const [searchParams] = useSearchParams()
  const idPaciente = searchParams.get('id_paciente')
  const navigate = useNavigate()

  const [encuentroId, setEncuentroId]       = useState(null)
  const [currentStep, setCurrentStep]       = useState(1)
  const [pasosCompletados, setPasosCompletados] = useState([])
  const [loading, setLoading]               = useState(false)
  const [errorGlobal, setErrorGlobal]       = useState('')
  const [cieQuery, setCieQuery]             = useState('')
  const [cieResultados, setCieResultados]   = useState([])
  const [cieLoading, setCieLoading]         = useState(false)

  const [formData, setFormData] = useState({
    motivo_consulta:    '',
    sintomas:           '',
    peso:               '',
    talla:              '',
    tension_sistolica:  '',
    tension_diastolica: '',
    fc:                 '',
    temp:               '',
    spo2:               '',
    exploracion_general:'',
    cabeza_cuello:      '',
    torax:              '',
    abdomen:            '',
    extremidades:       '',
    diagnosticos:       [],
    plan_terapeutico:   '',
    prescripciones:     '',
  })

  const pasos = useMemo(() => [
    { id: 1, nombre: 'Subjetivo + Signos', icon: <UserCircle size={18} /> },
    { id: 2, nombre: 'Diagnóstico',        icon: <Search size={18} /> },
    { id: 3, nombre: 'Exploración',        icon: <Stethoscope size={18} /> },
    { id: 4, nombre: 'Plan',               icon: <ClipboardList size={18} /> },
  ], [])

  const set = (key, value) => {
    setErrorGlobal('')
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const marcarPasoCompletado = (stepId) =>
    setPasosCompletados((prev) => prev.includes(stepId) ? prev : [...prev, stepId])

  const getNumericOrNull = (value, parser = parseFloat) => {
    if (value === '' || value === null || value === undefined) return null
    const parsed = parser(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  const extraerMensajeError = (error) => {
    if (error?.response?.data?.detail && Array.isArray(error.response.data.detail)) {
      return error.response.data.detail
        .map((e) => `${e.loc?.join('.') || 'campo'}: ${e.msg}`)
        .join(' | ')
    }
    if (typeof error?.response?.data?.detail === 'string') return error.response.data.detail
    if (error?.response?.data?.message) return error.response.data.message
    return error?.message || 'Error desconocido'
  }

  const extraerIdEncuentro = (resp) => {
    const data = resp?.data || resp
    return data?.id_encuentro || data?.data?.id_encuentro || data?.id || data?.data?.id || null
  }

  const canGoStep2      = formData.motivo_consulta.trim().length > 0
  const canGoStep3      = canGoStep2 && formData.diagnosticos.length > 0
  const canCloseEncounter =
    formData.motivo_consulta.trim().length > 0 &&
    formData.diagnosticos.length > 0 &&
    formData.plan_terapeutico.trim().length > 0

  useEffect(() => {
    let active = true
    const run = async () => {
      if (cieQuery.trim().length < 3) { setCieResultados([]); return }
      setCieLoading(true)
      try {
        const resp = await clinicoAPI.buscarCIE10(cieQuery.trim())
        const raw  = resp?.data?.data || resp?.data || resp || []
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

  const agregarDiagnostico = (item) => {
    if (formData.diagnosticos.length >= 5) return
    if (formData.diagnosticos.some((d) => d.id === item.id)) return
    setFormData((prev) => ({
      ...prev,
      diagnosticos: [
        ...prev.diagnosticos,
        {
          id:          item.id,
          codigo:      item.codigo,
          descripcion: item.descripcion,
          tipo:        prev.diagnosticos.length === 0 ? 'PRINCIPAL' : 'SECUNDARIO',
        },
      ],
    }))
    setCieQuery('')
    setCieResultados([])
    setErrorGlobal('')
  }

  const eliminarDiagnostico = (id) => {
    setFormData((prev) => {
      const next = prev.diagnosticos
        .filter((d) => d.id !== id)
        .map((d, i) => ({ ...d, tipo: i === 0 ? 'PRINCIPAL' : 'SECUNDARIO' }))
      return { ...prev, diagnosticos: next }
    })
  }

  const manejarPaso1 = () => {
    if (!formData.motivo_consulta.trim()) {
      setErrorGlobal('El motivo de consulta es obligatorio.')
      return
    }
    setErrorGlobal('')
    marcarPasoCompletado(1)
    setCurrentStep(2)
  }

  const manejarPaso2 = () => {
    if (formData.diagnosticos.length === 0) {
      setErrorGlobal('Debes seleccionar al menos un diagnóstico.')
      return
    }
    setErrorGlobal('')
    marcarPasoCompletado(2)
    setCurrentStep(3)
  }

  const manejarPaso3 = async () => {
    setErrorGlobal('')
    setLoading(true)

    const principal = formData.diagnosticos[0]

    try {
      // 1. Crear encuentro
      const resp = await clinicoAPI.createEncuentro({
        id_paciente:     idPaciente,
        motivo_consulta: formData.motivo_consulta.trim(),
        diagnostico:     principal.descripcion,
        id_diagnostico:  principal.codigo,
        tipo_consulta:   'SUBSECUENTE',
      })

      const nuevoId = extraerIdEncuentro(resp)
      if (!nuevoId) throw new Error('La API no devolvió el id del encuentro.')
      
      setEncuentroId(nuevoId)

      // 2. Signos vitales — solo si están todos presentes y en rango
      const sistolica = getNumericOrNull(formData.tension_sistolica, parseInt)
      const diastolica = getNumericOrNull(formData.tension_diastolica, parseInt)
      const temp = getNumericOrNull(formData.temp, parseFloat)
      const spo2Raw = getNumericOrNull(formData.spo2, parseFloat)
      const spo2 = spo2Raw !== null ? Math.round(spo2Raw) : null
      const fc = getNumericOrNull(formData.fc, parseInt)

      const todosPresentes = sistolica !== null && diastolica !== null && 
                             temp !== null && spo2 !== null && fc !== null

      const enRango = todosPresentes &&
        sistolica >= 60 && sistolica <= 250 &&
        diastolica >= 40 && diastolica <= 150 &&
        temp >= 34.0 && temp <= 42.0 &&
        spo2 >= 70 && spo2 <= 100 &&
        fc >= 30 && fc <= 220

      if (enRango) {
        const payloadSignos = {
          presion_sistolica: sistolica,
          presion_diastolica: diastolica,
          temperatura_c: temp,
          saturacion_oxigeno: spo2,
          frecuencia_cardiaca: fc,
        }
        
        const peso = getNumericOrNull(formData.peso, parseFloat)
        const talla = getNumericOrNull(formData.talla, parseFloat)
        
        if (peso !== null) payloadSignos.peso_kg = peso
        if (talla !== null) payloadSignos.talla_cm = talla
        
        await clinicoAPI.registrarSignos(nuevoId, payloadSignos)
      }

      marcarPasoCompletado(3)
      setCurrentStep(4)
    } catch (error) {
      setErrorGlobal(extraerMensajeError(error))
    } finally {
      setLoading(false)
    }
  }

  const manejarPaso4 = async () => {
    if (!encuentroId) {
      setErrorGlobal('No se encontró el encuentro creado. Intenta nuevamente.')
      return
    }
    
    if (!canCloseEncounter) {
      setErrorGlobal('Motivo, Diagnóstico y Plan terapéutico son obligatorios para cerrar.')
      return
    }
    setErrorGlobal('')
    setLoading(true)
    try {
      // Guardar plan terapéutico como nota
      await clinicoAPI.crearNota(encuentroId, {
        tipo_nota: 'PLAN_TERAPEUTICO',
        nota: formData.plan_terapeutico.trim(),
      })

      // Agregar prescripción si hay
      if (formData.prescripciones.trim()) {
        try {
          await clinicoAPI.addPrescripcion(encuentroId, {
            texto: formData.prescripciones.trim(),
          })
        } catch (error) {
          console.error('Error al agregar prescripción:', error)
        }
      }

      // Cerrar encuentro
      await clinicoAPI.cerrarEncuentro(encuentroId)
      marcarPasoCompletado(4)
      navigate(`/expediente/${idPaciente}`)
    } catch (error) {
      setErrorGlobal(extraerMensajeError(error))
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
          <button onClick={() => navigate(-1)} className="mt-4 text-[#1B4F8A] underline text-sm">
            Regresar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col font-sans">

      {/* ── Header stepper ────────────────────────────────────────── */}
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
          </div>
        </div>

        <div className="flex items-center gap-1">
          {pasos.map((step, idx) => {
            const isCompleted = pasosCompletados.includes(step.id)
            const isActive    = currentStep === step.id
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center min-w-[68px]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isActive      ? 'bg-[#1B4F8A] text-white ring-4 ring-blue-100'
                    : isCompleted ? 'bg-[#2D8653] text-white'
                    : 'bg-[#DAD4CC] text-gray-500'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={15} /> : step.id}
                  </div>
                  <span className={`text-[9px] mt-0.5 font-medium uppercase tracking-wide ${
                    isActive ? 'text-[#1B4F8A]' : isCompleted ? 'text-[#2D8653]' : 'text-gray-400'
                  }`}>
                    {step.nombre}
                  </span>
                </div>
                {idx < pasos.length - 1 && (
                  <div className={`w-8 h-[2px] mb-3 flex-shrink-0 ${
                    pasosCompletados.includes(step.id) ? 'bg-[#2D8653]' : 'bg-[#DAD4CC]'
                  }`} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </header>

      {/* ── Error global ────────────────────────────────────────────── */}
      {errorGlobal && (
        <div className="mx-8 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 whitespace-pre-line">{errorGlobal}</p>
        </div>
      )}

      <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-xl border border-[#DAD4CC] shadow-sm p-8 space-y-6">

          {/* ── PASO 1 ────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <h2 className="text-[#1B4F8A] font-bold flex items-center gap-2 text-base">
                <Activity size={20} /> Subjetivo y Signos Vitales
              </h2>

              <Field label="Motivo de consulta *">
                <textarea className={textareaCls} rows={3}
                  placeholder="Describa el motivo principal de consulta..."
                  value={formData.motivo_consulta}
                  onChange={(e) => set('motivo_consulta', e.target.value)}
                  maxLength={500} />
              </Field>

              <Field label="Síntomas adicionales">
                <textarea className={textareaCls} rows={3}
                  placeholder="Síntomas, evolución, tiempo de inicio, características..."
                  value={formData.sintomas}
                  onChange={(e) => set('sintomas', e.target.value)}
                  maxLength={1000} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Peso (kg)">
                  <input type="number" className={inputCls} placeholder="70.5"
                    value={formData.peso} onChange={(e) => set('peso', e.target.value)}
                    min="0" max="300" step="0.1" />
                </Field>
                <Field label="Talla (cm)">
                  <input type="number" className={inputCls} placeholder="165"
                    value={formData.talla} onChange={(e) => set('talla', e.target.value)}
                    min="0" max="250" step="0.1" />
                </Field>
              </div>

              {formData.peso && formData.talla && Number(formData.talla) > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-sm text-blue-800">
                  <strong>IMC: </strong>
                  {(parseFloat(formData.peso) / Math.pow(parseFloat(formData.talla) / 100, 2)).toFixed(1)} kg/m²
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#5A5048] uppercase mb-2 tracking-wide">
                  Tensión arterial (mmHg)
                </label>
                <div className="flex items-center gap-3">
                  <input type="number" className={`${inputCls} text-center`} placeholder="Sistólica"
                    value={formData.tension_sistolica}
                    onChange={(e) => set('tension_sistolica', e.target.value)} />
                  <span className="text-gray-400 font-bold text-lg">/</span>
                  <input type="number" className={`${inputCls} text-center`} placeholder="Diastólica"
                    value={formData.tension_diastolica}
                    onChange={(e) => set('tension_diastolica', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="FC (lpm)">
                  <input type="number" className={inputCls} placeholder="80"
                    value={formData.fc} onChange={(e) => set('fc', e.target.value)} />
                </Field>
                <Field label="Temp (°C)">
                  <input type="number" className={inputCls} placeholder="36.5" step="0.1"
                    value={formData.temp} onChange={(e) => set('temp', e.target.value)} />
                </Field>
                <Field label="SpO2 (%)">
                  <input type="number" className={inputCls} placeholder="98" step="0.1"
                    value={formData.spo2} onChange={(e) => set('spo2', e.target.value)} />
                </Field>
              </div>

              <NavButtons
                onPrev={() => navigate(`/expediente/${idPaciente}`)}
                onNext={manejarPaso1}
                loadingNext={loading}
                labelNext="Continuar a Diagnóstico"
                disabledNext={!canGoStep2}
              />
            </div>
          )}

          {/* ── PASO 2 ────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <h2 className="text-[#1B4F8A] font-bold flex items-center gap-2 text-base">
                <Search size={20} /> Diagnóstico CIE-10
              </h2>
              <p className="text-xs text-[#5A5048] -mt-3">
                Selecciona al menos un diagnóstico para continuar.
              </p>

              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input type="text"
                  className="w-full pl-10 pr-4 py-2 border border-[#DAD4CC] rounded-lg focus:ring-2 focus:ring-[#1B4F8A] outline-none text-sm"
                  placeholder="Buscar diagnóstico (ej: E11 o Diabetes)"
                  value={cieQuery}
                  onChange={(e) => setCieQuery(e.target.value)}
                  disabled={formData.diagnosticos.length >= 5} />
                {cieLoading && (
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400">Buscando...</span>
                )}
                {cieResultados.length > 0 && (
                  <div className="absolute z-20 w-full bg-white border border-[#DAD4CC] rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto">
                    {cieResultados.map((item) => {
                      const yaSeleccionado = formData.diagnosticos.some((d) => d.id === item.id)
                      return (
                        <div key={item.id}
                          className={`p-3 flex justify-between items-center border-b last:border-0 transition-colors ${
                            yaSeleccionado ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:bg-blue-50 cursor-pointer'
                          }`}
                          onClick={() => !yaSeleccionado && agregarDiagnostico(item)}>
                          <div>
                            <span className="font-bold text-[#1B4F8A] text-sm">{item.codigo}</span>
                            <p className="text-sm text-gray-600">{item.descripcion}</p>
                          </div>
                          {yaSeleccionado
                            ? <span className="text-xs text-gray-400">Agregado</span>
                            : <span className="text-gray-400">+</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.diagnosticos.map((d, index) => (
                  <div key={d.id} className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <span className="text-xs font-black bg-[#1B4F8A] text-white px-1.5 py-0.5 rounded">
                      {d.codigo}
                    </span>
                    <span className="text-xs text-blue-900 font-medium max-w-[220px] truncate">
                      {d.descripcion}
                    </span>
                    {index === 0 && (
                      <span className="text-[10px] font-bold text-blue-600 uppercase">(Principal)</span>
                    )}
                    <button type="button" onClick={() => eliminarDiagnostico(d.id)}
                      className="text-blue-300 hover:text-red-500 transition-colors ml-1">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {formData.diagnosticos.length === 0 && (
                <p className="text-xs text-gray-400 italic">
                  Busca y agrega hasta 5 diagnósticos. El primero será el Principal.
                </p>
              )}

              <NavButtons
                onPrev={() => setCurrentStep(1)}
                onNext={manejarPaso2}
                loadingNext={false}
                labelNext="Continuar a Exploración"
                disabledNext={!canGoStep3}
              />
            </div>
          )}

          {/* ── PASO 3 ────────────────────────────────────────────── */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <h2 className="text-[#1B4F8A] font-bold flex items-center gap-2 text-base">
                <Stethoscope size={20} /> Exploración Física
              </h2>
              <p className="text-xs text-[#5A5048] -mt-3">
                Al presionar <strong>Iniciar Consulta</strong> se registrará el encuentro en el sistema.
              </p>

              <Field label="Exploración general">
                <textarea className={textareaCls} rows={2}
                  placeholder="Paciente consciente, orientado, hidratado..."
                  value={formData.exploracion_general}
                  onChange={(e) => set('exploracion_general', e.target.value)} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Cabeza y cuello">
                  <textarea className={textareaCls} rows={2}
                    value={formData.cabeza_cuello}
                    onChange={(e) => set('cabeza_cuello', e.target.value)} />
                </Field>
                <Field label="Tórax y cardiopulmonar">
                  <textarea className={textareaCls} rows={2}
                    value={formData.torax}
                    onChange={(e) => set('torax', e.target.value)} />
                </Field>
                <Field label="Abdomen">
                  <textarea className={textareaCls} rows={2}
                    value={formData.abdomen}
                    onChange={(e) => set('abdomen', e.target.value)} />
                </Field>
                <Field label="Extremidades">
                  <textarea className={textareaCls} rows={2}
                    value={formData.extremidades}
                    onChange={(e) => set('extremidades', e.target.value)} />
                </Field>
              </div>

              <NavButtons
                onPrev={() => setCurrentStep(2)}
                onNext={manejarPaso3}
                loadingNext={loading}
                labelNext="Iniciar Consulta"
                disabledNext={loading}
              />
            </div>
          )}

          {/* ── PASO 4 ────────────────────────────────────────────── */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <h2 className="text-[#1B4F8A] font-bold flex items-center gap-2 text-base">
                <FileSignature size={20} /> Plan Terapéutico y Cierre
              </h2>

              <Field label="Plan terapéutico *">
                <textarea className={textareaCls} rows={4}
                  placeholder="Tratamiento, indicaciones, seguimiento, recomendaciones..."
                  value={formData.plan_terapeutico}
                  onChange={(e) => set('plan_terapeutico', e.target.value)}
                  maxLength={2000} />
              </Field>

              <Field label="Prescripciones">
                <textarea className={textareaCls} rows={3}
                  placeholder="Ej. Paracetamol 500 mg cada 8 horas por 5 días..."
                  value={formData.prescripciones}
                  onChange={(e) => set('prescripciones', e.target.value)}
                  maxLength={1000} />
              </Field>

              <NavButtons
                onPrev={() => setCurrentStep(3)}
                onNext={manejarPaso4}
                loadingNext={loading}
                labelNext="Cerrar Encuentro"
                disabledNext={!canCloseEncounter}
              />
            </div>
          )}

        </div>
      </main>

      <footer className="p-4 text-center text-[#5A5048] text-[10px] border-t border-[#DAD4CC] bg-white">
        MedIA ECE — Cumplimiento NOM-004-SSA3-2012 | Distrito de Salud I Chiapas
      </footer>
    </div>
  )
}