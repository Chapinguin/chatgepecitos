/**
 * NOTE: This file/code was developed with the assistance of Artificial Intelligence (AI)
 * as part of team chatgepecitos' entry for the NASA Space Apps Challenge.
 */

import type { AnalysisResult, PipelineConfig } from '../types';
import { getInitialMockResult } from '../data/mockData';

const API_BASE = '/api';

export const runPipeline = async (
  filename: string,
  config: PipelineConfig,
  useMock: boolean = true
): Promise<AnalysisResult> => {
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return getInitialMockResult(config.targetBody || 'Mars');
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
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data: AnalysisResult = await response.json();
    return data;
  } catch (err) {
    console.warn('API unavailable, falling back to mock...', err);
    return getInitialMockResult(config.targetBody || 'Mars');
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
