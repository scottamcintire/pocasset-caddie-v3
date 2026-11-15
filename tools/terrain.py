#!/usr/bin/env python3
"""Pocasset V3 terrain tool: locked lidar elevation grid -> heights in a hole's frame.

  python3 tools/terrain.py check --hole 2      registration QA: lidar hillshade with the mapped outlines drawn on it,
                                               plus per-feature height statistics -> data/holes/holeNN/checks/terrain_*
  python3 tools/terrain.py grid --hole 2       height grid in the hole frame (2 m) -> data/holes/holeNN/terrain.json

Source: data/sources/elevation/<file> listed in SOURCES.lock.json with role "elevation" (checksum-checked on every run).
Elevation file format ("dm16.gz", see docs/DATA_SOURCES.md §2b): gzip of little-endian int16, row-major, north row first;
first value of each row = elevation in decimetres, then decimetre differences along the row (west -> east).
Grid georeferencing comes from the lock entry (EPSG:6348 = NAD83(2011) / UTM zone 19N, upper-left corner, cell size).

Lon/lat <-> UTM uses the Krüger series (sub-millimetre within a zone). Course outlines are WGS84 (OSM) and the lidar
is NAD83(2011); in Massachusetts in 2021 they differ by about 1-1.5 m. That is below the 2 m grid and is NOT corrected
(documented limitation). Heights are used for shape/shading and the camera model only, never for distances.
Requires numpy (+ opencv for the QA image).
"""
import argparse, gzip, json, math, os, sys
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import pcv3  # noqa: E402

# ---------------------------------------------------------------- GRS80 transverse Mercator (Krüger, n-series to 6th order)
A_ = 6378137.0; F_ = 1 / 298.257222101
N_ = F_ / (2 - F_)
AA = A_ / (1 + N_) * (1 + N_ ** 2 / 4 + N_ ** 4 / 64 + N_ ** 6 / 256)
ALPHA = [N_ / 2 - 2 * N_ ** 2 / 3 + 5 * N_ ** 3 / 16 + 41 * N_ ** 4 / 180 - 127 * N_ ** 5 / 288 + 7891 * N_ ** 6 / 37800,
         13 * N_ ** 2 / 48 - 3 * N_ ** 3 / 5 + 557 * N_ ** 4 / 1440 + 281 * N_ ** 5 / 630 - 1983433 * N_ ** 6 / 1935360,
         61 * N_ ** 3 / 240 - 103 * N_ ** 4 / 140 + 15061 * N_ ** 5 / 26880 + 167603 * N_ ** 6 / 181440,
         49561 * N_ ** 4 / 161280 - 179 * N_ ** 5 / 168 + 6601661 * N_ ** 6 / 7257600,
         34729 * N_ ** 5 / 80640 - 3418889 * N_ ** 6 / 1995840,
         212378941 * N_ ** 6 / 319334400]
E2 = F_ * (2 - F_); E_ = math.sqrt(E2)
K0 = 0.9996; FE = 500000.0


def ll_to_utm(lon, lat, zone=19):
    """Forward transverse Mercator (lon/lat degrees -> easting/northing metres). Works on scalars or numpy arrays."""
    lon = np.asarray(lon, float); lat = np.asarray(lat, float)
    lam = np.radians(lon - (zone * 6 - 183)); phi = np.radians(lat)
    t = np.sinh(np.arctanh(np.sin(phi)) - E_ * np.arctanh(E_ * np.sin(phi)))
    xi_ = np.arctan2(t, np.cos(lam)); eta_ = np.arctanh(np.sin(lam) / np.sqrt(1 + t * t))
    xi = xi_.copy(); eta = eta_.copy()
    for j, a in enumerate(ALPHA, 1):
        xi = xi + a * np.sin(2 * j * xi_) * np.cosh(2 * j * eta_)
        eta = eta + a * np.cos(2 * j * xi_) * np.sinh(2 * j * eta_)
    return FE + K0 * AA * eta, K0 * AA * xi


