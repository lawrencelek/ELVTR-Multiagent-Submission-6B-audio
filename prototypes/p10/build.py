#!/usr/bin/env python3
"""Prototype 10 build (GDD Edits 101–107): the Monument test road, one page per test.

    python3 prototypes/p10/build.py          # writes sim_flags.json and every page not frozen

Each page runs the base Sim (prototypes/p6/sim.js) with prototypes/p10/testroad.js and a greybox renderer (game_p10.js).
Its values, in order: the P6–P7 prototype values the district builds inherit (WORLD6.P6SIM, STORY.P7SIM), Prototype 9's
build flags (window.DUMMIES_SIM in dummies_p9.html), every Prototype P10 registry entry at its default, then the test's own.
Shared files are not touched. sim_flags.json holds every test's values for the headless probes (qa/testroad.js).

A test's page freezes once its human pass may use it, and is never rewritten (md5 below): 10.1 (dummies_p10.html, built
at 4b3d668), 10.2 (dummies_p10_2.html, built at eab988b), 10.3 (dummies_p10_3.html, built at c3b0177), 10.4 (dummies_p10_4.html, built with
row 685's rule), 10.5 (dummies_p10_5.html, built at b4361dc) and 10.6 (dummies_p10_6.html, built at 37fa80b). Their values still live here, so the probes rerun them on today's code. 10.0 has no page: it measured Prototype 9 as built.
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
# Prototype 10.3: from rung 1, a hit from the side teaches rung 2, the side sensors; the jump arrives at its first swerve
T103 = dict(T102, **{
    'duel.startRung': 1, 'duel.topRung': 2,  # one lesson: rung 1 to rung 2 (row 673)
    'duel.dashArrives': 3,                   # Battery 1 fitted from the start: 10.2's part
    'duel.jumpArrives': 2,                   # Legs 1 by drone at the car's first swerve away from the dummy (row 673)
    'proto.driver.cautionZone': 180,         # rung 2's field either side of its path: Prototype 9's driver's field, now the zone that acts (row 674)
    'perception.sideNoticeSeconds': 0.6,     # strong front, weak edges: twice the front's perception.reactionDelay (row 674)
})
# Prototype 10.4: from rung 2, a hit from above teaches rung 3, the roof lidar: it sees height. No new part
T104 = dict(T103, **{
    'duel.startRung': 2, 'duel.topRung': 3,  # one lesson: rung 2 to rung 3 (row 679)
    'duel.jumpArrives': 3,                   # Legs 1 fitted from the start: 10.3's part
})
# Prototype 10.5: from rung 3, a hit out of cover teaches rung 4, the street cameras: it sees behind cover. Hands 1, the
# cones, arrive at its first stop for a dummy only its cameras see
T105 = dict(T104, **{
    'duel.startRung': 3, 'duel.topRung': 4,  # one lesson: rung 3 to rung 4 (row 687)
    'duel.conesArrives': 2,                  # Hands 1 by drone at the car's first stop for a dummy behind cover (row 687)
})
# Prototype 10.6: from rung 4, a hit while it swerves round a cone teaches rung 5: it stops at a cone and never swerves.
# DUCK arrives at its first stop at a cone; low planter rows stand by the road (row 695)
T106 = dict(T105, **{
    'duel.startRung': 4, 'duel.topRung': 5,  # one lesson: rung 4 to rung 5 (row 695)
    'duel.conesArrives': 3,                  # Hands 1 fitted from the start: 10.5's part
    'duel.duckArrives': 2,                   # DUCK by drone at the car's first stop at a cone (row 695)
    'duel.planters': 1,                      # three low planter rows by the road: cover for a ducked dummy (row 696)
    'props.planter.height': 14, 'body.duckHeight': 6, 'movement.duckSpeedFactor': 0.35, 'perception.duckNoticeFactor': 1.5,  # DUCK (row 696)
    'perception.sensorHeight': 14, 'perception.lidarHeight': 26, 'perception.streetCameraHeight': 60,                       # sightlines by height (row 697)
    'perception.streetCameraRange': 180,     # each camera watches the cover near its post: the barrier, the building corner (row 697)
})
# Prototype 10.7: from rung 5, a hit sprung from the spot of an earlier crash teaches rung 6, crash memory: it expects you
# where you struck from before. Every crash leaves a chalk outline. A shorter run-in and a lighter body (row 703; D117)
T107 = dict(T106, **{
    'duel.startRung': 5, 'duel.topRung': 6,  # one lesson: rung 5 to rung 6 (row 703)
    'duel.duckArrives': 3,                   # DUCK fitted from the start: 10.6's part
    'duel.memoryRadius': 50, 'duel.memorySites': 3,  # a crash's spot; the latest three remembered: counters are capped and fall back (row 704)
    'duel.runInLength': 200,                 # the car appears 200 before the edge, not 771 (D117: Lawrence, "shorter drive-in")
    'duel.redReturnSeconds': 2,              # back 2 s after it leaves: the empty road between passes falls from 5.2 s to 2 s
    'proto.health.standard': 500,            # the test road's body: 500, not 800 (D117: Lawrence, "lighter body … 500 health")
    'duel.blockSeconds': 10,                 # a car kept waiting 10 s for the dummy calls a drone to lift it aside (row 715)
})
STAGES = {
    '10.1': {'title': 'THE TEST ROAD', 'page': 'dummies_p10.html', 'frozen': '82ab5e55d243ee500d6dfcaa60af74e6', 'edit': 101, 'values': T101},
    '10.2': {'title': 'THE FIRST LESSON', 'page': 'dummies_p10_2.html', 'frozen': '9dd14c5877128390fbad2595e86edce7', 'edit': 102, 'values': T102},
    '10.3': {'title': 'THE SIDE SENSORS', 'page': 'dummies_p10_3.html', 'frozen': '5aed8e43a39631596233903de95ca5d7', 'edit': 103, 'values': T103},
    '10.4': {'title': 'THE ROOF LIDAR', 'page': 'dummies_p10_4.html', 'frozen': 'b12b48d8dee90294829366f07ef7d1b6', 'edit': 104, 'values': T104},
    '10.5': {'title': 'THE STREET CAMERAS', 'page': 'dummies_p10_5.html', 'frozen': '252785354962f8ac050f022b251bd29f', 'edit': 105, 'values': T105},
    '10.6': {'title': 'DUCK', 'page': 'dummies_p10_6.html', 'frozen': '7acd08d2cc239e1743f2b85786ce411e', 'edit': 106, 'values': T106},
    '10.7': {'title': 'CRASH MEMORY', 'page': 'dummies_p10_7.html', 'frozen': None, 'edit': 107, 'values': T107},
}
CURRENT = '10.7'

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
    scripts = f'<script>\n{(root / "prototypes" / "jump" / "jump.js").read_text(encoding="utf-8")}\n</script>\n' if st['edit'] >= 103 else ''  # the jump's rules (sim.js reads window.JUMP)
    scripts += f'<script>\n{(p6 / "sim.js").read_text(encoding="utf-8")}\n</script>\n'
    scripts += f'<script>\n{(here / "testroad.js").read_text(encoding="utf-8")}\n</script>\n'
    scripts += f'<script>\nwindow.DUMMIES_SIM = {json.dumps(flags)}; // Edit {st["edit"]} (P{sid}): registry {reg["registryVersion"]}; P6SIM, P7SIM, Prototype 9 flags, P10 defaults, then {sid}\n'
    scripts += f'window.DUMMIES_P10_STAGE = {json.dumps(stage)};\n</script>\n'
    scripts += f'<script>\n{(here / "game_p10.js").read_text(encoding="utf-8")}\n</script>\n'
    shell = (here / 'shell.html').read_text(encoding='utf-8').replace('{{TITLE}}', f'Prototype {sid} · {st["title"].title()}')
    page.write_text(shell.replace('<!--SCRIPTS-->', scripts), encoding='utf-8')
    print(f'{sid}: wrote {page.relative_to(root)} {page.stat().st_size} bytes; {len(flags)} values')
