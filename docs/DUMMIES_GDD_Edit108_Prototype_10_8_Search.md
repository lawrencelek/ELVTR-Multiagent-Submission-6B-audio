# DUMMIES — GDD Edit 108: Prototype 10.8, the search

**5 November 2026 · Lawrence Lek** · The eighth escalating test (handover v2 §14.2, §25). Localized: adds §10.8 to the Prototype 10 chapter. Builds row 716's first two proposals: the ghost and the search state.

**Amended 5 November (row 723):** each street camera sees a cone of `perception.streetCameraFov` (60°), not all round (§10.8.4).

**Amended 6 November (row 724):** each cone pans back and forth, as in Metal Gear Solid (§10.8.4).

**Amended 6 November (rows 725–727):** each strike's stealth grade (§10.8.6); the lure and its stop line (§10.8.7); a floor of two open ways in (§10.8.8).

- **Build:** `prototypes/p10/dummies_p10_8.html` (`python3 prototypes/p10/build.py`).
- **Playtest pages:** `index.html`, one per test. 10.1–10.7 are frozen; 10.7 at md5 `54328d01…`.
- **Tests:** `node prototypes/p10/test_p10.js --page` 60/60. Prototype 9 rebuild md5 `be163e7d014344e062965986b3da5786`. 8.4 md5 `9f5549201d88891f9f0b22c461602909`. Sound freeze: 211 items, 0 changed.
- **Probes:** `node qa/testroad.js --stage 10.8 --out qa/baseline/p10_8.json`; report `qa/baseline/p10_8.md`, 24/24 checks. 10.7 reruns identical to its baseline, new fields aside.
- **Decision log:** rows 717–727. D123 resolved. Open D119, D120, D121, D122, D124, D125, D126.

## Request

> "Search state with its ghost" (Lawrence, after row 716), picking from row 716: "The car draws a ghost where it last saw the dummy while it waits. A short search state: the car slows past that last-seen spot, then gives up."

## Readings

| Reading | Basis | Status |
|---|---|---|
| The search is rung 7, taught by one lesson | One change a test (row 653); §14.2: each rung closes the trick that won | Proposed (row 717) |
| The road upgrade moves to 10.9; swerve cost to 10.10 | The search is a car behaviour on road A | Proposed (row 717; D121) |
| Cause: a hit from cover, sprung within `duel.lessonClipSeconds` (3) of the car truly seeing the dummy | The clip must show the sighting it lost | Proposed (row 718) |
| "Slows past" reads as "stops short, then drives on" | Slowing past hidden cover cannot close it: a dash crosses a lane in under 0.1 s (row 690, F3) | Proposed (row 718) |
| The ghost marks a true sighting only: its own sensors, or a street camera | Memory and the search see through cover; a ghost set by them would follow the dummy | Proposed (row 718) |
| `duel.searchRadius` 60: about one spot's spacing | The nine hiding spots sit about 60 apart (row 708) | Proposed (row 718; D122) |
| `duel.searchSeconds` 4: from the last time it had the dummy | Short: a search, not a stalemate. The block lift ends a found dummy's wait (row 715) | Proposed (row 718; D122) |
| Narrower cameras: a cone along the cover each was put up for | Lawrence, 5 November: "with the cameras it's super difficult since they have this 360 view. they need a narrower field of view" | Decided (row 723) |
| 60°; aims along the barrier and the building's south face | D118: each camera watches the cover near its post | Proposed (row 723) |
| The cones pan back and forth | Lawrence, 6 November: "panning back and forth like mgs" | Decided (row 724; D123 resolved) |
| A 60° sweep: rest 1 s, cross in 3 s; the barrier's ends as mirror images | MGS: a slow pan, a rest at each end; a window when both look away | Proposed (row 724; D124) |
| Grade each strike: UNSEEN, LOST, SEEN | Lawrence, 6 November: "Score each strike by how unseen it was" | Decided (row 725) |
| "Noticed" is a true sighting: the car's own sensors or a camera, noticed or in its path | The data behind rung 7's lesson (`c.seenT`) | Proposed (row 725; D125) |
| UNSEEN 3, LOST 2, SEEN 1 points | Never noticed scores highest | Proposed (row 725; D125) |
| The lure: the car's learning as the player's tool | Lawrence, 6 November: "Make the car's learning a lure the player can use" | Decided (row 726) |
| A stop line drawn for every stop at rung 6 up; a prompt the first time it stops short of a remembered spot or a ghost | "Draw the car's coming stop line on the road" | Proposed (row 726; D126) |
| An open way lands at least 0.3 a minute at the top rung; each new part opens a way that uses it | Lawrence, 6 November: "at least two bots still land at every rung, and the count rises as parts arrive" | Proposed (row 727) |

