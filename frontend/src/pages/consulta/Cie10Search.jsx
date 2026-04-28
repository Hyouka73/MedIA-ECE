// Cie10Search.jsx
// Componente reutilizable de búsqueda CIE-10 con debounce, selección y eliminación.
// Props:
//   onSelect(item)   — callback cuando se agrega un diagnóstico
//   onRemove(id)     — callback cuando se elimina un diagnóstico
//   seleccionados    — array de diagnósticos ya seleccionados [{id, codigo, descripcion, tipo}]

import React, { useState, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';

export default function Cie10Search({ onSelect, onRemove, seleccionados = [] }) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setResultados([]);
      return;
    }

    const buscarCie10 = async () => {
      setCargando(true);
      try {
        const resp = await fetch(`/api/catalogos/cie10?q=${encodeURIComponent(query)}`);
        const data = await resp.json();
        setResultados(data.slice(0, 10));
      } catch (err) {
        console.error('Error en catálogo CIE10', err);
        setResultados([]);
      } finally {
        setCargando(false);
      }
    };

    const timeoutId = setTimeout(buscarCie10, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (item) => {
    if (seleccionados.some((d) => d.id === item.id)) return;
    if (seleccionados.length >= 5) return;
    onSelect(item);
    setQuery('');
    setResultados([]);
  };

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 border border-[#DAD4CC] rounded-lg focus:ring-2 focus:ring-[#1B4F8A] outline-none text-sm"
          placeholder="Buscar diagnóstico (ej: E11 o Diabetes)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={seleccionados.length >= 5}
        />
        {cargando && (
          <span className="absolute right-3 top-2.5 text-xs text-gray-400">Buscando...</span>
        )}

        {resultados.length > 0 && (
          <div className="absolute z-20 w-full bg-white border border-[#DAD4CC] rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto">
            {resultados.map((item) => {
              const yaSeleccionado = seleccionados.some((d) => d.id === item.id);
              return (
                <div
                  key={item.id}
                  className={`p-3 flex justify-between items-center border-b last:border-0 transition-colors
                    ${yaSeleccionado
                      ? 'bg-gray-50 cursor-not-allowed opacity-60'
                      : 'hover:bg-blue-50 cursor-pointer'
                    }`}
                  onClick={() => !yaSeleccionado && handleSelect(item)}
                >
                  <div>
                    <span className="font-bold text-[#1B4F8A] text-sm">{item.codigo}</span>
                    <p className="text-sm text-gray-600">{item.descripcion}</p>
                  </div>
                  {yaSeleccionado
                    ? <span className="text-xs text-gray-400">Agregado</span>
                    : <Plus size={16} className="text-gray-400 flex-shrink-0" />
                  }
                </div>
              );
            })}
          </div>
        )}
      </div>

      {seleccionados.length >= 5 && (
        <p className="text-xs text-amber-600 font-medium">
          ⚠ Máximo 5 diagnósticos por encuentro
        </p>
      )}

      {seleccionados.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {seleccionados.map((diag, index) => (
            <div
              key={diag.id}
              className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-2 group"
            >
              <span className="text-xs font-black bg-[#1B4F8A] text-white px-1.5 py-0.5 rounded">
                {diag.codigo}
              </span>
              <span className="text-xs text-blue-900 font-medium max-w-[200px] truncate">
                {diag.descripcion}
              </span>
              {index === 0 && (
                <span className="text-[10px] font-bold text-blue-600 uppercase">(Principal)</span>
              )}
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(diag.id)}
                  className="text-blue-300 hover:text-red-500 transition-colors ml-1"
                  aria-label={`Eliminar diagnóstico ${diag.codigo}`}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {seleccionados.length === 0 && (
        <p className="text-xs text-gray-400 italic">
          Busca y agrega hasta 5 diagnósticos. El primero será marcado como Principal.
        </p>
      )}
    </div>
  );
}