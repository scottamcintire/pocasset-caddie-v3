#!/usr/bin/env python3
"""Central scorecard checks: data/scorecard/pocasset_scorecard.json
- owner's newer Green/Blue figures exactly as supplied (16 Nov 2026), labelled provisional, totals 5,986 / 6,301
- original card preserved and identical to production V2.3.1's tees table (read-only local copy)
- par 72, 18 holes everywhere, handicaps 1-18 once each, every listed difference is real."""
import json, os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sc = json.load(open(os.path.join(ROOT, 'data', 'scorecard', 'pocasset_scorecard.json')))
PROD = os.environ.get('PROD_V231', '/home/claude/pocasset_caddie/index.html')
fails = []
def check(ok, msg):
    print(('PASS ' if ok else 'FAIL ') + msg)
    if not ok: fails.append(msg)
owner = {'Green': [469, 368, 147, 326, 337, 167, 345, 366, 469, 344, 380, 112, 308, 361, 132, 477, 489, 389],
         'Blue': [470, 424, 162, 337, 345, 187, 376, 383, 490, 362, 392, 125, 295, 381, 152, 496, 520, 404]}
par = [5, 4, 3, 4, 4, 3, 4, 4, 5, 4, 4, 3, 4, 4, 3, 5, 5, 4]
check(sc['par'] == par and sum(sc['par']) == 72, 'par 72, same as the owner list')
check(sorted(sc['handicap']) == list(range(1, 19)), 'handicaps 1-18 once each')
for t, y in owner.items():
    e = sc['provisional']['tees'][t]
    check(e['yards'] == y, '%s provisional yardages exactly as supplied' % t)
    check(sum(y) == e['total'] == {'Green': 5986, 'Blue': 6301}[t], '%s provisional total %d' % (t, e['total']))
    check(sc['display']['use'][t] == 'provisional', '%s displayed as provisional' % t)
check('PROVISIONAL' in sc['provisional']['label'] and 'not found' in sc['provisional']['source'], 'provisional label and source recorded')
s = open(PROD).read(); m = re.search(r'const tees=(\{.*?\});', s)
prod = json.loads(re.sub(r'(\w+):\[', r'"\1":[', m.group(1)))
for t, e in sc['original']['tees'].items():
    check(e['yards'] == prod[t] and sum(e['yards']) == e['total'] and len(e['yards']) == 18, 'original %s card preserved = V2.3.1 (%d yd)' % (t, e['total']))
check(sc['original']['tees']['Green']['total'] == 6015 and sc['original']['tees']['Blue']['total'] == 6318, 'published Green 6,015 / Blue 6,318')
for d in sc['provisional']['differences_from_original']:
    check(sc['original']['tees'][d['tee']]['yards'][d['hole'] - 1] == d['original'] and owner[d['tee']][d['hole'] - 1] == d['provisional'], 'difference H%d %s %d -> %d' % (d['hole'], d['tee'], d['original'], d['provisional']))
n = sum(1 for t in owner for i in range(18) if owner[t][i] != prod[t][i])
check(n == len(sc['provisional']['differences_from_original']), 'all %d differences listed' % n)
check(all(src.get('publication_date') for src in sc['original']['sources']), 'each source has a publication-date field')
print('RESULT', 'PASS' if not fails else 'FAIL (%d)' % len(fails)); sys.exit(1 if fails else 0)
