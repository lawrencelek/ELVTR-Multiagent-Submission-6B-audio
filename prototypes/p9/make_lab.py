#!/usr/bin/env python3
"""The Sound Lab (GDD Edit 100): prototypes/p9/sound_lab.html, an audition page for every cue and music state of Prototype 9.

Bundles lab.src.html with its data: the cue map (content/audio/cues.json), the event catalogue (content/audio/events.json),
the inventory, the tour's screenshots and steps (shots/tour.json, from tour_p9.js), the Story's tiles, the registry's
labels for the audio IDs, and Prototype 8.4's synth recipes (from game.js and content.js), so a synth cue can be heard too.
The page plays the files in audio/ beside it, saves its picks in the browser under the key the game reads
(dummies.p9.audio.lab), and opens dummies_p9.html with them.

    python3 prototypes/p9/make_lab.py
"""
import json
import pathlib
import re

here = pathlib.Path(__file__).resolve().parent
root = here.parents[1]
cues = json.loads((root / "content" / "audio" / "cues.json").read_text(encoding="utf-8"))
events = json.loads((root / "content" / "audio" / "events.json").read_text(encoding="utf-8"))
inv = json.loads((root / "content" / "audio" / "inventory.json").read_text(encoding="utf-8"))
reg = json.loads((root / "content" / "params" / "tuning.parameters.json").read_text(encoding="utf-8"))
story = json.loads((root / "content" / "story" / "story_v2.json").read_text(encoding="utf-8"))
tour = json.loads((here / "shots" / "tour.json").read_text(encoding="utf-8"))

# Prototype 8.4's procedural sounds, per event: [kind, from Hz, to Hz, seconds, gain, wave, delay]. Copied from game.js's
# processEvents switch and the hit and drop juice layers in content.js (their registry values; ranges at their middle).
T, N = "tone", "noise"
def notes(fs, dur, gain, wave, step, d0=0.0, k=1.0):
    return [[T, f, f * k, dur, gain, wave, d0 + j * step] for j, f in enumerate(fs)]
GIFT_FALL = 0.9
SYNTH = {
    "lunge": [[N, 300, 1800, 0.18, 0.12, None, 0]],
    "jump": [[T, 330, 660, 0.12, 0.08, "triangle", 0]], "jump.dash": [[T, 330, 880, 0.18, 0.08, "triangle", 0]],
    "jump-land": [[T, 160, 90, 0.08, 0.05, "square", 0]], "land": [[T, 210, 62, 0.24, 0.15, "sine", 0]],
    "deck-drop": [[T, 700, 210, 0.42, 0.08, "sine", 0]], "rail-jump": [[T, 520, 880, 0.1, 0.06, "triangle", 0]],
    "stair": [[T, 260, 300, 0.05, 0.03, "triangle", 0]],
    "push": [[T, 360, 820, 0.12, 0.08, "triangle", 0]], "hitch": [[T, 300, 420, 0.08, 0.05, "square", 0]],
    "sling": [[T, 420, 900, 0.14, 0.08, "triangle", 0]], "denied": [[T, 120, 110, 0.05, 0.05, "square", 0], [T, 120, 110, 0.05, 0.05, "square", 0.08]],
    "impact": [[N, 2400, 300, 0.18, 0.18, None, 0], [N, 900, 120, 0.22, 0.2, None, 0]], "impact.big": [[N, 2400, 300, 0.18, 0.18, None, 0], [N, 600, 60, 0.3, 0.22, None, 0]],
    "impact.drop": [[T, 320, 50, 0.25, 0.2, "sine", 0], [N, 2400, 300, 0.18, 0.18, None, 0]],
    "held": [[T, 240, 200, 0.16, 0.05, "square", 0]], "knock": [[N, 700, 250, 0.1, 0.08, None, 0]], "touch-spent": [[N, 500, 140, 0.12, 0.12, None, 0]],
    "writeoff": [[N, 2000, 70, 0.6, 0.24, None, 0]],
    "near-miss": [[N, 500, 2200, 0.25, 0.1, None, 0]], "miss": [[N, 3200, 700, 0.3, 0.14, None, 0]],
    "pickup": [[T, 700, 950, 0.05, 0.06, "triangle", 0]], "drop": [[T, 500, 380, 0.06, 0.05, "triangle", 0]],
    "throw": [[T, 620, 180, 0.16, 0.07, "triangle", 0]], "punt": [[T, 420, 300, 0.05, 0.04, "triangle", 0]],
    "cone-hit": [[T, 900, 600, 0.08, 0.06, "square", 0]],
    "combo": notes([660, 880, 1100], 0.08, 0.08, "triangle", 0.06, k=1.2), "combo.max": notes([660, 880, 1100], 0.08, 0.08, "triangle", 0.06, k=1.2),
    "combo-end": [[T, 523, 784, 0.12, 0.06, "triangle", 0]],
    "splash": [[N, 900, 200, 0.4, 0.08, None, 0]], "rescued": [[T, 320, 480, 0.12, 0.05, "triangle", 0]], "screen": [[T, 300, 520, 0.12, 0.04, "triangle", 0]],
    "honk": [[T, 880, 880, 0.05, 0.03, "sine", 0]], "honk.body": [[T, 440, 430, 0.16, 0.05, "square", 0], [T, 349, 340, 0.22, 0.05, "square", 0.18]],
    "skid": [[T, 1800, 900, 0.18, 0.02, "sawtooth", 0]], "unstick.reverse": [[T, 1000, 1000, 0.06, 0.03, "square", 0], [T, 1000, 1000, 0.06, 0.03, "square", 0.25]],
    "learn-standoff": [[T, 330, 260, 0.12, 0.05, "triangle", 0]],
    "drone-dispatch": [[T, 150, 210, 0.6, 0.025, "sawtooth", 0]], "drone-dispatch.rescue": [[T, 150, 210, 0.6, 0.025, "sawtooth", 0]],
    "drone-pickup": [[T, 320, 200, 0.08, 0.05, "square", 0]], "drone-drop": [[T, 240, 150, 0.1, 0.05, "square", 0]],
    "story-enter": notes([392, 523, 659], 0.1, 0.05, "triangle", 0.08), "story-count": [[T, 660, 990, 0.12, 0.07, "triangle", 0]],
    "story-miss": [[T, 200, 150, 0.12, 0.05, "square", 0]], "story-clear": notes([523, 659, 784, 1046], 0.14, 0.07, "triangle", 0.09),
    "story-deliver": [[T, 150, 210, 0.6, 0.025, "sawtooth", 0], [T, 1318.5, 1318.5, 0.14, 0.05, "sine", 0], [T, 1760, 1760, 0.3, 0.05, "sine", 0.12]],
    "story-ferry": [[T, 150, 210, 0.6, 0.025, "sawtooth", 0]], "story-ferried": [[T, 240, 150, 0.1, 0.05, "square", 0]],
    "story-fence": [[T, 140, 120, 0.08, 0.05, "square", 0]], "delivered": [[T, 320, 480, 0.12, 0.05, "triangle", 0]],
    "gift": ([[T, 280, 1300, GIFT_FALL, 0.035, "sine", 0], [N, 500, 4200, GIFT_FALL, 0.03, None, 0], [T, 150, 45, 0.32, 0.09, "square", GIFT_FALL], [N, 4200, 900, 0.3, 0.06, None, GIFT_FALL]]
             + notes([587.33, 739.99, 880, 1174.66], 0.18, 0.08, "triangle", 0.09, GIFT_FALL + 0.06)
             + [[T, f, f * 1.004, 1.4, 0.045, "triangle", GIFT_FALL + 0.42] for f in (880, 1174.66, 1479.98)] + [[T, 293.66, 293.66, 1.4, 0.06, "sine", GIFT_FALL + 0.42]]),
    "unveil-lift": notes([392, 523, 659, 784], 0.2, 0.06, "triangle", 0.14, 0.3),
    "purchase": notes([523, 659, 784], 0.1, 0.07, "triangle", 0.07) + [[T, 150, 60, 0.18, 0.06, "square", 0.02]],
    "purchase-denied": [[T, 180, 140, 0.12, 0.04, "square", 0]], "grade": notes([440, 660, 880], 0.1, 0.05, "square", 0.08),
    "ending.win": notes([523, 659, 784, 1046], 0.16, 0.07, "triangle", 0.09),
}
# Scripted moments to hear cues together, over the music the game plays there: [label, music state, [[seconds, cue], ...], shot]
SEQUENCES = [
    ("Menu walk", "menu", [[0, "ui-move"], [0.28, "ui-move"], [0.56, "ui-move"], [1.0, "ui-ok"], [1.8, "ui-back"]], "title", "Cursor, confirm, back on the mode select."),
    ("The drone drop", "level", [[0, "ui-ok"], [0.05, "chassis.start"], [0.4, "drop-in"], [2.6, "dropped-in"]], "drop", "The card's START, the drop, the set-down. The level track takes over."),
    ("Dash into a car", "level", [[0, "lunge"], [0.22, "impact"], [0.24, "bark"]], "dash", "A dash, the hit, the car's line."),
    ("A combo to the cap", "level", [[0, "lunge"], [0.2, "impact"], [0.8, "jump"], [1.05, "impact"], [1.06, "combo"], [1.7, "lunge"], [1.9, "impact.big"], [1.91, "combo.max"], [3.4, "combo-end"]], "combo", "Three hits in a chain, the cap, then the bank."),
    ("Write-off", "level", [[0, "impact.big"], [0.05, "writeoff"], [0.35, "credit"], [1.3, "story-count"], [2.0, "story-clear"]], "writeoff", "The last hit, the stamp, the count, the clear."),
    ("Cones", "level", [[0, "pickup"], [0.7, "throw"], [1.5, "cone-hit"], [1.52, "combo"]], "cones", "Pick up, throw, a car caught by the cone."),
    ("Traffic", "level", [[0, "car-notice"], [0.4, "bark"], [0.9, "honk.body"], [1.6, "near-miss"], [2.2, "skid"], [2.9, "car-brake"]], "play", "What the cars do around the dummy."),
    ("Gift delivery", "level", [[0, "story-deliver"], [2.0, "gift"], [4.6, "ui-ok"]], "gift", "The drone brings a part; the gift screen; continue."),
    ("River rescue", "level", [[0, "splash"], [0.3, "drone-dispatch.rescue"], [2.6, "rescued"]], "drone", "Into the river, the drone, the recovery."),
    ("Arcade ends: Licensed", "ending", [[0, "ending.win"]], "ending", "The run ends well. Track 2 returns."),
    ("Arcade ends: Failed test", "ending", [[0, "ending.fail"]], "ending", "The run ends badly."),
    ("Finale", "finale", [[0, "unveil"], [0.6, "unveil-lift"], [4.0, "ui-ok"], [4.2, "voyage"], [7.0, "voyage-end"]], "plaque", "The cloth lifts, the plaque, the voyage."),
]


def main():
    regby = {e["id"]: e for e in reg["entries"]}
    params = {k: {"value": v, "label": regby.get(k, {}).get("label", k), "unit": regby.get(k, {}).get("unit", ""),
                  "min": (regby.get(k, {}).get("validation") or {}).get("min"), "max": (regby.get(k, {}).get("validation") or {}).get("max"),
                  "description": regby.get(k, {}).get("description", "")} for k, v in cues["params"].items()}
    shots = {k: f"shots/{k}.jpg" for k in tour["shots"]}
    heard = {}
    for st in tour["steps"]:
        for c in st["cues"]:
            if c["kind"] in ("sfx", "ui"):
                heard.setdefault(c["id"], st["name"])
    tiles = [{"id": d["id"], "name": d["name"], "act": d.get("act"), "order": d["order"], "titles": {t: (d["tiles"][t].get("title") or "") for t in d["order"]}} for d in story["districts"]]
    files = {}
    for f in inv["files"]:
        if f["folder"] == "sfx":
            n = f["file"].split("/", 1)[1]
            files[n] = dict(cues["files"][n], family=f["family"])
    data = {
        "build": "P9", "run": cues.get("run"), "accepted": cues.get("accepted"), "score": cues.get("score"), "registryVersion": cues.get("registryVersion"),
        "groups": events["groups"], "freq": events["freqClasses"], "musicStates": events["music"],
        "events": [{"id": e["id"], "firesWith": e["firesWith"], "synthNow": e["synthNow"], "kind": e["kind"], "where": e["where"], "gdd": e["gdd"]} for e in events["events"]],
        "cues": cues["sfx"], "music": cues["music"], "params": params, "files": files, "shots": shots, "heard": heard,
        "steps": [{"step": s["step"], "name": s["name"], "shot": s["shot"], "music": s["music"], "cues": [c for c in s["cues"] if c["kind"] in ("sfx", "ui", "music")]} for s in tour["steps"]],
        "tiles": tiles, "synth": SYNTH, "sequences": [{"label": a, "state": b, "steps": c, "shot": d, "what": e} for a, b, c, d, e in SEQUENCES],
        "credits": cues.get("credits"),
    }
    missing = [c for s in SEQUENCES for _, c in s[2] if c not in cues["sfx"]]
    assert not missing, missing
    src = (here / "lab.src.html").read_text(encoding="utf-8")
    frag = src.replace("/*LAB_DATA*/", "window.LAB = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";")
    # the artifact takes the fragment (its host adds the document); GitHub Pages and a local copy take a whole document
    (here / "sound_lab.fragment.html").write_text(frag, encoding="utf-8")
    head, body = frag.split("</style>\n", 1)
    full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head + "</style>\n</head>\n<body>\n" + body + "</body>\n</html>\n")
    out = here / "sound_lab.html"
    out.write_text(full, encoding="utf-8")
    print(out.name, out.stat().st_size, "bytes;", len(data["cues"]), "cues,", len(shots), "shots,", len(SEQUENCES), "sequences")


if __name__ == "__main__":
    main()
