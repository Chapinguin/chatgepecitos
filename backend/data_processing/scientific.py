"""Catalogo cientifico local: validacion, trazabilidad y preparacion reproducible."""
from __future__ import annotations
import copy
import csv
import json
import math
from pathlib import Path

BODIES = {"earth", "mars", "moon"}
KINDS = {"observed", "derived", "synthetic"}

class DataValidationError(ValueError):
    pass

def _number(value, field):
    if isinstance(value, bool):
        raise DataValidationError(f"{field}: se requiere numero")
    try:
        n = float(value)
    except (ValueError, TypeError) as exc:
        raise DataValidationError(f"{field}: se requiere numero") from exc
    if not math.isfinite(n):
        raise DataValidationError(f"{field}: numero no finito")
    return n

def validate_region(region):
    """Valida y devuelve copia; nunca modifica el original."""
    if not isinstance(region, dict):
        raise DataValidationError("region: se requiere objeto")
    r = copy.deepcopy(region)
    for field in ("id", "name", "body", "coordinates", "variables"):
        if field not in r:
            raise DataValidationError(f"falta campo: {field}")
    for field in ("id", "name"):
        if not isinstance(r[field], str) or not r[field].strip():
            raise DataValidationError(f"{field}: texto obligatorio")
    if r["body"] not in BODIES:
        raise DataValidationError("body: debe ser earth, mars o moon")
    c = r["coordinates"]
    if not isinstance(c, dict) or "lat" not in c or "lon" not in c:
        raise DataValidationError("coordinates: requiere lat y lon")
    lat, lon = _number(c["lat"], "lat"), _number(c["lon"], "lon")
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise DataValidationError("coordinates: fuera de rango")
    c["lat"], c["lon"] = lat, lon
    if not isinstance(r["variables"], dict) or not r["variables"]:
        raise DataValidationError("variables: objeto no vacio requerido")
    for key, v in r["variables"].items():
        if not isinstance(key, str) or not key.strip() or not isinstance(v, dict):
            raise DataValidationError("variable: formato invalido")
        for f in ("value", "unit", "kind", "source"):
            if f not in v:
                raise DataValidationError(f"{key}: falta {f}")
        v["value"] = _number(v["value"], f"{key}.value")
        if not isinstance(v["unit"], str) or not v["unit"].strip():
            raise DataValidationError(f"{key}: unidad obligatoria")
        if v["kind"] not in KINDS:
            raise DataValidationError(f"{key}: tipo de dato invalido")
        s = v["source"]
        if not isinstance(s, dict):
            raise DataValidationError(f"{key}: source debe ser objeto")
        if v["kind"] != "synthetic":
            for f in ("organization", "dataset", "product_id", "instrument"):
                if not isinstance(s.get(f), str) or not s[f].strip():
                    raise DataValidationError(f"{key}: falta source.{f}")
        if "range" in v:
            limits = v["range"]
            if not isinstance(limits, list) or len(limits) != 2:
                raise DataValidationError(f"{key}: range requiere [min,max]")
            lo, hi = map(lambda x: _number(x, f"{key}.range"), limits)
            if not lo < hi or not lo <= v["value"] <= hi:
                raise DataValidationError(f"{key}: valor fuera de rango")
            v["range"] = [lo, hi]
    spectra = r.get("spectral")
    if spectra is not None:
        if not isinstance(spectra, dict):
            raise DataValidationError("spectral: objeto requerido")
        wl, values = spectra.get("wavelength_nm"), spectra.get("reflectance")
        if not isinstance(wl, list) or not isinstance(values, list) or len(wl) != len(values) or not wl:
            raise DataValidationError("spectral: bandas incompatibles")
        wl = [_number(x, "wavelength_nm") for x in wl]
        values = [_number(x, "reflectance") for x in values]
        if any(x <= 0 for x in wl) or any(b <= a for a,b in zip(wl,wl[1:])):
            raise DataValidationError("spectral: longitudes de onda no crecientes")
        if any(not 0 <= x <= 1 for x in values):
            raise DataValidationError("spectral: reflectancia fuera de [0,1]")
        spectra["wavelength_nm"], spectra["reflectance"] = wl, values
    return r

