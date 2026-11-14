
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
