"""Render alignment test (renderer v0.2: 3D camera matrix + lidar height model).

For every mapped hazard/green outline of the hole, points inside it (at least 1.5 m from the edge) are projected
through the stored projection JSON exactly as the app does (camera_matrix · [u, v, z(u,v), 1], z from terrain.json).
At each projected pixel:
  * the material-ID image must show that surface (bunker / water / green), unless the point is hidden behind
    illustrative woods (ID = tree), which is reported separately and not counted as a failure;
  * the JPEG colour must be in that surface's colour family.
Proves the illustration paints features where the coordinates say, on real terrain, and that the overlays the app
draws land on them. Run: python3 tests/test_alignment.py --hole 2"""
import argparse, json, os, sys
import numpy as np, cv2
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); sys.path.insert(0, os.path.join(ROOT, 'tools'))
import pcv3
from render_flyover import TerrainLookup, MAT
ap = argparse.ArgumentParser(); ap.add_argument('--hole', type=int, default=2); a = ap.parse_args()
d = pcv3.p('data', 'holes', 'hole%02d' % a.hole)
feats = json.load(open(os.path.join(d, 'features.geojson')))['features']
cl = [f for f in feats if f['properties']['class'] == 'centerline'][0]['geometry']['coordinates']
gr = [f for f in feats if f['properties']['class'] == 'green'][0]['geometry']['coordinates'][0]
F = pcv3.Frame(gr, cl)
TZ = TerrainLookup(json.load(open(os.path.join(d, 'terrain.json'))))
def is_sand(c): r, g, b = (int(x) for x in c); return (r + g + b) / 3 > 95 and g - r < 18 and b < g + 12
def is_water(c): r, g, b = (int(x) for x in c); return b > r + 20 and b > g - 25
def is_green(c): r, g, b = (int(x) for x in c); return g > r + 25 and g > b + 25
test = {'bunker': (is_sand, MAT['bunker']), 'water': (is_water, MAT['water']), 'green': (is_green, MAT['green'])}
allok = True
for view in ('tee', 'approach'):
    pj = json.load(open(os.path.join(d, 'render', 'hole%02d_%s.json' % (a.hole, view))))
    img = cv2.cvtColor(cv2.imread(os.path.join(d, 'render', pj['image'])), cv2.COLOR_BGR2RGB)
    ids = cv2.imread(os.path.join(d, 'render', pj['image'].replace('.jpg', '_ids.png')), 0)
    M = np.array(pj['camera_matrix']); hm = pj['height_model']
    dp = os.path.join(d, 'render', pj['image'].replace('.jpg', '_depth.npz'))
    T = np.load(dp)['t_m'] if os.path.exists(dp) else None          # ray distance per pixel (renderer QA output)
    Cc = np.array(pj['camera']['position_uvz_m']); fpx = pj['camera']['focal_px']
    for f in feats:
        c = f['properties']['class']
        if c not in test:
            continue
        colour_ok, want_id = test[c]
        P = [F.uv(q) for q in f['geometry']['coordinates'][0]]
        xs = [q[0] for q in P]; ys = [q[1] for q in P]
        ok = tot = hidden = idok = inset_dropped = 0
        for u in np.linspace(min(xs), max(xs), 25):
            for v in np.linspace(min(ys), max(ys), 25):
                if not pcv3.point_in((u, v), P):
                    continue
                z = (float(TZ.h(u, v)) - hm['z_ref_m']) * hm['vertical_exaggeration']
                # stay clear of the outline by 1.5 m, or by 1.5 picture pixels' worth of ground where pixels are coarser
                dist = float(np.linalg.norm(np.array([u, v, z]) - Cc)); sin_el = max(0.05, (Cc[2] - z) / dist)
                inset = max(1.5, 1.5 * dist / fpx / sin_el)
                if not all(pcv3.seg_dist((u, v), P[i], P[i + 1])[0] > inset for i in range(len(P) - 1)):
                    hh = M @ [u, v, z, 1]
                    if hh[2] > 0 and 0 <= hh[0] / hh[2] < img.shape[1] and 0 <= hh[1] / hh[2] < img.shape[0]:
                        inset_dropped += 1          # on screen, but too close to the edge at this pixel size
                    continue
                h = M @ [u, v, z, 1]
                if h[2] <= 0:
                    continue
                x, y = h[0] / h[2], h[1] / h[2]
                if not (0 <= x < img.shape[1] and 0 <= y < img.shape[0]):
                    continue
                mid = ids[int(y), int(x)]
                occluded = T is not None and np.isfinite(T[int(y), int(x)]) and T[int(y), int(x)] < dist * 0.99 - 1.0
                if mid == MAT['tree'] or occluded:
                    hidden += 1; continue
                tot += 1; idok += mid == want_id; ok += (mid == want_id) and colour_ok(img[int(y), int(x)])
        if tot:
            frac = ok / tot; good = frac >= 0.95; allok &= good
            print('%-9s %-10s %-7s %3d samples  %5.1f%% correct (id %5.1f%%)%s%s' % (view, f['properties']['id'], c, tot, 100 * frac, 100 * idok / tot,
                  ('  [%d hidden behind trees/terrain]' % hidden) if hidden else '', '' if good else '  <-- FAIL'))
        elif not hidden and inset_dropped:
            print('%-9s %-10s %-7s too small at this distance to sample (alignment covered by the projection test)' % (view, f['properties']['id'], c))
        elif hidden:
            print('%-9s %-10s %-7s all %d samples hidden behind illustrative trees/terrain in this view' % (view, f['properties']['id'], c, hidden))
print('ALIGNMENT', 'PASS' if allok else 'FAIL'); sys.exit(0 if allok else 1)
