/**
 * NOTE: This file/code was developed with the assistance of Artificial Intelligence (AI)
 * as part of team chatgepecitos' entry for the NASA Space Apps Challenge.
 */

import React from 'react';
import type { VariableResult } from '../types';
import { CheckCircle2, AlertCircle, Sparkles, Clock } from 'lucide-react';

interface MetricsCardsProps {
  variables: VariableResult[];
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ variables }) => {
  const highlighted = variables.slice(0, 4);

  const getStatusBadge = (status: VariableResult['status']) => {
    switch (status) {
      case 'optimal':
        return (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-800/50 px-2 py-0.5 rounded font-mono font-medium">
            <CheckCircle2 className="w-3 h-3" /> Optimal Match
          </span>
        );
      case 'match':
        return (
          <span className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/70 border border-cyan-800/50 px-2 py-0.5 rounded font-mono font-medium">
            <Sparkles className="w-3 h-3" /> High Match
          </span>
        );
      case 'partial':
        return (
          <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/70 border border-amber-800/50 px-2 py-0.5 rounded font-mono font-medium">
            <AlertCircle className="w-3 h-3" /> Partial Match
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/60 border border-amber-700/50 px-2 py-0.5 rounded font-mono font-medium animate-pulse">
            <Clock className="w-3 h-3" /> Awaiting Pipeline
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-950/70 border border-slate-800 px-2 py-0.5 rounded font-mono font-medium">
            Nominal
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {highlighted.map((v) => (
        <div
          key={v.key}
          title={v.description}
          className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4.5 flex flex-col justify-between hover:border-slate-700 transition relative overflow-hidden group shadow-md"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-bl-full pointer-events-none group-hover:from-cyan-500/20 transition" />
          
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold text-slate-300 line-clamp-1" title={v.name}>
              {v.name}
            </span>
            {getStatusBadge(v.status)}
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white">
                {v.value}
              </span>
              {v.unit && (
                <span className="text-xs text-slate-400 font-medium">{v.unit}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
