# DUMMIES — Handover: vehicle intelligence and game fun (Prototype 10)

**31 October 2026 · Lawrence Lek** · From the Prototype 9 / sound design session ([session](https://claude.ai/code/session_0178chfCgkW112HS5Gts98Yd)). Read this first in the new chat.

**Updated 1 November 2026:** the first outside playtest (§3.2) and research (§14) reorder the work. Prototype 10 is 1 vs 1: one red car, one dummy.

**Read v2 first:** `claude/DUMMIES_Handover_Vehicle_Intelligence_v2.md`. It regroups §3.2 into five categories, replaces §7 and withdraws §14.3's untested rules. §4–§12 here still hold.

## 0 Start the new chat

- **Where:** inside the Project "ELVTR Course - GDD". Its docs and instructions come with it.
- **First message:** "Read `claude/DUMMIES_Handover_Vehicle_Intelligence.md` first. Then build Prototype 10: 1 vs 1, the red car, in `ELVTR-Multiagent-Submission-6B-audio`."
- **Read §3.2 and §14 before §5.** The playtest replaces readings Q1–Q8.
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
| Q1 | "Vehicle intelligence": learning, personality, or both? | Learning first: one red car's sensor tiers (PT4). Personality waits for traffic |
| Q2 | Who learns? | The red car only. White cars never learn (`traffic.white.learns` 0). Numbered models later (W1) |
| Q3 | Which approaches close first? | Front (tier 1), flank (tier 2), above (tier 3). Then cover and cones (3), the feint (4) |
| Q4 | When does learning reset? | A new run resets it. Each duel level sets its tier (`duel.level.<n>.tier`) |
| Q5 | "Game fun": which measure counts? | Duel bots per tier (V0) plus outside playtests. Stand-in-lane scores 0 red hits from tier 1 |
| Q6 | Harder or more hittable? | Red: harder each level. White: easy hazards. Each tier closes one opening; one stays (pillar 1) |
| Q7 | New car behaviours need new sounds. The sound is frozen | New events stay silent or reuse a frozen cue. Any new file needs Lawrence to lift the freeze |
| Q8 | Which driver profiles? | Deferred. The red car's tiers replace profiles in Prototype 10 |
| Q9 | Red is the reserved warning hue (Edit 38 §4.1.6) | Keep red; add shape: roof sensor dome, `VUT` tag (D89) |
| Q10 | White cars: hazard, fodder or both? | Both: front hit costs chassis; graze pays (D90) |
| Q11 | Tier order fixed or adaptive? | Fixed L1–L5; then the boss counters your last winning approach (D91) |
| Q12 | May cars hit cars? | Not in the duel (row 84). `traffic.carContact` later (D92) |
| Q13 | Flank hits pay `damage.zone.side` 0.3 | Opening hits by the red car pay full (`duel.openingFullDamage`, D93) |
| Q14 | Duel venue? | Proving Ground: open tarmac, no lanes (D94) |
| Q15 | One boss or two families? | Vision first; Fusion (lidar) later (D96) |
| Q16 | A law clause per level? | Yes, under the goal on the level card (D95) |
| Q17 | Parts as keys vs pillar 1? | A part-free opening stays at every tier, slower (D97) |

- Every proposal above is the assistant's. Record each answer as a DECISIONS row, user-decided or proposed.

### 3.2 Playtest, 1 November: the first outside player (Prototype 9)

**Goal, revised.** Was: get hit by any car until written off. Now: make the car under test hit you; avoid the fleet.

#### PT0 Battery position (design change)

> "the position of the battery is too close to crotch. it should be in the centre of the chest like Iron Man's power core."

- **Done in Prototype 9.** Row 644: a round lit core, centre chest (`ui.coreOnChest` 1).
- The pelvis port survives only in frozen builds ≤ 8.4 (registry default 0).
- `index.html` still links Prototype 8.4. Confirm which build the tester played.
- `prototypes/p10/build.py` keeps `ui.coreOnChest` 1.

#### PT1 Insufficient challenge

> "There is insufficient challenge, if I just stand in the centre of the road I can get hit."

- Standing is a dominant policy. It breaks pillar 1 (row 79): a hit must be earned.
- V29 governance: a dominant opening triggers a balance review.
- **Rule (proposed):** from tier 1 the red car never hits a standing dummy.
  - It stops `proto.standoffDistance` short, then reroutes (`driver.avoid.reroute`).
- **Test:** stand-in-lane policy scores 0 red hits at tier ≥ 1 (V0).

#### PT2 Car AI and emergent behaviour come first

> "Car AI and emergent behaviour is very important, like in the original brief."

- Pillar 3 (row 79): cars visibly learn; individual and group behaviour emerges.
- Emergence comes from avoidance acting on the world.
  - A red swerve, brake or reverse changes the space around it.
  - Later, white traffic reacts to the red car (V6).
- **Measure:** distinct avoidance manoeuvres per minute (§14.1 ladder).

#### PT3 Start with 1 vs 1

> "Let's start by having prototypes of 1 vs 1 - just car vs you."

- **Prototype 10 is the duel.** One red car, one dummy. No traffic, no story map.
- Flag `duel.enabled` (registry 0; `prototypes/p10/build.py` 1).
- Traffic returns once tiers 0–4 pass their tests (§7).

#### PT4 Clear level progression: front, then side, then above

> "In level one, you can just walk into it. Level two, it learns to avoid what's in front. You have to approach from the side. Then Level three you have to hit it from above."

| Level | Red tier | Senses | Avoids by | Lethal opening | Part by drone |
|---|---|---|---|---|---|
| L1 | 0 · Prototype | Nothing | Nothing | Walk into its path | None (on foot, `damage.bodyHealthOnFoot`) |
| L2 | 1 · Forward camera | Ahead: `perception.forwardLength`, `proto.driver.cautionZone` | Brake; stop `proto.standoffDistance` short | The flank: no side sensor | Battery 1, the dash (`movement.lungeDistance`) |
| L3 | 2 · Surround | + sides: `perception.sideRadius`, `perception.sideHalfAngle` | Brake; swerve (`proto.swerveLength`) | Above: jump or deck drop. `meets` ignores the air | Legs 1, jump (`abilities.legs.airtimeBase`) |
| L4 | 3 · Occupancy | + height (`perception.seesAirborne`) | Brake; swerve; reverse (`proto.unstick.reverseSpeed`) | Cover (`occluded`); a cone forces its swerve into you | Hands 1, cones (`abilities.hands.conesPerLevel`) |
| L5 | 4 · Prediction | + your path ahead (`perception.predictSeconds`) | Full ladder (§14.1) | The feint: turn after its commit locks (`traffic.commitHorizon`) | Arms 1, the push (`abilities.arms.pushWindow`) |

- L1–L3 are the tester's ladder. L4–L5 extend it from §14.2.
- Each tier arrives with a visible sensor cue (`ui.sensorCue`).
- Tier per level: `duel.level.<n>.tier` (proposed).

#### PT5 Two car types: white and red

> "white cars you want to avoid getting hit by, because they don't learn, and 'red' cars that are smart and getting smarter, these are like the 'bosses'."

- **White:** the fleet. Never learns (`traffic.white.learns` 0). A front hit costs chassis.
- **Red:** the vehicle under test (Euro NCAP's term, §14.2). Learns each level. Its hit completes the test.
- Duel first; white traffic later (V6).
- **Clash:** red is the reserved warning hue (Edit 38 §4.1.6). D89.

#### PT6 Powerups are how you learn to get hit

> "And your powerups are crucial to learning how to get hit."

- Each tier's opening pairs with the part delivered that level (PT4 table).
- Edit 93's rule holds: introduce, then test.
- **Tension:** pillar 1 says an unupgraded dummy always has an opening.
  - Proposal: a part-free opening stays, slow and risky. The part makes it reliable. D97.

#### PT7 Easy cars and hard cars

> "you could vary between easy cars (drones, easy), and hard cars (who are hard to catch, like bosses)"

- **Normal enemies:** drones and white cars. Predictable. Pay credits (`economy.creditsPerWriteOff`).
- **Bosses:** red cars. Adaptive. Pay progress.
- **Graze:** a white near-miss pays (`scoring.grazeRadius`, `scoring.grazePoints`). Shmup graze, §14.3.
- **Cost:** white encounters train the next red car (shadow mode, §14.2). Farming teaches the boss. D90.

#### PT8 Research 1: every way a car avoids you

> "Write out a list of all the ways cars can avoid hitting you IRL."

- §14.1.

#### PT9 Research 2: how Tesla, lidar and machine learning see

> "do real-world research how Tesla does calculation with computer vision, and do a gamified version"

- §14.2.

#### PT10 Research 3: chasing and being chased

> "Research games where you are chasing something, and games where you are being chased."

- §14.3.

#### PT11 Avoid the white cars, chase the red car

> "You are trying to avoid getting hit by some of the cars (white cars) but targeting the red car."

- The arcade loop: dodge the fleet, hunt one car. Battery is the third channel.
- White cars run fixed patterns. Read at a glance by shape and motion.
- The red car needs focal reading: sensor cue, envelope, commit.
- White and red differ on two channels (Edit 26 §4.2.2, rule 2).

#### PT12 Swerving has a cost

> "The cars would Swerve around you, and hit other cars. What is the cost of this?"

- Today cars never hit cars (row 84). Swerves need a clear route (§5.3).
- Real systems prefer braking; evasion risks a second crash (§14.1).
- **Duel:** no contact. A blocked escape forces a brake. That brake is an opening.
- **Traffic phase:** flag `traffic.carContact`.
  - A red swerve into a white car is an Incident (`scoring.incidentPoints`).
  - The red car then prefers braking.
- Lore fit: the dummy's job is to cause accidents (Edit 14 §3.1). D92.

#### PT13 Progressive intelligence and set pieces

> "There could be two two lane roads. Or expand into things like the trolley problem"

- **Roads:** two-way, two lanes each way (row 84, not built). Oncoming traffic prices a swerve.
- **Trolley set pieces:** the red car must choose between two obstacles.
  - Decoys (`props.decoy.<kind>`): a cat, a delivery robot, a client's custom dummy.
  - The car spares the higher-ranked body. It swerves into you.
  - Rank table `driver.valueRank`. The law sets it (PT15).
- **Persuaded dummies:** fellow trainees led into lanes. Needs NPC dummies; later.

#### PT14 Other zones

> "What other zones are possible? Like a free-for-all test centre with no specific roads?"

- **Proving Ground:** open tarmac, no lanes. The duel venue. Reinstates row 83's test centre. D94.
- **Car park:** slow cars, reversing, cover between bays.
- **Skid pan:** a wet circle; the boss drifts (`driver.avoid.drift`).
- **Two-way arterial:** oncoming lanes; swerve cost.
- **School crossing:** trolley set pieces.
- **Tunnel:** dark; the Vision boss weakens, the Fusion boss does not (§14.2).
- **Flyover stack:** attacks from above (`world.deckDropGaps`).

#### PT15 Story: every level teaches a sinister corporate law

> "For Story mode, more interesting story. Every level you need to learn about the sinister corporate law."

- Each level card adds one clause under the goal. The law escalates.
- Voice: Dummy Corporation. `style.v2.text.maxSentences` 2; `style.v2.text.maxWords` 20.
- Text in `content/story/story_v2.json`, key `law`. Style Guide V2 run before shipping. D95.
- **Draft clauses (proposed):**
  1. Clause 1. The vehicle under test must avoid you. You must not let it.
  2. Clause 2. Every collision is data. Data belongs to the Corporation.
  3. Clause 3. A dummy is not a pedestrian. Pedestrians cannot be replaced.
  4. Clause 4. When a vehicle must choose, it spares the costlier body.
  5. Clause 5. Certification is permanent. So is your contribution.

#### Rows and open decisions to record

| Row | Decision | Status |
|---|---|---|
| 648 | Prototype 10 is 1 vs 1: one red car, one dummy. Traffic returns after | user-directed (1 Nov) |
| 649 | From tier 1, standing in lane earns no hit from the red car | finding user-observed; rule proposed |
| 650 | Red ladder: L1 walk in, L2 flank, L3 above. L4–L5 proposed | user-proposed |
| 651 | White cars never learn; red cars learn, as bosses. After the duel | user-proposed |
| 652 | The battery note repeats row 644. No change | proposed |

| D | Question | Proposal |
|---|---|---|
| D89 | Red is the reserved warning hue | Keep red. Add shape: a roof sensor dome, a `VUT` tag. Warning keeps its icon shape |
| D90 | White cars: hazard, fodder or both | Both. Front hit costs chassis; graze pays; graze trains the boss |
| D91 | Tier order fixed or adaptive | Fixed L1–L5. After L5 the boss counters your last winning approach |
| D92 | Car-to-car contact (row 84) | None in the duel. `traffic.carContact` for the traffic phase |
| D93 | Flank hits pay `damage.zone.side` 0.3 | Red-car hits on the tier's opening use `damage.zone.front` (`duel.openingFullDamage` 1) |
| D94 | Duel venue | Proving Ground |
| D95 | A law clause per level | Yes; drafts above |
| D96 | Boss families | Vision (camera) first; Fusion (lidar) second |
| D97 | Parts as keys vs pillar 1 | A part-free opening stays at every tier, slower |

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

### 6.5 First outside playtest (1 November)

- Standing in lane earns hits. No reading needed. Pillar 1 fails (PT1).
- The QA personas (§6.1) never tested standing. The duel harness must (V0).
- Wanted: one smart car to beat, not many polite ones (PT3–PT5).

## 7 Proposed workstreams (revised 1 November; the new chat decides)

V = versus (1 vs 1). Measure first. Each change lands behind a flag, with a bot comparison before and after. Registry first (§4) precedes all tuning.

| # | Workstream | Delivers | Registry IDs (proposed) |
|---|---|---|---|
| V0 | **Duel harness** | Headless 1 vs 1. Policies: stand in lane, blind lunge, read and lunge, flank, jump or drop, cone, feint. A win table per tier | `qa.fun.*` |
| V1 | **Proving Ground** | Open tarmac, no lanes. The red car drives a seeded loop. Drone drop-in | `duel.enabled`, `duel.loop` |
| V2 | **Sensor tiers 0–4** | One sensor per level (PT4). Each closes one approach; one stays open | `duel.level.<n>.tier`, `perception.seesAirborne`, `perception.predictSeconds`; existing `perception.*` |
| V3 | **Avoidance ladder** | Brake, swerve, reverse, combined, accelerate, by time-to-collision band (§14.1) | `driver.ttc.*`, `driver.avoid.<manoeuvre>` |
| V4 | **Visible intelligence** | A cue per sensor; the safe envelope; tier notches on the tag; a retraining card between levels | `ui.sensorCue`, `ui.safeEnvelope`, `ui.seniorityPips` |
| V5 | **Duel levels L1–L5** | Level card: goal, new sensor, law clause. A part by drone per level | `duel.level.<n>.*`; `law` in `story_v2.json` |
| V6 | **White traffic** (after V0–V5 pass) | Non-learning hazards. Graze pays. Shadow mode trains the boss | `traffic.white.learns`, `scoring.grazeRadius`, `scoring.grazePoints` |
| V7 | **Swerve cost** | Car-to-car contact flag. Incident score. The boss then prefers braking | `traffic.carContact`, `scoring.incidentPoints` |
| W7 | **Jam watchdog** | Unchanged | `traffic.watchdogSeconds` |

- **Deferred until traffic returns:** W1 identity, W4 moods, W5 profiles.
- **Folded in:** W2 per-approach learning → V2 and D91. W3 visible learning → V4. W6 pacing reruns on the duel.
- **Acceptance:**
  - Stand in lane: 0 red hits at tier ≥ 1.
  - Each tier: its closed approach scores 0; its opening scores above 0.
  - Pillar 1: every tier keeps an opening an unupgraded dummy can use (D97).
  - Tier 4: no single policy dominates (V29 governance).
  - Reading beats repetition: read-and-lunge outscores blind lunge (V29 D2.1).

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
- **Decisions:** `DECISIONS.md` rows 1–656. Rows 648–656 and D89–D99 recorded 1 November (v2 §8). Next row 657; next open decision D100.
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
11. This handover, §3.2 and §14: the playtest and the research.

## 14 Research (1 November; PT8–PT10)

### 14.1 Every way a car avoids you (R1)

| # | Manoeuvre | Real use | DUMMIES ID | Red tier |
|---|---|---|---|---|
| 1 | Cover the brake | Reaction shortens | `proto.driver.coveredReaction` | 1 |
| 2 | Slow down | Caution near a person | `proto.driver.cautionSpeed` | 1 |
| 3 | Comfort brake | Planned stop | `traffic.comfortBraking` | 1 |
| 4 | Emergency brake (AEB) | Full deceleration | `traffic.hardBraking` | 1 |
| 5 | Stop and hold back | Gap before the person | `proto.standoffDistance`, `proto.learn.standoffStep` | 1 |
| 6 | Warn | Horn, headlight flash | `proto.honkSeconds`, `proto.art.noticeFlashHz` | 1 |
| 7 | Swerve | Evasive steering | `proto.swerveLength`, `proto.swerveOuter` | 2 |
| 8 | Brake and steer | Last resort | `driver.avoid.combined` (proposed) | 3 |
| 9 | Reverse | Back out of the conflict | `proto.unstick.reverseSpeed` | 3 |
| 10 | Creep past cover | Slow beside occluders | `driver.avoid.creep` (proposed) | 3 |
| 11 | Speed up through | Clear the crossing point first | `driver.avoid.accelerate` (proposed) | 4 |
| 12 | Reroute | Another road | `driver.avoid.reroute` (proposed) | 4 |
| 13 | Leave the lane | Kerb or shoulder, to avoid a crash | `driver.avoid.kerb` (proposed) | 4 |
| 14 | Give way | Wait for a gap | `traffic.giveWayGap` | all |
| 15 | Minimal-risk stop | Pull over, wait | `proto.driver.patienceSeconds` | all |
| 16 | Drift | Stunt only; no assistance system does it | `driver.avoid.drift` (proposed; boss flourish) | boss |

- **Real rules:**
  - Systems prefer braking. Evasion risks a second crash.
  - Steering alone works until about 0.6–0.67 s to collision. Brake and steer, about 0.5 s.
  - One driver study: 68% braked fully; 26% steered while braking; 6% did nothing.
  - Steering needs a free escape path.
- **Game rules:**
  - The red car climbs the same ladder: brake, swerve into free space, combined last.
  - Bands by time to collision: `driver.ttc.brake`, `driver.ttc.swerve`, `driver.ttc.combined` (proposed).
  - Block its escape path, and it must brake. That is a dummy tactic.

### 14.2 How cars see: vision, lidar, rules (R2)

- **Tesla (vision only).**
  - Cameras only. No radar, lidar or HD maps. One end-to-end network.
  - Occupancy network: eight cameras build one 3D grid. Each voxel is occupied or free, static or moving.
  - Patent published 12 March 2026: sub-voxels near edges; past frames fused; occupancy flow gives each voxel a velocity.
  - FSD v12: one network trained on millions of clips replaced 300k+ lines of C++.
  - Radar removed 2021, ultrasonics 2022. FSD v14.2 (April 2026) sharpened the vision encoder.
- **Waymo (sensor fusion).**
  - 6th generation: 13 cameras, 4 lidars, 6 radars, external microphones.
  - Lidar: its own laser pulses paint a 3D point cloud.
  - Imaging radar: distance, speed and size in any light or weather.
  - Microphones hear a siren's direction before cameras see it.
  - Machine-learned models fuse the sensors. The fleet's experience trains every car.
- **Mobileye RSS (rules, not learning).**
  - Safe gap: the follower stops even if the leader brakes fully.
  - Five rules: no rear-ending; no reckless cut-ins; right of way is given, not taken.
  - Evasion may break a road rule if it causes no other crash.
- **Euro NCAP (the test the game parodies).**
  - Articulated adult and child dummy targets cross the car's path.
  - One scenario: a child steps out from behind a parked car.
  - The tested car is the "vehicle under test" (VUT).

#### Gamified sensor stack

| Sensor | Real basis | On-screen cue | Opening | IDs |
|---|---|---|---|---|
| Forward camera | Tesla front cameras | Beam rectangle | Flanks; cover | `perception.forwardLength`, `proto.driver.cautionZone` |
| Surround | Side cameras, corner radar | Arcs at the nose | Above | `perception.sideRadius`, `perception.sideHalfAngle` |
| Occupancy grid | Tesla voxels | Lit pixel cells where the car thinks you are | Grid lag; what cover hides | `perception.seesAirborne`, `perception.voxelSize`, `perception.voxelUpdateSeconds` (proposed) |
| Prediction | Occupancy flow; end-to-end imitation | A ghost path ahead of you | The feint after commit | `perception.predictSeconds`, `traffic.commitHorizon` |
| Lidar | Waymo point cloud | A sweeping scan line | The gap between sweeps | `perception.lidarSweepSeconds` (proposed) |
| Radar | Speed and distance | Pulses on movers | A still dummy reads faint | `perception.radarMinSpeed` (proposed) |
| Microphones | Siren direction | A ring when you run | Walk, don't run | `perception.hearRadius` vs `movement.runSpeed`, `movement.walkSpeed` |
| Safe envelope | RSS safe gap | A bubble ahead of the car | Enter faster than it can stop | `ui.safeEnvelope` (proposed) |

- **Envelope** = speed × `perception.reactionDelay` + speed² ÷ (2 × `traffic.hardBraking`).
  - Sedan at `vehicles.sedan.cruiseSpeed` 138: 41 + 121 = 162 units (P1.7 overrides: 0.3 s, 79).
  - `movement.lungeDistance` is 164. A dash from the bubble's edge just lands.
- **Two boss families (D96):**
  - **Vision** (Tesla-like): camera, occupancy, prediction. Weak in the dark and behind cover.
  - **Fusion** (Waymo-like): lidar, radar, microphones. Sees in the dark. Obeys RSS strictly.
    - It never causes a second crash. Box it in with white cars.
- **Learning made visible:**
  - A retraining card between levels replays your winning hit. Then the new sensor installs.
  - Shadow mode: white cars log your hits as the boss's training data (D90).

### 14.3 Chasing and being chased (R3)

| Game | Loop | Take for DUMMIES |
|---|---|---|
| Frogger, Crossy Road | Cross patterned traffic | White cars as readable hazards |
| Pac-Man | Four chasers, four rules; a pellet flips the hunt | Each enemy type has one legible rule |
| GTA (wanted stars) | Pursuit escalates with your crimes | Tiers announced as stars |
| Metal Gear Solid | Vision cones; alert states | Sensor cues; noticed, alert, committed |
| Chase H.Q. | Ram one target car through traffic, on a timer | One red car among white |
| Burnout (Takedowns, Crash) | Reward for causing crashes | Incident scoring (PT12) |
| Shadow of the Colossus | One boss; climb it | Attack from above (L3) |
| Touhou, bullet hell | Dodge patterns, shoot the boss; graze pays | White = bullets, red = boss, graze |
| Robotron 2084 | Dodge a swarm, reach targets | Two attention channels |
| Shadow of Mordor (Nemesis) | Enemies remember how you beat them | Recurring red models with scars |
| Metal Gear Solid V | Enemy gear adapts to your tactics | One visible counter per learned approach |
| Alien: Isolation | The hunter gains behaviours as you repeat tricks | Counters unlock from your play (D91) |
| Super Mario | Stomp works; spiked enemies refuse it | A tier refuses one approach |
| Zelda dungeons | The dungeon's item beats its boss | The level's part opens its tier (PT6) |

- **Rules for DUMMIES:**
  - One target, many hazards. Never two targets.
  - Hazards never learn. The target always does, visibly.
  - Announce each adaptation in a cue before it bites.
  - Near-misses pay: grazing makes avoiding active.
  - The verb gates the boss. The boss never gates all verbs.

### 14.4 Sources

- Tesla occupancy patent (2026): https://www.notateslaapp.com/news/3864/how-tesla-fsd-works-part-5-modeling-a-physical-world-without-lidar
- Tesla FSD v12 end-to-end: https://www.notateslaapp.com/news/1842/first-look-at-teslas-fsd-beta-v12-1-video
- Elluswamy on end-to-end, occupancy: https://ceointerviews.ai/interview/721772/
- Tesla vision-only timeline: https://www.basenor.com/blogs/news/teslas-vision-only-fsd-why-cameras-beat-lidar
- Waymo 6th generation (2024): https://waymo.com/blog/2024/08/meet-the-6th-generation-waymo-driver/
- Waymo 6th generation sensors (2026): https://waymo.com/blog/2026/02/ro-on-6th-gen-waymo-driver
- Waymo microphones: https://cleantechnica.com/2026/02/13/6th-generation-waymo-driver-launches-into-life/
- Mobileye RSS: https://www.mobileye.com/responsibility-sensitive-safety/ · https://www.mobileye.com/blog/rss-explained-the-five-rules-for-autonomous-vehicle-safety/ · https://static.mobileye.com/website/corporate/rss/rss_on_nhtsa.pdf
- Euro NCAP AEB VRU protocol: https://cdn.euroncap.com/media/53153/euro-ncap-aeb-vru-test-protocol-v302.pdf · scenarios: https://www.businesscar.co.uk/?p=13488
- Braking preferred over evasion: https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/8918255
- Time-to-collision thresholds: https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9514647
- Driver evasion study (TUM/Bosch): https://mediatum.ub.tum.de/doc/1142232/951441.pdf
- Escape paths and evasion: https://export.arxiv.org/pdf/2505.14842
- §14.3 games: design knowledge, not web sources.
