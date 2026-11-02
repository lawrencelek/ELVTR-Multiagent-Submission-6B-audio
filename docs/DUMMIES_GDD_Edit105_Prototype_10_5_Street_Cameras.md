# DUMMIES — GDD Edit 105: Prototype 10.5, the street cameras

**2 November 2026 · Lawrence Lek** · The fifth of the nine escalating tests (handover v2 §14.2, §19). Localized: adds §10.5 to the Prototype 10 chapter; amends §10.4.1 (what teaches rung 3) and §10.3.2 (the side hold).

- **Build:** `prototypes/p10/dummies_p10_5.html` (`python3 prototypes/p10/build.py`).
- **Playtest pages:** `index.html`, one per test. 10.1–10.4 are frozen. 10.4 (md5 `b12b48d8…`) was rebuilt with row 685 first.
- **Tests:** `node prototypes/p10/test_p10.js --page` 35/35. Prototype 9 `test_p9.js --p84` 51/51; md5 `be163e7d014344e062965986b3da5786` on rebuild. 8.4 md5 `9f5549201d88891f9f0b22c461602909`. Sound freeze: 211 items, 0 changed.
- **Probes:** `node qa/testroad.js --stage 10.5 --out qa/baseline/p10_5.json`; report `qa/baseline/p10_5.md`, 13/13 checks.
- **Decision log:** rows 685–693. D113 resolved. Open D114, D115.

## Request

> "only count hits where height was what hid you. now go for 10.5" (Lawrence, 2 November)

## Readings

| Reading | Basis | Status |
|---|---|---|
| Height hid the dummy if the hit came from above and the car had it in sight past cover for the whole clip | The clip is what the car learns from (§10.2.1) | Decided (row 685) |
| 10.5 starts where 10.4 ends: rung 3, the dash and the jump fitted | One change a test (row 653) | Proposed (row 687) |
| Rung 4 sees behind cover through the junction's street cameras, not by slowing | Slowing cannot close cover (row 690) | Proposed (D114) |
| Hands 1, the cones, arrive at the first stop for a dummy behind cover | Handover v2 §14.2: Hands 1 at 10.5; the tool where the problem is | Proposed (row 687) |

## 10.4.1 What teaches rung 3 (amends Edit 104)

- **A hit where height hid the dummy** (row 685). Both must hold:
  - **From above:** a jump's strike, or a dash launched from the plinth.
  - **In sight:** the car had the dummy in sight past cover for the whole training clip (`duel.lessonClipSeconds` 3).
- **The plinth is height.** The building and the barrier are cover.
- **A clip that shows the dummy coming out of cover teaches nothing.** That includes a jump's strike.
- **Measured:** jumps from behind the barrier were in sight 0.48–2.7 s before each hit. No lesson in 3 runs (41 hits). The plinth: 4.6–6.8 s; lessons in 3 of 3.
- **Tried first:** `perception.sideNoticeSeconds` (0.6) as the bar. Half the jumps from cover (0.75 s) still taught.

## 10.5 The street cameras

### 10.5.1 The lesson

- **Start:** rung 3 (`duel.startRung` 3). Battery 1 and Legs 1 fitted (`duel.dashArrives` 3, `duel.jumpArrives` 3).
- **Cause: a hit where cover hid the dummy.** It came out of cover within the training clip.
  - The gap, the jump from behind the barrier, the aimed dash and the flank from behind it all teach.
  - A hit from the open teaches nothing.
- **Beats:** as 10.2. The fitting reads "LINK FITTED · STREET CAMERAS".
  - A drone fits an aerial to the car. Three camera posts link to it.
- **One lesson:** rung 3 to `duel.topRung` 4.

### 10.5.2 Rung 4: it sees behind cover

- **The junction's street cameras see behind the barrier and the building.** The car sees what they see.
- **It answers a dummy behind cover as one in the open:** the safe envelope, a stop short, a wait (§10.3.2).
- **On screen:** camera posts at the barrier's two ends and the building's corner.
  - A dashed link runs from the nearest camera to the dummy, and on to the car.
- **Real basis:** Shenzhen is one of 20 pilot cities for vehicle-road-cloud integration. Roadside sensors share what they see with cars.

### 10.5.3 Hands 1 arrives

- **When:** the first time the car stops for a dummy only its cameras see (`duel.conesArrives` 2).
- **E picks up a cone; E again puts it down, ahead of the dummy.** Pad X. Touch: the right half's middle third.
- **A cone left in a lane fetches a FARSIGHT drone** after `proto.droneConeSeconds` 5, as in Prototype 9.

### 10.5.4 The opening: a cone forces a swerve

