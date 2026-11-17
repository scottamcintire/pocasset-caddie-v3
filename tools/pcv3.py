#!/usr/bin/env python3
"""Pocasset AI Caddie V3 — hole build tool (standard library only; Python 3.9+).

Commands (run from the project root):
  python3 -I tools/pcv3.py standardize --hole 2     source data -> data/holes/hole02/{features.geojson,hole.json,ids.json}
  python3 -I tools/pcv3.py check --hole 2           automated QA -> data/holes/hole02/checks/ (report, KML, top-down SVG)
  python3 -I tools/pcv3.py inventory                18-hole progress table -> docs/HOLE_PROGRESS.md (reads only; writes no hole data)
  python3 -I tools/pcv3.py verify-greens --master "<path to Pocasset_AI_Master>"
                                                    checks approved green files against data/greens/approved_manifest.json
  python3 -I tools/pcv3.py files                    file list with checksums -> docs/FILE_INVENTORY.md
  python3 -I tools/pcv3.py promote --hole 2 --label "flyover v1"
                                                    freezes the hole's current outputs into approved/vN (never overwrites)

Rules enforced here (see docs/HOLE_BUILD_STANDARD.md):
  * Source files are read-only and checksum-locked (data/sources/SOURCES.lock.json).
  * Geometry is copied, never edited or invented. Missing classes are reported, not filled.
  * Stable feature IDs: once assigned (ids.json) an ID is never renumbered or reused.
  * Manual records (verification.json, status.json, camera.json) are never overwritten by tools.
  * approved/ folders are append-only.
"""
import argparse, datetime, hashlib, json, math, os, shutil, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SCHEMA = 'pocasset-v3/hole@1'
R_EARTH = 6371008.8          # same constant as the V2 GPS code and the green pin frame
YD = 0.9144
CLASS_CODES = {'tee': 'TE', 'fairway': 'FW', 'green': 'GR', 'bunker': 'BK', 'water': 'WA', 'path': 'CP',
               'trees': 'TR', 'hole': 'CL', 'pin': 'PN'}
REQUIRED = ['hole', 'green', 'tee']          # fairway also required unless par 3
NOT_YET_SOURCED = ['trees', 'terrain']       # classes that need a separate source (lidar / canopy)


def layer_sources(hole=None):
    """Which of NOT_YET_SOURCED have a locked source that covers this hole's mapped features (all of them, by lon/lat).
    {'terrain': 'lidar …', 'trees': 'illustrative …'}"""
    lock = load(p('data', 'sources', 'SOURCES.lock.json'), {'sources': []})
    pts = []
    if hole is not None:
        D = load(p('data', 'sources', [s for s in lock['sources'] if s['role'] == 'course_features'][0]['file']))
        for f in D['features']:
            if hole in (f['properties'].get('holes') or []):
                g = f['geometry']; cs = g['coordinates'][0] if g['type'] == 'Polygon' else g['coordinates'] if g['type'] == 'LineString' else [g['coordinates']]
                pts += cs
    def covers(s):
        b = s.get('coverage_lonlat_inner_box')
        return bool(b and pts) and all(b['west'] <= c[0] <= b['east'] and b['south'] <= c[1] <= b['north'] for c in pts)
    roles = {s['role']: s for s in lock['sources'] if covers(s)}
    out = {}
    if 'elevation' in roles:
        out['terrain'] = 'lidar (%s)' % roles['elevation'].get('survey', {}).get('dates', '')
    if 'tree_canopy' in roles:
        out['trees'] = 'illustrative woods from imagery canopy (not surveyed trees)'
    return out


def p(*a):
    return os.path.join(ROOT, *a)


def load(path, default=None):
    if not os.path.exists(path):
        return default
    with open(path) as f:
        return json.load(f)


