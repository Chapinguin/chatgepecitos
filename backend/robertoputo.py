from __future__ import annotations

import argparse
import json
import sys
import time
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import numpy as np
import rasterio
import rasterio.windows as rw
from rasterio.enums import Resampling
from rasterio.transform import Affine, xy as px_to_geo
from scipy.ndimage import uniform_filter
from skimage.filters import sobel


# ============================================================
# Config
# ============================================================
BASE = Path(r"C:\Users\super\chatgepecitos\backend\Roberto\Tiff\Tiff")
CARPETAS = {
    "tierra": BASE / "Tierra",
    "luna":   BASE / "Luna",
    "marte":  BASE / "Marte",
}


# ============================================================
# Data classes
# ============================================================
@dataclass
class Patch:
    patch_id: str
    scene_id: str
    body: str
    side: int
    bbox_px: tuple[int, int, int, int]
    bbox_crs: tuple[float, float, float, float]
    pixels: np.ndarray       # (N, B) float32
    valid_mask: np.ndarray   # (N,) bool

    @property
    def as_3d(self) -> np.ndarray:
        return self.pixels.reshape(self.side, self.side, self.pixels.shape[-1])

    @property
    def mask_2d(self) -> np.ndarray:
        return self.valid_mask.reshape(self.side, self.side)


@dataclass
class PatchDistribution:
    patch_id: str
    scene_id: str
    body: str
    bbox_px: tuple[int, int, int, int]
    bbox_crs: tuple[float, float, float, float]
    mean: np.ndarray     # (D,)
    cov: np.ndarray      # (D, D)
    n_pixels: int


@dataclass
class PreparedDist:
    """Distribución con Cholesky precomputado (evita pinv/slogdet por par)."""
    mean: np.ndarray
    cov: np.ndarray      # covarianza regularizada
    chol: np.ndarray     # L tal que cov = L Lᵀ
    logdet: float


# ============================================================
# Bhattacharyya (rápido y numéricamente estable)
# ============================================================
def prepare(d: PatchDistribution, rel_eps: float = 1e-6) -> PreparedDist:
    """Regulariza y factoriza una vez. Se puede cachear por referencia."""
    D = d.mean.size
    trace = float(np.trace(d.cov)) / max(D, 1)
    eps = max(trace, 1.0) * rel_eps
    S = d.cov + eps * np.eye(D)

    try:
        L = np.linalg.cholesky(S)
    except np.linalg.LinAlgError:
        # Fallback: clip de autovalores negativos (covarianza casi singular)
        w, V = np.linalg.eigh(S)
        w = np.maximum(w, eps)
        S = V @ np.diag(w) @ V.T
        L = np.linalg.cholesky(S)

    logdet = 2.0 * float(np.sum(np.log(np.diag(L))))
    return PreparedDist(d.mean, S, L, logdet)


def bc_prepared(a: PreparedDist, b: PreparedDist) -> float:
    """BC entre dos distribuciones ya preparadas. Sin pinv, sin slogdet."""
    S = 0.5 * (a.cov + b.cov)
    L = np.linalg.cholesky(S)
    diff = a.mean - b.mean
    y = np.linalg.solve(L, diff)  # ‖y‖² = diffᵀ S⁻¹ diff
    term1 = 0.125 * float(y @ y)
    logdet_S = 2.0 * float(np.sum(np.log(np.diag(L))))
    term2 = 0.5 * (logdet_S - 0.5 * (a.logdet + b.logdet))
    return float(np.clip(np.exp(-(term1 + term2)), 0.0, 1.0))


def bhattacharyya(a: PatchDistribution, b: PatchDistribution, rel_eps: float = 1e-6) -> float:
    """Wrapper: hace prepare() en cada llamada. Usar bc_prepared() para bucles."""
    return bc_prepared(prepare(a, rel_eps), prepare(b, rel_eps))


# ============================================================
# Extractores — el contrato no cambia: (P,P,B) → (N_valid, D)
# ============================================================
class Extractor(Protocol):
    feature_names: list[str]
    def per_pixel(self, patch: np.ndarray, valid: np.ndarray) -> np.ndarray: ...