- **A car swerving round a cone holds its line until it has passed it** (row 689).
  - Meanwhile it does not stop for a dummy in its field. This holds from rung 2.
- **The trick:** lay a cone in the lane of the car waiting for you. Step out of its field. It moves off and swerves round the cone. Strike.
- **Rung 5 closes it** (§14.2: it stops at a cone and never swerves).

### 10.5.5 Found on the way

- **A waiting car stays stopped when the dummy steps from its field into its path** (row 688). Before, it lurched forward for `perception.reactionDelay`.
- **The sprint from past the field lands at rungs 2–4** (row 691).
  - The field reaches 202 from the lane. A sprint during the notice plus a dash reaches about 274.
  - 0.8 hits a minute at 52, at 10.3, 10.4 and 10.5 alike. Earlier bots all waited inside the field.
  - Rerun on today's code: `node qa/testroad.js --stage 10.3 --only lurk` (or 10.4).
  - Each hit lands on a leg. The dash shortens with leg damage (164 to 116 after four hits); then it no longer reaches.
- **A car waiting off screen gets a marker at the screen's edge,** with HONK or WAITING.

## Why not "slow past what it cannot see" (row 683)

- **A dash out of the barrier's gap covers road A's near lane in under 0.1 s.**
  - `movement.lungeFastDistanceFraction` 0.7 of `movement.lungeDistance` 164, in `movement.lungeFastTimeFraction` 0.333 of `movement.lungeDuration` 0.3.
- **The car reacts after `perception.reactionDelay` 0.3.**
- **Only a car already below `duel.standstillSpeed` (5) is safe.** Crossing the gap's reach (about 400) at that speed takes over a minute.
- **So rung 4 sees behind cover instead** (row 690; D114).

## Build

- `testroad.js`:
  - Rung 4 in the rungs table (cover: true; fit 'LINK'). `trackSight` keeps when cover last hid the dummy; `coverHid`; `heightHid` (row 685).
  - `occluded`: statics no longer hide the dummy from a rung-4 car.
  - `commit`: the first stop for a dummy behind cover calls Hands 1. `watchField`: the cone's swerve holds; a step into the path keeps the hold.
  - The level lists the cameras (drawn).
- `game_p10.js`: the cameras and their link; the aerial; the link's fitting beat; cones carried, laid and fetched; E, pad X, touch; the edge marker.
- `build.py`: 10.5's stage; 10.4's page frozen.
- `qa/testroad.js`: bots `conebait` and `lurk`; routing round the statics; `--only`, `--set`, `--trace`.

## Measured (`qa/baseline/p10_5.md`)

**Rung 4 alone** (mode `trained`; 3 offsets × 300 s):

| Way in | Hits a minute | Damage a hit | Verdict |
|---|---|---|---|
| Through the barrier's gap | 0 | — | Closed |
| The aimed dash from behind the barrier | 0 | — | Closed |
| The jump, the dash-jump, the flank from behind the barrier | 0.07 each | 0–53 | Closed: one hit each in 15 minutes, the sprint from past the field at the run's start |
| The plinth, the kerb, the corner, the lane, standing, charging, the late step-in | 0 | — | Closed |
| The cone bait (Hands 1) | 2.00 | 31 | Open: half the car swerving into the dummy, half its dash |
| The sprint from past the field (no part) | 0.80 | 52 | Open (D115) |

**The lesson** (mode `lesson`, 5 and 10 minutes):

- **Lessons:** in 18 of 18 runs with a hit out of cover; in 0 of 5 runs with only hits from the open.
- **Hands 1:** 2.3–2.4 s after the first stop behind cover, in 16 runs.
- **Escalation (10 minutes):** the gap and the jump decay to 0. The cone bait holds at 0.75. The sprint from past the field stops after four hits: the dummy's own leg damage.

## Registry

- **Added:** `duel.conesArrives` (0 never; 1 the lesson's end; 2 the first stop behind cover; 3 fitted). 10.5 sets 2.
- **Described anew:** `duel.lessonClipSeconds` is also the clip's bar (rows 685, 687).
- **648 entries.** `registryVersion` unchanged (row 665).

## Open

- **Human pass (H4):** does the player read the camera link, and find the cone without being told?
- **D114:** rung 4 is the street cameras; row 683 proposed slowing past blind spots.
- **D115:** the sprint from past the field lands at rungs 2–4. Keep it as the opening without a part, widen the field, or notice a running dummy at once.
- **D110:** standing anywhere near the road now holds the car, behind cover too.
- **Next, 10.6:** rung 5 reads road items. It stops at a cone and never swerves.
