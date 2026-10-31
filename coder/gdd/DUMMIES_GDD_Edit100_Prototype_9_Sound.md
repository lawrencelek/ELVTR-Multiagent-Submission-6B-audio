# DUMMIES GDD — Edit 100 · Prototype 9 · Sound

**30 October 2026 · Lawrence Lek** · Build `prototypes/p9/dummies_p9.html` · Registry `edit100-2026-10-30` · Cue map `content/audio/cues.json`, run `20261030-014423-cues` (10/10, confirmed) · Tests 50/50

## 0 Request

> Next I want to integrate sound design. Next - a sound designer agent. I have downloaded royalty-free music tracks and sound effects pack.
> Music - Track 1 - Splash Screen. Track 2 - From menu until just before the level starts (whether story or arcade mode). Track 3, 4, 5, 6, Alternate between different levels and maps.
> SFX - read WAV file names and decide on appropriate places to put the sound triggers. Make documentation that covers what SFX (wav) and MUSIC (ogg) cues play at which points.

> I want to create new version of DUMMIES game with SFX with latest prototype … try out different sfx and music for different stages … make a dummy page with testing out different SFX and music for the gameplay points.

> (30 October 11:30) We also need separate SFX and music volume options (maybe via a dropdown?). Also - for music, add small 0.3 second fades in when the track starts and 0.3 second fadeout when the track finishes.

### 0.1 Rulings (Lawrence, 30 October 11:30; DECISIONS rows 609–618)

| # | Ruling | Registry |
|---|---|---|
| Q1 | "Splash Screen" is the intro screen. It shows PRESS ANY KEY; the first press only unlocks audio and starts Track 1. The next press is START | `audio.music.track.intro` (1) |
| Q2 | The level card starts the level's track | `audio.music.track.card` (−1: the level's track) |
| Q3 | The start tile sets the track. Story: the tile *n* a level card announces plays slot ((*n* − 1) mod 4) + 1. The track holds until the next card: a walk back to a cleared tile, the ferry and a write-off never change it. Arcade: each level's card takes the next slot | `audio.music.levelRotation` (3456) |
| Q4 | Pause: the level track at 0.35. Gift screen, report, workshop: the level track at 0.7. Finale and CERTIFIED: Track 1 (megabot). Credits: Track 1 (megabot) | `audio.music.pauseDuck`, `audio.music.screenDuck`, `audio.music.track.*` |
| Q5 | A write-off drops the level track to 0.5; it keeps playing | `audio.music.writeoffDuck` |
| Q6 | The new chassis no longer shares `bubble.wav`: it plays a generated blip. Barks kept a blip until row 625 silenced them (§10) | `sfx.chassis`; `sfx.bark`, `sfx.bark.shout` |
| Endings | Each has a track of its own, generated (row 619): at the ship Track 7 (certified); Licensed Track 8 (licensed); Failed test Track 9 (failed test); Non-compliant Track 10 (non-compliant) | `audio.music.track.certified`, `.licensed`, `.failed`, `.noncompliant` |
| Fades | Every track fades in over 0.3 s from each start and out over 0.3 s at each end, the loop's seam included. A switch is the two, overlapped | `audio.music.fadeInSeconds`, `audio.music.fadeOutSeconds` |

## 1 System

- **Engine:** `prototypes/p9/audio.js`. `game.js` creates it only when `audio.enabled` is 1. Prototype 9 sets 1; the registry default is 0.
- **Buses:** music, SFX, UI under a master. Levels: `audio.music.volume`, `audio.sfx.volume`, `audio.ui.volume`.
- **Generated tones:** Prototype 8.4's procedural sounds, rendered to WAV by `audio/tones.py` (70 files: 8.4's recipes, plus new tones for slip and for the eight events Lawrence asked for (row 606); a replaced 8.4 tone stays as `tone_<event>_p84.wav`). A `synth` entry plays its event's tone through the mix: gain class, cooldown, trim. An event with no entry or tone keeps the live synth, on the SFX bus at `audio.synth.gain`.
- **Lawrence's picks:** his Sound Lab exports over the agent's map, in order: `content/audio/picks_lawrence.json` (row 603), `picks_lawrence_2.json` and `picks_lawrence_2_tones.json` (row 607), `picks_lawrence_3.json` (his rulings: the chassis blip, the music states and values; rows 609–618). His fine gain becomes `audio.sfx.offset.<cue>`.
- **Generated music** (rows 619, 631): Tracks 7–11, composed in code by `audio/music_gen.py` (`content/audio/music_gen.json`): 11 a Story tile cleared; 7 at the ship (CERTIFIED), 8 Licensed, 9 Failed test, 10 Non-compliant. Pulse, triangle, saw and FM voices, a plucked string, a pad, drums; a delay and a reverb. Whole bars, tails wrapped, so each loops on the bar.
- **Hush:** a cue or a stated silence hushes the synth for its event. Hit juice still draws.
- **Loudness:** each file is trimmed toward `audio.sfx.targetLufs` or `audio.music.targetLufs`. Trims cap at `audio.trim.maxBoostDb` and `audio.trim.peakCeilingDb`.
- **Weight:** gain classes set it. `audio.sfx.gain.<class>`, in dB after the trim.
- **Spam:** each cue waits its cooldown, `audio.sfx.cooldown.<class>`. At most `audio.sfx.maxVoices` play at once.
- **Variation:** pools play at random, never the same file twice running, or in turn. Non-menu cues vary pitch by `audio.sfx.pitchJitter`.
- **First gesture:** any key, click or tap unlocks audio. Name entry and the touch listener now unlock too.
- **Fades:** each track fades in over `audio.music.fadeInSeconds` from every start and out over `audio.music.fadeOutSeconds` before the file ends, so the loop's seam dips and returns. A switch fades the old track out and the new one in, overlapped; three players keep quick switches whole. Hidden tabs suspend audio.
- **Ducks:** pause `audio.music.pauseDuck`; the gift screen, report and workshop `audio.music.screenDuck`; the write-off hold `audio.music.writeoffDuck`. Pause wins. Each glides over `audio.music.duckSeconds`.
- **Files:** WAV and OGG beside the page in `prototypes/p9/audio/`, loaded by URL. Each track has an MP3 copy for browsers without Ogg.
- **On `file://`:** `fetch` fails, so effects and music fall back to `<audio>` elements.
- **Sound control (row 608):** a mute button and a volume slider (`audio.settings.master`), top right, in one place on the intro, the mode select and the pause pages. A tap on the speaker mutes; a tap or a drag on the slider sets the volume and unmutes. M mutes; − and + step the volume. Larger on touch. On the intro it lifts the audio gate without START.
- **Its dropdown (row 616):** the caret opens MUSIC (`audio.settings.music`) and SFX (`audio.settings.sound`), a slider each, under the control. A slider moved unmutes. A tap away closes it and does nothing else. It closes when play resumes.
- **Options:** Volume 0–10, Music 0–10, SFX 0–10, Mute. Left and right adjust; OK steps. Saved as `dummies.p9.audio`. Defaults `audio.settings.master`, `audio.settings.music`, `audio.settings.sound`.
- **Sound Lab picks:** `prototypes/p9/sound_lab.html` saves them as `dummies.p9.audio.lab`. The game merges them at load. `#audio=<base64 JSON>` carries them across origins.
- **Edge cues** (§6.6 of the handover): low health crosses `audio.sfx.lowHealthAt`. A car starts flashing (noticed). Brake lights come on. A part breaks. The intro loop's hit.
- **Credits:** two lines, the pack's credits: "Music by ansimuz", "Sound effects by Chequered Ink". Style Guide V2's C1 widened to the makers of licensed music and sound (D86 closed; row 615).

