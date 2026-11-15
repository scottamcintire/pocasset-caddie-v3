#!/usr/bin/env python3
"""Bring an approved green into V3 unchanged.
  python3 -I tools/port_green.py --hole N --image <path to the approved PNG from the Mac master>
* The image must match its SHA-256 in data/greens/approved_manifest.json (else STOP); it is copied byte-for-byte, read-only.
* The pin model (EZLocator placement: transform, outline points, sample pin) is copied unchanged from production V2.3.1's
  build data (data/sources/production/v231_greens_data.json, locked) and must match the values embedded in the V2.3.1 page.
Never edits, recolours, resamples or re-calibrates anything (GREEN_ASSET_PROTECTION.md)."""
import argparse, hashlib, json, os, shutil, stat, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ap = argparse.ArgumentParser(); ap.add_argument('--hole', type=int, required=True); ap.add_argument('--image', required=True); a = ap.parse_args()
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
man = {e['path']: e['sha256'] for e in json.load(open(os.path.join(ROOT, 'data', 'greens', 'approved_manifest.json')))['files']}
name = os.path.basename(a.image); key = '03_greens/hole_%02d/approved/%s' % (a.hole, name)
if key not in man: sys.exit('STOP: %s is not an approved file in the manifest' % key)
if sha(a.image) != man[key]: sys.exit('STOP: %s does not match its approved checksum' % name)
src = os.path.join(ROOT, 'data', 'sources', 'production', 'v231_greens_data.json')
lock = json.load(open(os.path.join(ROOT, 'data', 'sources', 'SOURCES.lock.json')))
ent = [s for s in lock['sources'] if s['role'] == 'production_green_models']
if not ent or ent[0]['sha256'] != sha(src): sys.exit('STOP: production green data is not locked or has changed')
h = json.load(open(src))['holes'][a.hole - 1]
if h['hole'] != a.hole: sys.exit('STOP: hole mismatch in production data')
from PIL import Image
w, _ = Image.open(a.image).size
d = os.path.join(ROOT, 'greens', 'hole%02d' % a.hole); os.makedirs(d, exist_ok=True)
dst = os.path.join(d, name)
if os.path.exists(dst): os.chmod(dst, stat.S_IWUSR | stat.S_IRUSR)
shutil.copyfile(a.image, dst); os.chmod(dst, stat.S_IRUSR | stat.S_IRGRP | stat.S_IROTH)
pm = {'schema': 'pocasset-v3/green-pin-model@1', 'hole': a.hole,
      'source': 'Ported unchanged from production V2.3.1 build data (data/sources/production/v231_greens_data.json); same values as the approved Hole %d page' % a.hole,
      'image': name, 'image_sha256': man[key], 'coord_W': h['W'], 'coord_H': h['H'], 'image_scale': w / h['W']}
for k in ('points', 't', 'geoT', 'origin', 'bearing', 'model', 'depth', 'sample'):
    if k in h: pm[k] = h[k]
json.dump(pm, open(os.path.join(d, 'pin_model.json'), 'w'), indent=1)
print('green %d: %s (approved checksum OK), pin model from V2.3.1 data, scale %.3f' % (a.hole, name, pm['image_scale']))
