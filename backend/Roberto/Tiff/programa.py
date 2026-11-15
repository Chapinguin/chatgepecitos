import rasterio
from pathlib import Path

base = Path(r"C:\Users\super\chatgepecitos\backend\Roberto\Tiff\Tiff")

carpetas = {
    "tierra": base / "Tierra",
    "luna":   base / "Luna",
    "marte":  base / "Marte",
}

datos = {}  # datos[cuerpo][nombre_archivo] = {...}

for cuerpo, carpeta in carpetas.items():
    datos[cuerpo] = {}

    # .tif y .tiff, sin importar mayúsculas/minúsculas
    archivos = sorted(
        p for p in carpeta.iterdir()
        if p.suffix.lower() in (".tif", ".tiff")
    )

    for ruta in archivos:
        with rasterio.open(ruta) as src:
            print(f"\n===== {cuerpo.upper()} | {ruta.name} =====")
            print("Bandas:", src.count)
            print("Tamaño (filas, columnas):", src.height, src.width)
            print("CRS:", src.crs)
            print("Bounds:", src.bounds)
            print("Nodata:", src.nodata)
            print("lon, lat", src.xy(row=0, col=0))

            datos[cuerpo][ruta.name] = {
                "bandas": src.read(),
                "crs": src.crs,
                "bounds": src.bounds,
                "meta": src.meta,
                "interpretacion_color": src.colorinterp,
                "lon_lat": src.xy(row=0, col=0),
            }
             
#Otorgar variable a banda de cada planeta
tierra_banda = datos["tierra"]["bandas"][0]
luna_banda = datos["luna"]["bandas"][0]
marte_banda = datos["marte"]["bandas"][0]