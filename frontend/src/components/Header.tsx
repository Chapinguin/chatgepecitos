import React from 'react';
import { RefreshCw, Sparkles, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  onRefreshCSV: () => void;
  isLoading: boolean;
  lastUpdated: string;
}

export const Header: React.FC<HeaderProps> = ({
  onRefreshCSV,
  isLoading,
  lastUpdated,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Chatgepecitos
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                <FileSpreadsheet className="w-3 h-3" /> CSV Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Visualización y razonamiento analítico de variables desde <code className="text-cyan-300 font-mono">outputs/variables.csv</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Badge del CSV */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-emerald-500/50" />
            <span>CSV Conectado</span>
            <span className="text-slate-500 text-[10px]">({lastUpdated})</span>
          </div>

          {/* Botón de Recargar CSV */}
          <button
            onClick={onRefreshCSV}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium text-sm shadow-md shadow-emerald-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Vuelve a leer el archivo variables.csv del repositorio"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Leyendo CSV...' : 'Sincronizar CSV'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
