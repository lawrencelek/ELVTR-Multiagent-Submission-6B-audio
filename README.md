# DUMMIES — Sound Designer Agent

**ELVTR Multi-Agent Systems · Sound (Assignment 6B) · Lawrence Lek · 30 October 2026 · Prototype 9 · GDD Edit 100**

**DUMMIES** is a top-down game. You are a crash-test dummy in training in SHENZHEN SMART CITY. Dummy Corporation narrates, deadpan and inspirational. Prototype 9 adds sound: six OGG tracks (ansimuz), four more composed in code for the endings, and 100 WAV effects (Chequered Ink).

**The agent:** a sound designer that reads the pack's file names and the game's code, and writes the cue map.

- **Evidence first, no model:** an inventory of the pack (length, loudness, peak) and a catalogue of the 94 places the code can make a sound.
- **The loop:** a **designer** proposes the cue map. **Lint** measures what a script can. A **reviewer** scores the map out of 10 against a sound guide. A **refiner** fixes what the REASON names. A fresh reviewer must confirm 10/10.
- **After the loop:** an **integrator** writes the cue map the build plays, and its registry IDs.
- **Then Lawrence chose:** his picks from the Sound Lab sit over the agent's map, as his decision (rows 603, 607). His rulings set the music's rules and fades (rows 609–618).
- **Generated tones:** every sound Prototype 8.4 synthesised is rendered to a WAV file, so a `synth` cue plays in the same mix as the pack (row 604).

**Try it:**

- **[Prototype 9](prototypes/p9/dummies_p9.html)**, the game with sound. Press any key on the intro screen to start the sound.
  - A sound control sits top right on the intro, the mode select and the pause pages: a mute button and a volume slider. M mutes; − and + step the volume.
  - Its caret (▾) opens a dropdown with separate MUSIC and SFX sliders.
  - Options has VOLUME, MUSIC, SFX and MUTE.
- **[The Text Lab](prototypes/p9/text_lab.html)**, the text review: all 369 lines the player reads, 127 with a proposed change, each with an in-game preview and its limits. Approve, keep or edit; export the decisions (row 621).
- **[The Sound Lab](prototypes/p9/sound_lab.html)**, an audition page:
  - every cue and music state, beside a screenshot of its moment;
  - swap files and tracks, change weights, play timed sequences;
  - the game picks up your choices in the same browser.
- **On GitHub Pages (live, branch `gh-pages`, folder `/`):**
  - Home: https://lawrencelek.github.io/ELVTR-Multiagent-Submission-6B-audio/
  - Prototype 9: https://lawrencelek.github.io/ELVTR-Multiagent-Submission-6B-audio/prototypes/p9/dummies_p9.html
  - Sound Lab: https://lawrencelek.github.io/ELVTR-Multiagent-Submission-6B-audio/prototypes/p9/sound_lab.html
  - Text Lab: https://lawrencelek.github.io/ELVTR-Multiagent-Submission-6B-audio/prototypes/p9/text_lab.html
- **Locally:** `python3 -m http.server` in this folder, then open `http://localhost:8000/`. Opened as a file, the pages still play sound through a slower fallback.

## At a glance

