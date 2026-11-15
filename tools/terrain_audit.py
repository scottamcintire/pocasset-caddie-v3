#!/usr/bin/env python3
"""Terrain and visual-relief audit for rendered holes (read-only; writes only to the output folder).

  python3 tools/terrain_audit.py --holes 2 4 8 [--out audits/terrain_2026-11-15]

For each hole:
  * which locked lidar grid it uses; terrain.json sanity (no flat fallback, margin cells)
  * elevation at the camera's tee, at the green centre; min / max / range in the playing corridor
    (within 40 m of the playing line, from the tee to 30 m past the green); robust range (5th-95th percentile)
  * elevation profile along the playing line (every 10 m) -> profile CSV + chart
  * ground "texture": local relief (ground minus a 30 m-smoothed ground, std) and slope (mean and 90th percentile)
  * visible relief after projection, per view: for corridor points on screen and not hidden, how far the
    exaggerated elevation moves the point on screen versus a flat ground at the green's height (pixels; 95th pct)
  * camera geometry per view: height above the green, distance, pitch (degrees below horizontal)
Elevations are metres NAVD88, unexaggerated. The renderer draws them 1.5x (style terrain.vertical_exaggeration).
"""
import argparse, csv, json, math, os, sys
import numpy as np
from scipy import ndimage

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import pcv3, terrain  # noqa: E402
from render_flyover import TerrainLookup  # noqa: E402

CORRIDOR_M = 40.0


def seg_proj(p, a, b):
    ab = b - a; L2 = float(ab @ ab)
    t = 0.0 if L2 == 0 else max(0.0, min(1.0, float((p - a) @ ab) / L2))
    return t, float(np.linalg.norm(p - (a + t * ab)))


