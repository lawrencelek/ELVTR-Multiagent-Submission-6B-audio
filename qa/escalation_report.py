#!/usr/bin/env python3
"""Prototype 10.0-v2 escalation report (handover v2 §12): qa/baseline/p9_escalation.json -> p9_escalation.md.

Escalation is measured three ways (proposed IDs, no targets yet):
  qa.esc.decay           hits per dash in the last two minutes / the first two minutes (below 1: the trick wears out)
  qa.esc.learnEvents     learning events, and what each changed (a number or a behaviour)
  qa.esc.newBehaviours   avoidance responses first seen after the first learning event
    python3 qa/escalation_report.py [json] [md]
"""
import json, os, sys
from collections import defaultdict
from statistics import mean

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'qa', 'baseline', 'p9_escalation.json')
dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'qa', 'baseline', 'p9_escalation.md')
d = json.load(open(src))
runs = [r for r in d['runs'] if r and 'windows' in r]
reg = {e['id']: e for e in json.load(open(os.path.join(ROOT, 'content', 'params', 'tuning.parameters.json')))['entries']}

def regv(i, fallback):
    return reg[i]['default'] if i in reg else f'{fallback} (sim.js only)'

def rate(w):
    return w['hits'] / w['lunges'] if w['lunges'] else None

def m(xs, nd=2):
    xs = [x for x in xs if x is not None]
    return round(mean(xs), nd) if xs else None

out = []; w = out.append
w('# Prototype 10.0-v2: does avoidance escalate? (Prototype 9)')
w('')
w('- **Question (Lawrence, 2 November):** what is the escalating sophistication by which cars avoid you? The learning car should learn something new each time.')
w(f"- **Method:** the aimed dash (`qa/policy.js` \"read\") repeated for {d['secs']} sim-seconds a run. Offsets {d['offsets']} s. `run.appearances.road` raised so the shift never runs out.")
w('- **Variants:** `built` (Prototype 9 as shipped); `learningOn` (`proto.learningEnabled` 1, the dormant learning in `sim.js`).')
w(f'- **Runs:** {len(runs)}. Build unchanged. Tool: `node qa/escalation.js --out qa/baseline/p9_escalation.json`.')
w('')
w('## 1 What Prototype 9 cars can learn')
w('')
w('| Mechanism | IDs and values | On in Prototype 9 | Changes |')
w('|---|---|---|---|')
w(f"| Stop line | `proto.learn.standoffEnabled` {regv('proto.learn.standoffEnabled', 1)}; `proto.learn.standoffStep` {regv('proto.learn.standoffStep', 35)} to `proto.learn.standoffMax` {regv('proto.learn.standoffMax', 190)} | Yes. Only after a hit on a stopped car | A number |")
w(f"| Forward beam | `proto.learningEnabled` {regv('proto.learningEnabled', 0)}; `learning.playerHitStep` {regv('learning.playerHitStep', 0.08)} to `learning.playerHitCap` {regv('learning.playerHitCap', 0.4)} | No | A number |")
w('| Approach registry (Edits 25–26): six approaches | — | Not built | — |')
w('| **New avoidance behaviours a car can learn** | — | **None** | — |')
w('')
w('- One model per class (`this.models`): every sedan learns as one. A car keeps its values until it leaves.')
w('')

w('## 2 Does the trick wear out? Hits per dash, by minute (mean of offsets)')
w('')
nwin = max(len(r['windows']) for r in runs)
w('| Sim | Variant | ' + ' | '.join(f'min {i + 1}' for i in range(nwin)) + ' | Decay (`qa.esc.decay`) |')
w('|---|---|' + '---|' * nwin + '---|')
by = defaultdict(list)
for r in runs: by[(r['sim'], r['variant'])].append(r)
decays = {}
for (sim, var), rs in by.items():
    cols = []
    for i in range(nwin):
        cols.append(m([rate(r['windows'][i]) for r in rs if i < len(r['windows'])]))
    first, last = m(cols[:2]), m([c for c in cols if c is not None][-2:])
    dec = round(last / first, 2) if first and last is not None else None
    decays[(sim, var)] = dec
    w(f"| {sim} | {var} | " + ' | '.join('—' if c is None else f'{c:.2f}' for c in cols) + f" | {'—' if dec is None else dec} |")
w('')
w('- Decay 1.0: the same dash works as well at the end as at the start. Below 1: the cars caught up.')
w('')

