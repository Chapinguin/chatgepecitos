from __future__ import annotations

import argparse
import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.transform import xy as px_to_geo
from scipy.ndimage import uniform_filter
from skimage.filters import sobel
from collections import Counter
from pathlib import Path


# ============================================================
# Configuración
# ============================================================
BASE = Path(r"C:\Users\super\chatgepecitos\backend\Roberto\Tiff\Tiff")

Carpetas = {
    "tierra": BASE / "Tierra",
    "luna":   BASE / "Luna",
    "marte":  BASE / "Marte",
}

# ============================================================
# Cargar escenas (todas las imágenes .tif de cada carpeta)
# ============================================================

def find_scenes(carpetas: dict) -> list[tuple[str, Path]]:
    scenes = []
    for cuerpo, carpeta in carpetas.items():
        if not carpeta.exists():
            print(f" carpeta no encontrada: {carpeta}")
            continue
        for p in sorted(carpeta.iterdir()):
            if p.suffix.lower() in (".tif", ".tiff"):
                scenes.append((cuerpo, p))
    return scenes

# ============================================================
# Tipos (contrato del equipo, no se toca al añadir datos)
# ============================================================
@dataclass
class Patch:
    patch_id: str
    source: str
    side: int                                  # P (lado del parche en píxeles)
    bbox_px: tuple[int, int, int, int]         # (r0, c0, r1, c1)
    bbox_crs: tuple[float, float, float, float]
    pixels: np.ndarray                         # (N, B) float32, N=P*P
    valid_mask: np.ndarray                     # (N,) bool

    @property
    def as_3d(self) -> np.ndarray:
        return self.pixels.reshape(self.side, self.side, self.pixels.shape[-1])

    @property
    def mask_2d(self) -> np.ndarray:
        return self.valid_mask.reshape(self.side, self.side)


@dataclass
class PatchDistribution:
    """Representación canónica: N(μ, Σ) en R^D. D lo decide el extractor."""
    patch_id: str
    source: str
    bbox_px: tuple[int, int, int, int]
    bbox_crs: tuple[float, float, float, float]
    mean: np.ndarray                           # (D,)
    cov: np.ndarray                            # (D, D)
    n_pixels: int


# ============================================================
# Núcleo: comparación entre distribuciones (D arbitrario)
# Esta función NO CAMBIA NUNCA, sin importar cuántas bandas o features haya.
# ============================================================
def bhattacharyya(a: PatchDistribution, b: PatchDistribution, eps: float = 1e-6) -> float:
    """Coeficiente de Bhattacharyya multivariado. Devuelve índice en [0,1]."""
    assert a.mean.shape == b.mean.shape, "dimensiones incompatibles"
    D = a.mean.shape[0]
    S1 = a.cov + eps * np.eye(D)
    S2 = b.cov + eps * np.eye(D)
    S  = 0.5 * (S1 + S2)
    d  = a.mean - b.mean

    assert np.isfinite(S).all(), f"S no finita: {a.patch_id} vs {b.patch_id}"

    Sinv = np.linalg.pinv(S)
    term1 = 0.125 * float(d @ Sinv @ d)
    _, ld1 = np.linalg.slogdet(S1)
    _, ld2 = np.linalg.slogdet(S2)
    _, ldS = np.linalg.slogdet(S)
    term2 = 0.5 * (ldS - 0.5 * (ld1 + ld2))
    return float(np.clip(np.exp(-(term1 + term2)), 0.0, 1.0))


# ============================================================
# Extractor: interfaz fija, D variable
# ============================================================
class Extractor(Protocol):
    feature_names: list[str]
    def per_pixel(self, patch: np.ndarray, valid: np.ndarray) -> np.ndarray: ...


class LuminanceTextureExtractor:
    """RGB/gris → luminancia + textura local. D = 3, sin importar B de entrada."""
    feature_names = ["lum", "local_std", "grad_mag"]

    def per_pixel(self, patch: np.ndarray, valid: np.ndarray) -> np.ndarray:
        # patch: (P, P, B), valid: (P, P) -> (N_valid, 3)
        if patch.shape[-1] >= 3:
            lum = (0.299 * patch[..., 0] + 0.587 * patch[..., 1] + 0.114 * patch[..., 2])
        else:
            lum = patch[..., 0].astype(np.float32)
        lum = lum.astype(np.float32)

        m  = uniform_filter(lum, size=3)
        m2 = uniform_filter(lum * lum, size=3)
        std  = np.sqrt(np.maximum(m2 - m * m, 0.0))
        grad = sobel(lum / 255.0).astype(np.float32)

        F = np.stack([lum, std, grad], axis=-1)                # (P, P, 3)
        return F.reshape(-1, 3)[valid.reshape(-1)].astype(np.float32)