def audit(hole, out):
    d = pcv3.p('data', 'holes', 'hole%02d' % hole)
    feats = json.load(open(os.path.join(d, 'features.geojson')))['features']
    F, _ = terrain.frame_for(hole)
    cl = [f for f in feats if f['properties']['class'] == 'centerline'][0]['geometry']['coordinates']
    line = np.array([F.uv(q) for q in cl], float)           # tee end -> green end
    seglen = np.linalg.norm(np.diff(line, axis=0), axis=1); cum = np.r_[0, np.cumsum(seglen)]; L = cum[-1]
    tj = json.load(open(os.path.join(d, 'terrain.json'))); T = TerrainLookup(tj)
    Z = np.array(tj['z_dm'], float) / 10
    cam = json.load(open(os.path.join(d, 'camera.json')))
    src = terrain.elevation_source(hole)
    r = {'hole': hole, 'grid': os.path.basename(src['file']), 'terrain_json_std_m': round(float(Z.std()), 2),
         'flat_fallback': bool(Z.std() < 0.05), 'margin_cells_outside_lidar': tj.get('margin_cells_outside_lidar', 0),
         'line_length_m': round(L, 1)}
    # primary tee = the tee the tee-view camera stands behind
    tee_id = cam['views']['tee'].get('look_from_feature')
    tee = [f for f in feats if f['properties']['id'] == tee_id][0]
    tc = np.mean([F.uv(q) for q in tee['geometry']['coordinates'][0][:-1]], axis=0)
    r['tee'] = tee_id; r['tee_elev_m'] = round(float(T.h(*tc)), 1); r['green_elev_m'] = round(float(T.h(0.0, 0.0)), 1)
    r['tee_minus_green_m'] = round(r['tee_elev_m'] - r['green_elev_m'], 1)
    # corridor mask on the terrain grid
    us = tj['u0'] + np.arange(tj['cols']) * tj['cell_m']; vs = tj['v0'] + np.arange(tj['rows']) * tj['cell_m']
    U, V = np.meshgrid(us, vs)
    P = np.c_[U.ravel(), V.ravel()]
    best_d = np.full(len(P), 1e9); best_s = np.zeros(len(P))
    for i in range(len(line) - 1):
        a, b = line[i], line[i + 1]; ab = b - a; L2 = ab @ ab
        t = np.clip(((P - a) @ ab) / L2, 0, 1); q = a + t[:, None] * ab; dd = np.linalg.norm(P - q, axis=1)
        m = dd < best_d; best_d[m] = dd[m]; best_s[m] = cum[i] + t[m] * seglen[i]
    beyond = (P @ (line[-1] - line[-2]) / np.linalg.norm(line[-1] - line[-2])) > 30      # more than 30 m past the green
    corr = ((best_d <= CORRIDOR_M) & ~beyond).reshape(Z.shape)
    zc = Z[corr]
    r.update({'corridor_min_m': round(float(zc.min()), 1), 'corridor_max_m': round(float(zc.max()), 1),
              'corridor_range_m': round(float(zc.max() - zc.min()), 1),
              'corridor_p5_p95_m': round(float(np.percentile(zc, 95) - np.percentile(zc, 5)), 1)})
    # ground texture: local relief + slope (unexaggerated)
    cell = tj['cell_m']
    local = Z - ndimage.gaussian_filter(Z, 15 / cell)
    gy, gx = np.gradient(Z, cell); slope = np.hypot(gx, gy) * 100
    r['local_relief_std_m'] = round(float(local[corr].std()), 2)
    # cross-hole relief: ground minus the average ground at the same distance along the line (removes a steady climb/fall)
    sb = best_s.reshape(Z.shape); bins = np.floor(sb / 10).astype(int); resid = np.zeros_like(Z)
    for b in np.unique(bins[corr]):
        m = corr & (bins == b); resid[m] = Z[m] - Z[m].mean()
    r['cross_relief_std_m'] = round(float(resid[corr].std()), 2)
    r['cross_relief_p5_p95_m'] = round(float(np.percentile(resid[corr], 95) - np.percentile(resid[corr], 5)), 1)
    r['along_trend_share'] = round(float(1 - resid[corr].var() / Z[corr].var()), 2)
    r['slope_mean_pct'] = round(float(slope[corr].mean()), 1); r['slope_p90_pct'] = round(float(np.percentile(slope[corr], 90)), 1)
    # profile along the line
    prof = []
    for s in np.arange(0, L + 0.01, 10.0):
        i = min(np.searchsorted(cum, s, side='right') - 1, len(line) - 2); t = (s - cum[i]) / seglen[i]
        q = line[i] + t * (line[i + 1] - line[i]); prof.append((round(s, 1), round(float(T.h(*q)), 2)))
    r['profile'] = prof
    zp = np.array([z for _, z in prof]); r['profile_climb_m'] = round(float(np.clip(np.diff(zp), 0, None).sum()), 1)
    r['profile_fall_m'] = round(float(-np.clip(np.diff(zp), None, 0).sum()), 1)
    # projection: visible relief per view
    r['views'] = {}
    for view in ('tee', 'approach'):
        pj = json.load(open(os.path.join(d, 'render', 'hole%02d_%s.json' % (hole, view))))
        M = np.array(pj['camera_matrix']); hm = pj['height_model']; ex = hm['vertical_exaggeration']; zr = hm['z_ref_m']
        C = np.array(pj['camera']['position_uvz_m'])
        dp = os.path.join(d, 'render', 'hole%02d_%s_depth.npz' % (hole, view))
        Tm = np.load(dp)['t_m'] if os.path.exists(dp) else None
        uu, vv = U[corr], V[corr]; zz = (Z[corr] - zr) * ex
        H1 = M @ np.c_[uu, vv, zz, np.ones_like(uu)].T; H0 = M @ np.c_[uu, vv, np.zeros_like(uu), np.ones_like(uu)].T
        ok = (H1[2] > 0) & (H0[2] > 0)
        x1, y1 = H1[0] / H1[2], H1[1] / H1[2]; x0, y0 = H0[0] / H0[2], H0[1] / H0[2]
        on = ok & (x1 >= 0) & (x1 < pj['width']) & (y1 >= 0) & (y1 < pj['height'])
        if Tm is not None:
            dist = np.linalg.norm(np.c_[uu, vv, zz] - C, axis=1)
            xi = np.clip(x1.astype(int), 0, pj['width'] - 1); yi = np.clip(y1.astype(int), 0, pj['height'] - 1)
            tt = Tm[yi, xi]; on &= ~(np.isfinite(tt) & (tt < dist * 0.99 - 1.0))
        shift = np.hypot(x1 - x0, y1 - y0)[on]
        cz = C[2] / ex + zr                       # camera height in real metres NAVD88
        f = np.array(pj['camera']['forward']); pitch = math.degrees(math.asin(-f[2] / np.linalg.norm(f)))
        r['views'][view] = {'camera_height_above_green_m': round(float(C[2] / ex), 1),
                            'camera_dist_to_green_m': round(float(np.hypot(C[0], C[1])), 1),
                            'pitch_down_deg': round(pitch, 1), 'vfov_deg': pj['camera']['vfov_deg'],
                            'corridor_points_visible': int(on.sum()),
                            'relief_shift_px_p95': round(float(np.percentile(shift, 95)), 1) if on.any() else None,
                            'relief_shift_px_median': round(float(np.median(shift)), 1) if on.any() else None}
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, 'hole%02d_profile.csv' % hole), 'w', newline='') as fo:
        w = csv.writer(fo); w.writerow(['distance_from_tee_end_m', 'ground_m_NAVD88']); w.writerows(prof)
    return r


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--holes', type=int, nargs='+', required=True)
    ap.add_argument('--out', default=pcv3.p('audits', 'terrain_2026-11-15')); a = ap.parse_args()
    res = [audit(h, a.out) for h in a.holes]
    json.dump(res, open(os.path.join(a.out, 'terrain_audit.json'), 'w'), indent=1)
    for r in res:
        print('Hole %d  grid %s  std %.2f flat=%s margin=%s' % (r['hole'], r['grid'], r['terrain_json_std_m'], r['flat_fallback'], r['margin_cells_outside_lidar']))
        print('  tee %s %.1f m  green %.1f m  (tee-green %+.1f)  corridor %.1f-%.1f range %.1f (p5-p95 %.1f)  climb %.1f fall %.1f' % (
            r['tee'], r['tee_elev_m'], r['green_elev_m'], r['tee_minus_green_m'], r['corridor_min_m'], r['corridor_max_m'],
            r['corridor_range_m'], r['corridor_p5_p95_m'], r['profile_climb_m'], r['profile_fall_m']))
        print('  local relief std %.2f m  slope mean %.1f%%  p90 %.1f%%  cross-hole relief std %.2f m (p5-p95 %.1f m)  share of variation along the line %.0f%%' % (
            r['local_relief_std_m'], r['slope_mean_pct'], r['slope_p90_pct'], r['cross_relief_std_m'], r['cross_relief_p5_p95_m'], 100 * r['along_trend_share']))
        for v, x in r['views'].items():
            print('  %-8s cam %5.1f m up, %5.1f m back, pitch %4.1f°  visible %5d  relief shift p95 %s px  median %s px' % (
                v, x['camera_height_above_green_m'], x['camera_dist_to_green_m'], x['pitch_down_deg'], x['corridor_points_visible'],
                x['relief_shift_px_p95'], x['relief_shift_px_median']))
