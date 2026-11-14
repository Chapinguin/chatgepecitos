import type { AnalysisResult, PipelineConfig } from '../types';
import { generateMockResult } from '../data/mockData';

const API_BASE = '/api';

export const runPipeline = async (
  filename: string,
  config: PipelineConfig,
  useMock: boolean = true
): Promise<AnalysisResult> => {
  if (useMock) {
    // Simular latencia de computación pesada (1.8 segundos)
    await new Promise((resolve) => setTimeout(resolve, 1800));
    return generateMockResult(filename, config.algorithm);
  }

  try {
    const response = await fetch(`${API_BASE}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        config,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en servidor: ${response.statusText}`);
    }

    const data: AnalysisResult = await response.json();
    return data;
  } catch (err) {
    console.warn('API no disponible, cambiando a modo simulación...', err);
    return generateMockResult(filename, config.algorithm);
  }
};

export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
};