def utm_to_ll(E, N, zone=19, iters=6):
    """Inverse by Newton iteration on the forward series (keeps one formula set to test)."""
    E = np.asarray(E, float); N = np.asarray(N, float)
    lon = (zone * 6 - 183) + (E - FE) / 111320.0 / math.cos(math.radians(41.7)); lat = N / 110946.0
    for _ in range(iters):
        e0, n0 = ll_to_utm(lon, lat, zone)
        d = 1e-6
        e1, n1 = ll_to_utm(lon + d, lat, zone); e2, n2 = ll_to_utm(lon, lat + d, zone)
        a, b, c, dd = (e1 - e0) / d, (e2 - e0) / d, (n1 - n0) / d, (n2 - n0) / d
        det = a * dd - b * c; re, rn = E - e0, N - n0
        lon = lon + (dd * re - b * rn) / det; lat = lat + (-c * re + a * rn) / det
    return lon, lat


# ---------------------------------------------------------------- the locked elevation grid
def elevation_source():
    lock = pcv3.check_sources()
    s = [x for x in lock['sources'] if x['role'] == 'elevation']
    if not s:
        sys.exit('STOP: no elevation source is locked in data/sources/SOURCES.lock.json')
    return s[0]


def load_dem():
    """Returns (Z float32 [rows, cols] metres NAVD88, grid dict)."""
    s = elevation_source(); g = s['grid']
    raw = gzip.decompress(open(pcv3.p('data', 'sources', s['file']), 'rb').read())
    a = np.frombuffer(raw, dtype='<i2').astype(np.int32).reshape(g['rows'], g['cols'])
    return (np.cumsum(a, axis=1) / 10.0).astype(np.float32), g


def sample_utm(Z, g, E, N):
    """Bilinear sample at UTM points (cell centres are the sample locations). NaN outside the grid."""
    c = (np.asarray(E) - g['ul_easting']) / g['cell_m'] - 0.5
    r = (g['ul_northing'] - np.asarray(N)) / g['cell_m'] - 0.5
    ok = (c >= 0) & (r >= 0) & (c <= g['cols'] - 1) & (r <= g['rows'] - 1)
    c = np.clip(c, 0, g['cols'] - 1.000001); r = np.clip(r, 0, g['rows'] - 1.000001)
    c0 = np.floor(c).astype(int); r0 = np.floor(r).astype(int); fc = c - c0; fr = r - r0
    z = (Z[r0, c0] * (1 - fc) * (1 - fr) + Z[r0, c0 + 1] * fc * (1 - fr) +
         Z[r0 + 1, c0] * (1 - fc) * fr + Z[r0 + 1, c0 + 1] * fc * fr)
    return np.where(ok, z, np.nan)


def frame_for(hole):
    fc = json.load(open(pcv3.p('data', 'holes', 'hole%02d' % hole, 'features.geojson')))
    feats = fc['features']
    cl = [f for f in feats if f['properties']['class'] == 'centerline'][0]['geometry']['coordinates']
    gr = [f for f in feats if f['properties']['class'] == 'green'][0]['geometry']['coordinates'][0]
    return pcv3.Frame(gr, cl), feats


def uv_to_ll(F, u, v):
    """Inverse of pcv3.Frame.uv (same equirectangular model, exact inverse)."""
    b = math.radians(F.bearing)
    e = u * math.cos(b) + v * math.sin(b); n = -u * math.sin(b) + v * math.cos(b)
    lon = F.lon0 + np.degrees(e / (pcv3.R_EARTH * F.k)); lat = F.lat0 + np.degrees(n / pcv3.R_EARTH)
    return lon, lat


def heights_uv(hole, U, V, Z=None, g=None, F=None):
    if Z is None:
        Z, g = load_dem()
    if F is None:
        F, _ = frame_for(hole)
    lon, lat = uv_to_ll(F, np.asarray(U, float), np.asarray(V, float))
    E, N = ll_to_utm(lon, lat)
    return sample_utm(Z, g, E, N)


def load_canopy():
    """Returns (C float32 [rows, cols] canopy fraction 0..1, grid dict) or (None, None) if no canopy source is locked.
    ILLUSTRATIVE data (classified from 2023 NAIP imagery); see docs/DATA_SOURCES.md §2c."""
    lock = pcv3.check_sources()
    s = [x for x in lock['sources'] if x['role'] == 'tree_canopy']
    if not s:
        return None, None
    g = s[0]['grid']
    raw = gzip.decompress(open(pcv3.p('data', 'sources', s[0]['file']), 'rb').read())
    return (np.frombuffer(raw, np.uint8).reshape(g['rows'], g['cols']).astype(np.float32) / 4.0), g