## 2 MUSIC (OGG)

| State | Screens | Detect | Track | Loop | Transition | Registry |
|---|---|---|---|---|---|---|
| `music.intro` | Intro screen (DUMMIES, START), after the first press | `app.screen` intro | Track 1 (megabot) | yes | fade in `audio.music.fadeInSeconds`, out `audio.music.fadeOutSeconds` | `audio.music.track.intro` |
| `music.menu` | Mode select, save slots, name entry, Story splash, story map, district select, high scores. Loading holds the track playing | `app.screen` title, saves, splash, storymap, arcade, scores | Track 2 (summer nights) | yes | fade in `audio.music.fadeInSeconds`, out `audio.music.fadeOutSeconds` | `audio.music.track.menu` |
| `music.credits` | The Credits card, from the title or an ending | `app.credits` | Track 1 (megabot) | yes | fade in `audio.music.fadeInSeconds`, out `audio.music.fadeOutSeconds` | `audio.music.track.credits` |
| `music.card` | Every level card: a district's start, each new tile after the ferry, each Arcade level (Q2) | phase `brief` | The level's track, from the tile the card announces (`audio.music.track.card` −1) | yes | fade in `audio.music.fadeInSeconds`, out `audio.music.fadeOutSeconds` | `audio.music.track.card` |
| `music.level` | Drone drop, play, flips, ferry. The track holds from its card to the next card (Q3) | `app.screen` game, other phases | Rotation: Track 3 → Track 4 → Track 5 → Track 6 | yes | fade in `audio.music.fadeInSeconds`, out `audio.music.fadeOutSeconds` | `audio.music.levelRotation` |
| `music.screens` | The gift screen, the level report, the workshop (Q4) | phases `gift`, `report`, `shop` | The level track at 0.7 (`audio.music.screenDuck`) | yes | duck over `audio.music.duckSeconds` | `audio.music.screenDuck` |
| `music.writeoff` | The write-off hold (Q5) | phase `writeoff` | The level track at 0.5 (`audio.music.writeoffDuck`) | yes | duck over `audio.music.duckSeconds` | `audio.music.writeoffDuck` |
| `music.pause` | Pause, Options, Controls; window blur | `app.paused` | The level track at 0.35 (`audio.music.pauseDuck`) | yes | duck over `audio.music.duckSeconds` | `audio.music.pauseDuck` |
| `music.licensed` | A run ends Licensed | phase `ending`, kind Licensed | Track 8 (licensed) | yes | fade in `audio.music.fadeInSeconds`, out `audio.music.fadeOutSeconds` | `audio.music.track.licensed` |
| `music.failed` | A run ends Failed test | phase `ending`, kind Failed test | Track 9 (failed test) | yes | fade in `audio.music.fadeInSeconds`, out `audio.music.fadeOutSeconds` | `audio.music.track.failed` |
| `music.noncompliant` | A run ends Non-compliant (a refusal) | phase `ending`, kind Non-compliant | Track 10 (non-compliant) | yes | fade in `audio.music.fadeInSeconds`, out `audio.music.fadeOutSeconds` | `audio.music.track.noncompliant` |
| `music.cleared` | A Story tile cleared: the write-off, the report, the ferry, the gift screen, to the next card. Not ducked; pause ducks it | event `story-clear`, until the next card | Track 11 (tile cleared) | yes | fade in `audio.music.fadeInSeconds`, out `audio.music.fadeOutSeconds` | `audio.music.track.cleared` |
| `music.finale` | The unveiling, the voyage | phase `unveil`, `voyage` | Track 1 (megabot) | yes | fade in `audio.music.fadeInSeconds`, out `audio.music.fadeOutSeconds` | `audio.music.track.finale` |
| `music.certified` | At the ship: the set-down, CERTIFIED | phase `ending`, kind Certified | Track 7 (certified) | yes | fade in `audio.music.fadeInSeconds`, out `audio.music.fadeOutSeconds` | `audio.music.track.certified` |

- **Registry column:** the integrator records each state's track there from the map. The build reads `cues.json`; the Sound Lab and the map change it.

| Track | File | Length | Measured | Trim | Plays in |
|---|---|---:|---:|---:|---|
| 1 · megabot | `music/track1_ansimuz-itch-io_megabot.ogg` | 1:12 | -10.4 LUFS | -5.6 dB | intro, credits, finale |
| 2 · summer nights | `music/track2_ansimuz-itch-io_summer-nights.ogg` | 1:12 | -14.5 LUFS | -1.5 dB | menu |
| 3 · chibi robot b | `music/track3_ansimuz-itch-io_chibi-robot-b.ogg` | 2:03 | -11.3 LUFS | -4.7 dB | level slot 1 |
| 4 · happywalking | `music/track4_ansimuz-itch-io_happywalking.ogg` | 1:43 | -13.5 LUFS | -2.5 dB | level slot 2 |
| 5 · dark happy world | `music/track5_ansimuz-itch-io_dark-happy-world.ogg` | 1:36 | -9.1 LUFS | -6.9 dB | level slot 3 |
| 6 · fantasy Dragon | `music/track6_ansimuz-itch-io_fantasy-dragon.ogg` | 1:06 | -16.7 LUFS | +0.7 dB | level slot 4 |
| 7 · certified | `music/track7_dummies-generated_certified.ogg` | 1:03 | -11.6 LUFS | -4.4 dB | certified |
| 8 · licensed | `music/track8_dummies-generated_licensed.ogg` | 0:30 | -10.6 LUFS | -5.4 dB | licensed |
| 9 · failed test | `music/track9_dummies-generated_failed-test.ogg` | 0:43 | -10.4 LUFS | -5.6 dB | failed |
| 10 · non-compliant | `music/track10_dummies-generated_non-compliant.ogg` | 0:38 | -11.0 LUFS | -5.0 dB | noncompliant |
| 11 · tile cleared | `music/track11_dummies-generated_tile-cleared.ogg` | 0:21 | -10.5 LUFS | -5.5 dB | cleared |

- **Story tiles:** tile *n* = Monument A1 … Waterfront B2 in story order, 1–27. A level card announces its tile; that tile's track starts with the card and holds until the next card.
- **Arcade:** the session's level *n* plays slot ((*n* − 1) mod 4) + 1, from its card. A district's next road is the next level.

## 3 SFX (WAV)

Columns: the cue; what triggers it, with its code site; the files (a pool), or the generated tone; bus; volume ID; cooldown ID. Variants are indented under their event. **L** marks Lawrence's pick (rows 603, 607, 614); the agent's pick follows it.

### 3.1 Menus and interface

