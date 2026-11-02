# DUMMIES — GDD Edit 103: Prototype 10.3, the side sensors

**2 November 2026 · Lawrence Lek** · The third of the nine escalating tests (handover v2 §14.2, §17). Localized: adds §10.3 to the Prototype 10 chapter; amends §10.1.1 (the plinth) and §10.2.4 (parts by rung).

- **Build:** `prototypes/p10/dummies_p10_3.html` (`python3 prototypes/p10/build.py`).
- **Playtest pages:** `index.html` lists one page per test, in order. 10.0 is Prototype 9 as built. 10.1 (md5 `82ab5e55…`) and 10.2 (md5 `9dd14c58…`) are frozen.
- **Tests:** `node prototypes/p10/test_p10.js --page` 24/24. Prototype 9 `test_p9.js --p84` 51/51; md5 `be163e7d014344e062965986b3da5786` on rebuild. 8.4 md5 `9f5549201d88891f9f0b22c461602909`. Sound freeze: 211 items, 0 changed.
- **Probes:** `node qa/testroad.js --stage 10.3 --out qa/baseline/p10_3.json`; report `qa/baseline/p10_3.md`, 12/12 checks.
- **Decision log:** rows 673–678; open D110–D112.

## Request

> "go, have you made slightly different prototypes for each 10.0, 10.1, 10.2, etc? this way when Sasha does the playtest she can check. Now proceed with 10.3" (Lawrence, 2 November, 12:26).

## Readings

| Reading | Basis | Status |
|---|---|---|
| 10.3 starts where 10.2 ends: rung 1, Battery 1 fitted | One change a test (row 653) | Proposed (row 673) |
| Every hit at rung 1 came from the side, so any hit but a tail bump teaches rung 2 | §9.1: one opening a level, so the car learns what you did | Proposed (row 673) |
| The side sensor is the driver's field, made the zone that acts | D103: draw the zone that acts | Proposed (row 674, D110) |
| It stops for a dummy at its side; a swerve away cannot close the flank | Probes: a swerve or a flinch left the flank at 2.8 hits a minute | Tested (row 675) |
| The sensors see the ground only, until rung 3 | v2 §12: rung 3 sees height | Proposed (row 676) |

## 10.3 The side sensors

### 10.3.1 The lesson

- **Start:** rung 1 (`duel.startRung` 1); Battery 1 fitted (`duel.dashArrives` 3).
- **Cause:** any damaging hit at rung 1 but a bump on the tail (`front`, `frontDiagonal`, `side`, `rearDiagonal`).
- **Beats:** as 10.2 (§10.2.1). The fitting shows "SENSOR FITTED · SIDE SENSORS": pods on both flanks; the field draws out sideways.
- **One lesson:** rung 1 to `duel.topRung` 2.

### 10.3.2 Rung 2: the side sensors

- **Sees:** the driver's field, `proto.driver.cautionZone` (180) either side of its path, `perception.forwardLength` (720) ahead. Rungs 0–1 have no field.
- **Weak edges:** it notices a dummy in the field after `perception.sideNoticeSeconds` (0.6). Ahead it reacts in `perception.reactionDelay` (0.3).
  - A meter fills over the car while it is noticing.
- **Response:** the safe envelope (§10.2.2), measured straight from its nose. It stops short, at 226, and waits while the dummy stays in its field.
  - A dummy coming at it: a hard stop at once.
  - It honks after `proto.honkSeconds`.
  - It no longer passes a dummy in its lane (`proto.driver.patienceSeconds` no longer applies).
- **It sees the ground only.** Unseen until rung 3:
  - a dummy in the air;
  - a dummy on the plinth;
  - a dummy behind a static (the building, the barrier), as before.

### 10.3.3 The jump and the raised edge

