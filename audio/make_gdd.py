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
        return f"The level track at {REG['audio.music.pauseDuck']['default']} (`audio.music.pauseDuck`)"
    if k == "screens":
        return f"The level track at {REG['audio.music.screenDuck']['default']} (`audio.music.screenDuck`)"
    if k == "writeoff":
        return f"The level track at {REG['audio.music.writeoffDuck']['default']} (`audio.music.writeoffDuck`)"
    if v == "level":
        return "The level's track, from the tile the card announces (`audio.music.track.card` −1)"
    if v == "continue":
        return "The track playing continues (`audio.music.track.card` 0)"
    return tname(v)


MUSIC_ROWS = {
    "intro": ("Intro screen (DUMMIES, START), after the first press", "`app.screen` intro", "`audio.music.track.intro`"),
    "menu": ("Mode select, save slots, name entry, Story splash, story map, district select, high scores. Loading holds the track playing", "`app.screen` title, saves, splash, storymap, arcade, scores", "`audio.music.track.menu`"),
    "credits": ("The Credits card, from the title or an ending", "`app.credits`", "`audio.music.track.credits`"),
    "card": ("Every level card: a district's start, each new tile after the ferry, each Arcade level (Q2)", "phase `brief`", "`audio.music.track.card`"),
    "level": ("Drone drop, play, flips, ferry. The track holds from its card to the next card (Q3)", "`app.screen` game, other phases", "`audio.music.levelRotation`"),
    "screens": ("The gift screen, the level report, the workshop (Q4)", "phases `gift`, `report`, `shop`", "`audio.music.screenDuck`"),
    "writeoff": ("The write-off hold (Q5)", "phase `writeoff`", "`audio.music.writeoffDuck`"),
    "pause": ("Pause, Options, Controls; window blur", "`app.paused`", "`audio.music.pauseDuck`"),
    "licensed": ("A run ends Licensed", "phase `ending`, kind Licensed", "`audio.music.track.licensed`"),
    "failed": ("A run ends Failed test", "phase `ending`, kind Failed test", "`audio.music.track.failed`"),
    "noncompliant": ("A run ends Non-compliant (a refusal)", "phase `ending`, kind Non-compliant", "`audio.music.track.noncompliant`"),
    "finale": ("The unveiling, the voyage", "phase `unveil`, `voyage`", "`audio.music.track.finale`"),
    "certified": ("At the ship: the set-down, CERTIFIED", "phase `ending`, kind Certified", "`audio.music.track.certified`"),
}


import re as _re
SIMP = json.loads(_re.search(r"window\.DUMMIES_SIM = (\{.*?\});", (ROOT / "prototypes/p9/dummies_p9.html").read_text(encoding="utf-8")).group(1))


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
    a("> (30 October 11:30) We also need separate SFX and music volume options (maybe via a dropdown?). Also - for music, add small 0.3 second fades in when the track starts and 0.3 second fadeout when the track finishes.")
    a("")
    a("### 0.1 Rulings (Lawrence, 30 October 11:30; DECISIONS rows 609–618)")
    a("")
    a("| # | Ruling | Registry |")
    a("|---|---|---|")
    a("| Q1 | \"Splash Screen\" is the intro screen. It shows PRESS ANY KEY; the first press only unlocks audio and starts Track 1. The next press is START | `audio.music.track.intro` (1) |")
    a("| Q2 | The level card starts the level's track | `audio.music.track.card` (−1: the level's track) |")
    a(f"| Q3 | The start tile sets the track. Story: the tile *n* a level card announces plays slot ((*n* − 1) mod {len(M['rotation'])}) + 1. The track holds until the next card: a walk back to a cleared tile, the ferry and a write-off never change it. Arcade: each level's card takes the next slot | `audio.music.levelRotation` ({REG['audio.music.levelRotation']['default']}) |")
    a(f"| Q4 | Pause: the level track at {REG['audio.music.pauseDuck']['default']}. Gift screen, report, workshop: the level track at {REG['audio.music.screenDuck']['default']}. Finale and CERTIFIED: {tname(M['states']['finale'])}. Credits: {tname(M['states']['credits'])} | `audio.music.pauseDuck`, `audio.music.screenDuck`, `audio.music.track.*` |")
    a(f"| Q5 | A write-off drops the level track to {REG['audio.music.writeoffDuck']['default']}; it keeps playing | `audio.music.writeoffDuck` |")
    a("| Q6 | The new chassis no longer shares `bubble.wav`: it plays a generated blip. Barks kept a blip until row 625 silenced them (§10) | `sfx.chassis`; `sfx.bark`, `sfx.bark.shout` |")
    a(f"| Endings | Each has a track of its own, generated (row 619): at the ship {tname(M['states']['certified'])}; Licensed {tname(M['states']['licensed'])}; Failed test {tname(M['states']['failed'])}; Non-compliant {tname(M['states']['noncompliant'])} | `audio.music.track.certified`, `.licensed`, `.failed`, `.noncompliant` |")
    a(f"| Fades | Every track fades in over {REG['audio.music.fadeInSeconds']['default']} s from each start and out over {REG['audio.music.fadeOutSeconds']['default']} s at each end, the loop's seam included. A switch is the two, overlapped | `audio.music.fadeInSeconds`, `audio.music.fadeOutSeconds` |")
    a("")
    a("## 1 System")
    a("")
    a("- **Engine:** `prototypes/p9/audio.js`. `game.js` creates it only when `audio.enabled` is 1. Prototype 9 sets 1; the registry default is 0.")
    a("- **Buses:** music, SFX, UI under a master. Levels: `audio.music.volume`, `audio.sfx.volume`, `audio.ui.volume`.")
    a(f"- **Generated tones:** Prototype 8.4's procedural sounds, rendered to WAV by `audio/tones.py` ({INV.get('tones', 0)} files: 8.4's recipes, plus new tones for slip and for the eight events Lawrence asked for (row 606); a replaced 8.4 tone stays as `tone_<event>_p84.wav`). A `synth` entry plays its event's tone through the mix: gain class, cooldown, trim. An event with no entry or tone keeps the live synth, on the SFX bus at `audio.synth.gain`.")
    a("- **Lawrence's picks:** his Sound Lab exports over the agent's map, in order: `content/audio/picks_lawrence.json` (row 603), `picks_lawrence_2.json` and `picks_lawrence_2_tones.json` (row 607), `picks_lawrence_3.json` (his rulings: the chassis blip, the music states and values; rows 609–618). His fine gain becomes `audio.sfx.offset.<cue>`.")
    a("- **Generated music** (row 619): Tracks 7–10, composed in code by `audio/music_gen.py` (`content/audio/music_gen.json`): 7 at the ship (CERTIFIED), 8 Licensed, 9 Failed test, 10 Non-compliant. Pulse, triangle, saw and FM voices, a plucked string, a pad, drums; a delay and a reverb. Whole bars, tails wrapped, so each loops on the bar.")
    a("- **Hush:** a cue or a stated silence hushes the synth for its event. Hit juice still draws.")
    a("- **Loudness:** each file is trimmed toward `audio.sfx.targetLufs` or `audio.music.targetLufs`. Trims cap at `audio.trim.maxBoostDb` and `audio.trim.peakCeilingDb`.")
    a("- **Weight:** gain classes set it. `audio.sfx.gain.<class>`, in dB after the trim.")
    a("- **Spam:** each cue waits its cooldown, `audio.sfx.cooldown.<class>`. At most `audio.sfx.maxVoices` play at once.")
    a("- **Variation:** pools play at random, never the same file twice running, or in turn. Non-menu cues vary pitch by `audio.sfx.pitchJitter`.")
    a("- **First gesture:** any key, click or tap unlocks audio. Name entry and the touch listener now unlock too.")
    a("- **Fades:** each track fades in over `audio.music.fadeInSeconds` from every start and out over `audio.music.fadeOutSeconds` before the file ends, so the loop's seam dips and returns. A switch fades the old track out and the new one in, overlapped; three players keep quick switches whole. Hidden tabs suspend audio.")
    a("- **Ducks:** pause `audio.music.pauseDuck`; the gift screen, report and workshop `audio.music.screenDuck`; the write-off hold `audio.music.writeoffDuck`. Pause wins. Each glides over `audio.music.duckSeconds`.")
    a("- **Files:** WAV and OGG beside the page in `prototypes/p9/audio/`, loaded by URL. Each track has an MP3 copy for browsers without Ogg.")
    a("- **On `file://`:** `fetch` fails, so effects and music fall back to `<audio>` elements.")
    a("- **Sound control (row 608):** a mute button and a volume slider (`audio.settings.master`), top right, in one place on the intro, the mode select and the pause pages. A tap on the speaker mutes; a tap or a drag on the slider sets the volume and unmutes. M mutes; − and + step the volume. Larger on touch. On the intro it lifts the audio gate without START.")
    a("- **Its dropdown (row 616):** the caret opens MUSIC (`audio.settings.music`) and SFX (`audio.settings.sound`), a slider each, under the control. A slider moved unmutes. A tap away closes it and does nothing else. It closes when play resumes.")
    a("- **Options:** Volume 0–10, Music 0–10, SFX 0–10, Mute. Left and right adjust; OK steps. Saved as `dummies.p9.audio`. Defaults `audio.settings.master`, `audio.settings.music`, `audio.settings.sound`.")
    a("- **Sound Lab picks:** `prototypes/p9/sound_lab.html` saves them as `dummies.p9.audio.lab`. The game merges them at load. `#audio=<base64 JSON>` carries them across origins.")
    a("- **Edge cues** (§6.6 of the handover): low health crosses `audio.sfx.lowHealthAt`. A car starts flashing (noticed). Brake lights come on. A part breaks. The intro loop's hit.")
    a("- **Credits:** two lines, the pack's credits: \"Music by ansimuz\", \"Sound effects by Chequered Ink\". Style Guide V2's C1 widened to the makers of licensed music and sound (D86 closed; row 615).")
    a("")
    a("## 2 MUSIC (OGG)")
    a("")
    a("| State | Screens | Detect | Track | Loop | Transition | Registry |")
    a("|---|---|---|---|---|---|---|")
    for m in EV["music"]:
        scr, det, rid = MUSIC_ROWS[m["id"]]
        tr = "duck over `audio.music.duckSeconds`" if M["states"].get(m["id"]) == "duck" else "fade in `audio.music.fadeInSeconds`, out `audio.music.fadeOutSeconds`"
        a(f"| `music.{m['id']}` | {scr} | {det} | {state_cell(m['id'])} | yes | {tr} | {rid} |")
    a("")
    a("- **Registry column:** the integrator records each state's track there from the map. The build reads `cues.json`; the Sound Lab and the map change it.")
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
    a("- **Story tiles:** tile *n* = Monument A1 … Waterfront B2 in story order, 1–27. A level card announces its tile; that tile's track starts with the card and holds until the next card.")
    a("- **Arcade:** the session's level *n* plays slot ((*n* − 1) mod 4) + 1, from its card. A district's next road is the next level.")
    a("")
    a("## 3 SFX (WAV)")
    a("")
    a("Columns: the cue; what triggers it, with its code site; the files (a pool), or the generated tone; bus; volume ID; cooldown ID. Variants are indented under their event. **L** marks Lawrence's pick (rows 603, 607, 614); the agent's pick follows it.")
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
                lw = ""
                if c.get("by"):
                    ag = c.get("agent", {})
                    lw = " **L** (agent: " + (", ".join(f"`{f}`" for f in ag.get("files") or []) if ag.get("decision") == "cue" else ag.get("decision", "—")) + ")"
                vol = f"`{c['gainId']}`" + (f" + `{c['offsetId']}`" if c.get("offsetId") else "")
                if c["decision"] == "cue":
                    a(f"| {name} | {trig} | {files(c)}{lw} | {c['bus']} | {vol} | `{c['cooldownId']}` |")
                elif c["decision"] == "synth" and c.get("tone"):
                    a(f"| {name} | {trig} | tone `{c['tone']}`{lw} | {c['bus']} | {vol} | `{c['cooldownId']}` |")
                else:
                    note = {"silence": "*silence*", "synth": "*no tone: the live synth*", "base": f"*as `sfx.{c.get('variantOf')}`*"}[c["decision"]]
                    a(f"| {name} | {trig} | {note}{lw}: {c['why'].split(' Agent: ')[0]} | — | — | — |")
        a("")
    n = {k: sum(c["decision"] == k for c in C["sfx"].values()) for k in ("cue", "silence", "synth", "base")}
    used = sorted({f for c in C["sfx"].values() if c["decision"] == "cue" for f in c.get("files", [])})
    a(f"**Totals:** {len(C['sfx'])} entries: {n['cue']} cues, {n['silence']} silences, {n['synth']} generated tones, {n['base']} on its base. "
      f"{len(used)} of {INV['sfx']} pack files used; {INV.get('tones', 0)} generated tones in `prototypes/p9/audio/tones/`. Lawrence's picks: {len(C['picks']['changed'])} entries.")
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
    a(f"- **Music:** {len(TR)} stereo OGG: six from the pack (48 kHz, 66–123 s) and four generated (44.1 kHz, 31–63 s). {min(t['level'] for t in TR.values())} to {max(t['level'] for t in TR.values())} LUFS.")
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
    n_sil = sum(c["decision"] == "silence" for c in C["sfx"].values())
    a("## 9 Play fix: the cone brief and the floor (row 620)")
    a("")
    a("> (30 October 13:07) I died on a cone-baited car but my body did not die.")
    a("")
    a(f"- **Cone-baited:** a car that reacted to a cone within `story.coneBaitSeconds` ({SIMP.get('story.coneBaitSeconds')} s) counts. Its swerve or stop, its return to lane and its stop for the dummy after all count.")
    a("- **Why:** on Monument A2, cars that swerved round a cone then stopped for the dummy (30 times) or returned to lane (9) within 6 s. A hit then counted as \"body\" or \"return\", never the cone.")
    a(f"- **The floor** (`story.floorHold` {SIMP.get('story.floorHold')}): a miss of the brief never takes the chassis below `story.missFloor` ({REG['story.missFloor']['default']}), small hits included. At the floor, a hit to the brief writes it off.")
    a(f"- **The readout** (`ui.hud.bodyCeil` {SIMP.get('ui.hud.bodyCeil')}): a live chassis reads at least 1. BODY 0 means written off.")
    a("- **The toast:** \"HELD AT 1 · the brief wants cone-baited car\" names the brief.")
    a("- **Frozen builds:** registry defaults 0. Prototypes 7.10–8.4 keep their rule.")
    a("")
    a("## 10 QA fixes (rows 622–625)")
    a("")
    a("> (30 October 19:10) Fix honk - 2 max per car once they are stuck. Fix knock and touch spent - change the icon on a spent car is a TICK. Only 2 max knock spent per car within a 2 second window. Fix car-notice and bark - no sounds.")
    a("")
    a("- **The run** (row 622): an adversarial QA agent played Arcade, three personas for 30 min each (`qa/agent.js`, `qa/monitor.js`). Report: `qa/REPORT.md`.")
    a(f"- **Honk** (QA-01, row 623): a car's horn sounds `audio.sfx.honkMaxPerCar` ({REG['audio.sfx.honkMaxPerCar']['default']}) times at most. The cap counts the sim's honk and the draw's 1.4 s repeat. The \"!\" mark still flashes.")
    a(f"- **Spent repeats** (QA-02, row 624): knock and touch-spent off one spent car sound `audio.sfx.spentRepeatMax` ({REG['audio.sfx.spentRepeatMax']['default']}) times each in any `audio.sfx.spentRepeatSeconds` ({REG['audio.sfx.spentRepeatSeconds']['default']} s). A live car is not capped.")
    a(f"- **Spent tick** (row 624): `ui.spentTick` ({SIMP.get('ui.spentTick')}). A spent car carries a tick on its roof, upright, white edged in ink. The cue key shows it beside \"Already hit you\".")
    a("- **Silent** (QA-03, QA-04, row 625): `car-notice`, `bark`, `bark.shout`. The headlamp flash and the bubbles still show.")
    a("- **Where:** `game.js` `audGate`, before the cue map. A capped event logs `gated` and hushes the synth.")
    a(f"- **Contact grace** (QA-02, D88 closed, row 630): `proto.contactGraceSeconds` ({SIMP.get('proto.contactGraceSeconds')} s). A touch on the same car within it continues the contact: no new bounce, hit, knock or touch-spent. Leaning on a stopped car: 113 knocks in 40 s before, 5 after.")
    a(f"- **The dash by wear** (row 629): `sfx.lunge` whoosh B1; `sfx.lunge.damaged` B2 from wear `audio.sfx.dashDamagedAt` ({REG['audio.sfx.dashDamagedAt']['default']}); `sfx.lunge.wrecked` B3 from `audio.sfx.dashWreckedAt` ({REG['audio.sfx.dashWreckedAt']['default']}). Wear: 1 − health ÷ maximum. The takes: generated, `audio/tones.py` (rows 626–628).")
    a("")
    a("## 11 Open")
    a("")
    a("- **Generated music:** four tracks composed in code (`audio/music_gen.py`) to fill the pack's gaps. Heard here only as numbers: loudness, spectrum, structure. Lawrence's ear decides; the Sound Lab swaps any of them.")
    a("- **Tone fidelity:** a generated tone is one rendering. Prototype 8.4 scaled some of its sounds with the hit's force; the tones take the middle of each range.")
    a(f"- **Silenced:** {n_sil} entries (§3). Switch any on in the Sound Lab.")
    a("- **Licence:** the pack's credit lines only. The licence texts were not supplied.")
    a("- **Devices:** Safari and iOS play Ogg Vorbis from 18.4. Older ones get each track's MP3 (`canPlayType`). Effects are WAV everywhere. Untested on a device.")
    a("- **Seam on odd servers:** a host that sends no file length gives the music no duration; the engine then takes the inventory's length for the fade out.")
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
        seen = {}
        for c in cues:
            seen.setdefault(c["id"], []).append(c["file"])
        for cid, fl in seen.items():
            d = C["sfx"].get(cid, {})
            alts = ", ".join(f"`{f}`" for f in d.get("alternates", [])) or "—"
            heard = ", ".join(f"`{f}`" for f in dict.fromkeys(fl)) + (f" ×{len(fl)}" if len(fl) > 1 else "")
            a(f"- **`sfx.{cid}`** · {d.get('label', '')}: {heard} · pool {files(d) or '—'} · alternates {alts}")
        if not cues:
            a("- No effect on this step.")
        a("")
    TOUR_MD.write_text("\n".join(L) + "\n", encoding="utf-8")
    return TOUR_MD


if __name__ == "__main__":
    for p in (gdd(), tour()):
        print(p.relative_to(ROOT), p.stat().st_size, "bytes")
