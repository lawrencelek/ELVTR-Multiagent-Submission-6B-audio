# DUMMIES — GDD Edit 107: Prototype 10.7, crash memory

**3 November 2026 · Lawrence Lek** · The seventh of the nine escalating tests (handover v2 §14.2, §22–§23). Localized: adds §10.7 to the Prototype 10 chapter; amends §10.2 (the run-in) for 10.7 on.

**Amended 4 November (row 713):** only a hit sprung from cover leaves a spot. A hit from the open was skill.

**Amended 4 November (row 715):** the block lift. A car kept waiting 10 s by the dummy calls a drone that lifts the dummy aside (§10.7.7).

- **Build:** `prototypes/p10/dummies_p10_7.html` (`python3 prototypes/p10/build.py`).
- **Playtest pages:** `index.html`, one per test. 10.1–10.6 are frozen; 10.6 at md5 `7acd08d2…`.
- **Tests:** `node prototypes/p10/test_p10.js --page` 51/51. Prototype 9 rebuild md5 `be163e7d014344e062965986b3da5786`. 8.4 md5 `9f5549201d88891f9f0b22c461602909`. Sound freeze: 211 items, 0 changed.
- **Probes:** `node qa/testroad.js --stage 10.7 --out qa/baseline/p10_7.json`; report `qa/baseline/p10_7.md`, 17/17 checks. Pace probe `qa/baseline/p10_7_pace.json`. 10.6 reruns identical to its baseline; 10.3–10.5 on today's code 12/12, 12/12, 13/13.
- **Decision log:** rows 703–709, 713, 715. D117 resolved. Open D119, D120.

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
| A hit from the open leaves no spot | Lawrence, 4 November: "that was just skill from the player who judged it right" | Decided (row 713) |
| The block lift: a drone moves a dummy that keeps the car waiting | Lawrence, 4 November: "a drone moves the dummy to the side of the road, waits for the car to move on, and then puts the player down" | Decided (row 715) |
| [X] = 10 s: twice the honk; a cone it laid counts; held until the car leaves the screen | "after [X] seconds"; a drop beside a car still in reach was struck at once | Proposed (row 715) |

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
- **The crash records the spot it was sprung from,** a dash's or a jump's start, and the cover that hid the dummy from the car as it sprang.
- **A hit from the open records no spot** (row 713): the sprint, a walk-in, a spring the car saw coming. It was skill.

### 10.7.2 The lesson

- **Start:** rung 5 (`duel.startRung` 5). Battery 1, Legs 1, Hands 1 and DUCK fitted (`duel.duckArrives` 3).
- **Cause: a hit sprung from cover at the spot of an earlier crash from cover,** within `duel.memoryRadius` (50) of it. Hits from new spots, or from the open, teach nothing.
- **Beats:** as 10.2.
  - The clip's last frame rings the spot: "SAME SPOT AS CRASH n", a line to that crash's outline.
  - The fitting reads "MEMORY FITTED · YOUR HABIT". A drone fits a memory module. A map of the road rings each spot it now remembers.
- **One lesson:** rung 5 to `duel.topRung` 6. No part.

### 10.7.3 Rung 6: it expects you where you struck from

- **It remembers the latest `duel.memorySites` (3) spots sprung from cover.** An older spot falls out of memory.
- **At a remembered spot the dummy is expected:**
  - Cover does not hide it: no planter, no building.
  - The field notices it at once: no `perception.sideNoticeSeconds`, no `perception.duckNoticeFactor`.
- **So it stops short and waits,** as for a dummy in the open.
- **A spot it does not remember works as before.** Ducked behind a planter there, the dummy is hidden.

### 10.7.4 What the car shows (row 701)

- **On the road, from rung 6:**
  - A red ring on each remembered spot, labelled with its crash's number, and a line to that crash's outline.
  - A crash it does not remember fades to faint chalk: a forgotten spot, or a hit from the open.
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
- **The sprint from past the field still lands** (D115). It leaves an outline, never a spot.
- **Next (§14.2, 10.8):** the road upgrade. Two-way, with white sedans that never learn.

### 10.7.7 The block lift (row 715)

- **When:** the red car has waited `duel.blockSeconds` (10) for the dummy: in its path, noticed in its field, or behind its cone.
- **Warning:** from the honk (`proto.honkSeconds` 5), a countdown over the dummy: "MOVE ALONG · DRONE IN n".
- **The drone:** a FARSIGHT drone flies in (`proto.droneSpeed` 240) and lifts the dummy (`proto.droneLiftSeconds` 0.5). Mid-dash or mid-jump, it hovers until the move ends.
- **Where to:** beside the car's road, on the dummy's side, clear of the other road and of statics. Off the road already, it lifts the dummy where it stands.
- **Cones go too:** a drone fetches each cone in the car's lane ahead, at once.
- **Held until the car has left the screen.** Put down beside a car still in reach, the dummy would strike it.
- **Lifted, the dummy is out of play:** unseen, untouchable, without control. The car drives on.

