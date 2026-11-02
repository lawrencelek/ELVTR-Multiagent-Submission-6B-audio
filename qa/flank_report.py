#!/usr/bin/env python3
"""Prototype 10.0-v3 report (handover v2 §13): qa/baseline/p9_flank.json -> qa/baseline/p9_flank.md.

How cars sense a dummy at their side, and how hard the flank is to approach, in four driver variants.
    python3 qa/flank_report.py [json] [md]
"""
import json, os, sys
from collections import defaultdict
from statistics import mean

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'qa', 'baseline', 'p9_flank.json')
dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'qa', 'baseline', 'p9_flank.md')
d = json.load(open(src))
runs = [r for r in d['runs'] if r and 'dashes' in r]
VAR = list(d['variants'].keys())
DESC = {'built': 'Prototype 9: driver\'s field `proto.driver.cautionZone` 180, slows to `proto.driver.cautionSpeed` 82',
        'rowFortyFive': 'The row 45 reach: `proto.driver.cautionZone` 100',
        'blind': 'No side awareness: `proto.driver.cautionZone` 0',
        'wary': 'A stronger flank response: `proto.driver.cautionSpeed` 41 (half)'}

def m(xs, nd=2):
    xs = [x for x in xs if x is not None]
    return round(mean(xs), nd) if xs else None

def f(x, nd=2):
    return '—' if x is None else f'{x:.{nd}f}'

out = []; w = out.append
w('# Prototype 10.0-v3: side sensing and the flank (Prototype 9)')
w('')
w('- **Question (Lawrence, 2 November):** the early side sensor may be missing. Is the flank too easy, or too hard, to approach?')
w(f"- **Method:** `qa/flank.js`. Arcade, Endless; {len(set(r['sim'] for r in runs))} districts × {len(VAR)} variants × 2 bots × offsets {d['offsets']} s; {d['secs']} sim-seconds a run. {len(runs)} runs.")
w('- **Bots:** `aim` dashes at the nearest car (10.0\'s read and lunge). `flank` comes alongside a moving car, 70 units off its side, and dashes into it.')
w('- **Variants** are runtime values on every screen\'s traffic sim. Build unchanged.')
w('')
for v in VAR: w(f'- `{v}`: {DESC.get(v, json.dumps(d["variants"][v]))}.')
w('')
w('## 1 Results by variant (mean of districts and offsets)')
w('')
w('| Variant | Bot | Dashes/min | Dashes that land | Hits/min | First hit (s) | Points/hit | Caution entries/min |')
w('|---|---|---|---|---|---|---|---|')
by = defaultdict(list)
for r in runs: by[(r['variant'], r['policy'])].append(r)
for v in VAR:
    for p in ['aim', 'flank']:
        rs = by[(v, p)]
        if not rs: continue
        mins = [r['simSeconds'] / 60 for r in rs]
        w(f"| {v} | {p} | {f(m([r['dashes'] / mm for r, mm in zip(rs, mins)]), 1)} | {f(m([r['landed'] / r['dashes'] if r['dashes'] else None for r in rs]))} | {f(m([r['hitsPerMin'] for r in rs]), 1)} | {f(m([r['firstHit'] for r in rs]), 1)} | {f(m([r['points'] / r['hits'] if r['hits'] else None for r in rs]), 0)} | {f(m([r['cautionEntries'] / mm for r, mm in zip(rs, mins)]), 1)} |")
w('')
w('- "Dashes that land": share of dashes followed by a damaging hit within 0.6 s.')
w('- Points a hit include write-off bonuses; compare across variants, not with 10.0.')
w('')
w('## 2 Where the dummy stood when it dashed (flank bot)')
w('')
w('| Variant | Front | Diagonal | Side | Rear |')
w('|---|---|---|---|---|')
for v in VAR:
    agg = defaultdict(lambda: [0, 0])
    for r in by[(v, 'flank')]:
        for k, q in r['bySector'].items(): agg[k][0] += q['dashes']; agg[k][1] += q['landed']
    cells = []
    for k in ['front', 'diagonal', 'side', 'rear']:
        a, l = agg[k]
        cells.append('—' if not a else f'{l}/{a} ({l / a:.0%})')
    w(f"| {v} | " + ' | '.join(cells) + ' |')
w('')
w('- Sector: the angle from the car\'s heading to the dummy: front under 30°, diagonal 30–60°, side 60–120°, rear over 120°.')
w('')
w('## 3 By district (flank bot, dashes that land)')
w('')
sims = list(dict.fromkeys(r['sim'] for r in runs))
w('| District | ' + ' | '.join(VAR) + ' |')
w('|---|' + '---|' * len(VAR))
for s_ in sims:
    row = []
    for v in VAR:
        rs = [r for r in by[(v, 'flank')] if r['sim'] == s_]
        row.append(f(m([r['landed'] / r['dashes'] if r['dashes'] else None for r in rs])))
    w(f'| {s_} | ' + ' | '.join(row) + ' |')
w('')
w('## 4 How the hits landed (flank bot)')
w('')
w('| Variant | Zones | Car state at impact |')
w('|---|---|---|')
for v in VAR:
    z, st = defaultdict(int), defaultdict(int)
    for r in by[(v, 'flank')]:
        for k, n in r['zones'].items(): z[k] += n
        for k, n in r['carStates'].items(): st[k] += n
    w(f"| {v} | {', '.join(f'{k} {n}' for k, n in sorted(z.items(), key=lambda kv: -kv[1]))} | {', '.join(f'{k} {n}' for k, n in sorted(st.items(), key=lambda kv: -kv[1]))} |")
w('')
open(dst, 'w').write('\n'.join(out) + '\n')
print('wrote', dst)
