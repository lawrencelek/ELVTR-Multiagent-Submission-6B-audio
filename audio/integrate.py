"""The integrator: the accepted cue map (content/audio/design.json) → the build's cue map (content/audio/cues.json) and the
registry's audio entries (content/params/tuning.parameters.json, edit100). No model.

- Every statistic the build reads is a registry ID: bus volumes, gain and cooldown classes, crossfade, duck, voices, jitter,
  the low-health threshold, the music states and rotation, the loudness targets. New IDs are added once (edit100).
- Loudness: each file gets a trim toward its bus's target (audio.music.targetLufs, audio.sfx.targetLufs), from its measured
  level (content/audio/inventory.json), capped at audio.trim.maxBoostDb, and for SFX by audio.trim.peakCeilingDb.
- Refuses a map with blocking lint findings.

    python3 audio/integrate.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import lint as L  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
INV = json.loads((ROOT / "content" / "audio" / "inventory.json").read_text(encoding="utf-8"))
EV = json.loads((ROOT / "content" / "audio" / "events.json").read_text(encoding="utf-8"))
DESIGN = ROOT / "content" / "audio" / "design.json"
PICKS = [ROOT / "content" / "audio" / f for f in (       # Lawrence's picks from the Sound Lab, in order: user-decided, over the agent's map
    "picks_lawrence.json",          # 30 October 02:18 (row 603)
    "picks_lawrence_2.json",        # 30 October 10:39 (row 607)
    "picks_lawrence_2_tones.json",  # the three events he asked new tones for, set to play them (row 607)
    "picks_lawrence_3.json",        # 30 October 11:30: the chassis blip; the music rulings and fades (rows 609–618)
    "picks_lawrence_4.json",        # 30 October 12:06: the generated tracks on the ship and the three run ends (row 619)
    "picks_lawrence_5.json",        # 30 October 19:10: after the QA run, car-notice and barks silent (row 625)
)]
TONES = ROOT / "content" / "audio" / "tones.json"            # generated tones (audio/tones.py)
OUT = ROOT / "content" / "audio" / "cues.json"
REGF = ROOT / "content" / "params" / "tuning.parameters.json"
REG_VERSION = "edit100-2026-10-30"
SRC = "Edit 100 (P9): sound design; values proposed by the sound designer agent and the integrator; Lawrence to confirm"

GAIN_DB = {"ui": -6, "move": -6, "hit": -2, "big": 0, "reward": -3, "story": -5, "alert": -4, "ambient": -12}
COOL_S = {"ui": 0.03, "action": 0.06, "burst": 0.1, "frame": 0.25, "ambient": 0.6, "once": 0, "honk": 1.4, "bark": 0.8}
GAIN_USE = {"ui": "menu moves and confirms", "move": "the dummy's own moves", "hit": "contact: hits, knocks, cone hits",
            "big": "the heaviest beats: write-off, big hit, the gift", "reward": "points and progress", "story": "Corporation notices, drones, the ferry",
            "alert": "warnings: denied, low health, fences", "ambient": "traffic chatter and background"}
COOL_USE = {"ui": "menu presses", "action": "one player action", "burst": "a few a second at most", "frame": "per-frame contacts (the old 0.25 s dedupe)",
            "ambient": "traffic chatter", "once": "beats that fire once", "honk": "a horn at the dummy (the 1.4 s repeat)", "bark": "bark bubbles (proto.barks.cooldown)"}

PARAMS = [  # id, label, unit, default, min, max, description, purpose
    ("audio.enabled", "Audio engine", "flag", 0, 0, 1, "1: the WAV and OGG cue map plays (prototypes/p9/audio.js); 0: Prototype 8.4's synth only. Prototype 9 sets 1", "\"integrate sound design\""),
    ("audio.music.volume", "Music bus", "ratio", 0.5, 0, 1, "The music bus at MUSIC 10", "Music under the effects"),
    ("audio.sfx.volume", "SFX bus", "ratio", 0.85, 0, 1, "The effects bus at SOUND 10", "Bodies, machines and story beats"),
    ("audio.ui.volume", "UI bus", "ratio", 0.7, 0, 1, "The menu bus at SOUND 10", "Menus a step under play"),
    ("audio.settings.master", "VOLUME default", "steps", 10, 0, 10, "The sound control's slider, out of 10, over every bus (intro, mode select, pause; Options › Volume); saved as dummies.p9.audio", "Lawrence: a sound on/off button and a volume slider (row 608)"),
    ("audio.settings.music", "MUSIC default", "steps", 8, 0, 10, "Options › Music, out of 10, until the player sets it (saved as dummies.p9.audio)", "Replaces the unsaved Sound on/off"),
    ("audio.settings.sound", "SOUND default", "steps", 8, 0, 10, "Options › Sound, out of 10, for the SFX and UI buses", "Replaces the unsaved Sound on/off"),
    ("audio.music.fadeInSeconds", "Fade in", "s", 0.3, 0.01, 6, "Seconds a track fades in from each start: a new screen's track, and the loop's restart", "Lawrence: a 0.3 s fade in when the track starts (row 609)"),
    ("audio.music.fadeOutSeconds", "Fade out", "s", 0.3, 0.01, 6, "Seconds a track fades out when it stops, gives way to the next, or reaches the file's end before the loop", "Lawrence: a 0.3 s fade out when the track finishes (row 609)"),
    ("audio.music.pauseDuck", "Pause duck", "ratio", 0.35, 0, 1, "The music's level while paused, as a share of its level in play", "Q4: pause ducks the music"),
    ("audio.music.screenDuck", "Screen duck", "ratio", 0.7, 0, 1, "The level track's level on the gift screen, the level report and the workshop, as a share of its level in play", "Lawrence, Q4 (row 612)"),
    ("audio.music.writeoffDuck", "Write-off duck", "ratio", 0.5, 0, 1, "The level track's level through the write-off hold, as a share of its level in play", "Lawrence, Q5 (row 613)"),
    ("audio.music.duckSeconds", "Duck time", "s", 0.25, 0.01, 4, "Seconds a duck takes to go fully down or back up", "No jump in level between screens"),
    ("audio.music.track.intro", "Intro track", "track", 1, 0, 10, "Track on the intro screen", "Request: Track 1, the splash screen"),
    ("audio.music.track.menu", "Menu track", "track", 2, 0, 10, "Track on every menu until the level starts", "Request: Track 2 from the menu until just before the level starts"),
    ("audio.music.track.credits", "Credits track", "track", 2, 0, 10, "Track on the Credits card (0: the current track continues)", "Q4"),
    ("audio.music.track.card", "Level card track", "track", -1, -1, 10, "Track on a level card. −1: the level's own track, from the tile the card announces; 0: the track playing continues; 1–6: that track", "Lawrence, Q2 (row 610)"),
    ("audio.music.track.licensed", "Licensed track", "track", 2, 0, 10, "Track when a run ends Licensed", "Lawrence: its own track (row 619)"),
    ("audio.music.track.failed", "Failed test track", "track", 2, 0, 10, "Track when a run ends Failed test", "Lawrence: its own track (row 619)"),
    ("audio.music.track.noncompliant", "Non-compliant track", "track", 2, 0, 10, "Track when a run ends Non-compliant (a refusal)", "Lawrence: its own track (row 619)"),
    ("audio.music.track.finale", "Finale track", "track", 1, 0, 10, "Track for the unveiling and the voyage", "Q4"),
    ("audio.music.track.certified", "At the ship track", "track", 1, 0, 10, "Track from the set-down at the ship: CERTIFIED", "Lawrence: one for the end at the ship (row 619)"),
    ("audio.music.levelRotation", "Level rotation", "digits", 3456, 0, 66666666, "Level tracks in order, one digit each. Story: the tile n a level card announces plays digit ((n − 1) mod count) + 1, until the next card. Arcade: the session's level n does", "Request: Tracks 3–6 alternate between levels and maps; Lawrence, Q3 (row 611)"),
    ("audio.music.targetLufs", "Music target", "LUFS", -16, -40, 0, "Integrated loudness each track is trimmed toward", "One level for every track"),
    ("audio.sfx.targetLufs", "SFX target", "LUFS", -18, -40, 0, "Loudness each effect is trimmed toward (integrated LUFS, or RMS under 0.4 s)", "One level for every effect"),
    ("audio.trim.maxBoostDb", "Trim cap", "dB", 12, 0, 24, "The largest boost or cut a trim applies", "Quiet files do not jump"),
    ("audio.trim.peakCeilingDb", "Peak ceiling", "dBFS", -1, -12, 0, "An effect's boost stops where its peak would pass this", "No clipping"),
    ("audio.sfx.maxVoices", "Voices", "count", 16, 1, 64, "Effects playing at once; a new one past the cap is dropped", "Combos and traffic never pile up"),
    ("audio.sfx.pitchJitter", "Pitch jitter", "ratio", 0.04, 0, 0.2, "Each effect plays at a rate up to this far from 1 (not menus)", "Repeated hits vary"),
    ("audio.sfx.lowHealthAt", "Low health", "ratio", 0.3, 0, 1, "The low-health cue sounds when the chassis falls below this share of its maximum, once until it recovers", "§6.6: a threshold crossing, not the frame"),
    ("audio.sfx.honkMaxPerCar", "Honks per car", "count", 2, 0, 20, "A car's horn sounds this many times at most, however often it is stuck (the horn mark still shows). 0: no cap", "Lawrence, after the QA run: a stuck car honked 20 times a minute (row 623)"),
    ("audio.sfx.spentRepeatMax", "Spent repeats", "count", 2, 0, 20, "Knock and touch-spent off one spent car: each sounds this many times at most in any audio.sfx.spentRepeatSeconds. 0: no cap", "Lawrence, after the QA run: leaning on a spent car knocked 57–74 times a minute (row 624)"),
    ("audio.sfx.spentRepeatSeconds", "Spent window", "s", 2, 0.1, 30, "The window audio.sfx.spentRepeatMax counts in, sim seconds", "Lawrence: 2 max within a 2 second window (row 624)"),
    ("audio.synth.gain", "Synth level", "ratio", 1, 0, 2, "Prototype 8.4's live synth, through the SFX bus, for an event with no entry and no generated tone", "§6.1: the synth stays as a fallback"),
]


RETIRED = {"audio.music.crossfadeSeconds": "superseded by audio.music.fadeInSeconds and fadeOutSeconds (row 609)",
           "audio.music.track.ending": "superseded by audio.music.track.licensed, failed and noncompliant (row 619)"}
RULED = {  # Lawrence's rulings, 30 October 11:30: the IDs they fix (status user-confirmed)
    "audio.music.track.intro": 617, "audio.music.fadeInSeconds": 609, "audio.music.fadeOutSeconds": 609, "audio.music.track.card": 610,
    "audio.music.levelRotation": 611, "audio.music.pauseDuck": 612, "audio.music.screenDuck": 612, "audio.music.track.credits": 612,
    "audio.music.track.finale": 612, "audio.music.writeoffDuck": 613, "audio.sfx.cooldown.bark": 614,
    "audio.sfx.honkMaxPerCar": 623, "audio.sfx.spentRepeatMax": 624, "audio.sfx.spentRepeatSeconds": 624,
    "audio.music.track.licensed": 619, "audio.music.track.failed": 619, "audio.music.track.noncompliant": 619, "audio.music.track.certified": 619,
}


def reg_entry(id_, label, unit, default, lo, hi, desc, purpose):
    return {"editable": True, "protectedReason": None, "integrationStatus": "prototype-p9", "boundaryStatus": "proposed-adapter-contract-not-implemented",
            "source": SRC, "status": "proposed", "applyAt": "next-run", "id": id_, "group": "Audio", "owner": "Audio", "label": label,
            "unit": unit, "type": "number", "default": default, "validation": {"min": lo, "max": hi}, "description": desc, "purpose": purpose}


def track_no(v, mus):
    if isinstance(v, int) or v in ("continue", "rotation", "duck", "none", "level"):
        return v
    for f in mus:
        if v and (v == f["file"].split("/", 1)[1] or v == f["name"] or v == f.get("original")):
            return f["track"]
    try:
        return int(v)
    except (TypeError, ValueError):
        return v


def normalise(m):
    """Accept the designer's spellings: a track by file name, a cooldown by its full registry ID."""
    mus = [f for f in INV["files"] if f["folder"] == "music"]
    mu = m.get("music") or {}
    mu["states"] = {k: track_no(v, mus) for k, v in (mu.get("states") or {}).items()}
    mu["rotation"] = [track_no(v, mus) for v in mu.get("rotation") or []]
    for x in m.get("sfx", []):
        if isinstance(x.get("cooldown"), str) and x["cooldown"].startswith("audio.sfx.cooldown."):
            x["cooldown"] = x["cooldown"].rsplit(".", 1)[1]
        if isinstance(x.get("gain"), str) and x["gain"].startswith("audio.sfx.gain."):
            x["gain"] = x["gain"].rsplit(".", 1)[1]
    return m