def raster_uv(F, Z, g, u0, v1, cell, cols, rows):
    """Sample a UTM grid onto a hole-frame raster: row i = v1 - (i+0.5)*cell (north-ish first), col j = u0 + (j+0.5)*cell.
    Returns float32 [rows, cols] with NaN outside the source grid."""
    us = u0 + (np.arange(cols) + 0.5) * cell
    out = np.empty((rows, cols), np.float32)
    for i0 in range(0, rows, 256):
        vs = v1 - (np.arange(i0, min(rows, i0 + 256)) + 0.5) * cell
        U, V = np.meshgrid(us, vs)
        lon, lat = uv_to_ll(F, U, V); E, N = ll_to_utm(lon, lat)
        out[i0:i0 + len(vs)] = sample_utm(Z, g, E, N)
    return out


def utm_bounds_uv(F, g):
    """The source grid's four corners in the hole frame."""
    E = [g['ul_easting'], g['ul_easting'] + g['cols'] * g['cell_m']]
    N = [g['ul_northing'] - g['rows'] * g['cell_m'], g['ul_northing']]
    pts = []
    for e in E:
        for n in N:
            lon, lat = utm_to_ll(e, n); pts.append(F.uv((float(lon), float(lat))))
    return np.array(pts)


# ---------------------------------------------------------------- commands
def grid(hole, margin=60.0, cell=2.0):
    """Height grid in the hole frame covering this hole's features + margin. Written for the renderer and the app."""
    F, feats = frame_for(hole)
    pts = []
    for f in feats:
        gm = f['geometry']; cs = gm['coordinates'][0] if gm['type'] == 'Polygon' else gm['coordinates'] if gm['type'] == 'LineString' else [gm['coordinates']]
        pts += [F.uv(c) for c in cs]
    P = np.array(pts)
    u0, v0 = np.floor(P.min(0) - margin); u1, v1 = np.ceil(P.max(0) + margin)
    us = np.arange(u0, u1 + 1e-9, cell); vs = np.arange(v0, v1 + 1e-9, cell)
    U, V = np.meshgrid(us, vs)
    H = heights_uv(hole, U, V, F=F)
    fz = heights_uv(hole, P[:, 0], P[:, 1], F=F)
    if np.isnan(fz).any():
        sys.exit('STOP: %d mapped feature point(s) of hole %d lie outside the locked elevation grid; extract the next lidar area '
                 '(HOLE_BUILD_STANDARD.md §5a)' % (int(np.isnan(fz).sum()), hole))
    outside = int(np.isnan(H).sum())
    if outside:     # only the margin around the hole is outside: hold the nearest measured height there (recorded)
        from scipy import ndimage
        idx = ndimage.distance_transform_edt(np.isnan(H), return_distances=False, return_indices=True)
        H = H[tuple(idx)]
        print('note: %d margin cells outside the lidar grid hold the nearest measured height' % outside)
    s = elevation_source()
    out = {'schema': 'pocasset-v3/terrain@1', 'hole': hole,
           'note': 'Generated by tools/terrain.py from the locked lidar grid. Heights in metres NAVD88 (GEOID18), bilinear from the 2 m grid. '
                   'Row i = v0 + i*cell (south->north along the hole), column j = u0 + j*cell. For shape, shading and the camera model only; never for distances.',
           'source': {'file': s['file'], 'sha256': s['sha256'], 'survey': s['survey']['dates']},
           'u0': float(u0), 'v0': float(v0), 'cell_m': cell, 'cols': len(us), 'rows': len(vs),
           'z_min': round(float(H.min()), 2), 'z_max': round(float(H.max()), 2),
           'z_dm': (np.round(H * 10).astype(int)).tolist()}
    if outside:
        out['margin_cells_outside_lidar'] = outside
    path = pcv3.p('data', 'holes', 'hole%02d' % hole, 'terrain.json')
    with open(path, 'w') as f:
        json.dump(out, f, separators=(',', ':'))
    print('wrote', path, '%dx%d cells, %.1f-%.1f m' % (len(us), len(vs), H.min(), H.max()))
    return out