# ============================================================
# Loader / patcher / featurize (genéricos, no dependen de B ni de D)
# ============================================================
def load_scene(path: str, max_side: int = 2048):
    """
    Devuelve (img (H,W,B) float32, mask (H,W) bool, transform, crs, factor).
    Máscara leída con nearest para no contaminar bordes por average.
    """
    with rasterio.open(path) as src:
        h, w = src.height, src.width
        factor = max(1, int(np.ceil(max(h, w) / max_side)))
        out_h, out_w = h // factor, w // factor

        img = src.read(
            out_shape=(src.count, out_h, out_w),
            resampling=Resampling.average,
        ).astype(np.float32)

        finite = np.isfinite(img).all(axis=0)

        if src.nodata is not None and not np.isnan(src.nodata):
            raw = src.read(
                indexes=[1],
                out_shape=(1, out_h, out_w),
                resampling=Resampling.nearest,
            )
            mask = (raw[0] != src.nodata) & finite
        else:
            mask = np.any(img != 0, axis=0) & finite

        img = np.nan_to_num(img, nan=0.0, posinf=0.0, neginf=0.0)

        return np.moveaxis(img, 0, -1), mask, src.transform, src.crs, factor


def make_patches(img, mask, patch_px, stride_px, source, transform) -> list[Patch]:
    H, W, B = img.shape
    out = []
    for r in range(0, H - patch_px + 1, stride_px):
        for c in range(0, W - patch_px + 1, stride_px):
            m = mask[r:r + patch_px, c:c + patch_px]
            if m.sum() < 0.5 * m.size:          # parche mayormente inválido
                continue
            block = img[r:r + patch_px, c:c + patch_px, :]
            x0, y0 = px_to_geo(transform, r, c)
            x1, y1 = px_to_geo(transform, r + patch_px, c + patch_px)
            bbox = (float(min(x0, x1)), float(min(y0, y1)),
                    float(max(x0, x1)), float(max(y0, y1)))
            out.append(Patch(
                patch_id=f"{source}_r{r:05d}_c{c:05d}",
                source=source, side=patch_px,
                bbox_px=(r, c, r + patch_px, c + patch_px),
                bbox_crs=bbox,
                pixels=block.reshape(-1, B),
                valid_mask=m.reshape(-1),
            ))
    return out


def featurize(patch: Patch, extractor) -> PatchDistribution | None:
    F = extractor.per_pixel(patch.as_3d, patch.mask_2d)
    if F.shape[0] < 2 or not np.isfinite(F).all():
        return None
    mu  = F.mean(axis=0)
    cov = np.atleast_2d(np.cov(F.T))
    if not (np.isfinite(mu).all() and np.isfinite(cov).all()):
        return None
    mu  = F.mean(axis=0)
    cov = np.atleast_2d(np.cov(F.T))                            # (D, D)
    return PatchDistribution(
        patch_id=patch.patch_id, source=patch.source, bbox_px=patch.bbox_px,
        bbox_crs=patch.bbox_crs, mean=mu, cov=cov,
        n_pixels=int(F.shape[0]),
    )


