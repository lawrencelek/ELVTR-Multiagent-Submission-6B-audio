#!/usr/bin/env python3
"""Prototype 10 test-road report (GDD Edits 101–102): qa/baseline/p10_<n>.json -> qa/baseline/p10_<n>.md.
    python3 qa/testroad_report.py qa/baseline/p10_2.json qa/baseline/p10_2.md "Prototype 10.2: the first lesson"
10.1's report (p10_1.md) was written by this script's first version; its JSON has no 'mode' and reads as 'lesson'.
"""
import json, os, sys
from collections import defaultdict
from statistics import mean

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'qa', 'baseline', 'p10_2.json')
dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'qa', 'baseline', 'p10_2.md')
title = sys.argv[3] if len(sys.argv) > 3 else 'Prototype 10.2: the first lesson'
d = json.load(open(src))
runs = d['runs']
for r in runs: r.setdefault('mode', 'lesson')
MODES = list(dict.fromkeys(r['mode'] for r in runs))
POL = list(dict.fromkeys(r['policy'] for r in runs))
DESC = {'stand': "Stands on the north lane's line, road A", 'standSouth': "Stands on the south lane's line, road A",
        'standOff': "Stands 8 off the north lane's line (D105)", 'charge': 'Waits in the north lane; sprints head-on at each car, dashes in reach',
        'walkin': "Walks into the red car's path 110 ahead of it: late, from the side", 'wander': "P3's scripted walk",
        'aim': 'From the pavement, dashes at the nearest car within 150', 'flank': 'Comes alongside a moving car, dashes into its side',
        'jump': 'With Legs 1: runs at a passing car, jumps into it from close', 'dashjump': 'With Legs 1: dashes at a passing car, jumps out of the dash',
        'corner': "On foot: waits behind the building's corner; steps out at a road B car", 'kerb': 'Waits at the open kerb; dashes at a road A car in reach',
        'flankOpen': 'The flank bot from open pavement (no cover)', 'gap': "Waits behind the barrier at its gap; dashes through it",
        'plinth': "With Legs 1: jumps up on the plinth; dashes down from its edge"}
HOME_COVER = "aim, flank, jump and dashjump wait at (300, 410), behind the barrier: cover"
MODE_DESC = {'lesson': "from the build's start (10.2: rung 0, on foot; 10.3: rung 1, Battery 1 fitted); the lesson and the part as the build delivers them",
             'trained': "at the top rung from the start, Battery 1 fitted: the rung's own table"}
STAGE = str(d.get('stage', '10.1'))
if STAGE >= '10.3':  # rung 2: the open flank closes; cover and the raised edge stay
    CLOSED, OPEN_FOOT, OPEN_DASH = ['stand', 'standSouth', 'standOff', 'charge', 'kerb', 'flankOpen', 'walkin'], ['gap'], ['plinth']
    ESC_CLOSED, ESC_OPEN = ['kerb', 'flankOpen', 'walkin'], ['gap']
else:
    CLOSED, OPEN_FOOT, OPEN_DASH = ['stand', 'standSouth', 'standOff', 'charge'], ['walkin'], ['flank', 'aim']
    ESC_CLOSED, ESC_OPEN = ['stand', 'charge'], ['walkin']

def m(xs, nd=2):
    xs = [x for x in xs if x is not None]
    return round(mean(xs), nd) if xs else None

def f(x, nd=2):
    return '—' if x is None else f'{x:.{nd}f}'

def sel(mode, p): return [r for r in runs if r['mode'] == mode and r['policy'] == p]

