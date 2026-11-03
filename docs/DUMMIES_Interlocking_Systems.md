# DUMMIES — Interlocking Systems (running document)

**Started 3 November 2026 · Lawrence Lek** · Living reference for the level redesign. Every Prototype 10 test and level edit updates it. Row 710.

- **Five factors:** character control and abilities; car behaviour and abilities; emergent group behaviour; level design; moveable objects.
- **Rule:** a change to one factor lists its effect on the other four (§0).
- **Values:** registry IDs at the 10.7 build. Derived values name their inputs. IDs marked *unregistered* need registering before use.
- **Sources:** handover v2 §14, §20–§23; GDD Edits 101–107; `DECISIONS.md` rows 648–710.

## 0 The interlock

Read across: what the row's factor sets for the column's.

| Sets → | 1 Character | 2 Car | 3 Group | 4 Level | 5 Objects |
|---|---|---|---|---|---|
| **1 Character** | — | Dash reach sets the car's envelope and stop line | Each verb needs a group answer: queues, boxing in | Reach and speed set cover spacing and spot distance | Carry, push and throw set what moves, how far |
| **2 Car** | Each rung closes one verb; the next part reopens one | — | A red car's stop blocks a lane; its memory may spread | Sensor geometry sets cover length, height and camera posts | Rung 4 swerves round cones; rung 5 stops; rung 6 remembers spots |
| **3 Group** | White cars are hazards and moving cover | White cars price the red car's swerve and box it in | — | Lanes, two-way roads, priority, spawn rates | Queued cars are obstacles; drones tidy up |
| **4 Level** | Routes, heights, hiding spots | Sightlines, run-in, camera reach | Throughput: lanes, junction priority | — | Object homes, drone access, room to move |
| **5 Objects** | The dummy's tools | Road items to read; occluders by height | A lane block makes a queue | Moveable cover rewrites the level | — |

## 1 Character control and abilities

### 1.1 Verbs as built (test road, 10.7)

| Verb | Input | Values | Arrives |
|---|---|---|---|
| Walk, run | Stick, arrows | `movement.walkSpeed` 81, `movement.runSpeed` 162 | Start |
| Dash | Space, A | `movement.lungeDistance` 164 over `movement.lungeDuration` 0.3; `abilities.battery.dashCharges` 1 | Battery 1 (10.2) |
| Jump | K, B | `abilities.legs.airtimeBase` 0.3; tops `world.jumpableHeight` 20 | Legs 1 (10.3) |
| Carry, lay a cone | E, X | `upgrades.carrySpeed` 0.85; one cone | Hands 1 (10.5) |
| Duck | Hold C, LB/RB | `body.duckHeight` 6 vs `proto.art.dummyHeight` 18; `movement.duckSpeedFactor` 0.35; noticed × `perception.duckNoticeFactor` 1.5 | DUCK (10.6) |

- **Body:** `proto.health.standard` 500 on the test road (row 706). `body.radius` 13.
- **Wear:** leg damage shortens the dash (`proto.parts.legDashLoss` 1.5) and slows the run (`proto.parts.legSpeedLoss` 1).
- **Height classes:** ducked 6; standing 18; on the plinth +20; in a jump, its arc.

### 1.2 Verbs built elsewhere, not in the duel

| Verb | Values | Where |
|---|---|---|
| Push off a car | `abilities.arms.pushSpeed` 160, `abilities.arms.pushReach` 10 | Prototype 6.10 and Story, Arms 1 (Edit 80) |
| Throw a cone | `upgrades.throwDistance` 120 | Story, Arms 2 |
| Hitch a ride | `abilities.arms.hitchSeconds` 1.5, `abilities.arms.hitchMinSpeed` 30 | Story, Arms 3 |
| More cones | `abilities.arms.conesPerLevel` 1 a level | Story |

### 1.3 Interlocks

