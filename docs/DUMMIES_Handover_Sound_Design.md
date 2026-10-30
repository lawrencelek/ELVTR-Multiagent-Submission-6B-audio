# DUMMIES — Handover: sound design and a sound designer agent

**30 October 2026 · Lawrence Lek** · From the Prototype 8.4 / Assignment #6 session ([session](https://claude.ai/code/session_0178chfCAHgSoGZFFKe3UpAm)). Read this first in the new chat.

## 0 Start the new chat

- **Where:** inside the Project "ELVTR Course - GDD". Its docs and instructions come with it.
- **First message:** "Read `claude/DUMMIES_Handover_Sound_Design.md` first. Then build the sound designer agent and add the audio, in `ELVTR-Multiagent-Submission-6B-audio`."
- **For code:** use a session with GitHub access.
- **Target repo:** `lawrencelek/ELVTR-Multiagent-Submission-6B-audio`. All sound work and commits go here.
  - Create it on GitHub first (public, empty) if it does not exist yet. Attach it (push).
  - It starts empty. The new chat seeds it from the source repo (§7.1).
- **Source repo, read only:** `lawrencelek/ELVTR-dummies-agent-crew`, branch `assignment4/content-pipeline`. Attach it (read). Copy from it; commit nothing there.
- **The audio pack is on your computer** (Windows, `legion7`). No session has seen it yet.
- **Agreed folder:** `Downloads\DUMMIES_audio\` on that computer:
  - `music\`: the six .ogg tracks, renamed `track1 - <original name>.ogg` to `track6 - <original name>.ogg`.
  - `sfx\`: the pack's .wav files, names unchanged; subfolders are fine.
  - `licence\`: the pack's licence text, or a note of its download page.
- **Bring it one of three ways:**
  1. **Link the chat to your computer.** Open the chat in the Claude desktop app and add the pack's folder. The chat reads the file names and copies what the build needs. *Recommended.*
  2. **Commit it yourself** to the target repo: `assets/audio/music/` (the .ogg tracks) and `assets/audio/sfx/` (the .wav files). GitHub refuses files over 100 MB and warns over 50 MB.
  3. **Attach a zip** to the first message, if it fits the upload limit.
- **Also bring the licence.** Attach the pack's licence text or name its download page. Royalty-free packs often still require a credit.
- **Name the music files.** Say which file is Track 1, 2, 3, 4, 5 and 6, unless the file names already say so.
- **If this is a course assignment**, paste its brief into the first message.

## 1 What carries over

| Item | New chat in the project | Where |
|---|---|---|
| Project docs: GDD edits to 99, prototype docs, decisions, registry, style guides, write-ups | Yes, searchable | `claude/…` |
| Project instructions (house style) | Yes | Project settings |
| Code, builds, tests, runs, screenshots | Yes, by cloning | Source repo (all pushed) |
| The target repo | Empty until seeded (§7.1) | `ELVTR-Multiagent-Submission-6B-audio` |
| The audio pack | No. Bring it (§0) | Your computer |
| This conversation | No; past-chat search only, if enabled | — |

- **Project knowledge:** about 1.56 of 2.0 MB used. Do not upload audio to the project; it is for text.

## 2 The game now

- **DUMMIES:** a top-down game. You are a crash-test dummy in training in SHENZHEN SMART CITY.
- **Lore (Edit 95):** the company in the game is Dummy Corporation. It makes custom dummies for high net-worth individuals. Certified dummies are sacrificed in their service.
  - Farsight publishes the game. It is named only on the Credits card.
- **Voice:** deadpan and inspirational. Sinofuturist city; corporate comedy. Style Guide V2.8 (`style/STYLE_GUIDE_V2.md`).
- **Build:** Prototype 8.4, `prototypes/p8/dummies_p8_4.html`. One self-contained HTML file, 1.3 MB. Fonts load from Google Fonts.
- **Flow (Edits 97–98):**
  - Intro screen (`ui.introScreen`): DUMMIES; the dummy steps in front of a car; one line; START.
  - Mode select: STORY, ARCADE, HIGH SCORES, CREDITS.
  - **Story:** save slots → Story splash (`ui.storySplash`; parts fly apart and back) → map → level card (`ui.levelCard`) → drone drop (`world.droneDropIn`) → play. 27 tiles in three acts. Finale: the monument unveiled; a drone to the ship; CERTIFIED; Credits.
  - **Arcade:** district select → level card → drone drop → play. Grades rise with write-offs (`arcade.grades`). Ends Licensed, Failed test or Non-compliant. High scores per district.
- **Current state in one page:** `claude/DUMMIES_GDD_Current_State.md`.

## 3 The request (verbatim)

> Next I want to integrate sound design.
>
> Next - a sound designer agent. I have downloaded royalty-free music tracks and sound effects pack.
>
> Music -
> Track 1 - Splash Screen
> Track 2 - From menu until just before the level starts (whether story or arcade mode)
> Track 3, 4, 5, 6, Alternate between different levels and maps.
>
> SFX - read WAV file names and decide on appropriate places to put the sound triggers.
>
> Make documentation that covers what SFX (wav) and MUSIC (ogg) cues play at which points.

### 3.1 Readings to confirm (ask Lawrence once, at the start)

| # | Question | Proposed reading |
|---|---|---|
| Q1 | "Splash Screen": the intro screen (DUMMIES, START) or the Story splash (NEW GAME, CONTINUE)? | The intro screen, behind a "press any key" gate: the first press only unlocks audio (§6.3). The Story splash comes after the mode select, inside Track 2's span |
| Q2 | Where does Track 2 end: before the level card, or before the drone drop? | Track 2 plays through the level card. The level's track starts with the drone drop |
| Q3 | "Alternate between different levels and maps": how? | Story: tile *n* in story order plays Track 3 + ((*n* − 1) mod 4), so neighbouring tiles differ. Arcade: one track per run, rotating each new run |
| Q4 | Screens the request does not place: pause, gift screen, level report, Failed test, the finale, Credits, high-score entry | Pause ducks the music. The gift screen and level report keep the level track. The finale and Credits play Track 1 again |
| Q5 | After a write-off, inside the same level: restart the track or carry on? | Carry on |
| Q6 | SFX for car barks (each bubble), or physical events only? | Physical events, UI and story beats. A soft blip per bark bubble, if the pack has one |

- Every proposal above is the assistant's. Record each answer as a DECISIONS row, user-decided or proposed.

## 4 Constraints

- **Autoplay.** Browsers block audio until the first user gesture.
  - Track 1 cannot start on page load. It starts on the first key, click or tap.
  - On the intro screen, that first press is usually START, which leaves the screen (§6.3).
  - `Snd.init()` already unlocks the AudioContext on most gestures; two input paths miss it (§6.3).
- **Single-file build.** Inlining audio as base64 adds a third to its size. Options:
  - (a) Audio files beside the HTML (`audio/`), loaded by URL. Works on GitHub Pages and a local server. On `file://`, `fetch` fails, but `<audio src>` still plays.
  - (b) Inline the SFX (small), stream the music by URL. *Proposed;* measure first.
  - (c) Inline everything: one file, very large.
