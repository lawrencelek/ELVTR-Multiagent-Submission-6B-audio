# DUMMIES — Handover: vehicle intelligence and game fun (Prototype 10)

**31 October 2026 · Lawrence Lek** · From the Prototype 9 / sound design session ([session](https://claude.ai/code/session_0178chfCgkW112HS5Gts98Yd)). Read this first in the new chat.

## 0 Start the new chat

- **Where:** inside the Project "ELVTR Course - GDD". Its docs and instructions come with it.
- **First message:** "Read `claude/DUMMIES_Handover_Vehicle_Intelligence.md` first. Then build Prototype 10: vehicle intelligence and game fun, in `ELVTR-Multiagent-Submission-6B-audio`."
- **For code:** use a session with GitHub access. Attach `lawrencelek/ELVTR-Multiagent-Submission-6B-audio` (push).
- **Repo choice (Q0, §3.1):** Prototype 10 continues in the same repo by default (`prototypes/p10/`).
  - If this is a new course submission, create a new empty repo first. Seed it from this one (§9.1).
- **Source repo, read only:** `lawrencelek/ELVTR-dummies-agent-crew`. Attach it (read) only for the P1–P3 bot scripts (§8.2).
- **If this is a course assignment**, paste its brief into the first message.
- **Bring play notes.** The jam (row 638) needs a trace: tile, what was placed, how long the cars stood (§6.4).

## 1 What carries over

| Item | New chat in the project | Where |
|---|---|---|
| Project docs: GDD edits to 100, prototype docs, decisions, registry, style guides, QA report | Yes, searchable | `claude/…` |
| Project instructions (house style) | Yes | Project settings |
| Code, builds, tests, QA harness, runs, audio | Yes, by cloning | This repo (all pushed) |
| The Sound Lab, final and read-only (row 647) | Yes: the page in the repo, and the artifact by its link (Artifact `read`) | `prototypes/p9/sound_lab.html` (`make_lab.py --final`); artifact <https://claude.ai/artifact/QhX32kEywUKkawo5fyjBG1>, private to Lawrence |
| The Text Lab, the sound tour | Yes, by cloning | `prototypes/p9/text_lab.html`, `prototypes/p9/SOUND_TOUR.md` |
| The audio: pack, generated tones, music | Yes, by cloning (192 files, 38 MB) | `prototypes/p9/audio/`; picks `content/audio/picks_lawrence*.json` |
| The tags `p9-sound-frozen`, `p9-sound-final` | No. Local only; tag pushes are refused (proxy 403) | Lawrence pushes them, or the new chat tags the final-freeze commit |
| This conversation | No; past-chat search only, if enabled | — |

- **Project knowledge:** about 1.57 of 2.0 MB used. Keep run logs and audio out of the project.

## 2 The game now (Prototype 9)

- **DUMMIES:** a top-down game. You are a crash-test dummy in training in SHENZHEN SMART CITY.
  - Dummy Corporation makes custom dummies. Self-driving cars must avoid you; you must get hit.
- **Build:** `prototypes/p9/dummies_p9.html` (1.43 MB) with `prototypes/p9/audio/` (38 MB, loaded by URL).
  - md5 `be163e7d014344e062965986b3da5786`. Live on GitHub Pages: <https://lawrencelek.github.io/ELVTR-Multiagent-Submission-6B-audio/>.
- **Flow:** intro → mode select (STORY, ARCADE, HIGH SCORES, CREDITS).
  - **Story:** 27 tiles in three acts; parts by drone; finale to CERTIFIED. Best points and fastest run kept (row 640).
  - **Arcade (row 639, `arcade.modes` 1):**
    - Time trial: write off `arcade.trial.writeOffs` (10) bodies; fastest time kept.
    - Endless: a grade every `arcade.endless.gradeWriteOffs` (3) write-offs.
    - Exploration arrows mark open screen edges (`ui.exploreArrows`, row 642).
    - Prices 2, 4, 6, 8 write-offs a level (`economy.price.ability.level1`–`level4`, row 641).
- **Sound: final and frozen** (rows 645–647). Lawrence's last pick round closed it (row 647).
  - `audio/FREEZE.json` holds 210 MD5s. `python3 audio/freeze.py --check` must pass; `test_p9.js` runs it.
  - Car-notice and plain barks are silent (row 625); shouted barks sound (row 647). Honks cap at `audio.sfx.honkMaxPerCar` (2).
- **Latest fixes:** contact grace `proto.contactGraceSeconds` 0.3 (row 630); a moved cone frees the lane (`proto.driver.dodgeFollowsCone`, row 632); a drone fetches a lane cone after `proto.droneConeSeconds` 5 s (row 636).
- **Current state in one page:** `claude/DUMMIES_GDD_Current_State.md` (Edit 99). Sound: `claude/DUMMIES_GDD_Edit100_Prototype_9_Sound.md`.

## 3 The request (verbatim)

> Make a handover document for the next Prototype. This will be focused on the vehicle intelligence and improving game fun.

### 3.1 Readings to confirm (ask Lawrence once, at the start)

| # | Question | Proposed reading |
|---|---|---|
| Q0 | Same repo, or a new submission repo? | Same repo; `prototypes/p10/`, GDD Edit 101 |
| Q1 | "Vehicle intelligence": learning, personality, or both? | Both, in order: identity (W1), per-approach learning (W2), visible learning (W3), moods (W4), profiles (W5) |
| Q2 | Who learns: each car, each numbered model, or the fleet? | Each numbered model (Edit 25 §6.4). Recurring model IDs make learning readable. Fleet sharing stays off |
| Q3 | Which approaches learn first? | Direct interception and post-commit bait (Edit 26's first version), then cone diversion (cones are a core verb now) |
| Q4 | When does learning reset? | A new run resets it. A tile or road keeps it. Second Market (D77) would keep it |
| Q5 | "Game fun": which measure counts? | Bot metrics (§7, W0) plus Lawrence's play. Targets set from the P9 baseline, then confirmed |
| Q6 | Harder or more hittable? | More hittable openings, fewer dead waits. Learning shifts *which* trick works; it never closes all (pillar 1) |
| Q7 | New car behaviours need new sounds (an Emergency siren). The sound is frozen | New events stay silent or reuse a frozen cue. Any new file needs Lawrence to lift the freeze |
| Q8 | Which driver profiles? | Courier (more hittable) and Rattled (learning made visible) first. Learner and Emergency later |

- Every proposal above is the assistant's. Record each answer as a DECISIONS row, user-decided or proposed.

## 4 Constraints

- **Registry first.** 29 vehicle parameters live only in `sim.js` (`REG`, `PROTO`), unregistered:
  - `perception.forwardLength` 320, `perception.sideHalfAngle` 80, `traffic.commitHorizon` 0.75.
  - `learning.playerHitStep` 0.08, `learning.playerHitCap` 0.4, `proto.learningEnabled` 0.
  - `proto.standoffDistance` 50, `proto.learn.standoffEnabled` 1, `proto.learn.standoffStep` 35, `proto.learn.standoffMax` 190.
  - `proto.driver.cautionZone` 180, `cautionSpeed` 82, `passClearance` 24, `passSpeed` 55, `patienceSeconds` 8.
  - `proto.swerveLength` 120, `proto.swerveOuter` 34, `proto.returnSignalSeconds` 0.5, `proto.returnClearance` 30, `proto.carYawRate` 240.
  - `proto.unstick.reverseSpeed` 30, `reverseGap` 140, `reverseSeconds` 5; `proto.honkSeconds` 5; `proto.sensorStraight` 1.
  - `proto.traffic.straight.interval` 3, `barrier.interval` 3, `corner.interval` 3.5, `proto.traffic.jitter` 0.4.
  - Register them first, at today's values. `build.py` asserts every flag it sets is registered.
  - Check: `node` script in §8.3.
- **Frozen builds stay byte-identical.**
  - Prototype 8.4: md5 `9f5549201d88891f9f0b22c461602909`.
  - Prototype 9: md5 `be163e7d014344e062965986b3da5786`. Rebuild it after each shared-code change; it must not move.
  - New behaviour goes behind flags: registry default 0; `prototypes/p10/build.py` sets 1.
- **Sound stays frozen.** `freeze.py --check` passes on every commit.
  - `game.js` sound hooks (`audGate`, `audEv`, `processEvents`) sit outside the freeze. They still decide what plays. Leave them.
  - New sim events reach no cue unless `cues.json` maps them. That file is frozen: new events are silent.
- **Determinism.** The sim is seeded and headless-safe. Bots and tests depend on it. No `Math.random` in `sim.js`.
- **Design rules to keep (Edits 14, 25, 26):**
  - Learning changes avoidance, not right of way.
  - Every cap leaves a lethal opening. An unupgraded dummy at minimum reach still beats a fully trained model.
  - A car on screen keeps its values until it leaves. Later spawns read the updated model.
  - Mood never hides a cue, adds a route change or removes a lethal opening.
  - Learning reads differently from mood or chance (V29 D2.2). Models return soon enough to see it.
  - Approach is never inferred from the damage zone alone.
- **Text.** New barks, toasts and report lines follow Style Guide V2 (`style/STYLE_GUIDE_V2.md`). D87 (V2.10) awaits Lawrence.
  - Barks go in `content/db/fleet.json`, keyed by event, tier and `when`.

## 5 Vehicle intelligence now (code survey, Prototype 9)

Survey at `df5956c` (sim and game code unchanged since). Line numbers move; search by name. **S** = `prototypes/p6/sim.js` · **G** = `p6/game.js` · **T** = `p7/story.js`.

### 5.1 The per-car loop: `carAI(dt)` (S:2953)

Each tick, for each car, in order:

1. **Sense:** `perceive(c)` (S:2547) and `assessBody(c)` (S:2572).
2. **Block timer:** stopped at a cone or the dummy for `proto.honkSeconds` (5): honk once; a cone calls a drone.
3. **Reverse** if a reverse plan runs (unstick).
4. **Jam clear:** stopped `traffic.gridlockSeconds` (6) with `traffic.jamReverse`: back up `proto.unstick.reverseGap`.
5. **Commitment:** finish it after `traffic.commitHorizon`, or interrupt it if `obstacleAhead(c)` (S:2862).
6. **Unstick:** stopped `traffic.deadlockTimeout` (3) with no `reasonToWait`: drop the plan, cruise.
7. **Decide:** return to lane, the dummy in path, a cone ahead, or cruise.
8. **Speed:** cruise, corners, caution, give-way lines, junctions, rings, the car ahead.

### 5.2 Perception

- **Forward beam:** a rectangle along the heading, `perception.forwardLength` (320) long, car-width wide. Sees cones only.
- **The dummy:** `assessBody` checks the swept path ahead within `proto.driver.cautionZone` (180).
  - `inPath`: inside the car's width, in the beam. `near`: within the caution zone.
- **Side sensor:** `perception.sideRadius` (100), within `perception.sideHalfAngle` (80°).
- **Occlusion:** ground statics hide the dummy from ground cars (`occluded`, S:2536). Other cars do not.
- **Reaction:** `perception.reactionDelay` (0.3 s); `proto.driver.coveredReaction` (0.18 s) once already covering the brake.
- **Levels:** a dummy on another level, a stair or in the air is out of the car's world (`meets`).

### 5.3 Decisions: `choose(c, tg, opts)` (S:2733)

- **Dummy in path:** brake to stop `c.standoff` short. Wait. After `proto.driver.patienceSeconds` (8), pass at `proto.driver.passSpeed` (55) with `passClearance` (24).
- **Dummy near:** slow to `proto.driver.cautionSpeed` (82).
- **Cone ahead:** shift laterally if the route is clear; else stop short. Bus never swerves (`vehicles.bus.swerve` 0).
- **Commit:** `commit(c, man, cause, tg)` (S:2846) stores the plan and the dodge target.
- **Return:** signal `proto.returnSignalSeconds`, then return once past `proto.returnClearance`, or once the cone moved.

### 5.4 Unstick and jams

- Three layers: replan (S:3038), reverse at a deadlock (S:3027), jam reverse (S:2992). Plus `untangle` for cars locked body to body.
- **The jam (row 638):** "the cars don't move after the barrier is fixed" (Monument A2). Not reproduced by `qa/jam.js` (240–430 s) or 90 agent-minutes.

### 5.5 Learning

- **Unit: the class.** `this.models` (S:1577) holds five models, one per class: SEDAN-01, VAN-02, HAT-03, POL-03, BUS-02. Every sedan is SEDAN-01.
- **General learning: off.** `proto.learningEnabled` 0. When on, each write-off raises `applied`, which lengthens the forward beam by `learning.playerHitStep` (0.08) to `learning.playerHitCap` (0.4).
- **Standoff learning: on.** A hit on a stopped car pushes that model's stop line back `proto.learn.standoffStep` (35) to `proto.learn.standoffMax` (190). Event `learn-standoff` (S:3271); toast "{model} now stops {metres} m back" (G:934).
  - Four hits put a model past lunge reach, 177 (DB4a). The dummy must walk in; the hit stays weak.
- **Carry bug:** only sedan and van standoffs carry across roads (S:1647). Hatchback, police and bus forget.
- **Approach registry (Edits 25–26):** six approaches with evidence predicates, steps and caps. None built.

### 5.6 Identity

- **Fleet database** `content/db/fleet.json`: 8 classes × 4 tiers = 32 models, each with a tag, callsign, job and temperament. 147 barks.
- **Mapped to the sim: 2 of 32.** Only SED-01-001 and VAN-02-001 carry `simIds`. Hatchback, police and bus cars have no tier, so tier barks skip them (G:679).
- **Spawned classes:** sedan, van, hatchback (`traffic.share.hatchback` 0.22), police (0.08), bus (0.1). Sports, wagon and SUV are registered but never spawn.
- **Seniority** (`fleet.seniority`: New, Practised 1, Experienced 3, Senior 6): drawn as pips beside the tag only when `proto.learningEnabled` (G:1635). Hidden in P9.
- **Moods** (`fleet.moods`: Standard, Rush, Cautious, Unreliable): listed only. Not in the sim.

### 5.7 Cues the player reads

- Brake glow, indicators, committed path, headlight flash ("has noticed you", `ui.lampsOnCar`), honk bubble, spent tick (`ui.spentTick`), model tag.
- Cue key: Edit 99. Crowding at busy junctions: D40. Scanner hatch in the view cone: D84.

## 6 Where the fun is thin (evidence)

### 6.1 QA (`qa/REPORT.md`, 30 October)

- Three personas × 30 min in Arcade: 11 runs, **all Failed test**. Two write-offs in total.
- The personas break things; they do not play well. Their numbers bound clumsy play, not skill. A skilled bot is missing (W0).

### 6.2 The cars

- **Safe and patient.** A standing dummy gets a stop 50 back and an 8 s wait. Stopped cars give weak hits.
- **Learning is invisible.** General learning is off; seniority pips are hidden. Standoff learning shows only as a toast.
- **Identity is thin.** One model per class. 30 of 32 authored models never appear. Pillar 3 ("cars visibly learn as individuals and a fleet") has no stage.
- **No variety per encounter.** No moods, no profiles. Every sedan drives the same.
- **Quiet cars.** Car-notice and plain barks are mute (row 625); only shouts sound (row 647). The car's voice is mostly the bubble.

### 6.3 Pacing

- Endless density and grades: D81 (faster cars per grade), D44 (Waterfront circus at capacity).
- Upgrade prices doubled (row 641): fewer verbs per run. Check write-off pace against them.

### 6.4 Open faults

- The jam (row 638): ask Lawrence for a trace. Add a watchdog (W7).

## 7 Proposed workstreams (suggested; the new chat decides)

Measure first. Each change lands behind a flag, with a bot comparison before and after.

| # | Workstream | Delivers | Registry IDs (proposed) |
|---|---|---|---|
| W0 | **Fun harness** | A skilled bot (§8.2 policies: read and lunge, bait, ambush, cone diversion) on StorySim and ArcadeSim, headless. P9 baseline table | `qa.fun.*` targets, once agreed |
| W1 | **Identity** | Each spawn draws a numbered model of its class from `fleet.json` (seeded, tier by district). Models recur. All 32 get `simIds`. Carry fixed for every class | `fleet.recurShare`, `fleet.tierBy` |
| W2 | **Per-approach learning** | Tag each write-off with one approach (Edit 25 predicates). Step and cap per approach per model. Direct interception and post-commit bait first | `learning.approach.<id>.step`, `.cap`, `.enabled` |
| W3 | **Visible learning** | Seniority pips on. A learned mark on the tag. A toast and a bark per approach learned. Fleet learning on the report card | `ui.seniorityPips`, `ui.learnedMark` |
| W4 | **Moods** | Seeded per appearance: Standard 55%, Rush 20%, Cautious 15%, Unreliable 10%, with Edit 25 §6.5 effects. A readable tell | `traffic.mood.<name>.share`, `.speed`, `.timeGap`, `.hesitation` |
| W5 | **Profiles** | Courier (vans behind schedule: passes sooner, smaller standoff) and Rattled (a model just hit: wider zone, longer standoff). DB6 values | `driver.profile.<name>.*` |
| W6 | **Pacing** | Tune patience, standoff, caution and grade steps against W0 targets. Decide D81 | existing IDs |
| W7 | **Jam watchdog** | A car stopped > N s with no `reasonToWait` logs a trace and unsticks | `traffic.watchdogSeconds` |

- **Acceptance (Edit 25 §12.7):** a model at every cap is still beaten by an unupgraded dummy at minimum reach. Make it a test.
- **Proposed fun metrics for W0:**
  - Reading beats repetition: read-and-lunge outscores blind lunge over a run (V29 D2.1).
  - Write-offs per minute; time to first hit; time to first write-off.
  - Hits per approach; near-misses per minute; dead time (no car within reach) per minute.
  - Time-trial clear rate and time; Endless grade reached.
  - Per-model learning curve: hits needed per write-off as seniority rises.

### 7.1 The agent pattern (as in Assignments 4–6)

- **Evidence (no model):** the bot runs and metrics, saved per run.
- **Designer agent:** proposes parameter changes within registry ranges, with the evidence it read.
- **Reviewer agent:** scores against the fun targets and the lethal-opening check. SCORE and REASON.
- **Refiner:** revises from the REASON. Loop to the target or the round cap. Saved runs, a `trace.md` each.
- Lawrence's play decides. The loop only narrows the options.

## 8 Tools

### 8.1 In this repo

| Tool | Does |
|---|---|
| `qa/agent.js` | Playwright persona (clipper, saboteur, chaos) in Arcade. `--persona --minutes --out --seed` |
| `qa/monitor.js` | In-page monitor at 10 Hz on `app.realT`: collisions, stuck cars and modes, sound loops |
| `qa/run_all.sh <out> [min]` | Three personas in parallel |
| `qa/report.py <run>` | Dedupes findings → `findings.json` |
| `qa/repro.js <scenario>` | Scripted repros: lean, conemove, block, tick, modes, … |
| `qa/jam.js [tile] [secs] [flag=v]` | Headless StorySim with cones placed and moved; lists cars stopped > 20 s and why. `STAY=1` leaves the cone |
| `prototypes/p9/test_p9.js --p84` | 51 checks, including the freeze and the 8.4 md5 |

### 8.2 In the source repo (read only)

- `prototypes/p1/–p3/policy_check.js`: scripted policies (stand in lane, blind lunge, read and lunge). Port to StorySim for W0.
- `prototypes/p1/–p3/car_metrics.js`: car predictability metrics.
- `checks/bot_playthrough.js`: the plain-ambush bot of the vertical slice.

### 8.3 The registry check (W0, before any tuning)

```
node -e "const fs=require('fs'),s=fs.readFileSync('prototypes/p6/sim.js','utf8');
const reg=new Set(JSON.parse(fs.readFileSync('content/params/tuning.parameters.json','utf8')).entries.map(e=>e.id));
const ids=[...s.matchAll(/'((?:traffic|perception|learning|proto\.(?:driver|learn|unstick|standoff|swerve|return|honk|traffic|learningEnabled|sensorStraight|carYaw))[a-zA-Z0-9_.]*)'\s*:/g)].map(m=>m[1]);
console.log([...new Set(ids)].filter(i=>!reg.has(i)))"
```

- Today it lists the 29 IDs of §4. After W0 it lists none.

## 9 Repositories

| Repo | Branch | Role |
|---|---|---|
| `lawrencelek/ELVTR-Multiagent-Submission-6B-audio` | `main` = `gh-pages` | **Target.** Prototype 9 and the sound design. Prototype 10 goes here (Q0) |
| `lawrencelek/ELVTR-dummies-agent-crew` | `assignment4/content-pipeline` | **Source, read only.** P1–P8, bots, `style/`, `coder/` |
| `lawrencelek/ELVTR-Multiagent-Submission-6` | `main` = `gh-pages` | Assignment #6, done. Pages hosts Prototype 8.4 |

### 9.1 If a new repo is wanted

- Copy the tree without `qa/runs/` and `audio/runs/` screenshots. `prototypes/p9/audio/` (38 MB) stays: the build loads it.
- Record the source commit in `SOURCE.md`. First check: both md5s of §4 reproduce.

## 10 Current state

- **Registry:** `content/params/tuning.parameters.json`, `edit100-2026-10-30`, 600 entries.
- **Decisions:** `DECISIONS.md` rows 1–647. Next row 648; next open decision D89.
  - Open and near this work: D40 (cue crowding), D44 (circus capacity), D77 (Second Market keeps learning), D81 (faster cars per grade), D84 (scanner hatch).
  - Waiting on Lawrence: D87 (Style Guide V2.10); row 638 (the jam trace).
- **GDD:** Edit 100 (Sound) is the newest. Prototype 10 writes Edit 101.
- **Sound:** final, frozen again after the last pick round (row 647). Tags `p9-sound-frozen`, `p9-sound-final` local only.

## 11 Run and test

```
python3 prototypes/p8/build.py                       # md5 9f5549201d88891f9f0b22c461602909; do not commit a changed 8.4
python3 prototypes/p9/build.py                       # md5 be163e7d014344e062965986b3da5786; must not move
cd prototypes/p9 && node tour_p9.js && node test_p9.js --p84 && cd ../..   # 51/51
python3 audio/freeze.py --check                      # the sound freeze
node qa/jam.js A2 300                                # the jam hunt
bash qa/run_all.sh qa/runs/<stamp> 30 && python3 qa/report.py qa/runs/<stamp>
```

- **New build:** copy `prototypes/p9/build.py` and `shell.html` to `prototypes/p10/`. Point audio at `../p9/audio/` (no copy). Write `dummies_p10.html` and `test_p10.js`.
- `index.html` then opens Prototype 10; keep a link to Prototype 9.

## 12 Conventions

- **House style:** direct start; no chatter; active voice; sentences under 15 words; bullet fragments.
- **Data:** every statistic names a registry ID. New statistics get an ID first.
- **Registry writes:** `json.dumps(d, indent=1, ensure_ascii=False) + '\n'`.
- **Frozen builds** never change. Shared code is gated by flags in `window.DUMMIES_SIM`.
- **GDD edits:** one per build. Request quoted, readings flagged, rulings recorded; then sections, Build, Measured, Registry, Open.
- **Commits** to `main`, then `main` to `gh-pages`. Author: Claude <noreply@anthropic.com>. Trailer:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: <the new session's URL>
  ```
- **Proxy:** a 403 is a policy denial. Report it; do not retry or route round it.
- **Project docs:** `project_write` takes an absolute `local_path` inside the working directory.

## 13 Read first (project docs)

1. `claude/DUMMIES_GDD_Current_State.md`: the game, with registry IDs.
2. `claude/DUMMIES_GDD_Edit25.md` and `claude/DUMMIES_GDD_Edit26.md` §6.4–6.5: the approach registry, seniority, moods.
3. `claude/DUMMIES_Driver_Behaviour.md` DB2–DB8: driver values, sensors, stop-distance learning (DB4a), states (DB5), profiles (DB6).
4. `claude/DUMMIES_V29_Design.md` D2: the pillars; D2.1 "reading beats repetition"; D2.2 "recurring cars visibly adapt".
5. `claude/DUMMIES_GDD_Edit14.md` §6.3–6.4 and its review D-04: baiting, learning that stays beatable and visible.
6. `claude/DUMMIES_GDD_Edit50_P5_Fleet_Bus_Roads_Highways.md`: the five-model fleet and the bus.
7. `claude/DUMMIES_GDD_Edit99_Prototype_8_4_Cones_Lights_Cue_Key.md`: the car cues.
8. `claude/DUMMIES_QA_Adversarial_Arcade.md`: the QA run, its harness and findings.
9. `claude/DUMMIES_GDD_Edit100_Prototype_9_Sound.md`: what sounds, and the freeze.
10. `claude/db/fleet.json` (project copy, 20 October; the repo's is newer): models, tiers, barks.