- **Dash reach (177: `movement.lungeDistance` + `body.radius`) exceeds a road** (two lanes of `world.laneWidth` 56). Only a standstill (`duel.standstillSpeed` 5) prevents damage (row 668).
- **Speed beats notice.** A run during `perception.sideNoticeSeconds` 0.6 plus a dash reaches about 274. The field ends near 202. The sprint lands (D115).
- **The body closes its own trick.** After four leg hits the dash falls from 164 to 116; the sprint stops landing.
- **Ducking is stealth, not armour.** Hidden behind cover taller than the body; higher sensors see in sooner as they near (§2.3).
- **A lighter body speeds the loop.** 500 against front hits of 242: two hits a write-off (D119).

## 2 Car behaviour and abilities

### 2.1 The ladder as built

| Rung | Sense | Values | Closes | Leaves open | Dummy's part |
|---|---|---|---|---|---|
| 0 | None | — | — | Walking in | On foot |
| 1 | Forward camera | `perception.forwardLength` 720; envelope; hard stop at `traffic.hardBraking` 79 | The front | The flank | Battery 1 |
| 2 | Side sensors | `proto.driver.cautionZone` 180; `perception.sideNoticeSeconds` 0.6 | The open flank | Height, cover | Legs 1 |
| 3 | Roof lidar | `perception.lidarHeight` 26 (rungs 1–2: `perception.sensorHeight` 14) | The plinth, the jump | Cover | — |
| 4 | Street cameras | `perception.streetCameraRange` 180; `perception.streetCameraHeight` 60 | Watched cover | A cone's swerve | Hands 1 |
| 5 | Road items | Stops at a cone; waits `proto.droneConeSeconds` 5 for FARSIGHT | The cone bait | Low cover | DUCK |
| 6 | Crash memory | `duel.memoryRadius` 50; `duel.memorySites` 3 | A repeated spot | Any other spot | — |

- **Always open:** the sprint from past the field (D115).
- **Planned (handover v2 §14.2):** 10.8, white sedans that never learn (`traffic.white.learns`, *unregistered*). 10.9, swerve cost (`traffic.carContact`, *unregistered*).

### 2.2 The safe envelope

- **At a standstill: 226** (derived: `perception.reactionDelay` 0.3 × `movement.runSpeed` 162 + `movement.lungeDistance` 164 + `body.radius` 13). It exceeds reach 177: a stop line is safe.
- **At cruise: 671** (`vehicles.sedan.cruiseSpeed` 138). The beam (720) clears it.
- **It sets the run-in.** A car must not appear inside its own envelope. 10.7: `duel.runInLength` 200 plus the spawn-speed rule (row 706).

### 2.3 Sight by height

- **A sightline is blocked where it crosses cover at or below the line's height.**
- **Eyes:** sensors 14 (rungs 1–2), lidar 26 (rung 3 up), cameras 60.
- **Bodies:** ducked 6, standing 18, plinth +20.
- **Low cover:** `props.planter.height` 14. Hides a ducked dummy; a standing one always shows over it.
- **Higher eyes see in sooner.** The lidar and the cameras clear low cover closer to it than the sensors at 14 do.

### 2.4 What it shows (row 701)

- Every learned behaviour draws on the car and on the road.
- Beam and field zones; the notice meter; camera links; EXPECTED; memory rings, scans and CHECKING.

### 2.5 Pace

- **Return:** `duel.redReturnSeconds` 2. **Run-in:** `duel.runInLength` 200. 7.9 cars a minute.
- **Lesson beats:** `duel.lessonClipSeconds` 3, `duel.lessonHoldSeconds` 0.8, `duel.lessonFitSeconds` 2.

## 3 Emergent group behaviour

### 3.1 What exists

- **Test road:** one red car (`duel.carsOnRoad` 1). No group yet.
- **Prototype 9 and Story:** white traffic, queues, give-way, roundabouts. Honks after `proto.honkSeconds` 5.
- **Learning by model (built; off in Prototype 9):** cars of one model share what they learn (`learning.playerHitStep` 0.08 a hit, to `learning.playerHitCap` 0.4).
- **Shared sensing:** rung 4's street cameras feed the car (Shenzhen's vehicle-road-cloud pilot).
- **Third parties:** FARSIGHT drones fetch cones (`proto.droneConeSeconds` 5) and deliver parts (`proto.droneSpeed` 240).

