import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { pacientesAPI } from '../../api/pacientes';
import { catalogosAPI } from '../../api/catalogos';
import { AlertCircle, ChevronLeft, Save, Languages } from 'lucide-react';

/**
 * PacienteFichaPage — Formulario de Registro/Edición de Paciente
 * Permite crear un nuevo paciente o editar datos existentes.
 * Compatible con NOM-024-SSA3-2012 y diseño MedIA
 */

export default function PacienteFichaPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [isEdit] = useState(Boolean(id));
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  // Catálogos en cascada
  const [estados, setEstados] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [lenguas, setLenguas] = useState([]);
  
  const [selectedEstado, setSelectedEstado] = useState("07"); // Chiapas por defecto
  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  
  const [loadingEstados, setLoadingEstados] = useState(true);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);
  const [loadingLenguas, setLoadingLenguas] = useState(true);

  // ✅ Estado para preview de barrera lingüística
  const [showBarreraPreview, setShowBarreraPreview] = useState(false);

  // Formulario
  const [form, setForm] = useState({
    nombre: "",
    primer_apellido: "",
    segundo_apellido: "",
    curp: "",
    fecha_nacimiento: "",
    sexo: "M",
    id_localidad: "",
    calle_numero: "",
    referencia_geografica: "",
    telefono: "",
    id_lengua_materna: "",
    grupo_sanguineo: "",
  });

  const [errors, setErrors] = useState({});

  const rolesPermitidos = [
    "MEDICO_GENERAL", "ESPECIALISTA", "RECEPCIONISTA",
    "ADMINISTRADOR", "SUPERADMIN", "OMNIADMIN",
  ];

  const tieneAcceso = user && rolesPermitidos.includes(user.rol);

  // ✅ Efecto para mostrar preview de barrera lingüística
  useEffect(() => {
    const lenguaSeleccionada = form.id_lengua_materna;
    // ID 1 = Español, cualquier otro ID activa la alerta
    setShowBarreraPreview(
      lenguaSeleccionada && 
      lenguaSeleccionada !== "" && 
      lenguaSeleccionada !== "1"
    );
  }, [form.id_lengua_materna]);

  // Cargar estados al montar
  useEffect(() => {
    const loadEstados = async () => {
      try {
        setLoadingEstados(true);
        const data = await catalogosAPI.getEstados();
        setEstados(data.data || []);
      } catch (err) {
        console.error('Error cargando estados:', err);
        setEstados([{ id_estado: '07', nombre: 'Chiapas' }]);
      } finally {
        setLoadingEstados(false);
      }
    };
    loadEstados();
  }, []);

  // Cargar lenguas al montar
  useEffect(() => {
    const loadLenguas = async () => {
      try {
        setLoadingLenguas(true);
        const data = await catalogosAPI.getLenguas();
        setLenguas(data.data || []);
      } catch (err) {
        console.error('Error cargando lenguas:', err);
        setLenguas([
          { id_lengua: 1, nombre: 'Español' },
          { id_lengua: 2, nombre: 'Tzotzil' },
          { id_lengua: 3, nombre: 'Tzeltal' },
        ]);
      } finally {
        setLoadingLenguas(false);
      }
    };
    loadLenguas();
  }, []);

  // Cargar municipios cuando cambia el estado seleccionado
  useEffect(() => {
    if (!selectedEstado) {
      setMunicipios([]);
      return;
    }

    const loadMunicipios = async () => {
      try {
        setLoadingMunicipios(true);
        const data = await catalogosAPI.getMunicipios(selectedEstado);
        setMunicipios(data.data || []);
      } catch (err) {
        console.error('Error cargando municipios:', err);
        setMunicipios([]);
      } finally {
        setLoadingMunicipios(false);
      }
    };
    loadMunicipios();
  }, [selectedEstado]);

  // Cargar localidades cuando cambia el municipio seleccionado
  useEffect(() => {
    if (!selectedMunicipio) {
      setLocalidades([]);
      return;
    }

    const loadLocalidades = async () => {
      try {
        setLoadingLocalidades(true);
        const data = await catalogosAPI.getLocalidades(selectedMunicipio);
        setLocalidades(data.data || []);
      } catch (err) {
        console.error('Error cargando localidades:', err);
        setLocalidades([]);
      } finally {
        setLoadingLocalidades(false);
      }
    };
    loadLocalidades();
  }, [selectedMunicipio]);

  // Cargar datos si es edición
  useEffect(() => {
    if (!isEdit || !tieneAcceso) return;

    const loadPaciente = async () => {
      try {
        setLoading(true);
        const pacRes = await pacientesAPI.getPaciente(id);
        const pacienteData = pacRes.data?.data || pacRes.data;
        
        if (pacienteData) {
          const p = pacienteData;
          setForm({
            nombre: p.persona?.nombre || p.nombre || "",
            primer_apellido: p.persona?.primer_apellido || p.primer_apellido || "",
            segundo_apellido: p.persona?.segundo_apellido || p.segundo_apellido || "",
            curp: p.persona?.curp || "",
            fecha_nacimiento: p.persona?.fecha_nacimiento?.split('T')[0] || "",
            sexo: p.persona?.sexo || "M",
            id_localidad: p.persona?.id_localidad || "",
            calle_numero: p.persona?.calle_numero || "",
            referencia_geografica: p.persona?.referencia_geografica || "",
            telefono: p.persona?.telefono || "",
            id_lengua_materna: p.persona?.id_lengua_materna?.toString() || "",
            grupo_sanguineo: p.grupo_sanguineo || "",
          });
        }
      } catch (err) {
        console.error("Error cargando paciente:", err);
        setError("No se pudo cargar los datos del paciente");
      } finally {
        setLoading(false);
      }
    };

    loadPaciente();
  }, [id, isEdit, tieneAcceso]);

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.nombre?.trim()) newErrors.nombre = "Nombre requerido";
    if (!form.primer_apellido?.trim()) newErrors.primer_apellido = "Primer apellido requerido";
    if (!form.fecha_nacimiento) newErrors.fecha_nacimiento = "Fecha de nacimiento requerida";
    if (!form.sexo) newErrors.sexo = "Sexo requerido";
    
    if (form.curp && !/^[A-ZÑ&]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z]{2}$/i.test(form.curp)) {
      newErrors.curp = "CURP inválido (formato: XXXX000000HXXXXX00)";
    }
    
    if (form.telefono && form.telefono.replace(/\D/g, "").length < 7) {
      newErrors.telefono = "Teléfono debe tener al menos 7 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAndContinue = async () => {
    setValidationErrors([]);
    
    if (!validateForm()) {
      setError("Por favor, completa los campos requeridos correctamente");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      console.log('📦 Datos del formulario:', form);
      
      const pacientePayload = {
        persona: {
          nombre: form.nombre.trim(),
          primer_apellido: form.primer_apellido.trim(),
          segundo_apellido: form.segundo_apellido.trim() || null,
          curp: form.curp.trim().toUpperCase() || null,
          fecha_nacimiento: form.fecha_nacimiento,
          sexo: form.sexo,
          id_localidad: form.id_localidad || null,
          calle_numero: form.calle_numero.trim() || null,
          referencia_geografica: form.referencia_geografica.trim() || null,
          telefono: form.telefono.trim() || null,
          id_lengua_materna: form.id_lengua_materna ? parseInt(form.id_lengua_materna) : null,
        },
        grupo_sanguineo: form.grupo_sanguineo || null
      };
      
      const getNombreLengua = lenguas.find(l => l.id_lengua.toString() === form.id_lengua_materna)?.nombre || "Desconocida";
      console.log('📤 Enviando paciente:', pacientePayload);
      
      const pacienteResponse = await pacientesAPI.createPaciente(pacientePayload);
      const nuevoPaciente = pacienteResponse.data?.data;
      
      setSuccessMsg("Paciente registrado exitosamente. Redirigiendo...");
      const targetPath = user?.rol === "RECEPCIONISTA" ? "/pacientes" : `/pacientes/${nuevoPaciente.id_paciente}/antecedentes`;
      setTimeout(() => navigate(targetPath), 1500);
    } catch (err) {
      console.error("Error guardando paciente:", err);
      
      if (err.response?.status === 422) {
        const detail = err.response.data?.detail;
        if (Array.isArray(detail)) {
          setValidationErrors(detail);
          setError(detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join('\n'));
        } else {
          setError(JSON.stringify(detail));
        }
      } else {
        setError(err.response?.data?.detail || err.message || "Error al guardar paciente");
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors([]);
    
    if (!validateForm()) {
      setError("Por favor, completa los campos requeridos correctamente");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      if (isEdit) {
        const updateData = {
          nombre: form.nombre.trim(),
          primer_apellido: form.primer_apellido.trim(),
          segundo_apellido: form.segundo_apellido.trim() || null,
          curp: form.curp.trim().toUpperCase() || null,
          fecha_nacimiento: form.fecha_nacimiento,
          sexo: form.sexo,
          id_localidad: form.id_localidad || null,
          calle_numero: form.calle_numero.trim() || null,
          referencia_geografica: form.referencia_geografica.trim() || null,
          telefono: form.telefono.trim() || null,
          id_lengua_materna: form.id_lengua_materna ? parseInt(form.id_lengua_materna) : null,
        };
        
        await pacientesAPI.updatePersona(id, updateData);
        if (form.grupo_sanguineo) {
          await pacientesAPI.updatePaciente(id, { grupo_sanguineo: form.grupo_sanguineo });
        }
        
        setSuccessMsg("Paciente actualizado exitosamente");
        setTimeout(() => navigate(`/expediente/${id}`), 1500);
      } else {
        console.log('📦 Datos del formulario:', form);
        
        const pacientePayload = {
          persona: {
            nombre: form.nombre.trim(),
            primer_apellido: form.primer_apellido.trim(),
            segundo_apellido: form.segundo_apellido.trim() || null,
            curp: form.curp.trim().toUpperCase() || null,
            fecha_nacimiento: form.fecha_nacimiento,
            sexo: form.sexo,
            id_localidad: form.id_localidad || null,
            calle_numero: form.calle_numero.trim() || null,
            referencia_geografica: form.referencia_geografica.trim() || null,
            telefono: form.telefono.trim() || null,
            id_lengua_materna: form.id_lengua_materna ? parseInt(form.id_lengua_materna) : null,
          },
          grupo_sanguineo: form.grupo_sanguineo || null
        };
        
        const getNombreLengua = lenguas.find(l => l.id_lengua.toString() === form.id_lengua_materna)?.nombre || "Desconocida";
        console.log('📤 Enviando paciente:', pacientePayload);
        
        const pacienteResponse = await pacientesAPI.createPaciente(pacientePayload);
        const nuevoPaciente = pacienteResponse.data?.data;
        
        setSuccessMsg("Paciente registrado exitosamente");
        const targetPath = user?.rol === "RECEPCIONISTA" ? "/pacientes" : `/expediente/${nuevoPaciente.id_paciente}`;
        setTimeout(() => navigate(targetPath), 1500);
      }
    } catch (err) {
      console.error("Error guardando paciente:", err);
      
      if (err.response?.status === 422) {
        const detail = err.response.data?.detail;
        if (Array.isArray(detail)) {
          setValidationErrors(detail);
          setError(detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join('\n'));
        } else {
          setError(JSON.stringify(detail));
        }
      } else {
        setError(err.response?.data?.detail || err.message || "Error al guardar paciente");
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
        <p style={{ color: "#5A5048", fontSize: 14 }}>No tienes permisos para registrar pacientes.</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: "24px", padding: "10px 20px", background: "#2459A8", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
          ← Volver
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontSize: 14, color: "#5A5048" }}>⏳ Cargando datos del paciente...</div>
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
              <h1 style={{ color: "#1A1510", fontSize: 18, fontWeight: 700, margin: 0 }}>{isEdit ? "Editar" : "Registrar"} Paciente</h1>
              <p style={{ color: "#5A5048", fontSize: 12, margin: "4px 0 0 0" }}>
                {isEdit ? "Actualiza los datos del paciente" : "Completa el formulario para registrar un nuevo paciente"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
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
              {validationErrors.map((err, i) => (
                <li key={i}>{err.loc.join('.')}: {err.msg}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Sección: Datos Personales */}
          <div style={{ background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#1A1510", textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.4px" }}>Datos Personales</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Nombre *</label>
                <input type="text" value={form.nombre} onChange={(e) => updateField("nombre", e.target.value)} placeholder="Ej. Juan" style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${errors.nombre ? "#BA2E45" : "#DAD4CC"}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
                {errors.nombre && <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>⚠ {errors.nombre}</span>}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Primer Apellido *</label>
                <input type="text" value={form.primer_apellido} onChange={(e) => updateField("primer_apellido", e.target.value)} placeholder="Ej. García" style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${errors.primer_apellido ? "#BA2E45" : "#DAD4CC"}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
                {errors.primer_apellido && <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>⚠ {errors.primer_apellido}</span>}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Segundo Apellido</label>
                <input type="text" value={form.segundo_apellido} onChange={(e) => updateField("segundo_apellido", e.target.value)} placeholder="(opcional)" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>CURP</label>
                <input type="text" value={form.curp} onChange={(e) => updateField("curp", e.target.value.toUpperCase())} placeholder="XXXX000000HXXXXX00" maxLength={18} style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${errors.curp ? "#BA2E45" : "#DAD4CC"}`, borderRadius: 6, fontSize: 13, fontFamily: "monospace", boxSizing: "border-box", textTransform: "uppercase" }} />
                {errors.curp && <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>⚠ {errors.curp}</span>}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Fecha de Nacimiento *</label>
                <input type="date" value={form.fecha_nacimiento} onChange={(e) => updateField("fecha_nacimiento", e.target.value)} style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${errors.fecha_nacimiento ? "#BA2E45" : "#DAD4CC"}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
                {errors.fecha_nacimiento && <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>⚠ {errors.fecha_nacimiento}</span>}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Sexo *</label>
                <select value={form.sexo} onChange={(e) => updateField("sexo", e.target.value)} style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${errors.sexo ? "#BA2E45" : "#DAD4CC"}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", backgroundColor: "#fff" }}>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Ubicación y Contacto */}
          <div style={{ background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#1A1510", textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.4px" }}>Ubicación y Contacto</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Estado</label>
                <select value={selectedEstado} onChange={(e) => { setSelectedEstado(e.target.value); setSelectedMunicipio(""); updateField("id_localidad", ""); }} disabled={loadingEstados} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, backgroundColor: "#fff" }}>
                  <option value="">{loadingEstados ? "Cargando..." : "Seleccione estado"}</option>
                  {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Municipio</label>
                <select value={selectedMunicipio} onChange={(e) => { setSelectedMunicipio(e.target.value); updateField("id_localidad", ""); }} disabled={!selectedEstado || loadingMunicipios} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, backgroundColor: "#fff" }}>
                  <option value="">{loadingMunicipios ? "Cargando..." : "Seleccione municipio"}</option>
                  {municipios.map(m => <option key={m.id_municipio} value={m.id_municipio}>{m.nombre}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Localidad</label>
                <select value={form.id_localidad} onChange={(e) => updateField("id_localidad", e.target.value)} disabled={!selectedMunicipio || loadingLocalidades} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, backgroundColor: "#fff" }}>
                  <option value="">{loadingLocalidades ? "Cargando..." : "Seleccione localidad"}</option>
                  {localidades.map(loc => <option key={loc.id_localidad} value={loc.id_localidad}>{loc.nombre} {loc.ambito ? `(${loc.ambito})` : ''}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Teléfono</label>
                <input type="tel" value={form.telefono} onChange={(e) => updateField("telefono", e.target.value)} placeholder="55 1234 5678" style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${errors.telefono ? "#BA2E45" : "#DAD4CC"}`, borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
                {errors.telefono && <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>⚠ {errors.telefono}</span>}
              </div>

              {/* ✅ Lengua Materna con indicador de barrera lingüística */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Lengua Materna</label>
                <select
                  value={form.id_lengua_materna}
                  onChange={(e) => updateField("id_lengua_materna", e.target.value)}
                  disabled={loadingLenguas}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1.5px solid ${showBarreraPreview ? "#E8921F" : "#DAD4CC"}`,
                    borderRadius: 6,
                    fontSize: 13,
                    backgroundColor: showBarreraPreview ? "#FFF8F0" : "#fff",
                  }}
                >
                  <option value="">{loadingLenguas ? "Cargando..." : "Seleccione (opcional)"}</option>
                  <option value="1">🇲🇽 Español</option>
                  {lenguas.filter(l => l.id_lengua !== 1).map(l => (
                    <option key={l.id_lengua} value={l.id_lengua}>
                      🗣️ {l.nombre} {l.familia ? `(${l.familia})` : ''}
                    </option>
                  ))}
                </select>
                {showBarreraPreview && (
                  <small style={{ fontSize: 10, color: "#E8921F", marginTop: 4, display: "block" }}>
                    ⚠️ Esta selección activará la alerta de barrera lingüística en el expediente
                  </small>
                )}
              </div>

              {/* ✅ Preview de alerta de barrera lingüística */}
              {showBarreraPreview && (
                <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
                  <div style={{ padding: "10px 14px", background: "#FFF3E0", border: "1.5px solid #E8921F", borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
                    <Languages size={18} style={{ color: "#E8921F" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#B86E12" }}>Se activará alerta de barrera lingüística</div>
                      <div style={{ fontSize: 11, color: "#5A5048" }}>El expediente mostrará esta alerta para el personal médico</div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Calle y Número</label>
                <input type="text" value={form.calle_numero} onChange={(e) => updateField("calle_numero", e.target.value)} placeholder="Ej. Calle Principal #123" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Referencia Geográfica</label>
                <textarea value={form.referencia_geografica} onChange={(e) => updateField("referencia_geografica", e.target.value)} placeholder="Ej. Cerca del parque central" rows={3} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }} />
              </div>
            </div>
          </div>

          {/* Sección: Datos Clínicos */}
          <div style={{ background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#1A1510", textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.4px" }}>Datos Clínicos</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Grupo Sanguíneo</label>
                <select value={form.grupo_sanguineo} onChange={(e) => updateField("grupo_sanguineo", e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #DAD4CC", borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", backgroundColor: "#fff" }}>
                  <option value="">Seleccionar...</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => navigate(-1)} style={{ padding: "10px 20px", background: "transparent", border: "1.5px solid #2459A8", color: "#2459A8", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Cancelar</button>
            {!isEdit && (
              <button 
                type="button" 
                onClick={handleSaveAndContinue} 
                disabled={saving}
                style={{ 
                  padding: "10px 20px", 
                  background: "#059669", 
                  color: "#fff", 
                  border: "none", 
                  borderRadius: 6, 
                  cursor: saving ? "not-allowed" : "pointer", 
                  fontSize: 13, 
                  fontWeight: 500, 
                  opacity: saving ? 0.6 : 1, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8 
                }}
              >
                <Save size={16} />
                {saving ? "Guardando..." : "Guardar y Continuar →"}
              </button>
            )}
            <button type="submit" disabled={saving} style={{ padding: "10px 20px", background: "#2459A8", color: "#fff", border: "none", borderRadius: 6, cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500, opacity: saving ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8 }}>
              <Save size={16} />
              {saving ? "Guardando..." : isEdit ? "Actualizar" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}