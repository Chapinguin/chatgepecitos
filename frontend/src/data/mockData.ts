import type { AnalysisResult } from '../types';

export const sampleDatasets: { id: string; label: string; size: string; description: string }[] = [
  {
    id: 'sample_specimen_01.tiff',
    label: 'Muestra Biológica Z-Stack (1.2 GB)',
    size: '1.24 GB',
    description: '16 capas multicanal con tinción fluorescente'
  },
  {
    id: 'scan_spectrometry_b.tiff',
    label: 'Escaneo Hiperespectral Suelo B (3.8 GB)',
    size: '3.81 GB',
    description: '32 bandas espectrales para análisis de densidad mineral'
  },
  {
    id: 'satellite_deep_field.tiff',
    label: 'Teledetección Satelital Zona Norte (2.1 GB)',
    size: '2.15 GB',
    description: 'Captura multiespectral 8-bandas con calibración radiométrica'
  }
];

export const generateMockResult = (filename: string, algorithm: string): AnalysisResult => {
  const isSpectral = filename.includes('spectrometry');
  
  return {
    jobId: `job_${Math.random().toString(36).substring(2, 9)}`,
    filename,
    fileSizeBytes: filename.includes('3.8') ? 3810000000 : 1240000000,
    processedAt: new Date().toISOString(),
    durationSeconds: Number((Math.random() * 8 + 4).toFixed(2)),
    status: 'completed',
    summary: `Procesamiento completado con éxito mediante el algoritmo [${algorithm}]. Se identificaron 12 variables principales con significancia estadística elevada y una tasa de relación señal/ruido del 94.2%.`,
    variables: [
      {
        name: 'Densidad Promedio Estimada',
        key: 'mean_density',
        value: (Math.random() * 0.4 + 0.65).toFixed(3),
        unit: 'g/cm³',
        change: '+4.2%',
        status: 'normal',
        category: 'Métricas Primarias',
        description: 'Concentración volumétrica ponderada a través de las capas TIFF.'
      },
      {
        name: 'Intensidad Espectral Media',
        key: 'mean_intensity',
        value: Math.floor(Math.random() * 8000 + 14000),
        unit: 'a.u. (16-bit)',
        change: '+11.8%',
        status: 'normal',
        category: 'Métricas Primarias',
        description: 'Promedio de valores de píxel descartando fondo nulo.'
      },
      {
        name: 'Varianza de Textura (GLCM)',
        key: 'glcm_variance',
        value: (Math.random() * 12 + 45.2).toFixed(2),
        unit: 'σ²',
        change: '-2.1%',
        status: 'info',
        category: 'Morfología y Textura',
        description: 'Medida de dispersión de la matriz de co-ocurrencia en escala de grises.'
      },
      {
        name: 'Conteo de Regiones de Interés (ROIs)',
        key: 'roi_count',
        value: Math.floor(Math.random() * 400 + 820),
        unit: 'objetos',
        change: '+8.5%',
        status: 'normal',
        category: 'Morfología y Textura',
        description: 'Elementos segmentados que superan el umbral adaptativo local.'
      },
      {
        name: 'Índice de Entropía Espacial',
        key: 'spatial_entropy',
        value: (Math.random() * 0.8 + 4.12).toFixed(3),
        unit: 'bits',
        change: '+0.4%',
        status: 'normal',
        category: 'Teoría de Información',
        description: 'Heterogeneidad y complejidad de distribución espacial.'
      },
      {
        name: 'Ratio Señal a Ruido (SNR)',
        key: 'snr_db',
        value: (Math.random() * 5 + 24.3).toFixed(1),
        unit: 'dB',
        change: '+1.9 dB',
        status: 'normal',
        category: 'Calidad de Imagen',
        description: 'Calidad del sensor y efectividad del filtrado gaussiano.'
      },
      {
        name: 'Gradiente Máximo de Borde',
        key: 'edge_gradient_max',
        value: (Math.random() * 50 + 210.4).toFixed(1),
        unit: '∇I',
        change: '+6.1%',
        status: 'warning',
        category: 'Morfología y Textura',
        description: 'Picos de intensidad en transiciones detectados por filtro Sobel.'
      },
      {
        name: 'Índice de Anisotropía',
        key: 'anisotropy_index',
        value: (Math.random() * 0.3 + 0.42).toFixed(3),
        unit: 'scalar [0-1]',
        status: 'info',
        category: 'Geometría',
        description: 'Direccionalidad preferencial de las estructuras analizadas.'
      },
      {
        name: 'Factor de Dilución / Absorción',
        key: 'absorption_coeff',
        value: (Math.random() * 0.05 + 0.18).toFixed(4),
        unit: 'cm⁻¹',
        change: '-5.3%',
        status: 'critical',
        category: 'Métricas Primarias',
        description: 'Coeficiente estimado por modelo de regresión óptica.'
      },
      {
        name: 'Coeficiente de Correlación de Pearson',
        key: 'pearson_corr',
        value: (Math.random() * 0.15 + 0.82).toFixed(3),
        unit: 'r',
        status: 'normal',
        category: 'Correlación',
        description: 'Consistencia cruzada entre canal rojo/infrarrojo.'
      }
    ],
    layerMetrics: Array.from({ length: 8 }, (_, i) => ({
      layer: `Capa ${i + 1}`,
      index: i + 1,
      intensity: Math.floor(Math.sin((i + 1) / 2) * 4000 + 16000 + Math.random() * 800),
      density: Number((Math.cos(i) * 0.15 + 0.72 + Math.random() * 0.05).toFixed(3)),
      noiseRatio: Number((Math.random() * 0.04 + 0.02).toFixed(3)),
      particlesDetected: Math.floor(Math.random() * 120 + 80)
    })),
    histogram: [
      { range: '0-32k', count: 1420 },
      { range: '32-40k', count: 4890 },
      { range: '40-48k', count: 12500 },
      { range: '48-56k', count: 28400 },
      { range: '56-64k', count: 19300 },
      { range: '64-72k', count: 8700 },
      { range: '72-80k', count: 3200 },
      { range: '80k+', count: 890 }
    ],
    pipelineLogs: [
      `[00.12s] Inicializando lector TIFF (memmap habilitado para archivos >1GB)...`,
      `[00.85s] Cabecera TIFF validada: ${filename} (8 canales, 16-bit unsigned).`,
      `[01.42s] Aplicando transformada rápida de Fourier para corrección de deriva.`,
      `[02.10s] Ejecutando algoritmo de extracción con backend NumPy/Scipy/PyTorch...`,
      `[03.65s] Segmentando ${isSpectral ? 'bandas espectrales' : 'estructuras morfológicas'}.`,
      `[04.80s] Calculando matrices de covarianzas y variables descriptivas...`,
      `[05.15s] Reducción dimensional completada. Serializando JSON de resultados.`
    ]
  };
};
