# DUMMIES — GDD Edit 108: Prototype 10.8, the search

**5 November 2026 · Lawrence Lek** · The eighth escalating test (handover v2 §14.2, §25). Localized: adds §10.8 to the Prototype 10 chapter. Builds row 716's first two proposals: the ghost and the search state.

**Amended 5 November (row 723):** each street camera sees a cone of `perception.streetCameraFov` (60°), not all round (§10.8.4).

**Amended 6 November (row 724):** each cone pans back and forth, as in Metal Gear Solid (§10.8.4).

**Amended 6 November (rows 725–727):** each strike's stealth grade (§10.8.6); the lure and its stop line (§10.8.7); a floor of two open ways in (§10.8.8).

**Amended 6 November (rows 728–729):** a strike scores its damage × its grade; the lure's field notes show once per save file, as a panel (§10.8.6–§10.8.7).

**Amended 6 November (row 730):** the side field in stages: the nearer the dummy, the slower the car, and it shows its stage (§10.8.9).

**Amended 6 November (rows 731–732):** the field as three cones, the forward one more sensitive (§10.8.10); the lunge guide (§10.8.11).

**Amended 6 November (row 733):** the cones meet edge to edge, all from the nose; a noticed car forgets the dummy 3 s after it leaves its cones (§10.8.10).

- **Build:** `prototypes/p10/dummies_p10_8.html` (`python3 prototypes/p10/build.py`).
- **Playtest pages:** `index.html`, one per test. 10.1–10.7 are frozen; 10.7 at md5 `54328d01…`.
- **Tests:** `node prototypes/p10/test_p10.js --page` 63/63. Prototype 9 rebuild md5 `be163e7d014344e062965986b3da5786`. 8.4 md5 `9f5549201d88891f9f0b22c461602909`. Sound freeze: 211 items, 0 changed.
- **Probes:** `node qa/testroad.js --stage 10.8 --out qa/baseline/p10_8.json`; report `qa/baseline/p10_8.md`, 24/24 checks. 10.7 reruns identical to its baseline, new fields aside.
- **Decision log:** rows 717–733. D123, D125, D126 resolved. Open D119, D120, D121, D122, D124, D127, D128, D129.

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
| "Noticed" is a true sighting: the car's own sensors or a camera, noticed or in its path | The data behind rung 7's lesson (`c.seenT`) | Decided (row 728) |
| A strike scores its damage × its grade: UNSEEN ×3, LOST ×2, SEEN ×1 | Lawrence, 6 November: "multiply each strike's damage by its grade, so big unseen strikes score most" | Decided (row 728) |
| The lure: the car's learning as the player's tool | Lawrence, 6 November: "Make the car's learning a lure the player can use" | Decided (row 726) |
| A stop line drawn for every stop at rung 6 up | "Draw the car's coming stop line on the road"; "keep the stop line always on while we playtest" | Decided (row 729) |
| The prompt: once per save file, as a panel | Lawrence, 6 November: "only happen once per save file (test this), ideally it should be shown with UI" | Decided (row 729) |
| The side field slows the car in stages, the nearer the dummy the slower, and shows its stage | Lawrence, 6 November: "the car should SLOW DOWN, in inverse proportion to how close the character is … becomes aware (IT SHOULD INDICATE this), then slows down a bit, then a lot … 3-4 stages" | Decided (row 730) |
| "Close" is the distance from the car's nose; four stages: AWARE, SLOWING, CRAWLING, STOPPING | A standing dummy grows closer as the car comes: the stages run in order | Proposed (row 730; D127) |
| Ranges 360 and 180 (about the dash's reach); speeds 0.85, 0.6, 0.35 of cruise; AWARE notices at half speed | The probes: slower noticing let the cover springs back in | Proposed (row 730; D127) |
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
  - **UNSEEN:** it never noticed the dummy. × `scoring.stealthUnseen` 3.
  - **LOST:** it noticed the dummy, then lost it before the spring. × `scoring.stealthLost` 2.
  - **SEEN:** it had the dummy as it sprang. × `scoring.stealthSeen` 1.
- **A strike scores its damage × its grade** (row 728). Big unseen strikes score most: power and stealth both pay.
- **Noticed** means a true sighting: its own sensors or a street camera, noticed or in its path.
- **The spring** is a dash's or a jump's start. A walk-in grades at the impact.
- **Shown:**
  - A flash under the dummy at the strike: "UNSEEN ×3 +675".
  - The grade under the crash's evidence marker.
  - The HUD: "STEALTH n", then the last grade, its multiplier and its points.
- **Any rung.** The grade measures the player, not the car. A strike that lands can still land better.
- **Earlier stages:** 0 points; no grade shown.

### 10.8.7 The lure (row 726)

- **The car's learning is the player's tool.** It stops where it expects the dummy. Choose that place, then strike from elsewhere.
  - **Rung 6:** stand at a remembered spot. It stops short and waits.
  - **Rung 7:** show yourself, then hide. It stops short of its ghost.
  - **Then:** crawl beyond the ring, downstream. Strike as it drives on.
- **The stop line:** from rung 6, a red car braking for the dummy, a remembered spot or a ghost draws where its nose will stop. A line across its lane; "STOPS HERE" until it arrives.
  - Amber for a ghost; red for a remembered spot; white otherwise.
- **The field notes, once per save file** (row 729):
  - The first stop at a remembered spot: "IT STOPS WHERE IT EXPECTS YOU. NOW STRIKE FROM ELSEWHERE."
  - The first ghost: "IT STOPS SHORT OF ITS GHOST. STRIKE FROM BEYOND ITS RING."
- **The panel:** a FARSIGHT diagnostic panel, "FARSIGHT · FIELD NOTE" and "THE LURE" in its header strip.
  - A leader runs from it to the car's stop line, with a pulsing ring.
  - It holds `ui.tip.holdSeconds` (7), with a timer bar. Play goes on.
- **The save file:** one record in this browser for every Prototype 10 page. R does not reset it; a reload keeps it.
  - N on the pause screen starts a new save file: the notes show again.
  - Without browser storage, it lasts the visit.

### 10.8.8 The possibility space (row 727)

- **An open way in** lands at least 0.3 a minute at the build's top rung (the probes' trained mode).
- **The floor:** at least two open ways in at every rung.
- **A new part opens a way that uses it.**
- **The probe report checks both,** and lists every stage's count from its baseline.

