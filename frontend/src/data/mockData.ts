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
      ? 'Planetary Analog Model calibrated for Earth with Mars (Jemez, NM vs HiRISE Sojourner). Awaiting numerical outputs from backend pipeline execution.'
      : 'Planetary Analog Model calibrated for Earth with Moon (Jemez, NM vs LRO NAC). Awaiting numerical outputs from backend pipeline execution.',
    variables: isMars
      ? [
          {
            name: 'Primary Spectral Match',
            key: 'spectral_match',
            value: 0.0,
            unit: '%',
            change: '--',
            status: 'pending',
            category: 'Mineralogy & Spectra',
            description: 'Awaiting Python backend calculation across HiRISE & Jemez bands.'
          },
          {
            name: 'Overall Analog Fidelity',
            key: 'analog_fidelity',
            value: 0.0,
            unit: '%',
            change: '--',
            status: 'pending',
            category: 'General Match',
            description: 'Composite similarity index between Earth sites and Martian terrain.'
          },
          {
            name: 'Hematite & Clay Ratio',
            key: 'hematite_clay',
            value: 0.000,
            unit: 'ratio',
            change: '--',
            status: 'pending',
            category: 'Mineralogy & Spectra',
            description: 'Key mineral proxy for past lacustrine conditions in Jezero Crater.'
          },
          {
            name: 'Regolith Porosity Void Ratio',
            key: 'regolith_porosity',
            value: 0.000,
            unit: 'void ratio',
            change: '--',
            status: 'pending',
            category: 'Geomechanics',
            description: 'Soil compressibility and particle sorting match with Martian soils.'
          },
          {
            name: 'UV Radiation Exposure Proxy',
            key: 'uv_flux_proxy',
            value: 0.0,
            unit: 'W/m²',
            change: '--',
            status: 'pending',
            category: 'Environmental',
            description: 'Solar irradiance penetration proxy benchmarked at high altitude.'
          },
          {
            name: 'Thermal Inertia Index',
            key: 'thermal_inertia',
            value: 0,
            unit: 'J/(m²·K·s½)',
            change: '--',
            status: 'pending',
            category: 'Thermodynamics',
            description: 'Diurnal surface heating and cooling curve matching.'
          }
        ]
      : [
          {
            name: 'Anorthosite Highland Match',
            key: 'anorthosite_match',
            value: 0.0,
            unit: '%',
            change: '--',
            status: 'pending',
            category: 'Mineralogy & Spectra',
            description: 'Highland lunar crust analog benchmarked to Apollo 16 lunar return samples.'
          },
          {
            name: 'Permanent Shadow Ice Proxy',
            key: 'psr_ice_proxy',
            value: 0.0,
            unit: '%',
            change: '--',
            status: 'pending',
            category: 'Ice & Volatiles',
            description: 'Cold trap volatile proxy for Shackleton and Faustini crater bases.'
          },
          {
            name: 'Ilmenite (Titanium) Content',
            key: 'ilmenite_conc',
            value: 0.0,
            unit: 'wt %',
            change: '--',
            status: 'pending',
            category: 'Mineralogy & Spectra',
            description: 'Titanium-rich lunar mare regolith analog correlation.'
          },
          {
            name: 'Micrometeorite Abrasion Index',
            key: 'abrasion_index',
            value: 0.0,
            unit: 'index',
            change: '--',
            status: 'pending',
            category: 'Geomorphology',
            description: 'Mechanical weathering and regolith grain roundness metric.'
          },
          {
            name: 'Lava Tube Structural Stability',
            key: 'lava_tube_factor',
            value: 0.000,
            unit: 'safety factor',
            change: '--',
            status: 'pending',
            category: 'Habitability',
            description: 'Ceiling integrity metric for Marius Hills pit base development.'
          },
          {
            name: 'Electrostatic Dust Levitation',
            key: 'dust_cohesion',
            value: 0.000,
            unit: 'kPa',
            change: '--',
            status: 'pending',
            category: 'Geomechanics',
            description: 'Fine lunar simulant cohesion proxy under dry vacuum condition.'
          }
        ],
    layerMetrics: isMars
      ? [
          { layer: 'Band 1 (Blue)', index: 1, matchScore: 0, spectralFidelity: 0, roughnessIndex: 1.42, mineralConfidence: 0 },
          { layer: 'Band 2 (Green)', index: 2, matchScore: 0, spectralFidelity: 0, roughnessIndex: 1.55, mineralConfidence: 0 },
          { layer: 'Band 3 (Red)', index: 3, matchScore: 0, spectralFidelity: 0, roughnessIndex: 1.88, mineralConfidence: 0 },
          { layer: 'Band 4 (NIR 1)', index: 4, matchScore: 0, spectralFidelity: 0, roughnessIndex: 1.72, mineralConfidence: 0 },
          { layer: 'Band 5 (SWIR 1)', index: 5, matchScore: 0, spectralFidelity: 0, roughnessIndex: 1.91, mineralConfidence: 0 },
          { layer: 'Band 6 (SWIR 2)', index: 6, matchScore: 0, spectralFidelity: 0, roughnessIndex: 1.65, mineralConfidence: 0 },
          { layer: 'Band 7 (Thermal)', index: 7, matchScore: 0, spectralFidelity: 0, roughnessIndex: 2.05, mineralConfidence: 0 },
          { layer: 'Band 8 (Ferric)', index: 8, matchScore: 0, spectralFidelity: 0, roughnessIndex: 1.79, mineralConfidence: 0 }
        ]
      : [
          { layer: 'Band 1 (UV)', index: 1, matchScore: 0, spectralFidelity: 0, roughnessIndex: 2.10, mineralConfidence: 0 },
          { layer: 'Band 2 (415nm)', index: 2, matchScore: 0, spectralFidelity: 0, roughnessIndex: 2.25, mineralConfidence: 0 },
          { layer: 'Band 3 (750nm)', index: 3, matchScore: 0, spectralFidelity: 0, roughnessIndex: 2.40, mineralConfidence: 0 },
          { layer: 'Band 4 (900nm Pyroxene)', index: 4, matchScore: 0, spectralFidelity: 0, roughnessIndex: 2.35, mineralConfidence: 0 },
          { layer: 'Band 5 (950nm Ilmenite)', index: 5, matchScore: 0, spectralFidelity: 0, roughnessIndex: 2.15, mineralConfidence: 0 },
          { layer: 'Band 6 (1000nm NIR)', index: 6, matchScore: 0, spectralFidelity: 0, roughnessIndex: 2.05, mineralConfidence: 0 },
          { layer: 'Band 7 (Albedo Ratio)', index: 7, matchScore: 0, spectralFidelity: 0, roughnessIndex: 2.50, mineralConfidence: 0 },
          { layer: 'Band 8 (Polar Volatiles)', index: 8, matchScore: 0, spectralFidelity: 0, roughnessIndex: 2.65, mineralConfidence: 0 }
        ],
    histogram: isMars
      ? [
          { range: '0-50% Match', count: 0 },
          { range: '50-65% Match', count: 0 },
          { range: '65-75% Match', count: 0 },
          { range: '75-85% Match', count: 0 },
          { range: '85-92% Match', count: 0 },
          { range: '92-96% Match', count: 0 },
          { range: '96-98% Match', count: 0 },
          { range: '98%+ Match', count: 0 }
        ]
      : [
          { range: '0-50% Match', count: 0 },
          { range: '50-65% Match', count: 0 },
          { range: '65-75% Match', count: 0 },
          { range: '75-85% Match', count: 0 },
          { range: '85-92% Match', count: 0 },
          { range: '92-96% Match', count: 0 },
          { range: '96-98% Match', count: 0 },
          { range: '98%+ Match', count: 0 }
        ],
    analogSites: isMars
      ? [
          {
            id: 'M-01',
            earthLocation: 'Jemez Volcanic Caldera',
            earthCountry: 'New Mexico (USA)',
            targetLocation: 'Sojourner (Ares Vallis)',
            targetBody: 'Mars',
            overallMatchScore: 0,
            mineralMatch: 0,
            terrainMatch: 0,
            climateProxyMatch: 0,
            keyAnalogFactor: 'Basaltic and rhyolitic volcanic caldera complex',
            status: 'Candidate'
          },
          {
            id: 'M-02',
            earthLocation: 'Atacama Desert (Yungay Basin)',
            earthCountry: 'Chile',
            targetLocation: 'Jezero Crater',
            targetBody: 'Mars',
            overallMatchScore: 0,
            mineralMatch: 0,
            terrainMatch: 0,
            climateProxyMatch: 0,
            keyAnalogFactor: 'Hyper-aridity & perchlorate salt deposits',
            status: 'Candidate'
          },
          {
            id: 'M-03',
            earthLocation: 'Rio Tinto Basin',
            earthCountry: 'Spain',
            targetLocation: 'Meridiani Planum',
            targetBody: 'Mars',
            overallMatchScore: 0,
            mineralMatch: 0,
            terrainMatch: 0,
            climateProxyMatch: 0,
            keyAnalogFactor: 'Acidic ferric sulfate & jarosite mineralization',
            status: 'Candidate'
          }
        ]
      : [
          {
            id: 'L-01',
            earthLocation: 'Jemez Volcanic Caldera',
            earthCountry: 'New Mexico (USA)',
            targetLocation: 'LRO NAC Shaded Terrain (53N 354E)',
            targetBody: 'Moon',
            overallMatchScore: 0,
            mineralMatch: 0,
            terrainMatch: 0,
            climateProxyMatch: 0,
            keyAnalogFactor: 'Impact / caldera volcanic ejecta and crater morphology',
            status: 'Candidate'
          },
          {
            id: 'L-02',
            earthLocation: 'Haleakala Volcanic Complex',
            earthCountry: 'Hawaii (USA)',
            targetLocation: 'Shackleton Crater Base',
            targetBody: 'Moon',
            overallMatchScore: 0,
            mineralMatch: 0,
            terrainMatch: 0,
            climateProxyMatch: 0,
            keyAnalogFactor: 'Weathered basaltic ash & cinder field morphology',
            status: 'Candidate'
          },
          {
            id: 'L-03',
            earthLocation: 'Lanzarote Volcanic Geopark',
            earthCountry: 'Spain',
            targetLocation: 'Marius Hills Lava Tube',
            targetBody: 'Moon',
            overallMatchScore: 0,
            mineralMatch: 0,
            terrainMatch: 0,
            climateProxyMatch: 0,
            keyAnalogFactor: 'Pristine basaltic tubes for subterranean habitats',
            status: 'Candidate'
          }
        ],
    pipelineLogs: [
      `[00.01s] Planetary Analog Pipeline active: Earth with ${targetBody}`,
      `[00.03s] Registered active GeoTIFF input from backend/Roberto/Tiff/`,
      `[00.05s] Variables initialized to zero (0.00). Awaiting backend execution output.`,
      `[00.08s] Pipeline queue ready.`
    ]
  };
};
