#!/usr/bin/env python3
"""Prototype 10.0 baseline report (handover v2 §10): qa/baseline/p9.json (+ stand_p9.jsonl) -> qa/baseline/p9.md.

Pillar 1's written test (Edit 19), per sim:
  stand share   = mean points per standing hit / mean points per head-on (front-zone) lunge hit; FAIL above 0.45
  bait / stand  = mean points per bait hit / mean points per standing hit;                    FAIL below 1.5
Proposed IDs: qa.fun.standShareMax 0.45, qa.fun.baitOverStandMin 1.5. Points per hit exclude the write-off bonus.
    python3 qa/baseline_report.py [qa/baseline/p9.json] [qa/baseline/p9.md]
"""
import hashlib, json, os, sys
from collections import defaultdict
from statistics import mean

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'qa', 'baseline', 'p9.json')
dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'qa', 'baseline', 'p9.md')
STAND_SHARE_MAX, BAIT_OVER_STAND_MIN = 0.45, 1.5
d = json.load(open(src))
runs = [r for r in d['runs'] if r and 'fun' in r]
skipped = [r for r in d['runs'] if r and ('skipped' in r or 'error' in r)]
sims = list(dict.fromkeys(r['sim'] for r in runs))
POL = ['stand', 'blind', 'read', 'wander']
md5 = hashlib.md5(open(os.path.join(ROOT, d['build']), 'rb').read()).hexdigest()

def m(xs, nd=2):
    xs = [x for x in xs if x is not None]
    return round(mean(xs), nd) if xs else None

def f(x, nd=2):
    return '—' if x is None else (f'{x:.{nd}f}' if isinstance(x, float) else str(x))

by = defaultdict(list)
for r in runs: by[(r['sim'], r['policy'])].append(r)

out = []
w = out.append
w('# Prototype 10.0 baseline: Prototype 9, measured')
w('')
w(f"- **Build:** `{d['build']}`, md5 `{md5}`. No build change.")
w(f"- **Grid:** {len(sims)} sims × {len(POL)} policies × offsets {d['offsets']} s; {d['secs']} sim-seconds a run. {len(runs)} runs; {len(skipped)} skipped.")
w('- **Offsets, not seeds.** Traffic is deterministic (golden-ratio spacing). `proto.district.seed` changes the city plan, so runs vary by when the policy starts.')
w('- **Tools:** `node qa/policy.js --out qa/baseline/p9.json`; `node qa/carmetrics.js`; `node qa/stand.js`; this report.')
w('- **Human baseline:** Sasha\'s oral notes, `qa/baseline/sasha_p9.md`.')
w('')
w('## 1 Fun measures (mean of offsets)')
w('')
w('| Sim | Policy | Hits/min | Write-offs/min | First hit (s) | First write-off (s) | Points/min | Bait share |')
w('|---|---|---|---|---|---|---|---|')
for s in sims:
    for p in POL:
        rs = by[(s, p)]
        if not rs: continue
        F = [r['fun'] for r in rs]
        w(f"| {s} | {p} | {f(m([x['hitsPerMin'] for x in F]))} | {f(m([x['writeOffsPerMin'] for x in F], 3), 3)} | {f(m([x['firstHitSeconds'] for x in F], 1), 1)} | {f(m([x['firstWriteOffSeconds'] for x in F], 1), 1)} | {f(m([x['pointsPerMin'] for x in F], 0), 0)} | {f(m([x['baitShare'] for x in F]))} |")
w('')
w('- Story A1: no dash before Battery 1 (Edit 91). Blind and read cannot lunge there.')
w('')

w('## 2 How standing gets hit (stand policy, all runs)')
w('')
zones, states, cls = defaultdict(int), defaultdict(int), defaultdict(int)
for r in runs:
    if r['policy'] != 'stand': continue
    for e in r['impacts']:
        zones[e['zone']] += 1; states[e['carState']] += 1; cls[e['cls']] += 1
w('| Measure | Count |')
w('|---|---|')
w('| Damaging hits | ' + str(sum(zones.values())) + ' |')
w('| By zone | ' + ', '.join(f'{k} {v}' for k, v in sorted(zones.items(), key=lambda kv: -kv[1])) + ' |')
w('| By car state | ' + ', '.join(f'{k} {v}' for k, v in sorted(states.items(), key=lambda kv: -kv[1])) + ' |')
w('| By class | ' + ', '.join(f'{k} {v}' for k, v in sorted(cls.items(), key=lambda kv: -kv[1])) + ' |')
w('')