| Cue | Trigger | Files | Bus | Volume ID | Cooldown ID |
|---|---|---|---|---|---|
| `sfx.ui-move` | A menu cursor moves: arrows, stick, d-pad, WASD. | `select_3.wav` | ui | `audio.sfx.gain.ui` | `audio.sfx.cooldown.ui` |
| `sfx.ui-ok` | A menu choice is confirmed: A, Space, Enter, a tap or a click. | `confirm_4.wav` | ui | `audio.sfx.gain.ui` | `audio.sfx.cooldown.ui` |
| `sfx.ui-back` | A menu goes back or closes: B, Shift, Esc on a page. | `cancel_3.wav` | ui | `audio.sfx.gain.ui` | `audio.sfx.cooldown.ui` |
| `sfx.ui-pause` | Play pauses: Esc, P, START or the pause chip. | `select_4.wav` | ui | `audio.sfx.gain.ui` | `audio.sfx.cooldown.ui` |
| `sfx.ui-start` | START on the intro screen opens the mode select. | `equip_2.wav` **L** (agent: `confirm_1.wav`) | ui | `audio.sfx.gain.ui` | `audio.sfx.cooldown.once` |
| `sfx.ui-gate` | The first press on the intro screen unlocks audio; Track 1 starts. | *silence*: Track 1 starting is the response to the press. | — | — | — |

### 3.2 Dummy moves

| Cue | Trigger | Files | Bus | Volume ID | Cooldown ID |
|---|---|---|---|---|---|
| `sfx.lunge` | The dummy dashes (A). Spends a battery charge. `S:1684` | `tone_lunge_whoosh_b1.wav` **L** (agent: `jump_4.wav`) | sfx | `audio.sfx.gain.move` | `audio.sfx.cooldown.action` |
| ↳ `sfx.lunge.wrecked` | Dash, very damaged | `tone_lunge_whoosh_b3.wav` **L** (agent: base) | sfx | `audio.sfx.gain.move` | `audio.sfx.cooldown.action` |
| ↳ `sfx.lunge.damaged` | Dash, damaged | `tone_lunge_whoosh_b2.wav` **L** (agent: base) | sfx | `audio.sfx.gain.move` | `audio.sfx.cooldown.action` |
| `sfx.jump` | The dummy jumps (B). A jump out of a dash is a long jump. `S:1960` | `jump_1.wav` | sfx | `audio.sfx.gain.move` | `audio.sfx.cooldown.action` |
| ↳ `sfx.jump.dash` | Long jump, out of a dash | `jump_3.wav` **L** (agent: `jump_3.wav`) | sfx | `audio.sfx.gain.move` + `audio.sfx.offset.jump.dash` | `audio.sfx.cooldown.action` |
| `sfx.jump-land` | A jump lands on the ground. `S:1969` | `land.wav` | sfx | `audio.sfx.gain.move` | `audio.sfx.cooldown.action` |
| `sfx.land` | A drop from a walkway or deck lands, on a car or on the ground. `S:2243, S:2247` | `land.wav` | sfx | `audio.sfx.gain.move` | `audio.sfx.cooldown.action` |
| ↳ `sfx.land.car` | Onto a car roof | `door_close.wav` | sfx | `audio.sfx.gain.move` | `audio.sfx.cooldown.action` |
| `sfx.deck-drop` | The dummy steps off a highway parapet or ledge. `S:2227, W:2247` | tone `tone_deck_drop.wav` **L** (agent: synth) | sfx | `audio.sfx.gain.move` + `audio.sfx.offset.deck-drop` | `audio.sfx.cooldown.action` |
| `sfx.rail-jump` | The dummy jumps a walkway rail. `W:2217` | tone `tone_rail_jump.wav` **L** (agent: `jump_3.wav`) | sfx | `audio.sfx.gain.move` | `audio.sfx.cooldown.action` |
| `sfx.stair` | The dummy starts up or down a stair. `S:2150` | tone `tone_stair.wav` | sfx | `audio.sfx.gain.move` | `audio.sfx.cooldown.action` |
| `sfx.level` | The dummy reaches a new level: walkway, deck, roof. `S:2169, S:2173` | *silence* **L** (agent: silence): Lawrence's pick in the Sound Lab (DECISIONS rows 603, 607). | — | — | — |
| `sfx.slip` | A dash is refused on a puddle. `S:1715` | tone `tone_slip.wav` **L** (agent: `wobble.wav`) | sfx | `audio.sfx.gain.move` | `audio.sfx.cooldown.action` |

### 3.3 Abilities

| Cue | Trigger | Files | Bus | Volume ID | Cooldown ID |
|---|---|---|---|---|---|
| `sfx.push` | Arms: the dummy pushes off a car (Y). `S:1879` | tone `tone_push.wav` **L** (agent: `door_close.wav`) | sfx | `audio.sfx.gain.hit` | `audio.sfx.cooldown.action` |
| `sfx.hitch` | The dummy grabs a passing car (X). `S:1904` | tone `tone_hitch.wav` **L** (agent: `equip_1.wav`) | sfx | `audio.sfx.gain.move` | `audio.sfx.cooldown.action` |
| `sfx.sling` | The dummy lets go of a hitched car with speed. `S:1925` | tone `tone_sling.wav` **L** (agent: `shrink.wav`) | sfx | `audio.sfx.gain.move` | `audio.sfx.cooldown.action` |
| `sfx.denied` | A move is refused: no charge, or not fitted yet. `S:1675` | tone `tone_denied.wav` **L** (agent: `blocked.wav`) | sfx | `audio.sfx.gain.alert` + `audio.sfx.offset.denied` | `audio.sfx.cooldown.action` |
| ↳ `sfx.denied.locked` | Not fitted yet | `cancel_1.wav` | sfx | `audio.sfx.gain.alert` | `audio.sfx.cooldown.action` |

### 3.4 Hits and damage