# ============================================================
# Main
# ============================================================
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-side", type=int, default=2048)
    ap.add_argument("--patch",    type=int, default=128)
    ap.add_argument("--stride",   type=int, default=None, help="default = patch")
    ap.add_argument("--out",      default="out")
    args = ap.parse_args()
    stride = args.stride if args.stride is not None else args.patch

    t0 = time.time()
    extractor = LuminanceTextureExtractor()
    print(f"Extractor: {extractor.__class__.__name__}, D={len(extractor.feature_names)}")

    dists_by_source = {cuerpo: [] for cuerpo in Carpetas}   # agrupado por cuerpo
    imgs_by_scene   = {}                                    # solo para los crops de la Tierra
    meta_by_scene   = {}

    for cuerpo, path in find_scenes(Carpetas):
        scene_id = f"{cuerpo}__{path.stem}"                 # único por imagen
        print(f"\n[{scene_id}] {path}")

        img, mask, transform, crs, factor = load_scene(str(path), args.max_side)
        print(f"  shape={img.shape}  dtype original→float32  factor={factor}x  "
              f"crs={crs.to_string() if crs else 'None'}")

        raw = make_patches(img, mask, args.patch, stride, scene_id, transform)
        dists = [d for p in raw if (d := featurize(p, extractor)) is not None]
        print(f"  parches crudos={len(raw)}  válidos={len(dists)}")

        dists_by_source[cuerpo].extend(dists)
        meta_by_scene[scene_id] = {"crs": str(crs) if crs else None, "factor": factor}
        if cuerpo == "tierra":                              # solo la Tierra necesita guardar img
            imgs_by_scene[scene_id] = img

    tierra = dists_by_source.get("tierra", [])
    lunas  = dists_by_source.get("luna", [])
    martes = dists_by_source.get("marte", [])
    assert tierra, "Sin parches de tierra: no hay nada que rankear."
    assert lunas or martes, "Sin referencias Luna/Marte: no hay comparación posible."

    print(f"\nComparando {len(tierra)} parches contra {len(lunas)} lunares y {len(martes)} marcianos...")
    results = []
    for t in tierra:
        best = {"luna": (0.0, None), "marte": (0.0, None)}
        for body, rs in (("luna", lunas), ("marte", martes)):
            for r in rs:
                bc = bhattacharyya(t, r)
                if bc > best[body][0]:
                    best[body] = (bc, r.patch_id)
        results.append({
            "patch_id":  t.patch_id,
            "bbox_px":   list(t.bbox_px),
            "bbox_crs":  list(t.bbox_crs),
            "sim_luna":  round(best["luna"][0], 4),
            "sim_marte": round(best["marte"][0], 4),
            "ref_luna":  best["luna"][1],
            "ref_marte": best["marte"][1],
        })

    results.sort(key=lambda x: max(x["sim_luna"], x["sim_marte"]), reverse=True)

    # ---- Salida 1: GeoJSON ------------------------------------------------
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    gj = {
        "type": "FeatureCollection",
        "metadata": {
            "extractor":     extractor.__class__.__name__,
            "feature_names": extractor.feature_names,
            "D":             len(extractor.feature_names),
            "patch_px":      args.patch,
            "stride_px":     stride,
            "max_side":      args.max_side,
            "scene_meta":    meta_by_scene,
        },
        "features": [
            {
                "type": "Feature",
                "bbox": r["bbox_crs"],
                "geometry": None,
                "properties": {
                    "patch_id":  r["patch_id"],
                    "sim_luna":  r["sim_luna"],
                    "sim_marte": r["sim_marte"],
                    "ref_luna":  r["ref_luna"],
                    "ref_marte": r["ref_marte"],
                },
            }
            for r in results
        ],
    }
    (out / "analogues.geojson").write_text(json.dumps(gj, indent=2))
    print(f"→ {out / 'analogues.geojson'}")

    # ---- Salida 2: top-10 crops PNG para el demo --------------------------
    _save_top_crops(results[:10], imgs_by_scene, out / "top10")
    print(f"→ {out / 'top10'}/")

    # ---- Resumen en consola ----------------------------------------------
    print("\nTop-5:")
    for r in results[:5]:
        print(f"  {r['patch_id']}   BC_luna={r['sim_luna']:.3f}   BC_marte={r['sim_marte']:.3f}")

    sims = np.array([max(r["sim_luna"], r["sim_marte"]) for r in results])
    print(f"\nDistribución de similitud (max luna/marte):")
    print(f"  min={sims.min():.3f}  median={np.median(sims):.3f}  "
          f"mean={sims.mean():.3f}  max={sims.max():.3f}")

    print(f"\nTiempo: {time.time() - t0:.1f}s")
    
    
    return {"results": results, "dists_by_source": dists_by_source}


