import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { pacientesAPI } from '../../api/pacientes';
import { AlertCircle, Plus } from 'lucide-react';

/**
 * PacientesListPage — Página de Listado de Pacientes
 * Interfaz compatible con Tailwind CSS y arquitectura MedIA
 */

export default function PacientesListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAlergias, setFilterAlergias] = useState("todos");

  // Roles permitidos
  const rolesPermitidos = [
    "MEDICO_GENERAL",
    "ESPECIALISTA",
    "ENFERMERIA",
    "RECEPCIONISTA",
    "ADMINISTRADOR",
    "SUPERADMIN",
    "OMNIADMIN",
  ];

  const tieneAcceso = user && rolesPermitidos.includes(user.rol);

  // Cargar pacientes
  useEffect(() => {
    if (!tieneAcceso) return;

    const loadPacientes = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page: page,
          limit: 10,
          search: searchQuery || undefined,
        };

        const response = await pacientesAPI.getPacientes(params);
        setPacientes(response.data?.items || generarPacientesDemo());
        setTotalPages(response.data?.pages || 1);
      } catch (err) {
        console.error("Error cargando pacientes:", err);
        setError(err.message);
        // Usar datos demo como fallback
        setPacientes(generarPacientesDemo());
      } finally {
        setLoading(false);
      }
    };

    loadPacientes();
  }, [page, searchQuery, tieneAcceso]);

  // Datos de demostración
  const generarPacientesDemo = () => [
    {
      id: 1,
      nombre: "García Hernández, Rosa M.",
      edad: 47,
      tipoSangre: "O+",
      telefono: "55 1234-5678",
      ultimaConsulta: "28 May 2025",
      alergias: [
        { nombre: "Penicilina", severidad: "alta" },
        { nombre: "Cefalosporinas", severidad: "media" },
      ],
    },
    {
      id: 2,
      nombre: "Martínez López, Juan C.",
      edad: 32,
      tipoSangre: "A+",
      telefono: "55 9876-5432",
      ultimaConsulta: "10 Abr 2025",
      alergias: [],
    },
    {
      id: 3,
      nombre: "Ramos Torres, Elena",
      edad: 65,
      tipoSangre: "B+",
      telefono: "55 5566-7788",
      ultimaConsulta: "01 Jun 2025",
      alergias: [
        { nombre: "AINEs", severidad: "media" },
        { nombre: "Aspirina", severidad: "media" },
      ],
    },
    {
      id: 4,
      nombre: "Jiménez Soto, Pedro A.",
      edad: 28,
      tipoSangre: "AB−",
      telefono: "55 3344-2211",
      ultimaConsulta: "03 Jun 2025",
      alergias: [],
    },
    {
      id: 5,
      nombre: "Vázquez Cruz, María F.",
      edad: 53,
      tipoSangre: "O−",
      telefono: "55 6677-8899",
      ultimaConsulta: "25 May 2025",
      alergias: [{ nombre: "Latex", severidad: "alta" }],
    },
    {
      id: 6,
      nombre: "Pérez Domínguez, Luis A.",
      edad: 61,
      tipoSangre: "B−",
      telefono: "55 8899-0011",
      ultimaConsulta: "20 May 2025",
      alergias: [{ nombre: "Sulfas", severidad: "media" }],
    },
  ];

  // Filtrar pacientes
  const pacientesFiltrados = pacientes.filter((p) => {
    const matchBusqueda =
      !searchQuery ||
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.telefono && p.telefono.includes(searchQuery));

    const matchAlergias =
      filterAlergias === "todos" ||
      (filterAlergias === "con_alergias" && p.alergias?.length > 0) ||
      (filterAlergias === "sin_alergias" && (!p.alergias || p.alergias.length === 0));

    return matchBusqueda && matchAlergias;
  });

  // Control de acceso
  if (!user || !tieneAcceso) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-semantic-error">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="font-bold">No tienes permisos para acceder a esta página</p>
          <p className="text-sm text-text-secondary mt-2">Rol actual: {user?.rol || 'DESCONOCIDO'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
      {/* Encabezado */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Pacientes</h2>
        <p className="text-text-secondary mt-1">
          {pacientesFiltrados.length} de {pacientes.length} pacientes
        </p>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={filterAlergias}
          onChange={(e) => {
            setFilterAlergias(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="todos">Todos los pacientes</option>
          <option value="con_alergias">Con alergias</option>
          <option value="sin_alergias">Sin alergias</option>
        </select>

        <button 
          onClick={() => navigate('/pacientes/nuevo')}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Nuevo Paciente
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-text-secondary">
            ⏳ Cargando pacientes...
          </div>
        ) : error ? (
          <div className="p-4 bg-semantic-error/10 border border-semantic-error text-semantic-error rounded-lg m-4">
            ❌ {error}
          </div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-bold text-text-primary">No se encontraron pacientes</p>
            <p className="text-sm text-text-secondary mt-2">
              {searchQuery ? "Intenta con otro término de búsqueda" : "Crea un nuevo paciente para comenzar"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Edad</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Grupo Sangre</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Alergias</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Última Consulta</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pacientesFiltrados.map((paciente) => {
                  const tieneAlergias = paciente.alergias && paciente.alergias.length > 0;
                  const alergiaAlta = tieneAlergias && paciente.alergias.some((a) => a.severidad === "alta");

                  return (
                    <tr key={paciente.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-text-primary">{paciente.nombre}</td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{paciente.edad} años</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">
                          {paciente.tipoSangre}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">📱 {paciente.telefono}</td>
                      <td className="px-6 py-4 text-sm">
                        {tieneAlergias ? (
                          <div className="flex items-center gap-2">
                            <span className={alergiaAlta ? "text-semantic-error" : "text-semantic-warning"}>
                              {alergiaAlta ? "🔴" : "🟡"}
                            </span>
                            <span className={alergiaAlta ? "text-semantic-error" : "text-semantic-warning"}>
                              {paciente.alergias.length} {paciente.alergias.length === 1 ? "alergia" : "alergias"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-secondary text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{paciente.ultimaConsulta}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => navigate(`/expediente/${paciente.id}`)}
                            className="px-3 py-1 text-xs bg-secondary text-text-primary rounded hover:bg-secondary/80 transition-colors"
                          >
                            📋 Ver
                          </button>
                          <button 
                            onClick={() => navigate(`/consulta?id_paciente=${paciente.id}`)}
                            className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                          >
                            + Consulta
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 border border-border rounded-lg hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Anterior
          </button>
          <div className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-semibold">
            {page} / {totalPages}
          </div>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border border-border rounded-lg hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
