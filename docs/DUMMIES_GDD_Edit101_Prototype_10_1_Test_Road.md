# DUMMIES — GDD Edit 101: Prototype 10.1, the test road

**2 November 2026 · Lawrence Lek** · The first of the nine escalating tests (handover v2 §14). Localized: adds §10.1 to the Prototype 10 chapter; changes no earlier section.

- **Build:** `prototypes/p10/dummies_p10.html` (`python3 prototypes/p10/build.py`). Live from `index.html`.
- **Tests:** `node prototypes/p10/test_p10.js --page` 9/9. Prototype 9: `test_p9.js --p84` 51/51; md5 `be163e7d014344e062965986b3da5786` on rebuild. 8.4: md5 `9f5549201d88891f9f0b22c461602909`. Sound freeze: 211 items, 0 changed.
- **Probes:** `node qa/testroad.js --out qa/baseline/p10_1.json`; report `qa/baseline/p10_1.md`.
- **Decision log:** rows 663–666; open D105.

## Request

> "Go" (Lawrence, 2 November, 08:55), on handover v2 §14: build 10.1, the Monument test road.

## Readings

| Reading | Basis | Status |
|---|---|---|
| "Two one-way roads pass" = two one-way roads crossing at a junction | v2 §14.1, shown before "Go" | Proposed; Lawrence's go |
| Rung 0 senses nothing: no forward beam, no driver's field | v1 PT4 table, L1: "Senses: nothing" (row 650, Sasha: "In level one, you can just walk into it") | Proposed (row 664) |
| Greybox, no new art | Nintendo check (row 655): mechanic before art | Proposed |

## 10.1 The test road

### 10.1.1 Scenario A: the Monument junction

- **One screen,** 800 × 640 (`ui.playWidth` × `ui.playHeight`). The screen's edge holds the dummy.
- **Road A** runs west to east; **road B** runs north to south. Each is one-way, two lanes of `world.laneWidth`.
- **Ways onto the road:**
  - Open kerbs on every side.
  - A zebra on road A, east of the junction (drawn; no rule yet).
  - A barrier along road A's south kerb, with a gap to step through.
- **The junction:** a building on the north-east corner hides each road's approach from the other.
- **A raised edge:** the monument's plinth, north-west, at `world.jumpableHeight`. Unused until the jump (10.3).
- **Items in the road:** three cones on the pavement. Unused until 10.5.

### 10.1.2 The red car, rung 0

- **One car type:** every appearance is a sedan (`vehicles.sedan.*`). The roof dome marks it as the learning car (D89).
- **Alone on the road:** at most `duel.carsOnRoad` (1). It returns `duel.redReturnSeconds` (4) after it leaves.
- **Its lane** rotates over the four, so both roads recur.
- **It senses nothing:** `perception.forwardLength` 0, `proto.driver.cautionZone` 0. It drives its route.
- **It learns nothing:** `proto.learningEnabled` 0, `proto.learn.standoffEnabled` 0.
- **One-way lanes:** a car in a road's second lane may pass by the first (reach `world.laneWidth`). The base driver could only reach the shoulder there (row 666).

### 10.1.3 The dummy

- **On foot:** no Battery 1, so no dash (`damage.bodyHealthOnFoot`).
- **No score, no quota:** `run.quota.road` 1000000; `run.appearances.road` 1000.
- **The page draws the zones that act** (D103): forward beam and driver's field. At rung 0 both are empty.
- **Keys:** arrows or WASD; Z zones; P pause; R restart; L saves the session's log. Touch: drag left half, tap right half.

## Build

- `prototypes/p10/testroad.js`: the junction and `TestRoadSim`, extending the base `Sim`. Runs in the page and in node.
- `prototypes/p10/game_p10.js`, `shell.html`: the greybox page.
- `prototypes/p10/build.py`: values in order: `WORLD6.P6SIM`, `STORY.P7SIM`, Prototype 9's build flags, then 10.1's. Writes `sim_flags.json` for the probes.
- **Shared files untouched:** `prototypes/p6`, `p7`, `p8` unchanged.

## Measured (`qa/baseline/p10_1.md`)

| Bot | Hits a minute | Write-offs a minute | Damage a hit |
|---|---|---|---|
| Stands on a lane's line | 1.2–1.3 | 0.20 | 100, front |
| Walks into its path | 3.7 | 0.81 | 129 |
| Wanders | 0.9 | 0 | 45 |
| Dashes at it (reference, with Battery 1) | 1.8 | 0 | 41 |
| Flanks it (reference, with Battery 1) | 2.5 | 0 | 53 |

- **Five red cars a minute;** one on the road at a time; no stalls.
- **Walking in, 10 minutes:** 3–4 hits every minute. Decay 1.14: nothing wears out, as rung 0 intends.
- **No learning events** in any run.
- **Standing gets hit here, by design.** Rung 1 (10.2) closes the front.

## Registry

- **Registered at sim.js values (registry first, v1 §4):** the 29 sim-only IDs, among them `perception.forwardLength`, `proto.driver.cautionZone`, `proto.learn.standoffEnabled`.
- **Added (proposed):** `duel.enabled`, `duel.carsOnRoad`, `duel.redReturnSeconds`.
- **Entries:** 632. `registryVersion` stays `edit100-2026-10-30`: Prototype 9's build embeds it, so a new version would move its md5 (row 665).

## Open

- **Human pass (H3):** Sasha plus one new player, 5 minutes of free play each, recorded. Pass: plays on unprompted for 3 minutes and names a trick.
- **10.2 next:** rung 1, brake for what is ahead, shown as a lesson; Battery 1 arrives.
- **D105:** a sighted car waited for ever for a dummy standing just off its lane line. It matters from 10.2.
