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
PICKS = ROOT / "content" / "audio" / "picks_lawrence.json"   # Lawrence's picks from the Sound Lab: user-decided, over the agent's map
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
    ("audio.settings.music", "MUSIC default", "steps", 8, 0, 10, "Options › Music, out of 10, until the player sets it (saved as dummies.p9.audio)", "Replaces the unsaved Sound on/off"),
    ("audio.settings.sound", "SOUND default", "steps", 8, 0, 10, "Options › Sound, out of 10, for the SFX and UI buses", "Replaces the unsaved Sound on/off"),
    ("audio.music.crossfadeSeconds", "Crossfade", "s", 1.5, 0.05, 6, "Seconds for one track to fade into the next", "No hard cuts between screens"),
    ("audio.music.pauseDuck", "Pause duck", "ratio", 0.35, 0, 1, "The music's level while paused, as a share of its level in play", "Q4: pause ducks the music"),
    ("audio.music.track.intro", "Intro track", "track", 1, 0, 6, "Track on the intro screen", "Request: Track 1, the splash screen"),
    ("audio.music.track.menu", "Menu track", "track", 2, 0, 6, "Track on every menu until the level starts", "Request: Track 2 from the menu until just before the level starts"),
    ("audio.music.track.credits", "Credits track", "track", 2, 0, 6, "Track on the Credits card (0: the current track continues)", "Q4"),
    ("audio.music.track.card", "Level card track", "track", 0, 0, 6, "Track on a district's first level card (0: the menu track continues)", "Q2"),
    ("audio.music.track.ending", "Ending track", "track", 2, 0, 6, "Track on Licensed, Failed test and Non-compliant", "Q4"),
    ("audio.music.track.finale", "Finale track", "track", 1, 0, 6, "Track for the unveiling, the voyage and CERTIFIED", "Q4"),
    ("audio.music.levelRotation", "Level rotation", "digits", 3456, 0, 66666666, "Level tracks in order, one digit each. Story: tile n plays digit ((n − 1) mod count) + 1. Arcade: run n does", "Request: Tracks 3–6 alternate between levels and maps; Q3"),
    ("audio.music.targetLufs", "Music target", "LUFS", -16, -40, 0, "Integrated loudness each track is trimmed toward", "One level for every track"),
    ("audio.sfx.targetLufs", "SFX target", "LUFS", -18, -40, 0, "Loudness each effect is trimmed toward (integrated LUFS, or RMS under 0.4 s)", "One level for every effect"),
    ("audio.trim.maxBoostDb", "Trim cap", "dB", 12, 0, 24, "The largest boost or cut a trim applies", "Quiet files do not jump"),
    ("audio.trim.peakCeilingDb", "Peak ceiling", "dBFS", -1, -12, 0, "An effect's boost stops where its peak would pass this", "No clipping"),
    ("audio.sfx.maxVoices", "Voices", "count", 16, 1, 64, "Effects playing at once; a new one past the cap is dropped", "Combos and traffic never pile up"),
    ("audio.sfx.pitchJitter", "Pitch jitter", "ratio", 0.04, 0, 0.2, "Each effect plays at a rate up to this far from 1 (not menus)", "Repeated hits vary"),
    ("audio.sfx.lowHealthAt", "Low health", "ratio", 0.3, 0, 1, "The low-health cue sounds when the chassis falls below this share of its maximum, once until it recovers", "§6.6: a threshold crossing, not the frame"),
    ("audio.synth.gain", "Synth level", "ratio", 1, 0, 2, "Prototype 8.4's live synth, through the SFX bus, for an event with no entry and no generated tone", "§6.1: the synth stays as a fallback"),
]


def reg_entry(id_, label, unit, default, lo, hi, desc, purpose):
    return {"editable": True, "protectedReason": None, "integrationStatus": "prototype-p9", "boundaryStatus": "proposed-adapter-contract-not-implemented",
            "source": SRC, "status": "proposed", "applyAt": "next-run", "id": id_, "group": "Audio", "owner": "Audio", "label": label,
            "unit": unit, "type": "number", "default": default, "validation": {"min": lo, "max": hi}, "description": desc, "purpose": purpose}


