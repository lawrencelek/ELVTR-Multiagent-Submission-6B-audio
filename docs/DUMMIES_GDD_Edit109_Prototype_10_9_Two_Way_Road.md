# DUMMIES — GDD Edit 109: Prototype 10.9, the two-way road

**6 November 2026 · Lawrence Lek** · The ninth escalating test (handover v2 §14.2, revised by row 717; D121). Localized: adds §10.9 to the Prototype 10 chapter. Builds road scenario B: the same junction as two two-lane, two-way roads, with white sedans that never learn.

- **Build:** `prototypes/p10/dummies_p10_9.html` (`python3 prototypes/p10/build.py`).
- **Playtest pages:** `index.html`. 10.1–10.8 frozen; 10.8 at md5 `e019098d…`.
- **Tests:** `node prototypes/p10/test_p10.js --page` 66/66. Sound freeze: 211 items, 0 changed.
- **Probes:** `node qa/testroad.js --stage 10.9 --out qa/baseline/p10_9.json`; report `qa/baseline/p10_9.md`, 12/16 checks (row 735). 10.8 reruns identical.
- **Decision log:** rows 734–738. Open D130.

**Amended 6 November (row 735):** the junction decides by time (§10.9.2); the red car's proportional field (§10.9.4).

**Amended 6 November (row 736):** the forward cone's edges run through the front corners (§10.9.4).

**Amended 7 November (row 737):** the field in steps of x; whole side wedges (§10.9.4).

**Amended 7 November (row 738):** one set of rings, all about the car's middle (§10.9.4).

## Request

> "We need two-way roads, and white sedans too. As planned." (Lawrence, 6 November)

## 10.9 The two-way road

### 10.9.1 The roads (`duel.twoWay` 1)

| Lane | Road | Direction | Where |
|---|---|---|---|
| 0 | A | Westbound | South lane, y 348 |
| 1 | A | Eastbound | North lane, y 292 |
| 2 | B | Northbound | West lane, x 372 |
| 3 | B | Southbound | East lane, x 428 |

- **Traffic on the left** (London).
- **Drawn:** a double centre line on each road; arrows each way; road B's give-way lines at the box.
- **The red car keeps its directions:** road A eastbound, road B southbound. Rung 7, every part fitted (`duel.startRung` 7, `duel.topRung` 7). No lesson: the road changes, not the car.

### 10.9.2 The junction

- **Row 735, by time.** No give-way line to crawl to. A car decides within `traffic.junctionLookahead` 400 of the box.
- **Road B gives way** while a road A car would reach the box within `traffic.junctionGap` 2.2 s, or stands at its edge.
- **Any car waits** for a crossing car in the box, or one too close to stop for it.
- **Giving way sticks:** a car that has begun to give way stops. One too close to stop gently goes on.
- **Measured:** 10 minutes, no overlapping cars; no car stands over 4 s. Row 734 (hold while road A within 420) stood road B cars 4–7 s at the line.

### 10.9.3 White sedans (`duel.whiteInterval` 3.5)

- **Enter:** about every 3.5 s (each 60–140% of it), on a lane chosen by the golden ratio. All four lanes.
- **Never learn.** They brake for what is in their path (the beam). They follow, and give way. No field, no cones, no swerve, no lessons.
- **Moving cover** (row 711): a white car on the sightline hides the dummy from the red car. The street cameras still see.
- **A hazard:** their hits damage the dummy and score nothing.
- **Queued behind the waiting red car,** they flash their lights (`proto.art.noticeFlashHz`; row 711).
- **The block lift** (row 715): FARSIGHT lifts the dummy for a white car it keeps waiting too. A car stopped by traffic does not count.

### 10.9.4 The red car's field (row 735)

- **Forward cone, row 736:** its edges run through the front corners, meeting behind the car.
- **One set of rings, row 738:** every ring is a circle about the car's middle. The side cones' 2x arc is the forward cone's second ring.
- **Side cones:** from the car's middle, 10°–110° (`perception.sideConeAxis` 60 ± `perception.sideConeAngle` 50). They meet the forward cone's edge.
- **One step, row 737:** x = `perception.coneRadius` / `perception.forwardGrades` = 340 / 3 = 113, from the car's middle.
  - Forward rings at x, 2x, 3x (53% of the screen's height).
  - Side rings at x, 2x (`perception.sideConeRatio` 2/3).
- **Side cones end in a whole wedge** at 95°: an arc and a radial edge, no crop behind the car.

| Cone | Angle | Reach | Grades (equal rings) |
|---|---|---|---|
| Forward | ±`perception.forwardConeAngle` 10°, through the front corners | 3x: 340 from the middle | `perception.forwardGrades` 3: AWARE, SLOWING, CRAWLING |
| Each side | 10°–95° (`perception.sideConeAxis` 52.5 ± `perception.sideConeAngle` 42.5), from the middle | 2x: 227 | `perception.sideGrades` 2: AWARE, SLOWING |

- **It learns:** the radius grows `perception.coneGrowthPerMemory` 4% per crash spot remembered, to `perception.coneGrowthMax` 20% (384, 60% of the screen).
- **Unchanged:** the beam (the lane ahead), stage speeds, the notice meter, the three-second forget.
- **10.8 keeps** its row 733 field (`perception.coneRadius` 0).

**Row 737, measured** (rung 7, 5 minutes × 3): 12 ways in (flankOpen 4.86, roaming 2.32, the lure 2.23, kerb 2.09 a minute); peek 7 hits in 15 minutes; 1 stall, 9 long waits. Report 13/16.

**Row 736, measured** (rung 7, 5 minutes × 3): 13 ways in (flankOpen 4.59, kerb 2.9, the lure 2.03 a minute); peek 9 hits in 15 minutes; 4 stalls, 9 long waits, 3 remembered-spot hits. Report 12/16.

**Row 735, measured:**

- **More open:** 12 ways in. flankOpen 4.59 a minute, kerb 2.74, the lure 2.31, roaming 1.9, the crawl 1.61.
- **Seen-then-hidden reopens:** peek 12 hits in 15 minutes. The smaller field notices later.
- **Fails:** 4 red-car stalls; 12 waits over 20 s; 2 hits from a remembered spot (D130).

## Measured, row 734 (`qa/baseline/p10_9.md` before row 735, rung 7, 5 minutes × 3)

- **White traffic:** 16.2 cars a minute. White hits on the dummy: 0.4 a minute, damage only.
- **No stalls.** Waits over 20 s for the dummy: 7 (D130).
- **Open ways in, 10:**

| Way in | A minute | At 10.8 |
|---|---|---|
| Roaming | 2.59 | 2.86 |
| Dash, jump out of it (dashjump) | 1.4 | 0 |
| The lure | 1.89 | 2.24 |
| The crawl (peekmove) | 1.21 | 1.21 |
| flankOpen | 0.87 | 1.07 |
| Kerb | 0.8 | 0 |
| Flank | 0.73 | 0 |
| Standplanter | 0.53 | 0.2 |
| The gap | 0.4 | 0.6 |
| Aim | 0.33 | 0 |

- **White traffic reopens rung 7's cover closures.** Moving cover hides the dummy; the red car, boxed in, cannot see past. These are measured, not passed or failed.
- **Still closed:** seen-then-hidden (peek 1 in 15 minutes); charge, walkin, corner, plinth.
- **Lurk:** 0. White traffic in road A's south lane meets the sprint first.

## Build

- `testroad.js`: two-way lanes, junction box and ranks in `junctionLevel`; `admitWhite`; white cars sense their path only, brake, never swerve; `whiteHides` in `occluded`; white hits score nothing in `account`; the red car alone among red cars; the block lift's trigger.
- `game_p10.js`: double line, arrows, give-way lines; white cars untagged, beam only, flashing when queued.
- `build.py`: 10.9's stage; 10.8 frozen.
- `qa/testroad.js`: bots play the red car; white hits and white cars counted apart. `qa/testroad_report.py`: a build without a lesson reads its lesson runs as trained; the two-way checks.

## Registry

- **Added (3):** `duel.twoWay` (default 0), `duel.whiteInterval` (default 0), `traffic.junctionLookahead` (default 0).
- **Set by stage:** `duel.startRung` 7, `duel.topRung` 7, `duel.twoWay` 1, `duel.whiteInterval` 3.5, `traffic.junctionLookahead` 420. 10.8's values otherwise.
- **Added (row 735):** `perception.coneRadius` (default 0: the row 733 field), `perception.sideConeRatio`, `perception.forwardGrades`, `perception.sideGrades`, `perception.coneGrowthPerMemory`, `perception.coneGrowthMax`, `traffic.junctionGap`. `traffic.junctionLookahead` now the decision distance (400).
- **698 entries.** `registryVersion` unchanged.

## Open

- **Human pass:** does the player use white cars as cover? Is the traffic a fair hazard?
- **D130:** traffic density and the junction. 3.5 s and 420 leave 7 long waits in 15 minutes per bot run.
- **10.10, swerve cost** (D121): a red swerve into a white sedan is an Incident.