| Cue | Trigger | Files | Bus | Volume ID | Cooldown ID |
|---|---|---|---|---|---|
| `sfx.impact` | A car hits the dummy. Damage, points, the burst. `S:3275` | tone `tone_impact.wav` **L** (agent: `hurt_1.wav`, `hurt_2.wav`, `hurt_3.wav`, `hurt_4.wav`) | sfx | `audio.sfx.gain.hit` | `audio.sfx.cooldown.burst` |
| ↳ `sfx.impact.big` | A big hit | tone `tone_impact_big.wav` **L** (agent: `harsh_destruction.wav`, `explosion_1.wav`) | sfx | `audio.sfx.gain.big` | `audio.sfx.cooldown.burst` |
| ↳ `sfx.impact.drop` | A drop onto a car | tone `tone_impact_drop.wav` **L** (agent: `soft_destruction.wav`, `hurt_3.wav`) | sfx | `audio.sfx.gain.hit` | `audio.sfx.cooldown.burst` |
| `sfx.held` | Story: a hit that misses the brief; the chassis holds at the floor. `S:3276` | tone `tone_held.wav` **L** (agent: `equip_2.wav`) | sfx | `audio.sfx.gain.story` | `audio.sfx.cooldown.once` |
| `sfx.knock` | A car shoves the dummy without damage. `S:2106, W:2346` | tone `tone_knock.wav` | sfx | `audio.sfx.gain.hit` | `audio.sfx.cooldown.frame` |
| `sfx.touch-spent` | The dummy touches a spent car: no reward. `S:3234` | tone `tone_touch_spent.wav` **L** (agent: silence) | sfx | `audio.sfx.gain.hit` | `audio.sfx.cooldown.frame` |
| `sfx.writeoff` | The chassis is written off: health reaches zero. `S:3291` | tone `tone_writeoff.wav` **L** (agent: `explosion_4.wav`) | sfx | `audio.sfx.gain.big` | `audio.sfx.cooldown.once` |
| `sfx.chassis` | A chassis is issued: at a level's start, under the card, and after each write-off. `S:1666` | tone `tone_chassis.wav` **L** (agent: `teleport.wav`) | sfx | `audio.sfx.gain.story` | `audio.sfx.cooldown.once` |
| ↳ `sfx.chassis.start` | At a level's start, under the level card | `teleport.wav` **L** (agent: base) | sfx | `audio.sfx.gain.hit` | `audio.sfx.cooldown.once` |
| `sfx.part-break` | A body part reaches broken (level 3). | tone `tone_part_break.wav` **L** (agent: `fire_1.wav`) | sfx | `audio.sfx.gain.alert` | `audio.sfx.cooldown.once` |
| `sfx.low-health` | The chassis falls below audio.sfx.lowHealthAt of its maximum. | tone `tone_low_health.wav` **L** (agent: `siren.wav`) | sfx | `audio.sfx.gain.alert` | `audio.sfx.cooldown.once` |

### 3.5 Near-misses

| Cue | Trigger | Files | Bus | Volume ID | Cooldown ID |
|---|---|---|---|---|---|
| `sfx.near-miss` | A fast car passes close without touching. `G:712` | tone `tone_near_miss.wav` **L** (agent: synth) | sfx | `audio.sfx.gain.hit` | `audio.sfx.cooldown.burst` |
| `sfx.miss` | A dash ends with no contact. `G:722` | *silence* **L** (agent: silence): Lawrence's pick in the Sound Lab (DECISIONS rows 603, 607). | — | — | — |

### 3.6 Cones

| Cue | Trigger | Files | Bus | Volume ID | Cooldown ID |
|---|---|---|---|---|---|
| `sfx.pickup` | The dummy picks up a cone (X). `S:1611` | `collect_7.wav` **L** (agent: `collect_3.wav`) | sfx | `audio.sfx.gain.move` | `audio.sfx.cooldown.action` |
| `sfx.drop` | The dummy sets a cone down. `S:2004` | `collect_4.wav` **L** (agent: synth) | sfx | `audio.sfx.gain.hit` | `audio.sfx.cooldown.action` |
| `sfx.throw` | The dummy throws a cone. `S:2013` | `jump_2.wav` | sfx | `audio.sfx.gain.move` | `audio.sfx.cooldown.action` |
| `sfx.punt` | The dummy walks into a cone and kicks it. `S:2119, W:2359` | tone `tone_punt.wav` **L** (agent: synth) | sfx | `audio.sfx.gain.hit` | `audio.sfx.cooldown.action` |
| `sfx.cone-hit` | A cone makes a car stop or crash: points. `S:2264` | tone `tone_cone_hit.wav` **L** (agent: `explosion_2.wav`) | sfx | `audio.sfx.gain.hit` | `audio.sfx.cooldown.once` |
| `sfx.cone-struck` | A car runs into a cone. `S:2278` | tone `tone_cone_struck.wav` **L** (agent: silence) | sfx | `audio.sfx.gain.hit` | `audio.sfx.cooldown.ambient` |
| `sfx.cone-stop` | A thrown cone stops sliding. `S:2261` | tone `tone_cone_stop.wav` **L** (agent: silence) | sfx | `audio.sfx.gain.ambient` | `audio.sfx.cooldown.ambient` |
| `sfx.cone-rest` | A cone settles. `S:2267` | *silence*: Background cone settling would clutter traffic. | — | — | — |
| `sfx.cone-release` | Carried cones fall when the dummy is written off. `S:2023` | *silence*: The write-off owns this moment. | — | — | — |

### 3.7 Combos

| Cue | Trigger | Files | Bus | Volume ID | Cooldown ID |
|---|---|---|---|---|---|
| `sfx.combo` | A hit extends a combo (two or more). `S:3256` | `collect_7.wav`, `collect_1.wav`, `collect_2.wav` | sfx | `audio.sfx.gain.reward` | `audio.sfx.cooldown.burst` |
| ↳ `sfx.combo.max` | At the combo cap (scoring.comboMax) | `powerup_2.wav` **L** (agent: `powerup_2.wav`, `powerup_4.wav`) | sfx | `audio.sfx.gain.reward` | `audio.sfx.cooldown.burst` |
| `sfx.combo-end` | The combo clock runs out; the combo is banked. `S:1934` | tone `tone_combo_end.wav` **L** (agent: `chime.wav`) | sfx | `audio.sfx.gain.reward` | `audio.sfx.cooldown.once` |

### 3.8 World

| Cue | Trigger | Files | Bus | Volume ID | Cooldown ID |
|---|---|---|---|---|---|
| `sfx.splash` | The dummy falls into the river. `W:2267` | `water_1.wav` **L** (agent: `water_1.wav`) | sfx | `audio.sfx.gain.big` + `audio.sfx.offset.splash` | `audio.sfx.cooldown.once` |
| `sfx.rescued` | A drone recovers the chassis from the river. `W:2299` | `water_2.wav` | sfx | `audio.sfx.gain.story` | `audio.sfx.cooldown.once` |
| `sfx.screen` | The view moves to a neighbouring tile. `S:3404, W:2407` | tone `tone_screen.wav` | sfx | `audio.sfx.gain.story` | `audio.sfx.cooldown.action` |

### 3.9 Cars

