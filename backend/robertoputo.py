from __future__ import annotations

import argparse
import json
import sys
import time
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import numpy as np
import rasterio
import rasterio.windows as rw
from rasterio.enums import Resampling
from rasterio.transform import Affine, xy as px_to_geo
from rasterio.warp import transform as warp_transform
from scipy.ndimage import uniform_filter
from skimage.filters import sobel


# ============================================================
# Config
# ============================================================
BASE = Path(r"C:\Users\super\chatgepecitos\backend\Roberto\Tiff\Tiff")
CARPETAS = {"tierra": BASE / "Tierra", "luna": BASE / "Luna", "marte": BASE / "Marte"}


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
    pixels: np.ndarray
    valid_mask: np.ndarray

    @property
    def as_3d(self): return self.pixels.reshape(self.side, self.side, self.pixels.shape[-1])
    @property
    def mask_2d(self): return self.valid_mask.reshape(self.side, self.side)


@dataclass
class PatchDistribution:
    patch_id: str
    scene_id: str
    body: str
    bbox_px: tuple[int, int, int, int]
    bbox_crs: tuple[float, float, float, float]
    mean: np.ndarray
    cov: np.ndarray
    n_pixels: int


@dataclass
class PreparedDist:
    mean: np.ndarray
    cov: np.ndarray
    chol: np.ndarray
    logdet: float


# ============================================================
# Bhattacharyya
# ============================================================
def prepare(d: PatchDistribution, rel_eps: float = 1e-6) -> PreparedDist:
    D = d.mean.size
    trace = float(np.trace(d.cov)) / max(D, 1)
    eps = max(trace, 1.0) * rel_eps
    S = d.cov + eps * np.eye(D)
    try:
        L = np.linalg.cholesky(S)
    except np.linalg.LinAlgError:
        w, V = np.linalg.eigh(S); w = np.maximum(w, eps)
        S = V @ np.diag(w) @ V.T
        L = np.linalg.cholesky(S)
    logdet = 2.0 * float(np.sum(np.log(np.diag(L))))
    return PreparedDist(d.mean, S, L, logdet)


def bc_prepared(a: PreparedDist, b: PreparedDist) -> float:
    S = 0.5 * (a.cov + b.cov)
    L = np.linalg.cholesky(S)
    y = np.linalg.solve(L, a.mean - b.mean)
    term1 = 0.125 * float(y @ y)
    logdet_S = 2.0 * float(np.sum(np.log(np.diag(L))))
    term2 = 0.5 * (logdet_S - 0.5 * (a.logdet + b.logdet))
    return float(np.clip(np.exp(-(term1 + term2)), 0.0, 1.0))


def bhattacharyya(a, b, rel_eps=1e-6):
    return bc_prepared(prepare(a, rel_eps), prepare(b, rel_eps))


# ============================================================
# Extractores
# ============================================================
class Extractor(Protocol):
    feature_names: list[str]
    def per_pixel(self, patch: np.ndarray, valid: np.ndarray) -> np.ndarray: ...


def _to_luminance(patch: np.ndarray, channel_mode: str) -> np.ndarray:
    B = patch.shape[-1]
    if B == 1: return patch[..., 0].astype(np.float32)
    if channel_mode == "first": return patch[..., 0].astype(np.float32)
    if channel_mode == "mean": return patch.mean(axis=-1).astype(np.float32)
    if channel_mode == "rgb_luminance":
        if B < 3: raise ValueError(f"rgb_luminance requiere B>=3, tienes B={B}")
        return (0.299 * patch[..., 0] + 0.587 * patch[..., 1] + 0.114 * patch[..., 2]).astype(np.float32)
    raise ValueError(f"channel_mode desconocido: {channel_mode}")


def _coherence(img: np.ndarray, size: int = 5) -> np.ndarray:
    gy, gx = np.gradient(img.astype(np.float32))
    Jxx = uniform_filter(gx * gx, size=size)
    Jyy = uniform_filter(gy * gy, size=size)
    Jxy = uniform_filter(gx * gy, size=size)
    tr = Jxx + Jyy
    disc = np.sqrt(np.maximum((Jxx - Jyy) ** 2 + 4.0 * Jxy ** 2, 0.0))
    lam1 = 0.5 * (tr + disc); lam2 = 0.5 * (tr - disc)
    coh = np.where(lam1 > 1e-8, (lam1 - lam2) / (lam1 + 1e-8), 0.0)
    return np.clip(coh, 0.0, 1.0).astype(np.float32)


