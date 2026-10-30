#!/usr/bin/env python3
"""Prototype 8.4 (GDD Edit 99): fixes from play. Cars steer round cones; straight headlight beams; a car that has noticed the dummy
flashes its headlights; brake lights held when braking for safety; spent cars grey; a seven-row cue key; whole cars at the bottom
edge. No text change: the lore layer is 8.3's. Prototypes 8 to 8.3 stay frozen. Prototype 8.3 (GDD Edit 98): the intro screen, the level card in both modes, the drone drop, the Story splash; tales of 15 to 20
words; goals. Prototypes 8 to 8.2 stay frozen. Prototype 8.2 (GDD Edit 97): tales redrafted (15 to 35 words); Arcade's grades; the high scores. window.DUMMIES_SIM carries
Prototype 8.2's values from the registry (arcade.grades, arcade.grade.*, highscore.tableSize). Prototypes 8 and 8.1 stay frozen.
Prototype 8.1 (GDD Edit 96): Prototype 8 with tales of up to 35 words and the CBD and Campus districts in the lore. Prototype 8 (GDD Edit 95): Prototype 7.13 under the lore refinement. Dummy Corporation narrates; Farsight, the publisher, is named
only on the Credits card. Gameplay is 7.13's. Bundles p8/shell.html + ../jump/jump.js + ../p6/sim.js, pixel.js, lab.js, circus_valley.js,
world6.js, content.js + content/db/fleet.json + content/story/story_v2.json + p8/lore.js + ../p7/story.js + ../controls/pads.js
+ ../p6/game.js into one self-contained dummies_p8_3.html, and p8_3_page.html for a host. Prototypes 7 to 7.13 stay frozen.
The shared code reads the lore layer only when it is bundled (window.DUMMIES_LORE, window.DUMMIES_CREDITS)."""
import json
import pathlib

here = pathlib.Path(__file__).resolve().parent
p6, p7, root = here.parent / 'p6', here.parent / 'p7', here.parents[1]
shell = (here / 'shell.html').read_text(encoding='utf-8')
fleet = root / 'content' / 'db' / 'fleet.json'           # the fleet database (decision 117); lore.js patches its text in the page
story = root / 'content' / 'story' / 'story_v2.json'     # Edit 95: the story's text in Dummy Corporation's voice; gameplay as story.json
db = f'<script>\nwindow.FLEET_DB = {fleet.read_text(encoding="utf-8")};\n</script>\n'
db += f'<script>\nwindow.DUMMIES_STORY = {story.read_text(encoding="utf-8")};\n</script>\n'
scripts = f'<script>\n{(here.parent / "jump" / "jump.js").read_text(encoding="utf-8")}\n</script>\n'
scripts += ''.join(f'<script>\n{(p6 / f).read_text(encoding="utf-8")}\n</script>\n' for f in ('sim.js', 'pixel.js', 'lab.js', 'circus_valley.js', 'world6.js', 'content.js'))
scripts += db + f'<script>\n{(here / "lore.js").read_text(encoding="utf-8")}\n</script>\n'   # Edit 95: after the content and the fleet, before the game
scripts += "<script>\nwindow.DUMMIES_LORE.build = 'P8.4'; // Edit 99: the build; the text is 8.3's (lore.js, Edit 98)\n</script>\n"
reg = json.loads((root / 'content' / 'params' / 'tuning.parameters.json').read_text(encoding='utf-8'))
byid = {e['id']: e for e in reg['entries']}
sim8 = dict({'arcade.grades': 1, 'ui.introScreen': 1, 'ui.levelCard': 1, 'world.droneDropIn': 1, 'ui.storySplash': 1},  # Edit 98 (P8.3): the flags on; registry defaults 0
            **{k: byid[k]['default'] for k in ('arcade.grade.healthStep', 'arcade.grade.densityStep', 'arcade.grade.max', 'highscore.tableSize', 'ui.intro.loopSeconds', 'ui.splash.cycleSeconds')})
sim8.update({'proto.driver.coneSteepPass': 1, 'proto.art.beamStraight': 1, 'proto.art.brakeGlowStopped': 1, 'proto.art.spentGrey': 1, 'ui.cueKey.simple': 1, 'ui.layerEdgeFix': 1,  # Edit 99 (P8.4): the flags on
             'proto.art.noticeFlashHz': 4, 'proto.droneConeSeconds': 0, 'proto.stopCue': 0})  # Edit 99: values for this build (registry defaults 0, 5, 1)
assert all(k in byid for k in sim8), [k for k in sim8 if k not in byid]
scripts += f'<script>\nwindow.DUMMIES_SIM = {json.dumps(sim8)}; // Edit 97–99 (P8.2–8.4): registry {reg["registryVersion"]}; the flags 1 here (registry default 0)\n</script>\n'
scripts += f'<script>\n{(p7 / "story.js").read_text(encoding="utf-8")}\n</script>\n'
scripts += f'<script>\n{(here.parent / "controls" / "pads.js").read_text(encoding="utf-8")}\n</script>\n' + f'<script>\n{(p6 / "game.js").read_text(encoding="utf-8")}\n</script>\n'
out = here / 'dummies_p8_4.html'   # Edit 99: Prototypes 8 to 8.3 (dummies_p8.html to dummies_p8_3.html and their pages) are frozen
full = shell.replace('<!--SCRIPTS-->', scripts)
out.write_text(full, encoding='utf-8')
print(out.name, out.stat().st_size, 'bytes')
head = full.split('<head>', 1)[1].split('</head>', 1)[0]
head = '\n'.join(l for l in head.splitlines() if not l.startswith('<meta charset') and not l.startswith('<meta name="viewport"'))
body = full.split('<body>', 1)[1].rsplit('</body>', 1)[0]
page = here / 'p8_4_page.html'
page.write_text(head.strip() + '\n' + body.strip() + '\n', encoding='utf-8')
print(page.name, page.stat().st_size, 'bytes')