GROUP_GAIN = {"ui": "ui", "moves": "move", "abilities": "move", "hits": "hit", "near": "hit", "cones": "hit", "combos": "reward", "world": "story",
              "cars": "alert", "drones": "story", "story": "story", "arcade": "reward", "barks": "ambient", "intro": "story"}


def defaults(eid, e):
    """The bus, gain class and cooldown class an entry gets when the map gives none: by group and frequency."""
    gain = "ambient" if e["freq"] == "ambient" else GROUP_GAIN[e["group"]]
    cd = "honk" if eid.startswith("honk") else {"once": "once", "action": "action", "burst": "burst", "frame": "frame", "ambient": "ambient"}[e["freq"]]
    return {"bus": "ui" if e["group"] == "ui" else "sfx", "gain": gain, "cooldown": cd}


def apply_picks(m, picks, cat):
    """Lawrence's picks (Sound Lab JSON) over the agent's map, as prototypes/p9/audio.js merges them: a pick's decision wins,
    else the map's; files replace the pool; bus, gain and cooldown replace the map's; gainDb becomes audio.sfx.offset.<id>.
    Returns {id: what he changed}."""
    by = {x["event"]: x for x in m["sfx"]}
    changed = {}
    for eid, p in (picks.get("sfx") or {}).items():
        x = by.get(eid)
        if not x or not isinstance(p, dict):
            continue
        before = {k: x.get(k) for k in ("decision", "files", "gain", "cooldown")}
        if p.get("decision") in ("cue", "silence", "synth", "base"):
            x["decision"] = p["decision"]
        if isinstance(p.get("files"), list):
            new = [f for f in p["files"] if isinstance(f, str)]
            if new != (x.get("files") or []):  # the agent's own pick becomes an alternate
                x["alternates"] = list(dict.fromkeys(f for f in (x.get("files") or []) + (x.get("alternates") or []) if f not in new))[:3]
            x["files"] = new
        for k in ("bus", "gain", "cooldown"):
            if isinstance(p.get(k), str):
                x[k] = p[k]
        if x["decision"] == "cue":
            for k, v in defaults(eid, cat[eid]).items():
                x.setdefault(k, v) if x.get(k) else x.__setitem__(k, v)
        if isinstance(p.get("gainDb"), (int, float)) and p["gainDb"]:
            x["offsetDb"] = float(p["gainDb"])
        after = {k: x.get(k) for k in ("decision", "files", "gain", "cooldown")}
        diff = {k: after[k] for k in after if after[k] != before[k] and (x["decision"] in ("cue", "synth") or k == "decision")}
        if x.get("offsetDb"):
            diff["gainDb"] = x["offsetDb"]
        if diff:
            changed[eid] = {"was": {k: before[k] for k in diff if k in before}, "now": diff}
            if not x.get("by"):
                x["why"] = "Lawrence's pick in the Sound Lab (DECISIONS rows 603, 607)." + (" Agent: " + x.get("why", "") if x.get("why") else "")
            x["by"] = "Lawrence"
    return changed


