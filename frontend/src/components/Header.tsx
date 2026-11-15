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
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-3.5 sm:px-6 py-3 sm:py-4 shadow-xl shadow-black/30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Branding & Challenge Info */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Planetary Analog Explorer
              </h1>
              {/* Explicit Team Name */}
              <span className="flex items-center gap-1 text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/60 shadow-sm shrink-0">
                <Users className="w-3 h-3 text-indigo-400" />
                Team: chatgepecitos
              </span>
              <span className="hidden xs:inline-flex text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 shrink-0">
                NASA Space Apps Challenge
              </span>
            </div>
            {/* Explicit Challenge Title */}
            <p className="text-[11px] sm:text-xs text-slate-300 font-medium mt-0.5 line-clamp-1 sm:line-clamp-none">
              <span className="text-slate-400">Challenge:</span> &ldquo;Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars&rdquo;
            </p>
          </div>
        </div>

        {/* Sync & Source Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full md:w-auto">
          <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded bg-slate-950 text-slate-400 border border-slate-800">
            Mode: Verified Data Only
          </span>

          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 min-w-0 flex-1 sm:flex-initial">
            <Globe2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
            <span className="font-mono text-[10px] sm:text-[11px] truncate" title={filename || 'outputs/variables.csv'}>
              {filename || 'outputs/variables.csv'}
            </span>
            <span className="hidden sm:inline text-slate-500 text-[10px] shrink-0">({lastUpdated})</span>
          </div>

          <button
            onClick={onRefreshCSV}
            disabled={isLoading}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-cyan-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
            title="Re-fetch and sync with latest CSV outputs from Jupyter Notebook"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync CSV'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
