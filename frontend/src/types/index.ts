/**
 * NOTE: This file/code was developed with the assistance of Artificial Intelligence (AI)
 * as part of team chatgepecitos' entry for the NASA Space Apps Challenge.
 */

export type TargetBody = 'Mars' | 'Moon';

export interface VariableResult {
  name: string;
  key: string;
  value: number | string;
  unit?: string;
  change?: string;
  status: 'optimal' | 'match' | 'partial' | 'low' | 'pending';
  category: string;
  description?: string;
}

export interface LayerMetric {
  layer: string;
  index: number;
  matchScore: number;
  spectralFidelity: number;
  roughnessIndex: number;
  mineralConfidence: number;
}

export interface HistogramBin {
  range: string;
  count: number;
}

export interface PlanetaryAnalogSite {
  id: string;
  earthLocation: string;
  earthCountry: string;
  targetLocation: string;
  targetBody: TargetBody;
  overallMatchScore: number;
  mineralMatch: number | null;
  terrainMatch: number | null;
  climateProxyMatch: number | null;
  keyAnalogFactor: string;
  status: 'Verified Match' | 'High Match' | 'Moderate Match' | 'Candidate';
  earthImageUrl?: string;
  targetImageUrl?: string;
  googleMapsUrl?: string;
  earthCoordinates?: string;
  targetCoordinates?: string;
  targetMapsUrl?: string;
}

export interface AnalysisResult {
  jobId: string;
  targetBody: TargetBody;
  filename: string;
  fileSizeBytes: number;
  processedAt: string;
  durationSeconds: number;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  variables: VariableResult[];
  layerMetrics: LayerMetric[];
  histogram: HistogramBin[];
  analogSites: PlanetaryAnalogSite[];
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
  targetBody: TargetBody;
  algorithm: string;
  spectralTolerance: number;
  minMatchThreshold: number;
  normalizeBands: boolean;
  filterAtmosphericInterference: boolean;
}

export interface SatellitePatch {
  id: string;
  name: string;
  source: 'tierra' | 'marte' | 'luna' | 'custom';
  targetBody: 'Earth' | 'Mars' | 'Moon' | 'Both';
  imageUrl: string;
  thumbnailUrl?: string;
  resolution: string;
  coordinates: string;
  bboxPx?: [number, number, number, number];
  bboxCrs?: [number, number, number, number];
  simMars: number;
  simMoon: number;
  refMars?: string;
  refMoon?: string;
  analogType: string;
  status: 'Verified Crop' | 'Candidate Analog' | 'Ground Truth' | 'Custom Upload';
  description?: string;
  timestamp?: string;
}