| Cue | Trigger | Files | Bus | Volume ID | Cooldown ID |
|---|---|---|---|---|---|
| `sfx.honk` | A blocked car honks, at the dummy or at a cone. `S:2972` | tone `tone_honk.wav` | sfx | `audio.sfx.gain.alert` | `audio.sfx.cooldown.honk` |
| ↳ `sfx.honk.body` | At the dummy; repeats while it blocks | tone `tone_honk_body.wav` | sfx | `audio.sfx.gain.alert` | `audio.sfx.cooldown.honk` |
| `sfx.skid` | A car skids on a puddle. `S:3142` | tone `tone_skid.wav` | sfx | `audio.sfx.gain.ambient` | `audio.sfx.cooldown.ambient` |
| `sfx.unstick` | A stuck car reverses or replans. `S:2990, S:3027` | *silence*: Replans are invisible; only reversing earns a sound. | — | — | — |
| ↳ `sfx.unstick.reverse` | Reversing beeps | tone `tone_unstick_reverse.wav` | sfx | `audio.sfx.gain.ambient` | `audio.sfx.cooldown.ambient` |
| `sfx.learn-standoff` | A car model learns to stop further back. `S:3266` | `computer_2.wav` **L** (agent: `computer_2.wav`) | sfx | `audio.sfx.gain.story` + `audio.sfx.offset.learn-standoff` | `audio.sfx.cooldown.once` |
| `sfx.car-notice` | A car's headlights start to flash: it has noticed the dummy. | *silence* **L** (agent: silence): Lawrence's pick in the Sound Lab (DECISIONS rows 603, 607). | — | — | — |
| `sfx.car-brake` | A car's brake lights come on as it brakes for safety. | *silence*: Constant traffic chatter; brake lights carry it. | — | — | — |
| `sfx.commit` | A car commits to a manoeuvre. `S:2855` | *silence*: Internal traffic state; the player sees the move. | — | — | — |
| `sfx.interrupt` | A car's manoeuvre is interrupted. `S:3008` | *silence*: Internal traffic state; constant chatter would mask the hits. | — | — | — |
| `sfx.resume` | A car resumes after an interruption. `S:3018` | *silence*: Internal traffic state; constant chatter would mask the hits. | — | — | — |
| `sfx.release` | A car is released from a hold. `S:2980, S:2999` | *silence*: Internal traffic state; constant chatter would mask the hits. | — | — | — |
| `sfx.ring` | A car changes ring on a roundabout. `S:2613, S:2622` | *silence*: Lane changes are visual; sound would clutter the roundabout. | — | — | — |
| `sfx.gridlock` | Traffic locks on a layer. `S:2442` | `uh-oh.wav` | sfx | `audio.sfx.gain.alert` | `audio.sfx.cooldown.once` |
| `sfx.gridlock-clear` | Locked traffic clears. `S:2443` | `confirm_2.wav` | sfx | `audio.sfx.gain.ambient` | `audio.sfx.cooldown.once` |
| `sfx.admit` | A car enters the screen. `S:2301, S:3607` | *silence*: Cars enter constantly; the music carries the city. | — | — | — |
| `sfx.exit` | A car leaves the screen. `S:3221` | *silence*: Cars leave constantly; the music carries the city. | — | — | — |
| `sfx.contact-ignored` | A contact that scores nothing. `S:3233` | *silence*: It scores nothing, so silence keeps the feedback honest. | — | — | — |
| `sfx.touch` | A zero-speed touch. `S:3236` | *silence*: Zero-speed touches don't count; silence keeps the feedback honest. | — | — | — |

### 3.10 Drones

| Cue | Trigger | Files | Bus | Volume ID | Cooldown ID |
|---|---|---|---|---|---|
| `sfx.drone-dispatch` | A Corporation drone sets off: to clear a cone, or to the river. `S:2897, W:2289` | `ufo.wav` | sfx | `audio.sfx.gain.story` | `audio.sfx.cooldown.once` |
| ↳ `sfx.drone-dispatch.rescue` | To the river | `siren.wav` **L** (agent: `siren.wav`) | sfx | `audio.sfx.gain.story` + `audio.sfx.offset.drone-dispatch.rescue` | `audio.sfx.cooldown.once` |
| `sfx.drone-pickup` | The drone lifts a cone. `S:2928` | `equip_1.wav` | sfx | `audio.sfx.gain.story` | `audio.sfx.cooldown.once` |
| `sfx.drone-drop` | The drone sets the cone down. `S:2939` | tone `tone_drone_drop.wav` | sfx | `audio.sfx.gain.story` | `audio.sfx.cooldown.once` |
| `sfx.drop-in` | A level starts: a drone carries the dummy in. `T:139` | `engine.wav` | sfx | `audio.sfx.gain.story` | `audio.sfx.cooldown.once` |
| `sfx.dropped-in` | The drone sets the dummy down; play starts. `T:152` | `land.wav` | sfx | `audio.sfx.gain.move` | `audio.sfx.cooldown.once` |

### 3.11 Story beats

| Cue | Trigger | Files | Bus | Volume ID | Cooldown ID |
|---|---|---|---|---|---|
| `sfx.story-enter` | The dummy is in the tile in test. `T:187` | `computer_1.wav` | sfx | `audio.sfx.gain.story` | `audio.sfx.cooldown.once` |
| `sfx.story-count` | A write-off counts toward the brief. `T:368` | `stat_increase.wav` | sfx | `audio.sfx.gain.reward` | `audio.sfx.cooldown.once` |
| `sfx.story-miss` | A write-off does not count. `T:368` | `stat_decrease.wav` | sfx | `audio.sfx.gain.alert` | `audio.sfx.cooldown.once` |
| `sfx.story-clear` | The tile's brief is met. `T:386` | `powerup_5.wav` | sfx | `audio.sfx.gain.reward` | `audio.sfx.cooldown.once` |
| `sfx.story-gift` | Dummy Corporation gifts credits on arrival. `T:183, T:192` | `collect_6.wav` | sfx | `audio.sfx.gain.reward` | `audio.sfx.cooldown.once` |
| `sfx.story-deliver` | A drone brings this tile's part. `T:185` | `engine.wav` | sfx | `audio.sfx.gain.story` | `audio.sfx.cooldown.once` |
| `sfx.story-ferry` | A drone carries the dummy to the next tile. `T:260` | `ufo.wav` | sfx | `audio.sfx.gain.story` | `audio.sfx.cooldown.once` |
| `sfx.story-ferried` | The ferry sets the dummy down on the next tile. `T:296` | `laser_5.wav` **L** (agent: silence) | sfx | `audio.sfx.gain.story` | `audio.sfx.cooldown.once` |
| `sfx.story-fence` | The dummy meets a tile's fence. `T:339` | `blocked.wav` | sfx | `audio.sfx.gain.alert` | `audio.sfx.cooldown.action` |
| `sfx.gift` | A part falls, lands and is fitted: the gift screen. `T:192` | `powerup_5.wav` | sfx | `audio.sfx.gain.big` | `audio.sfx.cooldown.once` |
| `sfx.delivered` | The delivery drone leaves. `T:126` | *silence*: Fitting the part already closed the delivery. | — | — | — |
| `sfx.unveil` | The finale: the monument and its plaque. `T:396` | `powerup_1.wav` | sfx | `audio.sfx.gain.big` | `audio.sfx.cooldown.once` |
| `sfx.unveil-lift` | The cloth comes off the monument. | tone `tone_unveil_lift.wav` **L** (agent: `disappear.wav`) | sfx | `audio.sfx.gain.big` + `audio.sfx.offset.unveil-lift` | `audio.sfx.cooldown.once` |
| `sfx.voyage` | A drone lifts the dummy toward the ship. `T:204` | `ufo.wav` | sfx | `audio.sfx.gain.story` | `audio.sfx.cooldown.once` |
| `sfx.voyage-end` | The dummy is set down at the ship: CERTIFIED. `T:231` | `note_high_C.wav` | sfx | `audio.sfx.gain.reward` | `audio.sfx.cooldown.once` |

### 3.12 Arcade

