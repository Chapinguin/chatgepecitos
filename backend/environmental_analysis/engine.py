"""Deterministic environmental similarity for comparable planetary measurements.

Prototype scoring: weighted normalized absolute distance, score 0..100.
Not a scientifically calibrated probability or validation of planetary analogues.
"""
from __future__ import annotations
import copy
import math
from backend.data_processing.scientific import validate_region, DataValidationError

class EnvironmentalError(ValueError):
    pass

def _finite_number(value, name):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise EnvironmentalError(f"{name}: numero finito requerido")
    return float(value)

def validate_rules(rules):
    if not isinstance(rules, dict) or not rules:
        raise EnvironmentalError('Se requieren reglas de normalizacion')
    result = {}
    for key, rule in rules.items():
        if not isinstance(rule, dict) or not {'min', 'max', 'unit'} <= rule.keys():
            raise EnvironmentalError(f'{key}: regla incompleta')
        lo, hi = _finite_number(rule['min'], 'min'), _finite_number(rule['max'], 'max')
        if lo >= hi or not isinstance(rule['unit'], str) or not rule['unit']:
            raise EnvironmentalError(f'{key}: rango o unidad invalida')
        result[key] = {'min': lo, 'max': hi, 'unit': rule['unit']}
    return result

def compare_regions(candidate, reference, rules, weights=None, missing='error', allow_synthetic=False):
    """Compare Earth candidate against Mars/Moon reference without mutating inputs.

    missing='skip' renormalizes weights over common variables; reports coverage.
    """
    if missing not in ('error', 'skip'):
        raise EnvironmentalError('missing debe ser error o skip')
    try:
        a, b = validate_region(candidate), validate_region(reference)
    except DataValidationError as exc:
        raise EnvironmentalError(str(exc)) from exc
    if a['body'] != 'earth' or b['body'] not in ('mars', 'moon'):
        raise EnvironmentalError('Se requiere candidato earth y referencia mars o moon')
    normalized_rules = validate_rules(rules)
    if weights is None:
        weights = {key: 1.0 for key in normalized_rules}
    if not isinstance(weights, dict) or set(weights) != set(normalized_rules):
        raise EnvironmentalError('Los pesos deben cubrir exactamente las variables de las reglas')
    clean_weights = {key: _finite_number(val, f'peso {key}') for key, val in weights.items()}
    if any(w <= 0 for w in clean_weights.values()):
        raise EnvironmentalError('Todos los pesos deben ser positivos')
    total_weight = sum(clean_weights.values())
    contributions, missing_variables = [], []
    for key, rule in normalized_rules.items():
        x, y = a['variables'].get(key), b['variables'].get(key)
        if x is None or y is None:
            missing_variables.append(key)
            continue
        if x['unit'] != rule['unit'] or y['unit'] != rule['unit']:
            raise EnvironmentalError(f'{key}: unidades incompatibles')
        if not allow_synthetic and (x['kind'] == 'synthetic' or y['kind'] == 'synthetic'):
            raise EnvironmentalError(f'{key}: datos sinteticos requieren allow_synthetic=True')
        lo, hi = rule['min'], rule['max']
        if not lo <= x['value'] <= hi or not lo <= y['value'] <= hi:
            raise EnvironmentalError(f'{key}: valor fuera del rango declarado')
        nx, ny = (x['value']-lo)/(hi-lo), (y['value']-lo)/(hi-lo)
        distance = abs(nx-ny)
        contributions.append({'variable': key, 'candidate_value': x['value'],
            'reference_value': y['value'], 'unit': rule['unit'],
            'candidate_normalized': round(nx, 8), 'reference_normalized': round(ny, 8),
            'distance': round(distance, 8), 'weight': clean_weights[key],
            'candidate_kind': x['kind'], 'reference_kind': y['kind'],
            'candidate_source': copy.deepcopy(x['source']),
            'reference_source': copy.deepcopy(y['source'])})
    if missing_variables and missing == 'error':
        raise EnvironmentalError('Variables faltantes: ' + ', '.join(missing_variables))
    if not contributions:
        raise EnvironmentalError('No hay variables comparables')
    used_weight = sum(item['weight'] for item in contributions)
    weighted_distance = sum(item['distance']*item['weight'] for item in contributions)/used_weight
    return {'candidate_id': a['id'], 'reference_id': b['id'], 'target_body': b['body'],
        'score': round(100*(1-weighted_distance), 6),
        'method': 'weighted_normalized_absolute_distance_v1',
        'score_interpretation': 'prototype similarity index, not probability',
        'coverage': round(used_weight/total_weight, 6),
        'variables_used': len(contributions), 'variables_missing': missing_variables,
        'details': contributions,
        'synthetic_inputs': any(x['candidate_kind']=='synthetic' or x['reference_kind']=='synthetic' for x in contributions)}

def rank_candidates(candidates, reference, rules, weights=None, missing='error', allow_synthetic=False, limit=None):
    if not isinstance(candidates, list):
        raise EnvironmentalError('candidates debe ser lista')
    if limit is not None and (isinstance(limit, bool) or not isinstance(limit, int) or limit < 1):
        raise EnvironmentalError('limit debe ser entero positivo')
    results, errors = [], []
    for i, candidate in enumerate(candidates):
        try:
            results.append(compare_regions(candidate, reference, rules, weights, missing, allow_synthetic))
        except (EnvironmentalError, TypeError, KeyError) as exc:
            errors.append({'index': i, 'candidate_id': candidate.get('id') if isinstance(candidate, dict) else None, 'error': str(exc)})
    results.sort(key=lambda r: (-r['score'], -r['coverage'], r['candidate_id']))
    return {'target_body': reference.get('body') if isinstance(reference, dict) else None,
        'reference_id': reference.get('id') if isinstance(reference, dict) else None,
        'total_candidates': len(candidates), 'valid_candidates': len(results),
        'errors': errors, 'ranking': results[:limit] if limit is not None else results}
