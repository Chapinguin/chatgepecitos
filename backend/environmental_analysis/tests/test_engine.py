import copy
import json
import unittest
from pathlib import Path
from backend.data_processing.scientific import load_catalog
from backend.environmental_analysis.engine import compare_regions, rank_candidates, EnvironmentalError

DATA = Path(__file__).resolve().parents[2] / 'data_processing' / 'data'

class EnvironmentalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.regions = load_catalog(DATA / 'catalog.json')
        raw = json.loads((DATA / 'normalization_rules.json').read_text(encoding='utf-8'))
        cls.rules = {k: v for k,v in raw.items() if isinstance(v,dict)}
        cls.earth, cls.mars, cls.moon = cls.regions

    def test_mars(self):
        result = compare_regions(self.earth, self.mars, self.rules, allow_synthetic=True)
        self.assertGreaterEqual(result['score'], 0)
        self.assertLessEqual(result['score'], 100)
        self.assertEqual(result['target_body'], 'mars')
        self.assertEqual(result['coverage'], 1)

    def test_moon(self):
        self.assertEqual(compare_regions(self.earth, self.moon, self.rules, allow_synthetic=True)['target_body'], 'moon')

    def test_identity_score(self):
        reference = copy.deepcopy(self.mars)
        reference['variables'] = copy.deepcopy(self.earth['variables'])
        self.assertEqual(compare_regions(self.earth, reference, self.rules, allow_synthetic=True)['score'], 100)

    def test_no_mutation(self):
        a, b = copy.deepcopy(self.earth), copy.deepcopy(self.mars)
        compare_regions(self.earth, self.mars, self.rules, allow_synthetic=True)
        self.assertEqual((a,b), (self.earth,self.mars))

    def test_reject_synthetic_by_default(self):
        with self.assertRaisesRegex(EnvironmentalError, 'sinteticos'):
            compare_regions(self.earth, self.mars, self.rules)

    def test_unit_mismatch(self):
        bad = copy.deepcopy(self.mars)
        bad['variables']['temperature_c']['unit'] = 'K'
        with self.assertRaisesRegex(EnvironmentalError, 'unidades'):
            compare_regions(self.earth, bad, self.rules, allow_synthetic=True)

    def test_missing_and_coverage(self):
        bad = copy.deepcopy(self.earth)
        del bad['variables']['albedo']
        with self.assertRaisesRegex(EnvironmentalError, 'faltantes'):
            compare_regions(bad, self.mars, self.rules, allow_synthetic=True)
        result = compare_regions(bad, self.mars, self.rules, missing='skip', allow_synthetic=True)
        self.assertEqual(result['coverage'], 0.5)
        self.assertEqual(result['variables_missing'], ['albedo'])

    def test_weights(self):
        result = compare_regions(self.earth, self.mars, self.rules,
                                 weights={'temperature_c': 3, 'albedo': 1}, allow_synthetic=True)
        self.assertEqual(result['variables_used'], 2)
        with self.assertRaises(EnvironmentalError):
            compare_regions(self.earth, self.mars, self.rules,
                            weights={'temperature_c': -1, 'albedo': 1}, allow_synthetic=True)

    def test_ranking_and_error_report(self):
        result = rank_candidates([self.earth, {'id': 'bad'}], self.mars, self.rules, allow_synthetic=True)
        self.assertEqual(result['valid_candidates'], 1)
        self.assertEqual(len(result['errors']), 1)
        self.assertEqual(result['ranking'][0]['candidate_id'], self.earth['id'])

    def test_invalid_body(self):
        with self.assertRaises(EnvironmentalError):
            compare_regions(self.mars, self.earth, self.rules, allow_synthetic=True)

    def test_out_of_range(self):
        bad = copy.deepcopy(self.earth)
        bad['variables']['albedo']['value'] = 2
        with self.assertRaisesRegex(EnvironmentalError, 'fuera del rango'):
            compare_regions(bad, self.mars, self.rules, allow_synthetic=True)

if __name__ == '__main__':
    unittest.main()
