# DUMMIES — Interlocking Systems (running document)

**Started 3 November 2026 · Lawrence Lek** · Living reference for the level redesign. Every Prototype 10 test and level edit updates it. Row 710.

- **Five factors:** character control and abilities; car behaviour and abilities; emergent group behaviour; level design; moveable objects.
- **Rule:** a change to one factor lists its effect on the other four (§0).
- **Control table (§8):** every object type: what hides, obstructs, is remembered, resets. Stealth research in §9.
- **Values:** registry IDs at the 10.8 build. Derived values name their inputs. IDs marked *unregistered* need registering before use.
- **Sources:** handover v2 §14, §20–§25; GDD Edits 101–108; `DECISIONS.md` rows 648–722.

## 0 The interlock

Read across: what the row's factor sets for the column's.

| Sets → | 1 Character | 2 Car | 3 Group | 4 Level | 5 Objects |
|---|---|---|---|---|---|
| **1 Character** | — | Dash reach sets the car's envelope and stop line | Each verb needs a group answer: queues, boxing in | Reach and speed set cover spacing and spot distance | Carry, push and throw set what moves, how far |
| **2 Car** | Each rung closes one verb; the next part reopens one | — | A red car's stop blocks a lane; its memory may spread | Sensor geometry sets cover length, height and camera posts; the search radius sets how far a row must run | Rung 4 swerves round cones; rung 5 stops; rung 6 remembers spots; rung 7 searches round its ghost |
| **3 Group** | White cars are hazards and moving cover | White cars block the red car's sight and path; queued cars flash their lights at it | — | Lanes, two-way roads, priority, spawn rates | Queued cars are obstacles; drones tidy up |
| **4 Level** | Routes, heights, hiding spots, parked cars | Sightlines, run-in, camera reach | Throughput: lanes, junction priority | — | Object homes, drone access, room to move |
| **5 Objects** | The dummy's tools | Road items to read; occluders by height | A lane block makes a queue | Moveable cover rewrites the level | — |

## 1 Character control and abilities

### 1.1 Verbs as built (test road, 10.8)

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
- **Crawling is the answer to the search.** At `movement.duckSpeedFactor` 0.35 a ducked crawl beyond `duel.searchRadius` 60 takes about 2 s (row 720).
- **The player's own escalation: the stealth grade** (rows 725, 728). Each strike scores its damage × its grade: UNSEEN × `scoring.stealthUnseen` 3, LOST × `scoring.stealthLost` 2, SEEN × `scoring.stealthSeen` 1. It rises with skill whatever the car's rung; power and stealth both pay.
- **Lure: a verb made from the car's learning** (row 726). Stand where it expects you; it stops short. Strike from elsewhere. The page draws its stop line.

## 2 Car behaviour and abilities

### 2.1 The ladder as built

| Rung | Sense | Values | Closes | Leaves open | Dummy's part |
|---|---|---|---|---|---|
| 0 | None | — | — | Walking in | On foot |
| 1 | Forward camera | `perception.forwardLength` 720; envelope; hard stop at `traffic.hardBraking` 79 | The front | The flank | Battery 1 |
| 2 | Side sensors | `proto.driver.cautionZone` 180; `perception.sideNoticeSeconds` 0.6 | The open flank | Height, cover | Legs 1 |
| 3 | Roof lidar | `perception.lidarHeight` 26 (rungs 1–2: `perception.sensorHeight` 14) | The plinth, the jump | Cover | — |
| 4 | Street cameras | `perception.streetCameraRange` 180; `perception.streetCameraHeight` 60; `perception.streetCameraFov` 60 from 10.8 (row 723), panning `perception.streetCameraPanArc` 60 (row 724) | Watched cover, within each cone | A cone's swerve; cover outside the cones; the pan's window | Hands 1 |
| 5 | Road items | Stops at a cone; waits `proto.droneConeSeconds` 5 for FARSIGHT | The cone bait | Low cover | DUCK |
| 6 | Crash memory | `duel.memoryRadius` 50; `duel.memorySites` 3 | A repeated spot from cover, while the cover stays | Any other spot; a spot with new cover (row 712); hits from the open (row 713) | — |
| 7 | Search (row 717) | `duel.searchRadius` 60; `duel.searchSeconds` 4 | Seen, then hidden: a ghost where it lost you; stops short; finds you near it | Crawl beyond the ring; hide before it sees you | — |

