
from backend.data_processing.normalizer import normalizar_valor, normalizar_variables


temperatura = normalizar_valor(25, -100, 100)

print("Temperatura normalizada:", temperatura)


datos = {
    "temperatura": 25,
    "humedad": 40
}

rangos = {
    "temperatura": (-100, 100),
    "humedad": (0, 100)
}

resultado = normalizar_variables(datos, rangos)

print("Variables normalizadas:", resultado)
