import React from 'react';
import { Terminal, Clock } from 'lucide-react';

interface PipelineLogsProps {
  logs: string[];
  duration: number;
  filename: string;
}

export const PipelineLogs: React.FC<PipelineLogsProps> = ({ logs, duration, filename }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2 text-slate-200 font-semibold font-sans">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Logs de Ejecución del Pipeline (Python Engine)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <Clock className="w-3.5 h-3.5" />
          <span>Tiempo de cómputo: {duration}s</span>
        </div>
      </div>

      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/60 max-h-40 overflow-y-auto space-y-1 text-slate-300">
        <div className="text-slate-500 text-[11px] mb-1">
          // Proceso activo sobre archivo: {filename}
        </div>
        {logs.map((log, idx) => (
          <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed">
            <span className="text-cyan-500 font-bold select-none">&gt;</span>
            <span className="text-slate-300">{log}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
