#!/usr/bin/env python3
"""Assemble the integrated V3 /play/ page (generated; safe to delete and rebuild).
  python3 -I tools/build_play.py --flyover-holes 1 2 3 4 5 6 7 8 9   ->  prototype/play/
course.js : 18-hole GPS data (green centres/outlines + playing lines) and pin models from the LOCKED copy of production
            V2.3.1 data (data/sources/production/v231_greens_data.json; checksum verified), plus the central scorecard.
holes/    : per-hole flyover data for the holes listed (same data as the published /holeNN/ pages).
img/      : rendered flyover views + the 18 approved greens, each verified byte-identical to the master checksum.
vendor/pdfjs/ : pdf.js 6.2.108 legacy build for the pin-sheet PDF upload (checksums verified).
Changes nothing outside prototype/play/."""
import argparse, hashlib, json, os, shutil, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
P = lambda *a: os.path.join(ROOT, *a)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
ap = argparse.ArgumentParser(); ap.add_argument('--flyover-holes', type=int, nargs='+', required=True); a = ap.parse_args()
out = P('prototype', 'play')
if os.path.exists(out): shutil.rmtree(out)
os.makedirs(os.path.join(out, 'img')); os.makedirs(os.path.join(out, 'holes'))
for f in ('geo.js', 'green.js', 'flyover.js', 'caddie.js', 'pinsheet.js', 'advisor.js', 'advisor_config.js'): shutil.copy2(P('app', f), os.path.join(out, f))
# pdf.js for the pin-sheet upload (vendored, unmodified; checksums verified)
VEN = P('vendor', 'pdfjs-6.2.108'); os.makedirs(os.path.join(out, 'vendor', 'pdfjs'))
for line in open(os.path.join(VEN, 'SHA256SUMS')):
    h, f = line.split()
    if sha(os.path.join(VEN, f)) != h: sys.exit('STOP: vendored pdf.js file %s does not match SHA256SUMS' % f)
    shutil.copy2(os.path.join(VEN, f), os.path.join(out, 'vendor', 'pdfjs', f.replace('.mjs', '.js')))   # .js: served as JavaScript everywhere
for f in ('pdfjs_safari.js', 'pdf.worker.safari.js'): shutil.copy2(P('app', f), os.path.join(out, 'vendor', 'pdfjs', f))   # Safari fix (our code)
shutil.copy2(P('prototype', 'play_src', 'index.html'), os.path.join(out, 'index.html'))

lock = {s['role']: s for s in json.load(open(P('data', 'sources', 'SOURCES.lock.json')))['sources']}
src = P('data', 'sources', 'production', 'v231_greens_data.json')
if lock.get('production_green_models', {}).get('sha256') != sha(src): sys.exit('STOP: locked V2.3.1 course data has changed')
prod = json.load(open(src))['holes']
man = {e['path']: e['sha256'] for e in json.load(open(P('data', 'greens', 'approved_manifest.json')))['files']}
greens, images = [], []
for n in range(1, 19):
    pm = json.load(open(P('greens', 'hole%02d' % n, 'pin_model.json')))
    img = P('greens', 'hole%02d' % n, pm['image']); h = sha(img)
    if h != man.get('03_greens/hole_%02d/approved/%s' % (n, pm['image'])) or h != pm['image_sha256']:
        sys.exit('STOP: approved green %d does not match the master checksum' % n)
    ph = prod[n - 1]
    for k in ('points', 't', 'geoT', 'origin', 'bearing', 'depth', 'sample'):   # pin model must equal V2.3.1's
        if pm[k] != ph[k]: sys.exit('STOP: hole %d pin model %s differs from V2.3.1' % (n, k))
    shutil.copy2(img, os.path.join(out, 'img', pm['image'])); greens.append(pm); images.append('img/' + pm['image'])
sc = json.load(open(P('data', 'scorecard', 'pocasset_scorecard.json')))
for t, e in sc['original']['tees'].items():
    assert sum(e['yards']) == e['total'] and len(e['yards']) == 18, t
for t, e in sc['provisional']['tees'].items():
    assert sum(e['yards']) == e['total'] and len(e['yards']) == 18, t
assert sum(sc['par']) == 72
course = {'green_map': {str(n): prod[n - 1]['green'] for n in range(1, 19)}, 'hole_paths': {str(n): prod[n - 1]['path'] for n in range(1, 19)},
          'greens': greens, 'green_images': images, 'scorecard': sc, 'flyover_holes': sorted(a.flyover_holes),
          'source': {'course_data': 'data/sources/production/v231_greens_data.json', 'course_data_sha256': sha(src)}}
open(os.path.join(out, 'course.js'), 'w').write('window.COURSE=' + json.dumps(course, separators=(',', ':')) + ';\n')
for n in a.flyover_holes:
    proto = P('prototype', 'hole%02d' % n)
    if not os.path.exists(os.path.join(proto, 'data.js')): sys.exit('STOP: build the hole page first: tools/build_prototype.py --hole %d' % n)
    js = open(os.path.join(proto, 'data.js')).read(); assert js.startswith('window.HOLEDATA=')
    D = json.loads(js[len('window.HOLEDATA='):].rstrip().rstrip(';'))
    for v in ('tee', 'approach'):
        im = D['views'][v]['image']; shutil.copy2(os.path.join(proto, im), os.path.join(out, im))
    D = {k: D[k] for k in ('hole', 'features', 'views', 'terrain')}
    open(os.path.join(out, 'holes', 'hole%02d.js' % n), 'w').write('window.PLAYHOLES=window.PLAYHOLES||{};PLAYHOLES[%d]=' % n + json.dumps(D, separators=(',', ':')) + ';\n')
print('play built:', out, '| flyovers', a.flyover_holes, '| greens 1-18 checksum OK |', len(os.listdir(os.path.join(out, 'img'))), 'images')