## 10.8 The search

### 10.8.1 The lesson

- **Start:** rung 6 (`duel.startRung` 6). Battery 1, Legs 1, Hands 1 and DUCK fitted (`duel.duckArrives` 3).
- **Cause: seen, then struck from cover.** The car truly had the dummy within `duel.lessonClipSeconds` (3) of the spring. The dummy sprang from cover.
- **Teaches nothing:** a hit from the open; a spring the car never saw; a sighting older than the clip.
- **Beats:** as 10.2.
  - The clip's last frame draws the ghost where it last had the dummy: "LAST SEEN · n s BEFORE", a line to the impact.
  - The fitting reads "SEARCH FITTED · LAST SEEN". A drone fits an amber beacon. The diagram: the car, its stop line, the ghost, the ring.
- **One lesson:** rung 6 to `duel.topRung` 7. No part.

### 10.8.2 Rung 7: it looks where it last saw you

- **The ghost.** The dummy vanishes behind cover from a car that truly had it. The car marks where it last saw it.
- **It stops short.** It brakes to its stop line short of the ghost, as for a dummy standing there.
- **It finds you near the ghost.** A dummy within `duel.searchRadius` (60) of it is expected:
  - Cover does not hide it.
  - The field notices it at once.
  - The ghost stays where it was.
- **It gives up.** `duel.searchSeconds` (4) after it last had the dummy, it drops the ghost and drives on.
- **A true sighting clears the ghost.** In plain sight again, the dummy is simply seen.
- **Memory comes first.** At a spot rung 6 remembers, the dummy is expected and never lost: no ghost.
- **The block lift still ends a wait** (row 715). A found dummy is lifted aside after `duel.blockSeconds` (10).

### 10.8.3 What the car shows (row 701)

- **On the road, from rung 7:**
  - The ghost: a dashed amber outline of the dummy where it was last seen. "LAST SEEN" over it.
  - A dashed ring of `duel.searchRadius` round it. It turns solid while the dummy is inside.
  - An amber arc round the ring: the time left before it gives up.
  - A dashed amber line from the car to its ghost.
- **On the car:** an amber beacon on its roof, flashing while it searches. Its tag: "R7 · MEMORY n · SEARCHING", then "FOUND".
- **On the dummy:** inside the ring, FOUND, in amber. At a remembered spot, EXPECTED, in red. Elsewhere, HIDDEN or SEEN.
- **On the lesson screen:** §10.8.1's beats.

### 10.8.4 The street cameras' cones (row 723)

- **Each camera sees a cone:** `perception.streetCameraFov` (60°) about its aim, out to `perception.streetCameraRange` (180).
- **Aims (degrees; 0 east, 90 south):**
  - The barrier's west end: 30°, along the barrier's back.
  - The barrier's east end: 150°, along it from the other end.
  - The building's corner: 20°, along the building's south face.
- **Each cone pans (row 724),** as Metal Gear Solid's cameras do:
  - It sweeps `perception.streetCameraPanArc` (60°), centred on its aim. Camera 1 looks from 0° to 60°.
  - It rests `perception.streetCameraPanHold` (1 s) at each end.
  - It crosses in `perception.streetCameraPanSeconds` (3 s), at a steady rate. One cycle: 8 s.
  - The barrier's two ends sweep as mirror images. Both look along the barrier at once, and away at once.
  - The building's corner runs a quarter cycle behind.