| Deliverable | Where |
|---|---|
| **Documentation:** which SFX (WAV) and MUSIC (OGG) cues play where | [GDD Edit 100](coder/gdd/DUMMIES_GDD_Edit100_Prototype_9_Sound.md): §2 MUSIC, §3 SFX (every cue, its trigger, files, bus, volume ID, cooldown ID) |
| **Gameplay points with screenshots** | [`prototypes/p9/SOUND_TOUR.md`](prototypes/p9/SOUND_TOUR.md): 47 steps, 31 screenshots, each cue heard and its alternates |
| **The audition page** | [`prototypes/p9/sound_lab.html`](prototypes/p9/sound_lab.html) (built by `make_lab.py`) |
| **The text review** | [`prototypes/p9/text_lab.html`](prototypes/p9/text_lab.html) and [`content/text/REVIEW.md`](content/text/REVIEW.md): every line, before and after. Inventory `text/inventory.py`, brief `text/BRIEF.md`, lint `text/lint.py`, reviewer `text/REVIEWER.md` |
| **Adversarial QA** | [`qa/REPORT.md`](qa/REPORT.md): an agent played Arcade 3 × 30 min to break it (`qa/agent.js`, `qa/monitor.js`); findings QA-01–06, evidence in [`qa/runs/`](qa/runs/) |
| **The new build** | [`prototypes/p9/dummies_p9.html`](prototypes/p9/dummies_p9.html) with `prototypes/p9/audio/` (built by `build.py`) |
| **The agent** | [`audio/`](audio/): `inventory.py`, `events.py`, `loop.py`, `lint.py`, `llm.py`, `integrate.py`, `agents/`, [`SOUND_GUIDE.md`](audio/SOUND_GUIDE.md) |
| **Evidence** | [`audio/runs/`](audio/runs/): every agent input and output, every map version, lint, a `trace.md` per run |
| **The cue map** | [`content/audio/cues.json`](content/audio/cues.json): the agent's accepted map ([`design.json`](content/audio/design.json)) with Lawrence's picks over it ([`picks_lawrence.json`](content/audio/picks_lawrence.json), [`picks_lawrence_2.json`](content/audio/picks_lawrence_2.json), [`picks_lawrence_2_tones.json`](content/audio/picks_lawrence_2_tones.json), [`picks_lawrence_3.json`](content/audio/picks_lawrence_3.json), [`picks_lawrence_4.json`](content/audio/picks_lawrence_4.json)) |
| **Generated tones** | [`audio/tones.py`](audio/tones.py) → `prototypes/p9/audio/tones/` (70 WAV: whoosh B and three darker takes, alternates for the dash, rows 626–628) and [`content/audio/tones.json`](content/audio/tones.json) |
| **Generated music** | [`audio/music_gen.py`](audio/music_gen.py) → Tracks 7–10 in `prototypes/p9/audio/music/` (OGG and MP3) and [`content/audio/music_gen.json`](content/audio/music_gen.json) |
| **Tests** | `prototypes/p9/test_p9.js`: 46/46 ([`shots/test_p9.json`](prototypes/p9/shots/test_p9.json)) |
| **Decisions** | [`DECISIONS.md`](DECISIONS.md) rows 591–620; D86 closed |

## 1 The agent

```mermaid
flowchart TD
    INV[/"inventory.py: 106 files<br/>length, LUFS, true peak, RMS, credit"/]
    EVT[/"events.py: 94 events + 13 variants<br/>from emit( sites, present( cases, screens"/]
    DES["Designer agent<br/>agents/designer.md"]
    LINT[["lint.py: measured evidence<br/>coverage, files, durations, cooldowns, clashes, music spans"]]
    REV["Reviewer agent<br/>agents/reviewer.md + SOUND_GUIDE.md<br/>SCORE: X/10 · REASON"]
    TEN{"10/10?"}
    CONF["Fresh reviewer: confirm"]
    REF["Refiner agent<br/>agents/refiner.md + SOUND_GUIDE.md"]
    INT["integrate.py: cues.json, registry edit100<br/>loudness trims; refuses blocking lint"]
    BUILD[/"build.py → dummies_p9.html · make_lab.py → sound_lab.html"/]
    INV --> DES
    EVT --> DES
    DES --> LINT --> REV --> TEN
    TEN -- no --> REF --> LINT
    TEN -- yes --> CONF
    CONF -- "10/10" --> INT --> BUILD
    CONF -- "dissent: its REASON" --> REF
```

- **Three agents, no shared memory.** Each step is a fresh `claude -p` call with no tools, on Opus. The reviewer and refiner read the whole guide.
- **The catalogue is generated from the code.** `events.py` scans every `emit('…')` in `sim.js`, `world6.js` and `story.js`, and every derived case in `game.js`. An event with no annotation fails the run, so the catalogue cannot drift from the build.
- **The guide** (`audio/SOUND_GUIDE.md`): 17 rules in six sections, each with a severity and a test.
  - **Coverage:** every event has an entry; high priority has a cue.
  - **Fit:** the name, length, weight and tone suit the event.
  - **Clashes and spam:** no shared file between events that fire together; cooldowns on per-frame events.
  - **Loudness and licence:** every file measured and credited.
  - **Music:** the request's three spans.
  - **Alternates:** two or three for the Lab.
