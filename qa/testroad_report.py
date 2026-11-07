#!/usr/bin/env python3
"""Prototype 10 test-road report (GDD Edits 101–108): qa/baseline/p10_<n>.json -> qa/baseline/p10_<n>.md.
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
        'peek': "Stands in view at a free spot behind a row for the car's road; once the car has noticed it, ducks and springs as it passes",
        'peekmove': "The same, but once ducked it crawls along the row beyond duel.searchRadius of where it was seen, then springs",
        'roam': "DUCK behind a planter row, at the nearest spot for the car's road that it does not remember (it reads the red rings); springs at a passing car",
        'lure': "Row 726: stands at a remembered spot (rung 6) or in view at a free one (rung 7: a ghost) until the car stops for it; crawls to a free spot downstream beyond duel.searchRadius; strikes as the car passes"}
HOME_COVER = "aim, flank, jump and dashjump wait at (300, 410), behind the barrier: cover"
MODE_DESC = {'lesson': "from the build's start (10.2: rung 0, on foot; 10.3: rung 1, Battery 1 fitted; 10.5: rung 3, Battery 1 and Legs 1 fitted); the lesson and the part as the build delivers them",
             'trained': "at the top rung from the start, every part its rungs bring fitted: the rung's own table"}
STAGE = str(d.get('stage', '10.1'))
def ge(v):  # stage order by number: 10.10 comes after 10.9
    return tuple(int(x) for x in STAGE.split('.')) >= tuple(int(x) for x in v.split('.'))
RARE, TIMED = [], []
CONED = ((d.get('p10') or {}).get('perception.forwardConeAngle') or 0) > 0  # row 731: the field as three cones; the duller sides leave rare side strikes
SIDE_RARE = 0.21  # hits a minute: a rare side strike, well under an open way in (OPEN_RATE)
if ge('10.8'):  # rung 7: seen-then-hidden closes; hiding before it sees you, or crawling away from the ghost, stays
    CLOSED, OPEN_FOOT, OPEN_DASH = ['stand', 'standSouth', 'standOff', 'charge', 'kerb', 'walkin', 'corner', 'plinth', 'standplanter', 'peek'], ['lurk', 'flankOpen'], ['peekmove', 'roam'] + (['lure'] if 'lure' in POL else [])
    RARE = ['conebait']  # row 723: the cameras' cones (perception.streetCameraFov) leave blind sides; rare, not closed
    TIMED = ['gap'] if (d.get('p10') or {}).get('perception.streetCameraPanArc') else []  # row 724: the pan opens a window
    RARE = RARE + ([] if TIMED else ['gap'])
    COVER = ['aim', 'flank', 'jump', 'dashjump'] + ([] if TIMED else ['gap'])
    ESC_CLOSED, ESC_OPEN = ['peek'], ['peekmove'] + (['lure'] if 'lure' in POL else [])
    HOME_COVER += "; conebait starts at the gap (188, 414); planter and standplanter use one spot behind the planter row south of road A, east (590, 418); roam, peek and peekmove use nine spots behind the three rows; lurk waits at (660, 576)"
elif ge('10.7'):  # rung 6: the same spot closes; any other spot stays, and the sprint from beyond the field (lurk; flankOpen, once the lift ends its stalemate: row 715)
    CLOSED, OPEN_FOOT, OPEN_DASH = ['stand', 'standSouth', 'standOff', 'charge', 'kerb', 'walkin', 'corner', 'gap', 'plinth', 'conebait', 'standplanter'], ['lurk', 'flankOpen'], ['roam']
    COVER = ['gap', 'aim', 'flank', 'jump', 'dashjump']
    ESC_CLOSED, ESC_OPEN = ['planter'], ['roam']
    HOME_COVER += "; conebait starts at the gap (188, 414); planter and standplanter use one spot behind the planter row south of road A, east (590, 418); roam uses nine spots behind the three rows; lurk waits at (660, 576)"
elif ge('10.6'):  # rung 5: the cone bait closes; DUCK behind a planter and the sprint from beyond the field stay
    CLOSED, OPEN_FOOT, OPEN_DASH = ['stand', 'standSouth', 'standOff', 'charge', 'kerb', 'flankOpen', 'walkin', 'corner', 'gap', 'plinth', 'conebait', 'standplanter'], ['lurk'], ['planter']
    COVER = ['gap', 'aim', 'flank', 'jump', 'dashjump']
    ESC_CLOSED, ESC_OPEN = ['conebait'], ['planter']
    HOME_COVER += "; conebait and planter start at the gap (188, 414); planter and standplanter use the spot behind the planter row south of road A, east (590, 418); lurk waits at (660, 576)"
elif ge('10.5'):  # rung 4: cover closes; the cone's swerve and the sprint from beyond the field stay
    CLOSED, OPEN_FOOT, OPEN_DASH = ['stand', 'standSouth', 'standOff', 'charge', 'kerb', 'flankOpen', 'walkin', 'corner', 'gap', 'plinth', 'aim'], ['lurk'], ['conebait']
    COVER = ['gap', 'aim', 'flank', 'jump', 'dashjump']  # every bot that waits behind the barrier
    ESC_CLOSED, ESC_OPEN = ['gap', 'jump'], ['conebait']  # lurk decays by the dummy's own leg damage (its dash shortens), not the car: noted under the escalation table
    HOME_COVER += "; conebait starts at the gap (188, 414); lurk waits at (660, 576), past every field's edge"
elif ge('10.4'):  # rung 3: the plinth and the jump close; cover stays
    CLOSED, OPEN_FOOT, OPEN_DASH = ['stand', 'standSouth', 'standOff', 'charge', 'kerb', 'flankOpen', 'walkin', 'corner'], ['gap'], []  # the plinth and the jump: by decay, below
    ESC_CLOSED, ESC_OPEN = ['plinth', 'dashjump'], ['gap', 'jump']  # the jump bot waits behind the barrier: cover
elif ge('10.3'):  # rung 2: the open flank closes; cover and the raised edge stay
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
if ge('10.3'): w(f'- **Cover:** {HOME_COVER}.')
if ge('10.8'): w('- **Parts:** Battery 1, Legs 1, Hands 1 and DUCK fitted from the start. No new part. The car starts at rung 6, crash memory; from rung 7 it searches where it last saw the dummy.')
elif ge('10.7'): w('- **Parts:** Battery 1, Legs 1, Hands 1 and DUCK fitted from the start. No new part. Every crash leaves an outline; from rung 6 the car remembers the latest `duel.memorySites` spots.')
elif ge('10.6'): w('- **Parts:** Battery 1, Legs 1 and Hands 1 fitted from the start; DUCK by drone at the first stop at a cone. Three low planter rows by the road.')
elif ge('10.5'): w('- **Parts:** Battery 1 and Legs 1 fitted from the start; Hands 1, the cones, by drone at the first stop for a dummy behind cover.')
elif ge('10.4'): w('- **No new part:** Battery 1 and Legs 1 are fitted from the start.')
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
    w('| Bot | Offset | Lesson: hit at (s) | Zone | Rung at end | First brake (s) | First side stop (s) | ' + ('First stop behind cover (s) | ' if ge('10.5') else '') + 'Part fitted (s) | Hits a minute after the lesson | Damage after |')
    w('|---|---|---|---|---|---|---|---|---|---|' + ('---|' if ge('10.5') else ''))
    for r in runs:
        if r['mode'] != 'lesson': continue
        L, A = r.get('lesson'), r.get('afterLesson')
        parts = ', '.join(f"{q['node']} {q['t']}" for q in r.get('parts', [])) or (str(r['dashAt']) if r.get('dashAt') is not None else '—')
        w(f"| {r['policy']} | +{r['offset']} | {L['hitAt'] if L else '—'} | {L['zone'] if L else '—'} | {r.get('rungEnd', '—')} | {r.get('firstBrakeAt') if r.get('firstBrakeAt') is not None else '—'} | {r.get('firstSideAt') if r.get('firstSideAt') is not None else '—'} | {(str(r['firstCoverAt']) if r.get('firstCoverAt') is not None else '—') + ' | ' if ge('10.5') else ''}{parts} | {f(A['hitsPerMin']) if A else '—'} | {A['lost'] if A else '—'} |")
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
if ge('10.5') and 'lurk' in esc_pol and 'lurk' not in ESC_OPEN: w("- **lurk decays by the dummy's own damage, not the car.** Each hit lands on a leg; the dash shortens with leg damage (164 to 116 after four hits), below what the sprint from past the field needs. " + ("A sprint from the open leaves no spot: the car stays at rung 5 (row 713).\n" if ge('10.7') else "The car stays at rung 3 throughout.\n"))
if ge('10.7'):  # row 703 (D117): the shorter run-in and the lighter body
    w(f'## {n} Pace (row 703; D117)'); n += 1
    w('')
    pace = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else None
    w('| Way in | Mode | Hits a minute | Damage a hit | Seconds a write-off | Cars a minute |')
    w('|---|---|---|---|---|---|')
    rows = [(p, mo, sel(mo, p)) for mo in MODES for p in ('lure', 'peekmove', 'roam', 'peek', 'planter', 'lurk')]
    if pace: rows.append(('planter, no memory (`duel.topRung` 5)', 'lesson', [r for r in pace['runs'] if r['policy'] == 'planter']))
    for p, mo, rs in rows:
        if not rs: continue
        mins = [r['simSeconds'] / 60 for r in rs]; wo = sum(r['writeOffs'] for r in rs); secs = sum(r['simSeconds'] for r in rs)
        w(f"| {p} | {mo} | {f(m([r['hitsPerMin'] for r in rs]))} | {f(m([r['lost'] / r['hits'] if r['hits'] else None for r in rs]), 0)} | {f(secs / wo, 0) if wo else '—'} | {f(m([r['cars']['appearances'] / mm for r, mm in zip(rs, mins)]), 1)} |")
    w('')
    w('- **GDD target:** at most 80 s a write-off (Edit 18 §10.2); 100 s in a five-minute visit. 10.6\'s planter ambush: 148 s (`qa/baseline/p10_6.md`).')
    w(f"- **Values:** `duel.runInLength` {d['p10'].get('duel.runInLength')}, `duel.redReturnSeconds` {d['p10'].get('duel.redReturnSeconds')}, `proto.health.standard` {d['p10'].get('proto.health.standard')}. Cars that appeared slowed for a dummy they already sensed: {sum(r.get('spawnSlow', 0) for r in runs)} in {sum(r['cars']['appearances'] for r in runs)}.")
    w('')
# Row 727: the possibility space. An open way in lands at least OPEN_RATE a minute at the build's top rung (mode 'trained'; 'lesson'
# without one). Each part a stage brings should open a way that uses it. Every stage's baseline is read, for the trend.
OPEN_RATE = 0.3
PART_OF = {'duel.dashArrives': ('Battery 1', ['aim', 'flank', 'flankOpen', 'gap', 'kerb', 'lurk', 'charge']), 'duel.jumpArrives': ('Legs 1', ['jump', 'dashjump', 'plinth']),
           'duel.conesArrives': ('Hands 1', ['conebait']), 'duel.duckArrives': ('DUCK', ['planter', 'roam', 'peek', 'peekmove', 'lure'])}
def open_ways(dd):
    rr = dd['runs']; [r.setdefault('mode', 'lesson') for r in rr]
    mo = 'trained' if any(r['mode'] == 'trained' for r in rr) else 'lesson'
    per = defaultdict(list)
    for r in rr:
        if r['mode'] == mo: per[r['policy']].append(r['hitsPerMin'])
    return mo, {p: round(mean(v), 2) for p, v in per.items() if p != 'wander' and mean(v) >= OPEN_RATE}
def new_parts(dd): return [k for k in PART_OF if (dd.get('p10') or {}).get(k) in (1, 2)]  # arrives during the stage (1: at the lesson's end; 2: on first use)
space = []
for k in range(1, 20):
    fp = os.path.join(ROOT, 'qa', 'baseline', f'p10_{k}.json')
    if os.path.abspath(fp) == os.path.abspath(src): dd = d
    elif os.path.exists(fp) and (STAGE.split('.')[-1].isdigit() and k < int(STAGE.split('.')[-1])): dd = json.load(open(fp))
    else: continue
    mo, ow = open_ways(dd); space.append((f'10.{k}', (dd.get('p10') or {}).get('duel.topRung', 0), mo, ow, new_parts(dd)))
if ge('10.8'):
    imp_all = [r for r in runs if r.get('grades') is not None]
    if imp_all:
        w(f'## {n} Stealth grades (row 725)'); n += 1
        w('')
        w(f"- **Points (row 728):** a strike scores its damage × its grade: UNSEEN × `scoring.stealthUnseen` {d['p10'].get('scoring.stealthUnseen', 0)}, LOST × `scoring.stealthLost` {d['p10'].get('scoring.stealthLost', 0)}, SEEN × `scoring.stealthSeen` {d['p10'].get('scoring.stealthSeen', 0)}.")
        w('')
        w('| Mode | Bot | Hits | UNSEEN | LOST | SEEN | Stealth points a minute |')
        w('|---|---|---|---|---|---|---|')
        for mo in MODES:
            for p in POL:
                rs = sel(mo, p)
                if not rs or not sum(r['hits'] for r in rs): continue
                g = defaultdict(int)
                for r in rs:
                    for k2, c2 in (r.get('grades') or {}).items(): g[k2] += c2
                w(f"| {mo} | {p} | {sum(r['hits'] for r in rs)} | {g['unseen']} | {g['lost']} | {g['seen']} | {f(m([r.get('stealthPoints', 0) / (r['simSeconds'] / 60) for r in rs]))} |")
        w('')
    lr = [r for r in runs if r['policy'] == 'lure']
    if lr:
        w(f'## {n} The lure (row 726)'); n += 1
        w('')
        w('| Mode | Lures taken | At a remembered spot | For a ghost | Lured cars struck | Damage a lure hit | Every hit, damage a hit |')
        w('|---|---|---|---|---|---|---|')
        for mo in MODES:
            rs = sel(mo, 'lure')
            if not rs: continue
            st, lh = sum(r['lureStops'] for r in rs), sum(r['lureHits'] for r in rs)
            w(f"| {mo} | {st} | {sum(r['lureRemembered'] for r in rs)} | {sum(r['lureGhost'] for r in rs)} | {lh} | {f(sum(r['lureLost'] for r in rs) / lh, 0) if lh else '—'} | {f(sum(r['lost'] for r in rs) / max(1, sum(r['hits'] for r in rs)), 0)} |")
        se = [r for r in runs if r.get('stopErrs')]
        if se: w(''); w(f"- **The stop line:** {sum(r['stopErrs'] for r in se)} stops for the dummy, a remembered spot or a ghost. The first line drawn for each stop fell within 10 of the car's nose at rest in {sum(r['stopErrWithin10'] for r in se)} ({100 * sum(r['stopErrWithin10'] for r in se) / max(1, sum(r['stopErrs'] for r in se)):.0f}%). A line drawn for a dummy that then moves misses.")
        w('')
    w(f'## {n} Possibility space (row 727)'); n += 1
    w('')
    w(f'An open way in lands at least {OPEN_RATE} a minute at the top rung. Earlier stages from their baselines.')
    w('')
    w('| Stage | Top rung | Mode | Open ways in | Parts it brings | Its ways that use them |')
    w('|---|---|---|---|---|---|')
    for stg, tp, mo, ow, nps in space:
        uses = sorted({q for k2 in nps for q in PART_OF[k2][1] if q in ow})
        w(f"| {stg} | {tp} | {mo} | {len(ow)}: {', '.join(sorted(ow)) or '—'} | {', '.join(PART_OF[k2][0] for k2 in nps) or '—'} | {', '.join(uses) or '—'} |")
    w('')
w(f'## {n} Checks'); n += 1
w('')
allr = runs + d['escalation']
top = d['p10'].get('duel.topRung', 0)
esc = {r['policy']: r for r in d['escalation']}
tr = [r for r in runs if r['mode'] == 'trained'] or [r for r in runs if r['mode'] == 'lesson']  # row 734: a build with no lesson (10.9 starts at its top rung) is its own trained table
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
        (f'Rung {top} closes: ' + ', '.join(CLOSED) + (f' score 0, or at most a rare side strike (under {SIDE_RARE} a minute; the duller side cones, row 731)' if CONED else ' score 0'), all(sum(r['hits'] for r in tr if r['policy'] == p) <= SIDE_RARE * sum(r['simSeconds'] for r in tr if r['policy'] == p) / 60 for p in CLOSED) if CONED else all(r['hits'] == 0 for r in tr if r['policy'] in CLOSED), ', '.join(f"{p} {sum(r['hits'] for r in tr if r['policy'] == p)}" for p in CLOSED)),
    ] + ([(f'The cameras\' pan opens a timed window behind the barrier: ' + ', '.join(TIMED) + ' lands (row 724)', all(m([r['hitsPerMin'] for r in tr if r['policy'] == p]) > 0 for p in TIMED), ', '.join(f"{p} {m([r['hitsPerMin'] for r in tr if r['policy'] == p])}/min" for p in TIMED))] if TIMED else []) + ([(f'The cameras\' blind sides leave rare edges: ' + ', '.join(RARE) + ' under 0.2 a minute (row 723)', all(m([r['hitsPerMin'] for r in tr if r['policy'] == p]) < 0.2 for p in RARE), ', '.join(f"{p} {m([r['hitsPerMin'] for r in tr if r['policy'] == p])}/min" for p in RARE))] if RARE else []) + [
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
        ('Rung 6 closes the same spot: planter lands from cover once a run, then never (a first spring it saw coming leaves no spot: row 713)', all(r.get('coveredHits', 0) <= 1 and r['hits'] <= 2 for r in pl), 'planter ' + ', '.join(f"{r['hits']} ({r.get('coveredHits', 0)} from cover)" for r in pl) + ' hits in 300 s'),
        ('No hit from a spot it remembered at the time', sum(r.get('rememberedHits', 0) for r in tr) == 0, f"trained: {sum(r.get('rememberedHits', 0) for r in tr)} of {sum(r['hits'] for r in tr)} hits"),
        ('A hit from the open leaves no spot (row 713): the sprint from past the field never teaches rung 6', all(not r.get('lesson') for r in les if r['policy'] == 'lurk') and all(r.get('sites', 0) == 0 for r in tr if r['policy'] == 'lurk'), f"lurk: lessons {sum(1 for r in les if r['policy'] == 'lurk' and r.get('lesson'))} of {sum(1 for r in les if r['policy'] == 'lurk')} runs; spots remembered {max([r.get('sites', 0) for r in tr if r['policy'] == 'lurk'] or [0])}"),
        ('Every damaging hit leaves a crash; memory holds at most duel.memorySites', all(r.get('crashes') == r['hits'] for r in tr) and all(r.get('sites', 0) <= (N or 10 ** 9) for r in allr), f"crashes = hits in {sum(1 for r in tr if r.get('crashes') == r['hits'])} of {len(tr)} trained runs; most remembered {max(r.get('sites', 0) for r in allr)} (cap {N or 'none'})"),
        ('No car waits for the dummy past duel.blockSeconds: FARSIGHT lifts it aside (row 715)', all(r['cars'].get('blocked20s', 0) == 0 for r in allr) and sum(r.get('lifts', 0) for r in tr if r['policy'] in ('stand', 'standSouth', 'standOff')) > 0, f"waits over 20 s: {sum(r['cars'].get('blocked20s', 0) for r in allr)}; lifts {sum(r.get('lifts', 0) for r in allr)}, put down {sum(r.get('liftDrops', 0) for r in allr)} (standing bots: {sum(r.get('lifts', 0) for r in tr if r['policy'] in ('stand', 'standSouth', 'standOff'))})") if d['p10'].get('duel.blockSeconds') else ('—', True, ''),
        ('Rung 6 keeps cover closed: ' + ', '.join(COVER) + ': at most one hit in 15 minutes each', all(sum(r['hits'] for r in tr if r['policy'] == p) <= 1 for p in COVER), ', '.join(f"{p} {sum(r['hits'] for r in tr if r['policy'] == p)}" for p in COVER)),
    ]
if top == 7:
    les = [r for r in runs if r['mode'] == 'lesson']
    ls = [r for r in les if r.get('lostSightHits', 0) > 0]
    other = [r for r in les if r['hits'] > 0 and not r.get('lostSightHits', 0)]
    pk, pm = [r for r in tr if r['policy'] == 'peek'], [r for r in tr if r['policy'] == 'peekmove']
    checks += [
        ('Only a hit from cover by a dummy it had just seen teaches rung 7', all(r.get('lesson') for r in ls) and not any(r.get('lesson') for r in other), f"lessons: {sum(1 for r in ls if r.get('lesson'))} of {len(ls)} runs with such a hit; {sum(1 for r in other if r.get('lesson'))} of {len(other)} runs with only other hits"),
        ('A new behaviour: it searches the ghost (none at rung 6)', sum(r.get('searches', 0) for r in tr) > 0 and sum(r.get('searchFound', 0) for r in tr) > 0, f"trained: {sum(r.get('searches', 0) for r in tr)} searches; {sum(r.get('searchFound', 0) for r in tr)} found the dummy near the ghost; {sum(r.get('searchEnd', 0) for r in tr)} ended"),
        ('Rung 7 closes seen-then-hidden: peek at most one hit in 15 minutes', sum(r['hits'] for r in pk) <= 1, f"peek {sum(r['hits'] for r in pk)} hits; peekmove, crawling beyond duel.searchRadius, {sum(r['hits'] for r in pm)}"),
        ('No hit from a spot it remembered at the time' + (' (cones: at most one in 15 minutes, row 731)' if CONED else ''), sum(r.get('rememberedHits', 0) for r in tr) <= (1 if CONED else 0), f"trained: {sum(r.get('rememberedHits', 0) for r in tr)} of {sum(r['hits'] for r in tr)} hits"),
        ('No car waits for the dummy past duel.blockSeconds: FARSIGHT lifts it aside (row 715)', all(r['cars'].get('blocked20s', 0) == 0 for r in allr), f"waits over 20 s: {sum(r['cars'].get('blocked20s', 0) for r in allr)}; lifts {sum(r.get('lifts', 0) for r in allr)}"),
        ('Rung 7 keeps cover closed: ' + ', '.join(COVER) + (f': at most a rare side strike each (under {SIDE_RARE} a minute; the duller side cones, row 731)' if CONED else ': at most one hit in 15 minutes each'), all(sum(r['hits'] for r in tr if r['policy'] == p) <= (SIDE_RARE * 15 if CONED else 1) for p in COVER), ', '.join(f"{p} {sum(r['hits'] for r in tr if r['policy'] == p)}" for p in COVER)),
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
        ('Escalation: the opening holds (no stalemate: decay at least 0.5, or hits in 8 of 10 minutes)', all(esc[p]['decay'] is not None and (esc[p]['decay'] >= 0.5 or sum(1 for x in esc[p]['windows'] if x > 0) >= 8) for p in ESC_OPEN if p in esc), ', '.join(f"{p} {esc[p]['decay']} (hits in {sum(1 for x in esc[p]['windows'] if x > 0)} of {len(esc[p]['windows'])} minutes)" for p in ESC_OPEN + [q for q in ('plinth', 'aim') if q not in ESC_CLOSED and q not in ESC_OPEN] if p in esc)),
    ]
TWO = bool((d.get('p10') or {}).get('duel.twoWay'))
RUNG_ONLY = ('Rung 7 closes:', 'Rung 7 keeps cover closed', 'It stops beyond dash reach', 'An opening without the new part', 'Only a hit from cover', 'Escalation: the closed trick', 'Escalation: the opening holds')
w('| Check | Result | Evidence |')
w('|---|---|---|')
checks = [c for c in checks if c[0] != '—']
if ge('10.8'):
    gr = lambda p, k2: sum((r.get('grades') or {}).get(k2, 0) for r in runs if r['policy'] == p)
    hits_of = lambda p: sum(r['hits'] for r in runs if r['policy'] == p)
    if any(r.get('grades') is not None for r in runs):
        checks += [('Stealth grade: the sprint from past the field (lurk) grades UNSEEN (row 725)', hits_of('lurk') > 0 and gr('lurk', 'unseen') == hits_of('lurk'), f"lurk: {gr('lurk', 'unseen')} of {hits_of('lurk')} UNSEEN"),
                   ('Stealth grade: seen, then hidden (peek) grades LOST (row 725)' + ('; with cones, a side strike on a car met on the way in may grade SEEN, never UNSEEN (row 731)' if CONED else ''), hits_of('peek') > 0 and (gr('peek', 'unseen') == 0 and 2 * gr('peek', 'lost') >= hits_of('peek') if CONED else gr('peek', 'lost') == hits_of('peek')), f"peek: {gr('peek', 'lost')} of {hits_of('peek')} LOST, {gr('peek', 'seen')} SEEN, {gr('peek', 'unseen')} UNSEEN")]
    if 'lure' in POL:
        lt = [r for r in tr if r['policy'] == 'lure']; st, lh = sum(r['lureStops'] for r in lt), sum(r['lureHits'] for r in lt)
        se = [r for r in runs if r.get('stopErrs')]; ns, n10 = sum(r['stopErrs'] for r in se), sum(r['stopErrWithin10'] for r in se)
        checks += [('The lure lands: cars stop for it, and at least half the lured cars are struck (row 726)', st > 0 and lh >= st / 2, f"trained: {st} lures taken, {lh} lured cars struck"),
                   ('The stop line says where the car stops: within 10 in 90% of stops (row 726)', ns > 0 and n10 >= 0.9 * ns, f"{n10} of {ns}")]
    mo_, ow_ = open_ways(d); nps_ = new_parts(d); uses_ = sorted({q for k2 in nps_ for q in PART_OF[k2][1] if q in ow_})
    if ((d.get('p10') or {}).get('scoring.incidentPoints') or 0) > 0:  # row 740: the Incident
        bc = [r for r in runs if r['policy'] == 'brakecheck']; ni = sum(r.get('incidents', 0) for r in bc); mb = sum(r['simSeconds'] for r in bc) / 60 or 1
        other = sum(r.get('incidents', 0) for r in runs if r['policy'] != 'brakecheck')
        checks += [('The Incident lands: a late step in front of a tailgated red car (brakecheck) makes the white car run into it (row 740)', ni > 0, f"brakecheck {ni} Incidents in {round(mb)} minutes ({round(ni / mb, 2)} a minute); the other bots {other}")]
    if (d.get('p10') or {}).get('duel.twoWay'):  # row 734: the two-way road and its white traffic
        wsum, wh, mn = sum(r.get('whites', 0) for r in runs), sum(r.get('whiteHits', 0) for r in runs), sum(r['simSeconds'] for r in runs) / 60
        checks += [('White traffic runs both ways, and never scores (row 734)', wsum > 0, f"{round(wsum / mn, 1)} white cars a minute; white hits on the dummy {wh} ({round(wh / mn, 2)} a minute), damage only")]
    checks += [(f'At least two open ways in at the top rung, each {OPEN_RATE} a minute or more (row 727)', len(ow_) >= 2, f"{len(ow_)}: " + ', '.join(f'{p} {v}' for p, v in sorted(ow_.items()))),
               ('Each part the stage brings opens a way that uses it (row 727)', not nps_ or bool(uses_), (', '.join(PART_OF[k2][0] for k2 in nps_) + ': ' + (', '.join(uses_) or 'none')) if nps_ else 'no part arrives in this stage'),
               ('Every earlier stage held the floor of two (row 727)', all(len(ow) >= 2 for _, _, _, ow, _ in space), ', '.join(f'{stg} {len(ow)}' for stg, _, _, ow, _ in space))]
if TWO:  # row 734: white traffic reopens rung 7's closures by design (moving cover, the boxed-in car): measured, not passed or failed
    info = [c for c in checks if c[0].startswith(RUNG_ONLY) or c[0].startswith('Stealth grade:')]
    checks = [c for c in checks if c not in info]
for name, ok, ev in checks: w(f"| {name} | {'PASS' if ok else 'FAIL'} | {ev} |")
if TWO:
    w(''); w('Rung 7\'s closures with white traffic (measured; row 734):'); w(''); w('| Measure | Evidence |'); w('|---|---|')
    for name, ok, ev in info: w(f"| {name} | {ev} |")
w('')
open(dst, 'w').write('\n'.join(out) + '\n')
print('wrote', dst, '·', sum(1 for c in checks if c[1]), '/', len(checks), 'checks pass')
