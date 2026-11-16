#!/usr/bin/env python3
"""Assemble the V3 test site from built hole prototypes (generated; never touches production).
  python3 -I tools/build_site.py --holes 2 3 4   ->  site/  (index.html hole picker + holeNN/ folders + .nojekyll)
Homepage statuses come from data/release/status.json (owner review status; publishing never marks a hole approved).
Publish target: the separate repository scottamcintire/pocasset-caddie-v3 (gh-pages branch). Never the production repo."""
import argparse, json, os, shutil
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ap = argparse.ArgumentParser(); ap.add_argument('--holes', type=int, nargs='+', required=True); a = ap.parse_args()
out = os.path.join(ROOT, 'site')
if os.path.exists(out): shutil.rmtree(out)
os.makedirs(out)
st = json.load(open(os.path.join(ROOT, 'data', 'release', 'status.json')))
for n in a.holes:
    if st['holes'].get(str(n), {}).get('status') in (None, 'in_development', 'blocked'):
        raise SystemExit('STOP: hole %d is not marked as published in data/release/status.json' % n)
rows = []
for k in sorted(st['holes'], key=int):
    n = int(k); e = st['holes'][k]; lab = st['labels'][e['status']]
    det = ('<em>%s</em>' % e['detail']) if e.get('detail') else ''
    if n in a.holes:
        src = os.path.join(ROOT, 'prototype', 'hole%02d' % n)
        if not os.path.exists(os.path.join(src, 'index.html')):
            raise SystemExit('STOP: build the prototype first: tools/build_prototype.py --hole %d' % n)
        shutil.copytree(src, os.path.join(out, 'hole%02d' % n))
        h = json.load(open(os.path.join(ROOT, 'data', 'holes', 'hole%02d' % n, 'hole.json')))
        rows.append('<a class="h s-%s" href="hole%02d/"><b>%d</b><span>Par %d · Green %d · Blue %d yd%s</span><i>%s</i></a>' % (
            e['status'], n, n, h['par'], h['card_yards']['Green'], h['card_yards']['Blue'], det, lab))
    else:
        rows.append('<div class="h off s-%s"><b>%d</b><span>Hole %d%s</span><i>%s</i></div>' % (e['status'], n, n, det, lab))
play = ''
if os.path.exists(os.path.join(ROOT, 'prototype', 'play', 'index.html')):   # integrated round page (tools/build_play.py)
    shutil.copytree(os.path.join(ROOT, 'prototype', 'play'), os.path.join(out, 'play'))
    play = ('<a class="h play" href="play/"><b>▶</b><span>Play a round<em>Live GPS · hazards · green &amp; today\'s pin · scorecard · '
            'all 18 holes (flyovers 1–9)</em></span><i>New</i></a>')
page = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0a1a30"><title>Pocasset V3 test</title><meta name="robots" content="noindex">
<style>*{box-sizing:border-box}body{margin:0;background:#0a1a30;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Roboto,sans-serif;padding:max(16px,env(safe-area-inset-top)) 16px max(24px,env(safe-area-inset-bottom))}
h1{font-size:26px;margin:8px 0 2px}h1 i{font-style:normal;color:#5aa2ff}p{color:#9fb3cf;font-size:14px;line-height:1.5;margin:4px 0 18px}
.h{display:grid;grid-template-columns:64px 1fr auto;align-items:center;gap:12px;background:#132a4a;border:1px solid #2c5591;border-radius:14px;padding:14px;margin-bottom:12px;color:#fff;text-decoration:none}
.h b{background:#1d6fe0;border-radius:10px;font-size:30px;text-align:center;padding:8px 0}.h span{font-weight:700;font-size:15px}.h i{font-style:normal;font-size:12px;color:#ffd38a;text-align:right;max-width:110px}.h em{display:block;font-style:normal;font-weight:400;font-size:12px;color:#9fb3cf;margin-top:3px}.off{opacity:.55}.off b{background:#2b3f5e}.play{border-color:#1f8a4c;background:#0f3a26}.play b{background:#1f8a4c}.play i{color:#7be08f}.s-approved i{color:#7be08f}.s-needs_revision i{color:#ff9a8a}.s-blocked i{color:#ff9a8a}
small{display:block;color:#7f93b3;font-size:12px;line-height:1.5;margin-top:18px}</style></head><body>
<h1>Pocasset <i>AI</i> Caddie V3</h1><p>Test site, separate from the live app (V2.3.1). <b>Play a round</b> for the full caddie, or tap a hole to look at its flyover.</p>
''' + play + '\n'.join(rows) + '''
<small>Bunker and tee outlines predate the spring 2026 rebuild and are not yet verified. Woods are illustrative. Approved greens shown unchanged.
Map data © OpenStreetMap contributors · elevation USGS 3DEP · canopy from USDA NAIP.</small></body></html>'''
open(os.path.join(out, 'index.html'), 'w').write(page)
open(os.path.join(out, '.nojekyll'), 'w').write('')
print('site built:', out, sorted(os.listdir(out)))
