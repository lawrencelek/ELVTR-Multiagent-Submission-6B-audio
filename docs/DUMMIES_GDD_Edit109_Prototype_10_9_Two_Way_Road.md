# DUMMIES — GDD Edit 109: Prototype 10.9, the two-way road

**6 November 2026 · Lawrence Lek** · The ninth escalating test (handover v2 §14.2, revised by row 717; D121). Localized: adds §10.9 to the Prototype 10 chapter. Builds road scenario B: the same junction as two two-lane, two-way roads, with white sedans that never learn.

- **Build:** `prototypes/p10/dummies_p10_9.html` (`python3 prototypes/p10/build.py`).
- **Playtest pages:** `index.html`. 10.1–10.8 frozen; 10.8 at md5 `e019098d…`.
- **Tests:** `node prototypes/p10/test_p10.js --page` 65/65. Sound freeze: 211 items, 0 changed.
- **Probes:** `node qa/testroad.js --stage 10.9 --out qa/baseline/p10_9.json`; report `qa/baseline/p10_9.md`, 15/16 checks. 10.8 reruns identical.
- **Decision log:** row 734. Open D130.

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

- **Road B gives way to road A.** A road B car holds at its line while a road A car is in the box or within `traffic.junctionLookahead` 420 of it.
- **Road A drives on.**

### 10.9.3 White sedans (`duel.whiteInterval` 3.5)

- **Enter:** about every 3.5 s (each 60–140% of it), on a lane chosen by the golden ratio. All four lanes.
- **Never learn.** They brake for what is in their path (the beam). They follow, and give way. No field, no cones, no swerve, no lessons.
- **Moving cover** (row 711): a white car on the sightline hides the dummy from the red car. The street cameras still see.
- **A hazard:** their hits damage the dummy and score nothing.
- **Queued behind the waiting red car,** they flash their lights (`proto.art.noticeFlashHz`; row 711).
- **The block lift** (row 715): FARSIGHT lifts the dummy for a white car it keeps waiting too. A car stopped by traffic does not count.

## Measured (`qa/baseline/p10_9.md`, rung 7, 5 minutes × 3)

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
- **691 entries.** `registryVersion` unchanged.

## Open

- **Human pass:** does the player use white cars as cover? Is the traffic a fair hazard?
- **D130:** traffic density and the junction. 3.5 s and 420 leave 7 long waits in 15 minutes per bot run.
- **10.10, swerve cost** (D121): a red swerve into a white sedan is an Incident.
