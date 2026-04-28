<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { pacientesAPI } from '../../api/pacientes';
import { clinicoAPI } from '../../api/clinico';
import { AlertCircle, ChevronLeft, Clock, FileText, Pill, TrendingUp } from 'lucide-react';
import { BarreraLinguisticaAlert } from '../../components/ui/BarreraLinguisticaAlert';

/**
 * ExpedientePage — Página de Expediente Clínico del Paciente
 * Compatible con NOM-024-SSA3-2012 y diseño MedIA
 */
=======
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useParams, useNavigate } from 'react-router-dom'
import { pacientesAPI } from '../../api/pacientes'
import { clinicoAPI } from '../../api/clinico'
import { AlertCircle, ChevronLeft, Clock, FileText, Pill, TrendingUp } from 'lucide-react'
import { BarreraLinguisticaAlert } from '../../components/ui/BarreraLinguisticaAlert'
>>>>>>> c0c9496ee01e3b3fb930bcbc601ee25ded0961dc

export default function ExpedientePage() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(null)
  const [encuentros, setEncuentros] = useState([])
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

  // ✅ Función para calcular edad (corregida)
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  // ✅ Datos de demostración
  const generarPacienteDemo = (pacienteId) => ({
    id_paciente: pacienteId,
    numero_expediente: `EXP-2025-${String(14832).padStart(5, '0')}`,
    nombre: "Rosa María",
    primer_apellido: "García",
    segundo_apellido: "Hernández",
    persona: {
      nombre: "Rosa María García Hernández",
      curp: "GAHR860723MDFGRR09",
      fecha_nacimiento: "1986-07-23",
      sexo: "F",
      telefono: "55 1234-5678",
      calle_numero: "Calle Principal #123, Depto 4B",
      id_lengua_materna: null,
      alerta_barrera_linguistica: false,
    },
    grupo_sanguineo: 'O+',
    edad: 47,
    dob: '23/Jul/1986',
    alergias: [
      { nombre: 'Penicilina', severidad: 'alta' },
      { nombre: 'Cefalosporinas', severidad: 'media' },
    ],
    enfermedades_cronicas: [
      'Diabetes Mellitus tipo 2',
      'Hipertensión arterial',
      'Hiperlipidemia',
    ],
    ultima_consulta: '28 May 2025',
    num_consultas: 12,
  })

  const generarEncuentrosDemo = () => [
    {
      id_encuentro: '1',
      fecha_inicio: '2025-05-28',
      hora_inicio: '09:30',
      motivo_consulta: 'Control de diabetes',
      estado: 'finalizado',
      medico: 'Dr. Roberto Morales',
      diagnosticos: ['E11 - Diabetes tipo 2 sin complicaciones'],
      prescripciones: ['Metformina 500mg c/12h', 'Lisinopril 5mg c/24h'],
    },
    {
      id_encuentro: '2',
      fecha_inicio: '2025-04-10',
      hora_inicio: '14:15',
      motivo_consulta: 'Dolor de cabeza',
      estado: 'finalizado',
      medico: 'Dra. Patricia López',
      diagnosticos: ['G43 - Migraña'],
      prescripciones: ['Ibuprofeno 400mg c/8h'],
    },
    {
      id_encuentro: '3',
      fecha_inicio: '2025-06-01',
      hora_inicio: '11:00',
      motivo_consulta: 'Seguimiento de hipertensión',
      estado: 'finalizado',
      medico: 'Dr. Roberto Morales',
      diagnosticos: ['I10 - Hipertensión esencial'],
      prescripciones: ['Captopril 25mg c/8h'],
    },
  ]

  useEffect(() => {
    if (!tieneAcceso || !id) return

    const loadExpediente = async () => {
      try {
        setLoading(true)
        setError(null)

        const pacRes = await pacientesAPI.getPaciente(id)

        if (pacRes.data?.data) {
          setPaciente(pacRes.data.data)
        } else if (pacRes.data) {
          setPaciente(pacRes.data)
        } else {
          throw new Error('No se recibieron datos del paciente')
        }

        try {
          const encRes = await clinicoAPI.getEncuentros({ id_paciente: id, page: 1, limit: 20 })
          if (encRes.data?.data?.items) {
            setEncuentros(encRes.data.data.items)
          } else if (encRes.data?.items) {
            setEncuentros(encRes.data.items)
          } else {
            setEncuentros([])
          }
        } catch (err) {
          console.warn('Encuentros no disponibles, usando datos demo', err)
          setEncuentros(generarEncuentrosDemo())
        }
      } catch (err) {
        console.error('Error cargando expediente:', err)
        setError(err.message)

        if (process.env.NODE_ENV === 'development') {
          setPaciente(generarPacienteDemo(id))
          setEncuentros(generarEncuentrosDemo())
        }
      } finally {
        setLoading(false)
      }
    }

    loadExpediente()
  }, [id, tieneAcceso])