### 3.2 Candidate group behaviours

| Behaviour | Factors | Real basis | Status |
|---|---|---|---|
| White cars queue behind a red car waiting for the dummy | 2, 3, 4 | Cones stop robotaxis, 2023 (v2 §4.2) | Untested |
| Honk chains down the queue | 3 | Waymo cars honking at each other, 2024 | Untested |
| A red swerve into a white car is an Incident | 2, 3 | Real systems prefer braking | 10.9 |
| White cars box in the red car's escape | 2, 3, 4 | — | 10.9 |
| Red cars of a model share crash memory | 2, 3 | Prototype 9's learning by model | Q2 |
| White cars as moving cover | 1, 3, 5 | Height: `vehicles.sedan.height` 19.8 | Q3 |
| Drones tidy objects back to their homes | 3, 5 | — | Cones only |

### 3.3 Risks

- **Stalemate.** A car waiting for a dummy in its field waits forever (rows 688, 699). A queue behind it multiplies the cost.
- **Deadlock.** v1 W7's watchdog applies once cars meet cars.
- **Noise.** Each group cue must read at a glance beside the red car's display.

## 4 Level design

### 4.1 The test road as built (Monument junction, `world.width` 800 × `world.height` 640)

| Element | What it does | Matters at rung |
|---|---|---|
| Two one-way roads, two lanes each | Lanes of `world.laneWidth` 56 | All |
| The plinth | A raised edge (`world.jumpableHeight` 20) | 2 open, 3 closed |
| The corner building | Tall cover; hides each road from the other | 2 closed by the field |
| The barrier and its gap | Cover by road A | 3 open, 4 closed |
| Three camera posts | Watch the cover within `perception.streetCameraRange` 180 | 4 up |
| Three cone homes | Where the cones start and drones return them | 4–5 |
| Three planter rows (`duel.planters` 1) | Low cover; planters of `world.gardenPlanter` 40 | 5–6 |
| Screen edges | The run-in; the spawn-speed rule | All |

### 4.2 Rules learned

- **L1. Cover must run up the road the car comes from.** The field sees 720 ahead; a single planter hid a ducked dummy only from a car abreast (row 696).
- **L2. A camera watches only the cover near its post** (D118). Place posts per piece of cover, not per junction.
- **L3. Hiding spots need spacing.** At least `duel.memorySites` + 1 per road, about 60 apart (row 708).
- **L4. Cover within reach of a lane.** Spots must sit within 177 of the lane they ambush.
- **L5. The run-in sets the pace.** It was half of every pass at 771 (row 702).
- **L6. Every rung needs its opening in the level.** A plinth for rung 2; cover for 3; cone homes for 4; low cover for 5; spots for 6.
- **L7. An opening without a part stays** (pillar 1, D97): today, the sprint from past the field.

### 4.3 Redesign checklist (proposed)

- [ ] One change a level (row 653).
- [ ] The level's rung has an opening and a part where the problem is.
- [ ] ≥ 4 hiding spots per road, about 60 apart, within reach of a lane.
- [ ] Each low row runs back up its road; spots stay hidden until the car is in reach.
- [ ] Camera posts name the cover they watch.
- [ ] An opening without a part.
- [ ] Pace: the main opening writes off a body in at most 80 s (Edit 18 §10.2).
- [ ] Drone access to every object home.
- [ ] No stalemate the dummy cannot leave.

### 4.4 Venues to test against (v1 PT14)

| Venue | Stresses |
|---|---|
| Proving Ground: open tarmac | Car (no lanes), objects |
| Car park | Group (slow, reversing), cover between bays |
| Two-way arterial | Group: oncoming traffic prices a swerve |
| School crossing | Car: priority choices (trolley set pieces, PT13) |
| Tunnel | Car: sensors weaken by type |
| Flyover stack | Character: attacks from above |

## 5 Moveable objects

### 5.1 Inventory

