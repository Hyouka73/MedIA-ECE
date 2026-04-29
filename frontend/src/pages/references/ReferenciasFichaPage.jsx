import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { referenciasAPI } from '../../api/referencias';
import apiClient from '../../api/client';
import { AlertCircle, ChevronLeft, Save, Search } from 'lucide-react';

export default function ReferenciasFichaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Búsqueda de encuentro clínico (la FK real es id_encuentro_origen)
  const [searchEncuentro, setSearchEncuentro] = useState('');
  const [encuentrosEncontrados, setEncuentrosEncontrados] = useState([]);
  const [encuentroSeleccionado, setEncuentroSeleccionado] = useState(null);
  const [buscando, setBuscando] = useState(false);

  // Catálogos
  const [establecimientos, setEstablecimientos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);

  // Formulario — campos REALES de la tabla referencias_medicas
  const [form, setForm] = useState({
    id_encuentro_origen: '',
    id_establecimiento_destino: '',
    id_especialidad_destino: '',
    motivo_referencia: '',
  });

  const [errors, setErrors] = useState({});

  const rolesPermitidos = [
    "MEDICO_GENERAL", "ESPECIALISTA",
    "ADMINISTRADOR", "SUPERADMIN", "OMNIADMIN",
  ];

  const tieneAcceso = user && rolesPermitidos.includes(user.rol);

  // Cargar catálogos al montar
  useEffect(() => {
    if (!tieneAcceso) return;
    loadCatalogos();
  }, [tieneAcceso]);

  const loadCatalogos = async () => {
    try {
      const [estData, espData] = await Promise.all([
        referenciasAPI.getEstablecimientos(),
        referenciasAPI.getEspecialidades(),
      ]);
      setEstablecimientos(estData.data || []);
      setEspecialidades(espData.data || []);
    } catch (err) {
      console.error('Error cargando catálogos:', err);
    }
  };

  // Buscar encuentros del médico actual
  const handleSearchEncuentro = async () => {
    if (!searchEncuentro || searchEncuentro.length < 2) {
      setError('Ingrese al menos 2 caracteres para buscar');
      return;
    }

    try {
      setBuscando(true);
      setError(null);
      
      // Buscar encuentros — usamos el endpoint de encuentros existente
      const response = await apiClient.get('/encuentros', {
        params: { page: 1, limit: 20 }
      });
      
      const items = response.data?.data?.items || [];
      
      // Filtrar por texto de búsqueda si hay items
      // Como el endpoint no soporta búsqueda por texto, traemos todos y filtramos
      setEncuentrosEncontrados(items);
      
      if (items.length === 0) {
        setError('No se encontraron encuentros clínicos');
      }
    } catch (err) {
      console.error('Error buscando encuentros:', err);
      setError('Error al buscar encuentros. Intente nuevamente.');
      setEncuentrosEncontrados([]);
    } finally {
      setBuscando(false);
    }
  };

  // Cargar todos los encuentros al hacer click en "Buscar"
  const handleLoadEncuentros = async () => {
    try {
      setBuscando(true);
      setError(null);
      
      const response = await apiClient.get('/encuentros', {
        params: { page: 1, limit: 50 }
      });
      
      const items = response.data?.data?.items || [];
      setEncuentrosEncontrados(items);
      
      if (items.length === 0) {
        setError('No hay encuentros clínicos registrados');
      }
    } catch (err) {
      console.error('Error cargando encuentros:', err);
      setError('Error al cargar encuentros');
      setEncuentrosEncontrados([]);
    } finally {
      setBuscando(false);
    }
  };

  // Seleccionar encuentro
  const handleSelectEncuentro = (enc) => {
    setEncuentroSeleccionado(enc);
    setForm(prev => ({ ...prev, id_encuentro_origen: enc.id_encuentro }));
    setEncuentrosEncontrados([]);
    if (errors.id_encuentro_origen) {
      setErrors(prev => ({ ...prev, id_encuentro_origen: '' }));
    }
  };

  // Limpiar selección
  const handleClearEncuentro = () => {
    setEncuentroSeleccionado(null);
    setForm(prev => ({ ...prev, id_encuentro_origen: '' }));
    setEncuentrosEncontrados([]);
  };

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.id_encuentro_origen) newErrors.id_encuentro_origen = 'Debe seleccionar un encuentro clínico';
    if (!form.id_establecimiento_destino) newErrors.id_establecimiento_destino = 'Establecimiento destino requerido';
    if (!form.id_especialidad_destino) newErrors.id_especialidad_destino = 'Especialidad destino requerida';
    if (!form.motivo_referencia?.trim()) newErrors.motivo_referencia = 'Motivo de referencia requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        id_encuentro_origen: form.id_encuentro_origen,
        id_establecimiento_destino: form.id_establecimiento_destino,
        id_especialidad_destino: parseInt(form.id_especialidad_destino),
        motivo_referencia: form.motivo_referencia.trim(),
      };

      const data = await referenciasAPI.createReferencia(payload);
      setSuccessMsg('Referencia médica emitida exitosamente');
      setTimeout(() => navigate(`/referencias/${data.data.id_referencia}`), 1500);
    } catch (err) {
      console.error('Error guardando referencia:', err);
      
      if (err.response?.status === 422) {
        const detail = err.response.data?.detail;
        setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
      } else {
        setError(err.response?.data?.detail || err.message || 'Error al crear referencia');
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
                Nueva Referencia Médica
              </h1>
              <p style={{ color: "#5A5048", fontSize: 12, margin: "4px 0 0 0" }}>
                Emitir referencia a otro establecimiento
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

        <form onSubmit={handleSubmit}>
          {/* Sección: Selección de Encuentro Clínico */}
          <div style={{ background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#1A1510", textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.4px" }}>
              Encuentro Clínico de Origen *
            </h2>
            <p style={{ fontSize: 11, color: "#8A7F75", marginBottom: 12 }}>
              Seleccione el encuentro clínico desde el cual se emite la referencia
            </p>

            {!encuentroSeleccionado && (
              <div style={{ display: "flex", gap: 12 }}>
                <button 
                  type="button" 
                  onClick={handleLoadEncuentros} 
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
                  <Search size={16} /> {buscando ? 'Cargando...' : 'Cargar Encuentros'}
                </button>
              </div>
            )}
            
            {errors.id_encuentro_origen && (
              <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>
                ⚠ {errors.id_encuentro_origen}
              </span>
            )}

            {/* Resultados de búsqueda */}
            {encuentrosEncontrados.length > 0 && !encuentroSeleccionado && (
              <div style={{ marginTop: 12, border: "1px solid #DAD4CC", borderRadius: 8, overflow: "hidden", maxHeight: "350px", overflowY: "auto" }}>
                {encuentrosEncontrados.map(enc => (
                  <div 
                    key={enc.id_encuentro}
                    onClick={() => handleSelectEncuentro(enc)}
                    style={{ 
                      padding: "12px 14px", 
                      cursor: "pointer", 
                      borderBottom: "1px solid #DAD4CC", 
                      background: "#fff",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#F5F3F0"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1510" }}>
                      {enc.motivo_consulta || 'Consulta clínica'}
                    </div>
                    <div style={{ fontSize: 12, color: "#5A5048", marginTop: 4, display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span>📅 {enc.fecha_inicio ? new Date(enc.fecha_inicio).toLocaleDateString('es-MX') : 'N/A'}</span>
                      <span>{enc.fecha_cierre ? '✅ Cerrado' : '🟢 Abierto'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Encuentro seleccionado */}
            {encuentroSeleccionado && (
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
                  <span style={{ fontSize: 24 }}>🩺</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1510" }}>
                      {encuentroSeleccionado.motivo_consulta || 'Consulta clínica'}
                    </div>
                    <div style={{ fontSize: 12, color: "#5A5048", marginTop: 2 }}>
                      {encuentroSeleccionado.fecha_inicio ? new Date(encuentroSeleccionado.fecha_inicio).toLocaleDateString('es-MX') : ''} 
                      {' · '} ID: {encuentroSeleccionado.id_encuentro?.substring(0, 8)}...
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearEncuentro}
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

          {/* Sección: Destino de la Referencia */}
          <div style={{ background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#1A1510", textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.4px" }}>Destino de la Referencia</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginBottom: 16 }}>
              {/* Establecimiento destino */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Establecimiento Destino *</label>
                <select 
                  value={form.id_establecimiento_destino} 
                  onChange={(e) => updateField('id_establecimiento_destino', e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${errors.id_establecimiento_destino ? "#BA2E45" : "#DAD4CC"}`, borderRadius: 6, fontSize: 13, backgroundColor: "#fff" }}>
                  <option value="">Seleccionar establecimiento...</option>
                  {establecimientos.map(est => (
                    <option key={est.id_establecimiento} value={est.id_establecimiento}>
                      {est.nombre} ({est.clues})
                    </option>
                  ))}
                </select>
                {errors.id_establecimiento_destino && (
                  <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>
                    ⚠ {errors.id_establecimiento_destino}
                  </span>
                )}
              </div>

              {/* Especialidad destino */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Especialidad Destino *</label>
                <select 
                  value={form.id_especialidad_destino} 
                  onChange={(e) => updateField('id_especialidad_destino', e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${errors.id_especialidad_destino ? "#BA2E45" : "#DAD4CC"}`, borderRadius: 6, fontSize: 13, backgroundColor: "#fff" }}>
                  <option value="">Seleccionar especialidad...</option>
                  {especialidades.map(esp => (
                    <option key={esp.id_especialidad} value={esp.id_especialidad}>
                      {esp.nombre}
                    </option>
                  ))}
                </select>
                {errors.id_especialidad_destino && (
                  <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>
                    ⚠ {errors.id_especialidad_destino}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sección: Motivo Clínico */}
          <div style={{ background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#1A1510", textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.4px" }}>Motivo Clínico</h2>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5A5048", marginBottom: 6, textTransform: "uppercase" }}>Motivo de Referencia *</label>
              <textarea 
                value={form.motivo_referencia} 
                onChange={(e) => updateField('motivo_referencia', e.target.value)}
                placeholder="Describa el motivo clínico de la referencia, incluyendo diagnóstico presuntivo, hallazgos y tratamiento actual..."
                rows={5}
                style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${errors.motivo_referencia ? "#BA2E45" : "#DAD4CC"}`, borderRadius: 6, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
              {errors.motivo_referencia && (
                <span style={{ fontSize: 10, color: "#BA2E45", marginTop: 4, display: "block" }}>
                  ⚠ {errors.motivo_referencia}
                </span>
              )}
              <span style={{ fontSize: 10, color: "#8A7F75", marginTop: 4, display: "block" }}>
                Incluya diagnóstico de envío, resumen clínico, hallazgos relevantes y tratamiento actual
              </span>
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
              {saving ? "Emitiendo..." : "Emitir Referencia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}