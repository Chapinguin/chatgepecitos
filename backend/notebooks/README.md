# Guía para el equipo de Python y Jupyter (.ipynb)

Para que sus experimentos en Jupyter Notebooks se sincronicen directamente con la app de React sin tener que reescribir código en el hackathon:

### 1. Importar el pipeline directamente en el Notebook:
```python
import sys
sys.path.append("..")
from pipeline import extract_variables_from_tiff

# Probar con su archivo TIFF
resultado = extract_variables_from_tiff(
    filepath="ruta/a/su_archivo.tiff",
    algorithm="GLCM + Segmentación Adaptativa",
    threshold=2.5
)

# Visualizar el diccionario de variables
print("Variables extraídas:", resultado["variables"])
```

### 2. ¿Cómo agregar nuevas variables al frontend?
Simplemente editen la lista `variables` en `backend/pipeline.py` agregando su nueva métrica:
```python
{
    "name": "Mi Nueva Métrica",
    "key": "mi_metrica_key",
    "value": 42.0,
    "unit": "mg/L",
    "status": "normal",  # 'normal' | 'warning' | 'critical' | 'info'
    "category": "Análisis Químico",
    "description": "Explicación breve de la variable calculada."
}
```
¡El frontend de React la detectará y mostrará automáticamente en la tabla, tarjetas y en el asistente de chat!

