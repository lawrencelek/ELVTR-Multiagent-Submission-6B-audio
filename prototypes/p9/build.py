#!/usr/bin/env python3
"""Prototype 9 (GDD Edit 100): sound. Prototype 8.4's game with the audio engine (p9/audio.js) and the cue map
(content/audio/cues.json, from the sound designer agent: audio/loop.py → audio/integrate.py). WAV effects and OGG music
load by URL from audio/ beside the page (an MP3 copy of each track for browsers without Ogg). Shared code changes are gated by
audio.enabled (window.DUMMIES_SIM), which this build alone sets to 1: Prototypes 8 to 8.4 stay frozen.
Bundles p9/shell.html + ../jump/jump.js + ../p6/sim.js, pixel.js, lab.js, circus_valley.js, world6.js, content.js
+ content/db/fleet.json + content/story/story_v2.json + p8/lore.js + ../p7/story.js + ../controls/pads.js
+ content/audio/cues.json + p9/audio.js + ../p6/game.js into dummies_p9.html."""
import json
import pathlib

here = pathlib.Path(__file__).resolve().parent
p6, p7, p8, root = here.parent / 'p6', here.parent / 'p7', here.parent / 'p8', here.parents[1]
shell = (here / 'shell.html').read_text(encoding='utf-8')
fleet = root / 'content' / 'db' / 'fleet.json'
story = root / 'content' / 'story' / 'story_v2.json'
cues = json.loads((root / 'content' / 'audio' / 'cues.json').read_text(encoding='utf-8'))
db = f'<script>\nwindow.FLEET_DB = {fleet.read_text(encoding="utf-8")};\n</script>\n'
db += f'<script>\nwindow.DUMMIES_STORY = {story.read_text(encoding="utf-8")};\n</script>\n'
scripts = f'<script>\n{(here.parent / "jump" / "jump.js").read_text(encoding="utf-8")}\n</script>\n'
scripts += ''.join(f'<script>\n{(p6 / f).read_text(encoding="utf-8")}\n</script>\n' for f in ('sim.js', 'pixel.js', 'lab.js', 'circus_valley.js', 'world6.js', 'content.js'))
scripts += db + f'<script>\n{(p8 / "lore.js").read_text(encoding="utf-8")}\n</script>\n'
# Edit 100: the build; the audio credit lines (Style Guide C1 widened to the makers of the licensed music and sound: proposed, D86)
cr = cues['credits']
credit_lines = ['Music by ' + cr['music'].replace(' on itch.io', ''), 'Sound effects by ' + cr['sfx'].replace(' on itch.io', '')]
scripts += ("<script>\nwindow.DUMMIES_LORE.build = 'P9'; // Edit 100: the build; the text is 8.3's (lore.js, Edit 98)\n"
            f"window.DUMMIES_CREDITS.lines = window.DUMMIES_CREDITS.lines.concat({json.dumps(credit_lines, ensure_ascii=False)}); // Edit 100: the pack's credits\n</script>\n")
reg = json.loads((root / 'content' / 'params' / 'tuning.parameters.json').read_text(encoding='utf-8'))
byid = {e['id']: e for e in reg['entries']}
sim = dict({'arcade.grades': 1, 'ui.introScreen': 1, 'ui.levelCard': 1, 'world.droneDropIn': 1, 'ui.storySplash': 1},  # Edit 98 (P8.3)
           **{k: byid[k]['default'] for k in ('arcade.grade.healthStep', 'arcade.grade.densityStep', 'arcade.grade.max', 'highscore.tableSize', 'ui.intro.loopSeconds', 'ui.splash.cycleSeconds')})
sim.update({'proto.driver.coneSteepPass': 1, 'proto.art.beamStraight': 1, 'proto.art.brakeGlowStopped': 1, 'proto.art.spentGrey': 1, 'ui.cueKey.simple': 1, 'ui.layerEdgeFix': 1,  # Edit 99 (P8.4)
            'proto.art.noticeFlashHz': 4, 'proto.droneConeSeconds': 0, 'proto.stopCue': 0})
sim.update({'audio.enabled': 1, 'story.coneBaitSeconds': 6, 'story.floorHold': 1, 'ui.hud.bodyCeil': 1, 'ui.spentTick': 1, 'proto.contactGraceSeconds': 0.3, 'proto.driver.dodgeFollowsCone': 1, 'ui.lampsOnCar': 1, 'ui.pause.quiet': 1, 'proto.droneConeSeconds': 5, 'ui.conesXray': 1})  # Edit 100 (P9): the audio engine on; the cone brief and the floor (row 620); the spent tick (row 624); the contact grace (row 630); a moved cone frees the lane (row 632); the lamps on the car, a quiet pause page (rows 634, 635); a drone fetches a lane cone after 5 s (row 636). Registry defaults 0
assert all(k in byid for k in sim), [k for k in sim if k not in byid]
scripts += f'<script>\nwindow.DUMMIES_SIM = {json.dumps(sim)}; // Edit 97–100 (P8.2–9): registry {reg["registryVersion"]}; the flags 1 here (registry default 0)\n</script>\n'
scripts += f'<script>\n{(p7 / "story.js").read_text(encoding="utf-8")}\n</script>\n'
scripts += f'<script>\n{(here.parent / "controls" / "pads.js").read_text(encoding="utf-8")}\n</script>\n'
scripts += f'<script>\nwindow.DUMMIES_CUES = {json.dumps(cues, ensure_ascii=False)}; // Edit 100: content/audio/cues.json\n</script>\n'
scripts += f'<script>\n{(here / "audio.js").read_text(encoding="utf-8")}\n</script>\n'
scripts += f'<script>\n{(p6 / "game.js").read_text(encoding="utf-8")}\n</script>\n'
out = here / 'dummies_p9.html'
full = shell.replace('<!--SCRIPTS-->', scripts)
out.write_text(full, encoding='utf-8')
dir_ = lambda f: cues['files'].get(f, {}).get('dir', 'sfx')
missing = [f for c in cues['sfx'].values() for f in c.get('files', []) + c.get('alternates', []) + ([c['tone']] if c.get('tone') else []) if not (here / 'audio' / dir_(f) / f).exists()]
missing += [t['file'] for t in cues['music']['tracks'].values() if not (here / 'audio' / t['file']).exists()]
missing += [t['mp3'] for t in cues['music']['tracks'].values() if not (here / 'audio' / t['mp3']).exists()]
assert not missing, missing
print(out.name, out.stat().st_size, 'bytes;', sum(c['decision'] == 'cue' for c in cues['sfx'].values()), 'cues; every audio file present')
