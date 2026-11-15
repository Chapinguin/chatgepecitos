/**
 * NOTE: This file/code was developed with the assistance of Artificial Intelligence (AI)
 * as part of team chatgepecitos' entry for the NASA Space Apps Challenge.
 */

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { LayerMetric, HistogramBin, TargetBody } from '../types';
import { Activity, BarChart2, Clock } from 'lucide-react';

interface VariableChartsProps {
  layerMetrics: LayerMetric[];
  histogram: HistogramBin[];
  targetBody: TargetBody;
}

export const VariableCharts: React.FC<VariableChartsProps> = ({
  layerMetrics,
  histogram,
  targetBody,
}) => {
  const isMars = targetBody === 'Mars';
  const primaryColor = isMars ? '#f97316' : '#06b6d4';
  const secondaryColor = isMars ? '#ef4444' : '#6366f1';

  const isBandsPending = layerMetrics.length === 0 || layerMetrics.every((l) => l.matchScore === 0);
  const isHistogramPending = histogram.length === 0 || histogram.every((h) => h.count === 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Chart 1: Spectral & Geological Match by Band */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Multispectral Analog Match Profile (Earth vs {targetBody})
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {isBandsPending ? 'Pending Pipeline' : `${layerMetrics.length} Bands Analyzed`}
          </span>
        </div>

        <div className="h-64 w-full relative">
          {isBandsPending && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-xs rounded-xl border border-slate-800/80 p-4 text-center">
              <div className="w-9 h-9 rounded-full bg-amber-950/80 border border-amber-600/50 flex items-center justify-center mb-2 animate-pulse">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">
                Awaiting Multispectral Computation
              </h4>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Reflectance and mineral fidelity curves will plot automatically once the Python backend processes the GeoTIFF bands.
              </p>
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={layerMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="matchGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="fidelityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="layer" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="matchScore"
                name="Spectral Match %"
                stroke={primaryColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#matchGrad)"
              />
              <Area
                type="monotone"
                dataKey="spectralFidelity"
                name="Mineral Fidelity %"
                stroke={secondaryColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#fidelityGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Analog Score Distribution Histogram */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Spatial Match Score Frequency (Sample Surface Patches)
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {isHistogramPending ? 'Pending Pipeline' : 'Patch Bins'}
          </span>
        </div>

        <div className="h-64 w-full relative">
          {isHistogramPending && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-xs rounded-xl border border-slate-800/80 p-4 text-center">
              <div className="w-9 h-9 rounded-full bg-amber-950/80 border border-amber-600/50 flex items-center justify-center mb-2 animate-pulse">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">
                Awaiting Patch Distribution
              </h4>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Spatial patch frequency histogram is queued for backend execution.
              </p>
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogram} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Bar
                dataKey="count"
                name="Patch Frequency"
                fill={isMars ? '#ea580c' : '#3b82f6'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