- **Always open:** the sprint from past the field (D115). It leaves no spot (row 713).
- **Planned (handover v2 §14.2, revised by row 717; D121):** 10.9, two-way roads and white sedans that never learn (`traffic.white.learns`, *unregistered*). 10.10, swerve cost (`traffic.carContact`, *unregistered*).
- **Order of precedence at rung 7:** memory, then the search. At a remembered spot the dummy is expected and never lost: no ghost (row 717).

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
- Rung 7 (row 719): the amber ghost, its ring and time arc; the beacon; SEARCHING, FOUND. Amber is the search's colour; red stays memory's.

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
| Queued cars flash their lights at the waiting red car | 2, 3 | The notice cue exists: `proto.art.noticeFlashHz` 4 | Decided (row 711); test with the group |
| Honk chains down the queue | 3 | Waymo cars honking at each other, 2024 | Untested |
| A red swerve into a white car is an Incident | 2, 3 | Real systems prefer braking | 10.9 |
| White cars box in the red car's escape | 2, 3, 4 | — | Decided (row 711): white cars block it; 10.9 |
| Red cars of a model share crash memory | 2, 3 | Prototype 9's learning by model | Q2 |
| White cars as moving cover | 1, 3, 5 | Height: `vehicles.sedan.height` 19.8 | Decided (row 711): they block its sight |
| Parked cars as cover | 1, 4, 5 | Kerbside parking hides pedestrians from drivers | Decided (row 711) |
| Drones tidy objects back to their homes | 3, 5 | — | Cones only |

### 3.3 Risks

- **Stalemate: solved (row 715).** A car kept waiting `duel.blockSeconds` (10) by the dummy or its cone calls FARSIGHT. A drone lifts the dummy to the side of the road, holds it until the car has left, and puts it down. Queued cars flash their lights meanwhile (row 711).
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
| Three camera posts | Watch the cover within `perception.streetCameraRange` 180, in a cone of `perception.streetCameraFov` 60 along it (row 723), panning across `perception.streetCameraPanArc` 60 (row 724) | 4 up |
| Three cone homes | Where the cones start and drones return them | 4–5 |
| Three planter rows (`duel.planters` 1) | Low cover; planters of `world.gardenPlanter` 40 | 5–6 |
| Screen edges | The run-in; the spawn-speed rule | All |

### 4.2 Rules learned

- **L1. Cover must run up the road the car comes from.** The field sees 720 ahead; a single planter hid a ducked dummy only from a car abreast (row 696).
- **L2. A camera watches only the cover near its post** (D118). Place posts per piece of cover, not per junction.
- **L2a. A camera looks one way** (row 723). Aim each along its cover. What lies outside every cone is the level's blind side: place it on purpose.
- **L2b. A panning camera sets a rhythm** (row 724). Phase paired cameras so their windows coincide, or so one always watches. The level chooses.
- **L3. Hiding spots need spacing.** At least `duel.memorySites` + 1 per road, about 60 apart (row 708).
- **L4. Cover within reach of a lane.** Spots must sit within 177 of the lane they ambush.
- **L5. The run-in sets the pace.** It was half of every pass at 771 (row 702).
- **L6. Every rung needs its opening in the level.** A plinth for rung 2; cover for 3; cone homes for 4; low cover for 5; spots for 6; room to crawl out of the ring for 7.
- **L7. An opening without a part stays** (pillar 1, D97): today, the sprint from past the field.
- **L8. Parked cars are cover** (row 711). A kerbside parking lane runs up the road: L1's cover, built in. Taller than a standing dummy (`vehicles.sedan.height` 19.8 against 18).
- **L9. Rows longer than the search ring leave the crawl open** (row 720). A row that runs more than `duel.searchRadius` 60 past a spot lets a seen dummy crawl out of the ring. Shorter rows, or rows broken by gaps, close it.
- **L11. Keep two open ways in at every rung** (row 727). A way is open at 0.3 hits a minute at the top rung. Each new part opens a way that uses it.
- **L12. Every lure needs a strike spot beyond the ring, downstream** (row 726). A remembered spot or a ghost parks the car; the level must leave somewhere to strike from.
- **L10. A ghost off the road stops the car short of it, wherever that falls.** Beside a junction, the stop line can land in the junction box (10.8 shots). With crossing traffic it blocks the other road.