- **Scoring:** blocking −4, major −2, minor −1, once per entry. The floor is 1.
- **Lint is evidence, not the grade.** The reviewer must deduct each finding, or say why it is wrong.
- **No human step inside.** A reply that breaks the format or its own arithmetic goes back once. The loop stops at three refinements.
- **Replay:** `AUDIO_REPLAY=audio/runs/<id> python3 audio/loop.py` reruns from saved outputs, with no model calls.
- **Incremental:** `--from <map>` starts from an accepted map, with no designer call. Use it when the catalogue grows.

## 2 The runs

| Run | Start | Scores | Result | Calls · cost |
|---|---|---|---|---|
| [`20261030-012347-cues`](audio/runs/20261030-012347-cues/trace.md) | Designer | 7 → 10 | 10/10, confirmed. Not integrated: four lint findings were blocking | 5 · $2.17 |
| [`20261030-013331-cues`](audio/runs/20261030-013331-cues/trace.md) | Run 1's map | 4 → 9 → 9 → 9 | Stopped at the cap | 7 · $2.92 |
| [`20261030-014423-cues`](audio/runs/20261030-014423-cues/trace.md) | Run 2's map | 5 → 10 | 10/10, confirmed. **Integrated** | 4 · $1.54 |

**What each run taught the loop:**

- **Run 1: the reviewers overruled lint.**
  - Lint raised seven findings. Five were spellings: the designer named tracks by file name and a cooldown by its full registry ID.
  - Both reviewers rejected all seven: "Lint should match tracks by the inventory's track number." The other two entries stated reasons the guide accepts.
  - Lint now reads those spellings (row 598).
  - The reviewer also caught three real faults:
    - `level_up.wav` too quiet for a tile clear;
    - a shouted bark on the alert class;
    - `tidal_wave.wav`, a water disaster, as an alternate for a cloth lifting.
- **Run 2: the catalogue grew, and the reviewer judged the wrong levels.**
  - A new variant, `chassis.start`: the first chassis is issued under the level card. Lint found it missing (C1, blocking). The refiner added it.
  - The reviewer then marked weight (F3) down three rounds running. It compared files' measured levels, which the integrator's loudness trims even out.
  - The guide now states the trims and judges weight by gain class (row 599).
- **Run 3:** the reviewer caught a renamed music file (L1, blocking) and a menu confirm offered as a landing alternate. One refinement reached 10/10, and a fresh reviewer confirmed it.

**The agent's accepted map:** 107 entries. 66 cues from 58 of the 100 files; 28 stated silences; 12 left to Prototype 8.4's synth; 1 variant on its base.

- **The honk stays synthetic.** The pack has no horn, and the synth keeps each tier's voice. The reviewers accepted that reason under C2.

**Lawrence's picks** (row 603) then changed 21 entries in the Sound Lab:

- **New files:** the dash, START, the push, the sling, big hits, the write-off, broken parts, low health, a held chassis, cone pickups.
- **Silences that now sound:** levels, cone drops, cars striking cones.
- **Set to their generated tones:** rail jumps, slips, spent cars, empty dashes, cone hits.
- **Denied** is 3.5 dB louder.

**Lawrence's second round** (rows 606–607):

- **Eight new tones:** near-miss, low health, part breaks, car strikes a cone, cone stops, combo banked, honk (longer), car notices you.
  - The 8.4 tones they replace stay as `tone_<event>_p84.wav`.
- **Hits play their generated tones:** hits, big hits, drop hits, write-offs, held chassis, the push, the hitch, the sling, denied, the cloth lifting.
- **New files:** a new chassis gets `bubble.wav`, and the level start gets its own cue, `teleport.wav`. The ferry's set-down gets `laser_5.wav`.
- **Back to silence:** levels and empty dashes.
- **Quieter:** long jumps, deck drops, the river splash, a model learning, the river rescue, the cloth lifting.

**Lawrence's third round** (row 614): the new chassis plays a generated blip, `tone_chassis.wav`, so it no longer shares `bubble.wav` with the bark bubbles. A fix makes his `teleport.wav` level-start pick play at last (row 618).

