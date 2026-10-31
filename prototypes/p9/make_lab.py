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
tones = json.loads((root / "content" / "audio" / "tones.json").read_text(encoding="utf-8"))

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
    ("Arcade ends: Licensed", "licensed", [[0, "ending.win"]], "ending", "The run ends licensed, on its own track."),
    ("Arcade ends: Failed test", "failed", [[0, "ending.fail"]], "failed", "The run ends failed, on its own track."),
    ("Arcade ends: Non-compliant", "noncompliant", [[0, "ending.fail"]], "refused", "A refusal, on its own track."),
    ("Tile cleared", "cleared", [[0, "story-count"], [0.15, "story-clear"]], "story", "The tile's brief met: the jingle, then the loop to the next card."),
    ("Finale", "finale", [[0, "unveil"], [0.6, "unveil-lift"], [4.0, "ui-ok"], [4.2, "voyage"]], "plaque", "The cloth lifts, the plaque, the voyage."),
    ("At the ship", "certified", [[0, "voyage-end"], [0.3, "ending.win"]], "certified", "Set down at the ship: CERTIFIED, on its own track."),
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
        if f["folder"] in ("sfx", "tones"):
            n = f["file"].split("/", 1)[1]
            files[n] = dict(cues["files"][n], family=f["family"])
    data = {
        "build": "P9", "run": cues.get("run"), "accepted": cues.get("accepted"), "score": cues.get("score"), "registryVersion": cues.get("registryVersion"),
        "groups": events["groups"], "freq": events["freqClasses"], "musicStates": events["music"],
        "events": [{"id": e["id"], "firesWith": e["firesWith"], "synthNow": e["synthNow"], "kind": e["kind"], "where": e["where"], "gdd": e["gdd"]} for e in events["events"]],
        "cues": cues["sfx"], "music": cues["music"], "params": params, "files": files, "shots": shots, "heard": heard,
        "steps": [{"step": s["step"], "name": s["name"], "shot": s["shot"], "music": s["music"], "cues": [c for c in s["cues"] if c["kind"] in ("sfx", "ui", "music")]} for s in tour["steps"]],
        "tiles": tiles, "tones": {k: v["file"] for k, v in tones["tones"].items()}, "sequences": [{"label": a, "state": b, "steps": c, "shot": d, "what": e} for a, b, c, d, e in SEQUENCES],
        "credits": cues.get("credits"), "picks": cues.get("picks"),
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
