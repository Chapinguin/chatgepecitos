import rasterio
import matplotlib.pyplot as plt
import numpy as np

rutas = {
    "tierra": "Tiff/Tierra/GLORTHO_NM_26June2018_Jimez2_c3r13_ortho.tif",
    "luna":   "Tiff/Luna/LRO_NAC_Shade_53N354E_150cmp.tif",
    "marte":  "Tiff/Marte/sojourner_hirise_mosaic.tif",
}

datos = {}

for nombre, ruta in rutas.items():
    with rasterio.open(ruta) as src:
        print(f"\n===== {nombre.upper()} =====")
        print("Bandas:", src.count)
        print("Tamaño (filas, columnas):", src.height, src.width)
        print("CRS:", src.crs)
        print("Bounds:", src.bounds)
        print("Nodata:", src.nodata)
        print("Metadata:", src.meta)
        print("Descriptions:", src.descriptions)

        # Todo adentro del with: se guarda en el diccionario
        datos[nombre] = {
            "bandas": src.read(),   # (bandas, filas, columnas)
            "crs": src.crs,
            "bounds": src.bounds,
            "meta": src.meta,
            "interpretacion_color": src.colorinterp,

        }

# Ya fuera del with, trabajas con los arreglos guardados
for nombre, d in datos.items():
    print(f"\n===== {nombre.upper()} =====")
    for i, banda in enumerate(d["bandas"], start=1):
        print(f"--- Banda {i} --- forma: {banda.shape}, tipo: {banda.dtype}")
        print("Mín:", banda.min(), "Máx:", banda.max())
        print(banda)  # muestra los primeros 10x10 píxeles
        print("interpretacion de color", 
              d["interpretacion_color"][i-1])  # i-1 porque las bandas empiezan en 1

#Otorgar variable a banda de cada planeta
tierra_banda = datos["tierra"]["bandas"][0]
luna_banda = datos["luna"]["bandas"][0]
marte_banda = datos["marte"]["bandas"][0]
