# DUMMIES — GDD Edit 106: Prototype 10.6, DUCK

**3 November 2026 · Lawrence Lek** · The sixth of the nine escalating tests (handover v2 §14.2, §20–§21). Localized: adds §10.6 to the Prototype 10 chapter; amends §10.5.2 (what the cameras watch).

- **Build:** `prototypes/p10/dummies_p10_6.html` (`python3 prototypes/p10/build.py`).
- **Playtest pages:** `index.html`, one per test. 10.1–10.5 are frozen; 10.5 at md5 `25278535…`.
- **Tests:** `node prototypes/p10/test_p10.js --page` 41/41. Prototype 9 `test_p9.js --p84` 51/51; md5 `be163e7d014344e062965986b3da5786` on rebuild. 8.4 md5 `9f5549201d88891f9f0b22c461602909`. Sound freeze: 211 items, 0 changed.
- **Probes:** `node qa/testroad.js --stage 10.6 --out qa/baseline/p10_6.json`; report `qa/baseline/p10_6.md`, 14/14 checks. 10.3, 10.4 and 10.5 rerun on today's code: 12/12, 12/12, 13/13.
- **Decision log:** rows 695–700. D116 built. Open D117, D118.

## Request

> "yes" (Lawrence, 3 November), to: build 10.6 with DUCK (row 694; D116).

## Readings

| Reading | Basis | Status |
|---|---|---|
| 10.6 starts where 10.5 ends: rung 4; the dash, the jump and the cones fitted | One change a test (row 653) | Proposed (row 695) |
| Rung 5 reads road items: it stops at a cone and never swerves | Handover v2 §14.2 | Proposed (row 695) |
| DUCK is the part rung 5's first stop at a cone brings | Row 694: DUCK becomes an ability | Proposed (row 695) |
| Low cover hides by height; cameras watch the cover near them | D116; real sensor geometry | Proposed (rows 696–697) |

## 10.5.2 What the cameras watch (amends Edit 105)

- **Each camera sees within `perception.streetCameraRange` of its post.** 10.6 sets 180: the barrier and the building's corner. 10.5 keeps 0, the whole screen.
- **Past tall statics, as before.** Over low cover, by height (§10.6.4).

## 10.6 DUCK

### 10.6.1 The lesson

- **Start:** rung 4 (`duel.startRung` 4). Battery 1, Legs 1 and Hands 1 fitted (`duel.dashArrives`, `duel.jumpArrives`, `duel.conesArrives` 3).
- **Cause: a hit while it swerved round a cone,** within the training clip (`duel.lessonClipSeconds`). Other hits teach nothing.
- **Beats:** as 10.2. The fitting reads "UPDATE FITTED · ROAD ITEMS": a cone ahead, a stop line short of it.
- **One lesson:** rung 4 to `duel.topRung` 5.

### 10.6.2 Rung 5: it reads road items

- **It stops short of a cone in its lane.** It never swerves round one.
- **It waits.** A FARSIGHT drone fetches the cone (`proto.droneConeSeconds`); then it drives on.
- **A stopped car takes no hits** (row 668). The cone bait closes.
- **Real basis:** robotaxis stopped by a cone on the bonnet (San Francisco, 2023; handover v2 §4.4).

### 10.6.3 DUCK arrives

- **When:** its first stop at a cone (`duel.duckArrives` 2).
- **Hold C** (or Ctrl) to duck. Pad: LB or RB. Touch: the right half's duck band, between cone and dash.
- **Lower:** `body.duckHeight` 6, against `proto.art.dummyHeight` 18 standing.
- **Slower:** `movement.duckSpeedFactor` 0.35 of ground speed.
- **Noticed slower:** the field takes `perception.duckNoticeFactor` (1.5) × `perception.sideNoticeSeconds`.
- **A dash or a jump stands it up** as it goes.
- **On screen:** ducked, the dummy shrinks and wears a ring. Unseen by every sensor, it dims and reads HIDDEN; seen, SEEN.

### 10.6.4 Low cover: the planter rows

