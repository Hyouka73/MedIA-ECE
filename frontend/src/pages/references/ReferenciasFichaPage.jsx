import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { referenciasAPI } from '../../api/referencias';
import { pacientesAPI } from '../../api/pacientes';
import { AlertCircle, ChevronLeft, Save, Search } from 'lucide-react';

export default function ReferenciasFichaPage() {
  const { user } = useAuth();
  const { id: idReferencia } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(idReferencia);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  // Búsqueda de paciente
  const [searchPaciente, setSearchPaciente] = useState('');
  const [pacientesEncontrados, setPacientesEncontrados] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [buscando, setBuscando] = useState(false);

  // Formulario
  const [form, setForm] = useState({
    id_paciente: '',
    tipo: 'INTERCONSULTA',
    urgencia: 'NORMAL',
    especialidad_destino: '',
    establecimiento_destino: '',
    diagnostico_envio: '',
    motivo_referencia: '',
    resumen_clinico: '',
    hallazgos_relevantes: '',
    tratamiento_actual: '',
    observaciones: '',
  });

  const [errors, setErrors] = useState({});

  const rolesPermitidos = [
    "MEDICO_GENERAL", "ESPECIALISTA",
    "ADMINISTRADOR", "SUPERADMIN", "OMNIADMIN",
  ];

  const tieneAcceso = user && rolesPermitidos.includes(user.rol);

  // Función para extraer pacientes de la respuesta de la API
  const extraerPacientesDeRespuesta = (response) => {
    // DEBUG: Ver la estructura real
    console.log('Respuesta completa:', response);
    
    // Intentar diferentes estructuras comunes
    if (response?.data?.items && Array.isArray(response.data.items)) {
      return response.data.items;
    }
    
    if (response?.data?.data?.items && Array.isArray(response.data.data.items)) {
      return response.data.data.items;
    }
    
    if (response?.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    if (Array.isArray(response)) {
      return response;
    }
    
    console.warn('No se pudo extraer pacientes de la respuesta:', response);
    return [];
  };

  // Buscar paciente
  const handleSearchPaciente = async () => {
    if (!searchPaciente || searchPaciente.length < 3) {
      setError('Ingrese al menos 3 caracteres para buscar');
      return;
    }
    
    try {
      setBuscando(true);
      setError(null);
      const response = await pacientesAPI.getPacientes({ search: searchPaciente, limit: 10 });
      
      const pacientes = extraerPacientesDeRespuesta(response);
      setPacientesEncontrados(pacientes);
      
      if (pacientes.length === 0) {
        setError('No se encontraron pacientes con ese criterio de búsqueda');
      }
    } catch (err) {
      console.error('Error buscando paciente:', err);
      setError('Error al buscar pacientes. Intente nuevamente.');
      setPacientesEncontrados([]);
    } finally {
      setBuscando(false);
    }
  };

  // Seleccionar paciente
  const handleSelectPaciente = (paciente) => {
    setPacienteSeleccionado(paciente);
    setForm(prev => ({ ...prev, id_paciente: paciente.id_paciente }));
    setPacientesEncontrados([]);
    
    // Construir nombre completo según los campos disponibles
    const nombreCompleto = [
      paciente.nombre,
      paciente.primer_apellido,
      paciente.segundo_apellido
    ].filter(Boolean).join(' ');
    
    setSearchPaciente(nombreCompleto);
    
    // Limpiar error si existe
    if (errors.id_paciente) {
      setErrors(prev => ({ ...prev, id_paciente: '' }));
    }
  };

  // Limpiar búsqueda
  const handleClearSearch = () => {
    setSearchPaciente('');
    setPacientesEncontrados([]);
    setPacienteSeleccionado(null);
    setForm(prev => ({ ...prev, id_paciente: '' }));
  };

  // Cargar referencia si es edición
  useEffect(() => {
    if (!isEdit || !tieneAcceso) return;

    const loadReferencia = async () => {
      try {
        setLoading(true);
        const data = await referenciasAPI.getReferenciaById(idReferencia);
        const ref = data.data;
        
        if (ref) {
          setForm({
            id_paciente: ref.id_paciente || '',
            tipo: ref.tipo || 'INTERCONSULTA',
            urgencia: ref.urgencia || 'NORMAL',
            especialidad_destino: ref.especialidad_destino || '',
            establecimiento_destino: ref.establecimiento_destino || '',
            diagnostico_envio: ref.diagnostico_envio || '',
            motivo_referencia: ref.motivo_referencia || '',
            resumen_clinico: ref.resumen_clinico || '',
            hallazgos_relevantes: ref.hallazgos_relevantes || '',
            tratamiento_actual: ref.tratamiento_actual || '',
            observaciones: ref.observaciones || '',
          });
          
          if (ref.paciente_nombre) {
            setSearchPaciente(ref.paciente_nombre);
            setPacienteSeleccionado({ 
              id_paciente: ref.id_paciente, 
              nombre: ref.paciente_nombre,
              primer_apellido: '',
              segundo_apellido: ''
            });
          }
        }
      } catch (err) {
        console.error('Error cargando referencia:', err);
        setError('No se pudo cargar la referencia');
      } finally {
        setLoading(false);
      }
    };

    loadReferencia();
  }, [idReferencia, isEdit, tieneAcceso]);

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.id_paciente) newErrors.id_paciente = 'Debe seleccionar un paciente';
    if (!form.diagnostico_envio?.trim()) newErrors.diagnostico_envio = 'Diagnóstico de envío requerido';
    if (!form.motivo_referencia?.trim()) newErrors.motivo_referencia = 'Motivo de referencia requerido';
    if (!form.especialidad_destino) newErrors.especialidad_destino = 'Especialidad destino requerida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors([]);

    if (!validateForm()) {
      setError('Por favor, completa los campos requeridos');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        id_paciente: form.id_paciente,
        tipo: form.tipo,
        urgencia: form.urgencia,
        especialidad_destino: parseInt(form.especialidad_destino),
        establecimiento_destino: form.establecimiento_destino?.trim() || null,
        diagnostico_envio: form.diagnostico_envio.trim(),
        motivo_referencia: form.motivo_referencia.trim(),
        resumen_clinico: form.resumen_clinico?.trim() || null,
        hallazgos_relevantes: form.hallazgos_relevantes?.trim() || null,
        tratamiento_actual: form.tratamiento_actual?.trim() || null,
        observaciones: form.observaciones?.trim() || null,
      };

      if (isEdit) {
        // Aquí iría la llamada de actualización si está implementada
        await referenciasAPI.updateReferencia(idReferencia, payload);
        setSuccessMsg('Referencia actualizada exitosamente');
        setTimeout(() => navigate(`/referencias/${idReferencia}`), 1500);
      } else {
        const data = await referenciasAPI.createReferencia(payload);
        setSuccessMsg('Referencia médica creada exitosamente');
        setTimeout(() => navigate(`/referencias/${data.data.id_referencia}`), 1500);
      }
    } catch (err) {
      console.error('Error guardando referencia:', err);
      
      if (err.response?.status === 422) {
        const detail = err.response.data?.detail;
        if (Array.isArray(detail)) {
          setValidationErrors(detail);
          setError(detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join('\n'));
        } else {
          setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
        }
      } else {
        setError(err.response?.data?.detail || err.message || 'Error al guardar referencia');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (!tieneAcceso) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px" }}>
        <AlertCircle size={48} style={{ color: "#BA2E45", marginBottom: "16px" }} />
        <h2 style={{ color: "#1A1510", fontSize: 18, fontWeight: 600, marginBottom: "8px" }}>Acceso Denegado</h2>
        <p style={{ color: "#5A5048", fontSize: 14 }}>No tienes permisos para crear referencias médicas.</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: "24px", padding: "10px 20px", background: "#2459A8", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
          ← Volver
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontSize: 14, color: "#5A5048" }}>⏳ Cargando referencia...</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#EDEBE6" }}>
      {/* TopBar */}
      <div style={{ padding: "16px 28px", background: "#FDFAF5", borderBottom: "1px solid #DAD4CC", backdropFilter: "blur(12px)", zIndex: 10, boxShadow: "0 1px 3px rgba(26,21,16,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#2C2620", padding: "4px 8px" }}>
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 style={{ color: "#1A1510", fontSize: 18, fontWeight: 700, margin: 0 }}>
                {isEdit ? 'Editar' : 'Nueva'} Referencia Médica
              </h1>
              <p style={{ color: "#5A5048", fontSize: 12, margin: "4px 0 0 0" }}>
                Interconsulta, derivación o contra-referencia
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
        {/* Mensajes */}
        {successMsg && (
          <div style={{ padding: "12px 16px", background: "#E8F5E9", border: "1.5px solid #237A4B", borderRadius: 8, marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 18 }}>✓</span>
            <span style={{ color: "#237A4B", fontSize: 13, fontWeight: 500 }}>{successMsg}</span>
          </div>
        )}

        {error && (
          <div style={{ padding: "12px 16px", background: "#FFEBEE", border: "1.5px solid #BA2E45", borderRadius: 8, marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AlertCircle size={18} style={{ color: "#BA2E45", flexShrink: 0, marginTop: 2 }} />
            <span style={{ color: "#BA2E45", fontSize: 13, fontWeight: 500, whiteSpace: "pre-line" }}>
              {typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
            </span>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div style={{ padding: "12px 16px", background: "#FFF3E0", border: "1.5px solid #E8921F", borderRadius: 8, marginBottom: 20 }}>
            <p style={{ margin: "0 0 8px 0", color: "#B86E12", fontSize: 12, fontWeight: 600 }}>Errores de validación:</p>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#B86E12", fontSize: 12 }}>
              {validationErrors.map((err, i) => <li key={i}>{err.loc?.join('.')}: {err.msg}</li>)}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Sección: Búsqueda de Paciente */}
          <div style={{ background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#1A1510", textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.4px" }}>Paciente</h2>
            
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={searchPaciente}
                  onChange={(e) => setSearchPaciente(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchPaciente())}
                  placeholder="Buscar paciente por nombre, apellido, CURP o expediente..."
                  style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${errors.id_paciente ? "#BA2E45" : "#DAD4CC"}`, borderRadius: 6, fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <button 
                type="button" 
                onClick={handleSearchPaciente} 
                disabled={buscando}
                style={{ 
                  padding: "10px 20px", 
                  background: "#2459A8", 
                  color: "#fff", 
                  border: "none", 
                  borderRadius: 6, 
                  cursor: buscando ? "not-allowed" : "pointer", 
                  fontSize: 13, 
                  fontWeight: 500, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 6,
                  opacity: buscando ? 0.6 : 1
                }}>
                <Search size={16} /> {buscando ? 'Buscando...' : 'Buscar'}
              </button>
              {pacienteSeleccionado && (
                <button 
                  type="button" 
                  onClick={handleClearSearch}
                  style={{ 
                    padding: "10px 20px", 
                    background: "#6c757d", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: 6, 
                    cursor: "pointer", 
                    fontSize: 13, 
                    fontWeight: 500 
                  }}>
                  Limpiar
                </button>
              )}
            </div>
            
            {errors.id_paciente && (
              <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>
                ⚠ {errors.id_paciente}
              </span>
            )}

            {/* Resultados de búsqueda */}
            {pacientesEncontrados.length > 0 && !pacienteSeleccionado && (
              <div style={{ marginTop: 12, border: "1px solid #DAD4CC", borderRadius: 8, overflow: "hidden", maxHeight: "300px", overflowY: "auto" }}>
                {pacientesEncontrados.map(p => (
                  <div 
                    key={p.id_paciente}
                    onClick={() => handleSelectPaciente(p)}
                    style={{ 
                      padding: "12px 14px", 
                      cursor: "pointer", 
                      borderBottom: "1px solid #DAD4CC", 
                      transition: "background 0.2s", 
                      background: "#fff",
                      hover: { background: "#F5F3F0" }
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#F5F3F0"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1510" }}>
                      {p.nombre} {p.primer_apellido} {p.segundo_apellido || ''}
                    </div>
                    <div style={{ fontSize: 12, color: "#5A5048", marginTop: 4, display: "flex", gap: 16 }}>
                      <span>🆔 Exp: {p.numero_expediente || 'N/A'}</span>
                      <span>🎂 Edad: {p.edad || 'N/A'} años</span>
                      <span>⚥ Sexo: {p.sexo || p.persona?.sexo || 'N/A'}</span>
                    </div>
                    {p.curp && (
                      <div style={{ fontSize: 11, color: "#8A7F75", marginTop: 2 }}>
                        CURP: {p.curp}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Paciente seleccionado */}
            {pacienteSeleccionado && (
              <div style={{ 
                marginTop: 12, 
                padding: "12px 16px", 
                background: "#E3F2FD", 
                border: "1.5px solid #2459A8", 
                borderRadius: 8, 
                display: "flex", 
                alignItems: "center", 
                gap: 12,
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>👤</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1510" }}>
                      {pacienteSeleccionado.nombre} {pacienteSeleccionado.primer_apellido} {pacienteSeleccionado.segundo_apellido || ''}
                    </div>
                    <div style={{ fontSize: 12, color: "#5A5048", marginTop: 2 }}>
                      Exp: {pacienteSeleccionado.numero_expediente || 'N/A'} · Edad: {pacienteSeleccionado.edad || 'N/A'} años
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    padding: "4px 12px",
                    background: "transparent",
                    border: "1px solid #2459A8",
                    color: "#2459A8",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 500
                  }}>
                  Cambiar
                </button>
              </div>
            )}
          </div>

          {/* Sección: Datos de la Referencia */}
          <div style={{ background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#1A1510", textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.4px" }}>Datos de la Referencia</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginBottom: 16 }}>
              {/* Tipo */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Tipo *</label>
                <select 
                  value={form.tipo} 
                  onChange={(e) => updateField('tipo', e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, backgroundColor: "#fff" }}>
                  <option value="INTERCONSULTA">🔬 Interconsulta</option>
                  <option value="DERIVACION">🏥 Derivación</option>
                  <option value="CONTRARREFERENCIA">↩️ Contra-referencia</option>
                </select>
              </div>

              {/* Urgencia */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Urgencia *</label>
                <select 
                  value={form.urgencia} 
                  onChange={(e) => updateField('urgencia', e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, backgroundColor: "#fff" }}>
                  <option value="NORMAL">🟢 Normal</option>
                  <option value="URGENTE">🟡 Urgente</option>
                  <option value="EMERGENCIA">🔴 Emergencia</option>
                </select>
              </div>

              {/* Especialidad */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Especialidad Destino *</label>
                <select 
                  value={form.especialidad_destino} 
                  onChange={(e) => updateField('especialidad_destino', e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${errors.especialidad_destino ? "#BA2E45" : "#DAD4CC"}`, borderRadius: 6, fontSize: 13, backgroundColor: "#fff" }}>
                  <option value="">Seleccionar...</option>
                  <option value="1">Medicina General</option>
                  <option value="2">Pediatría</option>
                  <option value="3">Ginecología</option>
                  <option value="4">Cardiología</option>
                  <option value="5">Neurología</option>
                  <option value="6">Traumatología</option>
                  <option value="7">Dermatología</option>
                  <option value="8">Psiquiatría</option>
                  <option value="9">Oftalmología</option>
                  <option value="10">Otorrinolaringología</option>
                </select>
                {errors.especialidad_destino && (
                  <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>
                    ⚠ {errors.especialidad_destino}
                  </span>
                )}
              </div>
            </div>

            {/* Establecimiento destino */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Establecimiento Destino</label>
              <input 
                type="text" 
                value={form.establecimiento_destino} 
                onChange={(e) => updateField('establecimiento_destino', e.target.value)}
                placeholder="Ej: Hospital General de Zona No. 1"
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }} />
            </div>
          </div>

          {/* Sección: Información Clínica */}
          <div style={{ background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#1A1510", textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.4px" }}>Información Clínica</h2>

            {/* Diagnóstico de envío */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Diagnóstico de Envío *</label>
              <textarea 
                value={form.diagnostico_envio} 
                onChange={(e) => updateField('diagnostico_envio', e.target.value)}
                placeholder="Describa el diagnóstico principal..."
                rows={3}
                style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${errors.diagnostico_envio ? "#BA2E45" : "#DAD4CC"}`, borderRadius: 6, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
              {errors.diagnostico_envio && (
                <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>
                  ⚠ {errors.diagnostico_envio}
                </span>
              )}
            </div>

            {/* Motivo de referencia */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Motivo de Referencia *</label>
              <textarea 
                value={form.motivo_referencia} 
                onChange={(e) => updateField('motivo_referencia', e.target.value)}
                placeholder="Explique el motivo de la referencia..."
                rows={3}
                style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${errors.motivo_referencia ? "#BA2E45" : "#DAD4CC"}`, borderRadius: 6, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
              {errors.motivo_referencia && (
                <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>
                  ⚠ {errors.motivo_referencia}
                </span>
              )}
            </div>

            {/* Resumen clínico */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Resumen Clínico</label>
              <textarea 
                value={form.resumen_clinico} 
                onChange={(e) => updateField('resumen_clinico', e.target.value)}
                placeholder="Resumen del cuadro clínico del paciente..."
                rows={4}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
              <span style={{ fontSize: 10, color: "#8A7F75", marginTop: 4, display: "block" }}>
                Incluya antecedentes, evolución y estado actual del paciente
              </span>
            </div>

            {/* Hallazgos relevantes */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Hallazgos Relevantes</label>
              <textarea 
                value={form.hallazgos_relevantes} 
                onChange={(e) => updateField('hallazgos_relevantes', e.target.value)}
                placeholder="Hallazgos de laboratorio, gabinete o exploración física..."
                rows={3}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
            </div>

            {/* Tratamiento actual */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Tratamiento Actual</label>
              <textarea 
                value={form.tratamiento_actual} 
                onChange={(e) => updateField('tratamiento_actual', e.target.value)}
                placeholder="Medicamentos, dosis y frecuencia..."
                rows={3}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
            </div>

            {/* Observaciones */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Observaciones</label>
              <textarea 
                value={form.observaciones} 
                onChange={(e) => updateField('observaciones', e.target.value)}
                placeholder="Notas adicionales, recomendaciones, etc..."
                rows={2}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              style={{ 
                padding: "10px 24px", 
                background: "transparent", 
                border: "1.5px solid #2459A8", 
                color: "#2459A8", 
                borderRadius: 6, 
                cursor: "pointer", 
                fontSize: 13, 
                fontWeight: 500,
                transition: "all 0.2s"
              }}>
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={saving}
              style={{ 
                padding: "10px 28px", 
                background: "#2459A8", 
                color: "#fff", 
                border: "none", 
                borderRadius: 6, 
                cursor: saving ? "not-allowed" : "pointer", 
                fontSize: 13, 
                fontWeight: 500, 
                opacity: saving ? 0.6 : 1, 
                display: "flex", 
                alignItems: "center", 
                gap: 8,
                transition: "all 0.2s"
              }}>
              <Save size={16} />
              {saving ? "Guardando..." : isEdit ? "Actualizar Referencia" : "Crear Referencia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}