- **Formats.**
  - Music stays OGG, as supplied. Check Safari and iOS support for Ogg on the target devices; transcode a fallback with `ffmpeg` if needed.
  - SFX arrive as WAV. Keep the originals; a compressed copy may ship.
- **Loudness.** Measure every file (`ffmpeg -af ebur128`, or `loudnorm` in measure mode). Record LUFS and peak in the asset manifest. Normalise to one target per bus.
- **Frequency.** Some events fire often: `knock` and `touch-spent` on every contact frame, near-misses, braking, headlight flashes, combo links. Give each cue a cooldown and cap the voices. Per-frame states sound on the edge only (§6.6).
- **Registry first.** Every audio statistic gets an ID before it is used (house rule). The target repo's copy of the registry moves from `edit99-2026-10-29` (525 entries) to `edit100`. The source repo's copy stays at edit99. Proposed family:
  - `audio.enabled` (flag, default 0; the new build sets 1).
  - `audio.music.volume`, `audio.sfx.volume`, `audio.ui.volume`.
  - `audio.music.crossfadeSeconds`, `audio.music.pauseDuck`.
  - `audio.sfx.maxVoices`, `audio.sfx.cooldown.<cue>`.
  - `audio.music.track.<screen>`, `audio.music.levelRotation`.
  - Values are for the new chat to propose and Lawrence to confirm.