def _save_top_crops(results, imgs_by_scene, out_dir: Path):
    """Guarda un PNG por parche en el top-10 (útil para slides)."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    out_dir.mkdir(parents=True, exist_ok=True)
    for i, r in enumerate(results, 1):
        scene_id = r["patch_id"].split("_")[0]
        img = imgs_by_scene.get(scene_id)
        if img is None:
            continue
        r0, c0, r1, c1 = r["bbox_px"]
        crop = img[r0:r1, c0:c1]
        disp = crop[..., :3].astype(np.uint8) if crop.shape[-1] >= 3 else crop[..., 0].astype(np.uint8)
        fig, ax = plt.subplots(figsize=(3, 3))
        ax.imshow(disp, cmap=None if disp.ndim == 3 else "gray")
        ax.set_title(f"{r['patch_id']}\nL={r['sim_luna']:.3f}  M={r['sim_marte']:.3f}", fontsize=8)
        ax.axis("off")
        fig.savefig(out_dir / f"{i:02d}_{r['patch_id']}.png", bbox_inches="tight", dpi=80)
        plt.close(fig)

if __name__ == "__main__":
    _out = main()
    results = _out["results"]
    dists_by_source = _out["dists_by_source"]

    # ============================================================
    # DIAGNÓSTICO — todo lo que sigue es análisis, no cómputo
    # ============================================================
    lunas  = dists_by_source.get("luna",  [])
    martes = dists_by_source.get("marte", [])

    print("\n" + "=" * 60)
    print("DIAGNÓSTICO DE DISCRIMINABILIDAD")
    print("=" * 60)

    # ---- D1: ¿una sola referencia lunar/marciana se lleva todo? ----------
    top_luna  = Counter(r["ref_luna"]  for r in results if r["ref_luna"])
    top_marte = Counter(r["ref_marte"] for r in results if r["ref_marte"])
    print("\n[D1] Referencias más usadas")
    print("  Luna:")
    for ref, cnt in top_luna.most_common(3):
        print(f"    {ref}: {cnt}/{len(results)}  ({100*cnt/len(results):.0f}%)")
    print("  Marte:")
    for ref, cnt in top_marte.most_common(3):
        print(f"    {ref}: {cnt}/{len(results)}  ({100*cnt/len(results):.0f}%)")

    # ---- D2: ¿la métrica distingue Luna de Marte? -----------------------
    # Este es el diagnóstico que importa. Los "Gap" salen de aquí.
    def pair_scores(A, B, same=False):
        out = []
        for a in A:
            for b in B:
                if same and a.patch_id == b.patch_id:
                    continue
                out.append(bhattacharyya(a, b))
        return np.array(out)

    print("\n[D2] Discriminabilidad Luna vs Marte (esto son los Gaps)")
    ll = pair_scores(lunas,  lunas,  same=True)
    lm = pair_scores(lunas,  martes)
    mm = pair_scores(martes, martes, same=True)
    ml = pair_scores(martes, lunas)

    print(f"  BC(Luna,  Luna)  mean={ll.mean():.3f}  p95={np.percentile(ll,95):.3f}")
    print(f"  BC(Luna,  Marte) mean={lm.mean():.3f}  p95={np.percentile(lm,95):.3f}")
    print(f"  BC(Marte, Marte) mean={mm.mean():.3f}  p95={np.percentile(mm,95):.3f}")
    print(f"  BC(Marte, Luna)  mean={ml.mean():.3f}  p95={np.percentile(ml,95):.3f}")

    gap_luna  = ll.mean() - lm.mean()
    gap_marte = mm.mean() - ml.mean()
    print(f"\n  Gap Luna  = BC(Luna,Luna)  − BC(Luna,Marte)  = {gap_luna:+.3f}")
    print(f"  Gap Marte = BC(Marte,Marte) − BC(Marte,Luna)  = {gap_marte:+.3f}")

    if gap_luna > 0.05 and gap_marte > 0.05:
        print("  ✓ La métrica DISTINGUE ambos planetas. Top-5 tiene sentido.")
    elif gap_luna > 0.02 or gap_marte > 0.02:
        print("  ~ Discriminación débil. Considerar features adicionales.")
    else:
        print("  ✗ No distingue Luna de Marte. Reformular la pregunta.")

    # ---- D3: ranking por discriminación, no por max ---------------------
    by_delta = sorted(results, key=lambda r: abs(r["sim_luna"] - r["sim_marte"]),
                      reverse=True)
    print("\n[D3] Top-10 más discriminativos (|L − M|)")
    for r in by_delta[:10]:
        delta = abs(r["sim_luna"] - r["sim_marte"])
        cls = "LUNA" if r["sim_luna"] > r["sim_marte"] else "MARTE"
        tag = ("✓ confirmado" if delta > 0.08
               else "~ débil"     if delta > 0.03
               else "· ambiguo")
        print(f"  {r['patch_id']}  L={r['sim_luna']:.3f}  M={r['sim_marte']:.3f}  "
              f"Δ={delta:.3f}  → {cls}  [{tag}]")