def check(hole):
    """Registration QA. Writes a hillshade of the lidar (UTM, north up) with every mapped outline of this hole and its
    neighbours drawn on it, and height statistics per feature. Tees and greens should sit on visible built platforms."""
    import cv2
    Z, g = load_dem(); F, feats = frame_for(hole)
    gy, gx = np.gradient(Z.astype(np.float64), g['cell_m'])
    az, alt = math.radians(315), math.radians(40)
    slope = np.arctan(np.hypot(gx, gy) * 2.0); aspect = np.arctan2(-gx, gy)
    hs = np.clip(np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect), 0, 1)
    S = 3
    img = cv2.resize((hs * 230 + 15).astype(np.uint8), (g['cols'] * S, g['rows'] * S), interpolation=cv2.INTER_CUBIC)
    img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    D, _ = pcv3.course_features()
    col = {'green': (40, 200, 40), 'tee': (0, 140, 255), 'bunker': (0, 220, 255), 'water': (255, 120, 0),
           'fairway': (60, 140, 60), 'hole': (0, 0, 255), 'path': (160, 160, 160)}
    def px(coords):
        lon = np.array([c[0] for c in coords]); lat = np.array([c[1] for c in coords])
        E, N = ll_to_utm(lon, lat)
        return np.c_[(E - g['ul_easting']) / g['cell_m'] * S, (g['ul_northing'] - N) / g['cell_m'] * S]
    for f in D['features']:
        L = f['properties']['layer']; gm = f['geometry']
        if L not in col:
            continue
        cs = gm['coordinates'][0] if gm['type'] == 'Polygon' else gm['coordinates'] if gm['type'] == 'LineString' else None
        if not cs:
            continue
        q = px(cs)
        th = 2 if hole in (f['properties'].get('holes') or []) else 1
        cv2.polylines(img, [np.round(q * 4).astype(np.int32)], gm['type'] == 'Polygon', col[L], th, cv2.LINE_AA, shift=2)
    d = pcv3.p('data', 'holes', 'hole%02d' % hole, 'checks'); os.makedirs(d, exist_ok=True)
    cv2.imwrite(os.path.join(d, 'terrain_registration.png'), img)
    rows = []
    for f in feats:
        gm = f['geometry']
        if gm['type'] != 'Polygon':
            continue
        P = gm['coordinates'][0]
        lon = np.array([c[0] for c in P]); lat = np.array([c[1] for c in P])
        E, N = ll_to_utm(lon, lat)
        # sample inside the polygon on a 1 m lattice
        e0, e1, n0, n1 = E.min(), E.max(), N.min(), N.max()
        ee, nn = np.meshgrid(np.arange(e0, e1, 1.0), np.arange(n0, n1, 1.0))
        poly = np.c_[E, N].astype(np.float32)
        inside = np.array([cv2.pointPolygonTest(poly, (float(a), float(b)), False) >= 0 for a, b in zip(ee.ravel(), nn.ravel())])
        z = sample_utm(Z, g, ee.ravel()[inside], nn.ravel()[inside])
        if z.size == 0:
            continue
        rows.append((f['properties']['id'], f['properties']['class'], float(np.nanmin(z)), float(np.nanmedian(z)), float(np.nanmax(z)), float(np.nanstd(z))))
    with open(os.path.join(d, 'terrain_check.md'), 'w') as fo:
        s = elevation_source()
        fo.write('# Hole %d terrain check (generated)\n\nSource: `%s` (sha256 %s…), %s.\n\n' % (hole, s['file'], s['sha256'][:12], s['survey']['dates']))
        fo.write('Heights in metres NAVD88 sampled inside each mapped outline (1 m lattice, bilinear from the 2 m grid).\n'
                 'Lidar is 2021 (before the bunker/tee rebuild): a rebuilt feature may not match. See terrain_registration.png.\n\n')
        fo.write('| ID | class | min | median | max | std |\n|---|---|---|---|---|---|\n')
        for r in rows:
            fo.write('| %s | %s | %.1f | %.1f | %.1f | %.2f |\n' % r)
    for r in rows:
        print('%-10s %-8s min %5.1f med %5.1f max %5.1f sd %.2f' % r)
    print('wrote', os.path.join(d, 'terrain_registration.png'))


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('cmd', choices=['check', 'grid']); ap.add_argument('--hole', type=int, required=True)
    a = ap.parse_args()
    {'check': check, 'grid': grid}[a.cmd](a.hole)
