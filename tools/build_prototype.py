#!/usr/bin/env python3
"""Assemble the stand-alone V3 prototype for one hole (generated; safe to delete and rebuild).
  python3 -I tools/build_prototype.py --hole 2   ->  prototype/holeNN/
Copies: app/geo.js, app/green.js, prototype/src/index.html, the rendered views + projections,
the protected approved green (checksum verified) and its pin model. Writes data.js. Changes nothing else."""
import argparse, hashlib, json, os, shutil, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
P = lambda *a: os.path.join(ROOT, *a)
ap = argparse.ArgumentParser(); ap.add_argument('--hole', type=int, required=True); a = ap.parse_args()
n = a.hole; hd = P('data', 'holes', 'hole%02d' % n); out = P('prototype', 'hole%02d' % n)
if os.path.exists(out): shutil.rmtree(out)
os.makedirs(os.path.join(out, 'img'))
for f in ('geo.js', 'green.js', 'flyover.js'): shutil.copy2(P('app', f), os.path.join(out, f))
shutil.copy2(P('prototype', 'src', 'index.html'), os.path.join(out, 'index.html'))
views = {}
for v in ('tee', 'approach'):
    pj = json.load(open(os.path.join(hd, 'render', 'hole%02d_%s.json' % (n, v))))
    shutil.copy2(os.path.join(hd, 'render', pj['image']), os.path.join(out, 'img', pj['image']))
    pj['image'] = 'img/' + pj['image']; views[v] = pj
pm = json.load(open(P('greens', 'hole%02d' % n, 'pin_model.json')))
man = {e['path']: e['sha256'] for e in json.load(open(P('data', 'greens', 'approved_manifest.json')))['files']}
src_img = P('greens', 'hole%02d' % n, pm['image'])
h = hashlib.sha256(open(src_img, 'rb').read()).hexdigest()
if h != man['03_greens/hole_%02d/approved/%s' % (n, pm['image'])] or h != pm['image_sha256']:
    sys.exit('STOP: approved green copy does not match the master checksum')
shutil.copy2(src_img, os.path.join(out, 'img', pm['image']))
data = {'hole': json.load(open(os.path.join(hd, 'hole.json'))), 'features': json.load(open(os.path.join(hd, 'features.geojson'))),
        'views': views, 'terrain': json.load(open(os.path.join(hd, 'terrain.json'))), 'pin_model': pm, 'pin': pm['sample'], 'green_image': 'img/' + pm['image']}
open(os.path.join(out, 'data.js'), 'w').write('window.HOLEDATA=' + json.dumps(data, separators=(',', ':')) + ';\n')
print('prototype built:', out, sorted(os.listdir(out)), sorted(os.listdir(os.path.join(out, 'img'))))
