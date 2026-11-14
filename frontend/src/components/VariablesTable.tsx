import React, { useState } from 'react';
import type { VariableResult } from '../types';
import { Table, Search, Download } from 'lucide-react';

interface VariablesTableProps {
  variables: VariableResult[];
  filename: string;
}

export const VariablesTable: React.FC<VariablesTableProps> = ({ variables, filename }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(variables.map((v) => v.category)))];

  const filtered = variables.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || v.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const exportCSV = () => {
    const headers = ['Variable', 'Clave', 'Valor', 'Unidad', 'Estado', 'Categoría', 'Descripción'];
    const rows = filtered.map((v) => [
      `"${v.name}"`,
      `"${v.key}"`,
      `"${v.value}"`,
      `"${v.unit || ''}"`,
      `"${v.status}"`,
      `"${v.category}"`,
      `"${v.description || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `variables_${filename}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Tabla Completa de Variables Extraídas
          </h3>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            {filtered.length} variables
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Input de Búsqueda */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar variable o clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filtro de Categoría */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg py-1.5 px-2.5 focus:outline-none focus:border-cyan-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'Todas las Categorías' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Botón Exportar */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
            title="Exportar variables a CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Contenedor de la tabla */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 text-[10px]">
            <tr>
              <th className="py-3 px-4">Variable</th>
              <th className="py-3 px-4">Clave en Python</th>
              <th className="py-3 px-4">Valor Calculado</th>
              <th className="py-3 px-4">Categoría</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Descripción del Algoritmo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filtered.map((item) => (
              <tr key={item.key} className="hover:bg-slate-850/50 transition">
                <td className="py-3 px-4 font-medium text-white">{item.name}</td>
                <td className="py-3 px-4 font-mono text-cyan-400 text-[11px]">{item.key}</td>
                <td className="py-3 px-4 font-mono font-semibold text-slate-100">
                  {item.value} {item.unit && <span className="text-[10px] text-slate-400 font-normal">{item.unit}</span>}
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 text-[10px]">
                    {item.category}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
                      item.status === 'critical'
                        ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                        : item.status === 'warning'
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                        : item.status === 'info'
                        ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40'
                        : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                    }`}
                  >
                    {item.status.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate" title={item.description}>
                  {item.description || 'Calculado directamente desde el tensor TIFF'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