### 10.8.9 The side field in stages (row 730)

- **The nearer the dummy, the slower the car.** By its distance from the car's nose (beside the car: its gap from the flank):

| Stage | Where the dummy is | Speed cap (of cruise) | Notice meter | Shown |
|---|---|---|---|---|
| 1 AWARE | In the field, beyond `perception.sideWaryRange` (360) | `perception.sideAwareSpeed` 0.85 | At `perception.sideAwareNoticeRate` 0.5: noticed in 1.2 s | "?", one pip; "AWARE" |
| 2 SLOWING | Within 360 | `perception.sideWarySpeed` 0.6 | At `perception.sideWaryNoticeRate` 1: 0.6 s | "?", two pips; "SLOWING" |
| 3 CRAWLING | Within `perception.sideCloseRange` (180), about the dash's reach | `perception.sideCloseSpeed` 0.35 | Full: `perception.sideNoticeSeconds` 0.6 s | "?", three pips; "CRAWLING" |
| 4 STOPPING | Noticed | Stops short, as before | — | "!", red; "STOPPING", then "WAITING" |

- **Each cap is the car's caution speed** (`proto.driver.cautionSpeed`'s place). It brakes to reach it by the dummy, between `traffic.comfortBraking` and `traffic.hardBraking`, after `perception.reactionDelay`.
- **A standing dummy:** AWARE, then STOPPING. The car notices it about 580 out and stops 228 short (reach 164).
- **A dummy stepping out nearer:** SLOWING or CRAWLING first, then STOPPING.
- **Drawn:** dashed rings at 180 and 360 from the nose, inside the field; the dummy's band lit in its stage's colour. Over the car: the glyph and pips, above its tag.
- **Earlier stages:** `perception.sideCloseRange` 0, one caution speed, one notice time.
- **Row 731:** the stages now run inside three cones (§10.8.10). Distances are from each cone's apex.

### 10.8.10 The field as three cones (row 731)

- **Forward cone:** from the nose, `perception.forwardConeAngle` 20° either side of the heading. Reaches `perception.forwardLength` 720. Sensitivity `perception.forwardConeSensitivity` 1.
- **Side cones:** from the car's centre, `perception.sideConeAxis` 60° ± `perception.sideConeAngle` 45°: 15° to 105° off the heading. Reach `perception.sideConeRange` 220. Sensitivity `perception.sideConeSensitivity` 0.5.
- **Sensitivity scales the stages.** A dummy must come closer to a duller cone for each stage:

| Stage | Forward cone (from the nose) | Side cone (from the centre) |
|---|---|---|
| 1 AWARE | Beyond 360 | Beyond 180 |
| 2 SLOWING | Within `perception.sideWaryRange` 360 | Within 180 |
| 3 CRAWLING | Within `perception.sideCloseRange` 180 | Within 90 |
| Notice meter | Stage rate × 1 | Stage rate × 0.5 |

- **Speeds stay per stage.** The stage shown is what the car does, in any cone.
- **Blind:** behind the car (past 105°), and the wedges between cones.
- **Past its cones, inside the rung's rectangle** (`proto.driver.cautionZone` 180), it still has the dummy:
  - once noticed: it tracks what it detected;
  - when a street camera sees it (rung 4);
  - at a remembered spot (rung 6).
  - These count at full sensitivity.
- **Searching (rung 7):** the forward cone turns toward the ghost. It turns up to 105° (`perception.sideConeAxis` + `perception.sideConeAngle`).
- **Drawn:** three wedges, brighter for the more sensitive; dashed stage rings in each; the dummy's cone and band lit.
- **Tried and dropped:**
  - Cones alone. The car lost a noticed dummy in the gap at its own stop: kerb 9, standplanter 9 hits in 15 minutes.
  - Side range 300. The lurk spot falls inside; lurk grades SEEN.
  - Forward 25°; side sensitivity 0.6 or 0.75. No fewer side strikes.
- **Earlier stages:** `perception.forwardConeAngle` 0, the rectangle.
- **Row 733, edge to edge:**
  - All three cones start at the nose. The side cones begin at the forward cone's edge; none overlaps.
  - Forward ±30°. Each side 30°–120° off the heading (`perception.sideConeAxis` 75 ± `perception.sideConeAngle` 45), out to `perception.sideConeRange` 240.
  - Searching, the turned forward cone wins over a side cone.
- **Row 733, the forget:** out of its cones and path, a noticed dummy stays tracked `perception.trackSeconds` 3, then the notice resets. A bar under the "!" runs down.
- **Row 733, tried:** the row 731 shape from the nose with the forget. The car stopped with the dummy between cones, forgot it, drove on: kerb 10, standplanter 6, aim 4, flank 4, dashjump 5 hits in 15 minutes.

### 10.8.11 The lunge guide (row 732)

- **`ui.lungeGuide` 1:** a dotted line and a reticle show where a dash pressed now would land.
- **Shown while a car is within 2.6 dash reaches.** Hidden mid-dash, recovering, lifted, or before Battery 1.
- **Aim:** the input's direction (DIRECT, `proto.turnModel` 2); otherwise the facing.
- **Reach:** `movement.lungeDistance`, worn by leg damage, times the ground's lunge multiplier. A solid stops it, touching. Low cover does not.
- **Path:** the dash's profile: `movement.lungeFastDistanceFraction` 0.7 of the reach in `movement.lungeFastTimeFraction` ⅓ of `movement.lungeDuration` 0.3 s.
- **Cars:** each moves straight on at its speed. Contact uses the sim's own test.

| Reticle | Means |
|---|---|
| Yellow, "HIT", at the contact | The dash meets a red car |
| White | It misses |
| Faint | The dash is not ready: no charge, or recovering |

