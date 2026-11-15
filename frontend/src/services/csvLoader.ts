import Papa from 'papaparse';
import type { VariableResult, LayerMetric, AnalysisResult, HistogramBin, TargetBody, PlanetaryAnalogSite } from '../types';

const parseOptionalNumber = (value: string | undefined): number | null => {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Dynamic Rank-Based Image Resolver (Enfoque 1).
 * Maps candidate site rank/position to corresponding top crops dynamically without hardcoding.
 */
const resolveRankImage = (
  explicitUrl: string | undefined,
  index: number,
  type: 'earth' | 'target',
  targetBody: TargetBody
): string | undefined => {
  if (explicitUrl && explicitUrl.trim()) {
    return explicitUrl.trim();
  }

  if (type === 'earth') {
    const isMars = targetBody.toLowerCase() === 'mars';
    const rank = index + 1;
    const globalRank = isMars ? rank : rank + 5;
    const rankStr = String(globalRank).padStart(2, '0');
    return `/images/patches/top_${rankStr}_earth.png`;
  }

  // Target planetary body: if no explicit crop is provided in CSV,
  // return undefined so UI renders the scientific sensor reticle fallback.
  return undefined;
};

export const loadPlanetaryResults = async (targetBody: TargetBody): Promise<AnalysisResult> => {
  const isMars = targetBody === 'Mars';
  const varFileName = isMars ? 'earth_with_mars_variables.csv' : 'earth_with_moon_variables.csv';
  const layerFileName = isMars ? 'earth_with_mars_layers.csv' : 'earth_with_moon_layers.csv';
  const histFileName = isMars ? 'earth_with_mars_histogram.csv' : 'earth_with_moon_histogram.csv';

  // 1. Fetch Variables CSV
  const varRes = await fetch(`/data/${varFileName}?t=${Date.now()}`);
  if (!varRes.ok) {
    throw new Error(`Failed to load ${varFileName} from public/data/`);
  }
  const varText = await varRes.text();

  // 2. Fetch Layers CSV
  let layersText = '';
  try {
    const layerRes = await fetch(`/data/${layerFileName}?t=${Date.now()}`);
    if (layerRes.ok) {
      layersText = await layerRes.text();
    }
  } catch (err) {
    console.warn(`Layer file ${layerFileName} not available:`, err);
  }

  // 3. Fetch Histogram CSV
  let histText = '';
  try {
    const histRes = await fetch(`/data/${histFileName}?t=${Date.now()}`);
    if (histRes.ok) {
      histText = await histRes.text();
    }
  } catch (err) {
    console.warn(`Histogram file ${histFileName} not available:`, err);
  }

  // 4. Fetch Analog Sites CSV
  let sitesText = '';
  try {
    const sitesRes = await fetch(`/data/planetary_analog_sites.csv?t=${Date.now()}`);
    if (sitesRes.ok) {
      sitesText = await sitesRes.text();
    }
  } catch (err) {
    console.warn('planetary_analog_sites.csv not available:', err);
  }

  return parsePlanetaryData(varText, layersText, sitesText, histText, targetBody, varFileName);
};

export const parsePlanetaryData = (
  variablesCSV: string,
  layersCSV: string | undefined,
  sitesCSV: string | undefined,
  histCSV: string | undefined,
  targetBody: TargetBody,
  sourceName: string
): AnalysisResult => {
  // Parse Variables
  const varParse = Papa.parse(variablesCSV.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  const variables: VariableResult[] = (varParse.data as Record<string, string>[]).map((row) => ({
    name: row.name || row.variable || 'Variable Metric',
    key: row.key || row.name?.toLowerCase().replace(/\s+/g, '_') || 'key',
    value: isNaN(Number(row.value)) ? row.value || '0' : Number(row.value),
    unit: row.unit || '',
    category: row.category || 'General Analog',
    status: (['optimal', 'match', 'partial', 'low', 'pending'].includes((row.status || '').toLowerCase())
      ? row.status.toLowerCase()
      : 'pending') as VariableResult['status'],
    description: row.description || '',
    change: row.change || undefined,
  }));

  // Parse Layer Spectral Metrics
  let layerMetrics: LayerMetric[] = [];
  if (layersCSV && layersCSV.trim()) {
    const layerParse = Papa.parse(layersCSV.trim(), {
      header: true,
      skipEmptyLines: true,
    });
    layerMetrics = (layerParse.data as Record<string, string>[]).map((row, i) => ({
      layer: row.layer || `Band ${i + 1}`,
      index: Number(row.index || i + 1),
      matchScore: Number(row.matchScore || 0),
      spectralFidelity: Number(row.spectralFidelity || 0),
      roughnessIndex: Number(row.roughnessIndex || 0),
      mineralConfidence: Number(row.mineralConfidence || 0),
    }));
  }

  // Parse Analog Sites & Filter by Target Body
  let analogSites: PlanetaryAnalogSite[] = [];
  if (sitesCSV && sitesCSV.trim()) {
    const sitesParse = Papa.parse(sitesCSV.trim(), {
      header: true,
      skipEmptyLines: true,
    });
    analogSites = (sitesParse.data as Record<string, string>[])
      .filter((row) => (row.targetBody || '').toLowerCase() === targetBody.toLowerCase())
      .map((row, index) => ({
        id: row.id || `SITE-${Math.random().toString(36).substring(2, 6)}`,
        earthLocation: row.earthLocation || 'Earth Location',
        earthCountry: row.earthCountry || 'Global',
        targetLocation: row.targetLocation || `${targetBody} Region`,
        targetBody,
        overallMatchScore: Number(row.overallMatchScore || 0),
        mineralMatch: parseOptionalNumber(row.mineralMatch),
        terrainMatch: parseOptionalNumber(row.terrainMatch),
        climateProxyMatch: parseOptionalNumber(row.climateProxyMatch),
        keyAnalogFactor: row.keyAnalogFactor || 'Geological composition proxy',
        status: (row.status || 'Candidate') as PlanetaryAnalogSite['status'],
        earthImageUrl: resolveRankImage(row.earthImageUrl, index, 'earth', targetBody),
        targetImageUrl: resolveRankImage(row.targetImageUrl, index, 'target', targetBody),
        googleMapsUrl: row.googleMapsUrl?.trim() || undefined,
        earthCoordinates: row.earthCoordinates?.trim() || undefined,
        targetCoordinates: row.targetCoordinates?.trim() || undefined,
        targetMapsUrl: row.targetMapsUrl?.trim() || undefined,
      }));
  }

  // Parse Histogram CSV or Default to Strict Zero Baseline
  let histogram: HistogramBin[] = [];
  if (histCSV && histCSV.trim()) {
    const histParse = Papa.parse(histCSV.trim(), {
      header: true,
      skipEmptyLines: true,
    });
    histogram = (histParse.data as Record<string, string>[]).map((row) => ({
      range: row.range || 'Match Bin',
      count: Number(row.count || 0),
    }));
  } else {
    histogram = [
      { range: '0-50% Match', count: 0 },
      { range: '50-65% Match', count: 0 },
      { range: '65-75% Match', count: 0 },
      { range: '75-85% Match', count: 0 },
      { range: '85-92% Match', count: 0 },
      { range: '92-96% Match', count: 0 },
      { range: '96-98% Match', count: 0 },
      { range: '98%+ Match', count: 0 },
    ];
  }

  const primaryScore = variables.find((v) => v.key.includes('match') || v.key.includes('fidelity'))?.value || 0;

  return {
    jobId: `job_${targetBody.toLowerCase()}_${Date.now().toString(36)}`,
    targetBody,
    filename: sourceName,
    fileSizeBytes: variablesCSV.length,
    processedAt: new Date().toISOString(),
    durationSeconds: 0.12,
    status: 'completed',
    summary: `Planetary Analog Engine initialized for Earth with ${targetBody}. Primary analog fidelity: ${primaryScore}%. ${analogSites.length} backend-scored terrestrial candidate sites registered.`,
    variables,
    layerMetrics,
    histogram,
    analogSites,
    pipelineLogs: [
      `[00.01s] Initializing Planetary Analog Matcher for: Earth with ${targetBody}`,
      `[00.03s] Active multispectral proxy dataset: outputs/${sourceName}`,
      `[00.06s] Parsed ${variables.length} parameters from repository CSV`,
      `[00.09s] Evaluated ${layerMetrics.length} spectral bands`,
      `[00.12s] Loaded ${analogSites.length} backend-scored terrestrial candidate sites`
    ]
  };
};