out = []; w = out.append
w(f'# {title}')
w('')
w(f"- **Build:** `{d['build']}`, level `{d['level']}`, stage {d.get('stage', '10.1')}. Headless: `node qa/testroad.js --stage {d.get('stage', '10.1')} --out {os.path.relpath(src, ROOT)}`.")
w(f"- **Runs:** {len(POL)} bots × {len(MODES)} mode(s) × offsets {d['offsets']} s × {d['secs']} sim-seconds; escalation {d['esc']} s.")
for mo in MODES: w(f'- **Mode `{mo}`:** {MODE_DESC.get(mo, "")}.')
if STAGE >= '10.3': w(f'- **Cover:** {HOME_COVER}.')
w('- **The build\'s values:** ' + ', '.join(f'`{k}` {v}' for k, v in d['p10'].items()) + '.')
w('')
n = 1
for mo in MODES:
    w(f'## {n} Bots, mode `{mo}` (mean of offsets)'); n += 1
    w('')
    w('| Bot | What it does | Hits/min | Write-offs/min | First hit (s) | Damage a hit | Zones | Standstill touches | Cars a minute | Stalls / waits for the dummy over 20 s | Closest stop (needs ≥ reach) |')
    w('|---|---|---|---|---|---|---|---|---|---|---|')
    for p in POL:
        rs = sel(mo, p)
        if not rs: continue
        mins = [r['simSeconds'] / 60 for r in rs]
        z = defaultdict(int)
        for r in rs:
            for k, c in r['zones'].items(): z[k] += c
        gaps = [r['cars'].get('minStopGap') for r in rs if r['cars'].get('minStopGap') is not None]
        reach = rs[0]['cars'].get('reach')
        w(f"| {p} | {DESC.get(p, '')} | {f(m([r['hitsPerMin'] for r in rs]))} | {f(m([r['writeOffs'] / mm for r, mm in zip(rs, mins)]), 2)} | {f(m([r['firstHit'] for r in rs]), 1)} | {f(m([r['lost'] / r['hits'] if r['hits'] else None for r in rs]), 0)} | {', '.join(f'{k} {c}' for k, c in sorted(z.items(), key=lambda kv: -kv[1])) or '—'} | {sum(r.get('standstillTouches', 0) for r in rs)} | {f(m([r['cars']['appearances'] / mm for r, mm in zip(rs, mins)]), 1)} | {sum(r['cars']['stalls20s'] for r in rs)} / {sum(r['cars'].get('blocked20s', 0) for r in rs)} | {min(gaps) if gaps else '—'}{f' ({reach:.0f})' if reach else ''} |")
    w('')
if 'lesson' in MODES and any(r.get('lesson') is not None or r.get('dashAt') is not None for r in runs):
    w(f'## {n} The lesson (mode `lesson`)'); n += 1
    w('')
    w('| Bot | Offset | Lesson: hit at (s) | Zone | Rung at end | First brake (s) | First side stop (s) | Part fitted (s) | Hits a minute after the lesson | Damage after |')
    w('|---|---|---|---|---|---|---|---|---|---|')
    for r in runs:
        if r['mode'] != 'lesson': continue
        L, A = r.get('lesson'), r.get('afterLesson')
        parts = ', '.join(f"{q['node']} {q['t']}" for q in r.get('parts', [])) or (str(r['dashAt']) if r.get('dashAt') is not None else '—')
        w(f"| {r['policy']} | +{r['offset']} | {L['hitAt'] if L else '—'} | {L['zone'] if L else '—'} | {r.get('rungEnd', '—')} | {r.get('firstBrakeAt') if r.get('firstBrakeAt') is not None else '—'} | {r.get('firstSideAt') if r.get('firstSideAt') is not None else '—'} | {parts} | {f(A['hitsPerMin']) if A else '—'} | {A['lost'] if A else '—'} |")
    w('')
w(f'## {n} Behaviours (commits by cause; honks)'); n += 1
w('')
w('| Mode | Bot | Brake for the dummy | Stop for it beside the path | Pass | Return | Honks |')
w('|---|---|---|---|---|---|---|')
for mo in MODES:
    for p in POL:
        rs = sel(mo, p)
        if not rs: continue
        b = defaultdict(int)
        for r in rs:
            for k, c in (r.get('behaviours') or {}).items(): b[k] += c
        w(f"| {mo} | {p} | {b.get('body', 0)} | {b.get('side', 0)} | {b.get('pass', 0)} | {b.get('return', 0)} | {sum(r['cars']['honks'] for r in rs)} |")
w('')
w(f'## {n} Escalation (the same trick for longer, mode `lesson`)'); n += 1
w('')
w('| Bot | Hits by minute | Decay (`qa.esc.decay`) | Learning events |')
w('|---|---|---|---|')
for r in d['escalation']:
    w(f"| {r['policy']} | {' '.join(str(x) for x in r['windows'])} | {f(r.get('decay'))} | {r['learnEvents']} |")
w('')
w(f'## {n} Checks'); n += 1
w('')
allr = runs + d['escalation']
top = d['p10'].get('duel.topRung', 0)
esc = {r['policy']: r for r in d['escalation']}
tr = [r for r in runs if r['mode'] == 'trained']
checks = [
    ('The red car alone on the road', all(r['cars']['maxOnRoad'] <= 1 for r in allr), f"most on the road at once: {max(r['cars']['maxOnRoad'] for r in allr)}"),
    ('The car never stalls (no wait over 20 s without the dummy in its path)', all(r['cars']['stalls20s'] == 0 for r in allr), f"stalls: {sum(r['cars']['stalls20s'] for r in allr)}; waits for a dummy in its path: {sum(r['cars'].get('blocked20s', 0) for r in allr)}"),
    (f'At most {top} lesson(s) a run; never past duel.topRung', all(r['learnEvents'] <= top and r.get('rungEnd', 0) <= top for r in allr), f"most lessons in a run: {max(r['learnEvents'] for r in allr)}"),
]
stops = [r for r in tr if r['policy'] in ('stand', 'standSouth', 'standOff') and r['cars'].get('minStopGap') is not None]
if top == 1:
    nose = [r for r in runs if r['mode'] == 'lesson' and any(k in ('front', 'frontDiagonal') for k in r['zones'])]
    checks += [('A hit on the nose teaches rung 1', all(r.get('lesson') for r in nose), f"{sum(1 for r in nose if r.get('lesson'))} of {len(nose)} runs with a nose hit had a lesson")]
