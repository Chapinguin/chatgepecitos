import React from 'react';
import { RefreshCw, Globe2, Users, Compass } from 'lucide-react';

interface HeaderProps {
  onRefreshCSV: () => void;
  isLoading: boolean;
  lastUpdated: string;
  filename?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onRefreshCSV,
  isLoading,
  lastUpdated,
  filename,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-6 py-4 shadow-xl shadow-black/30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Branding & Challenge Info */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Planetary Analog Explorer
              </h1>
              {/* Explicit Team Name */}
              <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/60 shadow-sm">
                <Users className="w-3 h-3 text-indigo-400" />
                Team: chatgepecitos
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                NASA Space Apps Challenge
              </span>
            </div>
            {/* Explicit Challenge Title */}
            <p className="text-xs text-slate-300 font-medium mt-0.5 line-clamp-1 sm:line-clamp-none">
              <span className="text-slate-400">Challenge:</span> &ldquo;Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars&rdquo;
            </p>
          </div>
        </div>

        {/* Sync & Source Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded bg-slate-950 text-slate-400 border border-slate-800">
            Mode: Verified Data Only
          </span>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
            <Globe2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-mono text-[11px]">{filename || 'outputs/variables.csv'}</span>
            <span className="text-slate-500 text-[10px]">({lastUpdated})</span>
          </div>

          <button
            onClick={onRefreshCSV}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-cyan-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Re-fetch and sync with latest CSV outputs from Jupyter Notebook"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync CSV'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
