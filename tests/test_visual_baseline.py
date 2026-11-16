"""Approved visual baseline test (owner approval 15 Nov 2026, VISUAL_BASELINE_v1.0.json).
  python3 tests/test_visual_baseline.py           quick: style file unchanged; committed Hole 2 renders = approved reference
  python3 tests/test_visual_baseline.py --render  full: re-render Hole 2 into a temp copy of the project and require
                                                  byte-identical images, material IDs and projections (about 4 minutes)
Images and material IDs must match byte-for-byte; projection files must match except input checksums.
Any renderer change that alters Hole 2's approved look fails here and must be discussed with the owner first."""
import hashlib, json, os, shutil, subprocess, sys, tempfile
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from render_flyover import latest_visual_baseline  # noqa: E402
lock = latest_visual_baseline()
V = lock['version']
sh = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
bad = []
if sh(os.path.join(ROOT, 'style', 'flyover_style.json')) != lock['files']['style/approved/flyover_style_v%s.json' % V]:
    bad.append('style/flyover_style.json differs from the approved style')
for f, h in lock['files'].items():
    if f.startswith('style/approved/') and sh(os.path.join(ROOT, f)) != h:
        bad.append('approved file changed: ' + f)
ref = os.path.join(ROOT, 'data', 'holes', 'hole02', 'render', 'approved_visual_v%s' % V)
for f, h in lock['reference_renders_hole02'].items():
    if sh(os.path.join(ref, f)) != h:
        bad.append('approved reference changed: ' + f)
def visual_json(p):
    """A projection file minus its input provenance: data verification may change input checksums without any visual change."""
    j = json.load(open(p)); j.pop('inputs_sha256', None); return j


def compare(render_dir, label):
    for f, h in lock['reference_renders_hole02'].items():
        if f == 'camera.json':
            continue
        p = os.path.join(render_dir, f)
        if not os.path.exists(p):
            bad.append('%s: %s missing' % (label, f))
        elif f.endswith('.json'):
            if visual_json(p) != visual_json(os.path.join(ref, f)):
                bad.append('%s: %s camera/height model differs from the approved reference' % (label, f))
        elif sh(p) != h:
            bad.append('%s: %s differs from the approved reference (pixels)' % (label, f))
compare(os.path.join(ROOT, 'data', 'holes', 'hole02', 'render'), 'committed render')
if '--render' in sys.argv:
    tmp = tempfile.mkdtemp()
    dst = os.path.join(tmp, 'v3')
    shutil.copytree(ROOT, dst, ignore=shutil.ignore_patterns('.git', 'prototype', '__pycache__'))
    shutil.copy2(os.path.join(ref, 'camera.json'), os.path.join(dst, 'data', 'holes', 'hole02', 'camera.json'))
    for f in os.listdir(os.path.join(dst, 'data', 'holes', 'hole02', 'render')):
        p = os.path.join(dst, 'data', 'holes', 'hole02', 'render', f)
        if os.path.isfile(p):
            os.remove(p)
    subprocess.run([sys.executable, os.path.join(dst, 'tools', 'render_flyover.py'), '--hole', '2'], check=True, cwd=dst, stdout=subprocess.DEVNULL)
    compare(os.path.join(dst, 'data', 'holes', 'hole02', 'render'), 'fresh re-render')
    shutil.rmtree(tmp)
print('\n'.join(bad) if bad else 'VISUAL BASELINE v%s: PASS%s' % (lock['version'], ' (fresh re-render byte-identical)' if '--render' in sys.argv else ''))
sys.exit(1 if bad else 0)
