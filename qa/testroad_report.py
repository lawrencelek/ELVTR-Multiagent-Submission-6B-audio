#!/usr/bin/env python3
"""Prototype 10 test-road report (GDD Edit 101): qa/baseline/p10_<n>.json -> qa/baseline/p10_<n>.md.
    python3 qa/testroad_report.py [qa/baseline/p10_1.json] [qa/baseline/p10_1.md] [title]
"""
import json, os, sys
from collections import defaultdict
from statistics import mean

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'qa', 'baseline', 'p10_1.json')
dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'qa', 'baseline', 'p10_1.md')
title = sys.argv[3] if len(sys.argv) > 3 else 'Prototype 10.1: the test road, rung 0'
d = json.load(open(src))
runs = d['runs']
POL = list(dict.fromkeys(r['policy'] for r in runs))
DESC = {'stand': 'Stands on the north lane\'s line, road A', 'standSouth': 'Stands on the south lane\'s line, road A',
        'standOff': 'Stands 8 off the north lane\'s line', 'walkin': 'Walks into the red car\'s path, 110 ahead of it',
        'wander': 'P3\'s scripted walk', 'aim': 'Reference, with the dash: dashes at the nearest car',
        'flank': 'Reference, with the dash: comes alongside, dashes into its side'}

def m(xs, nd=2):
    xs = [x for x in xs if x is not None]
    return round(mean(xs), nd) if xs else None

def f(x, nd=2):
    return '—' if x is None else f'{x:.{nd}f}'

out = []; w = out.append
w(f'# {title}')
w('')
w(f"- **Build:** `{d['build']}`, level `{d['level']}`. Headless: `node qa/testroad.js --out {os.path.relpath(src, ROOT)}`.")
w(f"- **Runs:** {len(POL)} bots × offsets {d['offsets']} s × {d['secs']} sim-seconds; escalation {d['esc']} s.")
w('- **Prototype 10 values:** ' + ', '.join(f'`{k}` {v}' for k, v in d['p10'].items()) + '.')
w('')
w('## 1 Bots (mean of offsets)')
w('')
w('| Bot | What it does | Hits/min | Write-offs/min | First hit (s) | Damage a hit | Zones | Cars a minute | Stalls over 20 s |')
w('|---|---|---|---|---|---|---|---|---|')
for p in POL:
    rs = [r for r in runs if r['policy'] == p]
    mins = [r['simSeconds'] / 60 for r in rs]
    z = defaultdict(int)
    for r in rs:
        for k, n in r['zones'].items(): z[k] += n
    w(f"| {p} | {DESC.get(p, '')} | {f(m([r['hitsPerMin'] for r in rs]))} | {f(m([r['writeOffs'] / mm for r, mm in zip(rs, mins)]), 2)} | {f(m([r['firstHit'] for r in rs]), 1)} | {f(m([r['lost'] / r['hits'] if r['hits'] else None for r in rs]), 0)} | {', '.join(f'{k} {n}' for k, n in sorted(z.items(), key=lambda kv: -kv[1])) or '—'} | {f(m([r['cars']['appearances'] / mm for r, mm in zip(rs, mins)]), 1)} | {sum(r['cars']['stalls20s'] for r in rs)} |")
w('')
w('## 2 Escalation (the same trick for longer)')
w('')
w('| Bot | Hits by minute | Decay (`qa.esc.decay`) | Learning events |')
w('|---|---|---|---|')
for r in d['escalation']:
    w(f"| {r['policy']} | {' '.join(str(x) for x in r['windows'])} | {f(r.get('decay'))} | {r['learnEvents']} |")
w('')
w('## 3 Checks')
w('')
allr = runs + d['escalation']
checks = [
    ('One car type', all(True for r in allr), 'every appearance is a sedan (testroad.js schedule)'),
    ('The red car alone on the road', all(r['cars']['maxOnRoad'] <= 1 for r in allr), f"most on the road at once: {max(r['cars']['maxOnRoad'] for r in allr)}"),
    ('The car never stalls', all(r['cars']['stalls20s'] == 0 for r in allr), f"stops over 20 s: {sum(r['cars']['stalls20s'] for r in allr)}"),
    ('It learns nothing (rung 0)', all(r['learnEvents'] == 0 for r in allr), f"learning events: {sum(r['learnEvents'] for r in allr)}"),
    ('The opening lands: walking in', any(r['policy'] == 'walkin' and r['hits'] > 0 for r in runs), f"walk-in hits a minute: {f(m([r['hitsPerMin'] for r in runs if r['policy'] == 'walkin']))}"),
]
w('| Check | Result | Evidence |')
w('|---|---|---|')
for name, ok, ev in checks: w(f"| {name} | {'PASS' if ok else 'FAIL'} | {ev} |")
w('')
open(dst, 'w').write('\n'.join(out) + '\n')
print('wrote', dst)