| Cue | Trigger | Files | Bus | Volume ID | Cooldown ID |
|---|---|---|---|---|---|
| `sfx.shop-open` | The workshop opens after a report. `S:3628` | `select_5.wav` | ui | `audio.sfx.gain.ui` | `audio.sfx.cooldown.once` |
| `sfx.purchase` | A part is bought and fitted. `S:3650` | `equip_2.wav` | ui | `audio.sfx.gain.reward` | `audio.sfx.cooldown.action` |
| `sfx.purchase-denied` | A purchase is refused. `S:3648, T:403` | `cancel_4.wav` | ui | `audio.sfx.gain.alert` | `audio.sfx.cooldown.action` |
| `sfx.shop-skip` | Story: nothing to buy; the workshop is skipped. `T:405` | *silence*: Nothing to buy, so there's nothing to hear. | — | — | — |
| `sfx.credit` | Credits are paid for a write-off. `S:3316, T:454` | `collect_5.wav` | sfx | `audio.sfx.gain.reward` | `audio.sfx.cooldown.once` |
| `sfx.road-cleared` | Arcade: the road's quota is met. `S:3315` | `powerup_1.wav` | sfx | `audio.sfx.gain.reward` | `audio.sfx.cooldown.once` |
| `sfx.grade` | Arcade: the grade rises; tougher chassis, denser traffic. `T:452` | `powerup_3.wav` | sfx | `audio.sfx.gain.reward` | `audio.sfx.cooldown.once` |
| `sfx.ending` | A run ends: Licensed, Certified, Failed test or Non-compliant. `S:3298` | `computer_1.wav` | sfx | `audio.sfx.gain.story` | `audio.sfx.cooldown.once` |
| ↳ `sfx.ending.win` | Licensed or Certified | `powerup_5.wav` | sfx | `audio.sfx.gain.big` | `audio.sfx.cooldown.once` |
| ↳ `sfx.ending.fail` | Failed test or Non-compliant | `lose_1.wav` | sfx | `audio.sfx.gain.big` | `audio.sfx.cooldown.once` |
| `sfx.milestone` | An internal first (first hit, first combo). `S:1641` | *silence*: It's an internal log the player never sees. | — | — | — |

### 3.13 Barks

| Cue | Trigger | Files | Bus | Volume ID | Cooldown ID |
|---|---|---|---|---|---|
| `sfx.bark` | A car's line appears in the message strip. | *silence* **L** (agent: `bubble.wav`, `select_1.wav`): Lawrence's pick in the Sound Lab (DECISIONS rows 603, 607). | — | — | — |
| ↳ `sfx.bark.shout` | A shouted line | *silence* **L** (agent: `select_5.wav`, `select_4.wav`): Lawrence's pick in the Sound Lab (DECISIONS rows 603, 607). | — | — | — |
| `sfx.learned` | A model that learned returns and says so (a bark). `G:881` | *silence*: The bark sound already plays this line. | — | — | — |
| `sfx.upgrade-seen` | A car remarks on a new module (a bark). `G:903` | *silence*: The bark sound already plays this line. | — | — | — |
| `sfx.part-seen` | A car remarks on a broken part (a bark). `G:907` | *silence*: The bark sound already plays this line. | — | — | — |

### 3.14 Intro screen

| Cue | Trigger | Files | Bus | Volume ID | Cooldown ID |
|---|---|---|---|---|---|
| `sfx.intro-hit` | The intro loop: the car meets the dummy. | *silence*: Track 1 owns the intro; a looping hit would grate. | — | — | — |

**Totals:** 109 entries: 52 cues, 26 silences, 31 generated tones, 0 on its base. 43 of 100 pack files used; 70 generated tones in `prototypes/p9/audio/tones/`. Lawrence's picks: 41 entries.

## 4 Gameplay points

Screenshots and cues of every step of the tour: [`prototypes/p9/SOUND_TOUR.md`](../../prototypes/p9/SOUND_TOUR.md). The same, playable, in the Sound Lab's Tour room.

## 5 The sound designer agent

1. **Inventory** (`audio/inventory.py`, no model): duration, channels, rate, LUFS, true peak, RMS, credit. `content/audio/inventory.json`.
2. **Event catalogue** (`audio/events.py`, no model): 94 events from the code's `emit(` sites, `present(` cases and screens, annotated. Fails if code and annotations disagree. `content/audio/events.json`.
3. **Designer → lint → reviewer → refiner** (`audio/loop.py`; agents in `audio/agents/`; rules in `audio/SOUND_GUIDE.md`). One fresh `claude -p` per step. A fresh reviewer confirms each 10/10.
4. **Integrator** (`audio/integrate.py`): the accepted map → `content/audio/cues.json` and the registry. Refuses blocking lint.

| Run | Start | Versions (score) | Result | Calls · cost |
|---|---|---|---|---|
| `20261030-012347-cues` | designer | 7 → 10 | 10/10, confirmed | 5 · $2.17 |
| `20261030-013331-cues` | previous map | 4 → 9 → 9 → 9 | stopped at the cap | 7 · $2.92 |
| `20261030-014423-cues` | previous map | 5 → 10 | 10/10, confirmed | 4 · $1.54 |

## 6 Build and tests

```
python3 audio/inventory.py && python3 audio/events.py      # evidence
python3 audio/loop.py                                       # the agent (or --from content/audio/design.json)
python3 audio/integrate.py && python3 prototypes/p9/build.py
cd prototypes/p9 && node tour_p9.js && node test_p9.js --p84 && cd ../.. && python3 prototypes/p9/make_lab.py && python3 audio/make_gdd.py
```

- PASS · every file in the cue map loads (161)
- PASS · the tour ran without page errors
- PASS · nothing plays before the first press
- PASS · music on "the first press": intro, Track 1
- PASS · music on "START": menu, Track 2
- PASS · music on "the Credits card": credits, Track 1
- PASS · music on "Arcade: district select": menu, Track 2
- PASS · music on "Arcade: the level card": card, Track 3
- PASS · music on "Arcade: the drone drop": level, Track 3
- PASS · music on "Arcade ends: Licensed": licensed, Track 8
- PASS · music on "Arcade ends: Failed test": failed, Track 9
- PASS · music on "Arcade ends: Non-compliant": noncompliant, Track 10
- PASS · music on "Story: save slots": menu, Track 2
- PASS · music on "Story: the map": menu, Track 2
- PASS · music on "Story: the level card (A1)": card, Track 3
- PASS · music on "Story: the drone drop": level, Track 3
- PASS · music on "Story: counted, cleared": cleared, Track 11
- PASS · music on "Story: the ferry to the next tile": cleared, Track 11
- PASS · music on "Story: the next card": card, Track 4
- PASS · music on "Story: play on tile 2": level, Track 4
- PASS · music on "the finale": finale, Track 1
- PASS · music on "CERTIFIED": certified, Track 7
- PASS · the music ducks: write-off 0.5, report and workshop 0.7, play 1; the tile-cleared music never (row 631)
- PASS · the tour heard 37 cues through the game's hooks
- PASS · the intro waits behind the gate
- PASS · an unmapped key unlocks audio and starts Track 1
- PASS · every catalogued event and variant does what the map says (109: 52 cue, 26 silence, 31 synth)
- PASS · the catalogue and the cue map hold the same 109 entries
- PASS · START plays ui-start and fades to Track 2
- PASS · the music holds its level across the loop's seam: no fade there (row 633)
- PASS · a cursor move plays ui-move
- PASS · Arcade run 1 plays the rotation's first track
- PASS · pause ducks the music to audio.music.pauseDuck (0.35)
- PASS · Options shows VOLUME, MUSIC, SFX and MUTE
- PASS · VOLUME − twice is saved (dummies.p9.audio)
- PASS · a live chassis never reads BODY 0 (ui.hud.bodyCeil): 0.3 health reads 1
- PASS · the cone brief counts the chain the cone starts; a miss holds at 1, small hits included; at 1 a hit to the brief writes off (row 620)
- PASS · a car honks 2 times at most (audio.sfx.honkMaxPerCar; row 623)
- PASS · knock and touch-spent off one spent car: 2 in any 2 s, each (audio.sfx.spentRepeatMax, spentRepeatSeconds; row 624); a live car is not capped
- PASS · car-notice and barks are silent (row 625)
- PASS · the pause page's sound control mutes, and its slider sets the volume and unmutes
- PASS · the sound control sits in one place on the intro, the mode select and the pause page; on the intro it lifts the gate without START
- PASS · M toggles mute; − steps the volume down one and unmutes
- PASS · the dropdown opens MUSIC and SFX sliders, each sets its own level (saved); a tap away only closes it
- PASS · the game takes the Sound Lab's picks from #audio= and keeps them
- PASS · malformed picks are dropped and the game starts; an emptied pool is silent
- PASS · no page errors in the hook tests
- PASS · no audio engine errors
- PASS · Prototype 8.4 rebuilt from the shared code draws what the frozen build draws, barks and live counts aside (316 strings drawn over 32 steps · 1 name Farsight · 0 over two sentences or 20 words · 0 page errors / 314 strings drawn over 32 steps · 1 name Farsight · 0 over two sentences or 20 words · 0 page errors)
- PASS · the frozen dummies_p8_4.html is unchanged (md5 9f5549201d88891f9f0b22c461602909)

