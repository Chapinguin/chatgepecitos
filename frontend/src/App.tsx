import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { PlanetarySwitch } from './components/PlanetarySwitch';
import { MetricsCards } from './components/MetricsCards';
import { VariableCharts } from './components/VariableCharts';
import { VariablesTable } from './components/VariablesTable';
import type { AnalysisResult, TargetBody } from './types';
import { loadPlanetaryResults } from './services/csvLoader';
import { getInitialMockResult } from './data/mockData';
import { Target, Sparkles, Compass } from 'lucide-react';

export function App() {
  const [targetBody, setTargetBody] = useState<TargetBody>('Mars');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Live Synced');

  const [result, setResult] = useState<AnalysisResult>(() =>
    getInitialMockResult('Mars')
  );

  const fetchPlanetaryData = useCallback(async (body: TargetBody) => {
    setIsLoading(true);
    try {
      const data = await loadPlanetaryResults(body);
      setResult(data);
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn(`Could not load CSV for ${body}, using baseline model:`, err);
      setResult(getInitialMockResult(body));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    fetchPlanetaryData(targetBody);
  }, [targetBody, fetchPlanetaryData]);

  const handleTargetChange = (newBody: TargetBody) => {
    if (newBody !== targetBody) {
      setTargetBody(newBody);
    }
  };

  return (
    <div className="relative isolate min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#070b14]/55" />
        <div className="celestial-drift absolute -right-28 top-[35vh] aspect-square w-[min(78vw,440px)] sm:right-[5vw] sm:w-[min(42vw,480px)]">
          <div className="celestial-turn celestial-sphere relative h-full w-full overflow-hidden rounded-full opacity-60 shadow-[0_0_90px_rgba(86,146,220,0.18)]">
            <img
              key={targetBody}
              src={targetBody === 'Mars' ? '/images/mars-background.png' : '/images/moon-background.jpg'}
              alt=""
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/15 via-transparent to-[#02040b]/85" />
            <div className="absolute inset-0 rounded-full shadow-[inset_-30px_-20px_60px_30px_rgba(0,0,0,0.8),inset_15px_10px_35px_rgba(255,255,255,0.18)]" />
          </div>
        </div>
      </div>

      {/* Top Navigation */}
      <Header
        onRefreshCSV={() => fetchPlanetaryData(targetBody)}
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        filename={`outputs/${result.filename}`}
      />

      <main className="relative flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Large Prominent Target Planet Switch (Earth with Mars vs Earth with Moon) */}
        <PlanetarySwitch
          selectedBody={targetBody}
          onSelectBody={handleTargetChange}
          isLoading={isLoading}
        />

        {/* Challenge Context Banner */}
        <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/90 border border-slate-800 rounded-2xl p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              targetBody === 'Mars'
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
            }`}>
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
                  Active Comparison
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  targetBody === 'Mars'
                    ? 'bg-orange-950 text-orange-300 border border-orange-800/60'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                }`}>
                  Earth with {targetBody}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                {targetBody === 'Mars'
                  ? 'Terrestrial Analogs for locations in Mars'
                  : 'Terrestrial analogs for lunar locations'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 border-t md:border-t-0 border-slate-800 pt-2 md:pt-0 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>Top {result.analogSites.length} of 5,175 Analyzed Tiles</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{result.variables.length} Extracted Variables</span>
            </div>
          </div>
        </div>

        {/* 1. Highlighted KPI Cards */}
        <MetricsCards variables={result.variables} />

        {/* 2. Multispectral Charts & Analysis */}
        <VariableCharts
          layerMetrics={result.layerMetrics}
          histogram={result.histogram}
          targetBody={targetBody}
        />

        {/* 3. Interactive Analog Sites & Variables Table */}
        <VariablesTable
          variables={result.variables}
          analogSites={result.analogSites}
          targetBody={targetBody}
          filename={result.filename}
        />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2.5">
          <span>Team: <strong className="text-slate-300">chatgepecitos</strong> • NASA Space Apps Challenge</span>
          <span className="text-[11px] text-slate-400">
            Imagery &amp; Data Credits: <strong className="text-slate-300">NASA / JPL-Caltech / USGS / ASU LROC / OpenPlanetary</strong> (Public Domain)
          </span>
          <span className="text-[11px] text-slate-500">&ldquo;Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars&rdquo;</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
