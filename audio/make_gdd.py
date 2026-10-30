"""GDD Edit 100 (Sound) and the sound tour, written from the build's own data so neither drifts from it. No model.

    python3 audio/make_gdd.py
    → coder/gdd/DUMMIES_GDD_Edit100_Prototype_9_Sound.md   (the MUSIC and SFX tables the request asks for)
    → prototypes/p9/SOUND_TOUR.md                          (every step of the tour: screenshot, music, cues, alternates)
Inputs: content/audio/cues.json, content/audio/events.json, content/audio/inventory.json, prototypes/p9/shots/tour.json,
prototypes/p9/shots/test_p9.json, the registry.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
C = json.loads((ROOT / "content/audio/cues.json").read_text(encoding="utf-8"))
EV = json.loads((ROOT / "content/audio/events.json").read_text(encoding="utf-8"))
INV = json.loads((ROOT / "content/audio/inventory.json").read_text(encoding="utf-8"))
TOUR = json.loads((ROOT / "prototypes/p9/shots/tour.json").read_text(encoding="utf-8"))
TEST = json.loads((ROOT / "prototypes/p9/shots/test_p9.json").read_text(encoding="utf-8"))
REG = {e["id"]: e for e in json.loads((ROOT / "content/params/tuning.parameters.json").read_text(encoding="utf-8"))["entries"]}
RUN = json.loads((ROOT / "audio/runs" / C["run"] / "summary.json").read_text(encoding="utf-8"))
OUT = ROOT / "coder/gdd/DUMMIES_GDD_Edit100_Prototype_9_Sound.md"
TOUR_MD = ROOT / "prototypes/p9/SOUND_TOUR.md"
M = C["music"]
TR = {int(k): v for k, v in M["tracks"].items()}
tname = lambda n: f"Track {n} ({TR[n]['title']})" if isinstance(n, int) and n in TR else str(n)
files = lambda c: ", ".join(f"`{f}`" for f in c.get("files", []))


def state_cell(k):
    v = M["states"].get(k)
    if k == "level":
        return "Rotation: " + " → ".join(f"Track {n}" for n in M["rotation"])
    if k == "pause":
        return "The level track, ducked to `audio.music.pauseDuck`"
    if v == "continue":
        return "Track 2 continues (`audio.music.track.card` 0)"
    return tname(v)


MUSIC_ROWS = {
    "intro": ("Intro screen (DUMMIES, START), after the first press", "`app.screen` intro", "`audio.music.track.intro`"),
    "menu": ("Mode select, save slots, name entry, Story splash, story map, district select, high scores, loading", "`app.screen` title, saves, splash, storymap, arcade, scores, loading", "`audio.music.track.menu`"),
    "credits": ("The Credits card, from the title or an ending", "`app.credits`", "`audio.music.track.credits`"),
    "card": ("A district's first level card (Q2)", "phase `brief` before a level track", "`audio.music.track.card`"),
    "level": ("Drone drop, play, write-off hold, flips, ferry, gift screen, report, workshop; a card between tiles keeps the track", "`app.screen` game, other phases", "`audio.music.levelRotation`"),
    "pause": ("Pause, Options, Controls; window blur", "`app.paused`", "`audio.music.pauseDuck`"),
    "ending": ("Licensed, Failed test, Non-compliant", "phase `ending`, not Certified", "`audio.music.track.ending`"),
    "finale": ("The unveiling, the voyage, CERTIFIED", "phase `unveil`, `voyage`; ending Certified", "`audio.music.track.finale`"),
}


def gdd():
    L = []
    a = L.append
    passed = f"{TEST['passed']}/{TEST['total']}"
    a("# DUMMIES GDD — Edit 100 · Prototype 9 · Sound")
    a("")
    a(f"**30 October 2026 · Lawrence Lek** · Build `prototypes/p9/dummies_p9.html` · Registry `{C['registryVersion']}` · Cue map `content/audio/cues.json`, "
      f"run `{C['run']}` ({'10/10, confirmed' if C.get('accepted') else 'not accepted'}) · Tests {passed}")
    a("")
    a("## 0 Request")
    a("")
    a("> Next I want to integrate sound design. Next - a sound designer agent. I have downloaded royalty-free music tracks and sound effects pack.")
    a("> Music - Track 1 - Splash Screen. Track 2 - From menu until just before the level starts (whether story or arcade mode). Track 3, 4, 5, 6, Alternate between different levels and maps.")
    a("> SFX - read WAV file names and decide on appropriate places to put the sound triggers. Make documentation that covers what SFX (wav) and MUSIC (ogg) cues play at which points.")
    a("")
    a("> I want to create new version of DUMMIES game with SFX with latest prototype … try out different sfx and music for different stages … make a dummy page with testing out different SFX and music for the gameplay points.")
    a("")
    a("### 0.1 Readings (proposed; taken without a ruling)")
    a("")
    a("| # | Reading | Registry / where to change |")
    a("|---|---|---|")
    a("| Q1 | \"Splash Screen\" is the intro screen. It shows PRESS ANY KEY; the first press only unlocks audio and starts Track 1. The next press is START | `audio.music.track.intro`; Sound Lab › Music |")
    a("| Q2 | Track 2 plays through a district's first level card. The level track starts with the drone drop | `audio.music.track.card` (0: continue) |")
    a(f"| Q3 | Story: tile *n* in story order plays slot ((*n* − 1) mod {len(M['rotation'])}) + 1 of the rotation. Arcade: one track per run, the next slot each run | `audio.music.levelRotation` ({REG['audio.music.levelRotation']['default']}) |")
    a(f"| Q4 | Pause ducks the music to {REG['audio.music.pauseDuck']['default']}. Gift screen, report and workshop keep the level track. Endings: {tname(M['states']['ending'])}. Finale and CERTIFIED: {tname(M['states']['finale'])}. Credits: {tname(M['states']['credits'])} (the agent's choice; the handover proposed Track 1) | `audio.music.track.*` |")
    a("| Q5 | A write-off keeps the level track playing | — |")
    a("| Q6 | Each new bark bubble plays a soft blip; a shouted line a brighter one | `sfx.bark`, `sfx.bark.shout` |")
    a("")
    a("## 1 System")
    a("")
    a("- **Engine:** `prototypes/p9/audio.js`. `game.js` creates it only when `audio.enabled` is 1. Prototype 9 sets 1; the registry default is 0.")
    a("- **Buses:** music, SFX, UI under a master. Levels: `audio.music.volume`, `audio.sfx.volume`, `audio.ui.volume`.")
    a("- **Synth fallback:** Prototype 8.4's procedural sounds route through the SFX bus at `audio.synth.gain`. A `synth` entry keeps them.")
    a("- **Hush:** a cue or a stated silence hushes the synth for its event. Hit juice still draws.")
    a("- **Loudness:** each file is trimmed toward `audio.sfx.targetLufs` or `audio.music.targetLufs`. Trims cap at `audio.trim.maxBoostDb` and `audio.trim.peakCeilingDb`.")
    a("- **Weight:** gain classes set it. `audio.sfx.gain.<class>`, in dB after the trim.")
    a("- **Spam:** each cue waits its cooldown, `audio.sfx.cooldown.<class>`. At most `audio.sfx.maxVoices` play at once.")
    a("- **Variation:** pools play at random, never the same file twice running, or in turn. Non-menu cues vary pitch by `audio.sfx.pitchJitter`.")
    a("- **First gesture:** any key, click or tap unlocks audio. Name entry and the touch listener now unlock too.")
    a("- **Crossfade:** two music players fade over `audio.music.crossfadeSeconds`. Hidden tabs suspend audio.")
    a("- **Files:** WAV and OGG beside the page in `prototypes/p9/audio/`, loaded by URL. Each track has an MP3 copy for browsers without Ogg.")
    a("- **On `file://`:** `fetch` fails, so effects and music fall back to `<audio>` elements.")
    a("- **Options:** Music 0–10, Sound 0–10, Mute. Left and right adjust; OK steps. Saved as `dummies.p9.audio`. Defaults `audio.settings.music`, `audio.settings.sound`.")
    a("- **Sound Lab picks:** `prototypes/p9/sound_lab.html` saves them as `dummies.p9.audio.lab`. The game merges them at load. `#audio=<base64 JSON>` carries them across origins.")
    a("- **Edge cues** (§6.6 of the handover): low health crosses `audio.sfx.lowHealthAt`. A car starts flashing (noticed). Brake lights come on. A part breaks. The intro loop's hit.")
    a("- **Credits:** two lines, the pack's credits: \"Music by ansimuz\", \"Sound effects by Chequered Ink\". Proposed widening of Style Guide C1 (D86, open).")
    a("")
    a("## 2 MUSIC (OGG)")
    a("")
    a("| State | Screens | Detect | Track | Loop | Transition | Registry |")
    a("|---|---|---|---|---|---|---|")
    for m in EV["music"]:
        scr, det, rid = MUSIC_ROWS[m["id"]]
        a(f"| `music.{m['id']}` | {scr} | {det} | {state_cell(m['id'])} | yes | crossfade `audio.music.crossfadeSeconds` | {rid} |")
    a("")
    a("| Track | File | Length | Measured | Trim | Plays in |")
    a("|---|---|---:|---:|---:|---|")
    uses = {}
    for k, v in M["states"].items():
        if isinstance(v, int):
            uses.setdefault(v, []).append(k)
    for i, n in enumerate(M["rotation"]):
        uses.setdefault(n, []).append(f"level slot {i + 1}")
    for n, t in sorted(TR.items()):
        a(f"| {n} · {t['title']} | `{t['file']}` | {int(t['seconds'] // 60)}:{int(t['seconds'] % 60):02d} | {t['level']} LUFS | {t['trimDb']:+.1f} dB | {', '.join(uses.get(n, ['—']))} |")
    a("")
    a("- **Story tiles:** tile *n* = Monument A1 … Waterfront B2 in story order, 1–27. A tile's track starts when the dummy is on it: the drone drop, or the ferry's flip.")
    a("- **Arcade:** run *n* plays slot ((*n* − 1) mod 4) + 1. Retrying a district is a new run.")
    a("")
    a("## 3 SFX (WAV)")
    a("")
    a("Columns: the cue; what triggers it, with its code site; the files (a pool); bus; volume ID; cooldown ID. Variants are indented under their event.")
    a("")
    for g in EV["groups"]:
        evs = [e for e in EV["events"] if e["group"] == g["id"]]
        if not evs:
            continue
        a(f"### 3.{EV['groups'].index(g) + 1} {g['label']}")
        a("")
        a("| Cue | Trigger | Files | Bus | Volume ID | Cooldown ID |")
        a("|---|---|---|---|---|---|")
        for e in evs:
            for cid in [e["id"]] + [v["id"] for v in e["variants"]]:
                c = C["sfx"][cid]
                name = f"`sfx.{cid}`" if cid == e["id"] else f"↳ `sfx.{cid}`"
                trig = c["what"] if cid == e["id"] else c["label"]
                if cid == e["id"] and e["where"]:
                    trig += f" `{', '.join(e['where'][:2])}`"
                if c["decision"] == "cue":
                    a(f"| {name} | {trig} | {files(c)} | {c['bus']} | `{c['gainId']}` | `{c['cooldownId']}` |")
                else:
                    note = {"silence": "*silence*", "synth": "*Prototype 8.4 synth*", "base": f"*as `sfx.{c.get('variantOf')}`*"}[c["decision"]]
                    a(f"| {name} | {trig} | {note}: {c['why']} | — | — | — |")
        a("")
    n = {k: sum(c["decision"] == k for c in C["sfx"].values()) for k in ("cue", "silence", "synth", "base")}
    used = sorted({f for c in C["sfx"].values() for f in c.get("files", [])})
    a(f"**Totals:** {len(C['sfx'])} entries: {n['cue']} cues, {n['silence']} silences, {n['synth']} synth, {n['base']} on its base. {len(used)} of {INV['sfx']} files used.")
    a("")
    a("## 4 Gameplay points")
    a("")
    a("Screenshots and cues of every step of the tour: [`prototypes/p9/SOUND_TOUR.md`](../../prototypes/p9/SOUND_TOUR.md). The same, playable, in the Sound Lab's Tour room.")
    a("")
    a("## 5 The sound designer agent")
    a("")
    a("1. **Inventory** (`audio/inventory.py`, no model): duration, channels, rate, LUFS, true peak, RMS, credit. `content/audio/inventory.json`.")
    a(f"2. **Event catalogue** (`audio/events.py`, no model): {EV['count']} events from the code's `emit(` sites, `present(` cases and screens, annotated. Fails if code and annotations disagree. `content/audio/events.json`.")
    a("3. **Designer → lint → reviewer → refiner** (`audio/loop.py`; agents in `audio/agents/`; rules in `audio/SOUND_GUIDE.md`). One fresh `claude -p` per step. A fresh reviewer confirms each 10/10.")
    a("4. **Integrator** (`audio/integrate.py`): the accepted map → `content/audio/cues.json` and the registry. Refuses blocking lint.")
    a("")
    a("| Run | Start | Versions (score) | Result | Calls · cost |")
    a("|---|---|---|---|---|")
    for rid in sorted(p.name for p in (ROOT / "audio/runs").iterdir() if p.is_dir()):
        s = json.loads((ROOT / "audio/runs" / rid / "summary.json").read_text(encoding="utf-8"))
        start = "designer" if (ROOT / "audio/runs" / rid / "v0_designer_output_raw.txt").exists() else "previous map"
        a(f"| `{rid}` | {start} | {' → '.join(str(v['score']) for v in s['versions'])} | {'10/10, confirmed' if s['accepted'] else 'stopped at the cap'} | {s['calls']} · ${s['cost_usd']} |")
    a("")
    a("## 6 Build and tests")
    a("")
    a("```")
    a("python3 audio/inventory.py && python3 audio/events.py      # evidence")
    a("python3 audio/loop.py                                       # the agent (or --from content/audio/design.json)")
    a("python3 audio/integrate.py && python3 prototypes/p9/build.py")
    a("cd prototypes/p9 && node tour_p9.js && node test_p9.js --p84 && cd ../.. && python3 prototypes/p9/make_lab.py && python3 audio/make_gdd.py")
    a("```")
    a("")
    for r in TEST["results"]:
        a(f"- {'PASS' if r['pass'] else 'FAIL'} · {r['name']}")
    a("")
    a("## 7 Measured")
    a("")
    lv = [f["level"] for f in INV["files"] if f["folder"] == "sfx"]
    a(f"- **SFX:** {INV['sfx']} mono WAV, 44.1 kHz. {min(f['duration'] for f in INV['files'] if f['folder'] == 'sfx'):.2f}–{max(f['duration'] for f in INV['files'] if f['folder'] == 'sfx'):.2f} s. Level {min(lv)} to {max(lv)} dB (LUFS, or RMS under 0.4 s).")
    a(f"- **Music:** six stereo OGG, 48 kHz, 66–123 s, {min(t['level'] for t in TR.values())} to {max(t['level'] for t in TR.values())} LUFS.")
    a(f"- **Build:** `dummies_p9.html` {(ROOT / 'prototypes/p9/dummies_p9.html').stat().st_size:,} bytes. Audio beside it: {sum(p.stat().st_size for p in (ROOT / 'prototypes/p9/audio').rglob('*') if p.is_file()) / 1e6:.1f} MB.")
    a("")
    a("## 8 Registry (edit100)")
    a("")
    a("| ID | Default | Unit | Description |")
    a("|---|---:|---|---|")
    for k in sorted(k for k in REG if k.startswith("audio.")):
        e = REG[k]
        a(f"| `{k}` | {e['default']} | {e['unit']} | {e['description']} |")
    a("")
    a("## 9 Open")
    a("")
    a("- **D86:** the Credits card's audio lines widen Style Guide C1. Needs Lawrence's ruling.")
    a("- **Q1–Q6:** readings taken, not ruled (DECISIONS 591–596).")
    a("- **Honk:** the pack has no horn. The agent kept Prototype 8.4's synth horn (C2 overruled by the reviewer).")
    a("- **Silenced by the agent:** car-notice and car-brake. Switch them on in the Sound Lab to hear the edge cues.")
    a("- **Licence:** the pack's credit lines only. The licence texts were not supplied.")
    a("- **Devices:** the MP3 fallback for Safari and iOS is untested on a device.")
    a("- **Pages:** `gh-pages` is pushed. GitHub Pages needs switching on in the repo's settings once.")
    OUT.write_text("\n".join(L) + "\n", encoding="utf-8")
    return OUT


def tour():
    L = []
    a = L.append
    a("# DUMMIES Prototype 9 — the sound tour")
    a("")
    a("Every step of `tour_p9.js`: what shows, the music, and each cue the audio engine logged. Alternates are the designer's. "
      "To hear them, open [`sound_lab.html`](sound_lab.html) (Tour, or Effects). Generated by `audio/make_gdd.py`.")
    a("")
    for s in TOUR["steps"]:
        a(f"## {s['step']}. {s['name']}")
        a("")
        if s.get("shot"):
            a(f"![{s['name']}](shots/{s['shot']}.jpg)")
            a("")
        mus = s["music"]
        a(f"- **Music:** {mus['state'] or 'none yet'}{' · ' + tname(mus['track']) if mus.get('track') else ''}")
        cues = [c for c in s["cues"] if c["kind"] in ("sfx", "ui")]
        for c in cues:
            d = C["sfx"].get(c["id"], {})
            alts = ", ".join(f"`{f}`" for f in d.get("alternates", [])) or "—"
            a(f"- **`sfx.{c['id']}`** · {d.get('label', '')}: `{c['file']}` · pool {files(d) or '—'} · alternates {alts}")
        if not cues:
            a("- No effect on this step.")
        a("")
    TOUR_MD.write_text("\n".join(L) + "\n", encoding="utf-8")
    return TOUR_MD


if __name__ == "__main__":
    for p in (gdd(), tour()):
        print(p.relative_to(ROOT), p.stat().st_size, "bytes")
