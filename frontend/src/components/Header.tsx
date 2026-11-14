import React from 'react';
import { Activity, Cpu, Sparkles } from 'lucide-react';

interface HeaderProps {
  isMockMode: boolean;
  setIsMockMode: (val: boolean) => void;
  backendOnline: boolean;
  onRunDemo: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isMockMode,
  setIsMockMode,
  backendOnline,
  onRunDemo,
  isLoading,
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
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                TIFF Analytics Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Extracción, análisis y visualización de variables de alta dimensionalidad
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Badge de conexión */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                backendOnline ? 'bg-emerald-400 shadow-emerald-500/50' : isMockMode ? 'bg-amber-400 shadow-amber-500/50' : 'bg-rose-400'
              }`}
            />
            <span>
              {backendOnline
                ? 'Backend Python Conectado'
                : isMockMode
                ? 'Modo Simulación Activo (Hackathon)'
                : 'Servidor Desconectado'}
            </span>
          </div>

          {/* Toggle de Modo Mock / Live */}
          <button
            onClick={() => setIsMockMode(!isMockMode)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
              isMockMode
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
            title="Alterna entre datos simulados para demo y API real"
          >
            {isMockMode ? 'Simulación ON' : 'API Real'}
          </button>

          {/* Botón de Ejecutar Pipeline */}
          <button
            onClick={onRunDemo}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-md shadow-cyan-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Cpu className="w-4 h-4 animate-spin text-white" />
                <span>Procesando TIFF...</span>
              </>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                <span>Ejecutar Análisis</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
