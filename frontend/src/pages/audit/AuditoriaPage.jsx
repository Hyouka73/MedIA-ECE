import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../../api/client';

const AuditoriaPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, criticos: 0, documentos: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    id_usuario: '', tipo_evento: '', nivel_severidad: '', fecha_desde: '', fecha_hasta: ''
  });

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/auditoria/stats');
      setStats(res.data);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/auditoria', {
        params: { page, limit: 10, ...filters }
      });
      setLogs(res.data.results || []);
    } catch (error) {
      console.error("Error cargando logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchLogs(); }, [page, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'CRÍTICO': return 'bg-red-100 text-[#DC2626] border-[#DC2626]';
      case 'ALTO': return 'bg-orange-100 text-[#EA580C] border-[#EA580C]';
      default: return 'bg-blue-100 text-[#2563EB] border-[#2563EB]';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1B4F8A]">Auditoría de Sistema</h1>
        <span className="px-3 py-1 text-[10px] font-bold border border-gray-300 rounded-full text-gray-500 uppercase tracking-widest">
          NOM-151 / Trazabilidad
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-center mb-1 text-gray-500 text-xs font-medium">
            <span>Total Accesos</span> <Activity size={16} />
          </div>
          <div className="text-2xl font-bold">{stats.total || 0}</div>
        </div>
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-center mb-1 text-gray-500 text-xs font-medium">
            <span>Críticos</span> <ShieldAlert size={16} className="text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.criticos || 0}</div>
        </div>
        <div className="p-4 border rounded-lg bg-white shadow-sm border-l-4 border-l-[#1B4F8A]">
          <div className="flex justify-between items-center mb-1 text-gray-500 text-xs font-medium">
            <span>Docs SHA-256</span> <FileText size={16} />
          </div>
          <div className="text-2xl font-bold">{stats.documentos || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-gray-50 p-4 rounded-lg border">
        {['id_usuario', 'tipo_evento', 'nivel_severidad', 'fecha_desde', 'fecha_hasta'].map((f) => (
            <div key={f} className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-gray-400 uppercase">{f.replace('_', ' ')}</label>
                {f.includes('fecha') ? (
                    <input name={f} type="date" onChange={handleFilterChange} className="p-2 border rounded text-xs" />
                ) : f === 'nivel_severidad' ? (
                    <select name={f} onChange={handleFilterChange} className="p-2 border rounded text-xs">
                        <option value="">TODAS</option>
                        <option value="INFO">INFO</option>
                        <option value="ALTO">ALTO</option>
                        <option value="CRÍTICO">CRÍTICO</option>
                    </select>
                ) : (
                    <input name={f} type="text" placeholder="..." onChange={handleFilterChange} className="p-2 border rounded text-xs" />
                )}
            </div>
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b text-[10px] font-bold text-gray-600 uppercase">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Usuario</th>
              <th className="p-3">Evento</th>
              <th className="p-3">Severidad</th>
              <th className="p-3">Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
                <tr><td colSpan="5" className="p-10 text-center animate-pulse text-gray-400">Sincronizando logs...</td></tr>
            ) : logs.map((log, i) => (
              <tr key={i} className="text-xs hover:bg-gray-50 transition-colors">
                <td className="p-3 font-mono text-gray-500">{new Date(log.fecha_hora).toLocaleString()}</td>
                <td className="p-3 font-medium">{log.usuario_nombre}</td>
                <td className="p-3 uppercase font-bold text-[#1B4F8A] text-[10px]">{log.tipo_evento}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 border rounded-[4px] font-black text-[9px] ${getSeverityClass(log.nivel_severidad)}`}>
                    {log.nivel_severidad}
                  </span>
                </td>
                <td className="p-3 font-mono text-[9px] text-gray-300 truncate max-w-[100px]">{log.hash_sha256}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditoriaPage;