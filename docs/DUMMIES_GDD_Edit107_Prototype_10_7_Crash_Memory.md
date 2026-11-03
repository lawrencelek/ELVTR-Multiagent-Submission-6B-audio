# DUMMIES — GDD Edit 107: Prototype 10.7, crash memory

**3 November 2026 · Lawrence Lek** · The seventh of the nine escalating tests (handover v2 §14.2, §22–§23). Localized: adds §10.7 to the Prototype 10 chapter; amends §10.2 (the run-in) for 10.7 on.

- **Build:** `prototypes/p10/dummies_p10_7.html` (`python3 prototypes/p10/build.py`).
- **Playtest pages:** `index.html`, one per test. 10.1–10.6 are frozen; 10.6 at md5 `7acd08d2…`.
- **Tests:** `node prototypes/p10/test_p10.js --page` 49/49. Prototype 9 rebuild md5 `be163e7d014344e062965986b3da5786`. 8.4 md5 `9f5549201d88891f9f0b22c461602909`. Sound freeze: 211 items, 0 changed.
- **Probes:** `node qa/testroad.js --stage 10.7 --out qa/baseline/p10_7.json`; report `qa/baseline/p10_7.md`, 15/15 checks. Pace probe `qa/baseline/p10_7_pace.json`. 10.6 reruns identical to its baseline; 10.3–10.5 on today's code 12/12, 12/12, 13/13.
- **Decision log:** rows 703–709. D117 resolved. Open D119, D120.

## Request

> "there should be a 'crash detritus' left on the road when you crash there. Like an 'outline' they have on NYC sidewalk if someone dies. On the car: Let's try ok having it on the car. And OK on the lesson screen. Let's try shorter drive-in, and lighter body on the test road (500 health)." (Lawrence, 3 November)

## Readings

| Reading | Basis | Status |
|---|---|---|
| Rung 6 remembers the spot each crash was sprung from, and expects the dummy there | §14.2: it counters your habit; §20.3 | Proposed (row 703) |
| A repeat teaches it: a hit sprung from the spot of an earlier crash | The habit is the repeat | Proposed (row 703) |
| It remembers the latest three spots | §4.3: counters are capped and fall back | Proposed (row 704; D120) |
| "Shorter drive-in": the run-in and the wait between passes both shorten | D117's first option: cut the dead time | Proposed (row 706) |
| "500 health": the test road's Standard body, `proto.health.standard` 500 | The sim sets `damage.bodyHealth` from it | Decided (row 706) |

## 10.2 The run-in (amends Edit 102)

- **`duel.runInLength`:** the run-in, when above 0. 0 keeps row 670's rule: the beam plus a car length (771).
- **A car appears at the speed its envelope allows** for a dummy it already senses: in its beam, or in its field from rung 2. A dummy it cannot see changes nothing.
- **So it still never appears too close.** Standing at the screen's edge in its lane is never hit.

## 10.7 Crash memory

### 10.7.1 Crash detritus

- **Every damaging hit leaves a crash on the road:**
  - A chalk outline where the dummy was struck.
  - Debris round the point of impact: dummy plastic, glass. A write-off scatters more.
  - A yellow evidence marker with the crash's number.
- **It stays.** Write-offs do not clear it; R (restart) does.
- **The crash records the spot it was sprung from:** a dash's or a jump's start; for a walk-in, where the dummy stood.

### 10.7.2 The lesson

- **Start:** rung 5 (`duel.startRung` 5). Battery 1, Legs 1, Hands 1 and DUCK fitted (`duel.duckArrives` 3).
- **Cause: a hit sprung from the spot of an earlier crash,** within `duel.memoryRadius` (50) of it. Hits from new spots teach nothing.
- **Beats:** as 10.2.
  - The clip's last frame rings the spot: "SAME SPOT AS CRASH n", a line to that crash's outline.
  - The fitting reads "MEMORY FITTED · YOUR HABIT". A drone fits a memory module. A map of the road rings each spot it now remembers.
- **One lesson:** rung 5 to `duel.topRung` 6. No part.

### 10.7.3 Rung 6: it expects you where you struck from

- **It remembers the latest `duel.memorySites` (3) crash spots.** An older spot falls out of memory.
- **At a remembered spot the dummy is expected:**
  - Cover does not hide it: no planter, no building.
  - The field notices it at once: no `perception.sideNoticeSeconds`, no `perception.duckNoticeFactor`.
- **So it stops short and waits,** as for a dummy in the open.
- **A spot it does not remember works as before.** Ducked behind a planter there, the dummy is hidden.

### 10.7.4 What the car shows (row 701)

- **On the road, from rung 6:**
  - A red ring on each remembered spot, labelled with its crash's number, and a line to that crash's outline.
  - A crash it no longer remembers fades to faint chalk.
- **On the car:**
  - A memory module on its roof: one red light a remembered spot.
  - Its tag: "R6 · MEMORY 3".
  - Spots in its field: a red scan line to each; "CHECKING #n"; their rings brighten.
- **On the dummy:** at a remembered spot, EXPECTED, in red. Elsewhere, HIDDEN or SEEN, as 10.6.
- **On the lesson screen:** §10.7.2's beats.

### 10.7.5 Pace (D117)

- **Run-in:** `duel.runInLength` 200, not 771. The drive-in: 1.08 s, not 5.22 s.
- **Return:** `duel.redReturnSeconds` 2, not 4. The empty road between passes: 2 s, not 5.2 s.
- **Body:** `proto.health.standard` 500, not 800.
- **Cars a minute:** 7.9, against 5.6 at 10.6.

### 10.7.6 The opening

- **Move.** Each spot works once; the fourth spot frees the first.
- **The sprint from past the field still lands** (D115). At a remembered spot it is noticed at once, but too late to stop.
- **Next (§14.2, 10.8):** the road upgrade. Two-way, with white sedans that never learn.

## Build

- `testroad.js`:
  - Rung 6 in the rungs table (habit: true; fit 'MEMORY'; no part).
  - Crashes: `account` records each damaging hit, its spring spot (`springOrigin`; `startLunge`, `tryJump`) and whether it repeats an earlier spot.
  - `memory`, `nearSite`, `expected`, `checking`. `occluded`: an expected dummy is seen. `watchField`: noticed at once. `learnFrom`: the habit cause.
  - `runInFor` reads `duel.runInLength`; `admit` applies `spawnSpeed`.
- `game_p10.js`: outlines, debris, markers; rings, lines, scans; the memory module, tag and CHECKING; EXPECTED; the clip's ring; the fitting's map. Labels sit on a dark backing; the notice meter sits past the tag.
- `build.py`: 10.7's stage; 10.6's page frozen.
- `qa/testroad.js`: bot `roam`; the stand bots start on their spot when the run-in is short; a stall is 20 s stopped with nothing in its way at any moment.

## Measured (`qa/baseline/p10_7.md`)

**Rung 6 alone** (mode `trained`; 3 offsets × 300 s):

| Way in | Hits a minute | Damage a hit | Verdict |
|---|---|---|---|
| DUCK behind a planter, the same spot | 0.20 | 53 | Closed: one hit a run, then it stops for the dummy there |
| DUCK behind a planter, moving to spots it does not remember | 6.97 | 242 | Open: 98 hits from 103 cars; a write-off every 18 s (D119) |
| The sprint from past the field | 0.80 | 52 | Open (D115): 9 of 12 hits from a remembered spot |
| Every other bot | 0 | — | Closed |

- **A new behaviour:** 95 cars stopped for a dummy at a remembered spot; for 32 of them, cover hid it.
- **Short run-in:** 75 of 670 cars appeared slowed for a dummy they already sensed. The closest stop for a dummy standing ahead: 226 (reach 177).

**The lesson** (mode `lesson`):

- **Lessons:** in 9 of 9 runs with a repeat. The planter ambush taught it at 11–28 s, the sprint at 43–54 s. No run hit only from new spots before its lesson.
- **Escalation (10 minutes):** the same spot decays to 0 after two hits. Moving holds at 6–8 a minute; its tenth minute holds 22 s, as each write-off pauses the clock. The sprint stops after four hits: the dummy's own leg damage.

**Pace:**

| Way in | Seconds a write-off | GDD target |
|---|---|---|
| 10.6's planter ambush, 800 body, long run-in | 148 | At most 80 (Edit 18 §10.2) |
| The same ambush on 10.7's run-in and body, no memory | 74 | |
| Moving between spots, rung 6 | 18 | |

## Registry

- **Added (3):** `duel.runInLength`, `duel.memoryRadius`, `duel.memorySites`.
- **Set by stage:** `proto.health.standard` 500, `duel.redReturnSeconds` 2.
- **662 entries.** `registryVersion` unchanged (row 665).

## Open

- **Human pass (H6):** does the player read the red rings, and move?
- **D119:** an expert moving between spots writes off a body every 18 s: a quarter of the target.
- **D120:** the memory's cap. 3 keeps the planters open to a mover; 0 closes them after about nine hits.
- **D115:** the sprint from past the field still lands, from a remembered spot too.
