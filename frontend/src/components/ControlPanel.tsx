import React from 'react';
import { Sliders, Database, Zap } from 'lucide-react';
import { sampleDatasets } from '../data/mockData';
import type { PipelineConfig } from '../types';

interface ControlPanelProps {
  selectedDataset: string;
  setSelectedDataset: (id: string) => void;
  config: PipelineConfig;
  setConfig: React.Dispatch<React.SetStateAction<PipelineConfig>>;
  isLoading: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedDataset,
  setSelectedDataset,
  config,
  setConfig,
  isLoading,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <Database className="w-4 h-4 text-cyan-400" />
          <span>Archivo TIFF de Entrada</span>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
          Memmap 16-bit
        </span>
      </div>

      {/* Dataset selector */}
      <div className="space-y-2">
        <label className="text-xs text-slate-400">Seleccionar Muestra / Escaneo</label>
        <div className="grid grid-cols-1 gap-2">
          {sampleDatasets.map((ds) => (
            <div
              key={ds.id}
              onClick={() => !isLoading && setSelectedDataset(ds.id)}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                selectedDataset === ds.id
                  ? 'bg-cyan-950/30 border-cyan-500/60 text-white ring-1 ring-cyan-500/30'
                  : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{ds.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {ds.size}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                {ds.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Parámetros de Extracción */}
      <div className="border-t border-slate-800/60 pt-4 space-y-4">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>Configuración de Extracción</span>
        </div>

        {/* Algoritmo */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Algoritmo de Extracción</label>
          <select
            value={config.algorithm}
            onChange={(e) => setConfig({ ...config, algorithm: e.target.value })}
            disabled={isLoading}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="GLCM + Segmentación Adaptativa">GLCM + Segmentación Adaptativa</option>
            <option value="PCA Espectral + Reducción de Ruido">PCA Espectral + Reducción de Ruido</option>
            <option value="Otsu Multiumbral + Wavelet">Otsu Multiumbral + Wavelet</option>
            <option value="Deep Feature Extractor (ResNet)">Deep Feature Extractor (ResNet)</option>
          </select>
        </div>

        {/* Slider Umbral */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Sensibilidad de Umbral</span>
            <span className="font-mono text-cyan-400">{config.threshold}σ</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="4.0"
            step="0.1"
            value={config.threshold}
            onChange={(e) => setConfig({ ...config, threshold: parseFloat(e.target.value) })}
            disabled={isLoading}
            className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-2 pt-1 text-xs">
          <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 cursor-pointer hover:bg-slate-950/70">
            <span className="text-slate-300">Filtrado de Ruido Gaussiano</span>
            <input
              type="checkbox"
              checked={config.removeBackgroundNoise}
              onChange={(e) => setConfig({ ...config, removeBackgroundNoise: e.target.checked })}
              className="accent-cyan-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 cursor-pointer hover:bg-slate-950/70">
            <span className="text-slate-300">Normalizar Intensidad (16-bit a Z-Score)</span>
            <input
              type="checkbox"
              checked={config.normalizeIntensity}
              onChange={(e) => setConfig({ ...config, normalizeIntensity: e.target.checked })}
              className="accent-cyan-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 cursor-pointer hover:bg-slate-950/70">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Aceleración PyTorch / GPU</span>
            </span>
            <input
              type="checkbox"
              checked={config.useGpu}
              onChange={(e) => setConfig({ ...config, useGpu: e.target.checked })}
              className="accent-amber-500 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