## Build

- `testroad.js`:
  - Rung 6 in the rungs table (habit: true; fit 'MEMORY'; no part).
  - Crashes: `account` records each damaging hit, its spring spot (`springOrigin`; `startLunge`, `tryJump`) and whether it repeats an earlier spot.
  - Row 713: `trackSight` keeps the cover that hides the dummy (`hidingCover`); a spring records it (`springCover`); `sites` holds only crashes from cover.
  - `memory`, `nearSite`, `expected`, `checking`. `occluded`: an expected dummy is seen. `watchField`: noticed at once. `learnFrom`: the habit cause.
  - `runInFor` reads `duel.runInLength`; `admit` applies `spawnSpeed`.
- `game_p10.js`: outlines, debris, markers; rings, lines, scans; the memory module, tag and CHECKING; EXPECTED; the clip's ring; the fitting's map. Labels sit on a dark backing; the notice meter sits past the tag.
- `build.py`: 10.7's stage; 10.6's page frozen.
- `qa/testroad.js`: bot `roam`; the stand bots start on their spot when the run-in is short; a stall is 20 s stopped with nothing in its way at any moment.
- Row 715: `stepLift`, `sidePoint`, `fetchBlockingCones`, `blocked`; the lifted dummy is skipped by `assessBody`, `occluded` and `collideBody`. `game_p10.js` draws the countdown, the drone and the lifted dummy.

## Measured (`qa/baseline/p10_7.md`)

**Rung 6 alone** (mode `trained`; 3 offsets × 300 s):

| Way in | Hits a minute | Damage a hit | Verdict |
|---|---|---|---|
| DUCK behind a planter, the same spot | 0.27 | 84 | Closed: one hit from cover a run, then it stops for the dummy there. In one run a first spring it saw coming left no spot |
| DUCK behind a planter, moving to spots it does not remember | 6.97 | 242 | Open: 98 hits from 103 cars; a write-off every 18 s (D119) |
| The sprint from past the field | 0.60 | 53 | Open (D115): it leaves no spot |
| The flank from open pavement | 0.40 | 53 | Open (D115): the sprint from past the field. Its stalemate had hidden it |
| Every other bot | 0 | — | Closed |

- **A new behaviour:** 93 cars stopped for a dummy at a remembered spot; for 54 of them, cover hid it. No hit came from a remembered spot (0 of 117).
- **Short run-in:** 702 of 1,725 cars appeared slowed for a dummy they already sensed. The closest stop for a dummy standing ahead: 226 (reach 177).
- **The block lift:** 949 lifts. No car waited for the dummy past 20 s. The closed bots now meet 2.4 cars a minute, not 0.3: a stalemate no longer shields a trick from the test.

**The lesson** (mode `lesson`):

- **Lessons:** in 6 of 6 runs with a repeat from cover, at 11–34 s. The sprint never teaches it: 0 of 3 runs.
- **Escalation (10 minutes):** the same spot decays to 0 after two hits. Moving holds at 6–8 a minute; its tenth minute holds 22 s, as each write-off pauses the clock. The sprint stops after three hits: the dummy's own leg damage, on a 500 body.

**Pace:**

| Way in | Seconds a write-off | GDD target |
|---|---|---|
| 10.6's planter ambush, 800 body, long run-in | 148 | At most 80 (Edit 18 §10.2) |
| The same ambush on 10.7's run-in and body, no memory | 74 | |
| Moving between spots, rung 6 | 18 | |

## Registry

- **Added (4):** `duel.runInLength`, `duel.memoryRadius`, `duel.memorySites`, `duel.blockSeconds` (row 715).
- **Set by stage:** `proto.health.standard` 500, `duel.redReturnSeconds` 2, `duel.blockSeconds` 10.
- **663 entries.** `registryVersion` unchanged (row 665).

## Open

- **Human pass (H6):** does the player read the red rings, and move?
- **D119:** an expert moving between spots writes off a body every 18 s: a quarter of the target.
- **D120:** the memory's cap. 3 keeps the planters open to a mover; 0 closes them after about nine hits.
- **D115:** the sprint from past the field still lands. It leaves no spot (row 713).
