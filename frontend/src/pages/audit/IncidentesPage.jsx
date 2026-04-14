import React from 'react';
import { AlertCircle, Clock, CheckCircle2, ShieldX } from 'lucide-react';

const IncidentesPage = () => {
  return (
    <div className="p-6 bg-white">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Gestión de Incidentes</h1>
      
      <div className="space-y-4">
        {/* Card Nativa */}
        <div className="border-l-4 border-l-[#DC2626] border border-gray-200 rounded-r-lg p-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Intento de Inyección SQL</h3>
              <p className="text-xs text-gray-500 font-mono italic underline">ID: INC-9923 | Nivel: CRÍTICO</p>
            </div>
            <span className="flex items-center gap-1 bg-red-100 text-red-800 text-[10px] font-bold px-2 py-1 rounded">
              <ShieldX size={12} /> ABIERTO
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Se detectaron caracteres maliciosos en el endpoint /prescripciones. IP: 189.240.x.x</p>
          <div className="flex justify-end gap-2 border-t pt-3">
            <button className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              Ver Detalles
            </button>
            <button className="px-3 py-1.5 text-xs font-medium bg-[#1B4F8A] text-white rounded hover:opacity-90 transition-colors">
              Atender Incidente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentesPage;