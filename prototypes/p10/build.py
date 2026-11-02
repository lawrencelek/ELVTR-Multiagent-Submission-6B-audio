#!/usr/bin/env python3
"""Prototype 10 build (GDD Edits 101–102): the Monument test road, one page per test.

    python3 prototypes/p10/build.py          # writes sim_flags.json and every page not frozen

Each page runs the base Sim (prototypes/p6/sim.js) with prototypes/p10/testroad.js and a greybox renderer (game_p10.js).
Its values, in order: the P6–P7 prototype values the district builds inherit (WORLD6.P6SIM, STORY.P7SIM), Prototype 9's
build flags (window.DUMMIES_SIM in dummies_p9.html), every Prototype P10 registry entry at its default, then the test's own.
Shared files are not touched. sim_flags.json holds every test's values for the headless probes (qa/testroad.js).

A test's page freezes once its human pass may use it. 10.1's page (dummies_p10.html) is frozen: it was built at commit
4b3d668 and is never rewritten (md5 below). Its values still live here, so the probes rerun rung 0 on today's code.
"""
import hashlib, json, re, subprocess
from pathlib import Path

here = Path(__file__).resolve().parent
root = here.parent.parent
p6, p7, p9 = root / 'prototypes' / 'p6', root / 'prototypes' / 'p7', root / 'prototypes' / 'p9'

reg = json.loads((root / 'content' / 'params' / 'tuning.parameters.json').read_text(encoding='utf-8'))
byid = {e['id']: e for e in reg['entries']}

# Prototype 9's build flags, as shipped
m = re.search(r'window\.DUMMIES_SIM = (\{.*?\}); //', (p9 / 'dummies_p9.html').read_text(encoding='utf-8'))
p9sim = json.loads(m.group(1))

# The P6–P7 prototype values (DIRECT turning, abilities, Battery 1 the dash, vehicle scale): the district sims inherit them
js = r"""
const fs = require('fs'), W6 = require(process.argv[1] + '/prototypes/p6/world6.js');
const src = fs.readFileSync(process.argv[1] + '/prototypes/p7/story.js', 'utf8');
const a = src.indexOf('const P7SIM = {'), b = src.indexOf('};', a);
const P7SIM = Function('"use strict"; return (' + src.slice(a + 'const P7SIM = '.length, b + 1) + ');')();
process.stdout.write(JSON.stringify({ P6SIM: W6.P6SIM, P7SIM }));
"""
inherited = json.loads(subprocess.run(['node', '-e', js, str(root)], capture_output=True, text=True, check=True).stdout)
duel_defaults = {e['id']: e['default'] for e in reg['entries'] if e['group'] == 'Prototype P10'}

# Prototype 10.1: the test road; rung 0 (the red car learns nothing)
T101 = {
    'duel.enabled': 1, 'duel.carsOnRoad': 1, 'duel.redReturnSeconds': 4,      # the red car alone on the road; back after 4 s
    'proto.learningEnabled': 0, 'proto.learn.standoffEnabled': 0,             # rung 0; stop-line learning off (D101)
    'perception.forwardLength': 0, 'proto.driver.cautionZone': 0,            # rung 0 senses nothing: no forward beam, no driver's field (v1 PT4, L1)
    'run.appearances.road': 1000, 'run.quota.road': 1000000,                  # no shift end, no quota: free play
}
# Prototype 10.2: one lesson. A hit on the nose teaches rung 1, the forward camera; the dash arrives at its first brake
T102 = dict(T101, **{
    'duel.topRung': 1,                       # one lesson: rung 0 to rung 1 (row 667)
    'perception.forwardLength': 720,         # rung 1's beam: past the safe envelope at cruise, 670 (row 669). Rung 0 stays blind
    'duel.standstillSpeed': 5,               # a stopped car passed its test: no damage, no lesson (row 668)
    'duel.dashArrives': 2,                   # Battery 1 by drone at the car's first brake for the dummy (row 667)
})
STAGES = {
    '10.1': {'title': 'THE TEST ROAD', 'page': 'dummies_p10.html', 'frozen': '82ab5e55d243ee500d6dfcaa60af74e6', 'edit': 101, 'values': T101},
    '10.2': {'title': 'THE FIRST LESSON', 'page': 'dummies_p10_2.html', 'frozen': None, 'edit': 102, 'values': T102},
}
CURRENT = '10.2'

out = {'registry': reg['registryVersion'], 'current': CURRENT, 'stages': {}}
for sid, st in STAGES.items():
    v = st['values']
    assert all(k in byid for k in v), (sid, [k for k in v if k not in byid])
    assert all(k in byid for k in p9sim), [k for k in p9sim if k not in byid]
    flags = dict(inherited['P6SIM']); flags.update(inherited['P7SIM']); flags.update(p9sim); flags.update(duel_defaults); flags.update(v)
    out['stages'][sid] = {'title': st['title'], 'page': st['page'], 'p10': v, 'flags': flags}
(here / 'sim_flags.json').write_text(json.dumps(out, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')

for sid, st in STAGES.items():
    page = here / st['page']
    if st['frozen']:
        got = hashlib.md5(page.read_bytes()).hexdigest()
        print(f'{sid}: {page.relative_to(root)} frozen, md5 {got}', 'OK' if got == st['frozen'] else f'CHANGED (expected {st["frozen"]})')
        continue
    flags = out['stages'][sid]['flags']
    stage = {'id': sid, 'title': st['title'], 'edit': st['edit']}
    scripts = f'<script>\n{(p6 / "sim.js").read_text(encoding="utf-8")}\n</script>\n'
    scripts += f'<script>\n{(here / "testroad.js").read_text(encoding="utf-8")}\n</script>\n'
    scripts += f'<script>\nwindow.DUMMIES_SIM = {json.dumps(flags)}; // Edit {st["edit"]} (P{sid}): registry {reg["registryVersion"]}; P6SIM, P7SIM, Prototype 9 flags, P10 defaults, then {sid}\n'
    scripts += f'window.DUMMIES_P10_STAGE = {json.dumps(stage)};\n</script>\n'
    scripts += f'<script>\n{(here / "game_p10.js").read_text(encoding="utf-8")}\n</script>\n'
    shell = (here / 'shell.html').read_text(encoding='utf-8').replace('{{TITLE}}', f'Prototype {sid} · {st["title"].title()}')
    page.write_text(shell.replace('<!--SCRIPTS-->', scripts), encoding='utf-8')
    print(f'{sid}: wrote {page.relative_to(root)} {page.stat().st_size} bytes; {len(flags)} values')
