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
import { Activity, BarChart2 } from 'lucide-react';

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Chart 1: Spectral & Geological Match by Band */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Multispectral Analog Match Profile (Earth vs {targetBody})
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {layerMetrics.length} Bands Analyzed
          </span>
        </div>

        <div className="h-64 w-full">
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
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[60, 100]} />
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
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Spatial Match Score Frequency (Sample Surface Pixels)
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            N = 20,400 Pixels
          </span>
        </div>

        <div className="h-64 w-full">
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
                name="Pixel Frequency"
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
