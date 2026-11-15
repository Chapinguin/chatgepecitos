import copy
import json
import tempfile
import unittest
from pathlib import Path
from backend.data_processing.scientific import (DataValidationError, validate_region,
    validate_catalog, load_catalog, filter_regions, normalize_environment, prepare_spectral, save_json)

DATA = Path(__file__).resolve().parents[1] / "data"

class ScientificTests(unittest.TestCase):
    def setUp(self):
        self.regions = load_catalog(DATA / "catalog.json")
        self.rules = json.loads((DATA / "normalization_rules.json").read_text(encoding="utf-8"))
        self.rules.pop("note")

    def test_catalog(self):
        report = validate_catalog(self.regions)
        self.assertEqual(report["valid"], 3)
        self.assertFalse(report["errors"])

    def test_immutability(self):
        original = copy.deepcopy(self.regions[0])
        validate_region(self.regions[0])
        normalize_environment(self.regions[0], self.rules)
        self.assertEqual(self.regions[0], original)

    def test_invalid_and_duplicates(self):
        bad = copy.deepcopy(self.regions[0]); bad["coordinates"]["lat"] = 999
        report = validate_catalog([self.regions[0], self.regions[0], bad])
        self.assertEqual(report["valid"], 1)
        self.assertEqual(len(report["errors"]), 2)

    def test_normalize(self):
        result = normalize_environment(self.regions[0], self.rules)
        self.assertAlmostEqual(result["variables"]["albedo"]["normalized"], 25)
        self.assertEqual(result["variables"]["temperature_c"]["original"]["value"], 20)

    def test_unit_mismatch(self):
        bad = copy.deepcopy(self.regions[0]); bad["variables"]["albedo"]["unit"] = "%"
        with self.assertRaises(DataValidationError): normalize_environment(bad, self.rules)

    def test_filter(self):
        self.assertEqual(len(filter_regions(self.regions, body="mars")), 1)
        self.assertEqual(len(filter_regions(self.regions, query="moon")), 1)

    def test_spectral(self):
        with self.assertRaises(DataValidationError): prepare_spectral(self.regions[0])
        r = copy.deepcopy(self.regions[0]); r["spectral"] = {"wavelength_nm":[500,600], "reflectance":[0.2,0.4]}
        self.assertEqual(len(prepare_spectral(r)["spectral"]["reflectance"]), 2)

    def test_json_csv_and_corrupt(self):
        with tempfile.TemporaryDirectory() as temp:
            p = Path(temp)
            save_json(p / "regions.json", {"regions": self.regions})
            self.assertEqual(len(load_catalog(p / "regions.json")), 3)
            csv_path = p / "regions.csv"
            csv_path.write_text("id,name,body,lat,lon,variable,value,unit,kind\n"
                "x,Test,earth,0,0,albedo,0.3,fraction,synthetic\n", encoding="utf-8")
            self.assertEqual(validate_catalog(load_catalog(csv_path))["valid"], 1)
            (p / "bad.json").write_text("{broken", encoding="utf-8")
            with self.assertRaises(json.JSONDecodeError): load_catalog(p / "bad.json")
            with self.assertRaises(FileNotFoundError): load_catalog(p / "missing.json")

if __name__ == "__main__":
    unittest.main()
