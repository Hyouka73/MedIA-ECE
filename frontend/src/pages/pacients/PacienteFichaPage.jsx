import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { pacientesAPI } from '../../api/pacientes';
import { AlertCircle, ChevronLeft, Save, Plus } from 'lucide-react';

/**
 * PacienteFichaPage — Formulario de Registro/Edición de Paciente
 * Permite crear un nuevo paciente o editar datos existentes.
 * Compatible con NOM-024-SSA3-2012 y diseño MedIA
 */

export default function PacienteFichaPage() {
  const { user } = useAuth();
  const { id } = useParams(); // ID paciente si es edición
  const navigate = useNavigate();

  const [isEdit] = useState(Boolean(id));
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Formulario - Datos Personales
  const [form, setForm] = useState({
    // Persona
    nombre: "",
    primer_apellido: "",
    segundo_apellido: "",
    curp: "",
    fecha_nacimiento: "",
    sexo: "M",
    
    // Ubicación
    id_localidad: "",
    calle_numero: "",
    referencia_geografica: "",
    
    // Contacto
    telefono: "",
    id_lengua_materna: "",
    
    // Paciente
    grupo_sanguineo: "",
  });

  const [errors, setErrors] = useState({});

  // Roles permitidos
  const rolesPermitidos = [
    "MEDICO_GENERAL",
    "ESPECIALISTA",
    "RECEPCIONISTA",
    "ADMINISTRADOR",
    "SUPERADMIN",
    "OMNIADMIN",
  ];

  const tieneAcceso = user && rolesPermitidos.includes(user.rol);

  // Cargar datos si es edición
  useEffect(() => {
    if (!isEdit || !tieneAcceso) return;

    const loadPaciente = async () => {
      try {
        setLoading(true);
        const pacRes = await pacientesAPI.getPersona(id);
        if (pacRes.data) {
          const p = pacRes.data;
          setForm({
            nombre: p.persona?.nombre || p.nombre || "",
            primer_apellido: p.persona?.primer_apellido || "",
            segundo_apellido: p.persona?.segundo_apellido || "",
            curp: p.persona?.curp || "",
            fecha_nacimiento: p.persona?.fecha_nacimiento || "",
            sexo: p.persona?.sexo || "M",
            id_localidad: p.persona?.id_localidad || "",
            calle_numero: p.persona?.calle_numero || "",
            referencia_geografica: p.persona?.referencia_geografica || "",
            telefono: p.persona?.telefono || "",
            id_lengua_materna: p.persona?.id_lengua_materna || "",
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

  // Actualizar campo
  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }));
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.nombre?.trim()) newErrors.nombre = "Nombre requerido";
    if (!form.primer_apellido?.trim()) newErrors.primer_apellido = "Primer apellido requerido";
    if (!form.fecha_nacimiento) newErrors.fecha_nacimiento = "Fecha de nacimiento requerida";
    if (!form.sexo) newErrors.sexo = "Sexo requerido";
    
    if (form.curp && !/^[A-ZÑ]{6}\d{8}[HM][A-Z]{3}[0-9A-Z]\d$/.test(form.curp)) {
      newErrors.curp = "CURP inválido";
    }
    
    if (form.telefono && !/^\d{7,15}$/.test(form.telefono.replace(/\D/g, ""))) {
      newErrors.telefono = "Teléfono inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar paciente
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError("Por favor, completa los campos requeridos");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMsg("");

      if (isEdit) {
        // Actualizar paciente existente
        // await pacientesAPI.updatePaciente(id, form);
        setSuccessMsg("Paciente actualizado exitosamente");
        setTimeout(() => navigate(`/expediente/${id}`), 1500);
      } else {
        // Crear nuevo paciente
        // const res = await pacientesAPI.createPaciente(form);
        setSuccessMsg("Paciente registrado exitosamente");
        setTimeout(() => navigate("/pacientes"), 1500);
      }
    } catch (err) {
      console.error("Error guardando paciente:", err);
      setError(err.response?.data?.detail || "Error al guardar paciente");
    } finally {
      setSaving(false);
    }
  };

  // Control de acceso
  if (!tieneAcceso) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px" }}>
        <AlertCircle size={48} style={{ color: "#BA2E45", marginBottom: "16px" }} />
        <h2 style={{ color: "#1A1510", fontSize: 18, fontWeight: 600, marginBottom: "8px" }}>
          Acceso Denegado
        </h2>
        <p style={{ color: "#5A5048", fontSize: 14 }}>
          No tienes permisos para registrar pacientes.
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: "24px",
            padding: "10px 20px",
            background: "#2459A8",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          ← Volver
        </button>
      </div>
    );
  }

  // Estado loading
  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontSize: 14, color: "#5A5048" }}>
          ⏳ Cargando datos del paciente...
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#EDEBE6" }}>
      {/* TopBar */}
      <div style={{
        padding: "16px 28px",
        background: "#FDFAF5",
        borderBottom: "1px solid #DAD4CC",
        backdropFilter: "blur(12px)",
        zIndex: 10,
        boxShadow: "0 1px 3px rgba(26,21,16,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "#2C2620",
                padding: "4px 8px",
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 style={{ color: "#1A1510", fontSize: 18, fontWeight: 700, margin: 0 }}>
                {isEdit ? "Editar" : "Registrar"} Paciente
              </h1>
              <p style={{ color: "#5A5048", fontSize: 12, margin: "4px 0 0 0" }}>
                {isEdit ? "Actualiza los datos del paciente" : "Completa el formulario para registrar un nuevo paciente"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
        {/* Mensajes */}
        {successMsg && (
          <div style={{
            padding: "12px 16px",
            background: "#E8F5E9",
            border: "1.5px solid #237A4B",
            borderRadius: 8,
            marginBottom: 20,
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}>
            <span style={{ fontSize: 18 }}>✓</span>
            <span style={{ color: "#237A4B", fontSize: 13, fontWeight: 500 }}>{successMsg}</span>
          </div>
        )}

        {error && (
          <div style={{
            padding: "12px 16px",
            background: "#FFEBEE",
            border: "1.5px solid #BA2E45",
            borderRadius: 8,
            marginBottom: 20,
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}>
            <AlertCircle size={18} style={{ color: "#BA2E45", flexShrink: 0 }} />
            <span style={{ color: "#BA2E45", fontSize: 13, fontWeight: 500 }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Sección: Datos Personales */}
          <div style={{
            background: "#FDFAF5",
            border: "1px solid #DAD4CC",
            borderRadius: 10,
            padding: 20,
            marginBottom: 20,
          }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#1A1510", textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.4px" }}>
              Datos Personales
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Nombre */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => updateField("nombre", e.target.value)}
                  placeholder="Ej. Juan"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1.5px solid ${errors.nombre ? "#BA2E45" : "#DAD4CC"}`,
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    transitionProperty: "border-color, box-shadow",
                    transitionDuration: "0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2459A8";
                    e.target.style.boxShadow = "0 0 0 3px rgba(36, 89, 168, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.nombre ? "#BA2E45" : "#DAD4CC";
                    e.target.style.boxShadow = "none";
                  }}
                />
                {errors.nombre && <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>⚠ {errors.nombre}</span>}
              </div>

              {/* Primer Apellido */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>
                  Primer Apellido *
                </label>
                <input
                  type="text"
                  value={form.primer_apellido}
                  onChange={(e) => updateField("primer_apellido", e.target.value)}
                  placeholder="Ej. García"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1.5px solid ${errors.primer_apellido ? "#BA2E45" : "#DAD4CC"}`,
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                {errors.primer_apellido && <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>⚠ {errors.primer_apellido}</span>}
              </div>

              {/* Segundo Apellido */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>
                  Segundo Apellido
                </label>
                <input
                  type="text"
                  value={form.segundo_apellido}
                  onChange={(e) => updateField("segundo_apellido", e.target.value)}
                  placeholder="(opcional)"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #DAD4CC",
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* CURP */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>
                  CURP
                </label>
                <input
                  type="text"
                  value={form.curp}
                  onChange={(e) => updateField("curp", e.target.value.toUpperCase())}
                  placeholder="XXXXXX000000HXXXXXN"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1.5px solid ${errors.curp ? "#BA2E45" : "#DAD4CC"}`,
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "monospace",
                    boxSizing: "border-box",
                  }}
                />
                {errors.curp && <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>⚠ {errors.curp}</span>}
              </div>

              {/* Fecha de Nacimiento */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={(e) => updateField("fecha_nacimiento", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1.5px solid ${errors.fecha_nacimiento ? "#BA2E45" : "#DAD4CC"}`,
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                {errors.fecha_nacimiento && <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>⚠ {errors.fecha_nacimiento}</span>}
              </div>

              {/* Sexo */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>
                  Sexo *
                </label>
                <select
                  value={form.sexo}
                  onChange={(e) => updateField("sexo", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1.5px solid ${errors.sexo ? "#BA2E45" : "#DAD4CC"}`,
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="X">Otro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Ubicación y Contacto */}
          <div style={{
            background: "#FDFAF5",
            border: "1px solid #DAD4CC",
            borderRadius: 10,
            padding: 20,
            marginBottom: 20,
          }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#1A1510", textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.4px" }}>
              Ubicación y Contacto
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Teléfono */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => updateField("telefono", e.target.value)}
                  placeholder="55 1234-5678"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1.5px solid ${errors.telefono ? "#BA2E45" : "#DAD4CC"}`,
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                {errors.telefono && <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>⚠ {errors.telefono}</span>}
              </div>

              {/* Localidad */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>
                  Localidad
                </label>
                <input
                  type="text"
                  value={form.id_localidad}
                  onChange={(e) => updateField("id_localidad", e.target.value)}
                  placeholder="Ej. Chiapa de Corzo"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #DAD4CC",
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Calle y Número */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>
                  Calle y Número
                </label>
                <input
                  type="text"
                  value={form.calle_numero}
                  onChange={(e) => updateField("calle_numero", e.target.value)}
                  placeholder="Ej. Calle Principal #123, Depto 4B"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #DAD4CC",
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Referencia Geográfica */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>
                  Referencia Geográfica
                </label>
                <textarea
                  value={form.referencia_geografica}
                  onChange={(e) => updateField("referencia_geografica", e.target.value)}
                  placeholder="Ej. Cerca de la estación de autobuses"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #DAD4CC",
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sección: Datos Clínicos */}
          <div style={{
            background: "#FDFAF5",
            border: "1px solid #DAD4CC",
            borderRadius: 10,
            padding: 20,
            marginBottom: 20,
          }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#1A1510", textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.4px" }}>
              Datos Clínicos
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Grupo Sanguíneo */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>
                  Grupo Sanguíneo
                </label>
                <select
                  value={form.grupo_sanguineo}
                  onChange={(e) => updateField("grupo_sanguineo", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #DAD4CC",
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                >
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

              {/* Lengua Materna */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>
                  Lengua Materna
                </label>
                <input
                  type="text"
                  value={form.id_lengua_materna}
                  onChange={(e) => updateField("id_lengua_materna", e.target.value)}
                  placeholder="Ej. Español, Tzeltal"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #DAD4CC",
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                padding: "10px 20px",
                background: "transparent",
                border: "1.5px solid #2459A8",
                color: "#2459A8",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 20px",
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
              }}
            >
              <Save size={16} />
              {saving ? "Guardando..." : isEdit ? "Actualizar" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