## 7 Measured

- **SFX:** 100 mono WAV, 44.1 kHz. 0.10–3.29 s. Level -29.0 to -17.6 dB (LUFS, or RMS under 0.4 s).
- **Music:** 11 stereo OGG: six from the pack (48 kHz, 66–123 s) and four generated (44.1 kHz, 31–63 s). -16.7 to -9.1 LUFS.
- **Build:** `dummies_p9.html` 1,419,372 bytes. Audio beside it: 38.8 MB.

## 8 Registry (edit100)

| ID | Default | Unit | Description |
|---|---:|---|---|
| `audio.enabled` | 0 | flag | 1: the WAV and OGG cue map plays (prototypes/p9/audio.js); 0: Prototype 8.4's synth only. Prototype 9 sets 1 |
| `audio.music.duckSeconds` | 0.25 | s | Seconds a duck takes to go fully down or back up |
| `audio.music.fadeInSeconds` | 0.3 | s | Seconds a track fades in from each start: a new screen's track, and the loop's restart |
| `audio.music.fadeOutSeconds` | 0.3 | s | Seconds a track fades out when it stops, gives way to the next, or reaches the file's end before the loop |
| `audio.music.levelRotation` | 3456 | digits | Level tracks in order, one digit each. Story: the tile n a level card announces plays digit ((n − 1) mod count) + 1, until the next card. Arcade: the session's level n does |
| `audio.music.pauseDuck` | 0.35 | ratio | The music's level while paused, as a share of its level in play |
| `audio.music.screenDuck` | 0.7 | ratio | The level track's level on the gift screen, the level report and the workshop, as a share of its level in play |
| `audio.music.targetLufs` | -16 | LUFS | Integrated loudness each track is trimmed toward |
| `audio.music.track.card` | -1 | track | Track on a level card. −1: the level's own track, from the tile the card announces; 0: the track playing continues; 1–6: that track |
| `audio.music.track.certified` | 7 | track | Track from the set-down at the ship: CERTIFIED |
| `audio.music.track.cleared` | 11 | track | Track from a Story tile's clear to the next card: the write-off, the report, the ferry, the gift screen. Not ducked by them; pause ducks it |
| `audio.music.track.credits` | 1 | track | Track on the Credits card (0: the current track continues) |
| `audio.music.track.failed` | 9 | track | Track when a run ends Failed test |
| `audio.music.track.finale` | 1 | track | Track for the unveiling and the voyage |
| `audio.music.track.intro` | 1 | track | Track on the intro screen |
| `audio.music.track.licensed` | 8 | track | Track when a run ends Licensed |
| `audio.music.track.menu` | 2 | track | Track on every menu until the level starts |
| `audio.music.track.noncompliant` | 10 | track | Track when a run ends Non-compliant (a refusal) |
| `audio.music.volume` | 0.5 | ratio | The music bus at MUSIC 10 |
| `audio.music.writeoffDuck` | 0.5 | ratio | The level track's level through the write-off hold, as a share of its level in play |
| `audio.settings.master` | 10 | steps | The sound control's slider, out of 10, over every bus (intro, mode select, pause; Options › Volume); saved as dummies.p9.audio |
| `audio.settings.music` | 8 | steps | Options › Music, out of 10, until the player sets it (saved as dummies.p9.audio) |
| `audio.settings.sound` | 8 | steps | Options › Sound, out of 10, for the SFX and UI buses |
| `audio.sfx.cooldown.action` | 0.06 | s | Seconds between two plays of one cue in class 'action': one player action |
| `audio.sfx.cooldown.ambient` | 0.6 | s | Seconds between two plays of one cue in class 'ambient': traffic chatter |
| `audio.sfx.cooldown.bark` | 0.8 | s | Seconds between two plays of one cue in class 'bark': bark bubbles (proto.barks.cooldown) |
| `audio.sfx.cooldown.burst` | 0.1 | s | Seconds between two plays of one cue in class 'burst': a few a second at most |
| `audio.sfx.cooldown.frame` | 0.25 | s | Seconds between two plays of one cue in class 'frame': per-frame contacts (the old 0.25 s dedupe) |
| `audio.sfx.cooldown.honk` | 1.4 | s | Seconds between two plays of one cue in class 'honk': a horn at the dummy (the 1.4 s repeat) |
| `audio.sfx.cooldown.once` | 0 | s | Seconds between two plays of one cue in class 'once': beats that fire once |
| `audio.sfx.cooldown.ui` | 0.03 | s | Seconds between two plays of one cue in class 'ui': menu presses |
| `audio.sfx.dashDamagedAt` | 0.45 | ratio | Wear (1 − health ÷ maximum) from which the dash plays sfx.lunge.damaged; the dummy smokes from here |
| `audio.sfx.dashWreckedAt` | 0.7 | ratio | Wear from which the dash plays sfx.lunge.wrecked; sparks and a cracked head from here |
| `audio.sfx.gain.alert` | -4 | dB | Gain class 'alert' on its bus: warnings: denied, low health, fences |
| `audio.sfx.gain.ambient` | -12 | dB | Gain class 'ambient' on its bus: traffic chatter and background |
| `audio.sfx.gain.big` | 0 | dB | Gain class 'big' on its bus: the heaviest beats: write-off, big hit, the gift |
| `audio.sfx.gain.hit` | -2 | dB | Gain class 'hit' on its bus: contact: hits, knocks, cone hits |
| `audio.sfx.gain.move` | -6 | dB | Gain class 'move' on its bus: the dummy's own moves |
| `audio.sfx.gain.reward` | -3 | dB | Gain class 'reward' on its bus: points and progress |
| `audio.sfx.gain.story` | -5 | dB | Gain class 'story' on its bus: Corporation notices, drones, the ferry |
| `audio.sfx.gain.ui` | -6 | dB | Gain class 'ui' on its bus: menu moves and confirms |
| `audio.sfx.honkMaxPerCar` | 2 | count | A car's horn sounds this many times at most, however often it is stuck (the horn mark still shows). 0: no cap |
| `audio.sfx.lowHealthAt` | 0.3 | ratio | The low-health cue sounds when the chassis falls below this share of its maximum, once until it recovers |
| `audio.sfx.maxVoices` | 16 | count | Effects playing at once; a new one past the cap is dropped |
| `audio.sfx.offset.deck-drop` | -2.5 | dB | Fine gain on sfx.deck-drop, after its gain class |
| `audio.sfx.offset.denied` | 3.5 | dB | Fine gain on sfx.denied, after its gain class |
| `audio.sfx.offset.drone-dispatch.rescue` | -3.0 | dB | Fine gain on sfx.drone-dispatch.rescue, after its gain class |
| `audio.sfx.offset.jump.dash` | -4.0 | dB | Fine gain on sfx.jump.dash, after its gain class |
| `audio.sfx.offset.learn-standoff` | -3.0 | dB | Fine gain on sfx.learn-standoff, after its gain class |
| `audio.sfx.offset.splash` | -3.5 | dB | Fine gain on sfx.splash, after its gain class |
| `audio.sfx.offset.unveil-lift` | -4.0 | dB | Fine gain on sfx.unveil-lift, after its gain class |
| `audio.sfx.pitchJitter` | 0.04 | ratio | Each effect plays at a rate up to this far from 1 (not menus) |
| `audio.sfx.spentRepeatMax` | 2 | count | Knock and touch-spent off one spent car: each sounds this many times at most in any audio.sfx.spentRepeatSeconds. 0: no cap |
| `audio.sfx.spentRepeatSeconds` | 2 | s | The window audio.sfx.spentRepeatMax counts in, sim seconds |
| `audio.sfx.targetLufs` | -18 | LUFS | Loudness each effect is trimmed toward (integrated LUFS, or RMS under 0.4 s) |
| `audio.sfx.volume` | 0.85 | ratio | The effects bus at SOUND 10 |
| `audio.synth.gain` | 1 | ratio | Prototype 8.4's live synth, through the SFX bus, for an event with no entry and no generated tone |
| `audio.trim.maxBoostDb` | 12 | dB | The largest boost or cut a trim applies |
| `audio.trim.peakCeilingDb` | -1 | dBFS | An effect's boost stops where its peak would pass this |
| `audio.ui.volume` | 0.7 | ratio | The menu bus at SOUND 10 |