**The map the game ships:** 52 cues from 43 files, 23 silences, 32 generated tones.

## 3 Music

| State | Track |
|---|---|
| Intro screen (after the first press) | Track 1 · megabot |
| Menus: mode select, saves, splash, map, district select, high scores, loading | Track 2 · summer nights |
| Every level card | The level's track starts |
| Levels: drone drop, play, ferry | Rotation: Tracks 3, 4, 5, 6 |
| Gift screen, report, workshop | The level track at 70% |
| Write-off | The level track at 50% |
| Pause | The level track at 35% |
| Licensed | Track 8 · licensed (generated) |
| Failed test | Track 9 · failed test (generated) |
| Non-compliant | Track 10 · non-compliant (generated) |
| Finale (unveiling, voyage) | Track 1 |
| At the ship: CERTIFIED | Track 7 · certified (generated) |
| Credits | Track 1 |

- **Story:** the tile *n* a level card announces plays slot ((*n* − 1) mod 4) + 1, so neighbouring tiles always differ. The track holds until the next card: walking back to a cleared tile never changes it.
- **Arcade:** each level's card takes the next slot.
- **Fades:** every track fades in over 0.3 s from each start and out over 0.3 s at each end, the loop's seam included.
- **Lawrence ruled on all six readings** (rows 609–617).
- **Generated music** (row 619): the pack has six tracks, so `audio/music_gen.py` composes four more in code: pulse, triangle, saw and FM voices, a plucked string, a pad, drums, a delay and a reverb. Each is a whole number of bars and loops on the bar.
  - **7 · certified:** the ship. 76 BPM, D major pentatonic: a ship's horn, plucked strings, bells, a gong at the climax.
  - **8 · licensed:** 124 BPM, C major: a chip lead over an arpeggio, four on the floor.
  - **9 · failed test:** 66 BPM, A minor: a slow line, a wobbling pad, a heartbeat.
  - **10 · non-compliant:** 100 BPM: hold music, off-beat electric piano, a cold chime.

## 3.1 A play fix (row 620)

Lawrence: "I died on a cone-baited car but my body did not die."

- **Cause:** a car that swerved round a cone, then stopped for the dummy or returned to its lane, no longer counted as cone-baited. On Monument A2, 39 cars reacted to a cone; within 6 s they made 30 stops for the dummy and 9 returns to lane, each a moment a hit would not count. A tap under 1 health then left 0.4 alive, which read BODY 0.
- **Fix:** a cone reaction counts for `story.coneBaitSeconds` (6 s). At 1 health a miss holds, small hits included; a hit to the brief writes off. A live chassis never reads BODY 0.
- **Frozen builds keep the old rule:** the three IDs default to 0 in the registry.

## 3.2 The text review (row 621, for Lawrence's approval)

Lawrence: "messages such as 'HELD AT 1 · the brief wants cone-baited car' are not exactly in the correct tone and canon. Maybe it can be a tad snarkier."

- **Inventory** (`text/inventory.py`, no model): 369 lines the player reads in Prototype 9. 147 car barks; 42 story texts; 27 notices; 21 labels; 56 feedback toasts; 9 strip lines; 29 screen lines; 38 interface lines.
- **Drafts:** four writers in parallel, one batch each, on `text/BRIEF.md`. The brief proposes Style Guide V2.10: T1 gains a dry corporate snark; T15 gives feedback a put-down, then the fix; T16 keeps status lines crisp, praise withheld.
- **Lint** (`text/lint.py`): placeholders, banned words, length, sentences, "!", caps, repeats.
- **Review:** a fifth agent, which wrote none of the lines, flagged 16 (`text/REVIEWER.md`): held lines that missed their brief, repeated put-downs, two cone mechanics, the ending's "adequately". All 16 fixes are taken.
- **Result:** 127 changes proposed, none over a limit. One held line per brief, from Lawrence's example: "Try harder. Bait a car with a cone, then get hit by it."
- **Nothing is applied** until Lawrence decides in the Text Lab.

## 3.3 Adversarial QA (rows 622–625)

