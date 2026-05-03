import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { pacientesAPI } from '../../api/pacientes';
import { AlertCircle, ChevronLeft, Save, Heart, Stethoscope, Cigarette, Baby } from 'lucide-react';


/**
 * PacienteAntecedentesPage — Segunda página del registro de pacientes
 * Permite agregar antecedentes heredofamiliares, patológicos, no patológicos y ginecoobstétricos
 * Compatible con NOM-024-SSA3-2012 y diseño MedSys
 */


export default function PacienteAntecedentesPage() {
  const { user } = useAuth();
  const { id } = useParams(); // ID del paciente
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [paciente, setPaciente] = useState(null);
  const [antecedentesExistentes, setAntecedentesExistentes] = useState(null);

  // Estados para cada tipo de antecedente
  const [heredofamiliares, setHeredofamiliares] = useState({
    diabetes: false,
    hipertension: false,
    cardiopatia: false,
    neoplasia: false,
    detalles: ""
  });

  const [patologicos, setPatologicos] = useState([]);

  const [noPatologicos, setNoPatologicos] = useState({
    tabaquismo: false,
    alcoholismo: false,
    drogas: false,
    detalles: ""
  });

  const [alergias, setAlergias] = useState([]);
  const [ginecoobstetricos, setGinecoobstetricos] = useState({
    menarca: "",
    ritmo_menstrual: "",
    gestas: 0,
    partos: 0,
    abortos: 0,
    cesareas: 0,
    ultimo_papanicolaou: "",
    ultimo_mamograma: "",
    anticonceptivos: "",
    detalles: ""
  });

  const rolesPermitidos = [
    "MEDICO_GENERAL", "ESPECIALISTA", "RECEPCIONISTA",
    "ADMINISTRADOR", "SUPERADMIN", "OMNIADMIN",
  ];

  const tieneAcceso = user && rolesPermitidos.includes(user.rol);

  const normalizarTexto = (value = "") =>
    String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const extractPaciente = (response) =>
    response?.data?.data || response?.data || null;

  const extractAntecedentes = (response) =>
    response?.data?.data?.antecedentes ||
    response?.data?.antecedentes ||
    response?.data?.data ||
    response?.data ||
    null;

  // Cargar datos del paciente y antecedentes existentes
  useEffect(() => {
    if (!tieneAcceso || !id) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar datos básicos del paciente
        const pacienteRes = await pacientesAPI.getPaciente(id);
        const pacienteData = extractPaciente(pacienteRes);
        setPaciente(pacienteData);

        // Cargar antecedentes existentes
        try {
          const expedienteRes = await pacientesAPI.getExpediente(id);
          const exp = expedienteRes?.data?.data || expedienteRes?.data || {};
          
          if (exp.alergias) {
            setAlergias(exp.alergias.map(a => ({
              alergia: a.alergia || a.sustancia || "",
              severidad: a.severidad || "LEVE"
            })));
          }

          const antecedentesRes = await pacientesAPI.getExpedienteCompleto(id);
          const ant = extractAntecedentes(antecedentesRes);
// ... existing loading logic ...

          console.log('📦 Antecedentes crudos:', ant);

          setAntecedentesExistentes(ant);

          if (ant) {
            // HEREDOFAMILIARES
            // Esperado por BD: lista de registros
            const heredos = Array.isArray(ant.heredofamiliares)
              ? ant.heredofamiliares
              : ant.heredofamiliares
                ? [ant.heredofamiliares]
                : [];

            if (heredos.length > 0) {
              const detallesHeredo = [];
              let diabetes = false;
              let hipertension = false;
              let cardiopatia = false;
              let neoplasia = false;

              heredos.forEach((item) => {
                const familiar = normalizarTexto(item.familiar);
                const descripcion = normalizarTexto(
                  item.descripcion_patologia || item.descripcion || item.detalles || ""
                );
                const combinado = `${familiar} ${descripcion}`;

                if (combinado.includes('diabetes')) diabetes = true;
                if (combinado.includes('hipertension')) hipertension = true;
                if (combinado.includes('cardiopatia') || combinado.includes('cardiopatia') || combinado.includes('cardiaca')) cardiopatia = true;
                if (combinado.includes('neoplasia') || combinado.includes('cancer') || combinado.includes('tumor')) neoplasia = true;

                if (item.descripcion_patologia || item.descripcion || item.detalles) {
                  detallesHeredo.push(
                    [item.familiar, item.descripcion_patologia || item.descripcion || item.detalles]
                      .filter(Boolean)
                      .join(': ')
                  );
                }
              });

              setHeredofamiliares({
                diabetes,
                hipertension,
                cardiopatia,
                neoplasia,
                detalles: detallesHeredo.join('\n')
              });
            }

            // PATOLÓGICOS
            const pats = Array.isArray(ant.patologicos)
              ? ant.patologicos
              : Array.isArray(ant.antecedentes_patologicos)
                ? ant.antecedentes_patologicos
                : ant.patologicos
                  ? [ant.patologicos]
                  : [];

            if (pats.length > 0) {
              setPatologicos(
                pats.map((item) => ({
                  enfermedad:
                    item.enfermedad ||
                    item.descripcion ||
                    item.tipo_patologia ||
                    "",
                  fecha_diagnostico:
                    item.fecha_diagnostico ||
                    item.fecha_aproximada ||
                    "",
                  tratamiento_actual:
                    item.tratamiento_actual ||
                    item.tratamiento ||
                    ""
                }))
              );
            }

            // NO PATOLÓGICOS
            const noPats = Array.isArray(ant.no_patologicos)
              ? ant.no_patologicos
              : Array.isArray(ant.antecedentes_no_patologicos)
                ? ant.antecedentes_no_patologicos
                : ant.no_patologicos
                  ? [ant.no_patologicos]
                  : [];

            if (noPats.length > 0) {
              let tabaquismo = false;
              let alcoholismo = false;
              let drogas = false;
              const detallesNoPats = [];

              noPats.forEach((item) => {
                const categoria = normalizarTexto(item.categoria);
                const descripcion = normalizarTexto(item.descripcion || item.detalles || "");
                const combinado = `${categoria} ${descripcion}`;

                if (combinado.includes('tabaco') || combinado.includes('tabaquismo') || combinado.includes('fuma')) {
                  tabaquismo = true;
                }
                if (combinado.includes('alcohol') || combinado.includes('alcoholismo') || combinado.includes('bebe')) {
                  alcoholismo = true;
                }
                if (combinado.includes('droga') || combinado.includes('drogas') || combinado.includes('sustancia') || combinado.includes('toxicomania')) {
                  drogas = true;
                }

                if (item.descripcion || item.detalles) {
                  detallesNoPats.push(
                    [item.categoria, item.descripcion || item.detalles]
                      .filter(Boolean)
                      .join(': ')
                  );
                }
              });

              setNoPatologicos({
                tabaquismo,
                alcoholismo,
                drogas,
                detalles: detallesNoPats.join('\n')
              });
            }

            // GINECOOBSTÉTRICOS
            const gine = Array.isArray(ant.ginecoobstetricos)
              ? ant.ginecoobstetricos[0]
              : ant.ginecoobstetricos || null;

            if (gine) {
              setGinecoobstetricos({
                menarca: gine.menarca || "",
                ritmo_menstrual: gine.ritmo_menstrual || "",
                gestas: gine.gestas || 0,
                partos: gine.partos || 0,
                abortos: gine.abortos || 0,
                cesareas: gine.cesareas || 0,
                ultimo_papanicolaou: gine.ultimo_papanicolaou || "",
                ultimo_mamograma: gine.ultimo_mamograma || "",
                anticonceptivos: gine.anticonceptivos || gine.metodo_anticonceptivo || "",
                detalles: gine.detalles || ""
              });
            }
          }
        } catch (antError) {
          console.log("No hay antecedentes existentes o no se pudieron parsear:", antError);
        }

      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error al cargar los datos del paciente');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, tieneAcceso]);

  // Agregar antecedente patológico
  const addAntecedentePatologico = () => {
    setPatologicos([...patologicos, {
      enfermedad: "",
      fecha_diagnostico: "",
      tratamiento_actual: ""
    }]);
  };

  // Remover antecedente patológico
  const removeAntecedentePatologico = (index) => {
    setPatologicos(patologicos.filter((_, i) => i !== index));
  };

  // Actualizar antecedente patológico
  const updateAntecedentePatologico = (index, field, value) => {
    const updated = [...patologicos];
    updated[index][field] = value;
    setPatologicos(updated);
  };

  // Funciones para Alergias
  const addAlergia = () => {
    setAlergias([...alergias, { alergia: "", severidad: "LEVE" }]);
  };

  const removeAlergia = (index) => {
    setAlergias(alergias.filter((_, i) => i !== index));
  };

  const updateAlergia = (index, field, value) => {
    const updated = [...alergias];
    updated[index][field] = value;
    setAlergias(updated);
  };

  // Guardar todos los antecedentes
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg("");

      // 1. Guardar Alergias (Persona 5 Security)
      for (const item of alergias) {
        if (item.alergia.trim()) {
          await pacientesAPI.addAlergia(id, {
            alergia: item.alergia,
            severidad: item.severidad
          });
        }
      }

      // 2. Guardar antecedentes heredofamiliares
      await pacientesAPI.addAntecedenteHeredofamiliar(id, heredofamiliares);

      // Guardar antecedentes patológicos
      for (const patologico of patologicos) {
        if (patologico.enfermedad.trim()) {
          await pacientesAPI.addAntecedentePatologico(id, patologico);
        }
      }

      // Guardar antecedentes no patológicos
      await pacientesAPI.addAntecedenteNoPatologico(id, noPatologicos);

      // Guardar antecedentes ginecoobstétricos (solo si es mujer)
      const sexoPaciente = paciente?.persona?.sexo || paciente?.sexo;
      if (sexoPaciente === 'F') {
        await pacientesAPI.addAntecedenteGinecoobstetrico(id, ginecoobstetricos);
      }

      setSuccessMsg("Antecedentes guardados exitosamente");

      // Redirigir a la lista de pacientes después de 2 segundos
      setTimeout(() => {
        navigate('/pacientes');
      }, 2000);

    } catch (err) {
      console.error('Error guardando antecedentes:', err);
      setError(err.response?.data?.detail || 'Error al guardar los antecedentes');
    } finally {
      setSaving(false);
    }
  };

  if (!tieneAcceso) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-semantic-error" />
          <h3 className="mt-2 text-sm font-medium text-text-primary">Acceso denegado</h3>
          <p className="mt-1 text-sm text-text-secondary">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/pacientes')}
                className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface/50 rounded-lg transition-colors"
              >
                <ChevronLeft size={16} />
                Volver
              </button>
              <div>
                <h1 className="text-xl font-semibold text-text-primary">
                  Antecedentes Clínicos
                </h1>
                {paciente && (
                  <p className="text-sm text-text-secondary">
                    {paciente?.persona?.nombre || paciente?.nombre || ''} {paciente?.persona?.primer_apellido || paciente?.primer_apellido || ''} {paciente?.persona?.segundo_apellido || paciente?.segundo_apellido || ''}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={16} />
              {saving ? 'Guardando...' : 'Guardar Antecedentes'}
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-semantic-error/10 border border-semantic-error/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-semantic-error" />
              <span className="text-sm text-semantic-error">{typeof error === 'string' ? error : JSON.stringify(error)}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-semantic-success/10 border border-semantic-success/20 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-semantic-success">{successMsg}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Antecedentes Heredofamiliares */}
          <div className="bg-surface rounded-lg border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-text-primary">Heredofamiliares</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={heredofamiliares.diabetes}
                    onChange={(e) => setHeredofamiliares({ ...heredofamiliares, diabetes: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-primary">Diabetes</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={heredofamiliares.hipertension}
                    onChange={(e) => setHeredofamiliares({ ...heredofamiliares, hipertension: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-primary">Hipertensión</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={heredofamiliares.cardiopatia}
                    onChange={(e) => setHeredofamiliares({ ...heredofamiliares, cardiopatia: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-primary">Cardiopatía</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={heredofamiliares.neoplasia}
                    onChange={(e) => setHeredofamiliares({ ...heredofamiliares, neoplasia: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-primary">Neoplasia</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Detalles adicionales
                </label>
                <textarea
                  value={heredofamiliares.detalles}
                  onChange={(e) => setHeredofamiliares({ ...heredofamiliares, detalles: e.target.value })}
                  placeholder="Otros antecedentes familiares..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Antecedentes Patológicos */}
          <div className="bg-surface rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Patológicos</h2>
              </div>
              <button
                onClick={addAntecedentePatologico}
                className="px-3 py-1 text-xs bg-secondary text-text-primary rounded hover:bg-secondary/80 transition-colors"
              >
                + Agregar
              </button>
            </div>

            <div className="space-y-4">
              {patologicos.map((patologico, index) => (
                <div key={index} className="border border-border rounded-lg p-4 bg-background/50">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-sm font-medium text-text-primary">Enfermedad {index + 1}</h3>
                    <button
                      onClick={() => removeAntecedentePatologico(index)}
                      className="text-semantic-error hover:text-semantic-error-dark text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Enfermedad
                      </label>
                      <input
                        type="text"
                        value={patologico.enfermedad}
                        onChange={(e) => updateAntecedentePatologico(index, 'enfermedad', e.target.value)}
                        placeholder="Nombre de la enfermedad"
                        className="w-full px-3 py-2 text-sm border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                          Fecha diagnóstico
                        </label>
                        <input
                          type="date"
                          value={patologico.fecha_diagnostico}
                          onChange={(e) => updateAntecedentePatologico(index, 'fecha_diagnostico', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                          Tratamiento actual
                        </label>
                        <input
                          type="text"
                          value={patologico.tratamiento_actual}
                          onChange={(e) => updateAntecedentePatologico(index, 'tratamiento_actual', e.target.value)}
                          placeholder="Tratamiento actual"
                          className="w-full px-3 py-2 text-sm border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {patologicos.length === 0 && (
                <p className="text-sm text-text-secondary text-center py-4">
                  No hay antecedentes patológicos registrados
                </p>
              )}
            </div>
          </div>

          {/* Antecedentes de Alergias (Persona 5) */}
          <div className="bg-surface rounded-lg border-2 border-semantic-error/30 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-semantic-error" />
                <h2 className="text-lg font-bold text-text-primary">Alergias y Reacciones</h2>
              </div>
              <button
                onClick={addAlergia}
                className="px-3 py-1 text-xs bg-semantic-error/10 text-semantic-error font-bold rounded-lg hover:bg-semantic-error/20 transition-colors border border-semantic-error/20"
              >
                + Registrar Alergia
              </button>
            </div>

            <div className="space-y-4">
              {alergias.map((item, index) => (
                <div key={index} className="border border-border rounded-xl p-4 bg-background/30 backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-text-secondary">ALERGIA #{index + 1}</span>
                    <button
                      onClick={() => removeAlergia(index)}
                      className="text-semantic-error/60 hover:text-semantic-error transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">Sustancia / Alérgeno</label>
                      <input
                        type="text"
                        value={item.alergia}
                        onChange={(e) => updateAlergia(index, 'alergia', e.target.value)}
                        placeholder="Ej: Penicilina, Nueces..."
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-semantic-error/20 focus:border-semantic-error transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">Severidad</label>
                      <select
                        value={item.severidad}
                        onChange={(e) => updateAlergia(index, 'severidad', e.target.value)}
                        className={`w-full px-3 py-2 text-sm border-2 rounded-lg font-bold transition-all ${
                          item.severidad === 'CRITICA' ? 'border-semantic-error text-semantic-error bg-semantic-error/5' :
                          item.severidad === 'MODERADA' ? 'border-amber-500 text-amber-600 bg-amber-50' :
                          'border-emerald-500 text-emerald-600 bg-emerald-50'
                        }`}
                      >
                        <option value="LEVE">🟢 LEVE</option>
                        <option value="MODERADA">🟡 MODERADA</option>
                        <option value="CRITICA">🔴 CRÍTICA</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {alergias.length === 0 && (
                <div className="text-center py-8 bg-background/20 rounded-xl border-2 border-dashed border-border/50">
                  <p className="text-sm text-text-secondary italic">No se han registrado alergias para este paciente</p>
                  <p className="text-[10px] text-text-secondary/60 mt-1 uppercase tracking-widest font-bold">Información Crítica para Persona 5</p>
                </div>
              )}
            </div>
          </div>

          {/* Antecedentes No Patológicos */}
          <div className="bg-surface rounded-lg border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Cigarette className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-text-primary">No Patológicos</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={noPatologicos.tabaquismo}
                    onChange={(e) => setNoPatologicos({ ...noPatologicos, tabaquismo: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-primary">Tabaquismo</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={noPatologicos.alcoholismo}
                    onChange={(e) => setNoPatologicos({ ...noPatologicos, alcoholismo: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-primary">Alcoholismo</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={noPatologicos.drogas}
                    onChange={(e) => setNoPatologicos({ ...noPatologicos, drogas: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-primary">Uso de drogas</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Detalles adicionales
                </label>
                <textarea
                  value={noPatologicos.detalles}
                  onChange={(e) => setNoPatologicos({ ...noPatologicos, detalles: e.target.value })}
                  placeholder="Otros determinantes sociales de la salud..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Antecedentes Ginecoobstétricos */}
          {(paciente?.persona?.sexo === 'F' || paciente?.sexo === 'F') && (
            <div className="bg-surface rounded-lg border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Baby className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Ginecoobstétricos</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Menarca (edad)
                    </label>
                    <input
                      type="number"
                      min="8"
                      max="18"
                      value={ginecoobstetricos.menarca}
                      onChange={(e) => setGinecoobstetricos({ ...ginecoobstetricos, menarca: e.target.value })}
                      placeholder="12"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Ritmo menstrual
                    </label>
                    <input
                      type="text"
                      value={ginecoobstetricos.ritmo_menstrual}
                      onChange={(e) => setGinecoobstetricos({ ...ginecoobstetricos, ritmo_menstrual: e.target.value })}
                      placeholder="Regular 28 días"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Gestas
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={ginecoobstetricos.gestas}
                      onChange={(e) => setGinecoobstetricos({ ...ginecoobstetricos, gestas: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Partos
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={ginecoobstetricos.partos}
                      onChange={(e) => setGinecoobstetricos({ ...ginecoobstetricos, partos: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Abortos
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={ginecoobstetricos.abortos}
                      onChange={(e) => setGinecoobstetricos({ ...ginecoobstetricos, abortos: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Cesáreas
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={ginecoobstetricos.cesareas}
                      onChange={(e) => setGinecoobstetricos({ ...ginecoobstetricos, cesareas: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Último Papanicolaou
                    </label>
                    <input
                      type="date"
                      value={ginecoobstetricos.ultimo_papanicolaou}
                      onChange={(e) => setGinecoobstetricos({ ...ginecoobstetricos, ultimo_papanicolaou: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Último Mamograma
                    </label>
                    <input
                      type="date"
                      value={ginecoobstetricos.ultimo_mamograma}
                      onChange={(e) => setGinecoobstetricos({ ...ginecoobstetricos, ultimo_mamograma: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Anticonceptivos
                  </label>
                  <input
                    type="text"
                    value={ginecoobstetricos.anticonceptivos}
                    onChange={(e) => setGinecoobstetricos({ ...ginecoobstetricos, anticonceptivos: e.target.value })}
                    placeholder="Tipo de anticonceptivo"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Detalles adicionales
                  </label>
                  <textarea
                    value={ginecoobstetricos.detalles}
                    onChange={(e) => setGinecoobstetricos({ ...ginecoobstetricos, detalles: e.target.value })}
                    placeholder="Otros detalles ginecoobstétricos..."
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}