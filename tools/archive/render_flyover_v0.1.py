#!/usr/bin/env python3
"""Pocasset V3 flyover renderer — pre-rendered 3D-style hole illustration + exact projection data.

  python3 tools/render_flyover.py --hole 2 [--view tee]

Reads (never writes): data/holes/holeNN/features.geojson, hole.json, camera.json,
                      the locked course source (for neighbouring context features), style/flyover_style.json
Writes (generated):   data/holes/holeNN/render/holeNN_<view>.jpg   the illustration
                      data/holes/holeNN/render/holeNN_<view>.json  projection: hole-frame metres -> image pixels
                      data/holes/holeNN/render/holeNN_<view>_alignment.png   outlines drawn through the projection (QA)

Geography is only ever *painted where the data puts it*. The style file controls colour, texture, cosmetic edge bevels,
lighting and haze; it cannot move or add features. No trees are drawn until a tree-position source exists.
Requires numpy, scipy, opencv-python, Pillow (renderer only; the data tools stay standard-library).
"""
import argparse, hashlib, json, math, os, sys
import numpy as np, cv2
from scipy import ndimage

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import pcv3  # noqa: E402  (Frame, source checks)


def hexrgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255.0


def smooth(x):
    x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)


def fbm(shape, seed, scales=(64, 24, 9, 3), weights=(0.45, 0.3, 0.17, 0.08)):
    rng = np.random.default_rng(seed); out = np.zeros(shape, np.float32)
    for s, w in zip(scales, weights):
        small = rng.standard_normal((max(2, shape[0] // s + 2), max(2, shape[1] // s + 2))).astype(np.float32)
        out += w * cv2.resize(small, (shape[1], shape[0]), interpolation=cv2.INTER_CUBIC)
    return out / (np.std(out) + 1e-6)


class Canvas:
    """Top-down raster in the hole frame. Pixel (row i, col j) <-> (u, v) metres."""

    def __init__(self, u0, u1, v0, v1, ppm):
        self.ppm = ppm; self.u0 = u0; self.v1 = v1
        self.W = int(math.ceil((u1 - u0) * ppm)); self.H = int(math.ceil((v1 - v0) * ppm))
        j = (np.arange(self.W) + 0.5) / ppm + u0; i = v1 - (np.arange(self.H) + 0.5) / ppm
        self.U, self.V = np.meshgrid(j, i)

    def px(self, pts):
        return np.array([[(u - self.u0) * self.ppm, (self.v1 - v) * self.ppm] for u, v in pts], np.float64)

    def mask(self, polys):
        m = np.zeros((self.H, self.W), np.uint8)
        for P in polys:
            cv2.fillPoly(m, [np.round(self.px(P) * 16).astype(np.int32)], 1, lineType=cv2.LINE_8, shift=4)
        return m.astype(bool)

    def sdf(self, polys):
        """Signed distance in metres: >0 inside, <0 outside."""
        m = self.mask(polys)
        if not m.any():
            return np.full((self.H, self.W), -1e3, np.float32)
        inside = ndimage.distance_transform_edt(m); outside = ndimage.distance_transform_edt(~m)
        return ((inside - outside) / self.ppm).astype(np.float32)

    def sdf_win(self, P, margin_m):
        """Signed distance (metres) for one polygon, computed only in a window around it.
        Returns (slice, sd) or (None, None) if the polygon is outside the canvas."""
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


def cover(sd, px_m):
    """Anti-aliased coverage from a signed distance (metres)."""
    return np.clip(sd / px_m + 0.5, 0, 1)[..., None]


def build_camera(view, F, feats, W, H):
    """Pinhole camera in the hole frame (x=u right, y=v forward, z up), set up from plain settings:
    camera height and distance behind the tee; how much ground to show behind the tee (bottom edge)
    and beyond the green centre (top edge). Pitch and field of view are solved from those.
    Returns the camera and the homography ground (u,v) -> image pixel."""
    if 'look_from_green_m' in view:       # approach views: a point on the approach axis, short of the green centre
        T = np.array([0.0, -float(view['look_from_green_m'])])
    else:
        tee = [f for f in feats if f['properties']['id'] == view['look_from_feature']][0]
        T = np.array(pcv3.centroid([F.uv(c) for c in tee['geometry']['coordinates'][0]]))
    G = np.array([0.0, 0.0])
    d = G - T; L = float(np.linalg.norm(d)); d /= L
    side = np.array([d[1], -d[0]])
    b, h = view['back_m'], view['height_m']
    near = b - view['show_behind_tee_m']; far = b + L + view['show_beyond_green_m']
    a_bot = math.atan2(h, near); a_top = math.atan2(h, far)
    pitch = (a_bot + a_top) / 2; vfov = a_bot - a_top
    C = np.array([*(T - d * b + side * view.get('side_shift_m', 0)), h])
    f = np.array([d[0] * math.cos(pitch), d[1] * math.cos(pitch), -math.sin(pitch)])
    r = np.cross(f, [0, 0, 1.0]); r /= np.linalg.norm(r)
    up = np.cross(r, f)
    fpx = (H / 2) / math.tan(vfov / 2)
    cx, cy = W / 2, H / 2
    row_w = np.array([f[0], f[1], -f @ C])
    row_x = fpx * np.array([r[0], r[1], -r @ C]) + cx * row_w
    row_y = -fpx * np.array([up[0], up[1], -up @ C]) + cy * row_w
    Hm = np.vstack([row_x, row_y, row_w])
    return {'C': C, 'f': f, 'r': r, 'up': up, 'fpx': fpx, 'cx': cx, 'cy': cy, 'H': Hm / Hm[2, 2],
            'pitch_deg': math.degrees(pitch), 'vfov_deg': math.degrees(vfov), 'tee_to_green_m': L}


def ground_footprint(cam, W, H):
    Hi = np.linalg.inv(cam['H']); pts = []
    for x, y in [(0, 0), (W, 0), (0, H), (W, H), (W / 2, 0)]:
        q = Hi @ [x, y, 1]
        if q[2] <= 0:
            sys.exit('STOP: camera sees above the horizon at the top of the image; lower target or raise height')
        pts.append(q[:2] / q[2])
    return np.array(pts)


def render(hole, view_name):
    d = pcv3.p('data', 'holes', 'hole%02d' % hole)
    style = json.load(open(pcv3.p('style', 'flyover_style.json')))
    cam_cfg = json.load(open(os.path.join(d, 'camera.json')))['views'][view_name]
    fc = json.load(open(os.path.join(d, 'features.geojson'))); feats = fc['features']
    cl = [f for f in feats if f['properties']['class'] == 'centerline'][0]['geometry']['coordinates']
    gr = [f for f in feats if f['properties']['class'] == 'green'][0]['geometry']['coordinates'][0]
    F = pcv3.Frame(gr, cl)
    out = style['output']; SS = out['supersample']; W, H = out['width'] * SS, out['height'] * SS
    cam = build_camera(cam_cfg, F, feats, W, H)
    fp = ground_footprint(cam, W, H)
    ppm = cam_cfg.get('texture_px_per_m', style['texture_px_per_m'])
    u0, u1 = fp[:, 0].min() - 8, fp[:, 0].max() + 8; v0, v1 = fp[:, 1].min() - 8, fp[:, 1].max() + 8
    cv_ = Canvas(u0, u1, v0, v1, ppm)
    print('canvas %dx%d px (%.0f x %.0f m)' % (cv_.W, cv_.H, u1 - u0, v1 - v0), flush=True)
    px_m = 1.0 / ppm

    # ---- geography in view: this hole's features + neighbouring holes' mapped features (same source, unchanged)
    D, src = pcv3.course_features()
    ctx = {'fairway': [], 'green': [], 'tee': [], 'bunker': [], 'water': [], 'path': [], 'course': [], 'hole': []}
    stripe_dir = {}
    for f in D['features']:
        L = f['properties']['layer']; g = f['geometry']
        if L not in ctx:
            continue
        if g['type'] == 'Polygon':
            P = [F.uv(c) for c in g['coordinates'][0]]
            if L != 'course' and (max(q[0] for q in P) < u0 or min(q[0] for q in P) > u1 or max(q[1] for q in P) < v0 or min(q[1] for q in P) > v1):
                continue
            ctx[L].append((P, f['properties'].get('holes') or []))
        elif g['type'] == 'LineString':
            P = [F.uv(c) for c in g['coordinates']]
            ctx[L].append((P, f['properties'].get('holes') or []))
            if L == 'hole':
                for h in f['properties'].get('holes') or []:
                    a, b = np.array(P[0]), np.array(P[-1]); v = b - a; stripe_dir[h] = v / np.linalg.norm(v)
    C = {k: hexrgb(v) for k, v in style['colors'].items()}
    S = style['stripes']; N = style['noise']; RL = style['relief']
    shape = (cv_.H, cv_.W)

    # ---- base: rough with mottling; off-course land darker (no invented objects)
    n1 = fbm(shape, N['seed'], scales=(40, 12, 4, 2), weights=(0.3, 0.3, 0.25, 0.15)); n2 = fbm(shape, N['seed'] + 1, scales=(220, 90))
    img = C['rough'][None, None, :] * (1 + N['rough_amount'] * n1[..., None] * 0.6)
    mix = 0.5 * smooth(n2 * 0.35 + 0.5)[..., None]
    img = img * (1 - mix) + C['rough_dark'] * (1 + N['rough_amount'] * n1[..., None]) * mix
    course_sd = cv_.sdf([P for P, _ in ctx['course']]) if ctx['course'] else np.full(shape, 1e3, np.float32)
    off = smooth(np.clip(-course_sd / 12.0, 0, 1))[..., None]
    img = img * (1 - off) + C['offcourse'] * (1 + 0.15 * n1[..., None]) * off

    height = np.zeros(shape, np.float32)

    # ---- fairways (each striped across its own hole's direction)
    fw_sd_all = np.full(shape, -1e3, np.float32)
    for P, hs in ctx['fairway']:
        sl, sd = cv_.sdf_win(P, style['first_cut_m'] + 4)
        if sl is None:
            continue
        fw_sd_all[sl] = np.maximum(fw_sd_all[sl], sd)
        dirv = stripe_dir.get(hs[0] if hs else None, np.array([0.0, 1.0]))
        along = cv_.U[sl] * dirv[0] + cv_.V[sl] * dirv[1]
        band = 0.5 + 0.5 * np.sin(along / S['fairway_width_m'] * math.pi)
        band = smooth((band - 0.5) * 3 + 0.5)[..., None]
        col = C['fairway'] * (1 - band * S['fairway_strength']) + C['fairway_stripe_dark'] * band * S['fairway_strength']
        col = col * (1 + N['fairway_amount'] * n1[sl][..., None])
        edge = smooth(np.clip(sd / 1.4, 0, 1))[..., None]
        col = col * (0.9 + 0.1 * edge)
        a = cover(sd, px_m); img[sl] = img[sl] * (1 - a) + col * a
        height[sl] += RL['fairway_m'] * smooth(np.clip(sd / RL['fairway_edge_m'], 0, 1)) * (sd > -px_m)
    # first cut around fairways
    fc_band = ((fw_sd_all < 0) & (fw_sd_all > -style['first_cut_m'])).astype(np.float32)
    fc_band = cv2.GaussianBlur(fc_band, (0, 0), ppm * 0.35)[..., None] * 0.55
    img = img * (1 - fc_band) + C['first_cut'] * fc_band

    # ---- cart paths
    if ctx['path']:
        ld = cv_.line_dist([P for P, _ in ctx['path']])
        sd = style['path_width_m'] / 2 - ld
        a = cover(sd, px_m); col = C['path'] * (1 + 0.04 * n1[..., None])
        e = smooth(np.clip(sd / 0.5, 0, 1))[..., None]; col = col * e + C['path_edge'] * (1 - e)
        img = img * (1 - a) + col * a

    # ---- water
    for P, _ in ctx['water']:
        sl, sd = cv_.sdf_win(P, 4)
        if sl is None:
            continue
        bank = ((sd < 0) & (sd > -style['water_bank_m'])).astype(np.float32)[..., None] * 0.6
        img[sl] = img[sl] * (1 - bank) + C['water_bank'] * bank
        depth = smooth(np.clip(sd / 9.0, 0, 1))[..., None]
        col = C['water_shallow'] * (1 - depth) + C['water_deep'] * depth
        ripple = fbm(sd.shape, N['seed'] + 7, scales=(18, 6, 3), weights=(0.5, 0.3, 0.2))
        col = col * (1 + 0.035 * ripple[..., None])
        a = cover(sd, px_m); img[sl] = img[sl] * (1 - a) + col * a
        height[sl] -= RL['water_depth_m'] * smooth(np.clip(sd / RL['water_edge_m'], 0, 1)) * (sd > -px_m)

    # ---- tees
    for P, hs in ctx['tee']:
        sl, sd = cv_.sdf_win(P, 3)
        if sl is None:
            continue
        dirv = stripe_dir.get(hs[0] if hs else None, np.array([0.0, 1.0]))
        along = cv_.U[sl] * dirv[0] + cv_.V[sl] * dirv[1]
        band = (0.5 + 0.5 * np.sin(along / S['tee_width_m'] * math.pi))[..., None]
        col = C['tee'] * (1 - 0.08 * band)
        a = cover(sd, px_m); img[sl] = img[sl] * (1 - a) + col * a
        height[sl] += RL['tee_m'] * smooth(np.clip((sd + 0.3) / RL['tee_edge_m'], 0, 1))

    # ---- greens (collar first)
    for P, hs in ctx['green']:
        sl, sd = cv_.sdf_win(P, 5)
        if sl is None:
            continue
        collar = ((sd < 0) & (sd > -style['collar_m'])).astype(np.float32)
        collar = cv2.GaussianBlur(collar, (0, 0), ppm * 0.2)[..., None]
        img[sl] = img[sl] * (1 - collar) + C['collar'] * collar
        dirv = stripe_dir.get(hs[0] if hs else None, np.array([0.0, 1.0]))
        diag = (cv_.U[sl] * (dirv[0] + dirv[1]) + cv_.V[sl] * (dirv[1] - dirv[0])) / math.sqrt(2)
        band = (0.5 + 0.5 * np.sin(diag / S['green_width_m'] * math.pi))[..., None]
        col = C['green'] * (1 - band * 0.06 * S['green_strength'] * 2) + C['green_stripe'] * band * 0.12 * S['green_strength']
        a = cover(sd, px_m); img[sl] = img[sl] * (1 - a) + col * a
        height[sl] += RL['green_m'] * smooth(np.clip((sd + 0.5) / RL['green_edge_m'], 0, 1))

    # ---- bunkers: grass lip + sand + depression
    grain_all = fbm(shape, N['seed'] + 3, scales=(6, 2), weights=(0.6, 0.4))
    for P, _ in ctx['bunker']:
        sl, sd = cv_.sdf_win(P, 3)
        if sl is None:
            continue
        lip = ((sd < 0) & (sd > -RL['bunker_lip_w_m'])).astype(np.float32)
        lip = cv2.GaussianBlur(lip, (0, 0), ppm * 0.25)[..., None] * 0.55
        img[sl] = img[sl] * (1 - lip) + C['bunker_lip'] * lip
        col = C['sand'] * (1 + N['sand_amount'] * grain_all[sl][..., None])
        a = cover(sd, px_m); img[sl] = img[sl] * (1 - a) + col * a
        height[sl] += RL['bunker_lip_m'] * np.exp(-((sd + RL['bunker_lip_w_m'] * 0.5) / (RL['bunker_lip_w_m'] * 0.5)) ** 2)
        height[sl] -= RL['bunker_depth_m'] * smooth(np.clip(sd / RL['bunker_edge_m'], 0, 1)) * (sd > -px_m)

    # ---- mute neighbouring holes slightly so this hole reads first (appearance only; nothing removed)
    own = np.zeros(shape, np.float32)
    for L in ('fairway', 'green', 'tee', 'bunker'):
        for P, hs in ctx[L]:
            if hole in hs:
                sl, sd = cv_.sdf_win(P, 6)
                if sl is not None:
                    own[sl] = np.maximum(own[sl], smooth(np.clip((sd + 6) / 6, 0, 1)))
    k = style.get('context_dim', 0) * (1 - own)[..., None]
    grey = img.mean(axis=2, keepdims=True)
    img = img * (1 - k) + (grey * 0.55 + img * 0.45) * 0.86 * k

    # ---- lighting from cosmetic relief (light fixed relative to the camera so every hole is lit the same way)
    LT = style['light']
    hs_ = cv2.GaussianBlur(height, (0, 0), ppm * 0.35) * LT['relief_exaggeration']
    gy, gx = np.gradient(hs_, 1 / ppm)          # rows run toward -v, cols toward +u
    nx, ny, nz = -gx, gy, np.ones_like(gx)
    nrm = np.sqrt(nx * nx + ny * ny + nz * nz)
    fwd = cam['f'][:2] / np.linalg.norm(cam['f'][:2]); right = np.array([fwd[1], -fwd[0]])
    az = math.radians(LT['azimuth_from_camera_left_deg'])
    ldir2 = -right * math.cos(az) + fwd * math.sin(az)          # from upper-left of the view
    el = math.radians(LT['elevation_deg'])
    lv = np.array([ldir2[0] * math.cos(el), ldir2[1] * math.cos(el), math.sin(el)])
    lam = np.clip((nx * lv[0] + ny * lv[1] + nz * lv[2]) / nrm, 0, 1)
    flat = lv[2]
    shade = LT['ambient'] + LT['diffuse'] * lam
    shade = shade / (LT['ambient'] + LT['diffuse'] * flat)
    img = img * shade[..., None]
    # bunker inner shadow on the side facing away from the light (depth cue)
    img = np.clip(img, 0, 1)

    # ---- perspective: ground canvas -> camera image (mip-mapped to avoid shimmer in the distance)
    A = np.array([[1 / ppm, 0, u0 + 0.5 / ppm], [0, -1 / ppm, v1 - 0.5 / ppm], [0, 0, 1]])   # canvas px -> (u,v)
    M = cam['H'] @ A
    levels = [img.astype(np.float32)]
    for _ in range(4):
        levels.append(cv2.pyrDown(levels[-1]))
    # per-output-pixel footprint in canvas px (from the inverse mapping's Jacobian)
    Hi = np.linalg.inv(M)
    ys, xs = np.mgrid[0:H:8, 0:W:8].astype(np.float64)
    def inv(x, y):
        q = Hi @ np.stack([x.ravel(), y.ravel(), np.ones(x.size)]); return (q[:2] / q[2]).reshape(2, *x.shape)
    p0 = inv(xs, ys); p1 = inv(xs + 1, ys); p2 = inv(xs, ys + 1)
    foot = np.maximum(np.hypot(*(p1 - p0)), np.hypot(*(p2 - p0)))
    lvl = np.clip(np.log2(np.maximum(foot, 1e-6)), 0, len(levels) - 1).astype(np.float32)
    lvl = cv2.resize(lvl, (W, H), interpolation=cv2.INTER_LINEAR)
    outimg = np.zeros((H, W, 3), np.float32); wsum = np.zeros((H, W, 1), np.float32)
    for k, tex in enumerate(levels):
        s = 2 ** k
        Mk = M @ np.diag([s, s, 1.0])
        warped = cv2.warpPerspective(tex, Mk, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        wk = np.clip(1 - np.abs(lvl - k), 0, 1)[..., None]
        outimg += warped * wk; wsum += wk
    outimg /= np.maximum(wsum, 1e-6)
    # atmospheric haze by distance + soft vignette (appearance only)
    q = Hi @ np.stack([xs.ravel(), ys.ravel(), np.ones(xs.size)]); gxy = (q[:2] / q[2]).reshape(2, *xs.shape)
    dist = np.sqrt((gxy[0] - cam['C'][0]) ** 2 + (gxy[1] - cam['C'][1]) ** 2 + cam['C'][2] ** 2).astype(np.float32)
    dist = cv2.resize(dist, (W, H), interpolation=cv2.INTER_LINEAR)
    hz = style['haze']; hzk = (hz['amount'] * smooth(np.clip((dist - 200) / hz['distance_m'], 0, 1)))[..., None]
    outimg = outimg * (1 - hzk) + C['haze'] * hzk
    yy, xx = np.mgrid[0:H, 0:W]
    vg = 1 - style['vignette'] * (((xx - W / 2) / (W / 2)) ** 2 * 0.6 + ((yy - H / 2) / (H / 2)) ** 2 * 0.4)
    outimg = np.clip(outimg * vg[..., None], 0, 1)
    final = cv2.resize(outimg, (out['width'], out['height']), interpolation=cv2.INTER_AREA)

    # ---- write outputs
    rd = os.path.join(d, 'render'); os.makedirs(rd, exist_ok=True)
    base = os.path.join(rd, 'hole%02d_%s' % (hole, view_name))
    bgr = cv2.cvtColor((final * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR)
    cv2.imwrite(base + '.jpg', bgr, [cv2.IMWRITE_JPEG_QUALITY, out['jpeg_quality'], cv2.IMWRITE_JPEG_PROGRESSIVE, 1])
    Hout = np.diag([1 / SS, 1 / SS, 1.0]) @ cam['H']; Hout /= Hout[2, 2]
    def sh(path):
        return hashlib.sha256(open(path, 'rb').read()).hexdigest()
    proj = {
        'schema': 'pocasset-v3/flyover-projection@1', 'hole': hole, 'view': view_name,
        'image': os.path.basename(base + '.jpg'), 'width': out['width'], 'height': out['height'],
        'frame': json.load(open(os.path.join(d, 'hole.json')))['frame'],
        'ground_to_image_homography': [[round(x, 12) for x in row] for row in Hout.tolist()],
        'how_to_use': 'pixel = H · [u, v, 1] (then divide by the 3rd value). u,v = hole-frame metres (u right, v toward green, origin green centre). Valid for ground level (flat; no terrain yet).',
        'camera': {'position_uvz_m': [round(x, 3) for x in cam['C'].tolist()], 'forward': [round(x, 6) for x in cam['f'].tolist()],
                   'vfov_deg': round(cam['vfov_deg'], 4), 'pitch_deg': round(cam['pitch_deg'], 4), 'focal_px': round(cam['fpx'] / SS, 4)},
        'inputs_sha256': {'features.geojson': sh(os.path.join(d, 'features.geojson')), 'camera.json': sh(os.path.join(d, 'camera.json')),
                          'flyover_style.json': sh(pcv3.p('style', 'flyover_style.json')), 'course_source': src['sha256']},
        'trees': 'none drawn (no tree-position source yet)', 'terrain': 'flat ground + cosmetic edge bevels (no elevation source yet)',
    }
    json.dump(proj, open(base + '.json', 'w'), indent=1)
    # ---- alignment QA image: every mapped outline of this hole projected through the stored homography
    qa = bgr.copy()
    for f in feats:
        g = f['geometry']
        pts = g['coordinates'][0] if g['type'] == 'Polygon' else g['coordinates'] if g['type'] == 'LineString' else None
        if not pts:
            continue
        P = np.array([F.uv(c) for c in pts]); hp = (Hout @ np.c_[P, np.ones(len(P))].T)
        if (hp[2] <= 0).any():          # part of the outline is behind the camera: not drawable in this view
            continue
        hp = (hp[:2] / hp[2]).T
        cv2.polylines(qa, [np.round(hp * 4).astype(np.int32)], g['type'] == 'Polygon', (0, 0, 255), 2, cv2.LINE_AA, shift=2)
    cv2.imwrite(base + '_alignment.png', qa)
    print('rendered', base + '.jpg', '%dx%d' % (out['width'], out['height']), 'canvas %dx%d' % (cv_.W, cv_.H))
    return base


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--hole', type=int, required=True); ap.add_argument('--view', default='tee')
    a = ap.parse_args(); render(a.hole, a.view)