def save(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        json.dump(obj, f, indent=1, ensure_ascii=False)
        f.write('\n')


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def today():
    return datetime.date.today().isoformat()


# ---------------------------------------------------------------- sources
def check_sources():
    lock = load(p('data', 'sources', 'SOURCES.lock.json'))
    bad = []
    for s in lock['sources']:
        fp = p('data', 'sources', s['file'])
        if not os.path.exists(fp) or sha256(fp) != s['sha256']:
            bad.append(s['file'])
    if bad:
        sys.exit('STOP: source file(s) missing or changed since they were locked: %s' % ', '.join(bad))
    return lock


def course_features():
    """The locked OSM course source, plus any locked 'derived_features' sources (features missing from OSM, traced from
    other locked data with stated evidence). The OSM file itself is never edited; derived features carry their own
    source file and licence."""
    lock = check_sources()
    src = [s for s in lock['sources'] if s['role'] == 'course_features'][0]
    D = load(p('data', 'sources', src['file']))
    for ds in [s for s in lock['sources'] if s['role'] == 'derived_features']:
        for f in load(p('data', 'sources', ds['file']))['features']:
            f = json.loads(json.dumps(f))
            f['properties']['derived_source'] = {'file': ds['file'], 'licence': ds['licence'], 'status': ds['status']}
            D['features'].append(f)
    return D, src


# ---------------------------------------------------------------- geometry (local metres)
class Frame:
    """Hole frame = the green pin frame used by the approved greens and V2.3:
    origin = mean of the green ring INCLUDING its closing vertex; v = along the last segment of the
    playing line (toward the green); u = golfer's right. Equirectangular, R = 6371008.8 m."""

    def __init__(self, green_ring, centerline):
        self.lon0 = sum(c[0] for c in green_ring) / len(green_ring)
        self.lat0 = sum(c[1] for c in green_ring) / len(green_ring)
        self.k = math.cos(math.radians(self.lat0))
        a, b = self.en(centerline[-2]), self.en(centerline[-1])
        self.bearing = math.degrees(math.atan2(b[0] - a[0], b[1] - a[1])) % 360   # clockwise from north

    def en(self, c):
        return ((c[0] - self.lon0) * math.pi / 180 * R_EARTH * self.k, (c[1] - self.lat0) * math.pi / 180 * R_EARTH)

    def uv(self, c):
        e, n = self.en(c)
        b = math.radians(self.bearing)
        return (e * math.cos(b) - n * math.sin(b), e * math.sin(b) + n * math.cos(b))


def ring_area(P):
    return abs(sum(P[i][0] * P[i + 1][1] - P[i + 1][0] * P[i][1] for i in range(len(P) - 1))) / 2


def centroid(P):
    a = cx = cy = 0.0
    for i in range(len(P) - 1):
        cr = P[i][0] * P[i + 1][1] - P[i + 1][0] * P[i][1]
        a += cr; cx += (P[i][0] + P[i + 1][0]) * cr; cy += (P[i][1] + P[i + 1][1]) * cr
    if abs(a) < 1e-9:
        return (sum(q[0] for q in P) / len(P), sum(q[1] for q in P) / len(P))
    return (cx / (3 * a), cy / (3 * a))


def seg_dist(q, a, b):
    ax, ay = b[0] - a[0], b[1] - a[1]
    L = ax * ax + ay * ay
    t = 0 if L == 0 else max(0, min(1, ((q[0] - a[0]) * ax + (q[1] - a[1]) * ay) / L))
    return math.hypot(q[0] - a[0] - t * ax, q[1] - a[1] - t * ay), t


def along_line(q, L):
    """(distance along polyline from its start to q's projection, perpendicular distance, signed side +right)"""
    best = None; acc = 0
    for i in range(len(L) - 1):
        d, t = seg_dist(q, L[i], L[i + 1])
        seg = math.dist(L[i], L[i + 1])
        if best is None or d < best[1]:
            ax, ay = L[i + 1][0] - L[i][0], L[i + 1][1] - L[i][1]
            side = ax * (q[1] - L[i][1]) - ay * (q[0] - L[i][0])     # >0 left of direction
            best = (acc + t * seg, d, 'L' if side > 0 else 'R')
        acc += seg
    return best


def line_crossings(P, L):
    """Distances along polyline L (from its start) where it crosses polygon ring P."""
    out = []; acc = 0
    for i in range(len(L) - 1):
        a, b = L[i], L[i + 1]; seg = math.dist(a, b)
        for j in range(len(P) - 1):
            c, d = P[j], P[j + 1]
            den = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0])
            if abs(den) < 1e-12:
                continue
            t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / den
            u = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / den
            if 0 <= t <= 1 and 0 <= u <= 1:
                out.append(acc + t * seg)
        acc += seg
    return sorted(out)


