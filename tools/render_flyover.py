#!/usr/bin/env python3
"""Pocasset V3 flyover renderer v0.2 — 3D hole illustration on real lidar terrain + exact projection data.

  python3 tools/render_flyover.py --hole 2 [--view tee|approach|all]

Reads (never writes): data/holes/holeNN/{features.geojson, hole.json, camera.json}, the locked course source
(neighbouring features), the locked elevation grid and tree-canopy grid (tools/terrain.py), style/flyover_style.json.
Writes (generated):   data/holes/holeNN/render/holeNN_<view>.jpg        the illustration
                      data/holes/holeNN/render/holeNN_<view>.json       projection (camera matrix + terrain reference)
                      data/holes/holeNN/render/holeNN_<view>_ids.png    material IDs per pixel (QA / alignment test)
                      data/holes/holeNN/render/holeNN_<view>_alignment.png  outlines drawn through the projection (QA)

What is real and what is style (docs/RENDERING_STANDARD.md):
  * Feature positions/shapes: only from features.geojson / the locked course source. Never moved.
  * Ground shape: 2021 USGS lidar (bare earth), drawn with the style's vertical exaggeration (stated in every JSON).
  * Woods: only where the locked canopy grid (2023 NAIP classification) says canopy. Crown shapes, tree height and
    colours are ILLUSTRATIVE. Canopy is never drawn on a mapped playing surface (+ buffer).
  * Bunker depth, tee/green edge bevels, mowing stripes, colours, lighting, haze: style only.
Requires numpy, scipy, opencv-python (renderer only; the data tools stay standard-library).
"""
import argparse, hashlib, json, math, os, sys, time
import numpy as np, cv2
from scipy import ndimage

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import pcv3  # noqa: E402
import terrain  # noqa: E402

RENDERER_VERSION = '0.2'
MAT = {'other': 0, 'rough': 1, 'fairway': 2, 'green': 3, 'tee': 4, 'bunker': 5, 'water': 6, 'path': 7, 'tree': 8, 'offcourse': 9, 'sky': 10}


def hexrgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255.0


def smooth(x):
    x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)


def hash2(i, j, salt=0):
    """Deterministic pseudo-random [0,1) per integer cell (world-anchored, so every canvas agrees)."""
    M = np.uint64(0xFFFFFFFF)
    h = (i.astype(np.int64).astype(np.uint64) * np.uint64(0x9E3779B1) + j.astype(np.int64).astype(np.uint64) * np.uint64(0x85EBCA77)
         + np.uint64((salt * 0xC2B2AE3D) & 0xFFFFFFFF)) & M
    h ^= h >> np.uint64(16); h = (h * np.uint64(0x85EBCA6B)) & M
    h ^= h >> np.uint64(13); h = (h * np.uint64(0xC2B2AE35)) & M
    h ^= h >> np.uint64(16)
    return (h & np.uint64(0xFFFFFF)).astype(np.float32) / float(0x1000000)