### 4.3 Redesign checklist (proposed)

- [ ] One change a level (row 653).
- [ ] The level's rung has an opening and a part where the problem is.
- [ ] ≥ 4 hiding spots per road, about 60 apart, within reach of a lane.
- [ ] Each low row runs back up its road; spots stay hidden until the car is in reach.
- [ ] Camera posts name the cover they watch, and their aim (L2a).
- [ ] An opening without a part.
- [ ] Rows sized against `duel.searchRadius`: decide whether the crawl is open (L9).
- [ ] No hiding spot puts a search stop line inside a junction box (L10).
- [ ] At least two open ways in at every rung, by the probes (L11).
- [ ] Each lure spot has a strike spot downstream, beyond `duel.searchRadius` (L12).
- [ ] Pace: the main opening writes off a body in at most 80 s (Edit 18 §10.2).
- [ ] Drone access to every object home.
- [ ] No stalemate: the block lift (`duel.blockSeconds`, row 715) ends any wait.

### 4.4 Venues to test against (v1 PT14)

| Venue | Stresses |
|---|---|
| Proving Ground: open tarmac | Car (no lanes), objects |
| Car park | Group (slow, reversing); parked cars as cover between bays (row 711) |
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
| Parked car (`vehicles.sedan.height` 19.8) | Yes: leaves and arrives, seen coming (row 712) | Its own driver | Taller than either body | Cover (row 711); its spot's memory goes when it leaves (row 712) |
| White car (`vehicles.sedan.height` 19.8) | Yes, in traffic | Traffic | Taller than either body | Moving cover; blocks the red car's sight and path (row 711) |
| Crash outlines | No; persist | — | Flat | Rung 6's memory marks |

### 5.2 Interlocks

- **Anything in a lane is a road item.** Rung 5 stops for it. The car blocks its lane meanwhile: a queue once traffic returns.
- **Cars are cover** (row 711). Parked cars hold still; white cars move, and their cover moves with them.
- **Only cover makes a spot** (row 713). A hit from the open was skill: an outline, no memory.
- **Memory follows cover** (row 712). A remembered spot belongs to the cover that hid the dummy.
  - The cover leaves: the car forgets the spot.
  - New cover arrives there: a fresh spot, hit once before it is remembered.
  - Static cover (planters) never leaves: its spots behave as built.
- **Parking turnover refreshes spots.** Arrivals reset the habit counter on the kerb. Turnover rate sets how often (to register).
- **Cover height sets how close a sensor gets before it sees over.** A body taller than the cover always shows. Taller cover holds out the lidar (26) and the cameras (60) longer.
- **Drone time is pace.** Each fetch takes `proto.droneConeSeconds` 5 plus flight at `proto.droneSpeed` 240.
- **Untested (D57):** long throws off rails; four-cone walls that stop a lane.

### 5.3 Rules needed

