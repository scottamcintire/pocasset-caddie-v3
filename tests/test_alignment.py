"""Render alignment test: inside every mapped hazard/green outline (shrunk 1.5 m), the rendered pixels must be
that surface's colour family. Proves the illustration paints features where the coordinates say.
Run: python3 tests/test_alignment.py --hole 2"""
import argparse, json, os, sys
import numpy as np, cv2
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); sys.path.insert(0, os.path.join(ROOT, 'tools'))
import pcv3
ap = argparse.ArgumentParser(); ap.add_argument('--hole', type=int, default=2); a = ap.parse_args()
d = pcv3.p('data', 'holes', 'hole%02d' % a.hole)
feats = json.load(open(os.path.join(d, 'features.geojson')))['features']
cl = [f for f in feats if f['properties']['class'] == 'centerline'][0]['geometry']['coordinates']
gr = [f for f in feats if f['properties']['class'] == 'green'][0]['geometry']['coordinates'][0]
F = pcv3.Frame(gr, cl)
def is_sand(c): r, g, b = (int(x) for x in c); return (r + g + b) / 3 > 100 and g - r < 15 and b < g + 10   # tan/grey sand incl. shaded lip
def is_water(c): r, g, b = (int(x) for x in c); return b > r + 25 and b > g - 10
def is_green(c): r, g, b = (int(x) for x in c); return g > r + 30 and g > b + 30
test = {'bunker': is_sand, 'water': is_water, 'green': is_green}
allok = True
for view in ('tee', 'approach'):
    pj = json.load(open(os.path.join(d, 'render', 'hole%02d_%s.json' % (a.hole, view))))
    img = cv2.cvtColor(cv2.imread(os.path.join(d, 'render', pj['image'])), cv2.COLOR_BGR2RGB)
    Hm = np.array(pj['ground_to_image_homography'])
    for f in feats:
        c = f['properties']['class']
        if c not in test:
            continue
        P = [F.uv(q) for q in f['geometry']['coordinates'][0]]
        xs = [q[0] for q in P]; ys = [q[1] for q in P]
        ok = tot = 0
        for u in np.linspace(min(xs), max(xs), 25):
            for v in np.linspace(min(ys), max(ys), 25):
                # inside and at least 1.5 m from the edge
                inside = pcv3.point_in((u, v), P) and all(pcv3.seg_dist((u, v), P[i], P[i + 1])[0] > 1.5 for i in range(len(P) - 1))
                if not inside:
                    continue
                h = Hm @ [u, v, 1]
                if h[2] <= 0:
                    continue
                x, y = h[0] / h[2], h[1] / h[2]
                if not (0 <= x < img.shape[1] and 0 <= y < img.shape[0]):
                    continue
                tot += 1; ok += test[c](img[int(y), int(x)])
        if tot:
            frac = ok / tot; good = frac >= 0.95; allok &= good
            print('%-9s %-10s %-7s %3d samples  %5.1f%% correct %s' % (view, f['properties']['id'], c, tot, 100 * frac, '' if good else '  <-- FAIL'))
print('ALIGNMENT', 'PASS' if allok else 'FAIL'); sys.exit(0 if allok else 1)
