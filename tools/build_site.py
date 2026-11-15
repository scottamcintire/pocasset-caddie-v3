#!/usr/bin/env python3
"""Assemble the V3 test site from built hole prototypes (generated; never touches production).
  python3 -I tools/build_site.py --holes 2 3   ->  site/  (index.html hole picker + holeNN/ folders + .nojekyll)
Publish target: the separate repository scottamcintire/pocasset-caddie-v3 (gh-pages branch). Never the production repo."""
import argparse, json, os, shutil
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ap = argparse.ArgumentParser(); ap.add_argument('--holes', type=int, nargs='+', required=True); a = ap.parse_args()
out = os.path.join(ROOT, 'site')
if os.path.exists(out): shutil.rmtree(out)
os.makedirs(out)
rows = []
for n in a.holes:
    src = os.path.join(ROOT, 'prototype', 'hole%02d' % n)
    if not os.path.exists(os.path.join(src, 'index.html')):
        raise SystemExit('STOP: build the prototype first: tools/build_prototype.py --hole %d' % n)
    shutil.copytree(src, os.path.join(out, 'hole%02d' % n))
    h = json.load(open(os.path.join(ROOT, 'data', 'holes', 'hole%02d' % n, 'hole.json')))
    tag = 'approved look' if n == 2 else 'trial'
    rows.append('<a class="h" href="hole%02d/"><b>%d</b><span>Par %d · Green %d · Blue %d yd</span><i>%s</i></a>' % (
        n, n, h['par'], h['card_yards']['Green'], h['card_yards']['Blue'], tag))
page = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0a1a30"><title>Pocasset V3 test</title><meta name="robots" content="noindex">
<style>*{box-sizing:border-box}body{margin:0;background:#0a1a30;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Roboto,sans-serif;padding:max(16px,env(safe-area-inset-top)) 16px max(24px,env(safe-area-inset-bottom))}
h1{font-size:26px;margin:8px 0 2px}h1 i{font-style:normal;color:#5aa2ff}p{color:#9fb3cf;font-size:14px;line-height:1.5;margin:4px 0 18px}
.h{display:grid;grid-template-columns:64px 1fr auto;align-items:center;gap:12px;background:#132a4a;border:1px solid #2c5591;border-radius:14px;padding:14px;margin-bottom:12px;color:#fff;text-decoration:none}
.h b{background:#1d6fe0;border-radius:10px;font-size:30px;text-align:center;padding:8px 0}.h span{font-weight:700;font-size:15px}.h i{font-style:normal;font-size:12px;color:#ffd38a}
small{display:block;color:#7f93b3;font-size:12px;line-height:1.5;margin-top:18px}</style></head><body>
<h1>Pocasset <i>AI</i> Caddie V3</h1><p>Test site, separate from the live app (V2.3.1). Tap a hole, then use <b>Use live GPS</b> on the course.</p>
''' + '\n'.join(rows) + '''
<small>Bunker and tee outlines predate the spring 2026 rebuild and are not yet verified. Woods are illustrative. Approved greens shown unchanged.
Map data © OpenStreetMap contributors · elevation USGS 3DEP · canopy from USDA NAIP.</small></body></html>'''
open(os.path.join(out, 'index.html'), 'w').write(page)
open(os.path.join(out, '.nojekyll'), 'w').write('')
print('site built:', out, sorted(os.listdir(out)))
