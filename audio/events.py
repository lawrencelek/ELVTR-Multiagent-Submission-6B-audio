"""Event catalogue: every point in Prototype 9 where a sound can trigger. No model.

Generated from the code, so it cannot drift from the build:
  - emitted events: every `emit('<type>'` in sim.js, world6.js and story.js, with file and line;
  - derived events: every `present(s, '<type>'` in game.js;
  - today's synth: the cases of game.js's processEvents switch that call Snd/horn/giftChime/giftFanfare,
    and the hit-juice layers in content.js that carry a `sound`;
  - screens and phases: every `app.screen = '<name>'` and `phase = '<name>'`.
The annotation table below adds what code cannot say: the group, a plain label, the frequency class, the priority,
what can fire together, the GDD source, the screenshot of the moment, and the variants a cue may split on.

An emitted or derived event with no annotation fails the run; so does an annotation for an emitted event the code no
longer has. New P9 hooks (kind 'new' or 'ui') are fired by game.js's audio hooks, so code search finds them there.

    python3 audio/events.py      → content/audio/events.json
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
P = ROOT / "prototypes"
SRC = {"S": P / "p6" / "sim.js", "W": P / "p6" / "world6.js", "T": P / "p7" / "story.js", "G": P / "p6" / "game.js"}
OUT = ROOT / "content" / "audio" / "events.json"

GROUPS = [  # display order (the Sound Lab, the GDD tables)
    ("ui", "Menus and interface"), ("moves", "Dummy moves"), ("abilities", "Abilities"), ("hits", "Hits and damage"),
    ("near", "Near-misses"), ("cones", "Cones"), ("combos", "Combos"), ("world", "World"), ("cars", "Cars"),
    ("drones", "Drones"), ("story", "Story beats"), ("arcade", "Arcade"), ("barks", "Barks"), ("intro", "Intro screen"),
]
FREQ = {
    "once": "once per occurrence: a beat in the run",
    "action": "once per player action",
    "burst": "a few per second at most",
    "frame": "logged on every contact frame: needs a cooldown",
    "ambient": "traffic chatter: many per minute, from any car",
}

# id: (group, label, what happens, freq, priority, fires with, GDD source, screenshot, kind, variants)
# kind: sim (emitted), derived (game.js present), new (Prototype 9 hook in game.js), ui (menu queue)
# variants: [(variant id, when, label)]; `when` keys are event fields (game.js adds big, max, at, repeat)
E = {
    # ---- interface
    "ui-move": ("ui", "Cursor moves", "A menu cursor moves: arrows, stick, d-pad, WASD.", "action", "high", [], "Edit 81, 86", "title", "ui", []),
    "ui-ok": ("ui", "Confirm", "A menu choice is confirmed: A, Space, Enter, a tap or a click.", "action", "high", [], "Edit 81, 89", "title", "ui", []),
    "ui-back": ("ui", "Back", "A menu goes back or closes: B, Shift, Esc on a page.", "action", "high", [], "Edit 86, 88", "saves", "ui", []),
    "ui-pause": ("ui", "Pause opens", "Play pauses: Esc, P, START or the pause chip.", "action", "medium", [], "Edit 86", "pause", "ui", []),
    "ui-start": ("ui", "START", "START on the intro screen opens the mode select.", "once", "high", [], "Edit 98", "intro", "ui", []),
    "ui-gate": ("ui", "Press any key", "The first press on the intro screen unlocks audio; Track 1 starts.", "once", "low", [], "Edit 100", "intro", "ui", []),
    # ---- dummy moves
    "lunge": ("moves", "Dash", "The dummy dashes (A). Spends a battery charge.", "action", "high", ["impact", "combo", "jump"], "Edit 75, 90", "dash", "sim",
              [("lunge.wrecked", {"wear": {"min": "audio.sfx.dashWreckedAt"}}, "Dash, very damaged"),  # Lawrence, row 629: the chassis's wear picks the take
               ("lunge.damaged", {"wear": {"min": "audio.sfx.dashDamagedAt", "max": "audio.sfx.dashWreckedAt"}}, "Dash, damaged")]),
    "jump": ("moves", "Jump", "The dummy jumps (B). A jump out of a dash is a long jump.", "action", "high", ["lunge"], "Edit 75, 76, 90", "jump", "sim",
             [("jump.dash", {"kind": "dash"}, "Long jump, out of a dash")]),
    "jump-land": ("moves", "Jump lands", "A jump lands on the ground.", "action", "medium", ["impact"], "Edit 76", "jump", "sim", []),
    "land": ("moves", "Drop lands", "A drop from a walkway or deck lands, on a car or on the ground.", "action", "medium", ["impact", "deck-drop"], "Edit 42", "jump", "sim",
             [("land.car", {"car": "*"}, "Onto a car roof")]),
    "deck-drop": ("moves", "Drop off a deck", "The dummy steps off a highway parapet or ledge.", "action", "medium", ["land"], "Edit 42", "play", "sim", []),
    "rail-jump": ("moves", "Over the rail", "The dummy jumps a walkway rail.", "action", "low", [], "Edit 69", "play", "sim", []),
    "stair": ("moves", "Stairs", "The dummy starts up or down a stair.", "action", "low", [], "Edit 63", "play", "sim", []),
    "level": ("moves", "New level", "The dummy reaches a new level: walkway, deck, roof.", "action", "low", ["stair"], "Edit 42, 44", "play", "sim", []),
    "slip": ("moves", "Slip on water", "A dash is refused on a puddle.", "action", "medium", ["denied"], "D18", "play", "sim", []),
    # ---- abilities
    "push": ("abilities", "Push off a car", "Arms: the dummy pushes off a car (Y).", "action", "high", [], "Edit 80", "play", "sim", []),
    "hitch": ("abilities", "Hitch a car", "The dummy grabs a passing car (X).", "action", "high", [], "Edit 79", "play", "sim", []),
    "sling": ("abilities", "Sling off", "The dummy lets go of a hitched car with speed.", "action", "high", [], "Edit 79", "play", "sim", []),
    "denied": ("abilities", "Denied", "A move is refused: no charge, or not fitted yet.", "action", "medium", ["slip"], "Edit 90", "play", "sim",
               [("denied.locked", {"why": "locked"}, "Not fitted yet")]),
    # ---- hits and damage
    "impact": ("hits", "Hit", "A car hits the dummy. Damage, points, the burst.", "burst", "high", ["combo", "writeoff", "held", "learn-standoff", "part-break", "low-health", "land"], "Edit 26, 75", "impact", "sim",
               [("impact.big", {"big": True}, "A big hit"), ("impact.drop", {"drop": True}, "A drop onto a car")]),
    "held": ("hits", "Chassis held", "Story: a hit that misses the brief; the chassis holds at the floor.", "once", "medium", ["impact"], "Edit 91", "impact", "sim", []),
    "knock": ("hits", "Knock", "A car shoves the dummy without damage.", "frame", "medium", [], "Edit 70", "play", "sim", []),
    "touch-spent": ("hits", "Spent car", "The dummy touches a spent car: no reward.", "frame", "low", [], "Edit 70, 99", "play", "sim", []),
    "writeoff": ("hits", "Write-off", "The chassis is written off: health reaches zero.", "once", "high", ["impact", "combo", "ending", "credit"], "Edit 26", "writeoff", "sim", []),
    "chassis": ("hits", "New chassis", "A chassis is issued: at a level's start, under the card, and after each write-off.", "once", "medium", [], "Edit 26", "play", "sim",
                [("chassis.start", {"start": True}, "At a level's start, under the level card")]),
    "part-break": ("hits", "Part breaks", "A body part reaches broken (level 3).", "once", "medium", ["impact"], "Edit 91", "impact", "new", []),
    "low-health": ("hits", "Low health", "The chassis falls below audio.sfx.lowHealthAt of its maximum.", "once", "medium", ["impact"], "Edit 100", "impact", "new", []),
    # ---- near-misses
    "near-miss": ("near", "Near-miss", "A fast car passes close without touching.", "burst", "medium", [], "Edit 37", "play", "derived", []),
    "miss": ("near", "Dash misses", "A dash ends with no contact.", "action", "low", ["lunge"], "Edit 37", "dash", "derived", []),
    # ---- cones
    "pickup": ("cones", "Cone picked up", "The dummy picks up a cone (X).", "action", "high", [], "Edit 78, 80", "cones", "sim", []),
    "drop": ("cones", "Cone set down", "The dummy sets a cone down.", "action", "medium", [], "Edit 78", "cones", "sim", []),
    "throw": ("cones", "Cone thrown", "The dummy throws a cone.", "action", "high", [], "Edit 79", "cones", "sim", []),
    "punt": ("cones", "Cone kicked", "The dummy walks into a cone and kicks it.", "action", "low", [], "Edit 90", "cones", "sim", []),
    "cone-hit": ("cones", "Cone hit", "A cone makes a car stop or crash: points.", "once", "high", ["combo"], "Edit 78", "cones", "sim", []),
    "cone-struck": ("cones", "Car strikes a cone", "A car runs into a cone.", "ambient", "low", ["cone-hit"], "Edit 99", "cones", "sim", []),
    "cone-stop": ("cones", "Cone stops", "A thrown cone stops sliding.", "ambient", "low", [], "Edit 78", "cones", "sim", []),
    "cone-rest": ("cones", "Cone at rest", "A cone settles.", "ambient", "low", [], "Edit 78", "cones", "sim", []),
    "cone-release": ("cones", "Cone released", "Carried cones fall when the dummy is written off.", "once", "low", ["writeoff"], "Edit 80", "cones", "sim", []),
    # ---- combos
    "combo": ("combos", "Combo", "A hit extends a combo (two or more).", "burst", "high", ["impact"], "Edit 79", "combo", "sim",
              [("combo.max", {"max": True}, "At the combo cap (scoring.comboMax)")]),
    "combo-end": ("combos", "Combo banked", "The combo clock runs out; the combo is banked.", "once", "medium", [], "Edit 79", "combo", "sim", []),
    # ---- world
    "splash": ("world", "Into the river", "The dummy falls into the river.", "once", "high", ["drone-dispatch"], "D37", "river", "sim", []),
    "rescued": ("world", "River rescue", "A drone recovers the chassis from the river.", "once", "medium", [], "D37", "river", "sim", []),
    "screen": ("world", "Screen flip", "The view moves to a neighbouring tile.", "action", "medium", [], "D24", "play", "sim", []),
    # ---- cars
    "honk": ("cars", "Honk", "A blocked car honks, at the dummy or at a cone.", "burst", "high", [], "Edit 70, 99", "play", "sim",
             [("honk.body", {"at": "body"}, "At the dummy; repeats while it blocks")]),
    "skid": ("cars", "Skid", "A car skids on a puddle.", "ambient", "medium", [], "D18", "play", "sim", []),
    "unstick": ("cars", "Car reverses", "A stuck car reverses or replans.", "ambient", "low", [], "Edit 72", "play", "sim",
                [("unstick.reverse", {"how": "reverse"}, "Reversing beeps")]),
    "learn-standoff": ("cars", "Model learns", "A car model learns to stop further back.", "once", "medium", ["impact"], "Edit 39", "play", "sim", []),
    "car-notice": ("cars", "Car notices you", "A car's headlights start to flash: it has noticed the dummy.", "burst", "medium", [], "Edit 99", "play", "new", []),
    "car-brake": ("cars", "Car brakes", "A car's brake lights come on as it brakes for safety.", "ambient", "low", [], "Edit 99", "play", "new", []),
    "commit": ("cars", "Car commits", "A car commits to a manoeuvre.", "ambient", "low", [], "Edit 70", "play", "sim", []),
    "interrupt": ("cars", "Car interrupted", "A car's manoeuvre is interrupted.", "ambient", "low", [], "Edit 70", "play", "sim", []),
    "resume": ("cars", "Car resumes", "A car resumes after an interruption.", "ambient", "low", [], "Edit 70", "play", "sim", []),
    "release": ("cars", "Car released", "A car is released from a hold.", "ambient", "low", [], "Edit 72", "play", "sim", []),
    "ring": ("cars", "Roundabout lane", "A car changes ring on a roundabout.", "ambient", "low", [], "Edit 72", "play", "sim", []),
    "gridlock": ("cars", "Gridlock", "Traffic locks on a layer.", "once", "low", [], "Edit 72", "play", "sim", []),
    "gridlock-clear": ("cars", "Gridlock clears", "Locked traffic clears.", "once", "low", [], "Edit 72", "play", "sim", []),
    "admit": ("cars", "Car enters", "A car enters the screen.", "ambient", "low", [], "Edit 70", "play", "sim", []),
    "exit": ("cars", "Car leaves", "A car leaves the screen.", "ambient", "low", [], "Edit 70", "play", "sim", []),
    "contact-ignored": ("cars", "Contact ignored", "A contact that scores nothing.", "frame", "low", [], "Edit 70", "play", "sim", []),
    "touch": ("cars", "Touch", "A zero-speed touch.", "frame", "low", [], "Edit 70", "play", "sim", []),
    # ---- drones
    "drone-dispatch": ("drones", "Drone dispatched", "A Corporation drone sets off: to clear a cone, or to the river.", "once", "medium", ["splash"], "Edit 70", "drone", "sim",
                       [("drone-dispatch.rescue", {"rescue": True}, "To the river")]),
    "drone-pickup": ("drones", "Drone lifts a cone", "The drone lifts a cone.", "once", "low", [], "Edit 70", "drone", "sim", []),
    "drone-drop": ("drones", "Drone sets a cone down", "The drone sets the cone down.", "once", "low", [], "Edit 70", "drone", "sim", []),
    "drop-in": ("drones", "Drone drop begins", "A level starts: a drone carries the dummy in.", "once", "high", [], "Edit 98", "drop", "sim", []),
    "dropped-in": ("drones", "Dummy set down", "The drone sets the dummy down; play starts.", "once", "medium", [], "Edit 98", "drop", "sim", []),
    # ---- story
    "story-enter": ("story", "Tile in test", "The dummy is in the tile in test.", "once", "medium", [], "Edit 81", "card", "sim", []),
    "story-count": ("story", "Counted", "A write-off counts toward the brief.", "once", "high", ["writeoff"], "Edit 81", "story", "sim", []),
    "story-miss": ("story", "Not counted", "A write-off does not count.", "once", "medium", ["writeoff"], "Edit 81", "story", "sim", []),
    "story-clear": ("story", "Tile cleared", "The tile's brief is met.", "once", "high", ["story-count", "writeoff"], "Edit 81", "story", "sim", []),
    "story-gift": ("story", "Credit gift", "Dummy Corporation gifts credits on arrival.", "once", "medium", [], "Edit 84", "story", "sim", []),
    "story-deliver": ("story", "Delivery drone", "A drone brings this tile's part.", "once", "medium", ["story-enter"], "Edit 84", "story", "sim", []),
    "story-ferry": ("story", "Ferry", "A drone carries the dummy to the next tile.", "once", "medium", [], "Edit 83", "ferry", "sim", []),
    "story-ferried": ("story", "Ferried", "The ferry sets the dummy down on the next tile.", "once", "low", [], "Edit 83", "ferry", "sim", []),
    "story-fence": ("story", "Fence", "The dummy meets a tile's fence.", "action", "medium", [], "Edit 81", "story", "sim", []),
    "gift": ("story", "Gift screen", "A part falls, lands and is fitted: the gift screen.", "once", "high", ["story-gift"], "Edit 84", "gift", "sim", []),
    "delivered": ("story", "Delivery done", "The delivery drone leaves.", "once", "low", [], "Edit 84", "story", "sim", []),
    "unveil": ("story", "Unveiling", "The finale: the monument and its plaque.", "once", "high", [], "Edit 94", "plaque", "sim", []),
    "unveil-lift": ("story", "Cloth lifts", "The cloth comes off the monument.", "once", "high", ["unveil"], "Edit 94", "plaque", "new", []),
    "voyage": ("story", "Voyage", "A drone lifts the dummy toward the ship.", "once", "medium", [], "Edit 94", "certified", "sim", []),
    "voyage-end": ("story", "At the ship", "The dummy is set down at the ship: CERTIFIED.", "once", "medium", ["ending"], "Edit 94", "certified", "sim", []),
    # ---- arcade
    "shop-open": ("arcade", "Workshop opens", "The workshop opens after a report.", "once", "low", [], "Edit 89", "workshop", "sim", []),
    "purchase": ("arcade", "Part fitted", "A part is bought and fitted.", "action", "high", [], "Edit 89", "workshop", "sim", []),
    "purchase-denied": ("arcade", "Cannot buy", "A purchase is refused.", "action", "medium", [], "Edit 89", "workshop", "sim", []),
    "shop-skip": ("arcade", "Workshop skipped", "Story: nothing to buy; the workshop is skipped.", "once", "low", [], "Edit 89", "workshop", "sim", []),
    "credit": ("arcade", "Credits paid", "Credits are paid for a write-off.", "once", "low", ["writeoff"], "Edit 82", "report", "sim", []),
    "road-cleared": ("arcade", "Road cleared", "Arcade: the road's quota is met.", "once", "medium", [], "Edit 81", "report", "sim", []),
    "grade": ("arcade", "Grade up", "Arcade: the grade rises; tougher chassis, denser traffic.", "once", "high", ["writeoff"], "Edit 97", "report", "sim", []),
    "ending": ("arcade", "Ending", "A run ends: Licensed, Certified, Failed test or Non-compliant.", "once", "high", ["writeoff"], "Edit 97, 94", "ending", "sim",
               [("ending.win", {"kind": ["Licensed", "Certified"]}, "Licensed or Certified"), ("ending.fail", {"kind": ["Failed test", "Non-compliant"]}, "Failed test or Non-compliant")]),
    "milestone": ("arcade", "Milestone", "An internal first (first hit, first combo).", "once", "low", [], "Edit 70", "play", "sim", []),
    # ---- barks
    "bark": ("barks", "Bark bubble", "A car's line appears in the message strip.", "burst", "medium", [], "Edit 26, 70", "play", "new",
             [("bark.shout", {"style": "shout"}, "A shouted line")]),
    # ---- intro
    "intro-hit": ("intro", "Intro hit", "The intro loop: the car meets the dummy.", "once", "low", [], "Edit 98", "intro", "new", []),
    # ---- derived lore cases: barks only
    "learned": ("barks", "Model returns", "A model that learned returns and says so (a bark).", "once", "low", ["bark"], "D23", "play", "derived", []),
    "upgrade-seen": ("barks", "Upgrade seen", "A car remarks on a new module (a bark).", "once", "low", ["bark"], "D23", "play", "derived", []),
    "part-seen": ("barks", "Broken part seen", "A car remarks on a broken part (a bark).", "once", "low", ["bark"], "D23", "play", "derived", []),
}

# Music states: what the game shows → the state the engine plays (prototypes/p9/audio.js, musicState)
MUSIC = [
    ("intro", "Intro screen", "DUMMIES, the front-on animation, START (after the first press).", "app.screen 'intro'", "intro", "Edit 98"),
    ("menu", "Menus", "Mode select, save slots, name entry, Story splash, map, district select, high scores. Loading holds the track playing.", "app.screen title, saves, splash, storymap, arcade, scores", "title", "Edit 81, 88, 97, 98"),
    ("credits", "Credits card", "The Credits card, from the title or the ending.", "app.credits", "credits", "Edit 95"),
    ("card", "Level card", "Every level card: a district's start, and each new tile after the ferry. It starts the level's track (Lawrence, Q2).", "phase 'brief'", "card", "Edit 98"),
    ("level", "Levels", "Play, the drone drop, flips, ferries. The track holds from its card to the next card (Lawrence, Q3).", "app.screen 'game', phases play, drop, scroll, hitstop", "play", "Edit 81, 98"),
    ("screens", "Gift, report, workshop", "The gift screen, the level report and the workshop: the level track at 70% (Lawrence, Q4).", "phases gift, report, shop", "report", "Edit 82, 84"),
    ("writeoff", "Write-off", "The write-off hold: the level track at 50% (Lawrence, Q5).", "phase 'writeoff'", "writeoff", "Edit 26"),
    ("pause", "Pause", "Pause, options, controls: the level track at 35%.", "app.paused", "pause", "Edit 86"),
    ("licensed", "Licensed", "A run ends licensed: the quota met (Lawrence: its own track).", "phase 'ending', kind Licensed", "ending", "Edit 97"),
    ("failed", "Failed test", "A run ends failed: the cars ran out first (Lawrence: its own track).", "phase 'ending', kind Failed test", "failed", "Edit 97"),
    ("noncompliant", "Non-compliant", "A run ends in refusal (Lawrence: its own track).", "phase 'ending', kind Non-compliant", "refused", "Edit 97"),
    ("cleared", "Tile cleared", "A Story tile cleared: from its clear through the write-off, the report, the ferry and the gift screen, to the next card. Its own music, at full level; only pause ducks it (Lawrence).", "event story-clear, until the next card", "story", "Edit 100"),
    ("finale", "Finale", "The unveiling and the voyage.", "phase unveil, voyage", "plaque", "Edit 94"),
    ("certified", "At the ship", "The dummy set down at the ship: CERTIFIED (Lawrence: its own track).", "phase 'ending', kind Certified", "certified", "Edit 94"),
]


def scan():
    emitted, derived, cases, screens, phases = {}, {}, {}, set(), set()
    for tag, p in SRC.items():
        for n, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
            for m in re.finditer(r"emit\('([a-z-]+)'", line):
                if tag != "G":
                    emitted.setdefault(m.group(1), []).append(f"{tag}:{n}")
            for m in re.finditer(r"emit\([\w.]+ \? '([a-z-]+)' : '([a-z-]+)'", line):  # emit(ok ? 'a' : 'b', …)
                if tag != "G":
                    for t in m.groups():
                        emitted.setdefault(t, []).append(f"{tag}:{n}")
            if tag == "G":
                for m in re.finditer(r"present\(s, '([a-z-]+)'", line):
                    derived.setdefault(m.group(1), []).append(f"G:{n}")
                for m in re.finditer(r"app\.screen = '([a-z]+)'", line):
                    screens.add(m.group(1))
            for m in re.finditer(r"\bphase = '([a-z]+)'", line):
                phases.add(m.group(1))
    # processEvents' switch: case 'x': ... up to the next case or the end of the switch
    g = SRC["G"].read_text(encoding="utf-8").splitlines()
    a = next(i for i, l in enumerate(g) if "function processEvents()" in l)
    b = next(i for i in range(a, len(g)) if g[i].strip().startswith("default: break;"))
    cur = []
    for i in range(a, b):
        ms = re.findall(r"case '([a-z-]+)':", g[i])
        if ms:
            cur = ms
            for c in ms:
                cases.setdefault(c, {"line": f"G:{i + 1}", "synth": False})
        if cur and re.search(r"Snd\.|horn\(|giftChime\(|giftFanfare\(", g[i]):
            for c in cur:
                cases[c]["synth"] = True
    # hit-juice layers with a sound (content.js)
    txt = (P / "p6" / "content.js").read_text(encoding="utf-8")
    js = txt[txt.index("{"): txt.rindex("}") + 1]
    content = json.loads(js)
    juice = {}
    for part in ("hits", "drops"):
        for L in (content.get(part) or {}).get("layers", []):
            if L.get("sound"):
                juice[L["event"]] = juice.get(L["event"], 0) + 1
    return emitted, derived, cases, juice, sorted(screens), sorted(phases)


def main():
    emitted, derived, cases, juice, screens, phases = scan()
    errs = []
    for t in emitted:
        if t not in E:
            errs.append(f"emitted '{t}' ({', '.join(emitted[t])}) has no annotation")
    for t in derived:
        if t not in E:
            errs.append(f"derived '{t}' ({', '.join(derived[t])}) has no annotation")
    for t, v in E.items():
        if v[8] == "sim" and t not in emitted:
            errs.append(f"annotated sim event '{t}' is emitted nowhere")
        if v[8] == "derived" and t not in derived:
            errs.append(f"annotated derived event '{t}' is presented nowhere")
    if errs:
        print("\n".join(errs))
        sys.exit(1)
    events = []
    for t, (grp, label, what, freq, prio, fw, gdd, shot, kind, variants) in E.items():
        where = emitted.get(t) or derived.get(t) or ([cases[t]["line"]] if t in cases else [])
        synth = bool((cases.get(t) or {}).get("synth")) or t in juice
        events.append({
            "id": t, "cue": "sfx." + t, "group": grp, "label": label, "what": what, "freq": freq, "priority": prio,
            "firesWith": fw, "gdd": gdd, "shot": shot, "kind": kind, "where": where, "synthNow": synth,
            "juiceLayersWithSound": juice.get(t, 0),
            "variants": [{"id": vid, "cue": "sfx." + vid, "when": w, "label": vl} for vid, w, vl in variants],
        })
    doc = {
        "generated_by": "audio/events.py", "build": "Prototype 9 (shared code of Prototype 8.4)",
        "groups": [{"id": g, "label": l} for g, l in GROUPS], "freqClasses": FREQ,
        "count": len(events), "counts": {k: sum(e["kind"] == k for e in events) for k in ("sim", "derived", "new", "ui")},
        "high": sum(e["priority"] == "high" for e in events),
        "screens": screens, "phases": phases,
        "music": [{"id": i, "cue": "music." + i, "label": l, "what": w, "detect": d, "shot": s, "gdd": g} for i, l, w, d, s, g in MUSIC],
        "events": events,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)}: {len(events)} events ({doc['counts']}), {doc['high']} high priority, {len(MUSIC)} music states;"
          f" screens {screens}; phases {phases}")


if __name__ == "__main__":
    main()