- Weight classes: what the dummy moves by hand, by push, never.
- Who moves objects: dummy, drones, cars (bumps).
- Persistence: where objects reset, and when.
- Arrival and departure cues for parked cars: the dummy sees them coming (row 712). IDs to register.
- Height class per object, in the registry.
- Cars as occluders in the sightline rule (§2.3). Not built: today only statics block sight.
- Memory follows a cover that moves (row 712). Built for static cover: each crash records the cover that hid the dummy (row 713); nothing moves yet.

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
| F13 | ~~The sprint lands from a remembered spot~~ Superseded: a hit from the open leaves no spot | 1, 2 | 707, 713 |
| F15 | Skill and habit separate: cover makes a habit the car can learn; the open stays the player's judgement | 1, 2, 4 | 713 |
| F16 | Stalemates hid openings. With the block lift, closed bots meet 2–3 cars a minute, not 0.3; the flank from open pavement lands 0.4 a minute (the sprint from past the field, D115) | 2, 3 | 715 |
| F14 | A waiting car and a waiting dummy make a stalemate | 2, 3 | 688, 699 |
| F17 | Seen-then-hidden closes at rung 7: 28 searches, 28 found, 0 hits | 1, 2 | 720 |
| F18 | The crawl beyond the ring along a row lands 1.89 a minute: rows need sizing (L9) | 1, 2, 4 | 720 |
| F19 | Roaming between free spots falls from 6.97 to 2.52 a minute: walks in view leave ghosts. Its pace, 55 s a write-off, meets the target | 1, 2, 4 | 720 |
| F20 | Memory outranks the search: at a remembered spot the dummy is never lost, so no ghost | 2 | 717 |
| F21 | A ghost off the road can stop the car in the junction box (L10) | 2, 3, 4 | 719 |
| F22 | All-round cameras made play "super difficult" (Lawrence). 60° cones leave blind sides; the bots barely move, a human gains most | 2, 4 | 723 |
| F23 | A camera's cone edge makes it lose the dummy often: searches rise 564 to 779; the cone bait sets 647 ghosts | 2 | 723 |
| F24 | The pan opens the barrier's gap: 0.07 to 0.47 a minute, by a bot that does not time it | 1, 2, 4 | 724 |
| F25 | The grade sorts the ways in: the sprint grades UNSEEN 18 of 18; the open-ground flank SEEN 9 of 9 | 1, 2 | 725 |
| F26 | The lure lands: 18 lured cars, 18 struck, 225 a hit. A stopped car restarts fast enough | 1, 2, 4 | 726 |
| F27 | Roaming beats the lure for a bot: 6.8–7.05 a minute against 4.1–4.8 at rung 6; 2.59 against 2.17 at rung 7. The lure buys control, not rate | 1, 2 | 726 |
| F28 | 10.5 and 10.6 sat on the floor of two open ways in | 1, 2, 4 | 727 |
| F29 | Damage × grade reorders the ways in: roaming 635 a hit, the lure 529, the crawl 370; the UNSEEN sprint only 158 (53 damage) | 1, 2 | 728 |

## 7 Open questions

- **Q1.** ~~Does rung 6 remember spots, or the cover behind them?~~ **Answered (row 712):** the cover. A parked car that drives off takes the memory with it. A new car parking there makes a fresh spot.
- **Q2.** Is crash memory per car or per model (fleet learning)?
- **Q3.** ~~Are white cars cover?~~ **Answered (row 711):** yes. Parked cars count; white cars block the red car. A sedan (19.8) is taller than the sensors (14) and either body; the lidar (26) sees over it unless it stands close to the dummy (§2.3).
- **Q4.** Who moves objects: the dummy, drones, cars?
- **Q5.** ~~What does a red car waiting for the dummy do to the traffic behind it?~~ **Answered (row 711):** the cars behind flash their lights. Test under group behaviour.
- **Q6.** Do crash outlines persist across levels or sessions, as level history?
- **Q7.** When do Story's Arms verbs (push, throw, hitch) enter the duel?
- **Q8.** ~~Do parked cars leave and arrive?~~ **Answered (row 712):** yes; the dummy sees them coming. Open: how often (turnover rate, to register).
- **Q9.** ~~One-way or two-way roads?~~ **Answered (row 712):** white cars block the red car on one-way roads too. They first appear with two-way roads: 10.9 since row 717 (D121).
- **Q10.** ~~Does a crash from the open leave a spot?~~ **Answered (row 713):** no. It was skill from a player who judged it right. 10.7 amended.
- **Q11.** Does a ghost pass to the cars behind, or to the fleet (Q2)? Today each red car keeps its own.
- **Linked decisions:** D57, D97, D115, D119, D120, D121, D122.

## 8 The control table: what hides, obstructs, is remembered, resets (row 714)

One row per object type. Edit this table first; the sections above follow it.

