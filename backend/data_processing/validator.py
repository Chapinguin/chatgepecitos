
import math


def validar_region(region):
    campos = ["id", "nombre", "temperatura", "tipo"]

    if not isinstance(region, dict):
        raise ValueError("La region debe ser un diccionario.")

    for campo in campos:
        if campo not in region:
            raise ValueError(f"Falta el campo: {campo}")

    if not isinstance(region["id"], str) or not region["id"].strip():
        raise ValueError("El ID debe ser un texto no vacio.")

    if not isinstance(region["nombre"], str) or not region["nombre"].strip():
        raise ValueError("El nombre debe ser un texto no vacio.")

    if region["tipo"] not in ["real", "synthetic"]:
        raise ValueError("El tipo debe ser 'real' o 'synthetic'.")

    try:
        temperatura = float(region["temperatura"])
    except (ValueError, TypeError):
        raise ValueError("La temperatura debe ser numerica.")

    if not math.isfinite(temperatura):
        raise ValueError("La temperatura debe ser finita.")

    region_validada = region.copy()
    region_validada["temperatura"] = temperatura

    return region_validada
