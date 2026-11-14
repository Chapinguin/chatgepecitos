import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { MetricsCards } from './components/MetricsCards';
import { VariableCharts } from './components/VariableCharts';
import { VariablesTable } from './components/VariablesTable';
import { PipelineLogs } from './components/PipelineLogs';
import { ChatAssistant } from './components/ChatAssistant';
import type { AnalysisResult } from './types';
import { loadResultsFromRepoCSV, parseCSVData } from './services/csvLoader';
import { generateMockResult } from './data/mockData';
import { Sparkles, FileSpreadsheet } from 'lucide-react';

export function App() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Recién cargado');

  const [result, setResult] = useState<AnalysisResult>(() =>
    generateMockResult('outputs/variables.csv', 'CSV Engine')
  );

  const fetchCSVData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await loadResultsFromRepoCSV();
      setResult(data);
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('No se pudo leer el CSV remoto, manteniendo estado:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar el CSV al iniciar la aplicación
  useEffect(() => {
    fetchCSVData();
  }, [fetchCSVData]);

  const handleCustomCSVUpload = (content: string, filename: string) => {
    try {
      const parsed = parseCSVData(content, undefined, filename);
      setResult(parsed);
      setLastUpdated(`Subido: ${filename}`);
    } catch (err) {
      console.error('Error al parsear archivo CSV manual:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header
        onRefreshCSV={fetchCSVData}
        isLoading={isLoading}
        lastUpdated={lastUpdated}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner de Estado CSV */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-blue-950/40 border border-emerald-800/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Sincronización Directa de Variables desde el Repositorio
              </h2>
              <p className="text-xs text-slate-400">
                Archivo activo: <span className="font-mono text-emerald-300 font-semibold">{result.filename}</span> • {result.variables.length} métricas cargadas y listas para visualización y chat.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-400 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Job: {result.jobId}</span>
          </div>
        </div>

        {/* 1. KPIs Destacados */}
        <MetricsCards variables={result.variables} />

        {/* 2. Grid de Control y Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Información de Fuente CSV y Logs (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <ControlPanel
              onCustomCSVUpload={handleCustomCSVUpload}
              isLoading={isLoading}
              totalVariables={result.variables.length}
            />
            <PipelineLogs
              logs={result.pipelineLogs}
              duration={result.durationSeconds}
              filename={result.filename}
            />
          </div>

          {/* Columna Derecha: Gráficos de Distribución e Histograma (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <VariableCharts
              layerMetrics={result.layerMetrics}
              histogram={result.histogram}
            />
            
            {/* Chatgepecitos Copilot Asistente */}
            <ChatAssistant
              variables={result.variables}
              filename={result.filename}
            />
          </div>
        </div>

        {/* 3. Tabla Completa de Variables Extraídas */}
        <VariablesTable
          variables={result.variables}
          filename={result.filename}
        />
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        Chatgepecitos • Hackathon 36h • Visualización reactiva basada en CSV y Jupyter Notebooks
      </footer>
    </div>
  );
}

export default App;