def position(F, q_en, P_en, CLm, layer):
    """Where a hazard sits: 'across' (crosses the playing line), or relative to the green
    (front/back/left/right, within 40 m of the green origin), else L/R of the playing line."""
    if layer in ('hole', 'green', 'tee', 'fairway', 'path'):
        return None
    if P_en and line_crossings(P_en, CLm):
        return 'across'
    if math.hypot(*q_en) < 40:
        b = math.radians(F.bearing); u = q_en[0] * math.cos(b) - q_en[1] * math.sin(b); v = q_en[0] * math.sin(b) + q_en[1] * math.cos(b)
        a = math.degrees(math.atan2(u, v)) % 360          # 0 = straight behind the green (along play)
        names = ['back', 'back-right', 'right', 'front-right', 'front', 'front-left', 'left', 'back-left']
        return 'green-' + names[int(((a + 22.5) % 360) // 45)]
    return along_line(q_en, CLm)[2]


def play_route(p, L, green_center):
    """The golfer's line of play from position p: p -> remaining dogleg points of the centerline (those more than 5 m
    ahead of p's projection) -> green centre. Mirrors app/geo.js Hole.route exactly (same rule, same 5 m)."""
    al = along_line(p, L)[0]; pts = [p]; acc = 0.0
    for i in range(1, len(L) - 1):
        acc += math.dist(L[i - 1], L[i])
        if al < acc - 5:
            pts.append(L[i])
    pts.append(green_center)
    return pts


def point_in(q, P):
    ins = False
    for i in range(len(P) - 1):
        a, b = P[i], P[i + 1]
        if (a[1] > q[1]) != (b[1] > q[1]) and q[0] < a[0] + (q[1] - a[1]) * (b[0] - a[0]) / (b[1] - a[1]):
            ins = not ins
    return ins


def ray_extents(P0, through, ring):
    """Where the ray from P0 through 'through' enters and leaves the polygon (V2.2.1 front/back method)."""
    dx, dy = through[0] - P0[0], through[1] - P0[1]
    L = math.hypot(dx, dy); ux, uy = dx / L, dy / L; ts = []
    for i in range(len(ring) - 1):
        a, b = ring[i], ring[i + 1]; ex, ey = b[0] - a[0], b[1] - a[1]; den = ux * ey - uy * ex
        if abs(den) < 1e-12:
            continue
        t = ((a[0] - P0[0]) * ey - (a[1] - P0[1]) * ex) / den
        s = ((a[0] - P0[0]) * uy - (a[1] - P0[1]) * ux) / den
        if 0 <= s <= 1 and t > 0:
            ts.append(t)
    return (min(ts), max(ts)) if ts else None


def tf_ll(tf):
    ring = tf['geometry']['coordinates'][0][:-1]
    return [sum(c[0] for c in ring) / len(ring), sum(c[1] for c in ring) / len(ring)]


def prod_green_extents(center, ring, player):
    """Production V2.2.1 intersectionExtents, line for line (lon/lat in, metres out): returns (r, front, back)."""
    deg = math.pi / 180
    def xy(pt, ref):
        return ((pt[0] - ref[0]) * deg * R_EARTH * math.cos(ref[1] * deg), (pt[1] - ref[1]) * deg * R_EARTH)
    v = xy(player, center); r = math.hypot(*v)
    ux, uy = v[0] / r, v[1] / r
    pts = [xy(q, center) for q in (ring[:-1] if ring[0] == ring[-1] else ring)]
    pos, neg = [], []
    for i in range(len(pts)):
        a, b = pts[i], pts[(i + 1) % len(pts)]; ex, ey = b[0] - a[0], b[1] - a[1]
        den = ex * uy - ey * ux
        if abs(den) < 1e-9:
            continue
        seg = (a[1] * ux - a[0] * uy) / den
        if seg < -1e-8 or seg > 1 + 1e-8:
            continue
        sx, sy = a[0] + seg * ex, a[1] + seg * ey; t = sx * ux + sy * uy
        (pos if t >= 0 else neg).append(t)
    front = max(pos) if pos else max(p[0] * ux + p[1] * uy for p in pts)
    back = min(neg) if neg else min(p[0] * ux + p[1] * uy for p in pts)
    return r, front, back


def self_intersects(P):
    def inter(a, b, c, d):
        def o(p1, p2, p3):
            return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0])
        return o(a, b, c) * o(a, b, d) < 0 and o(c, d, a) * o(c, d, b) < 0
    n = len(P) - 1
    for i in range(n):
        for j in range(i + 2, n):
            if i == 0 and j == n - 1:
                continue
            if inter(P[i], P[i + 1], P[j], P[j + 1]):
                return True
    return False


# ---------------------------------------------------------------- standardize
def hole_source(hole):
    """The hole's features from the locked source, plus any features reassigned to it in the
    hole's source_corrections.json (manual, evidence-based; geometry is never altered)."""
    D, src = course_features()
    feats = [f for f in D['features'] if hole in (f['properties'].get('holes') or [])]
    cfile = load(p('data', 'holes', 'hole%02d' % hole, 'source_corrections.json'), {})
    drop = {c['ref'].split(':', 1)[1] for c in cfile.get('remove_from_this_hole', [])}
    for r in drop:
        if not any(f['properties'].get('osm_id') == r for f in feats):
            sys.exit('STOP: removal refers to %s, which the source does not assign to hole %d' % (r, hole))
    feats = [f for f in feats if f['properties'].get('osm_id') not in drop]
    corr = cfile.get('assign_to_this_hole', [])
    for c in corr:
        ref = c['ref'].split(':', 1)[1]
        m = [f for f in D['features'] if f['properties'].get('osm_id') == ref]
        if not m:
            sys.exit('STOP: correction refers to %s, which is not in the locked source' % c['ref'])
        f = json.loads(json.dumps(m[0]))
        f['properties']['assignment_correction'] = {'source_said': c['source_said'], 'status': c['status'], 'evidence': c['evidence']}
        feats.append(f)
    return D, src, feats


