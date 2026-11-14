
import csv
import json
import tempfile
from pathlib import Path

from backend.data_processing.loader import cargar_json, cargar_csv


def test_carga_archivos():
    datos = {
        "id": "earth_test_001",
        "nombre": "Region terrestre de prueba",
        "temperatura": 25,
        "tipo": "synthetic"
    }

    with tempfile.TemporaryDirectory() as carpeta:
        ruta_json = Path(carpeta) / "prueba.json"
        ruta_csv = Path(carpeta) / "prueba.csv"

        with ruta_json.open("w", encoding="utf-8") as archivo:
            json.dump(datos, archivo)

        with ruta_csv.open("w", encoding="utf-8", newline="") as archivo:
            escritor = csv.DictWriter(archivo, fieldnames=datos.keys())
            escritor.writeheader()
            escritor.writerow(datos)

        resultado_json = cargar_json(ruta_json)
        resultado_csv = cargar_csv(ruta_csv)

        assert resultado_json["temperatura"] == 25
        assert resultado_csv[0]["temperatura"] == "25"
        assert resultado_csv[0]["id"] == "earth_test_001"

    print("PRUEBA EXITOSA: carga de JSON y CSV")


if __name__ == "__main__":
    test_carga_archivos()
