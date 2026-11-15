import type { AnalysisResult, TargetBody } from '../types';

export const getInitialMockResult = (targetBody: TargetBody): AnalysisResult => {
  const isMars = targetBody === 'Mars';

  return {
    jobId: `init_${targetBody.toLowerCase()}_001`,
    targetBody,
    filename: isMars ? 'earth_with_mars_variables.csv' : 'earth_with_moon_variables.csv',
    fileSizeBytes: 1850,
    processedAt: new Date().toISOString(),
    durationSeconds: 0.14,
    status: 'completed',
    summary: isMars
      ? 'Planetary Analog Model calibrated for Earth with Mars (Jemez, Blue Water, Manzanos in NM vs Jezero CTX/HiRISE). 5,175 patches evaluated.'
      : 'Planetary Analog Model calibrated for Earth with Moon (Jemez, Blue Water, Manzanos in NM vs LRO NAC). 5,175 patches evaluated.',
    variables: isMars
      ? [
          {
            name: 'Top Analog Match',
            key: 'top_match',
            value: 97.33,
            unit: '%',
            change: '+12.4%',
            status: 'optimal',
            category: 'Bhattacharyya Similarity',
            description: 'Highest multivariate texture correlation reached in New Mexico Jemez terrain'
          },
          {
            name: 'Analyzed Surface Patches',
            key: 'analyzed_patches',
            value: 5175,
            unit: 'tiles',
            change: '+5170',
            status: 'optimal',
            category: 'Spatial Coverage',
            description: 'Total 128x128 GeoTIFF orthophoto tiles evaluated across regional scenes'
          },
          {
            name: 'High-Fidelity Candidates',
            key: 'high_fidelity',
            value: 2836,
            unit: 'tiles',
            change: '+54.8%',
            status: 'match',
            category: 'Fidelity Threshold',
            description: 'Patches exceeding 75% structural and luminance match with Martian surface'
          },
          {
            name: 'Mean Surface Similarity',
            key: 'mean_match',
            value: 54.18,
            unit: '%',
            change: '+6.2%',
            status: 'match',
            category: 'Regional Baseline',
            description: 'Average terrain correlation across all evaluated New Mexico orthophoto tiles'
          }
        ]
      : [
          {
            name: 'Top Analog Match',
            key: 'top_match',
            value: 76.24,
            unit: '%',
            change: '+8.1%',
            status: 'optimal',
            category: 'Bhattacharyya Similarity',
            description: 'Highest multivariate texture correlation reached in New Mexico Jemez volcanic field'
          },
          {
            name: 'Analyzed Surface Patches',
            key: 'analyzed_patches',
            value: 5175,
            unit: 'tiles',
            change: '+5170',
            status: 'optimal',
            category: 'Spatial Coverage',
            description: 'Total 128x128 GeoTIFF orthophoto tiles evaluated against Moon LRO NAC shaded models'
          },
          {
            name: 'High-Fidelity Candidates',
            key: 'high_fidelity',
            value: 84,
            unit: 'tiles',
            change: '+1.6%',
            status: 'match',
            category: 'Fidelity Threshold',
            description: 'Patches exceeding 65% match given harsh lunar regolith optical divergence'
          },
          {
            name: 'Mean Surface Similarity',
            key: 'mean_match',
            value: 28.10,
            unit: '%',
            change: '+3.5%',
            status: 'match',
            category: 'Regional Baseline',
            description: 'Average terrain correlation across all evaluated New Mexico orthophoto tiles'
          }
        ],
    layerMetrics: isMars
      ? [
          { layer: 'Band 1 (Visible Blue)', index: 1, matchScore: 82.4, spectralFidelity: 85.1, roughnessIndex: 0.42, mineralConfidence: 88 },
          { layer: 'Band 2 (Visible Green)', index: 2, matchScore: 86.1, spectralFidelity: 88.4, roughnessIndex: 0.45, mineralConfidence: 90 },
          { layer: 'Band 3 (Visible Red)', index: 3, matchScore: 94.8, spectralFidelity: 96.2, roughnessIndex: 0.51, mineralConfidence: 95 },
          { layer: 'Band 4 (Near-IR / Texture)', index: 4, matchScore: 97.3, spectralFidelity: 95.8, roughnessIndex: 0.58, mineralConfidence: 97 },
          { layer: 'Band 5 (Local Variance / Std)', index: 5, matchScore: 91.2, spectralFidelity: 89.5, roughnessIndex: 0.62, mineralConfidence: 91 },
          { layer: 'Band 6 (Gradient Magnitude)', index: 6, matchScore: 87.9, spectralFidelity: 86.3, roughnessIndex: 0.54, mineralConfidence: 89 },
          { layer: 'Band 7 (Bhattacharyya Composite)', index: 7, matchScore: 97.3, spectralFidelity: 96.0, roughnessIndex: 0.55, mineralConfidence: 96 }
        ]
      : [
          { layer: 'Band 1 (Visible Blue / UV)', index: 1, matchScore: 62.1, spectralFidelity: 65.3, roughnessIndex: 0.38, mineralConfidence: 70 },
          { layer: 'Band 2 (Visible Green / 415nm)', index: 2, matchScore: 68.4, spectralFidelity: 70.1, roughnessIndex: 0.41, mineralConfidence: 72 },
          { layer: 'Band 3 (Visible Red / 750nm)', index: 3, matchScore: 73.5, spectralFidelity: 74.8, roughnessIndex: 0.47, mineralConfidence: 75 },
          { layer: 'Band 4 (Near-IR / LRO Shade)', index: 4, matchScore: 76.2, spectralFidelity: 77.5, roughnessIndex: 0.52, mineralConfidence: 78 },
          { layer: 'Band 5 (Local Variance / Std)', index: 5, matchScore: 70.8, spectralFidelity: 69.4, roughnessIndex: 0.56, mineralConfidence: 71 },
          { layer: 'Band 6 (Gradient Magnitude)', index: 6, matchScore: 67.4, spectralFidelity: 66.1, roughnessIndex: 0.49, mineralConfidence: 69 },
          { layer: 'Band 7 (Bhattacharyya Composite)', index: 7, matchScore: 76.2, spectralFidelity: 75.0, roughnessIndex: 0.51, mineralConfidence: 76 }
        ],
    histogram: isMars
      ? [
          { range: '0-50% Match', count: 1690 },
          { range: '50-65% Match', count: 125 },
          { range: '65-75% Match', count: 524 },
          { range: '75-85% Match', count: 2231 },
          { range: '85-92% Match', count: 485 },
          { range: '92-96% Match', count: 115 },
          { range: '96-98% Match', count: 5 },
          { range: '98%+ Match', count: 0 }
        ]
      : [
          { range: '0-50% Match', count: 4256 },
          { range: '50-65% Match', count: 835 },
          { range: '65-75% Match', count: 83 },
          { range: '75-85% Match', count: 1 },
          { range: '85-92% Match', count: 0 },
          { range: '92-96% Match', count: 0 },
          { range: '96-98% Match', count: 0 },
          { range: '98%+ Match', count: 0 }
        ],
    analogSites: isMars
      ? [
          {
            id: 'M-01',
            earthLocation: 'Jemez Caldera C3 (r00384 c01408)',
            earthCountry: 'New Mexico (USA)',
            targetLocation: 'Jezero Crater CTX Mosaic 6m (Ares Vallis proxy)',
            targetBody: 'Mars',
            overallMatchScore: 97.33,
            mineralMatch: 96.8,
            terrainMatch: 98.1,
            climateProxyMatch: 94.5,
            keyAnalogFactor: 'High-silica volcanic tuff & hydrothermal alteration resembling Jezero crater rim',
            status: 'Verified Match',
            earthImageUrl: '/images/patches/01_tierra__GLORTHO_NM_26June2018_Jimez2_c3r13_ortho_r00384_c01408.png',
            googleMapsUrl: 'https://www.google.com/maps?q=35.793969,-106.779540&t=k',
            earthCoordinates: '35.7940° N, 106.7795° W'
          },
          {
            id: 'M-02',
            earthLocation: 'Jemez Volcanic Field C0 (r01280 c01152)',
            earthCountry: 'New Mexico (USA)',
            targetLocation: 'Jezero Crater CTX Mosaic 6m (Sedimentary delta)',
            targetBody: 'Mars',
            overallMatchScore: 91.25,
            mineralMatch: 90.4,
            terrainMatch: 92.6,
            climateProxyMatch: 89.8,
            keyAnalogFactor: 'Basaltic ash fall & layered pyroclastic beds matching delta sediments',
            status: 'Verified Match',
            earthImageUrl: '/images/patches/02_tierra__GLORTHO_NM_22June2018_am_Jemez_c0r14_ortho_r01280_c01152.png',
            googleMapsUrl: 'https://www.google.com/maps?q=35.708584,-106.646929&t=k',
            earthCoordinates: '35.7086° N, 106.6469° W'
          }
        ]
      : [
          {
            id: 'L-01',
            earthLocation: 'Jemez Caldera C3 (r00128 c01408)',
            earthCountry: 'New Mexico (USA)',
            targetLocation: 'LRO NAC Shaded Relief (00N 234E 150cm)',
            targetBody: 'Moon',
            overallMatchScore: 76.24,
            mineralMatch: 74.1,
            terrainMatch: 78.5,
            climateProxyMatch: 68.2,
            keyAnalogFactor: 'Impact-crater-like caldera rim with pulverized volcanic tuff regolith',
            status: 'Verified Match',
            earthImageUrl: '/images/patches/01_tierra__GLORTHO_NM_26June2018_Jimez2_c3r13_ortho_r00128_c01408.png',
            googleMapsUrl: 'https://www.google.com/maps?q=35.795123,-106.779540&t=k',
            earthCoordinates: '35.7951° N, 106.7795° W'
          }
        ],
    pipelineLogs: [
      `[00.01s] Planetary Analog Pipeline active: Earth with ${targetBody}`,
      `[00.03s] Registered active GeoTIFF input from backend/Roberto/Tiff/`,
      `[00.05s] Multivariate Bhattacharyya distance evaluated across 5,175 orthophoto patches.`,
      `[00.08s] Pipeline results synced successfully.`
    ]
  };
};
