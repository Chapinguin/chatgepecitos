"""CLI: python -m backend.environmental_analysis.run --demo --target mars"""
import argparse
import json
from pathlib import Path
from backend.data_processing.scientific import load_catalog, save_json
from .engine import rank_candidates

ROOT = Path(__file__).resolve().parents[1] / 'data_processing' / 'data'

def main():
    p = argparse.ArgumentParser(description='Environmental similarity prototype')
    p.add_argument('--catalog', type=Path, default=ROOT / 'catalog.json')
    p.add_argument('--rules', type=Path, default=ROOT / 'normalization_rules.json')
    p.add_argument('--target', choices=['mars', 'moon'], default='mars')
    p.add_argument('--output', type=Path, default=Path('out/environmental_similarity.json'))
    p.add_argument('--demo', action='store_true', help='Permitir datos sinteticos de demostracion')
    p.add_argument('--missing', choices=['error', 'skip'], default='error')
    args = p.parse_args()
    catalog = load_catalog(args.catalog)
    with args.rules.open(encoding='utf-8') as f:
        rules_raw = json.load(f)
    rules = {k: v for k, v in rules_raw.items() if isinstance(v, dict) and {'min','max','unit'} <= v.keys()}
    references = [r for r in catalog if r.get('body') == args.target]
    if not references:
        p.error(f'No hay referencias de {args.target} en el catalogo')
    earth = [r for r in catalog if r.get('body') == 'earth']
    report = rank_candidates(earth, references[0], rules, missing=args.missing, allow_synthetic=args.demo)
    report['metadata'] = {'mode': 'synthetic_demo' if args.demo else 'scientific_inputs_only',
                          'warning': 'Los scores son indices de prototipo, no probabilidades ni validacion cientifica'}
    save_json(args.output, report)
    print(json.dumps({'output': str(args.output), 'candidates': report['total_candidates'],
                      'valid': report['valid_candidates'], 'errors': report['errors'],
                      'ranking': [{'id': x['candidate_id'], 'score': x['score']} for x in report['ranking']]},
                     ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
