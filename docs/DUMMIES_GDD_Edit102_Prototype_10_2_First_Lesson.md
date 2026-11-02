# DUMMIES — GDD Edit 102: Prototype 10.2, the first lesson

**2 November 2026 · Lawrence Lek** · The second of the nine escalating tests (handover v2 §14.2, §16). Localized: adds §10.2 to the Prototype 10 chapter; amends §10.1.1 (run-in) and §10.1.2 (return timing).

- **Build:** `prototypes/p10/dummies_p10_2.html` (`python3 prototypes/p10/build.py`). First card on `index.html`.
- **10.1's page is frozen:** `dummies_p10.html`, md5 `82ab5e55d243ee500d6dfcaa60af74e6`. Its values stay in `sim_flags.json` (stage 10.1).
- **Tests:** `node prototypes/p10/test_p10.js --page` 16/16. Prototype 9 `test_p9.js --p84` 51/51; md5 `be163e7d014344e062965986b3da5786` on rebuild. 8.4 md5 `9f5549201d88891f9f0b22c461602909`. Sound freeze: 211 items, 0 changed.
- **Probes:** `node qa/testroad.js --stage 10.2 --out qa/baseline/p10_2.json`; report `qa/baseline/p10_2.md`, 12/12 checks.
- **Decision log:** rows 667–672; open D106–D109; D105 partly resolved.

## Request

> "go" (Lawrence, 2 November, 11:13), on 10.2 as proposed: rung 1, the car brakes for what is ahead, shown as a lesson, with the dash arriving.

## Readings

| Reading | Basis | Status |
|---|---|---|
| "Closes the front" means standing and charging score 0 | v1 §7 acceptance: "its closed approach scores 0" | Proposed (rows 668–669) |
| A stopped car is a wall: no damage, no lesson | A dash into a stopped car still did 52 damage; the flank does 53. Without the rule the front stays open | Proposed (row 668, D106) |
| Rung 1 senses only ahead: no driver's field | 10.0-v3: the field only slowed the car, which helped the dummy. Rung 2 brings the side | Proposed (row 669) |
| The dash arrives at the first brake, not with the lesson | World 1-1: the tool where the problem is (handover v2 §9.5) | Proposed (D108) |

## 10.2 The first lesson

### 10.2.1 The four beats (handover v2 §9.1)

1. **Cause.** A damaging hit on the red car's nose (`front` or `frontDiagonal`) at rung 0.
   - A bump on its side teaches nothing.
   - The lesson waits until the car has left the screen.
2. **The clip.** The sim pauses. The hit replays as the car's training clip.
   - The last `duel.lessonClipSeconds` (3) before the hit, camera-tinted.
   - The impact frame holds `duel.lessonHoldSeconds` (0.8), boxed as the car's vision would mark it.
3. **The update.** A drone fits the sensor on the car's nose; the beam draws out (`duel.lessonFitSeconds`, 2).
   - Labels name the car and the part only: "TRAINING CLIP · SEDAN-01", "SENSOR FITTED · FORWARD CAMERA". No goal text.
4. **The return.** The same tag, SEDAN-01, drives back in at rung 1. The HUD reads its rung.

- **One lesson per build:** `duel.startRung` 0 to `duel.topRung` 1.

### 10.2.2 Rung 1: the forward camera

- **Sees:** its lane ahead, `perception.forwardLength` (720). No driver's field: `proto.driver.cautionZone` 0.
- **The safe envelope** (Mobileye RSS; handover v2 §4.2). The gap a dummy needs to dash into the nose if it ran at the car:
  - It runs at `movement.runSpeed` while the car reacts (`perception.reactionDelay`).
  - It keeps running while the car stops at `traffic.hardBraking`.
  - Then it dashes: `movement.lungeDistance` + `body.radius`.
  - At cruise: 670. At a standstill: 226, the stop line.
- **A still dummy ahead:** the car slows from first sight, never faster than the envelope allows. It stops 226 short.
- **A dummy coming at it:** a hard stop at once.
- **Then the base driver:** it honks after `proto.honkSeconds` and passes after `proto.driver.patienceSeconds`.
- **Beam length:** 720 covers the envelope at cruise (670). Prototype 9's 560 left a sprint charge open.