| Object | Moves? | Who moves it | Height | Car's reading |
|---|---|---|---|---|
| Cone (`props.cone.radius` 7.2) | Yes | Dummy (carry, lay, punt; Story: throw); drones fetch from lanes | Not an occluder | Rung 4 swerves; rung 5 stops and waits |
| Planter (`world.gardenPlanter` 40) | No (proposed: push with Arms, §20.2) | — | `props.planter.height` 14 | Low cover by height |
| Barrier | No | — | Tall | Cover; cameras see past it |
| Sculpture (`world.sculptureScaleLarge` 2) | No (Lawrence, 2 November: move planters and sculptures to hide behind) | — | By size | Not yet cover |
| Decoys (`props.decoy.<kind>`, *unregistered*) | Planned (PT13) | — | — | A priority choice |
| Crash outlines | No; persist | — | Flat | Rung 6's memory marks |

### 5.2 Interlocks

- **Anything in a lane is a road item.** Rung 5 stops for it. The car blocks its lane meanwhile: a queue once traffic returns.
- **Moving cover makes new spots.** It answers rung 6. Q1 decides whether memory follows spots or cover.
- **Cover height sets how close a sensor gets before it sees over.** A body taller than the cover always shows. Taller cover holds out the lidar (26) and the cameras (60) longer.
- **Drone time is pace.** Each fetch takes `proto.droneConeSeconds` 5 plus flight at `proto.droneSpeed` 240.
- **Untested (D57):** long throws off rails; four-cone walls that stop a lane.

### 5.3 Rules needed

- Weight classes: what the dummy moves by hand, by push, never.
- Who moves objects: dummy, drones, cars (bumps).
- Persistence: where objects reset, and when.
- Height class per object, in the registry.

## 6 Findings log

| # | Finding | Factors | Row |
|---|---|---|---|
| F1 | Dash reach 177 exceeds a road; only a standstill prevents damage | 1, 2 | 668 |
| F2 | The standstill envelope 226 exceeds reach 177: the stop line is safe | 1, 2 | 669 |
| F3 | Slowing past blind spots cannot close cover: a gap dash crosses a lane in under 0.1 s | 1, 2, 4 | 690 |
| F4 | The sprint from past the field lands; leg wear ends it after four hits | 1, 2 | 691 |
| F5 | A cone's swerve holds: the car ignores its field meanwhile | 2, 5 | 689 |
| F6 | Single planters fail against a 720 field; rows up the road work | 2, 4, 5 | 696 |
| F7 | Camera range decides which cover is watched | 2, 4 | 697 |
| F8 | Standing shows over a planter; ducked hides; higher sensors see in close | 1, 2, 4, 5 | 697 |
| F9 | The run-in was half of each pass | 2, 4 | 702 |
| F10 | A short run-in needs the spawn-speed rule | 2, 4 | 706 |
| F11 | Crash memory needs ≥ 4 spots per road, about 60 apart | 2, 4 | 708 |
| F12 | An expert mover writes off a body every 18 s (500 body, 242 a hit) | 1, 2 | 707 |
| F13 | The sprint lands from a remembered spot: noticed at once, too late to stop | 1, 2 | 707 |
| F14 | A waiting car and a waiting dummy make a stalemate | 2, 3 | 688, 699 |

## 7 Open questions

- **Q1.** Does rung 6 remember spots, or the cover behind them? Matters once cover moves.
- **Q2.** Is crash memory per car or per model (fleet learning)?
- **Q3.** Are white cars cover? A sedan (`vehicles.sedan.height` 19.8) is taller than the sensors (14) and either body; the lidar (26) sees over it unless it stands close to the dummy (§2.3).
- **Q4.** Who moves objects: the dummy, drones, cars?
- **Q5.** What does a red car waiting for the dummy do to the traffic behind it?
- **Q6.** Do crash outlines persist across levels or sessions, as level history?
- **Q7.** When do Story's Arms verbs (push, throw, hitch) enter the duel?
- **Linked decisions:** D57, D97, D115, D119, D120.

## Change log

| Date | Change | Row |
|---|---|---|
| 3 November 2026 | Started at the 10.7 build: five factors, interlock table, findings F1–F14, questions Q1–Q7 | 710 |
