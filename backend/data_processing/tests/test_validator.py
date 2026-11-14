
from backend.data_processing.validator import validar_region


# Prueba 1: datos correctos
region_correcta = {
    "id": "earth_test_001",
    "nombre": "Region terrestre de prueba",
    "temperatura": "25",
    "tipo": "synthetic"
}

print("PRUEBA 1: Datos correctos")
print(validar_region(region_correcta))


# Prueba 2: temperatura incorrecta
region_incorrecta = {
    "id": "earth_test_002",
    "nombre": "Otra region",
    "temperatura": "caliente",
    "tipo": "synthetic"
}

print("\nPRUEBA 2: Datos incorrectos")

try:
    validar_region(region_incorrecta)
except ValueError as error:
    print("Error detectado correctamente:", error)


# Prueba 3: campo faltante
region_incompleta = {
    "id": "earth_test_003",
    "temperatura": 20,
    "tipo": "synthetic"
}

print("\nPRUEBA 3: Campo faltante")

try:
    validar_region(region_incompleta)
except ValueError as error:
    print("Error detectado correctamente:", error)