- **Hides:** blocks a car's sight of the dummy. Eyes: sensors `perception.sensorHeight` 14 (rungs 1–2), lidar `perception.lidarHeight` 26 (rung 3 up), cameras `perception.streetCameraHeight` 60.
- **Obstructs:** blocks movement. D = the dummy; R = the red car.
- **Remembered:** rung 6 keeps a spot (`duel.memoryRadius` 50; the latest `duel.memorySites` 3), only from cover (row 713).
- **Resets:** what clears or restores it, and when.

### 8.1 Object types

| # | Object | Class | States | Hides | Obstructs | Remembered | Resets | Status |
|---|---|---|---|---|---|---|---|---|
| L1 | Road, lanes (`world.laneWidth` 56) | Landscape, static | — | No | Neither; lanes set R's paths | No | — | Built |
| L2 | Kerb | Landscape, static | — | No | Bounds R's swerve | No | — | Built |
| L3 | Plinth (`world.jumpableHeight` 20) | Landscape, raised | Behind it; on top | Behind: yes. On top: rungs 0–2 cannot see it; rung 3 can | D walks round; a jump tops it | No: height, not cover (row 685) | — | Built |
| L4 | Building | Landscape, tall | — | Yes, from every car eye; a camera sees past it within 180 of its post | D, R | Yes, as cover | Never moves | Built |
| L5 | Barrier and gap | Street furniture, tall | — | Yes; a camera sees past it within 180 of its post | D (walk and dash); the gap lets D through | Yes, as cover | Never moves | Built |
| L6 | Planter row (`props.planter.height` 14) | Street furniture, low | — | A ducked dummy only; higher eyes see in sooner | D's walk; a dash vaults it | Yes, as cover | Never moves | Built |
| L7 | Camera post | Street furniture | Watching (a cone of `perception.streetCameraFov`, panning across `perception.streetCameraPanArc`; rows 723–724); linked to R | No | No | No: it sees live, keeps nothing | — | Built |
| L8 | Sculpture (`world.sculptureScaleLarge` 2) | Street furniture | — | Not yet | — | — | — | Proposed moveable |
| M1 | Cone (`props.cone.radius` 7.2) | Moveable | Free; held; in flight; fetched | No | R: rung 4 swerves, rung 5 stops; D punts it | No | FARSIGHT fetches it from a lane after `proto.droneConeSeconds` 5, to its home | Built |
| M2 | Planter, pushed | Moveable | Still; moving | A ducked dummy | D | Yes; memory follows it (row 712) | Moved by D | Proposed (Arms) |
| M3 | Decoy (`props.decoy.<kind>`, *unregistered*) | Moveable | — | — | R: a priority choice | — | — | Planned (PT13) |
| V1 | Red car | Vehicle, learns | Cruising; braking; waiting; searching (rung 7); spent; away (lesson); off screen | No | D: a hit, or a touch below `duel.standstillSpeed` 5 | It is the one that remembers | Leaves the screen; back after `duel.redReturnSeconds` 2 | Built |
| V2 | White car (`vehicles.sedan.height` 19.8) | Vehicle, never learns | Moving; queued; flashing | Yes: moving cover (row 711) | R's sight and path; D (a hazard) | While it stays; memory leaves with it (row 712) | Drives on | Decided; arrives 10.9 (D121) |
| V3 | Parked car (`vehicles.sedan.height` 19.8) | Vehicle, still while parked | Arriving; parked; leaving | Yes (row 711) | D, R | While parked; a new car there is a fresh spot (row 712) | Leaves and arrives, seen coming (row 712) | Decided; not built |
| V4 | FARSIGHT drone (`proto.droneSpeed` 240) | Vehicle, air | Inbound; lowering; outbound; carrying a part or a cone; lifting the dummy (row 715) | No | No | No | Leaves the screen | Built |
| C1 | The dummy | Character | §8.2 | — | R: the hit | Its spring spots, from cover (row 713) | Write-off: a new body by drone. R: everything | Built |
| C2 | Other dummies, trainees | Character | — | — | — | — | — | Planned (PT13) |
| T1 | Crash outline, debris, marker | Trace | Remembered; faded | No | No | Marks a remembered spot | Persists through write-offs; R clears it | Built |
| T2 | Wreck at a write-off | Trace | — | No | No | No | — | Built (cosmetic) |
| T3 | The ghost (rung 7) | Trace, the car's | Searching; found | No | No | Where the car last truly saw the dummy; fixed | Cleared by a true sighting, or `duel.searchSeconds` 4 without the dummy | Built (row 717) |