- **Legs 1, the jump,** arrives by drone at the car's first stop for a dummy beside its path (`duel.jumpArrives` 2).
- **Keys:** K or Shift. Touch: the right half's upper part. Pad: button 1.
- **Jump rules:** Prototype 6.5's (Edit 75). A running jump passes over a car while above its roof (`vehicles.sedan.height`). Below the roof, it strikes as a dash does.
- **The plinth** (amends §10.1.1) is a raised edge, `world.jumpableHeight` (20).
  - A jump that tops it lands on it. Walking off its edge steps down.
  - Legs 1's airtime (`abilities.legs.airtimeBase`, 0.3) is short. A running jump covers 49, so climbing it takes a dash-jump.

### 10.3.4 Parts by rung (amends §10.2.4)

- **Each rung brings a part:** rung 1 Battery 1 (`duel.dashArrives`); rung 2 Legs 1 (`duel.jumpArrives`).
- **Values:**
  - 0: never.
  - 1: as the lesson ends.
  - 2: at the first use of the rung against the dummy.
  - 3: fitted from the start.

## Build

- `testroad.js`: the rungs table with parts; the field and its notice; the side stop and wait; the plinth; jump collisions on the base sim.
- `game_p10.js`: the jump key; the field drawn by rung; the notice meter; side pods; a raised or airborne dummy drawn off its shadow; the Legs 1 drone; the side-sensor fitting.
- `build.py`: 10.3's stage; 10.2's page frozen; `prototypes/jump/jump.js` loaded from 10.3.
- **Shared files untouched.**

## Measured (`qa/baseline/p10_3.md`)

**Rung 2 alone** (mode `trained`: rung 2 from the start, Battery 1 and Legs 1 fitted; 3 offsets × 300 s):

| Way in | Hits a minute | Damage a hit | Verdict |
|---|---|---|---|
| Waits at the open kerb, dashes | 0 | — | Closed |
| The flank from open pavement | 0 | — | Closed |
| Steps in late from the kerb | 0 | — | Closed (rung 1's opening) |
| Behind the building's corner | 0 | — | Closed |
| Stands in the lane; sprints at it | 0 | — | Closed |
| Behind the barrier, dashes through its gap | 2.07 | 52 | Open: cover, no Legs (pillar 1, D97) |
| Dashes down from the plinth | 2.68 | 53 | Open: the raised edge, with Legs 1 |
| Runs and jumps from behind the barrier | 2.70 | 124 | Open: cover and the jump |

**The lesson** (mode `lesson`, 10 minutes):

- Any hit at rung 1 taught rung 2: 33 of 33 runs.
- **Kerb, open flank, late step-in, corner:** one hit at rung 1, then none. Decay 0.
- **The barrier's gap:** 1–3 hits every minute. Decay 0.8.
- **The plinth:** 0 until Legs 1 arrives, then 1–4 a minute.
- **Legs 1** arrives 1.0–3.3 s after the first side stop.

**The cost:** a dummy in the open beside the road holds the car. Bots that stay there see 0.2–0.5 cars a minute (D110).

## Registry

- **Added (proposed):** `duel.jumpArrives`, `perception.sideNoticeSeconds`.
- **Amended:** `duel.dashArrives` gains 3, fitted from the start.
- **Registered at `sim.js` values:** `proto.damageModel`.
- **Entries:** 647. `registryVersion` unchanged (row 665).

## Open

- **Human pass (H3):** Sasha plus one new player, recorded.
  - Do they notice the meter and the wait, and say why it stops?
  - Do they find cover or the plinth unprompted?
  - Do they use the jump within the level?
- **D110:** it waits for any dummy in its field. Keep, add a give-up, or narrow the field.
- **D111:** cover is open at rung 2, a second opening beside the plinth.
- **D112:** the plinth needs a dash-jump to climb.
- **D105:** a dummy at a stopped car's bumper still holds it. The 10.3 page check met it: a knocked dummy left idle at the bumper held the car, so the lesson waited.
- **10.4 next:** rung 3, see height. It closes the plinth and the jump.
