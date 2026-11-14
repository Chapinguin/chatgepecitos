import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { MetricsCards } from './components/MetricsCards';
import { VariableCharts } from './components/VariableCharts';
import { VariablesTable } from './components/VariablesTable';
import { PipelineLogs } from './components/PipelineLogs';
import { ChatAssistant } from './components/ChatAssistant';
import { sampleDatasets, generateMockResult } from './data/mockData';
import type { AnalysisResult, PipelineConfig } from './types';
import { runPipeline, checkBackendHealth } from './services/api';
import { Sparkles } from 'lucide-react';

export function App() {
  const [selectedDataset, setSelectedDataset] = useState<string>(sampleDatasets[0].id);
  const [isMockMode, setIsMockMode] = useState<boolean>(true);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [config, setConfig] = useState<PipelineConfig>({
    algorithm: 'GLCM + Segmentación Adaptativa',
    threshold: 2.2,
    channelMode: 'multichannel',
    removeBackgroundNoise: true,
    normalizeIntensity: true,
    useGpu: false,
  });

  const [result, setResult] = useState<AnalysisResult>(() =>
    generateMockResult(sampleDatasets[0].id, 'GLCM + Segmentación Adaptativa')
  );

  useEffect(() => {
    const checkHealth = async () => {
      const isUp = await checkBackendHealth();
      setBackendOnline(isUp);
      if (isUp) {
        setIsMockMode(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleExecute = async () => {
    setIsLoading(true);
    try {
      const res = await runPipeline(selectedDataset, config, isMockMode);
      setResult(res);
    } catch (err) {
      console.error('Error al ejecutar pipeline:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header
        isMockMode={isMockMode}
        setIsMockMode={setIsMockMode}
        backendOnline={backendOnline}
        onRunDemo={handleExecute}
        isLoading={isLoading}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner de Estado Hackathon */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border border-cyan-800/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Entorno de Visualización para Procesamiento TIFF de Alta Carga
              </h2>
              <p className="text-xs text-slate-400">
                Archivo activo: <span className="font-mono text-cyan-300 font-semibold">{result.filename}</span> • {result.variables.length} variables estadísticas extraídas sin saturar memoria del navegador.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-400 font-mono">
            <span>Job ID: {result.jobId}</span>
          </div>
        </div>

        {/* 1. KPIs Destacados */}
        <MetricsCards variables={result.variables} />

        {/* 2. Grid de Control y Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Parámetros del Archivo y Controles (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <ControlPanel
              selectedDataset={selectedDataset}
              setSelectedDataset={setSelectedDataset}
              config={config}
              setConfig={setConfig}
              isLoading={isLoading}
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
        Chatgepecitos • Hackathon 36h Edition • Procesamiento de TIFFs en Python + React UI
      </footer>
    </div>
  );
}

export default App;
