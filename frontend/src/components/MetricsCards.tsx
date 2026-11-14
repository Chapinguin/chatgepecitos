import React from 'react';
import type { VariableResult } from '../types';
import { ArrowUpRight, ArrowDownRight, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MetricsCardsProps {
  variables: VariableResult[];
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ variables }) => {
  const highlighted = variables.slice(0, 4);

  const getStatusBadge = (status: VariableResult['status']) => {
    switch (status) {
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.5 rounded font-mono">
            <AlertTriangle className="w-3 h-3" /> Atención
          </span>
        );
      case 'critical':
        return (
          <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-950/60 border border-rose-800/40 px-1.5 py-0.5 rounded font-mono">
            <AlertTriangle className="w-3 h-3" /> Crítico
          </span>
        );
      case 'info':
        return (
          <span className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.5 rounded font-mono">
            <Info className="w-3 h-3" /> Nominal
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded font-mono">
            <CheckCircle2 className="w-3 h-3" /> Óptimo
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {highlighted.map((v) => {
        const isPositive = v.change?.startsWith('+');
        return (
          <div
            key={v.key}
            className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-bl-full pointer-events-none group-hover:from-cyan-500/20 transition" />
            
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-slate-400 line-clamp-1" title={v.name}>
                {v.name}
              </span>
              {getStatusBadge(v.status)}
            </div>

            <div className="my-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono tracking-tight text-white">
                  {v.value}
                </span>
                {v.unit && (
                  <span className="text-xs text-slate-400 font-medium">{v.unit}</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/50 pt-2.5">
              <span className="text-slate-500 truncate">{v.category}</span>
              {v.change && (
                <span
                  className={`flex items-center font-medium ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {v.change}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