def _to_luminance(patch: np.ndarray, channel_mode: str) -> np.ndarray:
    """Reduce (P,P,B) → (P,P) escalar de forma CONSISTENTE entre cuerpos."""
    B = patch.shape[-1]
    if B == 1:
        return patch[..., 0].astype(np.float32)
    if channel_mode == "first":
        return patch[..., 0].astype(np.float32)
    if channel_mode == "mean":
        return patch.mean(axis=-1).astype(np.float32)
    if channel_mode == "rgb_luminance":
        if B < 3:
            raise ValueError(f"rgb_luminance requiere B>=3, tienes B={B}")
        return (0.299 * patch[..., 0]
              + 0.587 * patch[..., 1]
              + 0.114 * patch[..., 2]).astype(np.float32)
    raise ValueError(f"channel_mode desconocido: {channel_mode}")


def _coherence(img: np.ndarray, size: int = 5) -> np.ndarray:
    """Coherencia del tensor de estructura ∈ [0,1]: 0=isotrópico, 1=fuertemente orientado."""
    gy, gx = np.gradient(img.astype(np.float32))
    Jxx = uniform_filter(gx * gx, size=size)
    Jyy = uniform_filter(gy * gy, size=size)
    Jxy = uniform_filter(gx * gy, size=size)
    tr = Jxx + Jyy
    disc = np.sqrt(np.maximum((Jxx - Jyy) ** 2 + 4.0 * Jxy ** 2, 0.0))
    lam1 = 0.5 * (tr + disc)
    lam2 = 0.5 * (tr - disc)
    coh = np.where(lam1 > 1e-8, (lam1 - lam2) / (lam1 + 1e-8), 0.0)
    return np.clip(coh, 0.0, 1.0).astype(np.float32)


class SimpleExtractor:
    """D=3: luminancia + std local + |gradiente|. Backward compatible, con bugs corregidos."""
    def __init__(self, channel_mode: str = "mean", normalize_lum: bool = True):
        self.channel_mode = channel_mode
        self.normalize_lum = normalize_lum
        self.feature_names = ["lum", "local_std", "grad_mag"]

    def per_pixel(self, patch: np.ndarray, valid: np.ndarray) -> np.ndarray:
        lum = _to_luminance(patch, self.channel_mode)
        m  = uniform_filter(lum, size=3)
        m2 = uniform_filter(lum * lum, size=3)
        std = np.sqrt(np.maximum(m2 - m * m, 0.0))
        lum_for_grad = lum / 255.0 if self.normalize_lum else lum
        grad = sobel(lum_for_grad).astype(np.float32)
        F = np.stack([lum, std, grad], axis=-1)
        return F.reshape(-1, 3)[valid.reshape(-1)].astype(np.float32)


class MultiScaleExtractor:
    """
    Extractor cross-body. Features válidas en Tierra/Luna/Marte:
      - multi-scale std (rugosidad a distintas escalas) → captura tamaño de cráteres/dunas
      - |grad|  (densidad de bordes)
      - coherencia (anisotropía de la textura)
      - luminancia (albedo, opcional — desactivable para modo "solo morfología")

    D = 3 + len(scales) + (1 si include_albedo)
    Con scales=(3,7,15) y albedo ON → D=7.
    """
    def __init__(
        self,
        channel_mode: str = "mean",
        include_albedo: bool = True,
        scales: tuple[int, ...] = (3, 7, 15),
    ):
        self.channel_mode = channel_mode
        self.include_albedo = include_albedo
        self.scales = scales

        names = [f"std_{s}" for s in scales] + ["grad_mag", "coherence"]
        if include_albedo:
            names = ["lum"] + names
        self.feature_names = names

    def per_pixel(self, patch: np.ndarray, valid: np.ndarray) -> np.ndarray:
        lum = _to_luminance(patch, self.channel_mode)

        feats: list[np.ndarray] = []
        if self.include_albedo:
            feats.append(lum)

        for s in self.scales:
            m  = uniform_filter(lum, size=s)
            m2 = uniform_filter(lum * lum, size=s)
            feats.append(np.sqrt(np.maximum(m2 - m * m, 0.0)))

        feats.append(sobel(lum).astype(np.float32))
        feats.append(_coherence(lum, size=5))

        F = np.stack(feats, axis=-1).astype(np.float32)
        D = F.shape[-1]
        return F.reshape(-1, D)[valid.reshape(-1)]