def vnoise(U, V, cell, salt):
    """World-anchored value noise (smooth), roughly -1..1."""
    x = U / cell; y = V / cell
    i = np.floor(x); j = np.floor(y); fx = smooth(x - i); fy = smooth(y - j)
    a = hash2(i, j, salt); b = hash2(i + 1, j, salt); c = hash2(i, j + 1, salt); d = hash2(i + 1, j + 1, salt)
    return ((a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy) * 2 - 1


def fbm(U, V, cells, weights, salt, min_cell=0.0):
    """Octaves finer than min_cell (about 2.5 texels) are faded out so a coarse canvas never aliases them into a grid."""
    out = np.zeros(U.shape, np.float32); tot = 0.0
    for k, (c, w) in enumerate(zip(cells, weights)):
        w = w * float(np.clip((c / max(min_cell, 1e-9)) - 1.0, 0, 1)) if min_cell > 0 else w
        if w <= 0:
            continue
        out += w * vnoise(U, V, c, salt + 17 * k); tot += w
    return out / tot if tot else out


def crowns(U, V, cell, salt):
    """Worley crowns, world-anchored. Returns (dome 0..1, per-crown random a, per-crown random b, edge distance)."""
    x = U / cell; y = V / cell; i0 = np.floor(x); j0 = np.floor(y)
    best = np.full(U.shape, 9.0, np.float32); ra = np.zeros(U.shape, np.float32); rb = np.zeros(U.shape, np.float32)
    second = np.full(U.shape, 9.0, np.float32); cxs = np.zeros(U.shape, np.float32); cys = np.zeros(U.shape, np.float32)
    rads = np.zeros(U.shape, np.float32)
    for di in (-1, 0, 1):
        for dj in (-1, 0, 1):
            ci = i0 + di; cj = j0 + dj
            px = ci + 0.15 + 0.7 * hash2(ci, cj, salt); py = cj + 0.15 + 0.7 * hash2(ci, cj, salt + 1)
            rad = 0.55 + 0.35 * hash2(ci, cj, salt + 2)
            d = np.sqrt((x - px) ** 2 + (y - py) ** 2) / rad
            closer = d < best
            second = np.where(closer, best, np.minimum(second, d))
            ra = np.where(closer, hash2(ci, cj, salt + 3), ra); rb = np.where(closer, hash2(ci, cj, salt + 4), rb)
            cxs = np.where(closer, px * cell, cxs); cys = np.where(closer, py * cell, cys); rads = np.where(closer, rad * cell, rads)
            best = np.minimum(best, d)
    dome = np.sqrt(np.clip(1 - best ** 2, 0, 1))
    crowns.last_radius = rads
    return dome.astype(np.float32), ra, rb, (second - best).astype(np.float32), cxs.astype(np.float32), cys.astype(np.float32)


class Canvas:
    """Top-down raster in the hole frame. Pixel (row i, col j) centre <-> (u0 + (j+.5)/ppm, v1 - (i+.5)/ppm)."""

    def __init__(self, u0, u1, v0, v1, ppm):
        self.ppm = float(ppm); self.u0 = u0; self.v1 = v1; self.u1 = u1; self.v0 = v0
        self.W = int(math.ceil((u1 - u0) * ppm)); self.H = int(math.ceil((v1 - v0) * ppm))
        j = ((np.arange(self.W) + 0.5) / ppm + u0).astype(np.float32); i = (v1 - (np.arange(self.H) + 0.5) / ppm).astype(np.float32)
        self.U, self.V = np.meshgrid(j, i)

    def px(self, pts):
        P = np.asarray(pts, np.float64); return np.c_[(P[:, 0] - self.u0) * self.ppm, (self.v1 - P[:, 1]) * self.ppm]

    def mask(self, polys, lines=(), line_w_m=0):
        m = np.zeros((self.H, self.W), np.uint8)
        for P in polys:
            cv2.fillPoly(m, [np.round(self.px(P) * 16).astype(np.int32)], 1, lineType=cv2.LINE_8, shift=4)
        for L in lines:
            cv2.polylines(m, [np.round(self.px(L) * 16).astype(np.int32)], False, 1, max(1, int(line_w_m * self.ppm)), lineType=cv2.LINE_8, shift=4)
        return m

    def sdf_win(self, P, margin_m):
        q = self.px(P); mg = margin_m * self.ppm
        j0 = int(max(0, math.floor(q[:, 0].min() - mg))); j1 = int(min(self.W, math.ceil(q[:, 0].max() + mg)))
        i0 = int(max(0, math.floor(q[:, 1].min() - mg))); i1 = int(min(self.H, math.ceil(q[:, 1].max() + mg)))
        if j1 <= j0 or i1 <= i0:
            return None, None
        m = np.zeros((i1 - i0, j1 - j0), np.uint8)
        cv2.fillPoly(m, [np.round((q - [j0, i0]) * 16).astype(np.int32)], 1, lineType=cv2.LINE_8, shift=4)
        mb = m.astype(bool)
        if not mb.any():
            return None, None
        sd = (ndimage.distance_transform_edt(mb) - ndimage.distance_transform_edt(~mb)) / self.ppm
        return (slice(i0, i1), slice(j0, j1)), sd.astype(np.float32)

    def line_dist(self, lines):
        m = np.zeros((self.H, self.W), np.uint8)
        for L in lines:
            cv2.polylines(m, [np.round(self.px(L) * 16).astype(np.int32)], False, 1, 1, lineType=cv2.LINE_8, shift=4)
        if not m.any():
            return np.full((self.H, self.W), 1e3, np.float32)
        return (ndimage.distance_transform_edt(m == 0) / self.ppm).astype(np.float32)

    def from_raster(self, R, r_u0, r_v1, r_cell):
        """Resample a hole-frame raster (row i = r_v1-(i+.5)*cell, col j = r_u0+(j+.5)*cell) onto this canvas (bicubic)."""
        mx = ((self.U - r_u0) / r_cell - 0.5).astype(np.float32); my = ((r_v1 - self.V) / r_cell - 0.5).astype(np.float32)
        return cv2.remap(R.astype(np.float32), mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)


def cover(sd, px_m):
    return np.clip(sd / px_m + 0.5, 0, 1)[..., None]


# ---------------------------------------------------------------- scene data
def load_scene(hole, style):
    d = pcv3.p('data', 'holes', 'hole%02d' % hole)
    fc = json.load(open(os.path.join(d, 'features.geojson'))); feats = fc['features']
    cl = [f for f in feats if f['properties']['class'] == 'centerline'][0]['geometry']['coordinates']
    gr = [f for f in feats if f['properties']['class'] == 'green'][0]['geometry']['coordinates'][0]
    F = pcv3.Frame(gr, cl)
    D, src = pcv3.course_features()
    ctx = {k: [] for k in ('fairway', 'green', 'tee', 'bunker', 'water', 'path', 'course', 'hole')}
    stripe_dir = {}
    for f in D['features']:
        L = f['properties']['layer']; g = f['geometry']
        if L not in ctx:
            continue
        if g['type'] == 'Polygon':
            ctx[L].append(([F.uv(c) for c in g['coordinates'][0]], f['properties'].get('holes') or []))
        elif g['type'] == 'LineString':
            P = [F.uv(c) for c in g['coordinates']]
            ctx[L].append((P, f['properties'].get('holes') or []))
            if L == 'hole':
                for h in f['properties'].get('holes') or []:
                    a, b = np.array(P[-2]), np.array(P[-1]); v = b - a; stripe_dir[h] = v / np.linalg.norm(v)
    # Hole features with corrected assignment (source_corrections.json) are in this hole's features.geojson:
    # make sure they paint as this hole's (the course source still lists them under the other hole).
    own_ids = {f['properties'].get('source_ref', '') for f in feats}
    for f in feats:
        ac = f['properties'].get('assignment', 'source')
        if ac != 'source' and f['geometry']['type'] == 'Polygon':
            L = {'tee': 'tee'}.get(f['properties']['class'])
            if L:
                P = [F.uv(c) for c in f['geometry']['coordinates'][0]]
                for k, (Q, hs) in enumerate(ctx[L]):
                    if len(Q) == len(P) and np.allclose(Q, P):
                        ctx[L][k] = (Q, sorted(set(hs) | {hole}))
    # tees the source files under this hole but that belong to another (source_corrections remove list) paint as neighbours
    rem = json.load(open(os.path.join(d, 'source_corrections.json'))).get('remove_from_this_hole', []) if os.path.exists(os.path.join(d, 'source_corrections.json')) else []
    for c in rem:
        ref = c['ref'].split(':', 1)[1]
        g = [f for f in D['features'] if f['properties'].get('osm_id') == ref]
        if g and g[0]['geometry']['type'] == 'Polygon':
            P = [F.uv(q) for q in g[0]['geometry']['coordinates'][0]]
            L = g[0]['properties']['layer']
            for k, (Q, hs) in enumerate(ctx.get(L, [])):
                if len(Q) == len(P) and np.allclose(Q, P):
                    ctx[L][k] = (Q, [x for x in hs if x != hole])
    Z, gZ = terrain.load_dem(hole); C, gC = terrain.load_canopy(hole)
    z_ref = float(terrain.heights_uv(hole, np.array([0.0]), np.array([0.0]), Z, gZ, F)[0])
    return {'hole': hole, 'dir': d, 'feats': feats, 'F': F, 'ctx': ctx, 'stripe_dir': stripe_dir, 'src': src,
            'Z': Z, 'gZ': gZ, 'C': C, 'gC': gC, 'z_ref': z_ref, 'own_ids': own_ids}


def build_world(sc, style):
    """1 m hole-frame rasters over the whole lidar area: bare terrain (exaggerated, relative to the green centre),
    canopy fraction (cleared from playing surfaces), canopy height, geometry height (terrain + canopy), shadow, AO."""
    T = style['terrain']; TR = style['trees']; ex = T['vertical_exaggeration']
    bnd = terrain.utm_bounds_uv(sc['F'], sc['gZ'])
    u0, u1 = math.floor(bnd[:, 0].min()), math.ceil(bnd[:, 0].max()); v0, v1 = math.floor(bnd[:, 1].min()), math.ceil(bnd[:, 1].max())
    cell = TR['world_cell_m']; cols = int((u1 - u0) / cell); rows = int((v1 - v0) / cell)
    t0 = time.time()
    Hb = terrain.raster_uv(sc['F'], sc['Z'], sc['gZ'], u0, v1, cell, cols, rows)
    nodata = np.isnan(Hb)
    if nodata.any():      # outside the lidar tile: hold the nearest measured height (drawn as haze, never as land)
        idx = ndimage.distance_transform_edt(nodata, return_distances=False, return_indices=True)
        Hb = Hb[tuple(idx)]
    Hb = (Hb - sc['z_ref']) * ex
    cv_ = Canvas(u0, u0 + cols * cell, v1 - rows * cell, v1, 1 / cell)
    if sc['C'] is not None and TR['enabled']:
        Cf = terrain.raster_uv(sc['F'], sc['C'], sc['gC'], u0, v1, cell, cols, rows)
        Cf = np.nan_to_num(Cf, nan=0.0)
        Cf = cv2.GaussianBlur(Cf, (0, 0), 1.2)
        # never on a mapped playing surface: clear mapped features + buffer (fairway, green, tee, bunker, water, path)
        polys = [P for L in ('fairway', 'green', 'tee', 'bunker', 'water') for P, _ in sc['ctx'][L]]
        lines = [P for P, _ in sc['ctx']['path']]
        keep = cv_.mask(polys, lines, style['path_width_m'])
        # distance (m) from playing surfaces (not paths), used to keep whole crowns off them; off in approved style v1.0
        play_dist = (ndimage.distance_transform_edt(cv_.mask(polys) == 0) / cv_.ppm).astype(np.float32)
        buf = int(round(TR['clear_buffer_m'] * cv_.ppm))
        keep = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * buf + 1, 2 * buf + 1)))
        Cf = Cf * (1 - keep)
        n = fbm(cv_.U, cv_.V, (9.0, 4.0), (0.6, 0.4), 31)
        cm = smooth((Cf - TR['threshold'] + 0.12 * n) / 0.12)
    else:
        cm = np.zeros_like(Hb); play_dist = np.full_like(Hb, 1e3)
    Hc = crown_heights(cv_, cm, cv_.u0, cv_.v1, cv_.ppm, TR, play_dist)
    Hg = (Hb + Hc).astype(np.float32)
    # sun shadows on the 1 m raster
    LT = style['light']
    shadow = np.ones_like(Hg)
    lx, ly = sc['light_xy']; tan_el = math.tan(math.radians(LT['elevation_deg']))
    mxb = np.tile(np.arange(cols, dtype=np.float32), (rows, 1)); myb = np.tile(np.arange(rows, dtype=np.float32)[:, None], (1, cols))
    for s in np.arange(1.0, 60.0, 1.0):
        hs = cv2.remap(Hg, (mxb + lx * s / cell).astype(np.float32), (myb - ly * s / cell).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        occ = (hs - (Hg + s * tan_el)) / 1.5
        shadow = np.minimum(shadow, 1 - np.clip(occ, 0, 1))
    shadow = cv2.GaussianBlur(shadow, (0, 0), 0.8)
    ao = 1 - LT['ao'] * np.clip((cv2.GaussianBlur(Hg, (0, 0), 6) - Hg) / 4.0, 0, 1)
    print('world raster %dx%d (1 m) in %.1fs' % (cols, rows, time.time() - t0), flush=True)
    return {'u0': u0, 'v1': v1, 'cell': cell, 'cols': cols, 'rows': rows, 'Hb': Hb.astype(np.float32), 'Hg': Hg, 'cm': cm.astype(np.float32),
            'shadow': shadow.astype(np.float32), 'ao': ao.astype(np.float32), 'nodata': nodata, 'ex': ex, 'play_dist': play_dist}


def crown_heights(cv_, cm, r_u0, r_v1, r_ppm, TR, play_dist=None):
    """Illustrative crowns: each crown exists only if the canopy fraction at its centre passes the threshold, so wood
    edges are made of rounded crowns. Height = nominal tree height x per-crown variation x spherical profile."""
    dome, ra, rb, _, cx, cy = crowns(cv_.U, cv_.V, TR['crown_cell_m'], 77)
    pres = cv2.remap(cm.astype(np.float32), ((cx - r_u0) * r_ppm - 0.5).astype(np.float32), ((r_v1 - cy) * r_ppm - 0.5).astype(np.float32),
                     cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    pres = smooth((pres - 0.5) / 0.15)
    if play_dist is not None and TR.get('crown_surface_fade', False):
        # whole crowns that would reach a playing surface (+ buffer) are left out; no crown is ever cut flat
        dc = cv2.remap(play_dist, ((cx - r_u0) * r_ppm - 0.5).astype(np.float32), ((r_v1 - cy) * r_ppm - 0.5).astype(np.float32),
                       cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        pres = pres * smooth((dc - crowns.last_radius - TR['clear_buffer_m']) / 1.0)
    top = TR['height_m'] * (0.8 + 0.4 * ra)
    d = np.sqrt(np.clip(1 - dome ** 2, 0, 1))
    p1, p2 = TR['crown_shape']
    return (pres * top * np.clip(1 - d ** p1, 0, 1) ** p2).astype(np.float32)


# ---------------------------------------------------------------- painting (top-down texture with baked lighting)
def paint(cv_, sc, style, world):
    hole = sc['hole']; ctx = sc['ctx']; stripe_dir = sc['stripe_dir']
    C = {k: hexrgb(v) for k, v in style['colors'].items()}
    S = style['stripes']; N = style['noise']; RL = style['relief']; TR = style['trees']
    shape = (cv_.H, cv_.W); px_m = 1.0 / cv_.ppm
    U, V = cv_.U, cv_.V
    mc = 2.5 / cv_.ppm
    n_fine = fbm(U, V, (3.0, 1.2, 0.5), (0.5, 0.3, 0.2), 1, mc)
    n_mid = fbm(U, V, (14.0, 6.0), (0.6, 0.4), 2, mc)
    n_big = fbm(U, V, (60.0, 25.0), (0.6, 0.4), 3, mc)
    mat = np.full(shape, MAT['rough'], np.uint8)
    # ---- rough: clumpy, patchy greens with drier patches
    img = C['rough'][None, None, :] * (1 + N['rough_amount'] * (0.6 * n_fine + 0.8 * n_mid))[..., None]
    mix = smooth(n_big * 0.9 + 0.5)[..., None] * 0.6
    img = img * (1 - mix) + C['rough_dark'] * (1 + N['rough_amount'] * n_fine[..., None]) * mix
    dry = smooth((n_mid * 0.7 + n_big * 0.5 - 0.35) / 0.4)[..., None] * N['rough_dry']
    img = img * (1 - dry) + C['rough_dry'] * (1 + 0.08 * n_fine[..., None]) * dry
    cpolys = [P for P, _ in ctx['course']]
    if cpolys:
        cin = cv_.mask(cpolys).astype(np.float32)
        off = 1 - cv2.GaussianBlur(cin, (0, 0), 6 * cv_.ppm)
        off = smooth(off * 1.4)[..., None]
        img = img * (1 - off) + C['offcourse'] * (1 + 0.12 * n_mid[..., None] + 0.06 * n_fine[..., None]) * off
        mat[(off[..., 0] > 0.5)] = MAT['offcourse']
    relief = np.zeros(shape, np.float32)
    # ---- fairways: wide mowing bands across each hole's own direction + light cross-cut
    fw_sd_all = np.full(shape, -1e3, np.float32)
    for P, hs in ctx['fairway']:
        sl, sd = cv_.sdf_win(P, style['first_cut_m'] + 4)
        if sl is None:
            continue
        fw_sd_all[sl] = np.maximum(fw_sd_all[sl], sd)
        dirv = stripe_dir.get(hs[0] if hs else None, np.array([0.0, 1.0]))
        along = U[sl] * dirv[0] + V[sl] * dirv[1]; across = U[sl] * dirv[1] - V[sl] * dirv[0]
        band = smooth((np.sin(along / S['fairway_width_m'] * math.pi) * 2.5) * 0.5 + 0.5)[..., None]
        cross = (0.5 + 0.5 * np.sin(across / (S['fairway_width_m'] * 0.75) * math.pi))[..., None]
        col = C['fairway'] * (1 - band * S['fairway_strength']) + C['fairway_stripe_dark'] * band * S['fairway_strength']
        col = col * (1 - 0.025 * cross) * (1 + N['fairway_amount'] * (n_fine[sl] + 0.6 * n_mid[sl]))[..., None]
        a = cover(sd, px_m); img[sl] = img[sl] * (1 - a) + col * a
        mat[sl][a[..., 0] > 0.5] = MAT['fairway']
        relief[sl] += RL['fairway_m'] * smooth(np.clip(sd / RL['fairway_edge_m'], 0, 1)) * (sd > -px_m)
    fc_band = ((fw_sd_all < 0) & (fw_sd_all > -style['first_cut_m'])).astype(np.float32)
    fc_band = cv2.GaussianBlur(fc_band, (0, 0), cv_.ppm * 0.3)[..., None] * 0.7
    img = img * (1 - fc_band) + C['first_cut'] * (1 + 0.04 * n_fine[..., None]) * fc_band
    # ---- cart paths
    if ctx['path']:
        ld = cv_.line_dist([P for P, _ in ctx['path']])
        sd = style['path_width_m'] / 2 - ld
        a = cover(sd, px_m); col = C['path'] * (1 + 0.05 * n_fine[..., None])
        e = smooth(np.clip(sd / 0.45, 0, 1))[..., None]; col = col * e + C['path_edge'] * (1 - e)
        img = img * (1 - a) + col * a; mat[a[..., 0] > 0.5] = MAT['path']
    # ---- water (colour here = the 'deep' look; reflection added in screen space)
    water = np.zeros(shape, np.float32)
    for P, _ in ctx['water']:
        sl, sd = cv_.sdf_win(P, 4)
        if sl is None:
            continue
        bank = ((sd < 0) & (sd > -style['water_bank_m'])).astype(np.float32)
        bank = cv2.GaussianBlur(bank, (0, 0), cv_.ppm * 0.3)[..., None] * 0.7
        img[sl] = img[sl] * (1 - bank) + C['water_bank'] * bank
        depth = smooth(np.clip(sd / 7.0, 0, 1))[..., None]
        col = C['water_shallow'] * (1 - depth) + C['water_deep'] * depth
        a = cover(sd, px_m); img[sl] = img[sl] * (1 - a) + col * a
        water[sl] = np.maximum(water[sl], a[..., 0]); mat[sl][a[..., 0] > 0.5] = MAT['water']
        relief[sl] -= RL['water_depth_m'] * smooth(np.clip(sd / RL['water_edge_m'], 0, 1)) * (sd > -px_m)
    # ---- tees
    for P, hs in ctx['tee']:
        sl, sd = cv_.sdf_win(P, 3)
        if sl is None:
            continue
        dirv = stripe_dir.get(hole if hole in hs else (hs[0] if hs else None), np.array([0.0, 1.0]))
        along = U[sl] * dirv[0] + V[sl] * dirv[1]
        band = (0.5 + 0.5 * np.sign(np.sin(along / S['tee_width_m'] * math.pi)))[..., None]
        band = cv2.GaussianBlur(band[..., 0], (0, 0), cv_.ppm * 0.15)[..., None]
        col = C['tee'] * (1 - 0.09 * band) * (1 + 0.03 * n_fine[sl][..., None])
        a = cover(sd, px_m); img[sl] = img[sl] * (1 - a) + col * a; mat[sl][a[..., 0] > 0.5] = MAT['tee']
        relief[sl] += RL['tee_m'] * smooth(np.clip((sd + 0.3) / RL['tee_edge_m'], 0, 1))
    # ---- greens (collar first), fine diagonal mowing
    for P, hs in ctx['green']:
        sl, sd = cv_.sdf_win(P, 5)
        if sl is None:
            continue
        collar = ((sd < 0) & (sd > -style['collar_m'])).astype(np.float32)
        collar = cv2.GaussianBlur(collar, (0, 0), cv_.ppm * 0.15)[..., None]
        img[sl] = img[sl] * (1 - collar) + C['collar'] * collar
        dirv = stripe_dir.get(hs[0] if hs else None, np.array([0.0, 1.0]))
        diag = (U[sl] * (dirv[0] + dirv[1]) + V[sl] * (dirv[1] - dirv[0])) / math.sqrt(2)
        band = (0.5 + 0.5 * np.sign(np.sin(diag / S['green_width_m'] * math.pi)))
        band = cv2.GaussianBlur(band.astype(np.float32), (0, 0), cv_.ppm * 0.12)[..., None]
        col = C['green'] * (1 - band * 0.07 * S['green_strength']) + C['green_stripe'] * band * 0.07 * S['green_strength']
        col = col * (1 + 0.02 * n_fine[sl][..., None])
        a = cover(sd, px_m); img[sl] = img[sl] * (1 - a) + col * a; mat[sl][a[..., 0] > 0.5] = MAT['green']
        relief[sl] += RL['green_m'] * smooth(np.clip((sd + 0.5) / RL['green_edge_m'], 0, 1))
    # ---- bunkers: grass lip, sand face shading comes from the relief, fine grain, rake texture
    for P, _ in ctx['bunker']:
        sl, sd = cv_.sdf_win(P, 3)
        if sl is None:
            continue
        lip = ((sd < 0) & (sd > -RL['bunker_lip_w_m'])).astype(np.float32)
        lip = cv2.GaussianBlur(lip, (0, 0), cv_.ppm * 0.2)[..., None] * 0.6
        img[sl] = img[sl] * (1 - lip) + C['bunker_lip'] * lip
        grain = fbm(U[sl], V[sl], (0.35, 0.15), (0.6, 0.4), 9, mc)
        col = C['sand'] * (1 + N['sand_amount'] * grain)[..., None]
        edge = smooth(np.clip(sd / 0.9, 0, 1))[..., None]
        col = col * edge + C['sand_shadow'] * (1 - edge)
        a = cover(sd, px_m); img[sl] = img[sl] * (1 - a) + col * a; mat[sl][a[..., 0] > 0.5] = MAT['bunker']
        relief[sl] += RL['bunker_lip_m'] * np.exp(-((sd + RL['bunker_lip_w_m'] * 0.5) / (RL['bunker_lip_w_m'] * 0.5)) ** 2)
        relief[sl] -= RL['bunker_depth_m'] * smooth(np.clip(sd / RL['bunker_edge_m'], 0, 1)) * (sd > -px_m)
    # ---- neighbouring holes recede (appearance only; nothing removed)
    own = np.zeros(shape, np.float32)
    for L in ('fairway', 'green', 'tee', 'bunker'):
        for P, hs in ctx[L]:
            if hole in hs:
                sl, sd = cv_.sdf_win(P, 10)
                if sl is not None:
                    own[sl] = np.maximum(own[sl], smooth(np.clip((sd + 10) / 10, 0, 1)))
    k = style['context_dim'] * (1 - own)[..., None]
    grey = img.mean(axis=2, keepdims=True)
    img = img * (1 - k) + (grey * 0.45 + img * 0.55) * 0.9 * k
    # ---- woods: canopy grid -> illustrative crowns
    w = world
    cm = cv_.from_raster(w['cm'], w['u0'], w['v1'], w['cell']); cm = np.clip(cm, 0, 1)
    Hc = cv_.from_raster(w['Hg'] - w['Hb'], w['u0'], w['v1'], w['cell'])
    if TR['enabled'] and cm.max() > 0:
        Hc = crown_heights(cv_, w['cm'], w['u0'], w['v1'], 1 / w['cell'], TR, w['play_dist'])
        dome, ra, rb, edge, _, _ = crowns(U, V, TR['crown_cell_m'], 77)
        dome2 = crowns(U, V, TR['crown_cell_m'] * 0.45, 91)[0]
        pal = [hexrgb(c) for c in TR['palette']]
        idx = np.minimum((rb * len(pal)).astype(int), len(pal) - 1)
        base = np.stack(pal)[idx]
        base = base * (0.85 + 0.3 * ra)[..., None]
        tex = base * (0.55 + 0.45 * dome[..., None]) * (0.85 + 0.15 * dome2[..., None]) * (1 + 0.1 * n_fine[..., None])
        tex = tex * (0.75 + 0.25 * smooth(edge * 3))[..., None]
        a = smooth(Hc / 1.5)[..., None]
        img = img * (1 - a) + tex * a
        mat[a[..., 0] > 0.5] = MAT['tree']
    # ---- lighting: real terrain (exaggerated) + cosmetic relief + canopy; sun shadows; ambient occlusion
    LT = style['light']; T = style['terrain']
    Hb = cv_.from_raster(w['Hb'], w['u0'], w['v1'], w['cell'])
    if TR['enabled'] and cm.max() > 0:
        Hc = Hc + smooth(Hc / 1.5) * TR['crown_relief_m'] * (dome2 - 0.5)
    Hb = cv2.GaussianBlur(Hb, (0, 0), cv_.ppm * T['shade_smooth_m'])     # the lidar is 2 m: smooth before lighting (no facets)
    Hs = Hb * T['shade_gain'] + cv2.GaussianBlur(relief, (0, 0), max(1.2, cv_.ppm * 0.35)) * LT['relief_exaggeration'] + Hc
    gy, gx = np.gradient(Hs, 1 / cv_.ppm)
    nx, ny, nz = -gx, gy, np.ones_like(gx)
    nrm = np.sqrt(nx * nx + ny * ny + nz * nz)
    lv = sc['light_vec']
    lam = np.clip((nx * lv[0] + ny * lv[1] + nz * lv[2]) / nrm, 0, 1)
    sh = cv_.from_raster(w['shadow'], w['u0'], w['v1'], w['cell']); sh = np.clip(sh, 0, 1)
    ao = cv_.from_raster(w['ao'], w['u0'], w['v1'], w['cell']); ao = np.clip(ao, 0, 1)
    sh = 1 - LT['shadow_strength'] * (1 - sh)
    shade = (LT['ambient'] * ao + LT['diffuse'] * lam * sh) / (LT['ambient'] + LT['diffuse'] * lv[2])
    img = img * shade[..., None]
    nod = cv_.from_raster(w['nodata'].astype(np.float32), w['u0'], w['v1'], w['cell']) > 0.5
    img[nod] = C['haze']; mat[nod] = MAT['other']
    tex4 = np.dstack([np.clip(img, 0, 1.2), water]).astype(np.float32)
    return tex4, mat


# ---------------------------------------------------------------- camera
def build_camera(view, sc, world, W, H):
    """Pinhole camera in hole-frame metres (x=u right, y=v forward, z=up; z = exaggerated height relative to the green
    centre). Placed behind the look-from point at back_m and height_m above its ground; pitch and field of view are
    solved so the ground show_behind_tee_m behind the look-from point is the bottom edge and show_beyond_green_m beyond
    the green centre is the top edge."""
    F = sc['F']; feats = sc['feats']
    def hb(u, v):
        return float(cv2.remap(world['Hb'], np.array([[(u - world['u0']) / world['cell'] - 0.5]], np.float32),
                               np.array([[(world['v1'] - v) / world['cell'] - 0.5]], np.float32), cv2.INTER_LINEAR)[0, 0])
    if 'look_from_green_m' in view:
        T = np.array([0.0, -float(view['look_from_green_m'])])
    else:
        tee = [f for f in feats if f['properties']['id'] == view['look_from_feature']][0]
        T = np.array(pcv3.centroid([F.uv(c) for c in tee['geometry']['coordinates'][0]]))
    G = np.array([0.0, 0.0])
    d = G - T; L = float(np.linalg.norm(d)); d /= L
    side = np.array([d[1], -d[0]])
    b, h = view['back_m'], view['height_m']
    C2 = T - d * b + side * view.get('side_shift_m', 0)
    Cz = hb(*T) + h
    C = np.array([C2[0], C2[1], Cz])
    near = T - d * view['show_behind_tee_m']; far = G + d * view['show_beyond_green_m']
    def ang(p):
        dz = hb(*p) - Cz; dh = float(np.dot(p - C2, d)); return math.atan2(-dz, dh)
    a_bot = ang(near); a_top = ang(far)
    pitch = (a_bot + a_top) / 2; vfov = a_bot - a_top
    f = np.array([d[0] * math.cos(pitch), d[1] * math.cos(pitch), -math.sin(pitch)])
    r = np.cross(f, [0, 0, 1.0]); r /= np.linalg.norm(r)
    up = np.cross(r, f)
    fpx = (H / 2) / math.tan(vfov / 2)
    K = np.array([[fpx, 0, W / 2], [0, fpx, H / 2], [0, 0, 1.0]])
    R = np.vstack([r, -up, f])
    P = K @ np.c_[R, -R @ C]
    return {'C': C, 'f': f, 'r': r, 'up': up, 'fpx': fpx, 'K': K, 'R': R, 'P': P, 'pitch_deg': math.degrees(pitch),
            'vfov_deg': math.degrees(vfov), 'hfov_deg': math.degrees(2 * math.atan((W / 2) / fpx)), 'look_from_uv': T.tolist(), 'look_from_to_green_m': L}


def raymarch(cam, world, W, H, max_t):
    """Per output pixel: first intersection of the camera ray with the geometry heightfield (terrain + canopy).
    Returns u, v, t (distance), hit mask."""
    Hg = world['Hg']; zmax = float(Hg.max()) + 0.5; zmin = float(Hg.min()) - 0.5
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    Kinv = np.linalg.inv(cam['K']); Rt = cam['R'].T
    dx = Kinv[0, 0] * (xs + 0.5) + Kinv[0, 2]; dy = Kinv[1, 1] * (ys + 0.5) + Kinv[1, 2]
    D = np.stack([Rt[i, 0] * dx + Rt[i, 1] * dy + Rt[i, 2] for i in range(3)])
    D /= np.linalg.norm(D, axis=0)
    C = [float(x) for x in cam['C']]
    dz = np.minimum(D[2], -1e-4)
    t0 = np.clip((zmax - C[2]) / dz, 0, max_t); t1 = np.clip((zmin - C[2]) / dz, 0, max_t)
    def hsample(t):
        u = C[0] + D[0] * t; v = C[1] + D[1] * t
        return cv2.remap(Hg, ((u - world['u0']) / world['cell'] - 0.5).astype(np.float32),
                         ((world['v1'] - v) / world['cell'] - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    N = 160
    lo = t0.copy(); hi = np.full(t0.shape, np.nan, np.float32)
    prev = t0
    for k in range(1, N + 1):
        t = t0 + (t1 - t0) * (k / N)
        below = (C[2] + D[2] * t) <= hsample(t)
        new = below & np.isnan(hi)
        hi[new] = t[new]; lo[new] = prev[new]
        prev = t
    hit = ~np.isnan(hi)
    hi = np.where(hit, hi, t1); lo = np.where(hit, lo, t1)
    for _ in range(8):
        mid = (lo + hi) / 2
        below = (C[2] + D[2] * mid) <= hsample(mid)
        hi = np.where(below, mid, hi); lo = np.where(below, lo, mid)
    t = (lo + hi) / 2
    hit &= t < max_t * 0.999
    return (C[0] + D[0] * t).astype(np.float32), (C[1] + D[1] * t).astype(np.float32), t.astype(np.float32), hit, D


def sample_canvas(cv_, tex, mat, u, v, sel):
    """Mip-mapped texture lookup for the selected output pixels; returns rgbw [H,W,4], material [H,W]."""
    mx = ((u - cv_.u0) * cv_.ppm - 0.5).astype(np.float32); my = ((cv_.v1 - v) * cv_.ppm - 0.5).astype(np.float32)
    def mind(a, ax):
        f = np.abs(np.diff(a, axis=ax, append=np.take(a, [-1], axis=ax))); b = np.abs(np.diff(a, axis=ax, prepend=np.take(a, [0], axis=ax)))
        return np.minimum(f, b)
    foot = np.maximum(np.hypot(mind(mx, 1), mind(my, 1)), np.hypot(mind(mx, 0), mind(my, 0)))
    lvl = np.clip(np.log2(np.maximum(foot, 1e-6)), 0, 5).astype(np.float32)
    out = np.zeros(u.shape + (4,), np.float32); wsum = np.zeros(u.shape + (1,), np.float32)
    level = tex
    for k in range(6):
        s = 2.0 ** k
        wk = np.clip(1 - np.abs(lvl - k), 0, 1)[..., None] * sel[..., None]
        if wk.max() > 0:
            out += cv2.remap(level, (mx + 0.5) / s - 0.5, (my + 0.5) / s - 0.5, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) * wk
            wsum += wk
        if k < 5:
            level = cv2.pyrDown(level)
    out /= np.maximum(wsum, 1e-6)
    m = cv2.remap(mat, mx, my, cv2.INTER_NEAREST, borderMode=cv2.BORDER_REPLICATE)
    return out, m


# ---------------------------------------------------------------- main render
def check_visual_baseline():
    """Approved visual baseline guard (owner approval 15 Nov 2026): the shared style may not change without approval."""
    lp = pcv3.p('style', 'approved', 'VISUAL_BASELINE_v1.0.json')
    if not os.path.exists(lp):
        return
    lock = json.load(open(lp))
    cur = hashlib.sha256(open(pcv3.p('style', 'flyover_style.json'), 'rb').read()).hexdigest()
    if cur != lock['files']['style/approved/flyover_style_v1.0.json']:
        ok = os.environ.get('PCV3_STYLE_CHANGE_APPROVED')
        if not ok:
            sys.exit('STOP: style/flyover_style.json differs from the owner-approved visual baseline v%s. Significant visual changes '
                     'must be discussed with the owner first. If a change was approved, record it in docs/DECISIONS.md and run with '
                     'PCV3_STYLE_CHANGE_APPROVED="<decision date/ref>".' % lock['version'])
        print('NOTE: rendering with a style change approved as:', ok, flush=True)


def render(hole, view_name):
    tstart = time.time()
    check_visual_baseline()
    style = json.load(open(pcv3.p('style', 'flyover_style.json')))
    d = pcv3.p('data', 'holes', 'hole%02d' % hole)
    cam_cfg = json.load(open(os.path.join(d, 'camera.json')))['views'][view_name]
    sc = load_scene(hole, style)
    out = dict(style['output']); out['height'] = cam_cfg.get('output_height_px', out['height'])
    SS = out['supersample']; W, H = out['width'] * SS, out['height'] * SS
    # light fixed relative to the camera direction so every hole is lit alike
    tmpT = None
    if 'look_from_green_m' in cam_cfg:
        tmpT = np.array([0.0, -float(cam_cfg['look_from_green_m'])])
    else:
        tee = [f for f in sc['feats'] if f['properties']['id'] == cam_cfg['look_from_feature']][0]
        tmpT = np.array(pcv3.centroid([sc['F'].uv(c) for c in tee['geometry']['coordinates'][0]]))
    fwd = -tmpT / np.linalg.norm(tmpT); right = np.array([fwd[1], -fwd[0]])
    LT = style['light']; az = math.radians(LT['azimuth_from_camera_left_deg']); el = math.radians(LT['elevation_deg'])
    l2 = -right * math.cos(az) + fwd * math.sin(az)
    sc['light_xy'] = l2; sc['light_vec'] = np.array([l2[0] * math.cos(el), l2[1] * math.cos(el), math.sin(el)])
    world = build_world(sc, style)
    cam = build_camera(cam_cfg, sc, world, W, H)
    print('camera: pitch %.1f°, vfov %.1f°, hfov %.1f°, %.0f m above ground' % (cam['pitch_deg'], cam['vfov_deg'], cam['hfov_deg'], cam_cfg['height_m']), flush=True)
    t0 = time.time()
    U_, V_, T_, hit, Dir = raymarch(cam, world, W, H, style['max_view_m'])
    print('ray-march %dx%d in %.1fs (hit %.1f%%)' % (W, H, time.time() - t0, 100 * hit.mean()), flush=True)
    # ---- detail canvas: the hole corridor at the view's texture density; coarse canvas: whole lidar area
    pts = np.array([sc['F'].uv(c) for f in sc['feats'] for c in (f['geometry']['coordinates'][0] if f['geometry']['type'] == 'Polygon' else f['geometry']['coordinates'] if f['geometry']['type'] == 'LineString' else [])])
    m = style['detail_margin_m']
    seen = hit
    du0, du1 = max(pts[:, 0].min() - m, float(np.percentile(U_[seen], 0.5))), min(pts[:, 0].max() + m, float(np.percentile(U_[seen], 99.5)))
    dv0, dv1 = max(pts[:, 1].min() - m, float(np.percentile(V_[seen], 0.5))), min(pts[:, 1].max() + m, float(np.percentile(V_[seen], 99.5)))
    ppm = cam_cfg.get('texture_px_per_m', style['texture_px_per_m'])
    while (du1 - du0) * (dv1 - dv0) * ppm * ppm > style['max_canvas_px']:
        ppm *= 0.9
    t0 = time.time()
    cvd = Canvas(du0, du1, dv0, dv1, ppm)
    texd, matd = paint(cvd, sc, style, world)
    print('detail canvas %dx%d (%.1f px/m; u %.0f..%.0f, v %.0f..%.0f) in %.1fs' % (cvd.W, cvd.H, ppm, du0, du1, dv0, dv1, time.time() - t0), flush=True)
    t0 = time.time()
    w = world
    cvc = Canvas(w['u0'], w['u0'] + w['cols'] * w['cell'], w['v1'] - w['rows'] * w['cell'], w['v1'], style['coarse_px_per_m'])
    texc, matc = paint(cvc, sc, style, world)
    print('coarse canvas %dx%d in %.1fs' % (cvc.W, cvc.H, time.time() - t0), flush=True)
    t0 = time.time()
    ind = hit & (U_ >= du0 + 0.5) & (U_ <= du1 - 0.5) & (V_ >= dv0 + 0.5) & (V_ <= dv1 - 0.5)
    a_d, m_d = sample_canvas(cvd, texd, matd, U_, V_, ind.astype(np.float32))
    edge = np.minimum.reduce([U_ - du0, du1 - U_, V_ - dv0, dv1 - V_])
    a_c, m_c = sample_canvas(cvc, texc, matc, U_, V_, (hit & (~ind | (edge < 25.0))).astype(np.float32))
    del texd, texc
    # soft blend at the edge of the detail canvas
    bw = (np.clip(edge / 25.0, 0, 1) * ind)[..., None]
    rgbw = a_d * bw + a_c * (1 - bw)
    if os.environ.get('PCV3_DEBUG'):
        dbg = np.dstack([ind * 255, (hit & ~ind) * 255, np.clip(T_ / 4, 0, 255)]).astype(np.uint8)
        cv2.imwrite('/tmp/dbg_%s.png' % view_name, cv2.resize(dbg, (W // 4, H // 4), interpolation=cv2.INTER_NEAREST))
        cv2.imwrite('/tmp/dbg_ad_%s.jpg' % view_name, cv2.resize((np.clip(a_d[..., :3], 0, 1) * 255)[..., ::-1].astype(np.uint8), (W // 4, H // 4)))
        cv2.imwrite('/tmp/dbg_ac_%s.jpg' % view_name, cv2.resize((np.clip(a_c[..., :3], 0, 1) * 255)[..., ::-1].astype(np.uint8), (W // 4, H // 4)))
        pass
    mat = np.where(ind, m_d, m_c).astype(np.uint8)
    img = rgbw[..., :3]; water = rgbw[..., 3:4]
    Zh = (cam['C'][2] + Dir[2] * T_).astype(np.float32)
    trees = (mat == MAT['tree'])[..., None]
    leaf = fbm(U_ + 0.41 * Zh, V_ + 0.61 * Zh, (1.4, 0.55), (0.6, 0.4), 101)[..., None]
    gz = cv2.remap(world['Hb'], ((U_ - world['u0']) / world['cell'] - 0.5).astype(np.float32), ((world['v1'] - V_) / world['cell'] - 0.5).astype(np.float32),
                   cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    rel = np.clip((Zh - gz) / style['trees']['height_m'], 0, 1)[..., None]
    img = img * np.where(trees, (1 + 0.3 * leaf) * (0.5 + 0.5 * rel ** 0.7), 1.0)
    # micro grass texture in screen space (keeps close ground crisp; fades out where it would alias)
    grass = np.isin(mat, [MAT['rough'], MAT['fairway'], MAT['green'], MAT['tee'], MAT['offcourse']])[..., None]
    fx = np.abs(np.diff(U_, axis=1, append=U_[:, -1:])) + np.abs(np.diff(V_, axis=0, append=V_[-1:, :]))
    micro = fbm(U_, V_, (0.28, 0.11), (0.6, 0.4), 131)[..., None]
    fade = np.clip(1 - (fx[..., None] - 0.03) / 0.06, 0, 1)
    img = img * np.where(grass, 1 + style['noise']['micro_amount'] * micro * fade, 1.0)
    # ---- water: Fresnel sky reflection + soft sparkle (screen space)
    Cc = {k: hexrgb(v) for k, v in style['colors'].items()}
    cos_i = np.clip(-Dir[2], 0, 1)[..., None]
    fres = 0.04 + 0.96 * (1 - cos_i) ** 5
    sky_r = Cc['sky_horizon'] * 0.6 + Cc['sky_top'] * 0.4
    ripple = fbm(U_, V_, (2.5, 0.9), (0.6, 0.4), 55)[..., None]
    wcol = img * (1 - fres * style['water']['reflection']) + sky_r * fres * style['water']['reflection']
    wcol = wcol * (1 + 0.05 * ripple) + style['water']['sparkle'] * np.clip(ripple - 0.55, 0, 1) * 2
    img = img * (1 - water) + wcol * water
    # ---- sky (no terrain hit) and distance haze
    yy = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    sky = Cc['sky_top'] * (1 - yy) + Cc['sky_horizon'] * yy
    hz = style['haze']
    hzk = (hz['amount'] * smooth(np.clip((T_ - hz['start_m']) / hz['distance_m'], 0, 1)))[..., None]
    img = img * (1 - hzk) + Cc['haze'] * hzk
    img = np.where(hit[..., None], img, sky)
    mat[~hit] = MAT['sky']
    # gentle grade + vignette
    img = np.clip(img, 0, 1) ** style['grade']['gamma']
    lum = img.mean(axis=2, keepdims=True); img = np.clip(lum + (img - lum) * style['grade']['saturation'], 0, 1)
    yy2, xx2 = np.mgrid[0:H, 0:W].astype(np.float32)
    vg = 1 - style['vignette'] * (((xx2 - W / 2) / (W / 2)) ** 2 * 0.6 + ((yy2 - H / 2) / (H / 2)) ** 2 * 0.4)
    img = np.clip(img * vg[..., None], 0, 1)
    final = cv2.resize(img, (out['width'], out['height']), interpolation=cv2.INTER_AREA)
    mat_out = cv2.resize(mat, (out['width'], out['height']), interpolation=cv2.INTER_NEAREST)
    print('compose in %.1fs' % (time.time() - t0), flush=True)
    # ---- outputs
    rd = os.path.join(d, 'render'); os.makedirs(rd, exist_ok=True)
    base = os.path.join(rd, 'hole%02d_%s' % (hole, view_name))
    bgr = cv2.cvtColor((final * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR)
    cv2.imwrite(base + '.jpg', bgr, [cv2.IMWRITE_JPEG_QUALITY, out['jpeg_quality'], cv2.IMWRITE_JPEG_PROGRESSIVE, 1])
    cv2.imwrite(base + '_ids.png', mat_out)
    Pout = np.diag([1 / SS, 1 / SS, 1.0]) @ cam['P']
    def sh(path):
        return hashlib.sha256(open(path, 'rb').read()).hexdigest()
    tj = json.load(open(os.path.join(d, 'terrain.json')))
    proj = {
        'schema': 'pocasset-v3/flyover-projection@2', 'renderer': RENDERER_VERSION, 'hole': hole, 'view': view_name,
        'image': os.path.basename(base + '.jpg'), 'width': out['width'], 'height': out['height'],
        'frame': json.load(open(os.path.join(d, 'hole.json')))['frame'],
        'camera_matrix': [[round(x, 10) for x in row] for row in Pout.tolist()],
        'height_model': {'terrain_file': 'terrain.json', 'terrain_sha256': sh(os.path.join(d, 'terrain.json')),
                         'z_ref_m': round(sc['z_ref'], 3), 'vertical_exaggeration': world['ex'],
                         'formula': 'z = (terrain(u,v) - z_ref) * vertical_exaggeration; terrain = bilinear in terrain.json (metres = z_dm/10)'},
        'how_to_use': 'pixel = M · [u, v, z, 1] (divide by the 3rd value). u,v = hole-frame metres (u right, v toward the green, origin green centre); '
                      'z from height_model at (u,v). Ground points only (the ball is on the ground; tree crowns are not part of the height model).',
        'camera': {'position_uvz_m': [round(x, 3) for x in cam['C'].tolist()], 'forward': [round(x, 6) for x in cam['f'].tolist()],
                   'vfov_deg': round(cam['vfov_deg'], 4), 'hfov_deg': round(cam['hfov_deg'], 4), 'pitch_deg': round(cam['pitch_deg'], 4),
                   'focal_px': round(cam['fpx'] / SS, 4), 'look_from_uv': [round(x, 3) for x in cam['look_from_uv']]},
        'inputs_sha256': {'features.geojson': sh(os.path.join(d, 'features.geojson')), 'camera.json': sh(os.path.join(d, 'camera.json')),
                          'flyover_style.json': sh(pcv3.p('style', 'flyover_style.json')), 'course_source': sc['src']['sha256'],
                          'elevation_source': terrain.elevation_source(sc['hole'])['sha256'],
                          'canopy_source': terrain.canopy_source(sc['hole'])['sha256'] if sc['C'] is not None else None},
        'trees': 'ILLUSTRATIVE woods where the locked 2023 NAIP canopy grid shows canopy; crown shapes, %.0f m nominal height and colours are style, not surveyed trees' % style['trees']['height_m'],
        'terrain': '2021 USGS 3DEP lidar bare earth (2 m), vertical exaggeration %.2fx; bunker depths and tee/green edge bevels are cosmetic' % world['ex'],
        'material_ids': {v: k for k, v in MAT.items()},
    }
    json.dump(proj, open(base + '.json', 'w'), indent=1)
    # ---- alignment QA image: every mapped outline of this hole projected with the stored matrix + height model
    qa = bgr.copy(); tz = TerrainLookup(tj)
    for f in sc['feats']:
        g = f['geometry']
        pts = g['coordinates'][0] if g['type'] == 'Polygon' else g['coordinates'] if g['type'] == 'LineString' else None
        if not pts:
            continue
        Pp = np.array([sc['F'].uv(c) for c in pts])
        z = (tz.h(Pp[:, 0], Pp[:, 1]) - sc['z_ref']) * world['ex']
        hp = Pout @ np.c_[Pp, z, np.ones(len(Pp))].T
        if (hp[2] <= 0).any():
            continue
        hp = (hp[:2] / hp[2]).T
        cv2.polylines(qa, [np.round(hp * 4).astype(np.int32)], g['type'] == 'Polygon', (0, 0, 255), 2, cv2.LINE_AA, shift=2)
    cv2.imwrite(base + '_alignment.png', qa)
    print('rendered', base + '.jpg', '%dx%d' % (out['width'], out['height']), 'total %.0fs' % (time.time() - tstart))
    return base


class TerrainLookup:
    """Bilinear lookup in terrain.json (same formula as app/geo.js Terrain)."""

    def __init__(self, tj):
        self.t = tj; self.z = np.array(tj['z_dm'], np.float32) / 10.0

    def h(self, u, v):
        t = self.t
        x = np.clip((np.asarray(u) - t['u0']) / t['cell_m'], 0, t['cols'] - 1.0001); y = np.clip((np.asarray(v) - t['v0']) / t['cell_m'], 0, t['rows'] - 1.0001)
        i = np.floor(y).astype(int); j = np.floor(x).astype(int); fy = y - i; fx = x - j
        Z = self.z
        return (Z[i, j] * (1 - fx) + Z[i, j + 1] * fx) * (1 - fy) + (Z[i + 1, j] * (1 - fx) + Z[i + 1, j + 1] * fx) * fy


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--hole', type=int, required=True); ap.add_argument('--view', default='all')
    a = ap.parse_args()
    for v in (['tee', 'approach'] if a.view == 'all' else [a.view]):
        render(a.hole, v)