<<<<<<< HEAD
  // ✅ Cargar datos del paciente y expediente (useEffect corregido)
  useEffect(() => {
    if (!tieneAcceso || !id) return;

    const loadExpediente = async () => {
      try {
        setLoading(true);
        setError(null);

        const pacienteId = id;
        console.log('🔍 Cargando expediente para ID:', pacienteId);

        // Cargar paciente
        try {
          const pacRes = await pacientesAPI.getExpediente(pacienteId);
          if (pacRes.data?.data) {
            setPaciente(pacRes.data.data);
          } else if (pacRes.data) {
            setPaciente(pacRes.data);
          } else {
            throw new Error('No se recibieron datos del paciente');
          }
        } catch (pacErr) {
          console.warn('Endpoint de paciente no disponible, usando demo:', pacErr.message);
          if (process.env.NODE_ENV === 'development') {
            setPaciente(generarPacienteDemo(pacienteId));
          } else {
            throw pacErr;
          }
        }

        // Cargar encuentros
        try {
          const encRes = await clinicoAPI.getEncuentros({ id_paciente: pacienteId, page: 1, limit: 20 });
          if (encRes.data?.data?.items) {
            setEncuentros(encRes.data.data.items);
          } else if (encRes.data?.items) {
            setEncuentros(encRes.data.items);
          } else {
            setEncuentros([]);
          }
        } catch (encErr) {
          console.warn("Encuentros no disponibles, usando datos demo:", encErr.message);
          setEncuentros(generarEncuentrosDemo());
        }

      } catch (err) {
        console.error("Error cargando expediente:", err);
        setError(err.message || "Error al cargar el expediente");
      } finally {
        setLoading(false);
      }
    };

    loadExpediente();
  }, [id, tieneAcceso]);

  // Control de acceso
  if (!tieneAcceso) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px" }}>
        <AlertCircle size={48} style={{ color: "#BA2E45", marginBottom: "16px" }} />
        <h2 style={{ color: "#1A1510", fontSize: 18, fontWeight: 600, marginBottom: "8px" }}>Acceso Denegado</h2>
        <p style={{ color: "#5A5048", fontSize: 14 }}>No tienes permisos para ver expedientes clínicos.</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: "24px", padding: "10px 20px", background: "#2459A8", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
=======
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
>>>>>>> c0c9496ee01e3b3fb930bcbc601ee25ded0961dc
          ← Volver
        </button>
      </div>
    )
  }

<<<<<<< HEAD
  // Estado loading
  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontSize: 14, color: "#5A5048" }}>⏳ Cargando expediente...</div>
=======
  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: 14, color: '#5A5048', animation: 'pulse 2s infinite' }}>
          ⏳ Cargando expediente...
        </div>
>>>>>>> c0c9496ee01e3b3fb930bcbc601ee25ded0961dc
      </div>
    )
  }

