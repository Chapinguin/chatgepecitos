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
      ? 'Planetary Analog Model calibrated for Earth with Mars. Prime matches identified in hyper-arid perchlorate basins and volcanic basalt provinces.'
      : 'Planetary Analog Model calibrated for Earth with Moon. Highest correlation established for lunar south pole permanent base locations and basaltic lava tubes.',
    variables: isMars
      ? [
          {
            name: 'Primary Spectral Match',
            key: 'spectral_match',
            value: 89.4,
            unit: '%',
            change: '+3.2%',
            status: 'optimal',
            category: 'Mineralogy & Spectra',
            description: 'Correlation in ferric oxide and hematite absorption bands.'
          },
          {
            name: 'Overall Analog Fidelity',
            key: 'analog_fidelity',
            value: 87.2,
            unit: '%',
            change: '+1.8%',
            status: 'optimal',
            category: 'General Match',
            description: 'Composite analog similarity index with Martian crust.'
          },
          {
            name: 'Hematite & Clay Ratio',
            key: 'hematite_clay',
            value: 0.784,
            unit: 'index',
            change: '+0.04',
            status: 'match',
            category: 'Mineralogy & Spectra',
            description: 'Key mineral proxy for past lacustrine conditions in Jezero Crater.'
          },
          {
            name: 'Regolith Porosity Void',
            key: 'regolith_porosity',
            value: 0.412,
            unit: 'e',
            status: 'match',
            category: 'Geomechanics',
            description: 'Soil compressibility and particle sorting match with Martian soils.'
          },
          {
            name: 'Thermal Inertia Correlation',
            key: 'thermal_inertia',
            value: 385,
            unit: 'J/(m²·K·s½)',
            status: 'match',
            category: 'Thermodynamics',
            description: 'Diurnal surface heating and cooling curve matching.'
          },
          {
            name: 'UV Flux Proxy Exposure',
            key: 'uv_flux_proxy',
            value: 12.8,
            unit: 'W/m²',
            status: 'match',
            category: 'Environmental',
            description: 'Extreme solar irradiance penetration benchmarked at high altitude.'
          }
        ]
      : [
          {
            name: 'Anorthosite Highland Match',
            key: 'anorthosite_match',
            value: 93.6,
            unit: '%',
            change: '+2.4%',
            status: 'optimal',
            category: 'Mineralogy & Spectra',
            description: 'Highland crust analog benchmarked to Apollo 16 lunar return samples.'
          },
          {
            name: 'Permanent Shadow Ice Proxy',
            key: 'psr_ice_proxy',
            value: 88.1,
            unit: '%',
            change: '+5.1%',
            status: 'optimal',
            category: 'Ice & Volatiles',
            description: 'Cold trap volatile proxy for Shackleton and Faustini crater bases.'
          },
          {
            name: 'Ilmenite (Titanium) Content',
            key: 'ilmenite_conc',
            value: 14.2,
            unit: 'wt %',
            status: 'match',
            category: 'Mineralogy & Spectra',
            description: 'Titanium-rich lunar mare regolith analog correlation.'
          },
          {
            name: 'Micrometeorite Abrasion Index',
            key: 'abrasion_index',
            value: 78.5,
            unit: 'index',
            status: 'match',
            category: 'Geomorphology',
            description: 'Mechanical weathering and regolith grain roundness metric.'
          },
          {
            name: 'Lava Tube Structural Stability',
            key: 'lava_tube_factor',
            value: 0.925,
            unit: 'safety factor',
            status: 'optimal',
            category: 'Habitability',
            description: 'Ceiling integrity metric for Marius Hills pit base development.'
          },
          {
            name: 'Electrostatic Dust Levitation',
            key: 'dust_cohesion',
            value: 0.615,
            unit: 'kPa',
            status: 'match',
            category: 'Geomechanics',
            description: 'Fine lunar simulant cohesion proxy under dry vacuum condition.'
          }
        ],
    layerMetrics: isMars
      ? [
          { layer: 'Band 1 (Blue)', index: 1, matchScore: 74.5, spectralFidelity: 82.1, roughnessIndex: 1.42, mineralConfidence: 78 },
          { layer: 'Band 2 (Green)', index: 2, matchScore: 81.2, spectralFidelity: 85.4, roughnessIndex: 1.55, mineralConfidence: 83 },
          { layer: 'Band 3 (Red)', index: 3, matchScore: 94.8, spectralFidelity: 96.2, roughnessIndex: 1.88, mineralConfidence: 95 },
          { layer: 'Band 4 (NIR 1)', index: 4, matchScore: 91.5, spectralFidelity: 93.8, roughnessIndex: 1.72, mineralConfidence: 92 },
          { layer: 'Band 5 (SWIR 1)', index: 5, matchScore: 88.4, spectralFidelity: 89.5, roughnessIndex: 1.91, mineralConfidence: 89 },
          { layer: 'Band 6 (SWIR 2)', index: 6, matchScore: 86.2, spectralFidelity: 87.0, roughnessIndex: 1.65, mineralConfidence: 85 },
          { layer: 'Band 7 (Thermal)', index: 7, matchScore: 82.9, spectralFidelity: 84.1, roughnessIndex: 2.05, mineralConfidence: 81 },
          { layer: 'Band 8 (Ferric)', index: 8, matchScore: 96.3, spectralFidelity: 97.5, roughnessIndex: 1.79, mineralConfidence: 98 }
        ]
      : [
          { layer: 'Band 1 (UV)', index: 1, matchScore: 79.2, spectralFidelity: 84.0, roughnessIndex: 2.10, mineralConfidence: 82 },
          { layer: 'Band 2 (415nm)', index: 2, matchScore: 86.5, spectralFidelity: 88.2, roughnessIndex: 2.25, mineralConfidence: 87 },
          { layer: 'Band 3 (750nm)', index: 3, matchScore: 92.4, spectralFidelity: 94.1, roughnessIndex: 2.40, mineralConfidence: 93 },
          { layer: 'Band 4 (900nm Pyroxene)', index: 4, matchScore: 96.8, spectralFidelity: 98.2, roughnessIndex: 2.35, mineralConfidence: 97 },
          { layer: 'Band 5 (950nm Ilmenite)', index: 5, matchScore: 94.2, spectralFidelity: 95.5, roughnessIndex: 2.15, mineralConfidence: 95 },
          { layer: 'Band 6 (1000nm NIR)', index: 6, matchScore: 91.0, spectralFidelity: 92.8, roughnessIndex: 2.05, mineralConfidence: 90 },
          { layer: 'Band 7 (Albedo Ratio)', index: 7, matchScore: 88.7, spectralFidelity: 89.9, roughnessIndex: 2.50, mineralConfidence: 88 },
          { layer: 'Band 8 (Polar Volatiles)', index: 8, matchScore: 95.1, spectralFidelity: 97.0, roughnessIndex: 2.65, mineralConfidence: 96 }
        ],
    histogram: isMars
      ? [
          { range: '0-50% Match', count: 120 },
          { range: '50-65% Match', count: 480 },
          { range: '65-75% Match', count: 1250 },
          { range: '75-85% Match', count: 3400 },
          { range: '85-92% Match', count: 5800 },
          { range: '92-96% Match', count: 4100 },
          { range: '96-98% Match', count: 1850 },
          { range: '98%+ Match', count: 620 }
        ]
      : [
          { range: '0-50% Match', count: 90 },
          { range: '50-65% Match', count: 390 },
          { range: '65-75% Match', count: 980 },
          { range: '75-85% Match', count: 2950 },
          { range: '85-92% Match', count: 6400 },
          { range: '92-96% Match', count: 4900 },
          { range: '96-98% Match', count: 2200 },
          { range: '98%+ Match', count: 810 }
        ],
    analogSites: isMars
      ? [
          {
            id: 'M-01',
            earthLocation: 'Atacama Desert (Yungay Basin)',
            earthCountry: 'Chile',
            targetLocation: 'Jezero Crater',
            targetBody: 'Mars',
            overallMatchScore: 94.2,
            mineralMatch: 96.5,
            terrainMatch: 92.0,
            climateProxyMatch: 94.1,
            keyAnalogFactor: 'Hyper-aridity & perchlorate salt deposits',
            status: 'High Match'
          },
          {
            id: 'M-02',
            earthLocation: 'Rio Tinto Basin',
            earthCountry: 'Spain',
            targetLocation: 'Meridiani Planum',
            targetBody: 'Mars',
            overallMatchScore: 91.8,
            mineralMatch: 95.2,
            terrainMatch: 88.4,
            climateProxyMatch: 91.8,
            keyAnalogFactor: 'Acidic ferric sulfate & jarosite mineralization',
            status: 'High Match'
          },
          {
            id: 'M-03',
            earthLocation: 'Devon Island (Haughton Crater)',
            earthCountry: 'Canada',
            targetLocation: 'Gale Crater',
            targetBody: 'Mars',
            overallMatchScore: 89.5,
            mineralMatch: 86.2,
            terrainMatch: 93.4,
            climateProxyMatch: 88.9,
            keyAnalogFactor: 'Impact cratering in polar desert permafrost',
            status: 'High Match'
          },
          {
            id: 'M-04',
            earthLocation: 'McMurdo Dry Valleys',
            earthCountry: 'Antarctica',
            targetLocation: 'Valles Marineris Slopes',
            targetBody: 'Mars',
            overallMatchScore: 88.4,
            mineralMatch: 84.1,
            terrainMatch: 91.2,
            climateProxyMatch: 89.9,
            keyAnalogFactor: 'Cold-dry boundary & endolithic microorganism niches',
            status: 'High Match'
          }
        ]
      : [
          {
            id: 'L-01',
            earthLocation: 'Haleakala Volcanic Complex',
            earthCountry: 'Hawaii (USA)',
            targetLocation: 'Shackleton Crater Base',
            targetBody: 'Moon',
            overallMatchScore: 95.8,
            mineralMatch: 97.2,
            terrainMatch: 94.8,
            climateProxyMatch: 95.4,
            keyAnalogFactor: 'Weathered basaltic ash & cinder field morphology',
            status: 'High Match'
          },
          {
            id: 'L-02',
            earthLocation: 'Lanzarote Volcanic Geopark',
            earthCountry: 'Spain',
            targetLocation: 'Marius Hills Lava Tube',
            targetBody: 'Moon',
            overallMatchScore: 93.1,
            mineralMatch: 95.5,
            terrainMatch: 92.8,
            climateProxyMatch: 91.0,
            keyAnalogFactor: 'Pristine basaltic tubes for subterranean habitats',
            status: 'High Match'
          },
          {
            id: 'L-03',
            earthLocation: 'Cinder Lake Crater Field',
            earthCountry: 'Arizona (USA)',
            targetLocation: 'Oceanus Procellarum',
            targetBody: 'Moon',
            overallMatchScore: 92.4,
            mineralMatch: 94.0,
            terrainMatch: 91.5,
            climateProxyMatch: 91.7,
            keyAnalogFactor: 'Artificially cratered lunar rover training terrain',
            status: 'High Match'
          },
          {
            id: 'L-04',
            earthLocation: 'Kilbourne Hole Maar',
            earthCountry: 'New Mexico (USA)',
            targetLocation: 'Fra Mauro Highlands',
            targetBody: 'Moon',
            overallMatchScore: 88.7,
            mineralMatch: 91.2,
            terrainMatch: 87.4,
            climateProxyMatch: 87.5,
            keyAnalogFactor: 'Xenolith mantle ejecta & deep regolith analogs',
            status: 'High Match'
          }
        ],
    pipelineLogs: [
      `[00.01s] Planetary Analog Pipeline active: Earth with ${targetBody}`,
      `[00.03s] Reading multispectral variables from repo CSV`,
      `[00.05s] Spectral index & geomechanical cross-correlation complete`,
      `[00.08s] High match confidence verified across target analog sites.`
    ]
  };
};