w('## 3 Learning events (`qa.esc.learnEvents`)')
w('')
w('| Sim | Variant | Events | Stop line | Forward beam | Models at end |')
w('|---|---|---|---|---|---|')
for (sim, var), rs in by.items():
    ev = [e for r in rs for e in r['learn']]
    sl, fb = sum(e['what'] == 'stop line' for e in ev), sum(e['what'] == 'forward beam' for e in ev)
    mods = rs[0]['models']
    ms = ', '.join(f"{k} beam {v['applied']}, stop {v['standoff']}" for k, v in mods.items() if v['applied'] or v['standoffApplied'])
    w(f"| {sim} | {var} | {round(len(ev) / len(rs), 1)} a run | {sl} | {fb} | {ms or 'unchanged'} |")
w('')
w('- Every learning event changes a number. None adds a behaviour.')
w('')

w('## 4 Do trained cars resist? Hits per dash by the target\'s training (learningOn)')
w('')
lv_l, lv_h = defaultdict(int), defaultdict(int)
for r in runs:
    if r['variant'] != 'learningOn': continue
    for l in r['lungeLog']:
        if l['tgt']: lv_l[l['tgt']['applied']] += 1
    for h in r['hitLog']:
        if h['applied'] is not None: lv_h[h['applied']] += 1
w('| Beam steps learned (`learning.playerHitStep` each) | Dashes aimed | Hits | Hits per dash |')
w('|---|---|---|---|')
for k in sorted(set(lv_l) | set(lv_h)):
    w(f"| {k} | {lv_l[k]} | {lv_h[k]} | {'—' if not lv_l[k] else f'{lv_h[k] / lv_l[k]:.2f}'} |")
w('')
w('- Hits are matched to the car hit; dashes to the car aimed at. Approximate.')
w('')

w('## 5 Something new each time? (`qa.esc.newBehaviours`)')
w('')
w('| Sim | Variant | Responses seen | First learning event (s) | New after it |')
w('|---|---|---|---|---|')
for (sim, var), rs in by.items():
    kinds, new = set(), set()
    firsts = []
    for r in rs:
        fl = min([e['t'] for e in r['learn']], default=None); firsts.append(fl)
        for k, t in r['firstSeen'].items():
            kinds.add(k)
            if fl is not None and t > fl: new.add(k)
    w(f"| {sim} | {var} | {', '.join(sorted(kinds)) or '—'} | {m(firsts, 1) if any(x is not None for x in firsts) else '—'} | {', '.join(sorted(new)) or 'none'} |")
w('')
w('- A response "new after it" first appeared after a learning event. Responses come from the fixed driver (v1 §5.3), so a late first sighting is chance, not learning.')
w('')
w('## 6 Why dashes stopped landing: stalemates and the floor')
w('')
w('A window with dashes but no damaging hit is classed by its dashes:')
w('- **Stalemate:** 80% or more aimed at one car that is never hit. Its stop line beyond `movement.lungeDistance` puts it out of dash reach (DB4a); a shorter line points to another block.')
w('- **Story floor:** in Story, a hit off the brief at the floor deals no damage (`story.floorHold`, row 620).')
w('')
sd, ss = regv('proto.standoffDistance', 50), regv('proto.learn.standoffStep', 35)
sd = sd if isinstance(sd, (int, float)) else 50
ss = ss if isinstance(ss, (int, float)) else 35
w('| Sim | Variant | Offset | Dry windows (min) | Class | Car | Its stop line |')
w('|---|---|---|---|---|---|---|')
from collections import Counter
for r in runs:
    z = [i for i, x in enumerate(r['windows']) if x['lunges'] and not x['hits']]
    if not z: continue
    after = [l for l in r['lungeLog'] if l['t'] >= z[0] * 60 and l['tgt']]
    top = Counter((l['tgt']['model'], l['tgt']['standoffApplied']) for l in after).most_common(1)
    share = top[0][1] / len(after) if top and after else 0
    if r['sim'].startswith('story:') and share < 0.8: cls_, car, line = 'Story floor', '—', '—'
    elif share >= 0.8: cls_, car, line = 'Stalemate', top[0][0][0], f"{sd + ss * top[0][0][1]} (lunge {regv('movement.lungeDistance', 164)})"
    else: cls_, car, line = 'Unclassed', '—', '—'
    w(f"| {r['sim']} | {r['variant']} | +{r['offset']} | {', '.join(str(i + 1) for i in z)} | {cls_} | {car} | {line} |")
w('')
open(dst, 'w').write('\n'.join(out) + '\n')
print(json.dumps({f'{k[0]} {k[1]}': v for k, v in decays.items()}, indent=1))