# ============================================================
# I/O
# ============================================================
def find_scenes(carpetas: dict[str, Path]) -> list[tuple[str, Path]]:
    scenes = []
    for body, folder in carpetas.items():
        if not folder.exists():
            print(f"  carpeta no encontrada: {folder}")
            continue
        for p in sorted(folder.iterdir()):
            if p.suffix.lower() in (".tif", ".tiff"):
                scenes.append((body, p))
    return scenes


def load_scene(path: str, max_side: int = 2048):
    """
    Devuelve (img (H,W,B) f32, mask (H,W) bool, transform_efectivo, crs, (sx, sy)).
    El transform devuelto YA está escalado a la grilla downsampled.
    """
    with rasterio.open(path) as src:
        h, w = src.height, src.width
        factor = max(1, int(np.ceil(max(h, w) / max_side)))
        out_h = max(1, h // factor)
        out_w = max(1, w // factor)

        img = src.read(
            out_shape=(src.count, out_h, out_w),
            resampling=Resampling.average,
        ).astype(np.float32)

        finite = np.isfinite(img).all(axis=0)

        if src.nodata is not None and not (isinstance(src.nodata, float) and np.isnan(src.nodata)):
            raw = src.read(
                indexes=[1],
                out_shape=(1, out_h, out_w),
                resampling=Resampling.nearest,
            )
            mask = (raw[0] != src.nodata) & finite
        else:
            # Sin nodata declarado: solo descartamos píxeles no finitos.
            # NO descartamos "todos los canales en 0" — en escenas nocturnas
            # o zonas oscuras eso es dato real.
            mask = finite

        img = np.nan_to_num(img, nan=0.0, posinf=0.0, neginf=0.0)

        # ---- CORRECCIÓN CRÍTICA: escalar transform a la grilla downsampled ----
        sx = src.width / out_w
        sy = src.height / out_h
        transform = src.transform * Affine.scale(sx, sy)

        return np.moveaxis(img, 0, -1), mask, transform, src.crs, (sx, sy)


def make_patches(
    img: np.ndarray,
    mask: np.ndarray,
    patch_px: int,
    stride_px: int,
    scene_id: str,
    body: str,
    transform: Affine,
    min_valid_frac: float = 0.5,
) -> list[Patch]:
    H, W, B = img.shape
    out: list[Patch] = []
    for r in range(0, H - patch_px + 1, stride_px):
        for c in range(0, W - patch_px + 1, stride_px):
            m = mask[r:r + patch_px, c:c + patch_px]
            if m.sum() < min_valid_frac * m.size:
                continue
            block = img[r:r + patch_px, c:c + patch_px, :]
            x0, y0 = px_to_geo(transform, r, c)
            x1, y1 = px_to_geo(transform, r + patch_px, c + patch_px)
            bbox = (float(min(x0, x1)), float(min(y0, y1)),
                    float(max(x0, x1)), float(max(y0, y1)))
            out.append(Patch(
                patch_id=f"{scene_id}_r{r:05d}_c{c:05d}",
                scene_id=scene_id,
                body=body,
                side=patch_px,
                bbox_px=(r, c, r + patch_px, c + patch_px),
                bbox_crs=bbox,
                pixels=block.reshape(-1, B),
                valid_mask=m.reshape(-1),
            ))
    return out


def featurize(patch: Patch, extractor: Extractor) -> PatchDistribution | None:
    F = extractor.per_pixel(patch.as_3d, patch.mask_2d)
    D = F.shape[1]
    # Necesitamos N ≫ D² para estimar covarianza con sentido
    min_n = max(4 * D, 30)
    if F.shape[0] < min_n or not np.isfinite(F).all():
        return None
    mu  = F.mean(axis=0)
    cov = np.atleast_2d(np.cov(F.T))
    if not (np.isfinite(mu).all() and np.isfinite(cov).all()):
        return None
    return PatchDistribution(
        patch_id=patch.patch_id,
        scene_id=patch.scene_id,
        body=patch.body,
        bbox_px=patch.bbox_px,
        bbox_crs=patch.bbox_crs,
        mean=mu, cov=cov,
        n_pixels=int(F.shape[0]),
    )


# ============================================================
# Crops para el demo (recarga del disco — no guarda RAM)
def _normalize_for_display(data: np.ndarray) -> np.ndarray:
    """Normaliza los datos a [0, 1] para que imshow no los sature a blanco."""
    if data.ndim == 2:
        band = data.copy().astype(np.float32)
        valid = band[np.isfinite(band)]
        if len(valid) > 0:
            p2, p98 = np.percentile(valid, (2, 98))
            if p98 > p2:
                return np.clip((band - p2) / (p98 - p2), 0, 1)
        return np.clip(band, 0, 1)
    
    # data.ndim == 3
    if data.shape[-1] == 1:
        data = np.repeat(data, 3, axis=-1)
    
    rgb = data[..., :3].copy().astype(np.float32)
    for i in range(3):
        band = rgb[..., i]
        valid = band[np.isfinite(band)]
        if len(valid) > 0:
            p2, p98 = np.percentile(valid, (2, 98))
            if p98 > p2:
                rgb[..., i] = np.clip((band - p2) / (p98 - p2), 0, 1)
            else:
                rgb[..., i] = np.clip(band / max(p98, 1.0), 0, 1)
        else:
            rgb[..., i] = 0.0
    return rgb

def save_top_crops(results: list[dict], meta_by_scene: dict, out_dir: Path,
                   patch_px: int, n: int = 10) -> None:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    out_dir.mkdir(parents=True, exist_ok=True)
    for i, r in enumerate(results[:n], 1):
        scene_id = r["scene_id"]
        meta = meta_by_scene.get(scene_id)
        if meta is None:
            continue

        r0, c0, r1, c1 = r["bbox_px"]
        sx, sy = meta["factor"]
        orow0, ocol0 = int(r0 * sy), int(c0 * sx)
        orow1, ocol1 = int(r1 * sy), int(c1 * sx)
        window = rw.Window(ocol0, orow0, orow1 - orow0, ocol1 - ocol0)

        try:
            with rasterio.open(meta["path"]) as src:
                data = src.read(
                    window=window,
                    out_shape=(src.count, patch_px, patch_px),
                    resampling=Resampling.average,
                ).astype(np.float32)
        except Exception as e:
            continue

        data = np.moveaxis(data, 0, -1)
        
        # Creamos una figura limpia sin bordes
        fig = plt.figure(figsize=(4, 4))
        ax = fig.add_axes([0, 0, 1, 1]) # Ocupa toda la imagen
        ax.axis("off")                  # Apaga ejes y textos
        
        if data.shape[-1] >= 3:
            disp = _normalize_for_display(data[..., :3])
            ax.imshow(disp)
        else:
            disp = _normalize_for_display(data[..., 0])
            ax.imshow(disp, cmap="gray")

        # Guardamos sin padding
        fig.savefig(out_dir / f"{i:02d}_{r['patch_id']}.png",
                    bbox_inches="tight", pad_inches=0, dpi=120)
        plt.close(fig)


# ============================================================
# Diagnóstico
# ============================================================
def run_diagnostics(results: list[dict], dists_by_source: dict, rel_eps: float = 1e-6) -> None:
    lunas  = dists_by_source.get("luna", [])
    martes = dists_by_source.get("marte", [])

    print("\n" + "=" * 60)
    print("DIAGNÓSTICO DE DISCRIMINABILIDAD")
    print("=" * 60)

    top_luna  = Counter(r["ref_luna"]  for r in results if r["ref_luna"])
    top_marte = Counter(r["ref_marte"] for r in results if r["ref_marte"])

    print("\n[D1] Referencias más usadas")
    print("  Luna:")
    for ref, cnt in top_luna.most_common(3):
        print(f"    {ref}: {cnt}/{len(results)}  ({100*cnt/len(results):.0f}%)")
    print("  Marte:")
    for ref, cnt in top_marte.most_common(3):
        print(f"    {ref}: {cnt}/{len(results)}  ({100*cnt/len(results):.0f}%)")

    # Precomputamos una vez
    prep_lunas  = [prepare(d, rel_eps) for d in lunas]
    prep_martes = [prepare(d, rel_eps) for d in martes]

    def pair_scores(A_preps, B_preps, same=False) -> np.ndarray:
        out = []
        for i, a in enumerate(A_preps):
            for j, b in enumerate(B_preps):
                if same and i == j:
                    continue
                out.append(bc_prepared(a, b))
        return np.array(out)

    ll = pair_scores(prep_lunas,  prep_lunas,  same=True)
    mm = pair_scores(prep_martes, prep_martes, same=True)
    lm = pair_scores(prep_lunas,  prep_martes, same=False)   # simétrico: no hace falta ml

    print("\n[D2] Discriminabilidad Luna vs Marte")
    print(f"  BC(Luna,  Luna)  mean={ll.mean():.3f}  p95={np.percentile(ll,95):.3f}")
    print(f"  BC(Marte, Marte) mean={mm.mean():.3f}  p95={np.percentile(mm,95):.3f}")
    print(f"  BC(Luna,  Marte) mean={lm.mean():.3f}  p95={np.percentile(lm,95):.3f}  (simétrico)")

    gap_luna  = ll.mean() - lm.mean()
    gap_marte = mm.mean() - lm.mean()
    print(f"\n  Gap Luna  = BC(Luna,Luna)  − BC(Luna,Marte)  = {gap_luna:+.3f}")
    print(f"  Gap Marte = BC(Marte,Marte) − BC(Marte,Luna)  = {gap_marte:+.3f}")

    if gap_luna > 0.05 and gap_marte > 0.05:
        print("  ✓ La métrica DISTINGUE ambos planetas.")
    elif gap_luna > 0.02 or gap_marte > 0.02:
        print("  ~ Discriminación débil. Probá --extractor multiscale o más features.")
    else:
        print("  ✗ No distingue Luna de Marte. Reformular features/pregunta.")

    by_delta = sorted(results, key=lambda r: abs(r["sim_luna"] - r["sim_marte"]), reverse=True)
    print("\n[D3] Top-10 más discriminativos (|L − M|)")
    for r in by_delta[:10]:
        delta = abs(r["sim_luna"] - r["sim_marte"])
        cls = "LUNA" if r["sim_luna"] > r["sim_marte"] else "MARTE"
        tag = "✓ confirmado" if delta > 0.08 else "~ débil" if delta > 0.03 else "· ambiguo"
        print(f"  {r['patch_id']}  L={r['sim_luna']:.3f}  M={r['sim_marte']:.3f}  "
              f"Δ={delta:.3f}  → {cls}  [{tag}]")


# ============================================================
# Coordenadas geográficas de los top-N
# ============================================================

from rasterio.warp import transform as warp_transform

def _centro_xy(meta, bbox_px):
    r0, c0, r1, c1 = bbox_px
    return px_to_geo(meta["transform"], (r0 + r1) / 2, (c0 + c1) / 2, offset="ul")

def _a_latlon(body, crs_str, x, y):
    """(lat, lon) o None si no se puede."""
    if not crs_str:
        return None
    try:
        if body == "tierra":
            lons, lats = warp_transform(crs_str, "EPSG:4326", [x], [y])
            return lats[0], lons[0]
        # Luna/Marte: CRS no terrestre -> usar su propio CRS geográfico
        from pyproj import CRS, Transformer
        crs = CRS.from_user_input(crs_str)
        t = Transformer.from_crs(crs, crs.geodetic_crs, always_xy=True)
        lon, lat = t.transform(x, y)
        return lat, lon
    except Exception as e:
        print(f"  no se pudo convertir a lat/lon ({body}): {e}")
        return None

def top_ubicaciones(results, dists_by_source, meta_by_scene, n=10):
    por_id = {d.patch_id: d for lst in dists_by_source.values() for d in lst}

    def ubicar(patch_id):
        d = por_id.get(patch_id)
        if d is None:
            return None
        meta = meta_by_scene[d.scene_id]
        x, y = _centro_xy(meta, d.bbox_px)
        ll = _a_latlon(d.body, meta["crs"], x, y)
        return {"patch_id": patch_id, "body": d.body, "x": x, "y": y,
                "lat": ll[0] if ll else None, "lon": ll[1] if ll else None}

    salida = []
    for i, r in enumerate(results[:n], 1):
        item = {
            "rank": i,
            "tierra": ubicar(r["patch_id"]),
            "luna":   ubicar(r["ref_luna"])  if r["ref_luna"]  else None,
            "marte":  ubicar(r["ref_marte"]) if r["ref_marte"] else None,
            "sim_luna": r["sim_luna"], "sim_marte": r["sim_marte"],
        }
        t = item["tierra"]
        if t and t["lat"] is not None:
            item["maps"] = f"https://www.google.com/maps?q={t['lat']:.6f},{t['lon']:.6f}"
        salida.append(item)
    return salida

# ============================================================
# Main
# ============================================================
def main() -> dict:
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-side",   type=int, default=2048)
    ap.add_argument("--patch",      type=int, default=128)
    ap.add_argument("--stride",     type=int, default=None, help="default = patch")
    ap.add_argument("--out",        default="out")
    ap.add_argument("--extractor",  choices=["simple", "multiscale"], default="multiscale")
    ap.add_argument("--channel-mode", choices=["mean", "first", "rgb_luminance"], default="mean",
                    help="Cómo reducir bandas a luminancia (default 'mean' = robusto a B arbitrario)")
    ap.add_argument("--no-albedo",  action="store_true",
                    help="Omite luminancia absoluta → modo solo-morfología")
    ap.add_argument("--rel-eps",    type=float, default=1e-6,
                    help="Regularización relativa de covarianza")
    ap.add_argument("--no-crops",   action="store_true", help="No guardar PNGs de top-10")
    ap.add_argument("--no-diagnostics", action="store_true")
    args = ap.parse_args()
    stride = args.stride if args.stride is not None else args.patch

    t0 = time.time()

    if args.extractor == "simple":
        extractor: Extractor = SimpleExtractor(channel_mode=args.channel_mode)
    else:
        extractor = MultiScaleExtractor(
            channel_mode=args.channel_mode,
            include_albedo=not args.no_albedo,
        )

    print(f"Extractor: {extractor.__class__.__name__}, D={len(extractor.feature_names)}")
    print(f"  features: {extractor.feature_names}")

    dists_by_source: dict[str, list[PatchDistribution]] = {k: [] for k in CARPETAS}
    meta_by_scene:   dict[str, dict] = {}

    for body, path in find_scenes(CARPETAS):
        scene_id = f"{body}__{path.stem}"
        print(f"\n[{scene_id}] {path}")
        try:
            img, mask, transform, crs, factor = load_scene(str(path), args.max_side)
        except Exception as e:
            print(f"  ✗ error cargando: {e}")
            continue

        print(f"  shape={img.shape}  factor={factor}  "
              f"crs={crs.to_string() if crs else 'None'}  "
              f"valid={mask.mean()*100:.1f}%")

        raw = make_patches(img, mask, args.patch, stride, scene_id, body, transform)
        dists = [d for p in raw if (d := featurize(p, extractor)) is not None]
        print(f"  parches crudos={len(raw)}  válidos={len(dists)}")

        dists_by_source[body].extend(dists)
        meta_by_scene[scene_id] = {
            "crs": str(crs) if crs else None,
            "transform": transform, 
            "factor": factor,
            "path": str(path),
            "body": body,
        }

    tierra = dists_by_source.get("tierra", [])
    lunas  = dists_by_source.get("luna", [])
    martes = dists_by_source.get("marte", [])

    if not tierra:
        sys.exit("✗ Sin parches de tierra: no hay nada que rankear.")
    if not (lunas or martes):
        sys.exit("✗ Sin referencias Luna/Marte: no hay comparación posible.")

    print(f"\nComparando {len(tierra)} parches contra "
          f"{len(lunas)} lunares y {len(martes)} marcianos...")

    # Precomputamos referencias: una vez por referencia, no por par
    prep_lunas  = [(d.patch_id, prepare(d, args.rel_eps)) for d in lunas]
    prep_martes = [(d.patch_id, prepare(d, args.rel_eps)) for d in martes]

    results: list[dict] = []
    for t in tierra:
        t_prep = prepare(t, args.rel_eps)
        best = {"luna": (0.0, None), "marte": (0.0, None)}
        for body, refs in (("luna", prep_lunas), ("marte", prep_martes)):
            for ref_id, ref_prep in refs:
                bc = bc_prepared(t_prep, ref_prep)
                if bc > best[body][0]:
                    best[body] = (bc, ref_id)
        results.append({
            "patch_id":  t.patch_id,
            "scene_id":  t.scene_id,
            "bbox_px":   list(t.bbox_px),
            "bbox_crs":  list(t.bbox_crs),
            "sim_luna":  round(best["luna"][0], 4),
            "sim_marte": round(best["marte"][0], 4),
            "ref_luna":  best["luna"][1],
            "ref_marte": best["marte"][1],
        })

    results.sort(key=lambda x: max(x["sim_luna"], x["sim_marte"]), reverse=True)

    # ---- GeoJSON ----
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    gj = {
        "type": "FeatureCollection",
        "metadata": {
            "extractor":     extractor.__class__.__name__,
            "feature_names": extractor.feature_names,
            "D":             len(extractor.feature_names),
            "channel_mode":  args.channel_mode,
            "patch_px":      args.patch,
            "stride_px":     stride,
            "max_side":      args.max_side,
            "scene_meta":    {k: {"crs": v["crs"], "factor": v["factor"], "body": v["body"]}
                              for k, v in meta_by_scene.items()},
        },
        "features": [
            {
                "type": "Feature",
                "bbox": r["bbox_crs"],
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [r["bbox_crs"][0], r["bbox_crs"][1]],
                        [r["bbox_crs"][2], r["bbox_crs"][1]],
                        [r["bbox_crs"][2], r["bbox_crs"][3]],
                        [r["bbox_crs"][0], r["bbox_crs"][3]],
                        [r["bbox_crs"][0], r["bbox_crs"][1]],
                    ]],
                },
                "properties": {
                    "patch_id":  r["patch_id"],
                    "scene_id":  r["scene_id"],
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
    print(f"\n→ {out / 'analogues.geojson'}")

    if not args.no_crops:
        save_top_crops(results, meta_by_scene, out / "top10", args.patch, n=10)
        print(f"→ {out / 'top10'}/")

    print("\nTop-10:")
    for r in results[:10]:
        print(f"  {r['patch_id']}   BC_luna={r['sim_luna']:.3f}   BC_marte={r['sim_marte']:.3f}")

    sims = np.array([max(r["sim_luna"], r["sim_marte"]) for r in results])
    print(f"\nSimilitud (max luna/marte): "
          f"min={sims.min():.3f}  median={np.median(sims):.3f}  "
          f"mean={sims.mean():.3f}  max={sims.max():.3f}")
    print(f"\nTiempo: {time.time() - t0:.1f}s")
    print(f"Ruta absoluta de los recortes: {out.resolve() / 'top10'}")

    ubic = top_ubicaciones(results, dists_by_source, meta_by_scene, n=10)

    print("\nUbicaciones Top-10 (desde metadatos):")
    for u in ubic:
        t = u["tierra"]
        print(f"  #{u['rank']:02d} {t['patch_id']}")
        print(f"      Tierra: {t['lat']:.6f}, {t['lon']:.6f}   {u.get('maps','')}")
        for k in ("luna", "marte"):
            ref = u[k]
            if ref and ref["lat"] is not None:
                print(f"      {k.capitalize()} (BC={u['sim_'+k]:.3f}): "
                    f"{ref['lat']:.4f}, {ref['lon']:.4f}   [{ref['patch_id']}]")

    (out / "top10_ubicaciones.json").write_text(json.dumps(ubic, indent=2))

    return {
        "results": results,
        "dists_by_source": dists_by_source,
        "meta_by_scene": meta_by_scene,
        "rel_eps": args.rel_eps,
        "run_diagnostics": not args.no_diagnostics,
    }






if __name__ == "__main__":
    _out = main()
    if _out["run_diagnostics"]:
        run_diagnostics(_out["results"], _out["dists_by_source"], _out["rel_eps"])