- **Reverses GDD Edit 19 §4.2.8** ("current reach is never shown") on the test road.

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
- Row 726: `stopPoint` (the nose's rest on its path). `game_p10.js`: `drawStopLines`.
- Row 728: `gradeMultiplier`; the strike's points are its damage × it.
- Row 729: `game_p10.js`: the save file (`dummies.p10.save`: `readSave`, `writeSave`, `newSave`), `showTip`, `drawTip`; N on the pause screen.
- Row 730: `sideStaged`, `sideDist`, `sideStage`, `noticeRate`, `stageSpeed`; `cornerSpeed` sets each red car's caution speed; `watchField` fills the meter by stage. `game_p10.js`: the rings and lit band in `drawZones`; `drawAwareness`; the tag.
- Row 731: `coned`, `coneOf`, `coneLook`, `coneSensitivity`; `assessBody` keeps the forward cone, then tracking, the link and memory, then the side cones; `fieldFor` holds the cones; `sideDist` over the cone's sensitivity. `game_p10.js`: `drawCones` in `drawZones`.
- Row 732: `lungePreview`. `game_p10.js`: `drawLungeGuide`, fed the last input (`lastCmd`).
- `build.py`: 10.8's stage; 10.7's page frozen.
- `qa/testroad.js`: bots `peek` (stand in view until noticed; duck; spring) and `peekmove` (the same; crawl beyond the radius along the row first). Fields: searches, found, ended, hits after a lost sighting.
- Rows 725–727: bot `lure`; fields grades, stealth points, lures taken, lured cars struck, stop-line misses. `qa/testroad_report.py`: the grade, lure and possibility-space sections and their checks.
- Row 731: `qa/testroad_report.py` reads a coned field. Closed tricks may leave a rare side strike, under 0.21 a minute. Peek's hits may grade SEEN, never UNSEEN. One remembered-spot hit in 15 minutes is allowed.

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

| Way in (trained) | Hits | UNSEEN | LOST | SEEN | Damage a hit | Points a hit (row 728) | Points a minute |
|---|---|---|---|---|---|---|---|
| Moving between spots (`roam`) | 38 | 28 | 8 | 2 | 225 | 635 | 1,644 |
| The lure (`lure`) | 32 | 11 | 21 | 0 | 226 | 529 | 1,150 |
| The crawl (`peekmove`) | 30 | 9 | 17 | 4 | 152 | 370 | 749 |
| The sprint from past the field (`lurk`) | 9 | 9 | 0 | 0 | 53 | 158 | 95 |
| The gap | 7 | 3 | 0 | 4 | 65 | 129 | 60 |
| The flank from open pavement | 9 | 0 | 0 | 9 | 53 | 53 | 32 |

- **As predicted:** the sprint grades UNSEEN, 18 of 18 across both modes. Seen, then hidden (`peek`) grades LOST, 4 of 4.
- **The open-ground flank grades SEEN, 9 of 9.** It lands, but scores least.
- **Power now counts.** The sprint grades UNSEEN, but its 53-damage hits score 158 each. A full ambush from cover scores four times that.

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

**The side field in stages (row 730; trained, hits a minute, before → after):**

| Way in | Before | After |
|---|---|---|
| Moving between spots (`roam`) | 2.59 | 3.15 |
| The lure | 2.17 | 2.17 |
| The crawl (`peekmove`) | 2.02 | 1.69 (174 a hit) |
| Behind the barrier at its gap | 0.47 | 0.33 |
| The sprint; the open flank; the planter | 0.60; 0.60; 0.27 | 0.60; 0.60; 0.27 |
| Every cover spring (aim, jump, dashjump) | 0 | 0 |
| The scripted walk (`wander`) | 0 | 0.13 (44 a hit) |

- **First tries reopened the cover springs.** AWARE never noticing, or WARY noticing in 1.2 s, let the car come too near: aim, jump and dashjump landed 3–7 times in 15 minutes. AWARE at half speed and WARY at full closed them again.

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

**Row 733, edge to edge, the forget** (trained, 5 minutes × 3):

- **Closed again:** cover springs 0; kerb 0. Standplanter 3, rare.
- **Lurk:** UNSEEN, 24 of 24.
- **Open ways in, 6:** roaming 2.86 a minute, the lure 2.24, the crawl 1.21, flankOpen 1.07, lurk 0.8, the gap 0.6.
- **Cost:** the crawl's ten-minute escalation lands in 3 of 10 minutes (decay 0.33). The lure holds, 9 of 10.
- **Report:** 23 of 24. The crawl's escalation fails.

**Row 731, the cones** (trained, 5 minutes × 3; superseded by row 733):

- **Rare side strikes reopen**, on passing cars, mostly road B cars passing a dummy beside the junction:

| Trick | Hits in 15 minutes | A minute |
|---|---|---|
| aim | 2 | 0.13 |
| flank | 2 | 0.13 |
| jump | 2 | 0.13 |
| dashjump | 3 | 0.2 |
| standplanter | 3 | 0.2 |

- **Still closed:** stand, standSouth, standOff, charge, kerb, walkin, corner, plinth. Peek: 1.
- **Open ways in, 6:** roaming 2.59 a minute, the lure 2.31, the crawl 1.89, flankOpen 1.2, lurk 0.6, the gap 0.47.
- **Lurk** stays UNSEEN, 18 of 18. Its spot lies past the side cones' reach.
- **Escalation:** the crawl lands in 8 of 10 minutes (decay 0.43); the lure 0.8.
- **Report:** 24 of 24, with the coned thresholds above.

## Registry

- **Added (17):** `duel.searchRadius`, `duel.searchSeconds`; `perception.streetCameraFov` (row 723; default 360); `perception.streetCameraPanArc` (default 0), `perception.streetCameraPanSeconds`, `perception.streetCameraPanHold` (row 724); `scoring.stealthUnseen`, `scoring.stealthLost`, `scoring.stealthSeen` (row 725; multipliers from row 728; default 0); `ui.tip.holdSeconds` (row 729); `perception.sideCloseRange`, `perception.sideWaryRange`, `perception.sideAwareSpeed`, `perception.sideWarySpeed`, `perception.sideCloseSpeed`, `perception.sideAwareNoticeRate`, `perception.sideWaryNoticeRate` (row 730; defaults off).
- **Set by stage:** `duel.startRung` 6, `duel.topRung` 7, `duel.searchRadius` 60, `duel.searchSeconds` 4, `perception.streetCameraFov` 60, `perception.streetCameraPanArc` 60, `perception.streetCameraPanSeconds` 3, `perception.streetCameraPanHold` 1, `scoring.stealthUnseen` 3, `scoring.stealthLost` 2, `scoring.stealthSeen` 1, `ui.tip.holdSeconds` 7, `perception.sideCloseRange` 180, `perception.sideWaryRange` 360, `perception.sideAwareSpeed` 0.85, `perception.sideWarySpeed` 0.6, `perception.sideCloseSpeed` 0.35, `perception.sideAwareNoticeRate` 0.5, `perception.sideWaryNoticeRate` 1. 10.7's values otherwise.
- **Added (row 733):** `perception.trackSeconds` (default 0: tracked while inside the rectangle). 10.8 sets 3; the cones 30°, 75 ± 45, 240.
- **Added (7, rows 731–732):** `perception.forwardConeAngle` (default 0: the rectangle), `perception.sideConeAxis`, `perception.sideConeAngle`, `perception.sideConeRange`, `perception.forwardConeSensitivity`, `perception.sideConeSensitivity`; `ui.lungeGuide` (default 0).
- **Set by stage (rows 731–732):** `perception.forwardConeAngle` 20, `perception.sideConeAxis` 60, `perception.sideConeAngle` 45, `perception.sideConeRange` 220, `perception.forwardConeSensitivity` 1, `perception.sideConeSensitivity` 0.5, `ui.lungeGuide` 1.
- **688 entries.** `registryVersion` unchanged (row 665).

## Open

- **Human pass (H6):** does the player read the ghost, and crawl away? Do the cones read? Does the player time the sweep? Does the grade pull play toward UNSEEN? Does the player use the lure? Do the three field cones read, and does the player approach from the side? Does the lunge guide make the timing learnable?
- **After the playtest:** does the stop line stay free, or become a part the dummy earns (row 729)?
- **D128:** the cones' values. Duller sides reopen rare side strikes. Sides at 1 close them, and bring back the even field.
- **D129:** the lunge guide: always on near a car, a part, or only while aiming?
- **D127:** the side stages' values: ranges, speeds, notice rates. Does the player read AWARE before the car stops?
- **D124:** the pan's values: 60° in 3 s, 1 s rests, the barrier's ends mirrored.
- **D121:** the order from here. The road upgrade at 10.9, swerve cost at 10.10.
- **D122:** the search's values. 60 and 4 leave the crawl open along a row longer than 60.
- **D119:** eased. The roaming expert writes off a body every 55 s, within the target.
- **D120:** the memory's cap.
- **D115:** the sprint from past the field.
