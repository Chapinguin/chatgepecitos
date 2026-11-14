import React from 'react';
import type { TargetBody } from '../types';
import { Orbit, Sparkles } from 'lucide-react';

interface PlanetarySwitchProps {
  selectedBody: TargetBody;
  onSelectBody: (body: TargetBody) => void;
  isLoading: boolean;
}

export const PlanetarySwitch: React.FC<PlanetarySwitchProps> = ({
  selectedBody,
  onSelectBody,
  isLoading,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className={`absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none transition-colors duration-700 ${
          selectedBody === 'Mars' ? 'bg-orange-600' : 'bg-cyan-500'
        }`}
      />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-5 relative z-10">
        {/* Descriptive context */}
        <div className="text-center lg:text-left space-y-1">
          <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Orbit className="w-4 h-4 text-cyan-400" />
            <span>Target Analog Mode (Select One)</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Planetary Comparison Mode
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Switch between target celestial bodies. All analog matching scores, spectral graphs, terrestrial candidate sites, and AI insights dynamically re-calibrate.
          </p>
        </div>

        {/* Large Exclusive Switch Button */}
        <div className="w-full sm:w-auto bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner flex items-center gap-1.5">
          {/* Earth with Mars */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onSelectBody('Mars')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${
              selectedBody === 'Mars'
                ? 'bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 text-white shadow-lg shadow-orange-600/30 ring-2 ring-orange-400/50 scale-[1.02]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 transition-all ${
              selectedBody === 'Mars' ? 'border-white bg-amber-300 shadow-sm' : 'border-slate-600'
            }`} />
            <div className="text-left">
              <div className="text-xs font-mono uppercase tracking-wider text-orange-200 opacity-90">
                Target Body
              </div>
              <div className="text-sm font-extrabold flex items-center gap-1.5">
                <span>Earth with Mars</span>
                {selectedBody === 'Mars' && <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />}
              </div>
            </div>
            {selectedBody === 'Mars' && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/30 text-orange-100 border border-orange-400/30">
                ACTIVE
              </span>
            )}
          </button>

          {/* Earth with Moon */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onSelectBody('Moon')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${
              selectedBody === 'Moon'
                ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30 ring-2 ring-cyan-400/50 scale-[1.02]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 transition-all ${
              selectedBody === 'Moon' ? 'border-white bg-cyan-200 shadow-sm' : 'border-slate-600'
            }`} />
            <div className="text-left">
              <div className="text-xs font-mono uppercase tracking-wider text-cyan-200 opacity-90">
                Permanent Base Sites
              </div>
              <div className="text-sm font-extrabold flex items-center gap-1.5">
                <span>Earth with Moon</span>
                {selectedBody === 'Moon' && <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />}
              </div>
            </div>
            {selectedBody === 'Moon' && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/30 text-cyan-100 border border-cyan-400/30">
                ACTIVE
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