w('## 3 Pillar 1\'s written test (Edit 19)')
w('')
w(f'- **Fails if** standing earns more than {STAND_SHARE_MAX:.0%} of a head-on lunge (`qa.fun.standShareMax`, proposed).')
w(f'- **Fails if** baiting earns less than {BAIT_OVER_STAND_MIN}× standing (`qa.fun.baitOverStandMin`, proposed).')
w('- Points a hit, write-off bonus excluded. Head-on lunge: a lunging hit in the front zone, any policy. Bait: an impact flagged `bait`, any policy.')
w('')
pool_front = [e['points'] for r in runs for e in r['impacts'] if e['lunging'] and e['zone'] == 'front']
w('| Sim | Stand pts/hit | Head-on lunge pts/hit | Stand share | Bait pts/hit | Bait ÷ stand | Result |')
w('|---|---|---|---|---|---|---|')
verdicts = {}
for s in sims:
    rs = [r for r in runs if r['sim'] == s]
    st = [e['points'] for r in rs if r['policy'] == 'stand' for e in r['impacts']]
    fr = [e['points'] for r in rs for e in r['impacts'] if e['lunging'] and e['zone'] == 'front']
    note = ''
    if not fr: fr, note = pool_front, ' (pooled lunge)'
    bt = [e['points'] for r in rs for e in r['impacts'] if e['bait']]
    sp, fp, bp = (m(st, 1) if st else 0.0), m(fr, 1), m(bt, 1)
    share = (sp / fp) if (fp and sp is not None) else None
    ratio = (bp / sp) if (bp is not None and sp) else None
    fails = []
    if share is not None and share > STAND_SHARE_MAX: fails.append('stand share')
    if sp and (ratio is None or ratio < BAIT_OVER_STAND_MIN): fails.append('bait ratio')
    res = 'PASS (standing earns nothing)' if not st else ('FAIL: ' + ', '.join(fails) if fails else 'PASS')
    verdicts[s] = res
    w(f"| {s} | {f(sp, 1)} ({len(st)} hits) | {f(fp, 1)}{note} | {f(None if share is None else round(share, 2))} | {f(bp, 1)} | {f(None if ratio is None else round(ratio, 2))} | {res} |")
w('')

w('## 4 Reading beats repetition (V29 D2.1)')
w('')
w('| Sim | Read points | Blind points | Read ÷ blind (`qa.fun.readOverBlind`) | Stand points |')
w('|---|---|---|---|---|')
for s in sims:
    tot = {p: sum(r['fun']['points'] for r in by[(s, p)]) for p in POL}
    rb = round(tot['read'] / tot['blind'], 2) if tot['blind'] else None
    w(f"| {s} | {tot['read']} | {tot['blind']} | {f(rb) if rb is not None else ('∞' if tot['read'] else '—')} | {tot['stand']} |")
w('')

w('## 5 Car predictability (wander policy; `qa/carmetrics.js`)')
w('')
w('| Sim | Cars seen | Shifts per car | Cars with 3+ shifts | Interrupts | Heading snaps > 360°/s | Max yaw °/s |')
w('|---|---|---|---|---|---|---|')
for s in sims:
    C = [r['cars'] for r in by[(s, 'wander')]]
    if not C: continue
    w(f"| {s} | {f(m([c['seen'] for c in C], 1), 1)} | {f(m([c['shiftsPerCar'] for c in C]))} | {f(m([c['carsWith3PlusShifts'] for c in C], 1), 1)} | {f(m([c['interrupts'] for c in C], 1), 1)} | {f(m([c['headingSnapsOver360degS'] for c in C], 1), 1)} | {max(c['maxYawDegS'] for c in C)} |")
w('')
w('- Corners and rings turn fast by design. Snaps count every car, as the P3 script did off its corner level.')
w('')

stand_file = os.path.join(ROOT, 'qa', 'baseline', 'stand_p9.jsonl')
if os.path.exists(stand_file):
    rows = [json.loads(l) for l in open(stand_file) if l.strip().startswith('{')]
    summ = [r for r in rows if 'placements' in r]
    w('## 6 Stand-in-lane probe (`qa/stand.js`, dummy held in place)')
    w('')
    if summ:
        s0 = summ[-1]
        w(f"- {s0['placements']} placements ran; {s0['withHits']} took damaging hits; {s0['hits']} hits; {s0['writeOffs']} write-offs.")
    w('- Raw lines: `qa/baseline/stand_p9.jsonl`.')
    w('')

if skipped:
    w('## Skipped runs')
    w('')
    for r in skipped: w(f"- {r.get('sim')} {r.get('policy')} +{r.get('offset')}: {r.get('skipped') or r.get('error')}")
    w('')

open(dst, 'w').write('\n'.join(out) + '\n')
json.dump(verdicts, sys.stdout, indent=1); print()
