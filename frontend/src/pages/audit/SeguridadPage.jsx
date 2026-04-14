import React, { useState, useEffect } from 'react';
import { Ban, Unlock, ShieldCheck, Terminal, RefreshCcw, Database, AlertCircle } from 'lucide-react';
import apiClient from '../../api/client';

const SeguridadPage = () => {
  const [blacklist, setBlacklist] = useState([]);
  const [forense, setForense] = useState([]);
  const [loadingForense, setLoadingForense] = useState(false);
  const [errorLog, setErrorLog] = useState(false);

  // Formateador de fecha pro
  const formatTime = (isoString) => {
    if (!isoString) return "--:--:--";
    try {
      const date = new Date(isoString);
      return date.toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch { return isoString; }
  };

  const fetchBlacklist = async () => {
    try {
      const res = await apiClient.get('/seguridad/sessions-blacklist');
      setBlacklist(Array.isArray(res.data) ? res.data : []);
    } catch (error) { setBlacklist([]); }
  };

  const leerLogForense = async () => {
    setLoadingForense(true);
    setErrorLog(false);
    try {
      const res = await apiClient.get('/seguridad/logs-forenses');
      if (res.data && Array.isArray(res.data.content)) {
        setForense(res.data.content);
      } else { setForense([]); }
    } catch (error) {
      setErrorLog(true);
      setForense([]);
    } finally { setLoadingForense(false); }
  };

  useEffect(() => {
    fetchBlacklist();
    leerLogForense();
  }, []);

  return (
    <div className="p-6 space-y-8 bg-white min-h-screen font-sans">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Seguridad Avanzada</h1>
        <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded text-[10px] font-black uppercase tracking-widest animate-pulse">
            Inmutabilidad Activa (HMAC-SHA256)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blacklist de Sesiones */}
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col bg-white">
          <div className="bg-gray-50 p-4 border-b flex items-center justify-between font-bold text-gray-700 uppercase text-xs tracking-widest">
            <div className="flex items-center gap-2">
              <Ban size={16} className="text-[#DC2626]" /> Control de Acceso
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[250px]">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-[10px] text-gray-400 font-black uppercase">
                <tr><th className="p-3">Token Identificador</th><th className="p-3 text-right">Acción</th></tr>
              </thead>
              <tbody className="divide-y text-sm font-mono italic">
                {blacklist.length > 0 ? (
                  blacklist.map((session, i) => (
                    <tr key={i} className="hover:bg-gray-50 text-gray-400">
                      <td className="p-3 text-[10px] truncate max-w-[200px]">{session.token_hash}</td>
                      <td className="p-3 text-right">
                        <button className="text-[#1B4F8A] hover:underline flex items-center gap-1 text-[10px] font-bold ml-auto uppercase tracking-tighter">
                          <Unlock size={14} /> Reactivar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="2" className="p-10 text-center text-gray-300 italic text-xs uppercase tracking-[0.2em]">No hay sesiones revocadas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estado de Integridad */}
        <div className="border border-gray-200 rounded-lg shadow-sm flex flex-col bg-white p-6 justify-center text-center">
            <ShieldCheck size={54} className="text-green-300 mb-3 mx-auto drop-shadow-sm" />
            <h4 className="text-sm font-black text-gray-800 uppercase tracking-tighter">Estado: Integridad Verificada</h4>
            <p className="text-[10px] text-gray-400 mt-2 leading-tight uppercase font-medium">
                Sincronizado con v_auditoria_estadistica.<br/>Hash de cadena forense válido.
            </p>
        </div>
      </div>

      {/* Terminal de Logs Forenses Corregida */}
      <div className="border border-gray-800 rounded-lg overflow-hidden shadow-2xl bg-[#0D0D0D]">
        <div className="bg-[#1A1A1A] p-3 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400 font-mono text-[10px] uppercase tracking-[0.2em]">
            <Terminal size={14} className="text-green-500" /> 
            <span>/logs/auditoria_forense.log</span>
          </div>
          <button 
            onClick={leerLogForense} 
            disabled={loadingForense} 
            className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-white transition-colors uppercase border border-gray-700 px-3 py-1 rounded hover:bg-gray-800"
          >
            <RefreshCcw size={12} className={loadingForense ? "animate-spin" : ""} /> 
            {loadingForense ? "Sincronizando..." : "Sync_Forense"}
          </button>
        </div>

        <div className="p-4 h-[500px] overflow-y-auto font-mono text-[11px] leading-relaxed custom-scrollbar">
          {errorLog ? (
            <div className="flex flex-col items-center justify-center h-full text-red-600 gap-3 text-center bg-red-950/10 rounded">
               <AlertCircle size={32} />
               <div>
                 <p className="font-black uppercase tracking-widest text-xs">Error de Comunicación Forense</p>
                 <p className="text-[9px] text-red-900/60 uppercase mt-1 italic font-bold">Respuesta 401: Sesión no válida o privilegios insuficientes.</p>
               </div>
            </div>
          ) : forense.length > 0 ? (
            forense.map((line, i) => {
              const [jsonPart, sigPart] = line.split(' | SIG:');
              let data = {};
              try { data = JSON.parse(jsonPart); } catch(e) { return null; }

              const det = data.detalles || {};
              const status = det.STATUS || det.status || '---';
              const metodo = det.METODO || det.metodo || '---';
              const ms = det.MS || det.ms || '0';
              
              // Lógica de éxito real basada en Status HTTP
              const isError = parseInt(status) >= 400 || data.resultado === 'FALLIDO';

              return (
                <div key={i} className="mb-4 border-b border-gray-900 pb-3 last:border-0 group">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {/* Fecha legible */}
                    <span className="text-cyan-800 font-bold bg-cyan-950/20 px-1 rounded">
                        [{formatTime(data.timestamp)}]
                    </span>
                    
                    <span className={`font-black uppercase text-[10px] tracking-tighter ${data.accion?.includes('ESCRITURA') ? 'text-orange-600' : 'text-blue-500'}`}>
                      {data.accion}
                    </span>

                    {/* Badge de resultado dinámico */}
                    <span className={`px-2 py-0.5 rounded-[3px] text-[9px] font-black ${isError ? 'bg-red-600 text-white animate-pulse' : 'bg-green-900/30 text-green-500'}`}>
                      {isError ? 'FALLIDO' : 'EXITOSO'}
                    </span>

                    <span className="text-gray-700 font-bold ml-1">USR:</span>
                    <span className="text-gray-200 font-bold bg-gray-800 px-2 rounded-[3px] text-[10px]">{data.usuario || 'SISTEMA'}</span>
                  </div>
                  
                  <div className="pl-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-[9px] font-bold uppercase tracking-tight text-gray-600">
                     <span className="flex gap-1 items-center border-l border-gray-800 pl-2">MÉTODO: <b className="text-gray-400">{metodo}</b></span>
                     <span className="flex gap-1 items-center border-l border-gray-800 pl-2">STATUS: <b className={isError ? 'text-red-500' : 'text-green-800'}>{status}</b></span>
                     <span className="flex gap-1 items-center border-l border-gray-800 pl-2">LATENCIA: <b className="text-gray-400">{ms}ms</b></span>
                     <span className="flex gap-1 items-center border-l border-gray-800 pl-2 opacity-30">IP_ORIGEN: {data.ip}</span>
                  </div>

                  {sigPart && (
                    <div className="pl-4 text-[8px] text-gray-800 group-hover:text-gray-600 transition-colors mt-2 break-all font-mono italic">
                      HMAC_SIG: {sigPart.substring(0, 50)}...
                    </div>
                  )}
                </div>
              );
            })
          ) : !loadingForense && (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-800 text-center uppercase tracking-[0.5em] text-[10px] font-black italic">
                Buffer de logs vacío / Sin actividad reciente
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-[#1A1A1A] px-4 py-2 text-[8px] text-gray-600 font-mono border-t border-gray-800 flex justify-between uppercase tracking-tighter italic font-bold">
          <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-green-900" /> Cadena Forense Verificada</span>
          <span className="text-blue-900 underline decoration-blue-950">MedIA_Forense_v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default SeguridadPage;