Lawrence: "conduct an adversarial QA game agent who wants to break the game and set them to run in the arcade mode for 30 minutes. Look particular at collisions, getting stuck, and never ending sound triggers."

- **Agent:** `qa/agent.js`, three personas in parallel, 30 min each: clipper (walls, edges, cars), saboteur (lanes, cones, hitches), chaos (keys, pause, mute, blur, resize). 65.8 game minutes, 11 runs.
- **Monitor:** `qa/monitor.js`, inside the page, 10 Hz, on the game's clock. Collisions, stuck states, sound loops, music.
- **Found:** four sound loops. A blocked car honked every 1.4 s without end (QA-01). Leaning on a spent car knocked ~16 times a second (QA-02). car-notice and barks rang near-constantly (QA-03, QA-04).
- **Clean:** no collision fault, trapped body, stuck mode, phase, car or menu; no music or engine fault.
- **Fixed** (Lawrence, 19:10): `audio.sfx.honkMaxPerCar` 2; `audio.sfx.spentRepeatMax` 2 per `audio.sfx.spentRepeatSeconds` 2; a tick on a spent car (`ui.spentTick`); car-notice and barks silent. Each verified in play (`qa/repro.js`).
- **Then:** the lean jitter (D88) closed by a 0.3 s contact grace (`proto.contactGraceSeconds`, row 630): 113 knocks in 40 s of leaning became 5.

## 4 The engine

`prototypes/p9/audio.js`, created by `game.js` only when `audio.enabled` is 1. Prototypes 8 to 8.4 never set it.

- **Buses:** music, SFX and UI under a master.
- **Loudness:** each file is trimmed to a target per bus.
- **Weight and spam:** gain classes, cooldown classes, a voice cap, pitch jitter.
- **Music:** three players. 0.3 s fades at every start and end, the loop's seam included. Ducks for pause, the gift screen, report and workshop, and the write-off.
- **Generated tones:** a `synth` entry plays its event's tone, rendered from Prototype 8.4's recipe, with the same gain class, cooldown and trim as a pack file. An event with no tone keeps the live synth.
- **Hooks in `game.js`:** about 30 small, gated hooks.
  - Every sim event and derived case asks the cue map first. A cue or a stated silence hushes the synth for that event.
  - Menus click, move and go back.
  - **Edge cues:** low health (a threshold), a car that notices the dummy, brake lights coming on, a part breaking, the intro loop's hit.
  - The intro waits for a first press before it plays anything.
  - The sound control (row 608): mute and volume, top right, in one place on the intro, the mode select and the pause pages; larger on touch. Its dropdown (row 616): MUSIC and SFX sliders. Options: VOLUME, MUSIC, SFX, MUTE. All saved in the browser.
- **Safety:** a failure inside the engine never stops the game.
  - `create()` falls back to the shipped map, and every entry point is guarded.
  - Picks from the Lab or a link are cleaned before use: malformed ones are dropped.
- **An independent review** found three bugs, now fixed (row 605):
  - one malformed pick stopped the game from starting;
  - the Lab and the game could disagree about a pick;
  - an emptied pool still played in the game.
  - It also flagged fades cut short and audio that unlocked before the browser allowed it. Both are fixed.
- **Frozen builds:** Prototype 8.4 rebuilt from the changed shared code draws the same strings as the frozen build, on the same 32-step tour. Car barks and live counts are left out of the comparison: traffic varies them run to run. `dummies_p8_4.html` is unchanged (md5 `9f5549201d88891f9f0b22c461602909`).

## 5 The Sound Lab

- **Effects:** all 107 entries, grouped, filtered and searchable. A filter shows Lawrence's picks; each names the agent's original.
  - Each has the screenshot of its moment.
  - Choose Cue, Silence, Generated tone, or the base cue.
  - Edit the pool: add, remove, or "use only this", from the designer's alternates or all 100 files.
  - Set the gain class, a fine dB offset and the cooldown.
  - **▶ Play as in the game** applies the trim, the class, the pool and the jitter. **▶ Its generated tone** plays Prototype 8.4's sound for comparison.