def track_no(v, mus):
    if isinstance(v, int) or v in ("continue", "rotation", "duck", "none"):
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
        if isinstance(p.get("gainDb"), (int, float)) and p["gainDb"]:
            x["offsetDb"] = float(p["gainDb"])
        after = {k: x.get(k) for k in ("decision", "files", "gain", "cooldown")}
        diff = {k: after[k] for k in after if after[k] != before[k] and (x["decision"] in ("cue", "synth") or k == "decision")}
        if x.get("offsetDb"):
            diff["gainDb"] = x["offsetDb"]
        if diff:
            changed[eid] = {"was": {k: before[k] for k in diff if k in before}, "now": diff}
            x["by"] = "Lawrence"
            x["why"] = "Lawrence's pick in the Sound Lab (DECISIONS row 603)." + (" Agent: " + x.get("why", "") if x.get("why") else "")
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
    picks = json.loads(PICKS.read_text(encoding="utf-8")) if PICKS.exists() else {}
    changed = apply_picks(m, picks, L.ids(EV))
    tones = json.loads(TONES.read_text(encoding="utf-8"))["tones"] if TONES.exists() else {}
    F = L.lint(m, EV, INV)
    blocking = [f for f in F if f["severity"] == "blocking"]
    if blocking:
        sys.exit("blocking lint findings:\n" + L.text(blocking))
    reg = json.loads(REGF.read_text(encoding="utf-8"))
    have = {e["id"] for e in reg["entries"]}
    st, rot = m["music"]["states"], m["music"]["rotation"]
    vals = {p[0]: p[3] for p in PARAMS}
    for k in ("intro", "menu", "credits", "card", "ending", "finale"):
        v = st.get(k)
        vals["audio.music.track." + k] = v if isinstance(v, int) else 0
    vals["audio.music.levelRotation"] = int("".join(str(n) for n in rot))
    new = [reg_entry(*p[:3], vals[p[0]], *p[4:]) for p in PARAMS]
    new += [reg_entry(f"audio.sfx.gain.{k}", f"Gain: {k}", "dB", v, -40, 12, f"Gain class '{k}' on its bus: {GAIN_USE[k]}", "Sound Guide §2") for k, v in GAIN_DB.items()]
    new += [reg_entry(f"audio.sfx.cooldown.{k}", f"Cooldown: {k}", "s", v, 0, 10, f"Seconds between two plays of one cue in class '{k}': {COOL_USE[k]}", "Sound Guide §2; S1") for k, v in COOL_S.items()]
    new += [dict(reg_entry(f"audio.sfx.offset.{x['event']}", f"Offset: {x['event']}", "dB", x["offsetDb"], -24, 24, f"Fine gain on sfx.{x['event']}, after its gain class",
                           "Lawrence's pick in the Sound Lab"), status="user-confirmed", source="Edit 100 (P9): Lawrence's Sound Lab picks, 30 October (row 603)")
            for x in m["sfx"] if x.get("offsetDb")]
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
        gain = x.get("gain") or ("ambient" if e["freq"] == "ambient" else GROUP_GAIN[e["group"]])
        cd = x.get("cooldown") or ("honk" if x["event"].startswith("honk") else {"once": "once", "action": "action", "burst": "burst", "frame": "frame", "ambient": "ambient"}[e["freq"]])
        c.update({"bus": x.get("bus") or ("ui" if e["group"] == "ui" else "sfx"), "gain": gain, "gainId": f"audio.sfx.gain.{gain}", "cooldown": cd,
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
                  "arcadeRule": m["music"].get("arcadeRule", "run"), "why": m["music"].get("why", {})},
        "sfx": sfx, "files": files, "picks": {"by": "Lawrence", "file": "content/audio/picks_lawrence.json", "changed": changed, "raw": picks},
        "credits": {"music": INV["files"][0]["credit"], "sfx": next(f["credit"] for f in INV["files"] if f["folder"] == "sfx")},
    }
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    used = sorted({f for c in sfx.values() if c["decision"] == "cue" for f in c.get("files", [])})
    print(f"{OUT.relative_to(ROOT)}: {sum(c['decision'] == 'cue' for c in sfx.values())} cues, {sum(c['decision'] == 'silence' for c in sfx.values())} silences, "
          f"{sum(c['decision'] == 'synth' for c in sfx.values())} synth, {sum(c['decision'] == 'base' for c in sfx.values())} base; {len(used)} files used. "
          f"{sum(1 for c in sfx.values() if c['decision'] == 'synth' and c.get('tone'))} synth entries play a generated tone. "
          f"Lawrence changed {len(changed)}. Registry {REG_VERSION}: {len(reg['entries'])} entries ({added} added). Lint: {L.summary(F)}")


if __name__ == "__main__":
    main()
