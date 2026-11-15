"""Tool tests: python3 -I tests/test_tools.py  (standard library only)
1. standardize + check are reproducible (byte-identical outputs on a re-run).
2. Stable IDs survive a re-run.
3. A changed source file stops the build.
4. Manual files (status.json, verification.json) are never modified by the tools.
5. promote is append-only (v1 then v2; v1 untouched)."""
import hashlib, os, shutil, subprocess, sys, tempfile
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
def h(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
def run(cwd, *a): return subprocess.run([sys.executable, '-I', 'tools/pcv3.py', *a], cwd=cwd, capture_output=True, text=True)
tmp = tempfile.mkdtemp(); W = os.path.join(tmp, 'v3')
shutil.copytree(ROOT, W, ignore=shutil.ignore_patterns('.git'))
d = os.path.join(W, 'data', 'holes', 'hole02')
manual = {f: h(os.path.join(d, f)) for f in ('status.json', 'verification.json')}
gen = ['features.geojson', 'hole.json', 'ids.json', 'checks/check_report.md', 'checks/hole02_check.kml', 'checks/hole02_topdown.svg']
assert run(W, 'standardize', '--hole', '2').returncode == 0
assert run(W, 'check', '--hole', '2').returncode == 0
first = {f: h(os.path.join(d, f)) for f in gen}
assert run(W, 'standardize', '--hole', '2').returncode == 0 and run(W, 'check', '--hole', '2').returncode == 0
second = {f: h(os.path.join(d, f)) for f in gen}
diff = [f for f in gen if first[f] != second[f]]
assert not diff, 'not reproducible: %s' % diff
assert {f: h(os.path.join(d, f)) for f in manual} == manual, 'manual files changed'
r = run(W, 'promote', '--hole', '2', '--label', 't1'); assert r.returncode == 0, r.stderr
v1 = h(os.path.join(d, 'approved', 'v1', 'MANIFEST.json'))
assert run(W, 'promote', '--hole', '2', '--label', 't2').returncode == 0
assert os.path.isdir(os.path.join(d, 'approved', 'v2')) and h(os.path.join(d, 'approved', 'v1', 'MANIFEST.json')) == v1
with open(os.path.join(W, 'data', 'sources', 'pocaset-GEO.json'), 'a') as f: f.write(' ')
r = run(W, 'standardize', '--hole', '2'); assert r.returncode != 0 and 'STOP' in (r.stderr + r.stdout), 'tampered source not caught'
shutil.rmtree(tmp)
print('tool tests: all 5 passed')
