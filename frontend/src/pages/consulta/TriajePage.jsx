import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { clinicoAPI } from '../../api/clinico'
import { ChevronLeft, Activity, AlertTriangle, Save } from 'lucide-react'

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

export default function TriajePage() {
  const [searchParams] = useSearchParams()
  const idEncuentro = searchParams.get('id_encuentro')
  const idPaciente = searchParams.get('id_paciente')
  const motivoConsulta = searchParams.get('motivo')
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState('')

  const [formData, setFormData] = useState({
    peso: '',
    talla: '',
    tension_sistolica: '',
    tension_diastolica: '',
    fc: '',
    temp: '',
    spo2: '',
  })

  const set = (key, value) => {
    setErrorGlobal('')
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const getNumericOrNull = (value, parser = parseFloat) => {
    if (value === '' || value === null || value === undefined) return null
    const parsed = parser(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  const guardarSignos = async () => {
    setErrorGlobal('')

    const sistolica = getNumericOrNull(formData.tension_sistolica, parseInt)
    const diastolica = getNumericOrNull(formData.tension_diastolica, parseInt)
    const temp = getNumericOrNull(formData.temp, parseFloat)
    const spo2Raw = getNumericOrNull(formData.spo2, parseFloat)
    const spo2 = spo2Raw !== null ? Math.round(spo2Raw) : null
    const fc = getNumericOrNull(formData.fc, parseInt)
    const peso = getNumericOrNull(formData.peso, parseFloat)
    const talla = getNumericOrNull(formData.talla, parseFloat)

    const todosRequeridos = sistolica !== null && diastolica !== null &&
                            temp !== null && spo2 !== null && fc !== null &&
                            peso !== null && talla !== null

    if (!todosRequeridos) {
      setErrorGlobal('Todos los campos de signos vitales son obligatorios en triaje.')
      return
    }

    const enRango = 
      sistolica >= 60 && sistolica <= 250 &&
      diastolica >= 40 && diastolica <= 150 &&
      temp >= 34.0 && temp <= 42.0 &&
      spo2 >= 70 && spo2 <= 100 &&
      fc >= 30 && fc <= 220 &&
      peso > 0 && talla > 0

    if (!enRango) {
      setErrorGlobal('Algunos valores están fuera de los rangos fisiológicos permitidos. Verifique la información.')
      return
    }

    setLoading(true)
    try {
      const payloadSignos = {
        presion_sistolica: sistolica,
        presion_diastolica: diastolica,
        temperatura_c: temp,
        saturacion_oxigeno: spo2,
        frecuencia_cardiaca: fc,
        peso_kg: peso,
        talla_cm: talla,
      }

      await clinicoAPI.registrarSignos(idEncuentro, payloadSignos)
      navigate('/dashboard')
    } catch (error) {
      const msg = error.response?.data?.detail || error.message || 'Error al guardar los signos vitales'
      setErrorGlobal(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  if (!idEncuentro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
        <div className="text-center p-10">
          <AlertTriangle size={40} className="text-amber-500 mx-auto mb-4" />
          <p className="text-[#1A1510] font-bold">No se especificó un encuentro.</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-[#1B4F8A] underline text-sm">
            Regresar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col font-sans">
      <header className="bg-white border-b border-[#DAD4CC] px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-[#5A5048] hover:text-[#1A1510] transition-colors">
            <ChevronLeft size={18} /> Volver
          </button>
          <div className="h-8 w-px bg-[#DAD4CC]" />
          <div>
            <h1 className="text-lg font-bold text-[#1A1510]">Triaje de Enfermería</h1>
            <p className="text-xs text-[#5A5048]">Paciente ID: {idPaciente || 'No especificado'}</p>
            {motivoConsulta && (
              <p className="text-xs text-[#2D8653] font-semibold mt-0.5">
                Motivo: {motivoConsulta}
              </p>
            )}
          </div>
        </div>
      </header>

      {errorGlobal && (
        <div className="mx-8 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 whitespace-pre-line">{errorGlobal}</p>
        </div>
      )}

      <main className="flex-1 p-8 max-w-3xl mx-auto w-full">
        <div className="bg-white rounded-xl border border-[#DAD4CC] shadow-sm p-8 space-y-6">
          <div className="space-y-5">
            <h2 className="text-[#2D8653] font-bold flex items-center gap-2 text-base">
              <Activity size={20} /> Signos Vitales
            </h2>

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

            <div className="flex justify-end pt-6 border-t border-[#DAD4CC]">
              <button type="button" onClick={guardarSignos} disabled={loading}
                className="bg-[#2D8653] text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#236b41] disabled:opacity-50 transition-colors">
                {loading ? 'Guardando...' : 'Registrar Signos y Finalizar'}
                {!loading && <Save size={16} />}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