- **Outside every cone, cover hides the dummy** as from the car's own sensors.
- **The barrier's back is watched part of each cycle.** Cross while both cameras look south.
- **Never watched:** the north planter row, the plinth, the building's west face, both planter rows south-east.
- **Drawn:** a faint cone per camera, at its aim now, replacing the range circle. A faint dotted arc marks its whole sweep. The lens points along its aim.
- **Frozen 10.5–10.7 keep 360°, fixed.**

### 10.8.5 The opening

- **Crawl away.** Ducked, cross more than `duel.searchRadius` along the cover. It gives up and drives on into the strike.
- **Hide before it sees you.** No sighting, no ghost: the spot works as at rung 6.
- **The sprint from past the field** (D115). Unseen until it lands.
- **Next (§14.2, 10.9):** the road upgrade. Two-way, with white sedans that never learn (D121).

### 10.8.6 The stealth grade (row 725)

- **Each damaging strike is graded** by the striking car's sightings this pass:
  - **UNSEEN:** it never noticed the dummy. `scoring.stealthUnseen` 3 points.
  - **LOST:** it noticed the dummy, then lost it before the spring. `scoring.stealthLost` 2.
  - **SEEN:** it had the dummy as it sprang. `scoring.stealthSeen` 1.
- **Noticed** means a true sighting: its own sensors or a street camera, noticed or in its path.
- **The spring** is a dash's or a jump's start. A walk-in grades at the impact.
- **Shown:**
  - A flash under the dummy at the strike: "UNSEEN +3".
  - The grade under the crash's evidence marker.
  - The HUD: "STEALTH n", then the last grade.
- **Any rung.** The grade measures the player, not the car. A strike that lands can still land better.
- **Earlier stages:** 0 points; no grade shown.

### 10.8.7 The lure (row 726)

- **The car's learning is the player's tool.** It stops where it expects the dummy. Choose that place, then strike from elsewhere.
  - **Rung 6:** stand at a remembered spot. It stops short and waits.
  - **Rung 7:** show yourself, then hide. It stops short of its ghost.
  - **Then:** crawl beyond the ring, downstream. Strike as it drives on.
- **The stop line:** from rung 6, a red car braking for the dummy, a remembered spot or a ghost draws where its nose will stop. A line across its lane; "STOPS HERE" until it arrives.
  - Amber for a ghost; red for a remembered spot; white otherwise.
- **The prompt,** once a run each:
  - The first stop at a remembered spot: "IT STOPS WHERE IT EXPECTS YOU · NOW STRIKE FROM ELSEWHERE".
  - The first ghost: "IT STOPS SHORT OF ITS GHOST · STRIKE FROM BEYOND ITS RING".

### 10.8.8 The possibility space (row 727)

- **An open way in** lands at least 0.3 a minute at the build's top rung (the probes' trained mode).
- **The floor:** at least two open ways in at every rung.
- **A new part opens a way that uses it.**
- **The probe report checks both,** and lists every stage's count from its baseline.

## Build

- `testroad.js`:
  - Rung 7 in the rungs table (search: true; fit 'SEARCH'; no part).
  - `trulySees`; `c.seenT` and `c.seenAt` each tick the car truly has the dummy.
  - `searchStep`: the ghost (`c.lkp`), the stop line, found, give up.
  - `searched`: `expected` covers the ring.
  - `springSeen`: each spring records the last sighting. `account` sets `lostSight` and `seenAt`. `learnFrom`: the search cause.