### 8.2 States that change the answers

**The dummy:**

| State | Height | Behind low cover | Behind tall cover | Field notices after | Notes |
|---|---|---|---|---|---|
| Standing | `proto.art.dummyHeight` 18 | Seen | Hidden | `perception.sideNoticeSeconds` 0.6 | — |
| Ducked | `body.duckHeight` 6 | Hidden until higher eyes clear it | Hidden | 0.6 × `perception.duckNoticeFactor` 1.5 | Speed × `movement.duckSpeedFactor` 0.35 |
| On the plinth | 18 + 20 | Seen | — | Rungs 0–2 never; rung 3 as standing | — |
| In the air | Its arc | — | — | Rungs 0–2 never; rung 3 as standing | — |
| At a remembered spot (rung 6) | Any | Seen | Seen | At once | EXPECTED |
| Within `duel.searchRadius` of a ghost (rung 7) | Any | Seen | Seen | At once | FOUND; the ghost stays put |
| Knocked, written off | — | — | — | — | Out of play until it recovers, or a new body lands |

**The red car:**

| State | It sees | It stops for the dummy | A hit |
|---|---|---|---|
| Cruising | By rung | Yes, by rung | Damages; may teach |
| Waiting (below `duel.standstillSpeed` 5) | By rung | Already stopped | A touch: no damage, no lesson |
| Swerving round a cone (rungs 2–4) | By rung | No, until past the cone | Damages; at rung 4, teaches rung 5 |
| Searching (rung 7) | By rung, and past cover within the ring | Short of the ghost, for `duel.searchSeconds` after it last had the dummy | Damages; may teach rung 7 only from below it |
| Spent (just hit) | — | No | — |

### 8.3 Resets by event

| Event | Dummy | Red car's memory | Outlines | Objects | Cars |
|---|---|---|---|---|---|
| A pass ends | — | Kept | Kept | Cones in a lane fetched | Back in 2 s |
| A block (the car waits `duel.blockSeconds` 10) | Lifted beside the road; put down once the car has left | Kept | Kept | Cones ahead of it fetched at once | Drives on |
| The search gives up (`duel.searchSeconds` 4 without the dummy) | — | Kept; the ghost cleared | Kept | — | Drives on |
| A true sighting at rung 7 | — | The ghost cleared | Kept | — | Sees the dummy |
| Write-off | New body (`proto.health.standard` 500); parts kept | Kept | Kept | A held cone drops | — |
| Lesson | — | Grows (rung 6 fitted) | Kept | — | Away, then back |
| Cover leaves (parked car) | — | That spot forgotten | Outline fades | — | — |
| Restart (R) | Everything | Cleared | Cleared | Back to homes | Rung back to start |
| Level change | Q6 | Q6 | Q6 | Q6 | Q6 |

## 9 How the best stealth games handle it (research, 4 November)

### 9.1 Game by game