if top >= 2:
    hit1 = [r for r in runs if r['mode'] == 'lesson' and any(k != 'rear' for k in r['zones'])]
    checks += [('A hit at rung 1 (any but a tail bump) teaches rung 2', all(r.get('lesson') for r in hit1), f"{sum(1 for r in hit1 if r.get('lesson'))} of {len(hit1)} runs with such a hit had a lesson")]
if top >= 1:
    checks += [
        (f'Rung {top} closes: ' + ', '.join(CLOSED) + ' score 0', all(r['hits'] == 0 for r in tr if r['policy'] in CLOSED), ', '.join(f"{p} {sum(r['hits'] for r in tr if r['policy'] == p)}" for p in CLOSED)),
        ('It stops beyond dash reach for a dummy standing ahead', all(r['cars']['minStopGap'] >= r['cars']['reach'] for r in stops), f"closest stop {min(r['cars']['minStopGap'] for r in stops)} (reach {tr[0]['cars']['reach']:.0f})" if stops else 'no stops'),
        ('An opening without the new part still lands (pillar 1, D97)', all(r['hits'] > 0 for r in tr if r['policy'] in OPEN_FOOT), ', '.join(f"{p} {m([r['hitsPerMin'] for r in tr if r['policy'] == p])}/min" for p in OPEN_FOOT)),
        ('The opening the new part unlocks lands', all(r['hits'] > 0 for r in tr if r['policy'] in OPEN_DASH), ', '.join(f"{p} {m([r['hitsPerMin'] for r in tr if r['policy'] == p])}/min" for p in OPEN_DASH)),
    ]
if top == 1:
    checks += [
        ('The dash arrives at the first brake', all(r.get('dashAt') is not None and r['dashAt'] - r['firstBrakeAt'] < 5 for r in runs if r['mode'] == 'lesson' and r.get('firstBrakeAt') is not None), f"brake to dash: {', '.join(sorted(set(str(round(r['dashAt'] - r['firstBrakeAt'], 1)) for r in runs if r['mode'] == 'lesson' and r.get('firstBrakeAt') is not None and r.get('dashAt') is not None)))} s"),
        ('A new behaviour: it brakes for the dummy (none at rung 0)', all((r.get('behaviours') or {}).get('body', 0) > 0 for r in tr if r['policy'] in CLOSED), f"brakes in trained closed runs: {sum((r.get('behaviours') or {}).get('body', 0) for r in tr if r['policy'] in CLOSED)}"),
    ]
if top >= 2:
    leg = [r for r in runs if r['mode'] == 'lesson' and r.get('firstSideAt') is not None]
    gap = lambda r: next((q['t'] for q in r.get('parts', []) if q['node'] == 'legs1'), None)
    checks += [
        ('Legs 1 arrives at the first side stop', all(gap(r) is not None and gap(r) - r['firstSideAt'] < 5 for r in leg), f"side stop to Legs 1: {', '.join(sorted(set(str(round(gap(r) - r['firstSideAt'], 1)) for r in leg if gap(r) is not None)))} s"),
        ('A new behaviour: it stops for a dummy beside its path (none at rung 1)', sum((r.get('behaviours') or {}).get('side', 0) for r in tr if r['policy'] in CLOSED) > 0, f"side stops in trained closed runs: {sum((r.get('behaviours') or {}).get('side', 0) for r in tr if r['policy'] in CLOSED)}"),
    ]
if top >= 1:
    checks += [
        ('Escalation: the closed trick decays below 0.5', all(esc[p]['decay'] is not None and esc[p]['decay'] < 0.5 for p in ESC_CLOSED if p in esc), ', '.join(f"{p} {esc[p]['decay']}" for p in ESC_CLOSED if p in esc)),
        ('Escalation: the opening holds (no stalemate)', all(esc[p]['decay'] is not None and esc[p]['decay'] >= 0.5 for p in ESC_OPEN if p in esc), ', '.join(f"{p} {esc[p]['decay']}" for p in ESC_OPEN + ['plinth', 'aim'] if p in esc)),
    ]
w('| Check | Result | Evidence |')
w('|---|---|---|')
for name, ok, ev in checks: w(f"| {name} | {'PASS' if ok else 'FAIL'} | {ev} |")
w('')
open(dst, 'w').write('\n'.join(out) + '\n')
print('wrote', dst, '·', sum(1 for c in checks if c[1]), '/', len(checks), 'checks pass')
