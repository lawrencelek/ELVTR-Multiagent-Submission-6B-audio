# DUMMIES — Sound Guide (Prototype 9, GDD Edit 100)

The reviewer and the refiner read this whole guide. Every rule has an ID, a severity, a test and a source.

## 0. The game, for the ear

- **DUMMIES:** a top-down game. A crash-test dummy in training in SHENZHEN SMART CITY. Self-driving cars are built never to hit anyone; the dummy gets hit anyway, in combos, and earns its parts. (GDD Current State)
- **The narrator:** Dummy Corporation. Deadpan and inspirational; corporate comedy in a Sinofuturist city. Never "!". (Edit 95; Style Guide V2 T1)
- **The cars** are colleagues, not enemies. They bark in their tier's voice. (Style Guide V2 T3, T7)
- **Two worlds of sound:**
  - **Bodies and machines:** dashes, jumps, hits, cones, cars, landings. Physical, short, punchy.
  - **The Corporation's system:** menus, notices, drones, counts, gifts, grades, the plaque. Clean, synthetic, official.
- **The pack:** 100 WAV effects (Chequered Ink) and six OGG tracks (ansimuz). Retro, synthetic. Names describe use: `hurt_*`, `select_*`, `confirm_*`, `collect_*`, `powerup_*`, `explosion_*`.
- **Generated tones:** `tone_<event>.wav`, Prototype 8.4's procedural sounds rendered by `audio/tones.py` (from run 4 on). A `synth` entry plays its event's tone.

## 1. The request (Lawrence, verbatim)

> Music — Track 1 - Splash Screen. Track 2 - From menu until just before the level starts (whether story or arcade mode). Track 3, 4, 5, 6, Alternate between different levels and maps.
>
> SFX — read WAV file names and decide on appropriate places to put the sound triggers.

## 2. Classes (registry IDs)

**Buses:** `sfx` (bodies, machines, story beats) and `ui` (menus). Music is its own bus.

**Loudness.** The integrator trims every effect toward `audio.sfx.targetLufs` (−18) from its measured level, capped at ±`audio.trim.maxBoostDb` (12 dB) and by `audio.trim.peakCeilingDb` (−1 dBFS). Every effect enters its bus near the same loudness; the inventory's "in game" column gives it. **The gain class sets weight, not the file's measured level.** Judge F3 by the gain class and the file's character (length, attack, body).

**Gain classes** (dB on the cue's bus, after the trim; `audio.sfx.gain.<class>`):

| Class | dB | Use |
|---|---:|---|
| `ui` | −6 | Menu moves and confirms |
| `move` | −6 | The dummy's own moves: dash, jump, land, stairs |
| `hit` | −2 | Contact: hits, knocks, cone hits |
| `big` | 0 | The heaviest beats: write-off, big hit, the gift's landing |
| `reward` | −3 | Points and progress: combo, count, clear, grade, purchase |
| `story` | −5 | Corporation notices: drones, deliveries, fences, the ferry |
| `alert` | −4 | Warnings: denied, low health, honks |
| `ambient` | −12 | Traffic chatter and background |

**Cooldown classes** (seconds between plays of one cue; `audio.sfx.cooldown.<class>`): `ui`, `action`, `burst`, `frame`, `ambient`, `once`. A cue may name a specific ID instead (`audio.sfx.cooldown.honk`, `audio.sfx.cooldown.bark`).

**Decisions per event:** `cue` (files from the pack), `silence` (no sound, with a reason), `synth` (the event's generated tone: Prototype 8.4's procedural sound, rendered), `base` (a variant plays its base event's cue).

## 3. Rules

Severity: blocking −4, major −2, minor −1. Each broken rule deducts once per entry. The floor is 1.

### Coverage

| ID | Sev. | Rule | Test |
|---|---|---|---|
| C1 | blocking | Every catalogued event and variant has exactly one entry | An id in `events.json` with no entry, or two entries |
| C2 | major | Every high-priority event has a `cue` | A high-priority event set to `silence`, `synth` or `base` with no reason tied to the game |
| C3 | minor | Every `silence` and `synth` states why | An empty or generic `why` |

### Fit

| ID | Sev. | Rule | Test |
|---|---|---|---|
| F1 | major | The file's name suits the event | A name from another domain (an animal for a car, a laser for a footstep) with no stated joke |
| F2 | major | The duration suits the frequency | UI over 0.35 s; action, burst, frame or ambient over 0.8 s; once over 2.5 s |
| F3 | minor | Weight follows stakes | The write-off, the clear, the gift and the endings are not in a lighter gain class, or a thinner, shorter file, than the moves they follow; menus are in `ui`. Measured levels do not count: the trim evens them |
| F4 | major | Tone: deadpan corporate comedy, Sinofuturist | Horror (`ghostly_laugh`), farmyard animals, fantasy magic, unless the entry states the joke and the GDD supports it |

### Clashes and spam

| ID | Sev. | Rule | Test |
|---|---|---|---|
| X1 | major | No file serves two events that fire together | A file in the primary `files` of two events that list each other in `firesWith` (variants of one event never fire together) |
| X2 | minor | Variety across the map | One file primary in more than three events |
| S1 | blocking | Per-frame and ambient events that sound have a cooldown | A sounded `frame` or `ambient` event on cooldown `ui`, `action` or `once` |
| S2 | major | Repeated actions vary | A sounded `burst` or `frame` event with one file and no stated reason |

### Loudness and licence

| ID | Sev. | Rule | Test |
|---|---|---|---|
| L1 | blocking | Every file used is in the inventory, measured and credited | A file missing from `inventory.json`, or with no level or credit |
| L2 | minor | Gain classes follow §2 | A menu cue not `ui`; ambient chatter not `ambient` |

### Music

| ID | Sev. | Rule | Test |
|---|---|---|---|
| M1 | blocking | The request's three spans hold | Intro not Track 1; any menu state not Track 2; levels not Tracks 3–6. The level card may play the level's track (Lawrence, row 610) |
| M2 | major | Levels alternate | Rotation not four distinct tracks from 3–6; neighbouring Story tiles on one track; Arcade not rotating per run |
| M3 | minor | Open states are stated | Pause, credits, ending or finale with no state and reason |

### Alternates (the Sound Lab)

| ID | Sev. | Rule | Test |
|---|---|---|---|
| A1 | minor | Each `cue` offers 2–3 alternates | Fewer than two, an alternate equal to a primary file, or an alternate from another domain |

## 4. Precedence

The request (§1) beats this guide. A row Lawrence decided in `DECISIONS.md` beats both: his Sound Lab picks (rows 603, 607) and his rulings (rows 609–618: the card starts the level's track, the start tile sets it, the ducks, the fades, Credits on Track 1) are placed over the accepted map, as written.