def standardize(hole):
    course = load(p('data', 'course', 'course.json'))
    H = course['holes'][hole - 1]
    D, src, feats = hole_source(hole)
    d = p('data', 'holes', 'hole%02d' % hole)
    os.makedirs(d, exist_ok=True)
    # raw extract snapshot (exact copy of the hole's source features)
    save(os.path.join(d, 'source', 'source_extract.geojson'),
         {'type': 'FeatureCollection', 'metadata': {'source_file': src['file'], 'source_sha256': src['sha256'], 'hole': hole},
          'features': feats})
    cl = [f for f in feats if f['properties']['layer'] == 'hole']
    gr = [f for f in feats if f['properties']['layer'] == 'green']
    if len(cl) != 1 or len(gr) != 1:
        sys.exit('STOP: hole %d needs exactly one playing line and one green in the source (found %d, %d)' % (hole, len(cl), len(gr)))
    F = Frame(gr[0]['geometry']['coordinates'][0], cl[0]['geometry']['coordinates'])
    CLm = [F.en(c) for c in cl[0]['geometry']['coordinates']]
    ids = load(os.path.join(d, 'ids.json'), {'note': 'Stable IDs. Never renumber or reuse; retired IDs stay listed.', 'ids': {}})
    out = []
    order = []
    for f in feats:
        g = f['geometry']; layer = f['properties']['layer']
        Pen = None
        if g['type'] == 'Polygon':
            Pen = [F.en(c) for c in g['coordinates'][0]]; q = centroid(Pen)
        elif g['type'] == 'LineString':
            pts = [F.en(c) for c in g['coordinates']]; q = pts[len(pts) // 2]
        else:
            q = F.en(g['coordinates'])
        al, perp, _ = along_line(q, CLm)
        order.append((layer, al, f, position(F, q, Pen, CLm, layer), perp))
    order.sort(key=lambda x: (x[0], x[1]))
    for layer, al, f, side, perp in order:
        ref = '%s:%s' % (f['properties'].get('source', 'src'), f['properties'].get('osm_id') or f['properties'].get('feature_id'))
        if ref not in ids['ids']:
            code = CLASS_CODES.get(layer, 'XX')
            n = 1 + sum(1 for v in ids['ids'].values() if v['id'].startswith('H%02d-%s-' % (hole, code)))
            ids['ids'][ref] = {'id': 'H%02d-%s-%02d' % (hole, code, n), 'first_seen': today()}
        props = {
            'id': ids['ids'][ref]['id'], 'class': 'centerline' if layer == 'hole' else layer,
            'along_m': round(al, 1), 'position': side,
            'offset_m': round(perp, 1),
            'geometry_status': 'verified' if f['properties'].get('verified') else 'unverified',
            'assignment': ('derived (traced from lidar; see source.evidence)' if 'derived_source' in f['properties'] else 'source')
            if not f['properties'].get('assignment_correction') else 'corrected (source said hole %s; %s)' % (
                ','.join(map(str, f['properties']['assignment_correction']['source_said'])), f['properties']['assignment_correction']['status']),
            'source': ({'file': src['file'], 'ref': ref, 'osm_version': f['properties'].get('osm_version'),
                        'licence': src['licence']} if 'derived_source' not in f['properties'] else
                       {'file': f['properties']['derived_source']['file'], 'ref': ref, 'licence': f['properties']['derived_source']['licence'],
                        'derived_from': f['properties'].get('derived_from'), 'evidence': f['properties'].get('evidence')}),
        }
        if layer == 'water':
            props['water_type'] = f['properties'].get('water_type')
        out.append({'type': 'Feature', 'properties': props, 'geometry': f['geometry']})
    # tee sets: match each mapped tee to scorecard yardages (distance along the playing line to the green centre)
    total = sum(math.dist(CLm[i], CLm[i + 1]) for i in range(len(CLm) - 1))
    tees = []
    for ft in [o for o in out if o['properties']['class'] == 'tee']:
        c = centroid([F.en(x) for x in ft['geometry']['coordinates'][0]])
        al, perp, _ = along_line(c, CLm)
        yards = (total - al + math.dist(CLm[-1], (0, 0))) / YD
        match = [s for s, y in H['card_yards'].items() if abs(y - yards) <= 10]
        ft['properties']['measured_yards'] = round(yards)
        ft['properties']['tee_sets'] = match
        tees.append((ft['properties']['id'], round(yards), match))
    # owner-reported tee positions (manual record tee_positions.json): a point inside or beside a mapped box where a tee
    # set's markers actually stand; kept apart from the boxes so each has its own id, label and distances
    tpos = []
    for tp in load(os.path.join(d, 'tee_positions.json'), {'positions': []})['positions']:
        c = F.en(tp['lonlat'])
        al, perp, _ = along_line(c, CLm)
        tpos.append({'id': tp['id'], 'tee_set': tp['tee_set'], 'on_feature': tp.get('on_feature'), 'lonlat': tp['lonlat'],
                     'measured_yards': round((total - al + math.dist(CLm[-1], (0, 0))) / YD), 'card_yards': H['card_yards'][tp['tee_set']],
                     'status': tp['status'], 'source': tp['source'], 'where': tp.get('where')})
    matched = sorted({s for t in tees for s in t[2]} | {t['tee_set'] for t in tpos})
    missing_sets = [s for s in H['card_yards'] if s not in matched]
    # verification records override the source status (manual, never written by this tool)
    ver = load(os.path.join(d, 'verification.json'), {'records': []})
    for rec in ver['records']:
        for o in out:
            if o['properties']['id'] == rec.get('feature_id'):
                o['properties']['geometry_status'] = rec['result']        # verified | approximate | wrong
                o['properties']['verification_ref'] = rec.get('ref')
    classes = sorted({o['properties']['class'] for o in out})
    missing = [c for c in (['fairway'] if H['par'] > 3 else []) + ['bunker', 'water', 'path'] if c not in classes]
    save(os.path.join(d, 'features.geojson'), {'type': 'FeatureCollection', 'schema': SCHEMA,
         'crs_note': 'Coordinates are WGS84 longitude/latitude (EPSG:4326, RFC 7946), copied unchanged from the source.',
         'features': out})
    save(os.path.join(d, 'ids.json'), ids)
    hole_json = {
        'schema': SCHEMA, 'hole': hole, 'par': H['par'], 'card_yards': H['card_yards'],
        'frame': {'type': 'green-pin-frame', 'origin_lonlat': [round(F.lon0, 8), round(F.lat0, 8)],
                  'playing_bearing_deg': round(F.bearing, 6), 'earth_radius_m': R_EARTH,
                  'definition': 'origin = mean of green ring incl. closing vertex; v = last centerline segment toward green; u = golfer\'s right'},
        'centerline_length_yd': round(total / YD, 1),
        'tees': [{'feature_id': t[0], 'measured_yards': t[1], 'tee_sets': t[2]} for t in tees],
        'tee_sets_not_mapped': missing_sets,
        'tee_positions': tpos,
        'counts': {c: sum(1 for o in out if o['properties']['class'] == c) for c in classes},
        'missing': {'not_in_source': missing, 'not_yet_sourced': [c for c in NOT_YET_SOURCED if c not in layer_sources(hole)]},
        'layers': layer_sources(hole),
        'unverified_features': sum(1 for o in out if o['properties']['geometry_status'] == 'unverified'),
        'green_asset': course['holes'][hole - 1].get('green_asset'),
        'production_green_center': course['holes'][hole - 1].get('production_green_center'),
        'generated': {'by': 'tools/pcv3.py standardize', 'on': today(), 'source_sha256': src['sha256']},
    }
    save(os.path.join(d, 'hole.json'), hole_json)
    print('hole %d standardized: %d features, tees %s, missing %s' % (hole, len(out), tees, hole_json['missing']))
    return hole_json


# ---------------------------------------------------------------- checks
def check(hole):
    d = p('data', 'holes', 'hole%02d' % hole)
    hj = load(os.path.join(d, 'hole.json'))
    if not hj:
        sys.exit('run standardize first')
    fc = load(os.path.join(d, 'features.geojson'))
    course = load(p('data', 'course', 'course.json'))
    feats = fc['features']
    cl = [f for f in feats if f['properties']['class'] == 'centerline'][0]['geometry']['coordinates']
    gr = [f for f in feats if f['properties']['class'] == 'green'][0]['geometry']['coordinates'][0]
    F = Frame(gr, cl)
    CLm = [F.en(c) for c in cl]; G = [F.en(c) for c in gr]
    res = []   # (level, check, detail)

    def add(level, name, detail):
        res.append((level, name, detail))
    # A. completeness
    need = REQUIRED + (['fairway'] if hj['par'] > 3 else [])
    have = {f['properties']['class'] for f in feats} | {'hole'}
    for c in need:
        add('PASS' if (c in have or (c == 'hole' and cl)) else 'STOP', 'required class: ' + c, '')
    for c in hj['missing']['not_in_source']:
        add('FLAG', 'not mapped in source: ' + c, 'confirm on imagery/course whether it truly does not exist')
    for c in hj['missing']['not_yet_sourced']:
        add('FLAG', 'no data source yet: ' + c, 'needs lidar / land-cover download (DATA_SOURCES.md)')
    for c, how in sorted(hj.get('layers', {}).items()):
        add('PASS' if c == 'terrain' else 'FLAG', 'layer source: ' + c, how + ('' if c == 'terrain' else '; label as illustrative')
            + ('; hole area must lie inside the locked grid (tools/terrain.py grid stops if not)'))
    if hj['tee_sets_not_mapped']:
        add('FLAG', 'tee sets without a mapped tee', ', '.join(hj['tee_sets_not_mapped']))
    # geometry sanity
    ga = ring_area(G)
    add('PASS' if 150 <= ga <= 1500 else 'FLAG', 'green area', '%.0f m²' % ga)
    end_in = point_in(CLm[-1], G)
    add('PASS' if end_in else 'FLAG', 'centerline ends on the green', '' if end_in else 'end point outside green outline')
    for f in feats:
        pr = f['properties']; g = f['geometry']
        if g['type'] == 'Polygon':
            P = [F.en(c) for c in g['coordinates'][0]]
            if self_intersects(P):
                add('STOP', 'self-intersecting outline', pr['id'])
            a = ring_area(P)
            if pr['class'] == 'bunker' and not (5 <= a <= 800):
                add('FLAG', 'unusual bunker size', '%s %.0f m²' % (pr['id'], a))
        if pr['offset_m'] is not None and pr['offset_m'] > 120 and pr['class'] != 'centerline':
            add('FLAG', 'feature far from playing line', '%s %.0f m' % (pr['id'], pr['offset_m']))
    for t in hj['tees']:
        add('PASS' if t['tee_sets'] else 'FLAG', 'tee %s vs scorecard' % t['feature_id'],
            '%d yd → %s' % (t['measured_yards'], ', '.join(t['tee_sets']) or 'no card tee within 10 yd'))
    for t in hj.get('tee_positions', []):
        add('PASS', 'owner-reported tee position %s (%s)' % (t['id'], t['tee_set']),
            '%d yd along the line (card %d); %s' % (t['measured_yards'], t['card_yards'], t['source']))
    add('FLAG' if hj['unverified_features'] else 'PASS', 'features awaiting verification',
        '%d of %d' % (hj['unverified_features'], len(feats)))
    # green asset dependency
    ga_ = course['holes'][hole - 1].get('green_asset')
    add('PASS' if ga_ and ga_.get('approved') else 'FLAG', 'approved green asset recorded',
        (ga_ or {}).get('folder', 'none'))
    # distances from each mapped tee (reported for review; carry method = docs/ARCHITECTURE.md §GPS)
    gc = (0.0, 0.0)
    dist_rows = []
    starts = [(t['feature_id'], None) for t in hj['tees']] + [(t['id'], t['lonlat']) for t in hj.get('tee_positions', [])]
    for tid, pll in starts:
        if pll is None:
            tf = [f for f in feats if f['properties']['id'] == tid][0]
            T = centroid([F.en(c) for c in tf['geometry']['coordinates'][0]]); tll = tf_ll(tf)
        else:
            T = F.en(pll); tll = pll
        pc = hj.get('production_green_center')
        if pc:
            r, fr, bk = prod_green_extents(pc, gr, tll)
            dist_rows.append((tid, 'green F/C/B (production method)', '%d / %d / %d' % (round(abs(r - fr) / YD), round(r / YD), round(abs(r - bk) / YD))))
        else:
            fb = ray_extents(T, gc, G)
            dist_rows.append((tid, 'green F/C/B', '%d / %d / %d' % (fb[0] / YD, math.dist(T, gc) / YD, fb[1] / YD)))
        for f in feats:
            if f['properties']['class'] in ('bunker', 'water'):
                P = [F.en(c) for c in f['geometry']['coordinates'][0]]
                pos = f['properties']['position']
                if pos == 'across':
                    xs = line_crossings(P, play_route(T, CLm, F.en(pc) if pc else gc))
                    e = (min(xs), max(xs)) if xs else None; how = 'along playing line from the tee'
                else:
                    e = ray_extents(T, centroid(P), P); how = 'line through hazard'
                if e:
                    dist_rows.append((tid, f['properties']['id'] + ' (%s)' % pos,
                                      'reach %d · carry %d  (%s)' % (e[0] / YD, e[1] / YD, how)))
    os.makedirs(os.path.join(d, 'checks'), exist_ok=True)
    stops = [r for r in res if r[0] == 'STOP']
    lines = ['# Hole %d — automated check (%s)' % (hole, today()), '',
             'Result: **%s** · %d pass · %d flag · %d stop' % ('STOP' if stops else 'OK to continue (flags need review)',
                                                              sum(r[0] == 'PASS' for r in res), sum(r[0] == 'FLAG' for r in res), len(stops)),
             '', '| Level | Check | Detail |', '|---|---|---|'] + ['| %s | %s | %s |' % r for r in res] + \
            ['', '## Distances from mapped tees (unverified data; for review)', '', '| Tee | Feature | Yards |', '|---|---|---|'] + \
            ['| %s | %s | %s |' % r for r in dist_rows]
    open(os.path.join(d, 'checks', 'check_report.md'), 'w').write('\n'.join(lines) + '\n')
    write_kml(hole, feats, os.path.join(d, 'checks', 'hole%02d_check.kml' % hole))
    write_svg(hole, feats, F, os.path.join(d, 'checks', 'hole%02d_topdown.svg' % hole))
    print('\n'.join(lines[:3]))
    return res


STYLE = {'green': ('#3fa34d', 'ff4da33f'), 'fairway': ('#7cc46a', 'ff6ac47c'), 'tee': ('#a7d99a', 'ff9ad9a7'),
         'bunker': ('#f1e2b0', 'ffb0e2f1'), 'water': ('#6fb6e8', 'ffe8b66f'), 'path': ('#cccccc', 'ffcccccc'),
         'centerline': ('#ffffff', 'ffffffff')}


def write_kml(hole, feats, path):
    pm = []
    for f in feats:
        pr = f['properties']; g = f['geometry']; c = STYLE.get(pr['class'], ('#888', 'ff888888'))[1]
        name = '%s %s (%s)' % (pr['id'], pr['class'], pr['geometry_status'])
        if g['type'] == 'Polygon':
            co = ' '.join('%s,%s,0' % (x, y) for x, y in g['coordinates'][0])
            pm.append('<Placemark><name>%s</name><Style><LineStyle><color>%s</color><width>3</width></LineStyle><PolyStyle><fill>0</fill></PolyStyle></Style><Polygon><outerBoundaryIs><LinearRing><coordinates>%s</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>' % (name, c, co))
        elif g['type'] == 'LineString':
            co = ' '.join('%s,%s,0' % (x, y) for x, y in g['coordinates'])
            pm.append('<Placemark><name>%s</name><Style><LineStyle><color>%s</color><width>2</width></LineStyle></Style><LineString><coordinates>%s</coordinates></LineString></Placemark>' % (name, c, co))
    open(path, 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Pocasset Hole %d — mapped outlines (check against current imagery)</name>%s</Document></kml>\n' % (hole, ''.join(pm)))


def write_svg(hole, feats, F, path):
    """Top-down check drawing in the hole frame (tee at bottom, green at top). Pure SVG, no dependencies."""
    shapes = []; allp = []
    for f in feats:
        g = f['geometry']
        if g['type'] == 'Polygon':
            pts = [F.uv(c) for c in g['coordinates'][0]]
        elif g['type'] == 'LineString':
            pts = [F.uv(c) for c in g['coordinates']]
        else:
            continue
        allp += pts; shapes.append((f['properties'], g['type'], pts))
    minx = min(q[0] for q in allp) - 30; maxx = max(q[0] for q in allp) + 30
    miny = min(q[1] for q in allp) - 30; maxy = max(q[1] for q in allp) + 40
    s = 2.0; W = (maxx - minx) * s; Hh = (maxy - miny) * s
    X = lambda q: '%.1f,%.1f' % ((q[0] - minx) * s, (maxy - q[1]) * s)
    out = ['<svg xmlns="http://www.w3.org/2000/svg" width="%.0f" height="%.0f" viewBox="0 0 %.0f %.0f" font-family="sans-serif">' % (W, Hh, W, Hh),
           '<rect width="100%" height="100%" fill="#3e6b3a"/>']
    for r in range(50, 700, 50):
        out.append('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>' % ((0 - minx) * s, (maxy - 0) * s, r * YD * s))
        out.append('<text x="%.1f" y="%.1f" fill="#fff" fill-opacity=".7" font-size="11">%d</text>' % ((0 - minx) * s + 4, (maxy + r * YD) * s - 3, r))
    order = ['fairway', 'tee', 'water', 'path', 'bunker', 'green', 'centerline']
    shapes.sort(key=lambda x: order.index(x[0]['class']) if x[0]['class'] in order else 9)
    for pr, t, pts in shapes:
        col = STYLE.get(pr['class'], ('#888',))[0]
        if t == 'Polygon':
            out.append('<polygon points="%s" fill="%s" stroke="#000" stroke-width="1"><title>%s</title></polygon>' % (' '.join(map(X, pts)), col, pr['id']))
            c = centroid(pts)
            if pr['class'] in ('bunker', 'water', 'tee'):
                out.append('<text x="%s" y="%s" fill="#fff" font-size="11" stroke="#000" stroke-width="2.5" paint-order="stroke">%s</text>' % (*X((c[0] + 6, c[1])).split(','), pr['id'][4:]))
        else:
            dash = ' stroke-dasharray="6 4"' if pr['class'] == 'centerline' else ''
            out.append('<polyline points="%s" fill="none" stroke="%s" stroke-width="%s"%s/>' % (' '.join(map(X, pts)), col, 2 if pr['class'] == 'centerline' else 1.5, dash))
    out.append('<text x="10" y="20" fill="#fff" font-size="15" font-weight="bold">Hole %d · mapped data (unverified) · rings = yd to green</text></svg>' % hole)
    open(path, 'w').write('\n'.join(out) + '\n')


# ---------------------------------------------------------------- inventory
CHECKPOINTS = ['A_data_complete', 'B_layout_verified', 'C_flyover_approved', 'D_gps_validated', 'E_green_preserved', 'F_iphone_tested']


def inventory():
    D, src = course_features()
    course = load(p('data', 'course', 'course.json'))
    rows = []
    for h in range(1, 19):
        H = course['holes'][h - 1]
        feats = [f for f in D['features'] if h in (f['properties'].get('holes') or [])]
        cnt = lambda L: sum(1 for f in feats if f['properties']['layer'] == L)
        st = load(p('data', 'holes', 'hole%02d' % h, 'status.json'), {})
        cps = st.get('checkpoints', {})
        missing = [c for c in (['fairway'] if H['par'] > 3 else []) + ['bunker'] if cnt(c) == 0]
        rows.append([h, H['par'], H['card_yards']['Gold'], cnt('tee'), cnt('fairway'), cnt('bunker'), cnt('water'), cnt('path'),
                     cnt('hole'), cnt('green'), ', '.join(missing + [c for c in NOT_YET_SOURCED if c not in layer_sources(h)] + [c + ' (illustrative)' for c in layer_sources(h) if c == 'trees']) or '—',
                     'approved' if (H.get('green_asset') or {}).get('approved') else '—',
                     ' '.join('%s:%s' % (k[0], {'pass': '✔', 'fail': '✖', 'pending': '·', 'in_progress': '…'}.get(cps.get(k, {}).get('state', 'pending'), '·')) for k in CHECKPOINTS),
                     st.get('stage', 'awaiting data')])
    hdr = ['Hole', 'Par', 'Gold yd', 'Tees', 'Fairways', 'Bunkers', 'Water', 'Paths', 'Line', 'Green', 'Missing / not sourced',
           'Green asset', 'Checkpoints A–F', 'Stage']
    md = ['# 18-hole progress inventory', '',
          'Generated by `python3 -I tools/pcv3.py inventory` on %s from `%s` (sha256 %s…) and each hole\'s `status.json`.' % (today(), src['file'], src['sha256'][:12]),
          'Counts are features the source assigns to the hole. **All source features are unverified.** Pocasset rebuilt every bunker and tee recently, so counts may not match the course.',
          '', 'Checkpoints: ✔ pass · … in progress · · pending · ✖ failed. Stages: awaiting data → in development → awaiting approval → approved.', '',
          '| ' + ' | '.join(hdr) + ' |', '|' + '---|' * len(hdr)] + ['| ' + ' | '.join(str(x) for x in r) + ' |' for r in rows]
    md += ['', 'Course totals: %d bunkers, %d tees, %d fairways, %d water, %d path segments mapped.' % (
        sum(r[5] for r in rows), sum(r[3] for r in rows), sum(r[4] for r in rows), sum(r[6] for r in rows), sum(r[7] for r in rows))]
    open(p('docs', 'HOLE_PROGRESS.md'), 'w').write('\n'.join(md) + '\n')
    print('\n'.join(md))


# ---------------------------------------------------------------- green asset protection
def verify_greens(master):
    man = load(p('data', 'greens', 'approved_manifest.json'))
    bad = []; ok = 0
    for e in man['files']:
        fp = os.path.join(master, e['path'])
        if not os.path.exists(fp):
            bad.append('MISSING ' + e['path'])
        elif sha256(fp) != e['sha256']:
            bad.append('CHANGED ' + e['path'])
        else:
            ok += 1
    print('%d of %d approved green files match the manifest' % (ok, len(man['files'])))
    for b in bad:
        print('  ' + b)
    return not bad


# ---------------------------------------------------------------- promote (append-only)
def promote(hole, label):
    d = p('data', 'holes', 'hole%02d' % hole)
    ad = os.path.join(d, 'approved')
    os.makedirs(ad, exist_ok=True)
    n = 1 + len([x for x in os.listdir(ad) if x.startswith('v')])
    dest = os.path.join(ad, 'v%d' % n)
    if os.path.exists(dest):
        sys.exit('STOP: %s exists' % dest)
    os.makedirs(dest)
    files = ['features.geojson', 'hole.json', 'ids.json', 'verification.json', 'camera.json', 'terrain.json', 'source_corrections.json']
    rend = os.path.join(d, 'render')
    man = []
    for f in files:
        if os.path.exists(os.path.join(d, f)):
            shutil.copy2(os.path.join(d, f), os.path.join(dest, f)); man.append(f)
    if os.path.isdir(rend):      # current renders only (sub-folders such as render/v0.1 are history, not part of this version)
        os.makedirs(os.path.join(dest, 'render'))
        for x in sorted(os.listdir(rend)):
            if os.path.isfile(os.path.join(rend, x)):
                shutil.copy2(os.path.join(rend, x), os.path.join(dest, 'render', x)); man.append('render/' + x)
    save(os.path.join(dest, 'MANIFEST.json'), {'hole': hole, 'version': n, 'label': label, 'promoted': today(),
                                                'files': {m: sha256(os.path.join(dest, m)) for m in man}})
    print('promoted to', dest)


def file_inventory():
    rows = []
    for root, dirs, fs in os.walk(ROOT):
        dirs[:] = [x for x in dirs if x != '.git']
        for f in fs:
            fp = os.path.join(root, f); rel = os.path.relpath(fp, ROOT)
            if rel == os.path.join('docs', 'FILE_INVENTORY.md'):
                continue
            rows.append((rel, os.path.getsize(fp), sha256(fp)[:16]))
    md = ['# File inventory', '', 'Generated by `python3 -I tools/pcv3.py files` on %s. SHA-256 = first 16 hex characters.' % today(),
          'Generated files are rebuilt by the tools; manual records (status.json, verification.json, camera.json) and approved/ are never rewritten.', '',
          '| File | Bytes | SHA-256 |', '|---|---|---|'] + ['| `%s` | %d | %s |' % r for r in sorted(rows)]
    open(p('docs', 'FILE_INVENTORY.md'), 'w').write('\n'.join(md) + '\n')
    print(len(rows), 'files listed')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['standardize', 'check', 'inventory', 'verify-greens', 'promote', 'files'])
    ap.add_argument('--hole', type=int)
    ap.add_argument('--master')
    ap.add_argument('--label', default='')
    a = ap.parse_args()
    if a.cmd in ('standardize', 'check', 'promote') and not (a.hole and 1 <= a.hole <= 18):
        sys.exit('--hole 1..18 required')
    if a.cmd == 'standardize':
        standardize(a.hole)
    elif a.cmd == 'check':
        r = check(a.hole); sys.exit(1 if any(x[0] == 'STOP' for x in r) else 0)
    elif a.cmd == 'inventory':
        inventory()
    elif a.cmd == 'verify-greens':
        sys.exit(0 if verify_greens(a.master) else 1)
    elif a.cmd == 'promote':
        promote(a.hole, a.label)
    elif a.cmd == 'files':
        file_inventory()


if __name__ == '__main__':
    main()
