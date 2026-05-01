import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { pacientesAPI } from '../../api/pacientes';
import { AlertCircle, Plus, FileText, Languages } from 'lucide-react';
import { canAccess } from '../../utils/permissions';

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
        
        const responseData = response.data;
        
        if (responseData && responseData.data) {
          setPacientes(responseData.data.items || []);
          setTotalPages(responseData.data.pages || 1);
        } else {
          // Si no hay datos, usar demo
          setPacientes(generarPacientesDemo());
          setTotalPages(1);
        }
        
      } catch (err) {
        console.error("Error cargando pacientes:", err);
        setError(err.message);
        // Usar datos demo como fallback
        setPacientes(generarPacientesDemo());
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    loadPacientes();
  }, [page, searchQuery, tieneAcceso]);

  // Datos de demostración
  const generarPacientesDemo = () => [
    {
      id_paciente: 1,
      nombre: "García Hernández, Rosa M.",
      edad: 47,
      grupo_sanguineo: "O+",
      telefono: "55 1234-5678",
      ultimaConsulta: "28 May 2025",
      alergias: [
        { nombre: "Penicilina", severidad: "alta" },
        { nombre: "Cefalosporinas", severidad: "media" },
      ],
    },
    {
      id_paciente: 2,
      nombre: "Martínez López, Juan C.",
      edad: 32,
      grupo_sanguineo: "A+",
      telefono: "55 9876-5432",
      ultimaConsulta: "10 Abr 2025",
      alergias: [],
    },
    {
      id_paciente: 3,
      nombre: "Ramos Torres, Elena",
      edad: 65,
      grupo_sanguineo: "B+",
      telefono: "55 5566-7788",
      ultimaConsulta: "01 Jun 2025",
      alergias: [
        { nombre: "AINEs", severidad: "media" },
        { nombre: "Aspirina", severidad: "media" },
      ],
    },
    {
      id_paciente: 4,
      nombre: "Jiménez Soto, Pedro A.",
      edad: 28,
      grupo_sanguineo: "AB−",
      telefono: "55 3344-2211",
      ultimaConsulta: "03 Jun 2025",
      alergias: [],
    },
    {
      id_paciente: 5,
      nombre: "Vázquez Cruz, María F.",
      edad: 53,
      grupo_sanguineo: "O−",
      telefono: "55 6677-8899",
      ultimaConsulta: "25 May 2025",
      alergias: [{ nombre: "Latex", severidad: "alta" }],
    },
    {
      id_paciente: 6,
      nombre: "Pérez Domínguez, Luis A.",
      edad: 61,
      grupo_sanguineo: "B−",
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Pacientes</h2>
          <p className="text-text-secondary mt-1">
            {pacientesFiltrados.length} de {pacientes.length} pacientes
          </p>
        </div>
        
        {canAccess(user.permisos, 'PACIENTES', 'puede_crear') && (
          <button 
            onClick={() => navigate('/pacientes/nuevo')}
            className="w-full sm:w-auto px-4 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Nuevo Paciente
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 lg:w-1/3">
          <select
            value={filterAlergias}
            onChange={(e) => {
              setFilterAlergias(e.target.value);
              setPage(1);
            }}
            className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="todos">Todas las alergias</option>
            <option value="con_alergias">Con alergias</option>
            <option value="sin_alergias">Sin alergias</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-text-secondary flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Cargando pacientes...</p>
          </div>
        ) : error && pacientes.length === 0 ? (
          <div className="p-8 bg-semantic-error/5 border-l-4 border-semantic-error text-semantic-error m-4 rounded-r-lg">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertCircle size={18} />
              <span>Error de carga</span>
            </div>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4 grayscale opacity-20">📂</div>
            <p className="font-bold text-text-primary">No se encontraron pacientes</p>
            <p className="text-sm text-text-secondary mt-2">
              {searchQuery ? "Intenta con otro término de búsqueda" : "Aún no hay pacientes registrados en el sistema."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F7F4] border-b border-border">
                  <th className="px-6 py-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest">Paciente</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest hidden md:table-cell">Edad</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest hidden sm:table-cell">Grupo</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest">Alergias</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest hidden lg:table-cell">Última Consulta</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-secondary uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {pacientesFiltrados.map((paciente) => {
                  const tieneAlergias = paciente.alergias && paciente.alergias.length > 0;
                  const alergiaAlta = tieneAlergias && paciente.alergias.some((a) => a.severidad === "alta" || a.severidad === "critica");

                  return (
                    <tr key={paciente.id_paciente} className="hover:bg-[#FDFAF5] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-text-primary group-hover:text-primary transition-colors">{paciente.nombre}</div>
                        <div className="text-[10px] text-text-secondary mt-0.5 md:hidden">
                          {paciente.edad} años · {paciente.grupo_sanguineo || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary hidden md:table-cell">{paciente.edad} años</td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="px-2 py-0.5 bg-black/5 text-text-primary rounded text-[10px] font-bold">
                          {paciente.grupo_sanguineo || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {tieneAlergias ? (
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold ${
                            alergiaAlta ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            <span className="text-xs">{alergiaAlta ? "🔴" : "🟡"}</span>
                            {paciente.alergias.length}
                          </span>
                        ) : (
                          <span className="text-[10px] text-text-secondary font-medium italic opacity-50">Ninguna</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[12px] text-text-secondary hidden lg:table-cell">
                        {paciente.ultimaConsulta || 'Sin registros'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {canAccess(user.permisos, 'EXPEDIENTE', 'puede_leer') && (
                            <button 
                              onClick={() => navigate(`/expediente/${paciente.id_paciente}`)}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="Ver Expediente"
                            >
                              <FileText size={18} />
                            </button>
                          )}
                          {['MEDICO_GENERAL', 'ESPECIALISTA', 'SUPERADMIN', 'OMNIADMIN'].includes(user.rol) && (
                            <button 
                              onClick={() => navigate(`/consulta/nueva?id_paciente=${paciente.id_paciente}`)}
                              className="px-3 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg hover:bg-primary-hover shadow-sm transition-all"
                            >
                              Consulta
                            </button>
                          )}
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