## 9 Play fix: the cone brief and the floor (row 620)

> (30 October 13:07) I died on a cone-baited car but my body did not die.

- **Cone-baited:** a car that reacted to a cone within `story.coneBaitSeconds` (6 s) counts. Its swerve or stop, its return to lane and its stop for the dummy after all count.
- **Why:** on Monument A2, cars that swerved round a cone then stopped for the dummy (30 times) or returned to lane (9) within 6 s. A hit then counted as "body" or "return", never the cone.
- **The floor** (`story.floorHold` 1): a miss of the brief never takes the chassis below `story.missFloor` (1), small hits included. At the floor, a hit to the brief writes it off.
- **The readout** (`ui.hud.bodyCeil` 1): a live chassis reads at least 1. BODY 0 means written off.
- **The toast:** "HELD AT 1 · the brief wants cone-baited car" names the brief.
- **Frozen builds:** registry defaults 0. Prototypes 7.10–8.4 keep their rule.

## 10 QA fixes (rows 622–625)

> (30 October 19:10) Fix honk - 2 max per car once they are stuck. Fix knock and touch spent - change the icon on a spent car is a TICK. Only 2 max knock spent per car within a 2 second window. Fix car-notice and bark - no sounds.

- **The run** (row 622): an adversarial QA agent played Arcade, three personas for 30 min each (`qa/agent.js`, `qa/monitor.js`). Report: `qa/REPORT.md`.
- **Honk** (QA-01, row 623): a car's horn sounds `audio.sfx.honkMaxPerCar` (2) times at most. The cap counts the sim's honk and the draw's 1.4 s repeat. The "!" mark still flashes.
- **Spent repeats** (QA-02, row 624): knock and touch-spent off one spent car sound `audio.sfx.spentRepeatMax` (2) times each in any `audio.sfx.spentRepeatSeconds` (2 s). A live car is not capped.
- **Spent tick** (row 624): `ui.spentTick` (1). A spent car carries a tick on its roof, upright, white edged in ink. The cue key shows it beside "Already hit you".
- **Silent** (QA-03, QA-04, row 625): `car-notice`, `bark`, `bark.shout`. The headlamp flash and the bubbles still show.
- **Where:** `game.js` `audGate`, before the cue map. A capped event logs `gated` and hushes the synth.
- **Music fades** (row 633): in once, from the first note; out when the track stops or gives way. No fade at the loop.
- **Play fixes** (rows 632, 634–637): a moved cone frees the lane (`proto.driver.dodgeFollowsCone` 1); the notice flash on the car's lamps (`ui.lampsOnCar`); a quiet pause page (`ui.pause.quiet`); a drone fetches a lane cone after `proto.droneConeSeconds` (5 s); cones under decks read (`ui.conesXray`).
- **Contact grace** (QA-02, D88 closed, row 630): `proto.contactGraceSeconds` (0.3 s). A touch on the same car within it continues the contact: no new bounce, hit, knock or touch-spent. Leaning on a stopped car: 113 knocks in 40 s before, 5 after.
- **The dash by wear** (row 629): `sfx.lunge` whoosh B1; `sfx.lunge.damaged` B2 from wear `audio.sfx.dashDamagedAt` (0.45); `sfx.lunge.wrecked` B3 from `audio.sfx.dashWreckedAt` (0.7). Wear: 1 − health ÷ maximum. The takes: generated, `audio/tones.py` (rows 626–628).

## 11 Open

- **Generated music:** five tracks composed in code (`audio/music_gen.py`) to fill the pack's gaps. Heard here only as numbers: loudness, spectrum, structure. Lawrence's ear decides; the Sound Lab swaps any of them.
- **Tone fidelity:** a generated tone is one rendering. Prototype 8.4 scaled some of its sounds with the hit's force; the tones take the middle of each range.
- **Silenced:** 26 entries (§3). Switch any on in the Sound Lab.
- **Licence:** the pack's credit lines only. The licence texts were not supplied.
- **Devices:** Safari and iOS play Ogg Vorbis from 18.4. Older ones get each track's MP3 (`canPlayType`). Effects are WAV everywhere. Untested on a device.
- **Seam on odd servers:** a host that sends no file length gives the music no duration; the engine then takes the inventory's length for the fade out.
