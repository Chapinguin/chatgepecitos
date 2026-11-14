export interface VariableResult {
  name: string;
  key: string;
  value: number | string;
  unit?: string;
  change?: string;
  status: 'normal' | 'warning' | 'critical' | 'info';
  category: string;
  description?: string;
}

export interface LayerMetric {
  layer: string;
  index: number;
  intensity: number;
  density: number;
  noiseRatio: number;
  particlesDetected: number;
}

export interface HistogramBin {
  range: string;
  count: number;
}

export interface AnalysisResult {
  jobId: string;
  filename: string;
  fileSizeBytes: number;
  processedAt: string;
  durationSeconds: number;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  variables: VariableResult[];
  layerMetrics: LayerMetric[];
  histogram: HistogramBin[];
  correlationMatrix?: { variableA: string; variableB: string; score: number }[];
  summary: string;
  pipelineLogs: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  suggestedPrompts?: string[];
}

export interface PipelineConfig {
  algorithm: string;
  threshold: number;
  channelMode: 'multichannel' | 'merged' | 'auto';
  removeBackgroundNoise: boolean;
  normalizeIntensity: boolean;
  useGpu: boolean;
}