- **Music:**
  - the six tracks;
  - each screen's track;
  - the rotation, drawn on the Story's 27 tiles and Arcade's runs;
  - the mix: bus levels, fades, ducks, gain classes;
  - the VOLUME, MUSIC and SFX faders, shared with the game.
- **Sequences:** twelve timed moments over their music, among them a combo to the cap, a write-off, the drone drop, the river rescue and the finale.
- **Tour:** the 45 steps of `tour_p9.js`, with the cues each fired.
- **Library:** the pack, the four generated tracks and the 66 generated tones by family, with each file's length, level and users.
- **Picks:**
  - **Play the game with these picks** opens Prototype 9 with them.
  - **Export** gives JSON and a plain summary to send back.
  - **Import** and **Reset** are beside it.

## 6 Tests

`cd prototypes/p9 && node tour_p9.js && node test_p9.js --p84` → 49/49:

- every file in the cue map loads, tones included;
- nothing plays before the first press;
- each screen of the tour plays its state's track: 18 checks, the cards, the ferry, Story tiles 1 and 2, each run end and CERTIFIED included;
- the ducks: write-off 0.5; report, workshop and gift screen 0.7;
- the fades: the music dips to silence at the loop's seam and comes back;
- every catalogued event and variant does what the map says (107: cue, tone, silence or base);
- START, cursor moves, the Arcade run's track, the pause duck;
- Options shows VOLUME, MUSIC, SFX and MUTE, and saves them;
- the sound control sits in one place on three screens, mutes, sets the volume, and lifts the intro's gate without START; M and − work;
- its dropdown sets MUSIC and SFX apart, saves them, and a tap away only closes it;
- the cone brief on Monument A2: a stop for the dummy 2 s after the cone writes off and counts; a miss holds at 1, small hits included; BODY never reads 0 alive (row 620);
- the QA caps: a car honks twice at most; knock and touch-spent off a spent car twice in any 2 s, live cars free; car-notice and barks silent (rows 623–625);
- the game takes the Lab's picks from `#audio=`; malformed picks are dropped and the game still starts;
- no page or engine errors;
- Prototype 8.4 draws the same strings (barks and live counts aside), and its frozen file is unchanged.

## 7 Open

- **Licence:** only the pack's credit lines were supplied, not its licence texts.
- **Devices:** Safari and iOS play Ogg Vorbis from 18.4; older ones get each track's MP3 (`canPlayType`). Effects are WAV everywhere. Untested on a device.
- **Silenced:** 26 entries, among them brake lights coming on, car-notice and barks. The Lab switches any on.
- **Generated music:** checked by numbers (loudness, spectrum, structure), not by ear. Swap any of the four in the Lab.
- **Tone fidelity:** each tone is one rendering. Prototype 8.4 scaled some sounds with the hit's force; the tones take the middle of each range.

## 8 Run it

Needs Python 3.9+, Node 18+, Playwright with Chromium, `ffmpeg`, and [Claude Code](https://claude.com/claude-code) signed in, for the agent only.

```
python3 audio/tones.py                         # Prototype 8.4's synth → prototypes/p9/audio/tones/
python3 audio/music_gen.py                     # Tracks 7–10 → prototypes/p9/audio/music/
python3 audio/inventory.py                     # the pack and the tones → content/audio/inventory.json
python3 audio/events.py                        # the code → content/audio/events.json
python3 audio/loop.py                          # the agent → audio/runs/<id>/, content/audio/design.json
python3 audio/loop.py --from content/audio/design.json   # incremental, after the catalogue changes
python3 audio/integrate.py                     # + Lawrence's picks → content/audio/cues.json, registry edit100
python3 prototypes/p9/build.py                 # → prototypes/p9/dummies_p9.html
cd prototypes/p9 && node tour_p9.js && node test_p9.js --p84 && cd ../..
python3 prototypes/p9/make_lab.py && python3 audio/make_gdd.py
```

`prototypes/p8/build.py` reproduced `dummies_p8_4.html` byte for byte at the seed. It no longer does: it stamps the registry version (now edit100) and reads the shared `game.js`. Never commit a rebuilt 8.4.

Seeded from `lawrencelek/ELVTR-dummies-agent-crew@49f17d4` ([`SOURCE.md`](SOURCE.md)).