<<<<<<< HEAD
  // Estado error sin paciente
  if (error && !paciente) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px" }}>
        <AlertCircle size={48} style={{ color: "#BA2E45", marginBottom: "16px" }} />
        <h2 style={{ color: "#1A1510", fontSize: 18, fontWeight: 600, marginBottom: "8px" }}>Error al cargar expediente</h2>
        <p style={{ color: "#5A5048", fontSize: 14, marginBottom: "24px" }}>{error}</p>
        <button onClick={() => navigate(-1)} style={{ padding: "10px 20px", background: "#2459A8", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
=======
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
>>>>>>> c0c9496ee01e3b3fb930bcbc601ee25ded0961dc
          ← Volver
        </button>
      </div>
    )
  }

  if (!paciente) return null

<<<<<<< HEAD
  // ✅ Calcular iniciales (corregido)
  const getInitials = () => {
    const nombre = paciente.persona?.nombre || paciente.nombre || '';
    const apellido = paciente.persona?.primer_apellido || paciente.primer_apellido || '';
    return `${nombre[0] || ''}${apellido[0] || ''}`.toUpperCase() || 'P';
  };

  const initials = getInitials();
  const edad = calcularEdad(paciente.persona?.fecha_nacimiento);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#EDEBE6" }}>
      {/* TopBar */}
      <div style={{ padding: "16px 28px", background: "#FDFAF5", borderBottom: "1px solid #DAD4CC", backdropFilter: "blur(12px)", zIndex: 10, boxShadow: "0 1px 3px rgba(26,21,16,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#2C2620", padding: "4px 8px" }}>
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 style={{ color: "#1A1510", fontSize: 18, fontWeight: 700, margin: 0 }}>Expediente Clínico</h1>
              <p style={{ color: "#5A5048", fontSize: 12, margin: "4px 0 0 0" }}>
                {paciente.numero_expediente} · {paciente.persona?.nombre || `${paciente.nombre || ''} ${paciente.primer_apellido || ''}`}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => navigate(`/pacientes/${id}/antecedentes`)}
              style={{ padding: "8px 16px", background: "transparent", border: "1.5px solid #2459A8", color: "#2459A8", borderRadius: "6px", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
              Ver antecedentes
            </button>
            <button onClick={() => navigate(`/pacientes/${id}/editar`)}
              style={{ padding: "8px 16px", background: "#28a745", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
              Editar Paciente
            </button>
            <button onClick={() => navigate(`/consulta?id_paciente=${paciente.id_paciente}`)}
              style={{ padding: "8px 16px", background: "#2459A8", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
=======
  const initials = (() => {
    const nombre = paciente.persona?.nombre || paciente.nombre || ''
    const apellido = paciente.persona?.primer_apellido || paciente.primer_apellido || ''
    return `${nombre[0] || ''}${apellido[0] || ''}`.toUpperCase() || 'P'
  })()

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#EDEBE6' }}>
      <div style={{
        padding: '16px 28px',
        background: '#FDFAF5',
        borderBottom: '1px solid #DAD4CC',
        backdropFilter: 'blur(12px)',
        zIndex: 10,
        boxShadow: '0 1px 3px rgba(26,21,16,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate(-1)}
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
            <button
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
              📋 Historial
            </button>

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
>>>>>>> c0c9496ee01e3b3fb930bcbc601ee25ded0961dc
              + Nueva Consulta
            </button>
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* Contenido principal */}
      <div style={{ flex: 1, overflowY: "auto", padding: "22px 28px" }}>
        {/* Header del Paciente */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20, padding: "18px 20px", background: "#F5F2EC", border: "1px solid #DAD4CC", borderRadius: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #5B7ABC, #2459A8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: "#1A1510", fontSize: 18, fontWeight: 700, margin: "0 0 8px 0" }}>
              {paciente.persona?.nombre || `${paciente.nombre || ''} ${paciente.primer_apellido || ''} ${paciente.segundo_apellido || ''}`.trim()}
            </h2>
            <div style={{ color: "#2C2620", fontSize: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span>{edad !== null ? `${edad} años` : 'N/A'}</span>
=======
      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px' }}>
        <div style={{
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
          marginBottom: 20,
          padding: '18px 20px',
          background: '#F5F2EC',
          border: '1px solid #DAD4CC',
          borderRadius: 12,
        }}>
          <div style={{
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
          }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#1A1510', fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>
              {paciente.persona?.nombre || `${paciente.nombre} ${paciente.primer_apellido}`}
            </h2>
            <div style={{ color: '#2C2620', fontSize: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span>{paciente.edad} años</span>
>>>>>>> c0c9496ee01e3b3fb930bcbc601ee25ded0961dc
              <span>·</span>
              <span>Nac. {paciente.persona?.fecha_nacimiento || 'N/A'}</span>
              <span>·</span>
<<<<<<< HEAD
              <span style={{ padding: "2px 8px", borderRadius: 4, background: "#F5969C", color: "#BA2E45", fontWeight: 600, fontSize: 11 }}>
                Grupo {paciente.grupo_sanguineo || 'N/A'}
=======
              <span style={{
                padding: '2px 8px',
                borderRadius: 4,
                background: '#F5969C',
                color: '#BA2E45',
                fontWeight: 600,
                fontSize: 11,
              }}>
                Grupo {paciente.grupo_sanguineo}
>>>>>>> c0c9496ee01e3b3fb930bcbc601ee25ded0961dc
              </span>
              <span>·</span>
              <span>📞 {paciente.persona?.telefono || 'N/A'}</span>
            </div>
            <p style={{ color: '#5A5048', fontSize: 10, margin: '6px 0 0 0', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
              CURP: {paciente.persona?.curp || 'N/A'}
            </p>
          </div>
        </div>

        {/* ✅ Alerta de Barrera Lingüística */}
        {paciente?.persona?.alerta_barrera_linguistica && (
          <BarreraLinguisticaAlert paciente={paciente} size="large" />
        )}

        {paciente.alergias && paciente.alergias.length > 0 && (
          <div style={{ marginBottom: 18 }}>
<<<<<<< HEAD
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5A5048", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#BA2E45", color: "#fff", fontSize: 9, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>!</span>
=======
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#5A5048',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{
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
              }}>!</span>
>>>>>>> c0c9496ee01e3b3fb930bcbc601ee25ded0961dc
              Alergias Registradas
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {paciente.alergias.map((alergia, i) => {
                const isHigh = alergia.severidad === 'alta'
                return (
<<<<<<< HEAD
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: isHigh ? "#F5969E" : "#F9E5BA", border: `1.5px solid ${isHigh ? "#BA2E45" : "#B86E12"}`, boxShadow: `0 2px 8px ${isHigh ? "#BA2E4530" : "#B86E1230"}` }}>
                    <span style={{ fontSize: 20 }}>{isHigh ? "🔴" : "🟡"}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isHigh ? "#BA2E45" : "#B86E12" }}>{alergia.nombre}</div>
                      <div style={{ fontSize: 10, color: isHigh ? "#BA2E45" : "#B86E12", marginTop: 1 }}>{isHigh ? "Severidad alta" : "Severidad moderada"}</div>
=======
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: isHigh ? '#F5969E' : '#F9E5BA',
                    border: `1.5px solid ${isHigh ? '#BA2E45' : '#B86E12'}`,
                    boxShadow: `0 2px 8px ${isHigh ? '#BA2E4530' : '#B86E1230'}`,
                  }}>
                    <span style={{ fontSize: 20 }}>{isHigh ? '🔴' : '🟡'}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isHigh ? '#BA2E45' : '#B86E12' }}>
                        {alergia.nombre}
                      </div>
                      <div style={{ fontSize: 10, color: isHigh ? '#BA2E45' : '#B86E12', marginTop: 1 }}>
                        {isHigh ? 'Severidad alta' : 'Severidad moderada'}
                      </div>
>>>>>>> c0c9496ee01e3b3fb930bcbc601ee25ded0961dc
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

<<<<<<< HEAD
        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #DAD4CC", marginBottom: 18, overflowX: "auto" }}>
          {["Antecedentes", "Medicamentos", "Estudios", "Notas", "Encuentros"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: "12px 18px", border: "none", background: "transparent", fontSize: 13, fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? "#2459A8" : "#2C2620", borderBottom: `2px solid ${activeTab === tab ? "#2459A8" : "transparent"}`, cursor: "pointer", whiteSpace: "nowrap" }}>
=======
        <div style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid #DAD4CC',
          marginBottom: 18,
          overflowX: 'auto',
        }}>
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
>>>>>>> c0c9496ee01e3b3fb930bcbc601ee25ded0961dc
              {tab}
            </button>
          ))}
        </div>

<<<<<<< HEAD
        {/* Contenido de pestañas */}
        {activeTab === "Antecedentes" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ padding: 18, background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: "#5A5048", letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 14 }}>Enfermedades Crónicas</h3>
              {paciente.enfermedades_cronicas && paciente.enfermedades_cronicas.length > 0 ? (
=======
        {activeTab === 'Antecedentes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ padding: 18, background: '#FDFAF5', border: '1px solid #DAD4CC', borderRadius: 10 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: '#5A5048', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 14 }}>
                Enfermedades Crónicas
              </h3>
              {paciente.enfermedades_cronicas?.length > 0 ? (
>>>>>>> c0c9496ee01e3b3fb930bcbc601ee25ded0961dc
                paciente.enfermedades_cronicas.map((enfermedad, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8921F', marginTop: 5, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#1A1510', lineHeight: 1.45 }}>{enfermedad}</span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 13, color: '#5A5048', fontStyle: 'italic' }}>Sin enfermedades crónicas registradas</div>
              )}
            </div>

<<<<<<< HEAD
            <div style={{ padding: 18, background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: "#5A5048", letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 14 }}>Resumen Clínico</h3>
              {[
                ["Edad", edad !== null ? `${edad} años` : "N/A"],
                ["Grupo Sanguíneo", paciente.grupo_sanguineo || "N/A"],
                ["Última Consulta", paciente.ultima_consulta || "N/A"],
                ["Total Consultas", paciente.num_consultas || "0"],
                ["Alergias", paciente.alergias?.length ? `${paciente.alergias.length} registrada(s)` : "Ninguna"],
                ["🌐 Lengua Materna", paciente.persona?.id_lengua_materna ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                    {paciente.persona?.alerta_barrera_linguistica && (
                      <span style={{ background: '#E8921F', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>ALERTA</span>
                    )}
                    <span>ID: {paciente.persona.id_lengua_materna}</span>
                  </span>
                ) : "No especificada"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #DAD4CC" }}>
                  <span style={{ fontSize: 12, color: "#5A5048" }}>{label}</span>
                  <span style={{ fontSize: 12, color: "#1A1510", fontWeight: 500 }}>{value}</span>
=======
            <div style={{ padding: 18, background: '#FDFAF5', border: '1px solid #DAD4CC', borderRadius: 10 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: '#5A5048', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 14 }}>
                Resumen Clínico
              </h3>
              {[
                ['Grupo Sanguíneo', paciente.grupo_sanguineo || 'N/A'],
                ['Última Consulta', paciente.ultima_consulta || 'N/A'],
                ['Total Consultas', paciente.num_consultas || '0'],
                ['Alergias', paciente.alergias?.length ? `${paciente.alergias.length} registrada(s)` : 'Ninguna'],
                ['🌐 Lengua Materna', paciente.persona?.id_lengua_materna ? `ID: ${paciente.persona.id_lengua_materna}` : 'No especificada'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#5A5048' }}>{label}</span>
                  <span style={{ fontSize: 12, color: '#1A1510', fontWeight: 500 }}>{value}</span>
>>>>>>> c0c9496ee01e3b3fb930bcbc601ee25ded0961dc
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Medicamentos' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#5A5048', fontSize: 13 }}>
            <Pill size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            📁 Sección <strong>{activeTab}</strong> — próximamente
          </div>
        )}

        {activeTab === 'Estudios' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#5A5048', fontSize: 13 }}>
            <TrendingUp size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            📁 Sección <strong>{activeTab}</strong> — próximamente
          </div>
        )}

        {activeTab === 'Notas' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#5A5048', fontSize: 13 }}>
            <FileText size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            📁 Sección <strong>{activeTab}</strong> — próximamente
          </div>
        )}

        {activeTab === 'Encuentros' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {encuentros?.length > 0 ? (
              encuentros.map((encuentro) => (
<<<<<<< HEAD
                <div key={encuentro.id_encuentro}
                  style={{ padding: 16, background: "#FDFAF5", border: "1px solid #DAD4CC", borderRadius: 10, cursor: "pointer", transition: "all 0.2s" }}
                  onClick={() => setExpandedEncuentro(expandedEncuentro === encuentro.id_encuentro ? null : encuentro.id_encuentro)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h4 style={{ color: "#1A1510", fontSize: 13, fontWeight: 600, margin: "0 0 6px 0" }}>{encuentro.motivo_consulta}</h4>
                      <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#5A5048" }}>
=======
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ color: '#1A1510', fontSize: 13, fontWeight: 600, margin: '0 0 6px 0' }}>
                        {encuentro.motivo_consulta}
                      </h4>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#5A5048' }}>
>>>>>>> c0c9496ee01e3b3fb930bcbc601ee25ded0961dc
                        <span>📅 {encuentro.fecha_inicio}</span>
                        <span>🕐 {encuentro.hora_inicio}</span>
                        <span>👨‍⚕️ {encuentro.medico}</span>
                      </div>
                    </div>
<<<<<<< HEAD
                    <span style={{ display: "inline-block", padding: "4px 10px", background: "#E8F5E9", color: "#237A4B", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>✓ {encuentro.estado}</span>
=======
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      background: '#E8F5E9',
                      color: '#237A4B',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      ✓ {encuentro.estado}
                    </span>
>>>>>>> c0c9496ee01e3b3fb930bcbc601ee25ded0961dc
                  </div>
                  {expandedEncuentro === encuentro.id_encuentro && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #DAD4CC' }}>
                      {encuentro.diagnosticos?.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
<<<<<<< HEAD
                          <p style={{ color: "#5A5048", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>Diagnósticos</p>
                          {encuentro.diagnosticos.map((dx, i) => <p key={i} style={{ fontSize: 12, color: "#1A1510", margin: "4px 0" }}>• {dx}</p>)}
=======
                          <p style={{ color: '#5A5048', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
                            Diagnósticos
                          </p>
                          {encuentro.diagnosticos.map((dx, i) => (
                            <p key={i} style={{ fontSize: 12, color: '#1A1510', margin: '4px 0' }}>
                              • {dx}
                            </p>
                          ))}
>>>>>>> c0c9496ee01e3b3fb930bcbc601ee25ded0961dc
                        </div>
                      )}
                      {encuentro.prescripciones?.length > 0 && (
                        <div>
<<<<<<< HEAD
                          <p style={{ color: "#5A5048", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>Prescripciones</p>
                          {encuentro.prescripciones.map((rx, i) => <p key={i} style={{ fontSize: 12, color: "#1A1510", margin: "4px 0" }}>• {rx}</p>)}
=======
                          <p style={{ color: '#5A5048', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
                            Prescripciones
                          </p>
                          {encuentro.prescripciones.map((rx, i) => (
                            <p key={i} style={{ fontSize: 12, color: '#1A1510', margin: '4px 0' }}>
                              • {rx}
                            </p>
                          ))}
>>>>>>> c0c9496ee01e3b3fb930bcbc601ee25ded0961dc
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
<<<<<<< HEAD
  );
} 
=======
  )
}
>>>>>>> c0c9496ee01e3b3fb930bcbc601ee25ded0961dc
