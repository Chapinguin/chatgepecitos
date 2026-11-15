
import json
import csv
from pathlib import Path


def cargar_json(ruta):
    ruta = Path(ruta)

    if not ruta.is_file():
        raise FileNotFoundError(f"No existe el archivo: {ruta}")

    with ruta.open("r", encoding="utf-8") as archivo:
        return json.load(archivo)


def cargar_csv(ruta):
    ruta = Path(ruta)

    if not ruta.is_file():
        raise FileNotFoundError(f"No existe el archivo: {ruta}")

    with ruta.open("r", encoding="utf-8-sig", newline="") as archivo:
        lector = csv.DictReader(archivo)

        if lector.fieldnames is None:
            raise ValueError("El CSV no contiene encabezados.")

        return list(lector)
    
    def cargar_geojson(ruta):
        datos = cargar_json(ruta)
        
        if not isinstance(datos, dict):
                raise ValueError("El GeoJSON debe ser un objeto.")
            
        if datos.get("type") != "FeatureCollection":
                raise ValueError("Se esperaba un FeatureCollection.")
        features = datos.get("features")
            
        if not isinstance(features, list):
                raise ValueError("El GeoJSON no contiene una lista de features.")
            
        identificadores = set()
            
        for feature in features:
                if not isinstance(feature, dict):
                    raise ValueError("Feature invalida.")
                
                propiedades = feature.get("properties")
                geometria = feature.get("geometry")
                
                if not isinstance(propiedades, dict):
                    raise ValueError("Faltan propiedades.")
                
                
                identificador = propiedades.get("patch_id")
                
                
                if not isinstance(identificador, str) or not identificador.strip():
                    raise ValueError("Identificador invalido.")
                
                if identificador in identificadores:
                    raise ValueError("Identificador duplicado.")
                
                identificadores.add(identificador)
                
                if not isinstance(geometria, dict):
                    raise ValueError("Geometria invalida.")
                    
                    return features

def cargar_geojson(ruta):
    datos = cargar_json(ruta)

    if not isinstance(datos, dict):
        raise ValueError("El GeoJSON debe ser un objeto.")

    if datos.get("type") != "FeatureCollection":
        raise ValueError("Se esperaba un FeatureCollection.")

    features = datos.get("features")

    if not isinstance(features, list):
        raise ValueError("El GeoJSON no contiene una lista de features.")

    identificadores = set()

    for feature in features:
        if not isinstance(feature, dict):
            raise ValueError("Feature invalida.")

        propiedades = feature.get("properties")
        geometria = feature.get("geometry")

        if not isinstance(propiedades, dict):
            raise ValueError("Faltan propiedades.")

        identificador = propiedades.get("patch_id")

        if not isinstance(identificador, str) or not identificador.strip():
            raise ValueError("Identificador invalido.")

        if identificador in identificadores:
            raise ValueError("Identificador duplicado.")

        identificadores.add(identificador)

        if not isinstance(geometria, dict):
            raise ValueError("Geometria invalida.")

    return features
