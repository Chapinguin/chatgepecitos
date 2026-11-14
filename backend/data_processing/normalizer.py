
import math


def normalizar_valor(valor, minimo, maximo):
    valor = float(valor)
    minimo = float(minimo)
    maximo = float(maximo)

    if not all(math.isfinite(x) for x in (valor, minimo, maximo)):
        raise ValueError("Los valores deben ser finitos.")

    if minimo >= maximo:
        raise ValueError("El minimo debe ser menor que el maximo.")

    if not minimo <= valor <= maximo:
        raise ValueError("El valor esta fuera del rango definido.")

    return (valor - minimo) / (maximo - minimo) * 100


def normalizar_variables(datos, rangos):
    resultado = {}

    for variable, limites in rangos.items():
        if variable not in datos:
            raise ValueError(f"Falta la variable: {variable}")

        minimo, maximo = limites

        resultado[variable] = normalizar_valor(
            datos[variable],
            minimo,
            maximo
        )

    return resultado