### 10.2.3 Standstill

- A car slower than `duel.standstillSpeed` (5) is at a standstill.
- A dash or a walk into it does no damage and teaches nothing. It is a touch.
- The threshold matches a hit's existing stopped flag in `sim.js`.

### 10.2.4 The dash arrives

- **When:** the car's first brake for the dummy (`duel.dashArrives` 2).
- **How:** a FARSIGHT drone flies in from the top edge (`proto.droneSpeed`). It lowers Battery 1 over `proto.droneLiftSeconds`. Play goes on.
- **Damage carries over,** as Story's gift does: 400 of 500 becomes 700 of 800.

### 10.2.5 Changes to the test road (amends §10.1)

- **Run-in:** each lane starts at least a beam plus a car length before the screen's edge. That is 771 at 10.2, and `world.spawnLeadIn` (200) at 10.1.
  - A car sees a dummy at the edge before it could need to stop for it.
- **Return:** the red car reappears `duel.redReturnSeconds` (4) after it leaves the screen, or when its drive-in allows. At 10.2 that is 5.2 s.
  - This matches the registry's text. 10.1's frozen page keeps its old timing: 4 s after the car leaves the road.
- **The kerbs bound every swerve and pass.** The base driver's hard shoulder (`proto.swerveOuter`) lay on the pavement here.

## Build

- `testroad.js`: the rungs table, the lesson state (`lesson-due`, phase `lesson`, `continueLesson`), the envelope, the standstill rule and the drone.
- `game_p10.js`: the training clip (a ring of the last seconds), the fitting, the drone, the camera pod, honks, the rung on the HUD.
- `build.py`: one page per test from `sim_flags.json` stages. A frozen page is checked, never rewritten.
- **Shared files untouched:** `prototypes/p6`, `p7`, `p8`.

## Measured (`qa/baseline/p10_2.md`)

**Rung 1 alone** (mode `trained`: rung 1 from the start, Battery 1 fitted; 3 offsets × 300 s):

| Bot | Hits a minute | Damage a hit | Notes |
|---|---|---|---|
| Stands on a lane line, or 8 off it | 0 | — | Stops 226 short; honks; passes |
| Sprints at it down its lane, dashes in reach | 0 | — | 19 charges, 19 standstill touches |
| Steps in late from the kerb, on foot | 1.94 | 88 | The opening on foot (pillar 1, D97). 10.1: 3.7 at 129 |
| Dashes into its side | 2.81 | 53 | The flank |
| Dashes at the nearest car from the pavement | 1.60 | 52 | Side and rear corners |

**The lesson** (mode `lesson`: the build as delivered):

- **Nose hits teach rung 1** in 18 of 18 runs. Side bumps never do.
- **Standing:** one hit at rung 0, then none. Decay 0 over 10 minutes.
- **Charging:** one hit at rung 0, then none. Decay 0.
- **Stepping in late:** 1–2 hits every minute for 10 minutes. Decay 0.75: the opening holds.
- **The dash** arrives 1.8–2.6 s after the first brake.
- **No stalls.** One car on the road at a time.

## Registry

- **Added (proposed):** `duel.startRung`, `duel.topRung`, `duel.standstillSpeed`, `duel.dashArrives`, `duel.lessonClipSeconds`, `duel.lessonHoldSeconds`, `duel.lessonFitSeconds`.
- **Registered at `sim.js` values:** `proto.droneSpeed`, `proto.droneLiftSeconds`, `world.width`, `world.height`, `simulation.tickRate`.
- **Entries:** 644. `registryVersion` unchanged (row 665).

## Open

- **Human pass (H3, §10):** Sasha plus one new player, recorded.
  - Can they say why it brakes within 2 minutes?
  - Do they find the late step-in or the flank unprompted?
  - Do they use the dash within the level?
- **D105, the remainder:** a dummy at a stopped car's bumper holds it until it steps away.
- **D106–D109:** the standstill rule; the envelope and the beam; when the dash arrives; the return versus the drive-in.
- **10.3 next:** rung 2, the side sensor wired and drawn true. It closes the flank; the jump arrives.
