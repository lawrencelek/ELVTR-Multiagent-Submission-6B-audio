#!/usr/bin/env python3
"""Prototype 10 test-road report (GDD Edits 101–107): qa/baseline/p10_<n>.json -> qa/baseline/p10_<n>.md.
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
        'plinth': "With Legs 1: jumps up on the plinth; dashes down from its edge",
        'conebait': "The gap until Hands 1; then lays a cone ahead of the car waiting for it, steps out of its field, strikes as it swerves round the cone",
        'lurk': "Waits past every field's edge, south-east; sprints in as a car passes in road A's south lane, dashes before the field notices",
        'planter': "The cone bait until DUCK; then ducks behind the planter row south of road A, east, and springs over it at a passing car",
        'standplanter': "The same spot behind the planter row, standing",
        'roam': "DUCK behind a planter row, at the nearest spot for the car's road that it does not remember (it reads the red rings); springs at a passing car"}
HOME_COVER = "aim, flank, jump and dashjump wait at (300, 410), behind the barrier: cover"
MODE_DESC = {'lesson': "from the build's start (10.2: rung 0, on foot; 10.3: rung 1, Battery 1 fitted; 10.5: rung 3, Battery 1 and Legs 1 fitted); the lesson and the part as the build delivers them",
             'trained': "at the top rung from the start, every part its rungs bring fitted: the rung's own table"}
STAGE = str(d.get('stage', '10.1'))
if STAGE >= '10.7':  # rung 6: the same spot closes; any other spot stays, and the sprint from beyond the field
    CLOSED, OPEN_FOOT, OPEN_DASH = ['stand', 'standSouth', 'standOff', 'charge', 'kerb', 'flankOpen', 'walkin', 'corner', 'gap', 'plinth', 'conebait', 'standplanter'], ['lurk'], ['roam']
    COVER = ['gap', 'aim', 'flank', 'jump', 'dashjump']
    ESC_CLOSED, ESC_OPEN = ['planter'], ['roam']
    HOME_COVER += "; conebait starts at the gap (188, 414); planter and standplanter use one spot behind the planter row south of road A, east (590, 418); roam uses nine spots behind the three rows; lurk waits at (660, 576)"
elif STAGE >= '10.6':  # rung 5: the cone bait closes; DUCK behind a planter and the sprint from beyond the field stay
    CLOSED, OPEN_FOOT, OPEN_DASH = ['stand', 'standSouth', 'standOff', 'charge', 'kerb', 'flankOpen', 'walkin', 'corner', 'gap', 'plinth', 'conebait', 'standplanter'], ['lurk'], ['planter']
    COVER = ['gap', 'aim', 'flank', 'jump', 'dashjump']
    ESC_CLOSED, ESC_OPEN = ['conebait'], ['planter']
    HOME_COVER += "; conebait and planter start at the gap (188, 414); planter and standplanter use the spot behind the planter row south of road A, east (590, 418); lurk waits at (660, 576)"
elif STAGE >= '10.5':  # rung 4: cover closes; the cone's swerve and the sprint from beyond the field stay
    CLOSED, OPEN_FOOT, OPEN_DASH = ['stand', 'standSouth', 'standOff', 'charge', 'kerb', 'flankOpen', 'walkin', 'corner', 'gap', 'plinth', 'aim'], ['lurk'], ['conebait']
    COVER = ['gap', 'aim', 'flank', 'jump', 'dashjump']  # every bot that waits behind the barrier
    ESC_CLOSED, ESC_OPEN = ['gap', 'jump'], ['conebait']  # lurk decays by the dummy's own leg damage (its dash shortens), not the car: noted under the escalation table
    HOME_COVER += "; conebait starts at the gap (188, 414); lurk waits at (660, 576), past every field's edge"
elif STAGE >= '10.4':  # rung 3: the plinth and the jump close; cover stays
    CLOSED, OPEN_FOOT, OPEN_DASH = ['stand', 'standSouth', 'standOff', 'charge', 'kerb', 'flankOpen', 'walkin', 'corner'], ['gap'], []  # the plinth and the jump: by decay, below
    ESC_CLOSED, ESC_OPEN = ['plinth', 'dashjump'], ['gap', 'jump']  # the jump bot waits behind the barrier: cover
elif STAGE >= '10.3':  # rung 2: the open flank closes; cover and the raised edge stay
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
if STAGE >= '10.7': w('- **Parts:** Battery 1, Legs 1, Hands 1 and DUCK fitted from the start. No new part. Every crash leaves an outline; from rung 6 the car remembers the latest `duel.memorySites` spots.')
elif STAGE >= '10.6': w('- **Parts:** Battery 1, Legs 1 and Hands 1 fitted from the start; DUCK by drone at the first stop at a cone. Three low planter rows by the road.')
elif STAGE >= '10.5': w('- **Parts:** Battery 1 and Legs 1 fitted from the start; Hands 1, the cones, by drone at the first stop for a dummy behind cover.')
elif STAGE >= '10.4': w('- **No new part:** Battery 1 and Legs 1 are fitted from the start.')
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
    w('| Bot | Offset | Lesson: hit at (s) | Zone | Rung at end | First brake (s) | First side stop (s) | ' + ('First stop behind cover (s) | ' if STAGE >= '10.5' else '') + 'Part fitted (s) | Hits a minute after the lesson | Damage after |')
    w('|---|---|---|---|---|---|---|---|---|---|' + ('---|' if STAGE >= '10.5' else ''))
    for r in runs:
        if r['mode'] != 'lesson': continue
        L, A = r.get('lesson'), r.get('afterLesson')
        parts = ', '.join(f"{q['node']} {q['t']}" for q in r.get('parts', [])) or (str(r['dashAt']) if r.get('dashAt') is not None else '—')
        w(f"| {r['policy']} | +{r['offset']} | {L['hitAt'] if L else '—'} | {L['zone'] if L else '—'} | {r.get('rungEnd', '—')} | {r.get('firstBrakeAt') if r.get('firstBrakeAt') is not None else '—'} | {r.get('firstSideAt') if r.get('firstSideAt') is not None else '—'} | {(str(r['firstCoverAt']) if r.get('firstCoverAt') is not None else '—') + ' | ' if STAGE >= '10.5' else ''}{parts} | {f(A['hitsPerMin']) if A else '—'} | {A['lost'] if A else '—'} |")
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
esc_pol = [r['policy'] for r in d['escalation']]
w('')
w('| Bot | Hits by minute | Decay (`qa.esc.decay`) | Learning events |')
w('|---|---|---|---|')
for r in d['escalation']:
    w(f"| {r['policy']} | {' '.join(str(x) for x in r['windows'])} | {f(r.get('decay'))} | {r['learnEvents']} |")
w('')
if STAGE >= '10.5' and 'lurk' in esc_pol and 'lurk' not in ESC_OPEN: w("- **lurk decays by the dummy's own damage, not the car.** Each hit lands on a leg; the dash shortens with leg damage (164 to 116 after four hits), below what the sprint from past the field needs. " + ("Its repeated spot also teaches rung 6.\n" if STAGE >= '10.7' else "The car stays at rung 3 throughout.\n"))
if STAGE >= '10.7':  # row 703 (D117): the shorter run-in and the lighter body
    w(f'## {n} Pace (row 703; D117)'); n += 1
    w('')
    pace = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else None
    w('| Way in | Mode | Hits a minute | Damage a hit | Seconds a write-off | Cars a minute |')
    w('|---|---|---|---|---|---|')
    rows = [(p, mo, sel(mo, p)) for mo in MODES for p in ('roam', 'planter', 'lurk')]
    if pace: rows.append(('planter, no memory (`duel.topRung` 5)', 'lesson', [r for r in pace['runs'] if r['policy'] == 'planter']))
    for p, mo, rs in rows:
        if not rs: continue
        mins = [r['simSeconds'] / 60 for r in rs]; wo = sum(r['writeOffs'] for r in rs); secs = sum(r['simSeconds'] for r in rs)
        w(f"| {p} | {mo} | {f(m([r['hitsPerMin'] for r in rs]))} | {f(m([r['lost'] / r['hits'] if r['hits'] else None for r in rs]), 0)} | {f(secs / wo, 0) if wo else '—'} | {f(m([r['cars']['appearances'] / mm for r, mm in zip(rs, mins)]), 1)} |")
    w('')
    w('- **GDD target:** at most 80 s a write-off (Edit 18 §10.2); 100 s in a five-minute visit. 10.6\'s planter ambush: 148 s (`qa/baseline/p10_6.md`).')
    w(f"- **Values:** `duel.runInLength` {d['p10'].get('duel.runInLength')}, `duel.redReturnSeconds` {d['p10'].get('duel.redReturnSeconds')}, `proto.health.standard` {d['p10'].get('proto.health.standard')}. Cars that appeared slowed for a dummy they already sensed: {sum(r.get('spawnSlow', 0) for r in runs)} in {sum(r['cars']['appearances'] for r in runs)}.")
    w('')
w(f'## {n} Checks'); n += 1
w('')
allr = runs + d['escalation']
top = d['p10'].get('duel.topRung', 0)
esc = {r['policy']: r for r in d['escalation']}
tr = [r for r in runs if r['mode'] == 'trained']
checks = [
    ('The red car alone on the road', all(r['cars']['maxOnRoad'] <= 1 for r in allr), f"most on the road at once: {max(r['cars']['maxOnRoad'] for r in allr)}"),
    ('The car never stalls (no wait over 20 s without the dummy, or a cone, in its way)', all(r['cars']['stalls20s'] == 0 for r in allr), f"stalls: {sum(r['cars']['stalls20s'] for r in allr)}; waits for the dummy or its cone: {sum(r['cars'].get('blocked20s', 0) for r in allr)}"),
    (f'At most {top} lesson(s) a run; never past duel.topRung', all(r['learnEvents'] <= top and r.get('rungEnd', 0) <= top for r in allr), f"most lessons in a run: {max(r['learnEvents'] for r in allr)}"),
]
stops = [r for r in tr if r['policy'] in ('stand', 'standSouth', 'standOff') and r['cars'].get('minStopGap') is not None]
if top == 1:
    nose = [r for r in runs if r['mode'] == 'lesson' and any(k in ('front', 'frontDiagonal') for k in r['zones'])]
    checks += [('A hit on the nose teaches rung 1', all(r.get('lesson') for r in nose), f"{sum(1 for r in nose if r.get('lesson'))} of {len(nose)} runs with a nose hit had a lesson")]
if top == 2:
    hit1 = [r for r in runs if r['mode'] == 'lesson' and any(k != 'rear' for k in r['zones'])]
    checks += [('A hit at rung 1 (any but a tail bump) teaches rung 2', all(r.get('lesson') for r in hit1), f"{sum(1 for r in hit1 if r.get('lesson'))} of {len(hit1)} runs with such a hit had a lesson")]
if top >= 1:
    checks += [
        (f'Rung {top} closes: ' + ', '.join(CLOSED) + ' score 0', all(r['hits'] == 0 for r in tr if r['policy'] in CLOSED), ', '.join(f"{p} {sum(r['hits'] for r in tr if r['policy'] == p)}" for p in CLOSED)),
        ('It stops beyond dash reach for a dummy standing ahead', all(r['cars']['minStopGap'] >= r['cars']['reach'] for r in stops), f"closest stop {min(r['cars']['minStopGap'] for r in stops)} (reach {tr[0]['cars']['reach']:.0f})" if stops else 'no stops'),
        ('An opening without the new part still lands (pillar 1, D97)', all(r['hits'] > 0 for r in tr if r['policy'] in OPEN_FOOT), ', '.join(f"{p} {m([r['hitsPerMin'] for r in tr if r['policy'] == p])}/min" for p in OPEN_FOOT)),
        ('Any other spot still lands' if top >= 6 else 'The opening the new part unlocks lands', all(r['hits'] > 0 for r in tr if r['policy'] in OPEN_DASH) if OPEN_DASH else True, (', '.join(f"{p} {m([r['hitsPerMin'] for r in tr if r['policy'] == p])}/min" for p in OPEN_DASH) or 'no new part in this test')),
    ]
if top == 1:
    checks += [
        ('The dash arrives at the first brake', all(r.get('dashAt') is not None and r['dashAt'] - r['firstBrakeAt'] < 5 for r in runs if r['mode'] == 'lesson' and r.get('firstBrakeAt') is not None), f"brake to dash: {', '.join(sorted(set(str(round(r['dashAt'] - r['firstBrakeAt'], 1)) for r in runs if r['mode'] == 'lesson' and r.get('firstBrakeAt') is not None and r.get('dashAt') is not None)))} s"),
        ('A new behaviour: it brakes for the dummy (none at rung 0)', all((r.get('behaviours') or {}).get('body', 0) > 0 for r in tr if r['policy'] in CLOSED), f"brakes in trained closed runs: {sum((r.get('behaviours') or {}).get('body', 0) for r in tr if r['policy'] in CLOSED)}"),
    ]
if top == 3:
    les = [r for r in runs if r['mode'] == 'lesson']
    if all('heightHid' in r for r in les):  # row 685 (D113): height hid the dummy, not cover
        hid = [r for r in les if r['heightHid'] > 0]
        cover = [r for r in les if r['hits'] > 0 and not r['heightHid']]
        checks += [('Only a hit where height hid the dummy teaches rung 3 (from above, in sight past cover for the whole clip)', all(r.get('lesson') for r in hid) and not any(r.get('lesson') for r in cover), f"lessons: {sum(1 for r in hid if r.get('lesson'))} of {len(hid)} runs with such a hit; {sum(1 for r in cover if r.get('lesson'))} of {len(cover)} runs with only hits from cover or on the ground (jumps from cover: {sum(r['above'] for r in cover)})")]
    else:  # 10.4 as first built (row 679): any hit from above
        above = [r for r in les if r['kinds'].get('jump', 0) > 0]
        cover = [r for r in les if r['hits'] > 0 and not r['kinds'].get('jump', 0) and r['policy'] in ('gap', 'dashjump', 'aim', 'flank')]
        checks += [('Only a hit from above teaches rung 3 (a jump, or a dash from the plinth)', all(r.get('lesson') for r in above) and not any(r.get('lesson') for r in cover), f"lessons: {sum(1 for r in above if r.get('lesson'))} of {len(above)} runs with a jump's hit; {sum(1 for r in cover if r.get('lesson'))} of {len(cover)} runs with only dashes or strikes from cover")]
    checks += [
               ('Rung 3 closes the plinth: one hit at most in 5 minutes (a landing inside the notice window)', all(r['hits'] <= 1 for r in tr if r['policy'] == 'plinth'), 'plinth ' + ', '.join(str(r['hits']) for r in tr if r['policy'] == 'plinth') + ' hits in 300 s'),
               ('A new behaviour: it stops for a dummy up on the plinth (none at rung 2)', sum((r.get('behaviours') or {}).get('side', 0) for r in tr if r['policy'] == 'plinth') > 0, f"side stops in trained plinth runs: {sum((r.get('behaviours') or {}).get('side', 0) for r in tr if r['policy'] == 'plinth')}")]
if top == 4:
    les = [r for r in runs if r['mode'] == 'lesson']
    hid = [r for r in les if r.get('coverHits', 0) > 0]
    other = [r for r in les if r['hits'] > 0 and not r.get('coverHits', 0)]
    hands = lambda r: next((q['t'] for q in r.get('parts', []) if q['node'] == 'hands1'), None)
    stops = [r for r in les if r.get('firstCoverAt') is not None]
    checks += [
        ('Only a hit where cover hid the dummy teaches rung 4 (out of cover within the clip)', all(r.get('lesson') for r in hid) and not any(r.get('lesson') for r in other), f"lessons: {sum(1 for r in hid if r.get('lesson'))} of {len(hid)} runs with such a hit; {sum(1 for r in other if r.get('lesson'))} of {len(other)} runs with only hits from the open"),
        ('Rung 4 closes cover: ' + ', '.join(COVER) + ': at most one hit in 15 minutes each', all(sum(r['hits'] for r in tr if r['policy'] == p) <= 1 for p in COVER), ', '.join(f"{p} {sum(r['hits'] for r in tr if r['policy'] == p)}" for p in COVER)),
        ('Hands 1 arrives at the first stop for a dummy behind cover', bool(stops) and all(hands(r) is not None and hands(r) - r['firstCoverAt'] < 5 for r in stops), f"stop to Hands 1: {', '.join(sorted(set(str(round(hands(r) - r['firstCoverAt'], 1)) for r in stops if hands(r) is not None)))} s in {len(stops)} runs"),
        ('A new behaviour: it stops for a dummy only its cameras see (none at rung 3)', sum(1 for r in tr if r.get('firstCoverAt') is not None) > 0, f"trained runs with such a stop: {sum(1 for r in tr if r.get('firstCoverAt') is not None)} of {len(tr)}"),
    ]
if top == 5:
    les = [r for r in runs if r['mode'] == 'lesson']
    coned = [r for r in les if r.get('conedHits', 0) > 0]
    other = [r for r in les if r['hits'] > 0 and not r.get('conedHits', 0)]
    duck = lambda r: next((q['t'] for q in r.get('parts', []) if q['node'] == 'duck1'), None)
    stops = [r for r in les if r.get('firstItemAt') is not None]
    pl, sp = [r for r in tr if r['policy'] == 'planter'], [r for r in tr if r['policy'] == 'standplanter']
    checks += [
        ('Only a hit while it swerved round a cone teaches rung 5', all(r.get('lesson') for r in coned) and not any(r.get('lesson') for r in other), f"lessons: {sum(1 for r in coned if r.get('lesson'))} of {len(coned)} runs with such a hit; {sum(1 for r in other if r.get('lesson'))} of {len(other)} runs with only other hits"),
        ('A new behaviour: rung 5 stops at a cone and never swerves round it', sum(r.get('coneSwerves', 0) for r in tr) == 0 and sum(r.get('coneStops', 0) for r in tr) > 0, f"trained: {sum(r.get('coneStops', 0) for r in tr)} stops at a cone, {sum(r.get('coneSwerves', 0) for r in tr)} swerves round one"),
        ('DUCK arrives at the first stop at a cone', bool(stops) and all(duck(r) is not None and duck(r) - r['firstItemAt'] < 5 for r in stops), f"stop to DUCK: {', '.join(sorted(set(str(round(duck(r) - r['firstItemAt'], 1)) for r in stops if duck(r) is not None)))} s in {len(stops)} runs"),
        ('The planter hides only a ducked dummy: standing behind it scores 0; ducked, it lands', all(r['hits'] == 0 for r in sp) and all(r['hits'] > 0 for r in pl), f"standing {sum(r['hits'] for r in sp)} hits; ducked {sum(r['hits'] for r in pl)} hits, {sum(r.get('duckHits', 0) for r in pl)} sprung from a duck"),
        ('Rung 5 keeps cover closed: ' + ', '.join(COVER) + ': at most one hit in 15 minutes each', all(sum(r['hits'] for r in tr if r['policy'] == p) <= 1 for p in COVER), ', '.join(f"{p} {sum(r['hits'] for r in tr if r['policy'] == p)}" for p in COVER)),
    ]
if top == 6:
    les = [r for r in runs if r['mode'] == 'lesson']
    rep_ = [r for r in les if r.get('habitHits', 0) > 0]
    other = [r for r in les if r['hits'] > 0 and not r.get('habitHits', 0)]
    pl, N = [r for r in tr if r['policy'] == 'planter'], d['p10'].get('duel.memorySites', 0)
    checks += [
        ('Only a hit sprung from the spot of an earlier crash teaches rung 6', all(r.get('lesson') for r in rep_) and not any(r.get('lesson') for r in other), f"lessons: {sum(1 for r in rep_ if r.get('lesson'))} of {len(rep_)} runs with such a hit; {sum(1 for r in other if r.get('lesson'))} of {len(other)} runs with only hits from new spots"),
        ('A new behaviour: it stops for a dummy at a spot it remembers (none at rung 5)', sum(r.get('expectStops', 0) for r in tr) > 0, f"trained: {sum(r.get('expectStops', 0) for r in tr)} cars stopped so; {sum(r.get('expectHidden', 0) for r in tr)} for a dummy cover hid"),
        ('Rung 6 closes the same spot: planter scores once a run, then never', all(r['hits'] <= 1 for r in pl), 'planter ' + ', '.join(str(r['hits']) for r in pl) + ' hits in 300 s'),
        ('No hit sprung from a duck at a spot it remembered (the sprint from past the field may still land from one: D115)', sum(r.get('rememberedDucked', 0) for r in tr) == 0, f"trained: {sum(r.get('rememberedDucked', 0) for r in tr)} of {sum(r['hits'] for r in tr)} hits; from a remembered spot at all: {sum(r.get('rememberedHits', 0) for r in tr)} (" + ', '.join(f"{p} {sum(r.get('rememberedHits', 0) for r in tr if r['policy'] == p)}" for p in dict.fromkeys(r['policy'] for r in tr if r.get('rememberedHits', 0))) + ')'),
        ('Every damaging hit leaves a crash; memory holds at most duel.memorySites', all(r.get('crashes') == r['hits'] for r in tr) and all(r.get('sites', 0) <= (N or 10 ** 9) for r in allr), f"crashes = hits in {sum(1 for r in tr if r.get('crashes') == r['hits'])} of {len(tr)} trained runs; most remembered {max(r.get('sites', 0) for r in allr)} (cap {N or 'none'})"),
        ('Rung 6 keeps cover closed: ' + ', '.join(COVER) + ': at most one hit in 15 minutes each', all(sum(r['hits'] for r in tr if r['policy'] == p) <= 1 for p in COVER), ', '.join(f"{p} {sum(r['hits'] for r in tr if r['policy'] == p)}" for p in COVER)),
    ]
if top == 2 and d['p10'].get('duel.jumpArrives') == 2:
    leg = [r for r in runs if r['mode'] == 'lesson' and r.get('firstSideAt') is not None]
    gap = lambda r: next((q['t'] for q in r.get('parts', []) if q['node'] == 'legs1'), None)
    checks += [
        ('Legs 1 arrives at the first side stop', all(gap(r) is not None and gap(r) - r['firstSideAt'] < 5 for r in leg), f"side stop to Legs 1: {', '.join(sorted(set(str(round(gap(r) - r['firstSideAt'], 1)) for r in leg if gap(r) is not None)))} s"),
        ('A new behaviour: it stops for a dummy beside its path (none at rung 1)', sum((r.get('behaviours') or {}).get('side', 0) for r in tr if r['policy'] in CLOSED) > 0, f"side stops in trained closed runs: {sum((r.get('behaviours') or {}).get('side', 0) for r in tr if r['policy'] in CLOSED)}"),
    ]
if top >= 1:
    checks += [
        ('Escalation: the closed trick decays below 0.5', all(esc[p]['decay'] is not None and esc[p]['decay'] < 0.5 for p in ESC_CLOSED if p in esc), ', '.join(f"{p} {esc[p]['decay']}" for p in ESC_CLOSED if p in esc)),
        ('Escalation: the opening holds (no stalemate)', all(esc[p]['decay'] is not None and esc[p]['decay'] >= 0.5 for p in ESC_OPEN if p in esc), ', '.join(f"{p} {esc[p]['decay']}" for p in ESC_OPEN + [q for q in ('plinth', 'aim') if q not in ESC_CLOSED and q not in ESC_OPEN] if p in esc)),
    ]
w('| Check | Result | Evidence |')
w('|---|---|---|')
for name, ok, ev in checks: w(f"| {name} | {'PASS' if ok else 'FAIL'} | {ev} |")
w('')
open(dst, 'w').write('\n'.join(out) + '\n')
print('wrote', dst, '·', sum(1 for c in checks if c[1]), '/', len(checks), 'checks pass')