class SimpleExtractor:
    def __init__(self, channel_mode="mean", normalize_lum=True):
        self.channel_mode = channel_mode
        self.normalize_lum = normalize_lum
        self.feature_names = ["lum", "local_std", "grad_mag"]

    def per_pixel(self, patch, valid):
        lum = _to_luminance(patch, self.channel_mode)
        m = uniform_filter(lum, size=3); m2 = uniform_filter(lum * lum, size=3)
        std = np.sqrt(np.maximum(m2 - m * m, 0.0))
        lum_g = lum / 255.0 if self.normalize_lum else lum
        grad = sobel(lum_g).astype(np.float32)
        F = np.stack([lum, std, grad], axis=-1)
        return F.reshape(-1, 3)[valid.reshape(-1)].astype(np.float32)


class MultiScaleExtractor:
    """FIX: sobel sobre lum/255 → evita que grad_mag domine la covarianza."""
    def __init__(self, channel_mode="mean", include_albedo=True,
                 scales=(3, 7, 15), normalize_before_grad=True):
        self.channel_mode = channel_mode
        self.include_albedo = include_albedo
        self.scales = scales
        self.normalize_before_grad = normalize_before_grad
        names = [f"std_{s}" for s in scales] + ["grad_mag", "coherence"]
        if include_albedo: names = ["lum"] + names
        self.feature_names = names

    def per_pixel(self, patch, valid):
        lum = _to_luminance(patch, self.channel_mode)
        feats = []
        if self.include_albedo: feats.append(lum)
        for s in self.scales:
            m = uniform_filter(lum, size=s); m2 = uniform_filter(lum * lum, size=s)
            feats.append(np.sqrt(np.maximum(m2 - m * m, 0.0)))
        lum_g = lum / 255.0 if self.normalize_before_grad else lum
        feats.append(sobel(lum_g).astype(np.float32))
        feats.append(_coherence(lum, size=5))
        F = np.stack(feats, axis=-1).astype(np.float32)
        D = F.shape[-1]
        return F.reshape(-1, D)[valid.reshape(-1)]


# ============================================================
# I/O
# ============================================================
def find_scenes(carpetas):
    scenes = []
    for body, folder in carpetas.items():
        if not folder.exists():
            print(f"  carpeta no encontrada: {folder}"); continue
        for p in sorted(folder.iterdir()):
            if p.suffix.lower() in (".tif", ".tiff"):
                scenes.append((body, p))
    return scenes


