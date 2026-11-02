#!/usr/bin/env python3
"""Prototype 10.1 build (GDD Edit 101): the Monument test road -> prototypes/p10/dummies_p10.html.

The page runs the base Sim (prototypes/p6/sim.js) with prototypes/p10/testroad.js and a greybox renderer (game_p10.js).
Its values: the P6–P7 prototype values the district builds inherit (WORLD6.P6SIM, STORY.P7SIM), then Prototype 9's
build flags (window.DUMMIES_SIM in dummies_p9.html), then Prototype 10's own. Shared files are not touched.
Also writes prototypes/p10/sim_flags.json, which the headless probes (qa/testroad.js) read.
"""
import json, re, subprocess
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

# Prototype 10.1: the test road; rung 0 (the red car learns nothing)
p10 = {
    'duel.enabled': 1, 'duel.carsOnRoad': 1, 'duel.redReturnSeconds': 4,      # the red car alone on the road; back after 4 s
    'proto.learningEnabled': 0, 'proto.learn.standoffEnabled': 0,             # rung 0; stop-line learning off (D101)
    'perception.forwardLength': 0, 'proto.driver.cautionZone': 0,            # rung 0 senses nothing: no forward beam, no driver's field (v1 PT4, L1)
    'run.appearances.road': 1000, 'run.quota.road': 1000000,                  # no shift end, no quota: free play
}
assert all(k in byid for k in p10), [k for k in p10 if k not in byid]
assert all(k in byid for k in p9sim), [k for k in p9sim if k not in byid]
flags = dict(inherited['P6SIM']); flags.update(inherited['P7SIM']); flags.update(p9sim); flags.update(p10)
(here / 'sim_flags.json').write_text(json.dumps({'registry': reg['registryVersion'], 'p10': p10, 'flags': flags}, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')

scripts = ''.join(f'<script>\n{(p6 / f).read_text(encoding="utf-8")}\n</script>\n' for f in ('sim.js',))
scripts += f'<script>\n{(here / "testroad.js").read_text(encoding="utf-8")}\n</script>\n'
scripts += f'<script>\nwindow.DUMMIES_SIM = {json.dumps(flags)}; // Edit 101 (P10.1): registry {reg["registryVersion"]}; P6SIM, P7SIM, Prototype 9 flags, then 10.1\n</script>\n'
scripts += f'<script>\n{(here / "game_p10.js").read_text(encoding="utf-8")}\n</script>\n'
shell = (here / 'shell.html').read_text(encoding='utf-8')
out = here / 'dummies_p10.html'
out.write_text(shell.replace('<!--SCRIPTS-->', scripts), encoding='utf-8')
print('wrote', out.relative_to(root), out.stat().st_size, 'bytes;', len(flags), 'values')