| Game | Hide | Detect, and show it | Remember | Reset |
|---|---|---|---|---|
| Metal Gear (1987), Metal Gear Solid (1998) | The cardboard box: still, invisible (1987); moving, suspicious | One vision cone on the radar (1998); noise sends a guard to look | Guards check the noise's source | They return to their route; a full alert jams the radar |
| Metal Gear Solid V (2015) | The box: moving, it is reported ("a cardboard box is moving!") | Curious, vigilant, full alert. A found body or an unsuppressed shot raises vigilance | Vigilant guards hunt in groups. Radio spreads an alert between outposts; cutting the antenna stops it | Vigilance calms "after some time" |
| MGS V's Revenge system | — | — | Habits buy counters: headshots, helmets; night, goggles; stealth, decoys, mines, cameras. Shown as icon colours on the map | Levels fall after each mission; story progress caps them |
| Splinter Cell: Conviction (2010) | Hidden: the screen turns grey | Binary | Last known position: a silhouette where the guard thinks you are, when you break its line of sight | — |
| Thief (1998) | Shadow; quiet surfaces | Footsteps by surface; three guard states | An investigating guard updates its point of interest | Thief 1 guards return still aroused: easy to re-provoke |
| Dishonored (2012) | Darkness, distance | A three-stage meter over each guard | Full alert chases the last known position | Afterwards that area's guards stay at stage 1: faster next time |
| Mark of the Ninja (2012) | Shadow: unseen | Sight arcs and sound rings drawn on screen | A partial sighting marks your last location; the guard goes there | It gives up and returns to its post |
| Hitman (2016) | Disguises; crowds | Civilians flag extreme behaviour; guards react to bodies and weapons left out | Bodies found are shared; characters notice missing or tampered items; "compromised" and last-seen are shared, updated periodically, so they go stale | Panicked crowds never calm down |
| Alien: Isolation (2014) | Lockers, vents, crawlspaces | Senses only; a director nudges it to your area | Searching lockers and small vents unlocks only after you repeatedly escape that way: "the illusion that the creature is learning" | Each reading decays: it forgets; it gives up an ambush after a set time; a menace gauge forces breaks |
| Assassin's Creed (2007–2024) | Haystacks, benches, crowds; moving haycarts and wagons | Awareness meters per guard | Unity: a last-known-position silhouette | Guards give up after a brief search |

### 9.2 Patterns, and what DUMMIES takes

| Pattern | Seen in | DUMMIES now | Proposal | Decision (row 716) |
|---|---|---|---|---|
| Perception is readable; binary where it can be | Mark of the Ninja, Conviction, Blacklist's GDC talk | Beam and field zones, notice meter, HIDDEN, SEEN, EXPECTED | Keep binary labels; one cue per state | Keep |
| Last known position, drawn | Conviction, Unity, Mark of the Ninja | The ghost (rung 7, 10.8) | A ghost where the car last saw the dummy, while it waits | Adopted. **Built 10.8 (row 717)** |
| Graded alert that decays | MGS, Thief, Dishonored | The search: stops short of the ghost, gives up after 4 s | A short search state: it slows past the last known position, then gives up | Adopted. **Built 10.8 (row 717):** it stops short, not slows past (F3) |
| An area stays on edge after an alert | Dishonored, Thief 1 | None | The junction's notice runs faster for a while after a hit | Adopted. A car behaviour: its own test |
| Habits buy counters, capped, decaying | MGS V Revenge, Alien: Isolation | Rung 6, three spots (D120) | Decay by level change (Q6); show the counters on the map, as MGS V does | Adopted: the spots on a map. Lands with the multi-screen levels |
| Moving cover is suspicious | The cardboard box; AC's haycarts | Parked cars arrive "seen coming" (row 712) | Cover that moves in a car's sight draws its notice; still cover hides | Adopted. Lands with moveable cover: pushed planters, parked cars |
| Traces raise the alert | MGS V bodies; Hitman bodies, missing items | Outlines: only crashes from cover are remembered | White cars slow past fresh outlines (group, later) | Adopted, for later: a group behaviour after 10.8 |
| Security cameras with a visible cone | MGS (panning cameras), Splinter Cell, Dishonored's watchtowers | A 60° cone per post, panning 60° (rows 723–724) | Panning cones: a timed crossing | **Built 10.8 (row 724)**; values D124 |
| Shared, stale information | Hitman services; MGS V radio | Street cameras feed the car live | Fleet memory (Q2); a camera blocked by moved cover sees nothing | Open (Q2) |
| Crowds are cover | AC, Hitman | White cars as moving cover (row 711) | Queues as cover; their flashing lights as the alarm (row 711) | Decided (row 711) |
| Score how unseen a strike was | Mark of the Ninja's scoring; Wong: pacifist play signals skill | The stealth grade (rows 725, 728) | Damage × the grade: UNSEEN ×3, LOST ×2, SEEN ×1 | **Built 10.8**; D125 resolved (row 728) |
| Manipulate the guard | Wong: a noisemaker moves a guard from idle to searching | The lure (row 726): a remembered spot or a ghost parks the car | Draw its stop line; a field note once per save file | **Built 10.8 (rows 726, 729)**; D126 resolved |
| Failure is cheap | Mark of the Ninja's frequent checkpoints | A new body by drone; 2 s between passes | Keep | Keep; the block lift (row 715) |