- **Options.** Options already has a Sound on/off item that is not saved (§6.1). Replace it with MUSIC and SOUND volume, and mute, and save them in the browser (§6.4).
- **Frozen builds.** Prototype 8.4 stays byte-identical, in both repos. Audio ships in Prototype 9 (`prototypes/p9/` in the target repo), behind `audio.enabled` in the shared code.
- **Licence.** Record each file's source, licence and required credit in the asset manifest.
  - If the pack needs a credit, the Credits card gains a line. Style Guide V2's C1 limits the card to the game, its maker and its publisher, so C1 changes first (user-decided).
- **Text.** New labels (MUSIC, SOUND) are interface chrome: out of the style guide's scope (row 540). They name no company.

## 5 The sound designer agent (suggested; the new chat decides)

Same pattern as Assignments 4–6: deterministic evidence, a designer, a reviewer that scores, a fix loop, saved runs.

1. **Inventory** (no model). `audio/inventory.py` lists each file: name, folder, duration, channels, sample rate, LUFS, peak. Output `content/audio/inventory.json`.
2. **Event catalogue** (no model). Every trigger point in §6, with an ID (`sfx.<event>`, `music.<state>`), its frequency class (once, per action, per frame) and its GDD source. Output `content/audio/events.json`.
   - Generate it from the code where possible: the `emit(` sites, the `processEvents` switch and the screen names. Then it cannot drift from the build.
3. **Designer agent.** Reads the inventory (file names, durations), the catalogue and the GDD's tone. Proposes the cue map:
   - SFX: event → file or variation pool, bus, volume ID, cooldown ID; or a stated silence.
   - Music: the state machine, screen → track, loops and crossfades.
4. **Reviewer agent.** Returns SCORE and REASON, as in Assignment 6. It checks:
   - **Coverage:** every high-priority event has a cue or a stated silence.
   - **Fit:** the name and duration suit the event. A six-second explosion on a footstep fails.
   - **Clashes:** no file serves two events that can fire together.
   - **Spam:** per-frame events have cooldowns.
   - **Loudness and licence:** both recorded.
5. **Refiner** revises from the REASON. Loop until 10/10 or the round cap. No human step inside.
6. **Integrator.** Writes, in the target repo:
   - `content/audio/cues.json`, the machine-readable cue map.
   - The audio code, behind `audio.enabled`.
   - Prototype 9: `prototypes/p9/build.py` → `prototypes/p9/dummies_p9.html`, with the audio files it loads.
7. **Tests, headless.**
   - Stub the AudioContext and log each cue.
   - Walk a scripted tour (like `prototypes/p8/text_audit.js`).
   - Assert: each screen plays its track; each catalogued event fires its cue; nothing plays before the first gesture; every file in `cues.json` exists.
