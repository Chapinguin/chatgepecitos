
import json
import tempfile
from pathlib import Path

from backend.data_processing.processor import procesar_region


def test_procesamiento():
    datos = {
        "id": "earth_test_001",
        "nombre": "Region terrestre de prueba",
        "temperatura": 25,
        "tipo": "synthetic"
    }

    rangos = {
        "temperatura": (-100, 100)
    }

    with tempfile.TemporaryDirectory() as carpeta:
        ruta = Path(carpeta) / "prueba.json"

        with ruta.open("w", encoding="utf-8") as archivo:
            json.dump(datos, archivo)

        resultado = procesar_region(ruta, rangos)

    assert len(resultado) == 1
    assert resultado[0]["variables_normalizadas"]["temperatura"] == 62.5

    print("PRUEBA EXITOSA: procesamiento completo")


if __name__ == "__main__":
    test_procesamiento()