### 9.3 Sources

- [MGS V: enemies' states of alert (Gamepressure)](https://www.gamepressure.com/mgs5thephantompain/enemies-states-of-alert/z27b18)
- [Revenge System (Metal Gear Wiki)](https://metalgear.fandom.com/wiki/Revenge_System_(enemy_preparedness))
- [Cardboard box (Metal Gear Wiki)](https://metalgear.fandom.com/wiki/Cardboard_box)
- [MGS V's cardboard box is the best (Kotaku)](https://kotaku.com/metal-gear-solid-v-s-cardboard-box-is-the-best-1729367320)
- [Splinter Cell: Conviction (Wikipedia)](https://en.wikipedia.org/wiki/Tom_Clancy%27s_Splinter_Cell:_Conviction)
- [Modeling AI Perception and Awareness, Splinter Cell: Blacklist (GDC Vault)](https://www.gdcvault.com/play/1020436/Modeling-AI-Perception-and-Awareness)
- [Stealth game spotting deconstruction (Critical Points)](https://critpoints.net/2015/03/30/stealth-game-spotting-deconstruction/)
- [The innovations of Thief (PC Gamer)](https://pcgamer.com/stealth-is-everywhere-in-games-but-the-innovations-of-thief-have-been-forgotten)
- [Stealth in Mark of the Ninja (Virtual Bastion)](https://virtualbastion.com/2015/04/15/playing-like-a-designer-stealth-in-mark-of-the-ninja)
- [The AI of Hitman (Game Developer)](https://www.gamedeveloper.com/design/the-ai-of-hitman-2016-)
- [Revisiting the AI of Alien: Isolation (Game Developer)](https://www.gamedeveloper.com/design/revisiting-the-ai-of-alien-isolation)
- [The evolution of Assassin's Creed's stealth (Ubisoft)](https://news.ubisoft.com/en-us/article/1hges9IWLOmNAFpiavYmKl/the-evolution-of-assassins-creeds-stealth)
- [Kevin Wong, Stealth Game Design (2014)](https://thatkevinwong.com/2014/05/16/stealth-game-design/)

## Change log

| Date | Change | Row |
|---|---|---|
| 3 November 2026 | Started at the 10.7 build: five factors, interlock table, findings F1–F14, questions Q1–Q7 | 710 |
| 3 November 2026 | Cars are cover: parked cars count; white cars block the red car (Q3). Queued cars flash their lights (Q5). Q8–Q9 added | 711 |
| 4 November 2026 | Memory follows cover (Q1). Parked cars leave and arrive, seen coming (Q8). White cars block on one-way roads; they arrive in 10.8 (Q9). Q10 added | 712 |
| 4 November 2026 | A hit from the open leaves no spot (Q10); 10.7 amended. F13 superseded; F15 added | 713 |
| 4 November 2026 | §8 the control table: object types, states, resets. §9 stealth research: ten games, ten patterns | 714 |
| 4 November 2026 | The block lift ends the stalemate (built in 10.7); F16 | 715 |
| 4 November 2026 | §9.2: six proposals adopted, with where each lands | 716 |
| 5 November 2026 | 10.8 built: rung 7, the search (§2.1); its states and resets (§8); L9–L10; F17–F21; Q11; §9.2's first two built | 717–722 |
| 5 November 2026 | The street cameras' cones (row 723): rung 4's row; L2a; L7; F22–F23; the research row | 723 |
| 6 November 2026 | The cameras pan (row 724): rung 4's row; L2b; L7; F24; the research row | 724 |
| 6 November 2026 | The stealth grade, the lure, the floor of open ways (rows 725–727): §1.1; L11–L12; F25–F28; two research rows; Wong added to sources | 725–727 |
| 6 November 2026 | Damage × the grade (row 728); the lure's field notes once per save file (row 729): §1.1; F29; the research rows | 728–729 |