def load_scene(path, max_side=2048):
    with rasterio.open(path) as src:
        h, w = src.height, src.width
        factor = max(1, int(np.ceil(max(h, w) / max_side)))
        out_h, out_w = max(1, h // factor), max(1, w // factor)

        img = src.read(out_shape=(src.count, out_h, out_w),
                       resampling=Resampling.average).astype(np.float32)
        finite = np.isfinite(img).all(axis=0)

        if src.nodata is not None and not (isinstance(src.nodata, float) and np.isnan(src.nodata)):
            raw = src.read(indexes=[1], out_shape=(1, out_h, out_w),
                           resampling=Resampling.nearest)
            mask = (raw[0] != src.nodata) & finite
        else:
            mask = finite

        img = np.nan_to_num(img, nan=0.0, posinf=0.0, neginf=0.0)
        sx, sy = src.width / out_w, src.height / out_h
        transform = src.transform * Affine.scale(sx, sy)
        return np.moveaxis(img, 0, -1), mask, transform, src.crs, (sx, sy)


def make_patches(img, mask, patch_px, stride_px, scene_id, body, transform, min_valid_frac=0.5):
    H, W, B = img.shape
    out = []
    for r in range(0, H - patch_px + 1, stride_px):
        for c in range(0, W - patch_px + 1, stride_px):
            m = mask[r:r + patch_px, c:c + patch_px]
            if m.sum() < min_valid_frac * m.size: continue
            block = img[r:r + patch_px, c:c + patch_px, :]
            x0, y0 = px_to_geo(transform, r, c)
            x1, y1 = px_to_geo(transform, r + patch_px, c + patch_px)
            bbox = (float(min(x0, x1)), float(min(y0, y1)),
                    float(max(x0, x1)), float(max(y0, y1)))
            out.append(Patch(
                patch_id=f"{scene_id}_r{r:05d}_c{c:05d}", scene_id=scene_id, body=body,
                side=patch_px, bbox_px=(r, c, r + patch_px, c + patch_px), bbox_crs=bbox,
                pixels=block.reshape(-1, B), valid_mask=m.reshape(-1),
            ))
    return out


def featurize(patch, extractor):
    F = extractor.per_pixel(patch.as_3d, patch.mask_2d)
    D = F.shape[1]
    min_n = max(10 * D, 200)  # FIX
    if F.shape[0] < min_n or not np.isfinite(F).all(): return None
    mu = F.mean(axis=0); cov = np.atleast_2d(np.cov(F.T))
    if not (np.isfinite(mu).all() and np.isfinite(cov).all()): return None
    return PatchDistribution(patch.patch_id, patch.scene_id, patch.body,
                             patch.bbox_px, patch.bbox_crs, mu, cov, int(F.shape[0]))


# ============================================================
# Estandarización global
# ============================================================
def compute_global_standardization(dists_by_source):
    all_d = [d for lst in dists_by_source.values() for d in lst]
    if not all_d: return None, None
    total_n = sum(d.n_pixels for d in all_d); D = all_d[0].mean.size
    pm = np.zeros(D); ps = np.zeros(D)
    for d in all_d:
        w = d.n_pixels / total_n
        pm += w * d.mean
        ps += w * (np.diag(d.cov) + d.mean ** 2)
    var = np.maximum(ps - pm ** 2, 1e-12)
    return pm.astype(np.float32), np.sqrt(var).astype(np.float32)


def apply_standardization(dist, gm, gs):
    return PatchDistribution(dist.patch_id, dist.scene_id, dist.body,
                             dist.bbox_px, dist.bbox_crs,
                             (dist.mean - gm) / gs, dist.cov / np.outer(gs, gs),
                             dist.n_pixels)


# ============================================================
# Crops
# ============================================================
def _normalize_for_display(data):
    if data.ndim == 2:
        band = data.astype(np.float32); v = band[np.isfinite(band)]
        if len(v):
            p2, p98 = np.percentile(v, (2, 98))
            if p98 > p2: return np.clip((band - p2) / (p98 - p2), 0, 1)
        return np.clip(band, 0, 1)
    if data.shape[-1] == 1: data = np.repeat(data, 3, axis=-1)
    rgb = data[..., :3].copy().astype(np.float32)
    for i in range(3):
        band = rgb[..., i]; v = band[np.isfinite(band)]
        if len(v):
            p2, p98 = np.percentile(v, (2, 98))
            rgb[..., i] = np.clip((band - p2) / (p98 - p2), 0, 1) if p98 > p2 \
                          else np.clip(band / max(p98, 1.0), 0, 1)
        else:
            rgb[..., i] = 0
    return rgb


def save_top_crops(results, meta_by_scene, out_dir, patch_px, n=10):
    import matplotlib; matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    out_dir.mkdir(parents=True, exist_ok=True)
    cache = {}
    try:
        for i, r in enumerate(results[:n], 1):
            meta = meta_by_scene.get(r["scene_id"])
            if meta is None: continue
            src = cache.get(r["scene_id"])
            if src is None:
                src = rasterio.open(meta["path"]); cache[r["scene_id"]] = src
            r0, c0, r1, c1 = r["bbox_px"]; sx, sy = meta["factor"]
            window = rw.Window(int(c0 * sx), int(r0 * sy),
                               int((c1 - c0) * sx), int((r1 - r0) * sy))
            try:
                data = src.read(window=window,
                                out_shape=(src.count, patch_px, patch_px),
                                resampling=Resampling.average).astype(np.float32)
            except Exception as e:
                print(f"  crop {r['patch_id']} falló: {e}"); continue
            data = np.moveaxis(data, 0, -1)
            fig = plt.figure(figsize=(4, 4))
            ax = fig.add_axes([0, 0, 1, 1]); ax.axis("off")
            ax.imshow(_normalize_for_display(data[..., :3]) if data.shape[-1] >= 3
                      else _normalize_for_display(data[..., 0]), cmap="gray" if data.shape[-1] < 3 else None)
            fig.savefig(out_dir / f"{i:02d}_{r['patch_id']}.png",
                        bbox_inches="tight", pad_inches=0, dpi=120)
            plt.close(fig)
    finally:
        for s in cache.values(): s.close()


# ============================================================
# Geolocalización
# ============================================================
def _centro_xy(meta, bbox_px):
    r0, c0, r1, c1 = bbox_px
    return px_to_geo(meta["transform"], (r0 + r1) / 2, (c0 + c1) / 2, offset="ul")


try:
    from pyproj import CRS as _PyprojCRS, Transformer as _PyprojTransformer
    _PYPROJ_OK = True
except ImportError:
    _PYPROJ_OK = False


def _a_latlon(body, crs_str, x, y):
    if not crs_str: return None
    try:
        if body == "tierra":
            lons, lats = warp_transform(crs_str, "EPSG:4326", [x], [y])
            return lats[0], lons[0]
        if not _PYPROJ_OK: return None
        crs = _PyprojCRS.from_user_input(crs_str)
        t = _PyprojTransformer.from_crs(crs, crs.geodetic_crs, always_xy=True)
        lon, lat = t.transform(x, y)
        return lat, lon
    except Exception as e:
        print(f"  lat/lon ({body}): {e}"); return None


def _grid_key_for_patch(r, meta_by_scene, cell_deg, fallback_units=5000.0):
    meta = meta_by_scene.get(r["scene_id"])
    if meta is None: return None
    x, y = _centro_xy(meta, r["bbox_px"])
    ll = _a_latlon(meta["body"], meta["crs"], x, y)
    if ll is not None:
        lat, lon = ll
        return ("ll", int(np.floor(lat / cell_deg)), int(np.floor(lon / cell_deg)))
    return ("crs", str(meta["crs"]),
            int(np.floor(x / fallback_units)), int(np.floor(y / fallback_units)))


# ============================================================
# Diversidad + dos top-N (FIX: estado independiente por lista)
# ============================================================
def _pick(
    pool,
    n,
    meta_by_scene,
    per_scene_cap,
    cell_deg,
    min_dist_m,
    forbidden_ids=None,
    seed_picked=None,
    relax_cell=False,
    relax_cap=False,
    relax_dist=False,
):
    """
    Elige hasta `n` parches de `pool` (ya ordenado) con dedup interno:
      - no repetir patch_id (dentro de esta lista ni contra `seed_picked`)
      - no repetir celda geográfica (intra-lista)
      - no repetir escena más de `per_scene_cap` (intra-lista)
      - no violar `forbidden_ids` (típicamente: parches de la OTRA lista)
    `seed_picked` siembra el estado con lo ya elegido (para refill).
    """
    forbidden_ids = set(forbidden_ids) if forbidden_ids else set()
    seed = list(seed_picked) if seed_picked else []

    seen_ids = {r["patch_id"] for r in seed}
    seen_cells: set = set()
    scene_count: Counter = Counter()
    for r in seed:
        k = _grid_key_for_patch(r, meta_by_scene, cell_deg)
        if k is not None:
            seen_cells.add(k)
        scene_count[r["scene_id"]] += 1

    picked: list[dict] = []
    for r in pool:
        if len(picked) >= n:
            break
        if r["patch_id"] in forbidden_ids or r["patch_id"] in seen_ids:
            continue
        if not relax_cap and per_scene_cap and scene_count[r["scene_id"]] >= per_scene_cap:
            continue

        key = _grid_key_for_patch(r, meta_by_scene, cell_deg)
        if not relax_cell and key is not None and key in seen_cells:
            continue

        if not relax_dist and min_dist_m is not None:
            meta = meta_by_scene.get(r["scene_id"])
            if meta is not None:
                x, y = _centro_xy(meta, r["bbox_px"])
                too_close = False
                for s in seed + picked:
                    ms = meta_by_scene.get(s["scene_id"])
                    if ms is None or ms["crs"] != meta["crs"]:
                        continue
                    xs, ys = _centro_xy(ms, s["bbox_px"])
                    if float(np.hypot(x - xs, y - ys)) < min_dist_m:
                        too_close = True
                        break
                if too_close:
                    continue

        picked.append(r)
        seen_ids.add(r["patch_id"])
        scene_count[r["scene_id"]] += 1
        if key is not None:
            seen_cells.add(key)

    return picked


def build_top_lists(
    results,
    meta_by_scene,
    n=5,
    disjoint=True,
    per_scene_cap=2,
    cell_deg=0.05,
    min_dist_m=None,
):
    """
    Devuelve (top_luna, top_marte).

    FIX: cada lista tiene SU PROPIO scene_count y seen_cells.
    Solo `forbidden_ids` (patch_ids) se comparte para garantizar disjointness.

    Fase 1 — picks independientes con dedup completo.
    Fase 2 — resolver conflictos por score relativo.
    Fase 3 — refill con relajación progresiva (cell → scene cap → min_dist).
             Garantiza 5/5 si el pool total lo permite.
    """
    luna_pool  = sorted(results, key=lambda r: r["sim_luna"],  reverse=True)
    marte_pool = sorted(results, key=lambda r: r["sim_marte"], reverse=True)

    # ---- Fase 1: picks independientes ----
    top_luna  = _pick(luna_pool,  n, meta_by_scene, per_scene_cap, cell_deg, min_dist_m)
    top_marte = _pick(marte_pool, n, meta_by_scene, per_scene_cap, cell_deg, min_dist_m)

    if not disjoint:
        return top_luna, top_marte

    # ---- Fase 2: resolver conflictos ----
    # El parche se queda en la lista donde es "relativamente más fuerte":
    #   sim_luna >= sim_marte → Luna
    #   sim_luna <  sim_marte → Marte
    luna_by_id  = {r["patch_id"]: r for r in top_luna}
    marte_by_id = {r["patch_id"]: r for r in top_marte}
    for pid in set(luna_by_id) & set(marte_by_id):
        r = luna_by_id[pid]
        if r["sim_luna"] >= r["sim_marte"]:
            marte_by_id.pop(pid)
        else:
            luna_by_id.pop(pid)

    top_luna  = [r for r in top_luna  if r["patch_id"] in luna_by_id]
    top_marte = [r for r in top_marte if r["patch_id"] in marte_by_id]

    # ---- Fase 3: refill con relajación progresiva ----
    def refill(target, pool, other, target_n):
        if len(target) >= target_n:
            return target
        forbidden = {r["patch_id"] for r in other}  # disjoint con la OTRA lista
        levels = (
            (False, False, False),  # completo
            (True,  False, False),  # permite celda duplicada
            (True,  True,  False),  # + permite exceder scene cap
            (True,  True,  True),   # + permite violar min_dist
        )
        for relax_cell, relax_cap, relax_dist in levels:
            if len(target) >= target_n:
                break
            extra = _pick(
                pool,
                target_n - len(target),
                meta_by_scene,
                per_scene_cap,
                cell_deg,
                min_dist_m,
                forbidden_ids=forbidden,
                seed_picked=target,
                relax_cell=relax_cell,
                relax_cap=relax_cap,
                relax_dist=relax_dist,
            )
            current_ids = {r["patch_id"] for r in target}
            extra = [r for r in extra if r["patch_id"] not in current_ids]
            target = target + extra
        return target

    # Luna primero: suele ser la más corta porque los BCs a Luna son menores.
    top_luna  = refill(top_luna,  luna_pool,  top_marte, n)
    top_marte = refill(top_marte, marte_pool, top_luna,  n)

    # ---- Diagnóstico final ----
    if len(top_luna) < n:
        print(f"  ⚠️  Luna quedó en {len(top_luna)}/{n}. "
              f"Pool total={len(results)}; "
              f"disponibles sin overlapping={len(results) - len(top_marte)}.")
        print(f"      Opciones: --top-n {len(top_luna)} | --no-disjoint-tops | "
              f"--top-per-scene 0 | --dedup-cell-deg 0")
    if len(top_marte) < n:
        print(f"  ⚠️  Marte quedó en {len(top_marte)}/{n}. Mismas opciones.")

    return top_luna, top_marte


# ============================================================
# Export a JSON para la UI
# ============================================================
def _patch_to_entry(patch_id, dists_by_id, meta_by_scene, crop_filename=None):
    d = dists_by_id.get(patch_id)
    if d is None: return None
    meta = meta_by_scene.get(d.scene_id)
    if meta is None: return None
    x, y = _centro_xy(meta, d.bbox_px)
    lat, lon = _a_latlon(d.body, meta["crs"], x, y)
    entry = {
        "patch_id": patch_id,
        "scene_id": d.scene_id,
        "body": d.body,
        "bbox_px": list(d.bbox_px),
        "bbox_crs": list(d.bbox_crs),
        "center": {"x": float(x), "y": float(y),
                   "lat": float(lat) if lat is not None else None,
                   "lon": float(lon) if lon is not None else None},
        "google_maps_url": (f"https://www.google.com/maps?q={lat:.6f},{lon:.6f}"
                            if d.body == "tierra" and lat is not None else None),
    }
    if crop_filename is not None: entry["crop_filename"] = crop_filename
    return entry


def build_top5_export(top_luna, top_marte, dists_by_id, meta_by_scene):
    def _package(rows, sim_key, ref_key):
        out = []
        for i, r in enumerate(rows, 1):
            fname = f"{i:02d}_{r['patch_id']}.png"
            earth = _patch_to_entry(r["patch_id"], dists_by_id, meta_by_scene, crop_filename=fname)
            ref = _patch_to_entry(r[ref_key], dists_by_id, meta_by_scene) if r.get(ref_key) else None
            out.append({"rank": i, "similarity": float(r[sim_key]),
                        "earth": earth, "reference": ref})
        return out
    return {
        "metadata": {"description": "Top-5 parches terrestres más análogos a Luna y Marte (Bhattacharyya)"},
        "tierra_luna":  _package(top_luna,  "sim_luna",  "ref_luna"),
        "tierra_marte": _package(top_marte, "sim_marte", "ref_marte"),
    }


# ============================================================
# Diagnóstico
# ============================================================
def run_diagnostics(results, dists_by_source, rel_eps=1e-6):
    lunas, martes = dists_by_source.get("luna", []), dists_by_source.get("marte", [])
    print("\n" + "=" * 60); print("DIAGNÓSTICO DE DISCRIMINABILIDAD"); print("=" * 60)
    prep_l = [prepare(d, rel_eps) for d in lunas]
    prep_m = [prepare(d, rel_eps) for d in martes]

    def scores(A, B, same=False):
        return np.array([bc_prepared(a, b) for i, a in enumerate(A)
                         for j, b in enumerate(B) if not (same and i == j)])

    ll, mm, lm = scores(prep_l, prep_l, True), scores(prep_m, prep_m, True), scores(prep_l, prep_m)
    print(f"\n[D2] BC(Luna,Luna)={ll.mean():.3f}  BC(Marte,Marte)={mm.mean():.3f}  BC(Luna,Marte)={lm.mean():.3f}")
    gap_l, gap_m = ll.mean() - lm.mean(), mm.mean() - lm.mean()
    print(f"  Gap Luna={gap_l:+.3f}  Gap Marte={gap_m:+.3f}")
    print("  ✓ Distingue" if gap_l > 0.05 and gap_m > 0.05 else
          "  ~ Débil" if gap_l > 0.02 or gap_m > 0.02 else "  ✗ No distingue")


# ============================================================
# Main
# ============================================================
def main() -> dict:
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-side", type=int, default=2048)
    ap.add_argument("--patch", type=int, default=128)
    ap.add_argument("--stride", type=int, default=None)
    ap.add_argument("--min-valid-frac", type=float, default=0.5)
    ap.add_argument("--out", default="out")
    ap.add_argument("--extractor", choices=["simple", "multiscale"], default="multiscale")
    ap.add_argument("--channel-mode", choices=["mean", "first", "rgb_luminance"], default="mean")
    ap.add_argument("--no-albedo", action="store_true")
    ap.add_argument("--rel-eps", type=float, default=1e-6)
    ap.add_argument("--no-crops", action="store_true")
    ap.add_argument("--no-diagnostics", action="store_true")
    ap.add_argument("--no-standardize", action="store_true")
    # Diversidad
    ap.add_argument("--top-n", type=int, default=5,
                    help="Tamaño de cada top-N (default 5)")
    ap.add_argument("--top-per-scene", type=int, default=2,
                    help="Máx parches por escena en cada top-N (default 2; 0=sin límite)")
    ap.add_argument("--dedup-cell-deg", type=float, default=0.05,
                    help="Celda lat/lon en grados para deduplicar (default 0.05° ≈ 5 km)")
    ap.add_argument("--min-dist-m", type=float, default=None)
    ap.add_argument("--no-disjoint-tops", action="store_true",
                    help="Permite el mismo parche en ambos top-N (default: disjuntos)")
    args = ap.parse_args()
    stride = args.stride if args.stride is not None else args.patch
    t0 = time.time()

    extractor: Extractor = (SimpleExtractor(channel_mode=args.channel_mode)
                            if args.extractor == "simple"
                            else MultiScaleExtractor(channel_mode=args.channel_mode,
                                                     include_albedo=not args.no_albedo))
    print(f"Extractor: {extractor.__class__.__name__}, D={len(extractor.feature_names)}")

    dists_by_source = {k: [] for k in CARPETAS}
    meta_by_scene, scene_stats = {}, {}

    for body, path in find_scenes(CARPETAS):
        scene_id = f"{body}__{path.stem}"
        print(f"\n[{scene_id}] {path}")
        try:
            img, mask, transform, crs, factor = load_scene(str(path), args.max_side)
        except Exception as e:
            print(f"  ✗ error cargando: {e}"); continue
        print(f"  shape={img.shape}  factor={factor}  valid={mask.mean()*100:.1f}%")
        raw = make_patches(img, mask, args.patch, stride, scene_id, body,
                           transform, min_valid_frac=args.min_valid_frac)
        dists = [d for p in raw if (d := featurize(p, extractor)) is not None]
        print(f"  raw={len(raw)}  válidos={len(dists)}")
        dists_by_source[body].extend(dists)
        meta_by_scene[scene_id] = {"crs": str(crs) if crs else None, "transform": transform,
                                   "factor": factor, "path": str(path), "body": body}
        scene_stats[scene_id] = {"body": body, "raw": len(raw), "valid": len(dists)}

    if not args.no_standardize:
        gm, gs = compute_global_standardization(dists_by_source)
        if gm is not None:
            dists_by_source = {k: [apply_standardization(d, gm, gs) for d in lst]
                               for k, lst in dists_by_source.items()}
            print(f"\nEstandarizado. σ = {np.round(gs, 2)}")

    tierra = dists_by_source.get("tierra", [])
    lunas, martes = dists_by_source.get("luna", []), dists_by_source.get("marte", [])
    if not tierra: sys.exit("✗ Sin parches de tierra.")
    if not (lunas or martes): sys.exit("✗ Sin referencias Luna/Marte.")

    # Diagnóstico por escena
    print("\n" + "=" * 60); print("PARCHES VÁLIDOS POR ESCENA"); print("=" * 60)
    for sid, st in scene_stats.items():
        flag = "⚠️" if st["valid"] == 0 else "  "
        print(f"  {flag} {sid}  raw={st['raw']} valid={st['valid']}")
    earth_ok = [s for s, st in scene_stats.items() if st["body"] == "tierra" and st["valid"] > 0]
    if len(earth_ok) <= 1:
        print(f"\n  ⚠️  Solo {len(earth_ok)} escena terrestre con parches.")

    # Ranking
    print(f"\nComparando {len(tierra)} parches vs {len(lunas)} lunares y {len(martes)} marcianos...")
    prep_l = [(d.patch_id, prepare(d, args.rel_eps)) for d in lunas]
    prep_m = [(d.patch_id, prepare(d, args.rel_eps)) for d in martes]

    results = []
    for t in tierra:
        t_prep = prepare(t, args.rel_eps)
        best = {"luna": (0.0, None), "marte": (0.0, None)}
        for body, refs in (("luna", prep_l), ("marte", prep_m)):
            for rid, rprep in refs:
                bc = bc_prepared(t_prep, rprep)
                if bc > best[body][0]: best[body] = (bc, rid)
        results.append({"patch_id": t.patch_id, "scene_id": t.scene_id,
                        "bbox_px": list(t.bbox_px), "bbox_crs": list(t.bbox_crs),
                        "sim_luna": round(best["luna"][0], 4),
                        "sim_marte": round(best["marte"][0], 4),
                        "ref_luna": best["luna"][1], "ref_marte": best["marte"][1]})

    # Dos top-N
    top_luna, top_marte = build_top_lists(
        results, meta_by_scene, n=args.top_n,
        disjoint=not args.no_disjoint_tops,
        per_scene_cap=args.top_per_scene if args.top_per_scene > 0 else None,
        cell_deg=args.dedup_cell_deg, min_dist_m=args.min_dist_m,
    )

    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    dists_by_id = {d.patch_id: d for lst in dists_by_source.values() for d in lst}

    # Crops separados
    if not args.no_crops:
        save_top_crops(top_luna,  meta_by_scene, out / "top5_luna",  args.patch, n=args.top_n)
        save_top_crops(top_marte, meta_by_scene, out / "top5_marte", args.patch, n=args.top_n)
        print(f"\n→ {out / 'top5_luna'}/  y  {out / 'top5_marte'}/")

    # Export a JSON para la UI
    top5_json = build_top5_export(top_luna, top_marte, dists_by_id, meta_by_scene)
    (out / "top5.json").write_text(json.dumps(top5_json, indent=2))
    print(f"→ {out / 'top5.json'}  (consumible por la UI)")

    # Imprime las dos tablas
    for title, rows, sim_key, ref_key in (
        (f"TOP-{args.top_n} TIERRA-LUNA",  top_luna,  "sim_luna",  "ref_luna"),
        (f"TOP-{args.top_n} TIERRA-MARTE", top_marte, "sim_marte", "ref_marte"),
    ):
        print(f"\n{'='*60}\n{title}\n{'='*60}")
        for i, r in enumerate(rows, 1):
            e = _patch_to_entry(r["patch_id"], dists_by_id, meta_by_scene)
            ref = _patch_to_entry(r[ref_key], dists_by_id, meta_by_scene) if r.get(ref_key) else None
            print(f"  #{i} {r['patch_id']}  BC={r[sim_key]:.3f}")
            if e and e["center"]["lat"] is not None:
                print(f"     Earth: {e['center']['lat']:.6f}, {e['center']['lon']:.6f}  {e['google_maps_url']}")
            if ref and ref["center"]["lat"] is not None:
                print(f"     Ref:   {ref['center']['lat']:.4f}, {ref['center']['lon']:.4f}  [{ref['patch_id']}]")

    # GeoJSON completo (todas las features, por si lo quieres en un mapa)
    gj = {"type": "FeatureCollection", "metadata": {"top_n": args.top_n,
              "top_per_scene": args.top_per_scene, "dedup_cell_deg": args.dedup_cell_deg},
          "features": [{"type": "Feature", "bbox": r["bbox_crs"],
              "geometry": {"type": "Polygon", "coordinates": [[
                  [r["bbox_crs"][0], r["bbox_crs"][1]], [r["bbox_crs"][2], r["bbox_crs"][1]],
                  [r["bbox_crs"][2], r["bbox_crs"][3]], [r["bbox_crs"][0], r["bbox_crs"][3]],
                  [r["bbox_crs"][0], r["bbox_crs"][1]]]]},
              "properties": {k: r[k] for k in ("patch_id", "scene_id", "sim_luna", "sim_marte")}}
              for r in results]}
    (out / "analogues.geojson").write_text(json.dumps(gj, indent=2))

    print(f"\nTiempo: {time.time() - t0:.1f}s")

    return {"results": results, "dists_by_source": dists_by_source,
            "meta_by_scene": meta_by_scene, "rel_eps": args.rel_eps,
            "run_diagnostics": not args.no_diagnostics, "top5": top5_json}


if __name__ == "__main__":
    _out = main()
    if _out["run_diagnostics"]:
        run_diagnostics(_out["results"], _out["dists_by_source"], _out["rel_eps"])