- **Three rows** (`duel.planters` 1), five planters a row (`world.gardenPlanter` 40 each):
  - North of road A, west.
  - South of road A, east.
  - East of road B, south.
- **Height:** `props.planter.height` 14. A standing dummy shows over it; a ducked one does not.
- **Sightlines run by height.** A sightline is blocked where it crosses low cover at or below the cover's height.
  - The car's sensors: `perception.sensorHeight` 14 at rungs 1–2; `perception.lidarHeight` 26 from rung 3.
  - The street cameras: `perception.streetCameraHeight` 60.
- **Each row runs back up the road its cars come from.** The field sees `perception.forwardLength` up the road; a short planter hid a ducked dummy only from a car abreast of it.
- **A dash vaults a planter.** A walk stops at one.

### 10.6.5 The opening

- **Duck behind a row; spring over it as the car passes.** The car never had you.
- **Standing at the same spot, it sees you and stops.**
- **Next (§14.2, rung 6):** it counters your habit.

## Build

- `testroad.js`:
  - Rung 5 in the rungs table (items: true; fit 'UPDATE'; part `duck1`, trigger `first-item`).
  - `choose`: a cone at rung 5 is a stop short. `watchField`: the cone's swerve holds only at rungs 2–4; a ducked dummy is noticed slower.
  - `occluded` → `carSees` (tall statics; low cover by height) and `cameraSees` (range; low cover by height). `lowBlocked`, `eyeHeight`, `bodyHeight`.
  - `itemHit` for the lesson; DUCK in `step` (`duckFor`, `stand`, `underfoot`); a dash vaults low cover (`collideBody`).
  - The level's planter rows, by `duel.planters`.
- `game_p10.js`: DUCK input; planters; the ducked dummy, HIDDEN and SEEN; each camera's reach; the update's fitting beat; the body bar moves left of the key hints.
- `build.py`: 10.6's stage; 10.5's page frozen.
- `qa/testroad.js`: bots `planter` and `standplanter`; stand bots route round statics; a wait for a cone ahead is a wait, not a stall.

## Measured (`qa/baseline/p10_6.md`)

**Rung 5 alone** (mode `trained`; 3 offsets × 300 s):

| Way in | Hits a minute | Damage a hit | Verdict |
|---|---|---|---|
| The cone bait | 0 | — | Closed: 318 stops at a cone, 0 swerves |
| The gap, the plinth, the kerb, the corner, the lane, standing, charging, the late step-in | 0 | — | Closed |
| The aimed dash, the flank, the dash-jump from behind the barrier | 0.07 each | 51–53 | Closed: one hit each in 15 minutes, the sprint from past the field at the run's start |
| Standing behind the planter | 0 | — | Closed: it sees over the row |
| DUCK behind the planter, springing over it | 3.03 | 114 | Open: 0.40 write-offs a minute (D117) |
| The sprint from past the field (no part) | 0.80 | 52 | Open (D115) |

**The lesson** (mode `lesson`):

- **Lessons:** in 6 of 6 runs with a hit round a cone; in 0 of 7 runs with only other hits.
- **DUCK:** 1.4–2.5 s after the first stop at a cone.
- **Escalation (10 minutes):** the cone bait decays to 0. The planter ambush holds at 1.0. The sprint from past the field stops after four hits: the dummy's own leg damage.

## Registry

- **Added (10):** `duel.duckArrives`, `duel.planters`, `props.planter.height`, `body.duckHeight`, `movement.duckSpeedFactor`, `perception.duckNoticeFactor`, `perception.sensorHeight`, `perception.lidarHeight`, `perception.streetCameraHeight`, `perception.streetCameraRange`.
- **Registered at its `sim.js` value:** `proto.art.dummyHeight` 18.
- **659 entries.** `registryVersion` unchanged (row 665).

## Open

- **Human pass (H5):** does the player read HIDDEN and SEEN, and find the spring over the row?
- **D117:** the planter ambush hits hard: 3.0 a minute at 114.
- **D118:** camera range narrows rung 4 to the cover it watches.
- **D115:** the sprint from past the field still lands.
- **Next, 10.7:** rung 6 counters your habit (§14.2).
