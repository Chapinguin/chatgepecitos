# Scientific data processing — Planetary Analog Explorer

Módulo local e independiente del frontend. No requiere conexión a Internet.

## Funciones

- `load_catalog(path)`: lee catálogo JSON o CSV tabular (una fila por variable).
- `validate_region(region)`: valida estructura, coordenadas, variables, procedencia y espectros opcionales; devuelve copia.
- `validate_catalog(regions)`: detecta registros inválidos e IDs duplicados; devuelve informe.
- `filter_regions(regions, body=None, query=None)`: filtra por cuerpo o texto.
- `normalize_environment(region, ranges)`: conserva valores originales y aplica min-max a [0,100] usando reglas explícitas y unidades coincidentes.
- `prepare_spectral(region)`: devuelve espectro opcional con bandas crecientes; NO realiza SAM ni calibración.
- `save_json(path, data)`: serializa resultados.

## Estructura

`data/catalog.json` incluye ejemplos **sintéticos** de Tierra, Marte y Luna. Son solo pruebas: sus nombres y coordenadas NO identifican sitios verificados. `data/normalization_rules.json` contiene rangos ilustrativos, NO parámetros científicos oficiales.

Cada región contiene `id`, `name`, `body` (`earth`, `mars`, `moon`), `coordinates` (`lat`, `lon` en grados), `variables` con `value`, `unit`, `kind` (`observed`, `derived`, `synthetic`) y `source`. Para datos observados o derivados se exigen `organization`, `dataset`, `product_id` e `instrument`. Para espectros opcionales: `spectral.wavelength_nm` y `spectral.reflectance`.

## Uso desde la raíz del repositorio

```bash
python -m unittest discover -s backend/data_processing/tests -p 'test_scientific.py' -v
```

## Fórmula

`normalized = 100 * (value - min) / (max - min)` con `min < max` y `min <= value <= max`. No se modifican los datos originales. Las reglas y unidades se registran en la salida para reproducibilidad.

## Limitaciones y pendientes de integración

- Los datos incluidos son **sintéticos**. Antes de declarar el Issue científicamente terminado, incorporar productos reales descargados de fuentes verificables con misión, instrumento, fecha, identificador de producto y licencia cuando corresponda.
- No hay conversión automática de unidades ni reproyección de coordenadas planetarias; los rangos son ilustrativos.
- El formato de entrada ambiental y espectral es provisional; acordar contratos con `feature/environmental-analysis`, `feature/spectral-analysis` y `feature/backend-api`.
- El espectro debe estar calibrado y ser comparable en longitudes de onda y unidades antes de aplicar SAM. La mera presencia de bandas no garantiza compatibilidad instrumental.
- `load_catalog` no lee GeoTIFF; el lector existente de Rasterio en `backend/analog_matcher.py` puede integrarse mediante un adaptador sin duplicar algoritmos.
- El catálogo CSV requiere encabezados `id,name,body,lat,lon,variable,value,unit,kind`; columnas opcionales `organization,dataset,product_id,instrument`.
