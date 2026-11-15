# Issue 5 — Environmental Similarity Engine

Motor determinista de comparación ambiental entre regiones terrestres y referencias de Marte o Luna.

## Ejecución local

Desde la raíz del repositorio:

```bash
python -m unittest discover -s backend/environmental_analysis/tests -p 'test_*.py' -v
python -m backend.environmental_analysis.run --demo --target mars
python -m backend.environmental_analysis.run --demo --target moon --output out/environmental_similarity_moon.json
```

La CLI escribe JSON en `out/`. La opción `--demo` permite expresamente los registros **sintéticos** de Issue 6; sin ella se rechazan. Para utilizar observaciones reales, incorporar registros con metadatos de procedencia completos al catálogo del Issue 6.

## API

`compare_regions(candidate, reference, rules, weights=None, missing='error', allow_synthetic=False)` devuelve puntuación 0–100, cobertura, variables usadas, distancias, unidades, procedencia y advertencia de datos sintéticos. `rank_candidates(...)` ordena los candidatos, devuelve errores por región y permite `limit`.

La distancia por variable es `abs((earth-min)/(max-min) - (target-min)/(max-min))`. La distancia global es la media ponderada de las distancias disponibles y el índice es `100*(1-distancia_global)`. Los rangos son los declarados en `normalization_rules.json`, **ilustrativos, no calibrados**. Se exige coincidencia exacta de unidades; no se hacen conversiones implícitas. En `missing='skip'` se renormalizan los pesos y se informa `coverage`.

## Limitaciones importantes

- **No** se interpreta la puntuación como probabilidad, precisión de predicción ni validación científica.
- Los 5,175 polígonos de `out/analogues.geojson` no incluyen por sí solos las mediciones ambientales y unidades exigidas por este motor; no es correcto usarlos directamente como candidatos ambientales.
- Las temperaturas superficiales deben compararse con igual definición, contexto temporal y condiciones observacionales; no basta con compartir unidad.
- Se necesita integración de datos reales NASA/terrestres con procedencia antes de producir resultados científicos.