def validate_catalog(regions):
    if not isinstance(regions, list):
        raise DataValidationError("catalogo: se requiere lista")
    valid, errors, ids = [], [], set()
    for i, item in enumerate(regions):
        try:
            r = validate_region(item)
            if r["id"] in ids:
                raise DataValidationError(f"id duplicado: {r['id']}")
            ids.add(r["id"])
            valid.append(r)
        except (DataValidationError, TypeError) as exc:
            errors.append({"index": i, "error": str(exc)})
    return {"regions": valid, "errors": errors, "total": len(regions), "valid": len(valid)}

def load_catalog(path):
    p = Path(path)
    if not p.is_file():
        raise FileNotFoundError(str(p))
    if p.suffix.lower() == ".json":
        with p.open(encoding="utf-8") as f:
            obj = json.load(f)
        return obj["regions"] if isinstance(obj, dict) and isinstance(obj.get("regions"), list) else obj
    if p.suffix.lower() == ".csv":
        with p.open(encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            required = {"id", "name", "body", "lat", "lon", "variable", "value", "unit", "kind"}
            if not reader.fieldnames or not required.issubset(reader.fieldnames):
                raise DataValidationError("CSV: encabezados insuficientes")
            by_id = {}
            for row in reader:
                rid = row["id"]
                if rid not in by_id:
                    by_id[rid] = {"id": rid, "name": row["name"], "body": row["body"],
                                  "coordinates": {"lat": row["lat"], "lon": row["lon"]}, "variables": {}}
                else:
                    existing = by_id[rid]
                    if (existing["name"], existing["body"], existing["coordinates"]["lat"], existing["coordinates"]["lon"]) != (row["name"], row["body"], row["lat"], row["lon"]):
                        raise DataValidationError(f"CSV: metadatos contradictorios para {rid}")
                if row["variable"] in by_id[rid]["variables"]:
                    raise DataValidationError(f"CSV: variable duplicada para {rid}")
                by_id[rid]["variables"][row["variable"]] = {
                    "value": row["value"], "unit": row["unit"], "kind": row["kind"],
                    "source": {"organization": row.get("organization", ""),
                               "dataset": row.get("dataset", ""),
                               "product_id": row.get("product_id", ""),
                               "instrument": row.get("instrument", "")}}
            return list(by_id.values())
    raise DataValidationError(f"formato no compatible: {p.suffix}")

def filter_regions(regions, body=None, query=None):
    if body is not None and body not in BODIES:
        raise DataValidationError("body invalido")
    return [copy.deepcopy(r) for r in regions if
            (body is None or r["body"] == body) and
            (query is None or query.lower() in r["name"].lower() or query.lower() in r["id"].lower())]

def normalize_environment(region, ranges):
    """Prepara variables 0..100, con rangos fisicos declarados y unidades verificadas."""
    r = validate_region(region)
    if not isinstance(ranges, dict) or not ranges:
        raise DataValidationError("rangos requeridos")
    out = {}
    for key, rule in ranges.items():
        if key not in r["variables"]:
            raise DataValidationError(f"{r['id']}: falta variable {key}")
        if not isinstance(rule, dict) or not {"min", "max", "unit"}.issubset(rule):
            raise DataValidationError(f"{key}: regla incompleta")
        lo, hi = _number(rule["min"], "min"), _number(rule["max"], "max")
        v = r["variables"][key]
        if not lo < hi or v["unit"] != rule["unit"] or not lo <= v["value"] <= hi:
            raise DataValidationError(f"{key}: rango o unidad incompatible")
        out[key] = {"original": copy.deepcopy(v), "normalized": (v["value"]-lo)/(hi-lo)*100,
                    "transform": {"method": "minmax_0_100", "min": lo, "max": hi, "unit": rule["unit"]}}
    return {"region_id": r["id"], "body": r["body"], "variables": out}

def prepare_spectral(region):
    r = validate_region(region)
    if "spectral" not in r:
        raise DataValidationError(f"{r['id']}: espectro no disponible")
    return {"region_id": r["id"], "body": r["body"], "spectral": copy.deepcopy(r["spectral"]),
            "note": "Comparar solo espectros calibrados, con bandas y unidades compatibles"}

def save_json(path, data):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
