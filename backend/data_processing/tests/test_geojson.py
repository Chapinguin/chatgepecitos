import unittest
import json
import tempfile
from pathlib import Path

from backend.data_processing.loader import cargar_geojson


class TestGeoJSON(unittest.TestCase):

    def test_cargar_candidatos_reales(self):
        ruta = Path("out/analogues.geojson")
        if not ruta.exists():
            self.skipTest("GeoJSON del equipo no disponible")

        regiones = cargar_geojson(ruta)

        self.assertGreater(len(regiones), 0)
        self.assertEqual(
            len(regiones),
            len(set(r["properties"]["patch_id"] for r in regiones))
        )

    def test_rechazar_duplicados(self):
        feature = {
            "type": "Feature",
            "properties": {"patch_id": "test_001"},
            "geometry": {"type": "Point", "coordinates": [-106, 35]}
        }

        with tempfile.TemporaryDirectory() as carpeta:
            ruta = Path(carpeta) / "duplicados.geojson"
            ruta.write_text(
                json.dumps({
                    "type": "FeatureCollection",
                    "features": [feature, feature]
                }),
                encoding="utf-8"
            )

            with self.assertRaises(ValueError):
                cargar_geojson(ruta)


if __name__ == "__main__":
    unittest.main()