- `game_p10.js`: the ghost, ring, arc and line; the beacon and tag; FOUND; the clip's ghost; the fitting's diagram; the title line "It looks where it last saw you."
- Row 723: each camera carries an aim; `inCameraCone` in `seeingCamera`; the cones drawn.
- Row 724: each camera carries a phase; `cameraAim` pans it on sim time; the cone drawn at its aim now, with its sweep's arc.
- Row 725: `strikeGrade`, `gradePoints`; `this.stealth`; the crash records its grade. `game_p10.js`: the flash, the marker's grade, the HUD.
- Row 726: `stopPoint` (the nose's rest on its path). `game_p10.js`: `drawStopLines`, `drawHint`.
- `build.py`: 10.8's stage; 10.7's page frozen.
- `qa/testroad.js`: bots `peek` (stand in view until noticed; duck; spring) and `peekmove` (the same; crawl beyond the radius along the row first). Fields: searches, found, ended, hits after a lost sighting.
- Rows 725–727: bot `lure`; fields grades, stealth points, lures taken, lured cars struck, stop-line misses. `qa/testroad_report.py`: the grade, lure and possibility-space sections and their checks.

## Measured (`qa/baseline/p10_8.md`)

**Rung 7 alone** (mode `trained`; 3 offsets × 300 s):

| Way in | Hits a minute | Damage a hit | Verdict |
|---|---|---|---|
| Seen, then ducked, the same spot (`peek`) | 0 | — | Closed: 30 searches, 30 found |
| Seen, then crawled beyond the ring (`peekmove`) | 2.02 | 150 | Open: the crawl |
| Moving between spots it does not remember (`roam`) | 2.59 | 226 | Open, narrowed: 6.97 at rung 6. Walks in view leave ghosts |
| The sprint from past the field (`lurk`) | 0.60 | 53 | Open (D115) |
| The flank from open pavement | 0.60 | 53 | Open (D115) |
| The planter ambush, the same spot | 0.27 | 84 | Closed after one hit a run (rung 6) |
| Behind the barrier at its gap (`gap`) | 0.47 | 66 | Open: the pan's window (row 724) |
| The cone bait | 0 | — | Closed |
| Every other bot | 0 | — | Closed |

- **A new behaviour:** 707 searches; 236 found the dummy near the ghost; 699 ended. None at rung 6.
- **No hit from a remembered spot:** 0 of 97.
- **The block lift:** 1,064 lifts. No wait for the dummy past 20 s.

**The cones (row 723; trained, hits a minute):**

| Way in | 360° | 60°, fixed | 60°, panning |
|---|---|---|---|
| The crawl (`peekmove`) | 1.89 | 1.96 | 2.02 |
| Moving between spots (`roam`) | 2.52 | 2.59 | 2.59 |
| The flank from open pavement | 0.40 | 0.60 | 0.60 |
| Behind the barrier at its gap (`gap`) | 0 | 0.07 | 0.47 |
| The cone bait | 0 | 0.13 | 0 |
| Searches | 564 | 779 | 707 |

- **The bots barely move.** Their spots sat outside the cameras' range already. A human hiding by the plinth, the north planters or the building's west face gains most.
- **The pan opens the barrier's gap.** Seven hits in 15 minutes, against one fixed. The bot does not time the sweep; a player who does gains more.

**The stealth grade (row 725):**

| Way in (trained) | Hits | UNSEEN | LOST | SEEN | Points a minute |
|---|---|---|---|---|---|
| Moving between spots (`roam`) | 38 | 28 | 8 | 2 | 6.95 |
| The lure (`lure`) | 32 | 11 | 21 | 0 | 5.09 |
| The crawl (`peekmove`) | 30 | 9 | 17 | 4 | 4.39 |
| The sprint from past the field (`lurk`) | 9 | 9 | 0 | 0 | 1.80 |
| The gap | 7 | 3 | 0 | 4 | 0.87 |
| The flank from open pavement | 9 | 0 | 0 | 9 | 0.60 |

- **As predicted:** the sprint grades UNSEEN, 18 of 18 across both modes. Seen, then hidden (`peek`) grades LOST, 4 of 4.
- **The open-ground flank grades SEEN, 9 of 9.** It lands, but scores least.

**The lure (row 726):**

| Mode | Lures taken | At a remembered spot | For a ghost | Lured cars struck | Damage a lure hit |
|---|---|---|---|---|---|
| Trained (rung 7) | 18 | 12 | 6 | 18 | 225 |
| Lesson (rung 6, then 7) | 16 | 15 | 1 | 16 | 229 |

- **It lands.** Every lured car was struck. A parked car restarts fast enough: 225 a hit, against 226 for every hit.
- **Rung 6 alone** (`--set duel.topRung=6`, 2 × 300 s): 17 lures, all at remembered spots, all struck; 200–214 a hit. Roaming still lands more at rung 6: 6.8–7.05 a minute, against the lure bot's 4.1–4.8.
- **Rung 7:** the lure bot lands 2.17 a minute, a write-off every 68 s. Its escalation holds: hits in 10 of 10 minutes (decay 0.60).
- **The stop line:** the first line drawn for each stop fell within 10 of the nose at rest in 2,347 of 2,488 stops (94%). A line drawn for a dummy that then moves misses.

**The possibility space (row 727):**

| Stage | Top rung | Open ways in | Parts it brings | Its ways that use them |
|---|---|---|---|---|
| 10.1 | 0 | 6 | — | — |
| 10.2 | 1 | 3 | Battery 1 | aim, flank |
| 10.3 | 2 | 6 | Legs 1 | jump, dashjump, plinth |
| 10.4 | 3 | 5 | — | — |
| 10.5 | 4 | 2 | Hands 1 | conebait |
| 10.6 | 5 | 2 | DUCK | planter |
| 10.7 | 6 | 3 | — | — |
| 10.8 | 7 | 6: the lure, roaming, the crawl, the gap, the sprint, the flank | — | — |

- **Every stage held the floor of two.** 10.5 and 10.6 sat on it.

**The lesson** (mode `lesson`):

- **Lessons:** in 9 of 9 runs with a hit from cover after a sighting, at 3–54 s.
- **Lessons:** 0 of 10 runs with other hits only.
- **Escalation (10 minutes):** seen-then-hidden decays to 0 after two hits. The crawl lands in 9 of 10 minutes (decay 0.38). Roaming holds at 3 (0.70).

**Pace:**

| Way in | Seconds a write-off | GDD target |
|---|---|---|
| Moving between spots, rung 6 (10.7) | 18 | At most 80 (Edit 18 §10.2) |
| Moving between spots, rung 7 | 55 | |
| The crawl, rung 7 | 111 (99 fixed 60°; 111 at 360°) | |
| The lure, rung 7 | 68 | |

## Registry

- **Added (9):** `duel.searchRadius`, `duel.searchSeconds`; `perception.streetCameraFov` (row 723; default 360); `perception.streetCameraPanArc` (default 0), `perception.streetCameraPanSeconds`, `perception.streetCameraPanHold` (row 724); `scoring.stealthUnseen`, `scoring.stealthLost`, `scoring.stealthSeen` (row 725; default 0).
- **Set by stage:** `duel.startRung` 6, `duel.topRung` 7, `duel.searchRadius` 60, `duel.searchSeconds` 4, `perception.streetCameraFov` 60, `perception.streetCameraPanArc` 60, `perception.streetCameraPanSeconds` 3, `perception.streetCameraPanHold` 1, `scoring.stealthUnseen` 3, `scoring.stealthLost` 2, `scoring.stealthSeen` 1. 10.7's values otherwise.
- **672 entries.** `registryVersion` unchanged (row 665).

## Open

- **Human pass (H6):** does the player read the ghost, and crawl away? Do the cones read? Does the player time the sweep? Does the grade pull play toward UNSEEN? Does the player use the lure?
- **D125:** the grade's points and what counts as noticed.
- **D126:** the stop line and the prompt: always on, or a part?
- **D124:** the pan's values: 60° in 3 s, 1 s rests, the barrier's ends mirrored.
- **D121:** the order from here. The road upgrade at 10.9, swerve cost at 10.10.
- **D122:** the search's values. 60 and 4 leave the crawl open along a row longer than 60.
- **D119:** eased. The roaming expert writes off a body every 55 s, within the target.
- **D120:** the memory's cap.
- **D115:** the sprint from past the field.