8. **Documentation (the request's deliverable).** GDD Edit 100, "Sound" (`coder/gdd/` in the target repo, and the project), with two tables:
   - **MUSIC:** track (.ogg) → screens and states, loop, transitions, registry IDs.
   - **SFX:** cue → WAV, trigger point (screen or event), bus, volume ID, cooldown ID.

## 6 Where sound can trigger (code survey, Prototype 8.4)

Survey of the shared code at `a0e3515`. Line numbers move with edits; search by the names given.
- **G** = `prototypes/p6/game.js` · **S** = `p6/sim.js` · **W** = `p6/world6.js` · **T** = `p7/story.js` · **H** = `p8/shell.html` · **B** = `p8/build.py`.

### 6.1 Audio that already exists

- **A procedural synth, `Snd`** (G:558–578). No files, no music.
  - `init()` creates and resumes the AudioContext. `tone()` is an oscillator; `noise()` is band-passed noise.
  - Every voice connects straight to the destination. There is no master gain and no bus.
- **Who calls it:**
  - The event switch in `processEvents` (G:869–955).
  - Data-driven `hitJuice()` (G:731–735), which reads `layer.sound` from `content.js`: 11 hit layers and 5 drop layers.
  - `giftChime` G:965, `giftFanfare` G:966, `horn` G:976, menu confirms G:1071–1072, the unveil chime G:3166.
- **On/off:** `app.sound` (G:50, default on). It is toggled from Options "Sound" (G:3057, 3063) and a hidden button (H:76, G:3572). The setting is not saved.
- **Decision for the new chat:** WAV cues replace the synth tones where a file fits. Either keep the synth as a fallback for events without a file, or silence those events. Add buses (music, SFX, UI) as gain nodes.

### 6.2 Screens and music

`app.screen` (G:49) is one of intro, title, arcade, saves, splash, storymap, scores, loading, game. Overlays are flags: `app.credits`, `app.paused`, `app.pausePage`, `app.nameEntry`. In play, `app.sim.phase` says what shows.

| Screen | Detect | Enter | Proposed music |
|---|---|---|---|
| Intro (DUMMIES, START) | `app.screen === 'intro'` | G:103 | Track 1 (Q1) |
| Mode select | `'title'` | G:1003 | Track 2 |
| Save slots, name entry | `'saves'`; `app.nameEntry` | G:195 | Track 2 |
| Story splash | `'splash'` | G:191 | Track 2 (or Track 1: Q1) |
| Story map | `'storymap'` | G:190 | Track 2 |
| Arcade district select | `'arcade'` | G:1010 | Track 2 |
| High scores, Credits | `'scores'`; `app.credits` | G:3371; G:1010 | Track 2 |
| Loading | `'loading'` | G:159 | Track 2 |
| Level card | phase `'brief'` | T:177, 245, 425 | Track 2 (Q2) |
| Drone drop-in | `rescue.dropIn`; event `drop-in` | T:133, 139 | Level track starts (Q2, Q3) |
| Play, write-off hold, screen flip, ferry | phase; `'writeoff'`, `'scroll'`; `rescue.ferry` | S:3294, 3396; T:248 | Level track |
| Pause, options | `app.paused`, `app.pausePage` | G:995; window blur G:310 | Level track, ducked |
| Gift screen | phase `'gift'` | T:121 | Level track (Q4) |
| Report | phase `'report'` | S:3330 | Level track (Q4) |
| Workshop (Arcade) | phase `'shop'` | S:3621 | Level track or Track 2 |
| Ending: Licensed, Failed test, Non-compliant | phase `'ending'`, `run.ending.kind` | S:3288–3302, 3654; T:442 | Q4 |
| Finale: unveil, voyage, CERTIFIED | phase `'unveil'`, `'voyage'`; Certified | T:390, 198–232 | Track 1 again (Q4) |

### 6.3 The first gesture (autoplay)

- `Snd.init()` already runs on keydown (G:292), canvas pointerdown (G:311), touch (G:422) and gamepad A (G:339).
  - The gamepad call runs inside the animation frame, not a DOM event. Browsers may not count it as a gesture.
- **Gaps:** the name-entry keydown (G:254) stops the event, so typing a name never unlocks audio. The touch-on listener (G:555) does not call `init` either.
- **The catch for Track 1:** on the intro screen, OK or pause is START (G:1003), and the START button is a tap target. A player's first press is usually START, which leaves the intro at once. Track 1 there needs one of these:
  - a "press any key" gate before START, so the first press only unlocks audio;
  - Track 1 carried into the mode select;
  - Track 1 on the Story splash instead (Q1).

### 6.4 Options and storage

- Pause items: G:981 (Arcade), G:982 (Story). Options list: `optionItems` (G:3056): Sound, Palette, Full screen, Tuning panel, Gamepad setup, Back. `optionDo` applies them (G:3062).
- Browser storage keys:
  - Saves: `dummies.p7.save<N>`, `dummies.p7.story`, `dummies.p7.saveMoved` (G:64).
  - Touch layout: `dummies.p7.touch` (G:393).
  - High scores: `dummies.p8.highscores.v1`, `dummies.p8.highscoreName` (G:3345).
  - Gamepad: `dummies.pad.p610.<id>`.
  - Sound has no key. A new key, such as `dummies.p9.audio`, holds the volumes and mute.

### 6.5 Gameplay events (SFX candidates)

- **Mechanism:** `emit()` (S:1640) pushes `{t, type, …}` to `sim.events`. StorySim wraps it (T:238).
- **The hook point:** `processEvents()` (G:834), once per frame (G:3607). Events from another screen carry `away` and are skipped (G:842).
- **Order per event:** `hitJuice` (G:849), then `barkLine` (G:868), then the switch.
- **Derived events** go through `present()` (G:644): near-miss (G:669) and miss (G:679), checked every frame; learned, upgrade-seen, part-seen.

| Group | Events (emitted at) | Synth sound now |
|---|---|---|
| Dummy moves | `lunge` (dash) S:1684 · `jump` S:1960 · `jump-land` S:1969 · `land` S:2243 · `deck-drop` S:2227 · `rail-jump` W:2217 · `stair` S:2150 · `level` S:2169 · `slip` S:1715 | yes, except `level` (toast) and `slip` |
| Abilities | `push` S:1879 · `hitch` S:1904 · `sling` S:1925 · `denied` (no battery) S:1675 | yes |
| Hits and damage | `impact` (`part`, `lost`, `health`, `mult`) S:3268 · `held` S:3269 · `knock` S:2106 · `touch-spent` S:3233 · `writeoff` S:3284 · `chassis` S:1666 | yes, except `chassis`. `knock` and `touch-spent` fire every contact frame, deduped at 0.25 s (G:709) |
| Near-misses | `near-miss`, `miss` (derived, G:669, 679) | yes |
| Cones | `pickup` S:1611 · `drop` S:2004 · `throw` S:2013 · `punt` S:2119 · `cone-hit` S:2264 · `cone-struck`, `cone-stop`, `cone-rest`, `cone-release` | first five yes; the rest no |
| Combos | `combo` S:3249 · `combo-end` S:1934 | yes |
| World | `splash` (river) W:2267 · `rescued` W:2299 · `screen` (flip) S:3397 | yes |
| Cars | `honk` S:2971 (once per blocked spell) · `skid` S:3141 · `unstick` S:2989 · `learn-standoff` S:3259 · `commit`, `interrupt`, `resume`, `ring`, `gridlock`, `exit` | first four yes; the rest no |
| Drones | `drone-dispatch` S:2896 · `drone-pickup` S:2927 · `drone-drop` S:2938 · `drop-in`, `dropped-in` T:139, 152 | first three yes |
| Story beats | `story-enter` T:187 · `story-count`, `story-miss` T:362 · `story-clear` T:380 · `story-gift`, `story-deliver` · `story-ferry` T:260 · `story-ferried` T:296 · `story-fence` T:339 · `gift` T:192 · `delivered` T:126 · `unveil` T:390 · `voyage`, `voyage-end` T:204, 231 | most yes; `voyage` no |
| Arcade | `purchase` S:3643 · `purchase-denied` S:3641 · `shop-open` S:3621 · `credit` S:3309 · `road-cleared` S:3308 · `grade` T:446 · `ending` S:3291 · `milestone` S:1641 | purchase, denied, ending, grade yes |
| Barks | `barkLine` (G:755), cooldowns G:768–776, new bubble G:781 | no sound per bubble |
| UI | menu queue `menuQ` (G:277–285): ok, back, pause, four directions; `handleMenus` G:991–1108 | confirms only (G:1071–1072) |

- `arcade-deliver` has a case (G:948), but nothing emits it.

### 6.6 Moments with no event

Each of these needs a new event, or a state check in the frame loop.

- **Battery:**
  - It recharges every tick (S:1691).
  - Charge is spent at S:1680, 1921 and 1955.
  - "Empty" shows only as `denied`. "Recharged to full" has no event.
- **Combo cap:** `combo.mult === scoring.comboMax` (clamped at S:1941).
- **A part breaks:** `fx.partWatch` is set (G:866). Cracked and broken levels come from G:2315.
- **Low health:** smoke, sparks and the vignette are judged every frame (G:1745–1748, 1910). Use a threshold crossing, not the frame.
- **Points:** awarded at S:2263 (cone), S:3248 (hit), S:3282 (write-off).
- **Car braking:** `c._brk` is set every frame (G:1850). Only an edge (off → on) should sound.
- **Headlight flash ("has noticed you"):** `noticed()` G:1488 and `flashOn()` G:1489, every frame. Use the edge.
- **Horn repeat:** G:1567 replays the horn every 1.4 s while a car honks at the dummy.
- **Hit-stop:** S:3359.
- **Toasts:** `toast()` G:978.

### 6.7 Loop, pause, build

- **Loop:** `frame()` (G:3594) on `requestAnimationFrame`. Each frame runs `pollPad`, then `handleMenus`, then fixed 1/60 s sim steps (G:3600), then `processEvents` (G:3607), then `render`.
- **Pause:** the sim stops (G:3600); `app.realT` keeps running. The sim also holds during brief, gift and unveil (T:240, 428).
- **Build:** B inlines every script into `dummies_p8_4.html`, with no `fetch`, XHR or image loads. Only the Google Fonts stylesheet loads by URL (H:8–10). Audio is the first real asset (§4).

## 7 Repositories

| Repo | Branch | Role |
|---|---|---|
| `lawrencelek/ELVTR-Multiagent-Submission-6B-audio` | `main` | **Target.** Sound design: the agent, the audio, Prototype 9, GDD Edit 100. Empty until seeded |
| `lawrencelek/ELVTR-dummies-agent-crew` | `assignment4/content-pipeline` (HEAD `22bc845` or later) | **Source, read only.** Prototypes, content, registry, decisions, `style/`, `coder/` |
| `lawrencelek/ELVTR-Multiagent-Submission-6` | `main` = `gh-pages` (`3c47a47`) | Assignment #6, done. Pages hosts Prototype 8.4 |
| `lawrencelek/ELVTR-Multiagent-Submission-5` | `main` = `gh-pages` | Assignment #5, done. Pages hosts Prototype 7.13 |

### 7.1 Seed the target repo

- **Copy a slim tree, not the whole source repo.** The source repo is about 500 MB, 337 MB of it history. The build needs 17 files, about 3 MB.
- **Copy these, at the same paths,** so `build.py`'s relative paths still work:
  - `prototypes/p6/`: `sim.js`, `pixel.js`, `lab.js`, `circus_valley.js`, `world6.js`, `content.js`, `game.js`.
  - `prototypes/p7/story.js`, `prototypes/jump/jump.js`, `prototypes/controls/pads.js`.
  - `prototypes/p8/`: `shell.html`, `build.py`, `lore.js`, `text_audit.js`.
  - `content/db/fleet.json`, `content/story/story_v2.json`, `content/params/tuning.parameters.json`.
- **Also copy, for reference:**
  - `DECISIONS.md` (new rows start at 591).
  - `coder/gdd/`: Edits 95–99 and `DUMMIES_GDD_Current_State_Edit99.md`.
  - `docs/DUMMIES_Handover_Sound_Design.md`.
- **Optional, only for new text:** the style loop. Copy `style/` and the inputs that `style/publish_submission.sh` lists.
- **Record the source** in `SOURCE.md`: the repo, the branch and the commit copied.
- **First check.** Run `python3 prototypes/p8/build.py` in the target repo. It must reproduce `dummies_p8_4.html` byte for byte (md5 `9f5549201d88891f9f0b22c461602909`).
  - This session tested exactly this slim copy: identical output. `text_audit.js` also ran: 316 strings, Farsight only on the Credits card.
- **Do not port** `test_p84.js` or `test_p713.js`. They need the source repo's style runs and git history. Write a new test for Prototype 9 (§5, step 7).
- **Hosting:** as for Submission 6. Push `main` to `gh-pages`, with `.nojekyll` and an `index.html` that opens the build. Audio files then load by URL.

## 8 Current state

- **Build:** Prototype 8.4 (`prototypes/p8/build.py`; GDD Edit 99). The next build, Prototype 9, is the target repo's first.
- **Registry:** `content/params/tuning.parameters.json`, `edit99-2026-10-29`, 525 entries. Style IDs: `style/style.params.json`.
- **Decisions:** `DECISIONS.md`, rows 1–590. Open: D67–D85. Newest:
  - D83: text left on the map's tile panel and the objective strip.
  - D84: the scanner hatch inside the view cone.
  - D85: tales cluster at the 20-word cap.
- **Text:** `content/story/story_v2.json`, `prototypes/p8/lore.js`. Style loop: `style/loop.py --guide v2`.
- **Tools in the workspace:** `ffmpeg` and `ffprobe` were present here. Check with `which`; install if missing.

## 9 Run and test

In the target repo, after seeding:

```
python3 prototypes/p8/build.py                       # must reproduce dummies_p8_4.html (md5 above); then do not commit a changed 8.4
python3 prototypes/p9/build.py                       # the new build, with audio
node prototypes/p8/text_audit.js prototypes/p9/dummies_p9.html out.json   # every string drawn on a 32-step tour; reuse for the audio tour
which ffmpeg ffprobe                                 # loudness and transcodes
```

- **New build:** copy `prototypes/p8/build.py` to `prototypes/p9/`. Point it at the audio, and write `dummies_p9.html`.
- **In the source repo only**, if shared code there ever changes: `cd prototypes/p8 && node test_p84.js docs/p84` (41/41) and `cd prototypes/p7 && node test_p713.js docs` (103/103).

## 10 Conventions

- **House style:** direct start; no chatter; active voice; sentences under 15 words; bullet fragments.
- **Data:** every statistic names a registry ID. New statistics get an ID first.
- **Registry writes:** `json.dumps(d, indent=1, ensure_ascii=False) + '\n'`.
- **Commits** go to the target repo's `main`. The source repo stays as it is.
- **Frozen builds** never change. Shared code changes are gated by flags in `P7SIM` / `window.DUMMIES_SIM`.
- **GDD edits:** one per build. Request quoted, readings flagged, rulings recorded; then sections, Build, Measured, Registry, Open.
- **Commit author:** Claude <noreply@anthropic.com>. **Trailer:**
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: <the new session's URL>
  ```
- **Project docs:** `project_write` takes an absolute `local_path` inside the working directory.

## 11 Read first (project docs)

1. `claude/DUMMIES_GDD_Current_State.md`: the game as it stands, with registry IDs.
2. `claude/DUMMIES_GDD_Edit98_Prototype_8_3_Intro_Level_Card_Drone_Drop.md`: the screens Track 1 and Track 2 cover.
3. `claude/DUMMIES_GDD_Edit97_Prototype_8_2_Tales_High_Scores_Arcade_Loop.md` §7: the Arcade loop and grades.
4. `claude/DUMMIES_GDD_Edit99_Prototype_8_4_Cones_Lights_Cue_Key.md`: the car cues (noticed, braking, spent): candidate SFX.
5. `claude/DUMMIES_GDD_Edit86_Prototype_7_5_Clean_Screen_Pause_Options.md`: the pause menu and options.
6. `claude/DUMMIES_GDD_Edit95_Prototype_8_Lore_Dummy_Corporation.md` and `claude/DUMMIES_Style_Guide_V2.md`: tone; the Credits rule (C1).
7. `claude/DUMMIES_P8_Prototype.md`: the 8.x builds.
8. `claude/DUMMIES_Submission6_Style_Guide_Agent.md` §2: the loop pattern to reuse.
