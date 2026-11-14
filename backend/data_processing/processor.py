
from pathlib import Path
from .loader import cargar_json, cargar_csv
from .validator import validar_region
from .normalizer import normalizar_variables


def procesar_region(ruta, rangos):
    ruta = Path(ruta)

    if ruta.suffix.lower() == ".json":
        datos = cargar_json(ruta)
    elif ruta.suffix.lower() == ".csv":
        datos = cargar_csv(ruta)
    else:
        raise ValueError("Formato no compatible.")

    if isinstance(datos, dict):
        datos = [datos]

    if not isinstance(datos, list):
        raise ValueError("Se esperaba una lista de regiones.")

    resultados = []

    for region in datos:
        region_validada = validar_region(region)

        variables = normalizar_variables(
            region_validada,
            rangos
        )

        resultados.append({
            "id": region_validada["id"],
            "nombre": region_validada["nombre"],
            "tipo": region_validada["tipo"],
            "variables_originales": {
                variable: region_validada[variable]
                for variable in rangos
            },
            "variables_normalizadas": variables
        })

    return resultados