def trims(prm):
    out, tracks = {}, {}
    for f in INV["files"]:
        if f["folder"] in ("sfx", "tones"):
            t = prm["audio.sfx.targetLufs"] - (f["level"] if f["level"] is not None else prm["audio.sfx.targetLufs"])
            t = max(-prm["audio.trim.maxBoostDb"], min(prm["audio.trim.maxBoostDb"], t))
            if f.get("truePeak") is not None:
                t = min(t, prm["audio.trim.peakCeilingDb"] - f["truePeak"])
            out[f["file"].split("/", 1)[1]] = {"trimDb": round(t, 1), "seconds": f["duration"], "level": f["level"], "family": f["family"], "peak": f.get("truePeak"), "dir": f["folder"]}
        else:
            t = prm["audio.music.targetLufs"] - f["level"]
            t = max(-prm["audio.trim.maxBoostDb"], min(prm["audio.trim.maxBoostDb"], t))
            name = f["file"].split("/", 1)[1]
            tracks[str(f["track"])] = {"file": f["file"], "mp3": "music/mp3/" + Path(name).with_suffix(".mp3").name, "title": f["title"],
                                        "seconds": f["duration"], "level": f["level"], "trimDb": round(t, 1)}
    return out, tracks


def main():
    if not DESIGN.exists():
        sys.exit("content/audio/design.json is missing: run audio/loop.py first")
    m = normalise(json.loads(DESIGN.read_text(encoding="utf-8")))
    agent = {x["event"]: {k: x.get(k) for k in ("decision", "files", "gain", "cooldown", "why")} for x in m["sfx"]}
    changed, raw = {}, {}
    for pf in PICKS:
        if not pf.exists():
            continue
        picks = json.loads(pf.read_text(encoding="utf-8"))
        for eid, d in apply_picks(m, picks, L.ids(EV)).items():
            if eid in changed:
                changed[eid]["now"].update(d["now"])
            else:
                changed[eid] = d
        if "tones" not in pf.name:  # what his browser may still hold: the latest export per entry
            raw.update(picks.get("sfx") or {})
    music_by, prm_user = {}, {}
    st0 = m["music"]["states"]  # the agent's one "ending" state becomes the three run ends; the ship starts on the finale's track (row 619)
    if "ending" in st0:
        for k in ("licensed", "failed", "noncompliant"):
            st0.setdefault(k, st0["ending"])
        del st0["ending"]
    st0.setdefault("certified", st0.get("finale"))
    for pf in PICKS:  # Lawrence's music rulings and the values he set (row 609 on)
        if not pf.exists():
            continue
        mp = json.loads(pf.read_text(encoding="utf-8"))
        for k, v in ((mp.get("music") or {}).get("states") or {}).items():
            m["music"]["states"][k] = v
            music_by[k] = "Lawrence"
        for k in ("storyRule", "arcadeRule"):
            if (mp.get("music") or {}).get(k):
                m["music"][k] = mp["music"][k]
        prm_user.update(mp.get("params") or {})
    m["music"]["states"].setdefault("screens", "duck")
    m["music"]["states"].setdefault("writeoff", "duck")
    m["music"]["why"] = dict(m["music"].get("why") or {}, **{
        "intro": "Lawrence (Q1): Track 1 behind PRESS ANY KEY; the first press starts it.",
        "card": "Lawrence (Q2): the level card starts the level's track, from the tile it announces.",
        "level": "Lawrence (Q3): the track holds from its card to the next, so a cleared tile walked back to keeps it.",
        "screens": "Lawrence (Q4): the gift screen, report and workshop keep the level track at 70%.",
        "writeoff": "Lawrence (Q5): a write-off drops the level track to 50%.",
        "pause": "Lawrence (Q4): pause drops the level track to 35%.",
        "credits": "Lawrence (Q4): Credits play Track 1, as the finale does.",
        "finale": "Lawrence (Q4): Track 1 bookends the story, through the unveiling and the voyage.",
        "certified": "Lawrence: a track of its own for the end at the ship. Generated: horn, plucked strings, bells.",
        "licensed": "Lawrence: a track of its own. Generated: a chip lead over four on the floor.",
        "failed": "Lawrence: a track of its own. Generated: a slow minor line, a wobbling pad, a heartbeat.",
        "noncompliant": "Lawrence: a track of its own. Generated: hold music, a cold chime.",
    })
    tones = json.loads(TONES.read_text(encoding="utf-8"))["tones"] if TONES.exists() else {}
    F = L.lint(m, EV, INV)
    blocking = [f for f in F if f["severity"] == "blocking"]
    if blocking:
        sys.exit("blocking lint findings:\n" + L.text(blocking))
    reg = json.loads(REGF.read_text(encoding="utf-8"))
    have = {e["id"] for e in reg["entries"]}
    st, rot = m["music"]["states"], m["music"]["rotation"]
    vals = {p[0]: p[3] for p in PARAMS}
    vals.update({k: v for k, v in prm_user.items() if k in vals})
    for k in ("intro", "menu", "credits", "card", "licensed", "failed", "noncompliant", "finale", "certified"):
        v = st.get(k)
        vals["audio.music.track." + k] = v if isinstance(v, int) else -1 if v == "level" else 0
    vals["audio.music.levelRotation"] = int("".join(str(n) for n in rot))
    new = [reg_entry(*p[:3], vals[p[0]], *p[4:]) for p in PARAMS]
    for e in new:
        if e["id"] in RULED:
            e.update(status="user-confirmed", source=f"Edit 100 (P9): Lawrence's ruling, 30 October 11:30 (DECISIONS row {RULED[e['id']]})")
    new += [reg_entry(f"audio.sfx.gain.{k}", f"Gain: {k}", "dB", v, -40, 12, f"Gain class '{k}' on its bus: {GAIN_USE[k]}", "Sound Guide §2") for k, v in GAIN_DB.items()]
    new += [reg_entry(f"audio.sfx.cooldown.{k}", f"Cooldown: {k}", "s", v, 0, 10, f"Seconds between two plays of one cue in class '{k}': {COOL_USE[k]}", "Sound Guide §2; S1") for k, v in COOL_S.items()]
    new += [dict(reg_entry(f"audio.sfx.offset.{x['event']}", f"Offset: {x['event']}", "dB", x["offsetDb"], -24, 24, f"Fine gain on sfx.{x['event']}, after its gain class",
                           "Lawrence's pick in the Sound Lab"), status="user-confirmed", source="Edit 100 (P9): Lawrence's Sound Lab picks, 30 October (row 603)")
            for x in m["sfx"] if x.get("offsetDb")]
    for e in new:
        if e["id"].startswith("audio.sfx.cooldown.") and e["id"] in RULED:
            e.update(status="user-confirmed", source=f"Edit 100 (P9): Lawrence's ruling, 30 October 11:30 (DECISIONS row {RULED[e['id']]})")
    gone = [e["id"] for e in reg["entries"] if e["id"] in RETIRED]
    reg["entries"] = [e for e in reg["entries"] if e["id"] not in RETIRED]
    added = 0
    for e in new:
        if e["id"] in have:
            for i, x in enumerate(reg["entries"]):
                if x["id"] == e["id"]:
                    reg["entries"][i] = e
        else:
            reg["entries"].append(e)
            added += 1
    reg["registryVersion"] = REG_VERSION
    REGF.write_text(json.dumps(reg, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    prm = {e["id"]: e["default"] for e in reg["entries"] if e["id"].startswith("audio.")}
    files, tracks = trims(prm)
    cat = L.ids(EV)
    sfx = {}
    for x in m["sfx"]:
        e = cat[x["event"]]
        c = {"decision": x["decision"], "label": e["label"], "what": e["what"], "group": e["group"], "freq": e["freq"], "priority": e["priority"],
             "shot": e["shot"], "why": x.get("why", "")}
        if x.get("by"):
            c["by"] = x["by"]
            c["agent"] = {k: v for k, v in agent[x["event"]].items() if v is not None}
        base_id = e.get("variantOf")
        tone = tones.get(x["event"]) or (tones.get(base_id) if base_id else None)
        if tone:
            c["tone"] = tone["file"]
        if e.get("variantOf"):
            c["variantOf"] = e["variantOf"]
            c["when"] = next(v["when"] for v in next(b for b in EV["events"] if b["id"] == e["variantOf"])["variants"] if v["id"] == x["event"])
        # every entry carries a bus, a gain class and a cooldown, so a tone or a cue picked later in the Lab plays in the mix
        dft = defaults(x["event"], e)
        gain, cd = x.get("gain") or dft["gain"], x.get("cooldown") or dft["cooldown"]
        c.update({"bus": x.get("bus") or dft["bus"], "gain": gain, "gainId": f"audio.sfx.gain.{gain}", "cooldown": cd,
                  "cooldownId": f"audio.sfx.cooldown.{cd}", "alternates": x.get("alternates", []), "files": x.get("files") or [], "pick": x.get("pick", "random")})
        if x.get("offsetDb"):
            c["offsetId"] = f"audio.sfx.offset.{x['event']}"
        sfx[x["event"]] = c
    for b in EV["events"]:
        if b["variants"]:
            sfx[b["id"]]["variants"] = [v["id"] for v in b["variants"]]
    out = {
        "generated_by": "audio/integrate.py", "registryVersion": REG_VERSION, "run": m.get("run"), "accepted": m.get("accepted"), "score": m.get("score"),
        "base": "audio/", "params": prm,
        "music": {"tracks": tracks, "states": st, "rotation": rot, "storyRule": m["music"].get("storyRule", "tile"),
                  "arcadeRule": m["music"].get("arcadeRule", "run"), "why": m["music"].get("why", {}), "by": music_by,
                  "retired": RETIRED},
        "sfx": sfx, "files": files, "picks": {"by": "Lawrence", "files": [str(p.relative_to(ROOT)) for p in PICKS if p.exists()], "changed": changed, "raw": {"sfx": raw}},
        "credits": {"music": next(f["credit"] for f in INV["files"] if f["folder"] == "music" and "ansimuz" in f["credit"]), "sfx": next(f["credit"] for f in INV["files"] if f["folder"] == "sfx")},
    }
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    used = sorted({f for c in sfx.values() if c["decision"] == "cue" for f in c.get("files", [])})
    print(f"{OUT.relative_to(ROOT)}: {sum(c['decision'] == 'cue' for c in sfx.values())} cues, {sum(c['decision'] == 'silence' for c in sfx.values())} silences, "
          f"{sum(c['decision'] == 'synth' for c in sfx.values())} synth, {sum(c['decision'] == 'base' for c in sfx.values())} base; {len(used)} files used. "
          f"{sum(1 for c in sfx.values() if c['decision'] == 'synth' and c.get('tone'))} synth entries play a generated tone. "
          f"Lawrence changed {len(changed)}; music states he set: {sorted(music_by)}. Registry {REG_VERSION}: {len(reg['entries'])} entries ({added} added, {len(gone)} retired). Lint: {L.summary(F)}")


if __name__ == "__main__":
    main()
