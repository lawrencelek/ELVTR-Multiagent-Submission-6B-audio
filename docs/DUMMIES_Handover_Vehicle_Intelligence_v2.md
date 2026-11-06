# DUMMIES — Handover v2: vehicle intelligence, finding the fun (Prototype 10)

**1 November 2026 · Lawrence Lek** · Regroups the first outside playtest (Sasha) into five categories. Read this before v1.

**Updated 1 November, 21:19:** §9 the crux and the ten tests (user-decided); §10 the 10.0 spec. Rows 648–656 recorded.

**Updated 2 November:** §11 the 10.0 result. Pillar 1's written test passes; the aimed dash is the gap. Row 649 superseded by row 657.

**Updated 2 November, later:** §12 the 10.0-v2 result. PT1 means avoidance never escalates (row 658). Prototype 9 cars learn two numbers and no behaviours.

**Updated 2 November, 03:00:** §13 the 10.0-v3 result (the side sensor's response is missing; a traffic-values bug). §14 Prototype 10's revised scope: one Monument junction, one car type, nine escalating tests (row 661). §14 supersedes §9.3's 10.1–10.9 rows.

**Updated 2 November, 10.1 built:** §15. The Monument test road plays at `prototypes/p10/dummies_p10.html`; GDD Edit 101.

**Updated 2 November, 10.2 built:** §16. The first lesson plays at `prototypes/p10/dummies_p10_2.html`; GDD Edit 102. Rung 1 closes the front; the flank and the late step-in stay open. 10.1's page is frozen.

**Updated 2 November, 10.3 built:** §17. The side sensors play at `prototypes/p10/dummies_p10_3.html`; GDD Edit 103. Rung 2 closes the open flank; cover and the plinth stay open. 10.2's page is frozen; `index.html` lists one page per test for the playtest.

**Updated 2 November, 10.4 built:** §18. The roof lidar plays at `prototypes/p10/dummies_p10_4.html`; GDD Edit 104. Rung 3 sees height: the plinth closes. Cover is the last opening. 10.3's page is frozen.

**Updated 2 November, 10.5 built:** §19. The street cameras play at `prototypes/p10/dummies_p10_5.html`; GDD Edit 105. Rung 4 sees behind cover; the cones arrive and their swerve is the way in. Only a hit where height hid the dummy now teaches rung 3; 10.4's page was rebuilt with it, then frozen. A sprint from past the field, found on the way, lands at rungs 2–4.

**Updated 2 November, 22:58:** §20. Major learning (row 694): the duel is a stealth game, played from the other side. DUCK becomes an ability.

**Updated 3 November, 18:25:** §22. A car that has learned shows it (row 701). D115 and D118 kept. Pace measured against the GDD's target (row 702).

**Updated 3 November, 10.6 built:** §21. DUCK plays at `prototypes/p10/dummies_p10_6.html`; GDD Edit 106. Rung 5 stops at cones; DUCK behind a planter row is the way in. Sightlines run by height. 10.5's page is frozen.

**Updated 3 November, 10.7 built:** §23. Crash memory plays at `prototypes/p10/dummies_p10_7.html`; GDD Edit 107. Every crash leaves a chalk outline; rung 6 rings the last three spots you struck from and expects you there. A shorter drive-in and a 500 body (D117). 10.6's page is frozen.

**Updated 5 November, 10.8 built:** §25. The search plays at `prototypes/p10/dummies_p10_8.html`; GDD Edit 108. Rung 7 marks a ghost where it last saw you, stops short, finds you near it, gives up after 4 s. Crawling away is the opening. The road upgrade moves to 10.9 (D121). 10.7's page is frozen.

**Updated 3 November, 22:59:** §24. A running document of five interlocking systems, read before any level redesign (row 710).

## 0 How to use this with v1

- **v1** (`claude/DUMMIES_Handover_Vehicle_Intelligence.md`) still holds: constraints (§4), code survey (§5), tools (§8), repos (§9), run and test (§11), conventions (§12).
- **v2 replaces** v1 §3.2's grouping, v1 §7's workstreams and v1 §14.3's "Rules for DUMMIES".
- **The five rules in v1 §14.3 are withdrawn.** They were never tested. §6 restates them as hypotheses with tests.
- **Status labels:**
  - **Evidence:** measured in a build or said by a player.
  - **Research:** from a cited source.
  - **Hypothesis:** a design claim. Nothing ships as a rule until its test passes.
- **First message for the next chat:** "Read `claude/DUMMIES_Handover_Vehicle_Intelligence_v2.md`, then v1 §4–§12. Build Prototype 10.0 (§10)."

## 1 Back to the original pillars

Three generations of the same five pillars. The playtest tests the oldest wording.

| # | Edit 9 (1 October, original) | Edits 11–23 (row 79) | V29 D2 | Playtest, 1 November |
|---|---|---|---|---|
| 1 | There is always a way to destroy yourself | There is always a way to outsmart the car. *Fails if standing in a lane pays as well as baiting* (Edit 19) | D2.1 Reading and fooling a car is the rewarding strategy | **Passes its written test** (§11). Standing gets hit but pays almost nothing. The aimed dash dominates (PT1) |
| 2 | Every encounter feels good. A failed lunge makes you want another | Juiced to 11: you feel like the dummy | D2.4 A beautiful, readable encounter leads to closure and replay | **At risk.** Free hits feel like nothing (PT1) |
| 3 | The cars visibly learn | The cars visibly learn, as individuals and a fleet; emergent behaviour | D2.2 Recurring cars visibly adapt | **No stage.** The tester wants one car that learns (PT2–PT4) |
| 4 | The signals make timing readable | Machine to human: you buy degrees of freedom | D2.3 The first upgrade changes how you play | **Asked for.** Parts must be the way in (PT6) |
| 5 | Stellar Art Direction | Unchanged | (art and voice) | Battery done (PT0); story wanted (PT15) |

- **Intended player (Edit 9):** a fifteen-year-old at an exhibition, a friend shouting suggestions. Test with that pair.
- **Reading:** the pillars already hold the answer. Pillar 1 passes on paper but play feels too easy (§11). Pillar 3 has no stage.

## 2 Evidence

### 2.1 Sasha's notes (numbered as v1 §3.2)

- **Source:** Sasha's oral notes after a Prototype 9 session, as relayed by Lawrence (1 November). No playthrough footage.

| PT | Note |
|---|---|
| PT0 | "the position of the battery is too close to crotch. it should be in the centre of the chest like Iron Man's power core" |
| PT1 | "There is insufficient challenge, if I just stand in the centre of the road I can get hit." |
| PT2 | "Car AI and emergent behaviour is very important, like in the original brief." |
| PT3 | "Let's start by having prototypes of 1 vs 1 - just car vs you." |
| PT4 | "In level one, you can just walk into it. Level two, it learns to avoid what's in front. You have to approach from the side. Then Level three you have to hit it from above." |
| PT5 | "white cars you want to avoid getting hit by, because they don't learn, and 'red' cars that are smart and getting smarter, these are like the 'bosses'." |
| PT6 | "And your powerups are crucial to learning how to get hit." |
| PT7 | "you could vary between easy cars (drones, easy), and hard cars (who are hard to catch, like bosses)" |
| PT8 | "Write out a list of all the ways cars can avoid hitting you IRL." |
| PT9 | "do real-world research how Tesla does calculation with computer vision, and do a gamified version" |
| PT10 | "Research games where you are chasing something, and games where you are being chased." |
| PT11 | "You are trying to avoid getting hit by some of the cars (white cars) but targeting the red car." |
| PT12 | "The cars would Swerve around you, and hit other cars. What is the cost of this?" |
| PT13 | "There could be two two lane roads. Or expand into things like the trolley problem" |
| PT14 | "What other zones are possible? Like a free-for-all test centre with no specific roads?" |
| PT15 | "For Story mode, more interesting story. Every level you need to learn about the sinister corporate law." |

### 2.2 Stand-in-lane probe (Prototype 9, 1 November)

- **Tool:** `qa/stand.js` (new). Headless Arcade, Endless. The dummy stands in a lane, no input, 150 s a placement. A knock-back is undone.
- **Run:** `node qa/stand.js 150 arcade monument,parkland,waterfront 300,560,700 0,20`.

| Measure | Result |
|---|---|
| Placements that ran | 10 (8 skipped: no on-screen lane at that lead) |
| Placements with damaging hits | 7 of 10 |
| Damaging hits | 16 in 25 sim-minutes |
| Write-offs | 0 |
| Health lost | 236 in total; one body is `damage.bodyHealth` 800 |
| Impact zone | front-diagonal 13, front 3 |
| Car state at impact | caution 6, expiring 5, committed 2, interrupted 2, intention 1 |

- **Story Monument A1, 180 s:** 0 hits.
- **Prototype 1.7 (14 October, Prototype Log):** stand in lane, 0 impacts. Prototype 9 regressed.
- **Reading (hypothesis H0):** hits are free chips, not kills.
  - Cars that noticed the dummy still clip it while passing (`proto.driver.passClearance` 24, `proto.driver.cautionSpeed` 82).
  - Cars ending a manoeuvre (expiring, committed) clip it too.
  - Free hits, slow kills: no challenge and no payoff.
- **Revised by 10.0 (§11):** standing pays 6–14% of a head-on lunge; pillar 1's written test passes. The aimed dash is the challenge gap.

## 3 The five categories

Every note sits in one category. Maximum five.

| Cat | Name | Notes | Pillars | Status |
|---|---|---|---|---|
| **C1** | **Earned hits** — challenge and the core verb | PT1, PT6 | 1, 2, 4 Too easy: the aimed dash dominates (§11). Fix first |
| **C2** | **One car's mind** — behaviour, learning, progression | PT2, PT3, PT4, PT8, PT9 | 3 | Absent. Build the stage |
| **C3** | **Cast and attention** — white and red, avoid and chase, swerve cost | PT5, PT7, PT10, PT11, PT12 | 2, 3 | Needs C1 and C2 first |
| **C4** | **Places and set pieces** — roads, trolley problems, zones | PT13, PT14 | 3, 5 | Later |
| **C5** | **Meaning and look** — the corporate law, the chassis | PT0, PT15 | 5 | PT0 done (row 644); PT15 later |

### C1 Earned hits

- **Problem (evidence):** standing gets hit, cheaply (§2.2). An aimed dash at the nearest car wins 10–20 hits a minute, mostly on cars that saw it coming (§11).
- **Problem (note):** parts must matter to getting hit (PT6).
- **Research:** an always-yielding car hands the crossing to the pedestrian (Millard-Ball, §4.2). Never-yielding hands the hit to the dummy. Fun sits between.
- **Hypotheses:** H0, H1, H2, H7 (§6).

### C2 One car's mind

- **Problem:** learning is off or invisible (v1 §5.5–5.6). The tester asks for one car that learns: front, then side, then above.
- **Research:**
  - Real cars climb a ladder: brake first, swerve into free space, both last (v1 §14.1).
  - Real sensors have real blind spots: camera, lidar, radar, rules (v1 §14.2).
  - Game hunters adapt to your tactics, capped, and never from your deaths (Alien: Isolation, MGS V; §4.3).
  - Nintendo builds the movement toy first and the levels last (§4.1).
- **Hypotheses:** H3, H4, H5, H6.

### C3 Cast and attention

- **Notes:** white hazards, red boss (PT5); easy and hard cars (PT7); dodge and chase together (PT11); swerve cost (PT12).
- **Research:** real swerves risk a second crash, so systems prefer braking (v1 §14.1). Real fleets behave oddly with each other (Waymo honking, §4.2).
- **Hypotheses:** H8, H9. Test only after C1 and C2 pass.

### C4 Places and set pieces

- **Notes:** two-way, two-lane roads; trolley set pieces; a free-for-all test centre (PT13, PT14).
- **Use now:** the open test centre is the venue for C2's duel (Proving Ground).
- **Later:** two-way roads, trolley set pieces, car park, skid pan, tunnel (v1 PT13–PT14).

### C5 Meaning and look

- **PT0:** done in Prototype 9 (row 644, `ui.coreOnChest` 1).
- **PT15:** a law clause per level (v1 PT15 drafts). Needs C2's levels first.

## 4 Research: finding the fun

### 4.1 How Nintendo finds the fun

- **Movement first.** On Mario 64, about half the effort went into movement, animation and physics. Courses and enemies came last, in a burst.
- **A toy space first.** Mario was tried in a small diorama world before any levels existed.
- **Four-beat levels (kishōtenketsu, Koichi Hayashida).** Introduce a mechanic; develop it; twist it; let the player show mastery. The twist gets the most design care.
- **For DUMMIES:**
  - Build one car and one dummy in an empty lot. No score, no levels.
  - When that is fun, add levels. Each level runs the four beats on one sensor.

### 4.2 How real cars behave (adds to v1 §14.1–14.2)

- **The chicken game (Millard-Ball).** Self-driving cars that always yield let pedestrians cross at will. Traffic could crawl. Responses include rules, fines and barriers.
  - DUMMIES inverts it: the dummy wants the hit. Always yielding is unbeatable bait; never yielding is free.
- **Cones stop robotaxis.** In July 2023, San Francisco activists disabled Cruise and Waymo cars with a cone on the bonnet.
  - The cone is already a DUMMIES verb. A frozen car is a real behaviour.
- **Cars honk at cars.** In August 2024, Waymo cars honked at each other overnight in a San Francisco car park. Waymo said it found the cause.
  - Fleet-on-fleet oddity is real. It is emergent comedy.
- **Personality dials exist.** Tesla FSD has five speed profiles: Sloth, Chill, Standard, Hurry, Mad Max. New cars default to Sloth (January 2026).
  - A real escalation ladder for one car's assertiveness.

### 4.3 How games make enemies learn

- **Alien: Isolation.**
  - Two brains: a director that knows where you are, and the alien, which must find you.
  - A menace gauge rises near the player; at its peak the director pulls the alien away for a break.
  - Locked branches of its behaviour tree unlock as the player meets conditions. Player deaths unlock nothing. Some unlocks are timed.
- **Metal Gear Solid V (the Revenge system).**
  - Headshots bring helmets. Night sightings bring night-vision goggles. Stealth brings decoys and mines; combat brings armour.
  - Levels show only as icon colours on the map. Missions lower them. Story progress caps them.
- **What both share (research, not yet a DUMMIES rule):**
  - The enemy counters the player's own habit.
  - Counters are capped and can fall back.
  - Failure does not feed the enemy.
  - The player can see that a counter exists.

### 4.4 Sources

- Mario 64 developer interviews (1996): https://daverupert.com/2016/09/super-mario-64-1996-developer-interviews/
- Hayashida's four-step level design: https://www.gamedeveloper.com/design/the-secret-to-i-mario-i-level-design
- Millard-Ball, the crosswalk chicken game: https://www.scientificamerican.com/article/how-pedestrians-will-defeat-autonomous-vehicles
- Cones on robotaxis (July 2023): https://techcrunch.com/2023/07/06/robotaxi-haters-in-san-francisco-are-disabling-waymo-cruise-traffic-cones/
- Waymo honking (August 2024): https://abc7news.com/post/waymo-cars-honk-each-other-night-disturbing-san-francisco-neighbors/15179709/
- Tesla FSD speed profiles: https://www.notateslaapp.com/news/3475/tesla-defines-fsd-speed-profiles-changes-default-to-sloth
- Alien: Isolation AI: https://www.gamedeveloper.com/design/the-perfect-organism-the-ai-of-alien-isolation
- MGS V Revenge system: https://metalgear.fandom.com/wiki/Revenge_System_(enemy_preparedness)
- Real avoidance and sensors: v1 §14.4.

## 5 The 80/20

- **Fifteen open notes** (PT1–PT15; PT0 is done). **The vital 20% is three:** PT1, PT4, PT6.
- **Why these three:**
  - **PT1, earned hits (C1).** Hits come too easily: the aimed dash needs no reading (§11). Every other note decorates it.
  - **PT4, the learning ladder (C2).** Pillar 3's stage and the progression in one. PT3's 1 vs 1 is its format.
  - **PT6, parts as the way in (C1).** Each level's sensor needs a verb to beat it. Pillar 4.
- **What they unlock:**

| Note | Category | Needs first | When |
|---|---|---|---|
| PT1 earned hits | C1 | — | **Now** |
| PT4 learning ladder (format PT3) | C2 | PT1 | **Now** |
| PT6 parts as the way in | C1 | PT4 | **Now** |
| PT2 emergence | C2 | PT4 | Next |
| PT5, PT7, PT11 white and red, easy and hard, dodge and chase | C3 | PT1, PT4 | Next |
| PT12 swerve cost | C3 | PT5 | Next |
| PT13, PT14 roads, set pieces, zones | C4 | PT4, PT5 | Later |
| PT15 corporate law | C5 | PT4's levels | Later |
| PT8–PT10 research | C2, C3 | — | Done (v1 §14, v2 §4) |
| PT0 battery | C5 | — | Done (row 644) |

## 6 Hypotheses (replace v1 §14.3's rules)

Each hypothesis names its basis, its test and its pass mark. Thresholds marked *proposed* need Lawrence's agreement before the test.

| H | Hypothesis | Basis | Test | Pass (proposed) |
|---|---|---|---|---|
| H0 | Free hits come from passing and ending manoeuvres, not from bad luck | §2.2 probe | Rerun `qa/stand.js` with `proto.driver.passClearance` raised and expiring manoeuvres re-checking the dummy | Hits fall to 0; traffic still flows |
| H1 | A car that never hits a standing dummy makes hits feel earned | Pillar 1 fail clause (Edit 19); P1.7 log | Bot: stand vs read-and-lunge. Human: the tester replays | Stand 0 hits; tester says the challenge is right |
| H2 | A car that sometimes refuses to yield is more fun to bait than one that always yields | Chicken game (§4.2); Tesla profiles | Three settings of `driver.assertiveness` (proposed; Sloth, Standard, Mad Max analogues), blind A/B | One setting preferred; read-and-lunge still beats blind lunge (V29 D2.1) |
| H3 | One car in an empty lot is fun with no goal | Mario 64 movement first (§4.1) | Free play, no score, 5 minutes | Player plays on unprompted for 3 minutes and names a trick |
| H4 | One sensor per level, in four beats, reads as learning | Kishōtenketsu (§4.1); PT4 | Levels L1–L3: front, side, above | Player names the change in 2 of 3 levels |
| H5 | The car should counter your habit, capped, never from your failures | Alien: Isolation, MGS V (§4.3) | Fixed ladder vs habit counter, after L3 (D91) | Player notices and switches tactic |
| H6 | A counter shown before it acts reads as learning, not chance | MGS V icons; pillar 3 fail clause | With and without `ui.sensorCue` (proposed) | Player explains a miss |
| H7 | The level's part opens the level's sensor; a part-free way stays, slower | Pillar 4; V29 D2.3; PT6 | With and without the part, per level | Part used within the level; part-free win still possible (D97) |
| H8 | White hazards plus one red target hold attention better than red alone | PT11; chase games (v1 §14.3, unsourced) | Duel vs duel with white traffic | Longer voluntary play; no loss of reading |
| H9 | Car-on-car oddity (freezing, honking, swerve crashes) reads as comedy | Cones, Waymo honking (§4.2); PT12 | Cone-on-bonnet freeze; swerve into a white car | Players laugh or retry; no frustration reported |

## 7 Path to prototypes

- **Superseded by §9.3,** the ten tests 10.0–10.9 (row 653).

## 8 Decisions recorded (1 November)

Recorded in `DECISIONS.md`. Replaces the rows v1 §3.2 proposed.

| Row | Decision | Status |
|---|---|---|
| 648 | Prototype 10 is 1 vs 1: one red car, one dummy. Traffic returns at 10.8 | user-decided |
| 649 | Pillar 1 fails its own test in Prototype 9: standing earns hits (§2.2) | superseded by row 657 |
| 650 | v1 §14.3's five rules are withdrawn; hypotheses H0–H9 replace them | user-decided |
| 651 | Sasha's notes grouped in five categories, C1–C5 | proposed |
| 652 | The vital three: PT1, PT4, PT6 | proposed; built into row 653 |
| 653 | Prototype 10 runs as ten one-change tests, 10.0–10.9 (§9.3) | user-decided |
| 654 | Story is the curriculum; Arcade is the exam. One duel car (§9.2) | user-decided, with row 653 |
| 655 | The Nintendo check's two changes: 10.4 hides the goal text; 10.2 and 10.4 run variants | user-decided, with row 653 |
| 656 | PT0 repeats row 644; no change. Sasha played Prototype 9; the live build draws the core on the chest | tested (built in Prototype 9) |
| 657 | 10.0 baseline: standing gets hit but pays 6–14% of a head-on lunge; pillar 1's written test passes; the aimed dash dominates (§11) | tested (2 November) |
| 658 | PT1 clarified: Sasha meant avoidance never escalates. The learning car learns something new each time; white cars need not | user-decided (2 November) |
| 659 | 10.0-v2: Prototype 9 cars learn two numbers and no behaviours; the aimed dash keeps working or ends in a stalemate (§12) | tested (2 November) |
| 660 | 10.0-v3: side awareness exists but only slows the car; blind and built cars lose the flank alike; the drawn side arcs drive nothing (§13) | tested (2 November) |
| 661 | Prototype 10's scope: one Monument junction (two one-way roads, then two two-lane roads), one car type, nine tests that escalate the car's learning (§14) | user-decided (2 November) |
| 662 | Bug: district traffic gets only two of the build's driver values; `proto.driver.dodgeFollowsCone` (row 632) never reaches Story or Arcade traffic (§13) | tested (2 November) |
| 663 | Prototype 10.1 built: the Monument test road, rung 0 (§15; GDD Edit 101) | tested (2 November) |
| 664 | Rung 0 senses nothing: `perception.forwardLength` 0, `proto.driver.cautionZone` 0 | proposed; follows row 650 (L1: walk into it) |
| 665 | The 29 sim-only IDs registered; `duel.*` added; `registryVersion` unchanged so Prototype 9's rebuild keeps its md5 | tested (2 November) |
| 666 | On a one-way road of two lanes, the second lane's car may pass by the first (`TestRoadSim.choose`) | tested (2 November) |
| 667 | Prototype 10.2 built: one lesson, rung 0 to rung 1, in four beats; Battery 1 by drone at the first brake (§16; GDD Edit 102) | tested (2 November) |
| 668 | Standstill: a car slower than `duel.standstillSpeed` (5) takes no damage and teaches nothing | proposed (D106) |
| 669 | Rung 1 keeps the safe envelope from a dummy ahead: beam 720, stop line 226, a hard stop for a charge; no side field until rung 2 | proposed (D107) |
| 670 | Test road: run-in of a beam plus a car length; return timed from leaving the screen; the kerbs bound every swerve and pass (D105 in part) | tested (2 November) |
| 671 | 10.2 measured: standing and charging 0 at rung 1; the late step-in 1.94 a minute on foot; the flank 2.81 with the dash; decay 0 against 0.75 (§16) | tested (2 November) |
| 672 | One page per test: 10.1's page frozen (md5 `82ab5e55…`); +12 registry IDs, 644 entries, version unchanged | tested (2 November) |
| 673 | Prototype 10.3 built: from rung 1, any hit but a tail bump teaches rung 2; Battery 1 from the start; Legs 1 by drone at the first side stop (§17; GDD Edit 103) | tested (2 November) |
| 674 | Rung 2 is the driver's field made the zone that acts: noticed after 0.6 s, it keeps the envelope measured straight, stops short and waits; no pass | proposed (D110) |
| 675 | A swerve away cannot close the flank: tried first, the flank still landed 2.8 a minute at 53 | tested (2 November) |
| 676 | Its sensors see the ground: unseen in the air, on the plinth, behind statics. The plinth is a raised edge; jumps follow Edit 75 on the test road | tested (2 November) |
| 677 | 10.3 measured: the open flank, the kerb, the late step-in and the corner score 0; cover 2.07 a minute; the plinth 2.68; the car waits for a dummy in the open | tested (2 November) |
| 678 | 10.2's page frozen (md5 `9dd14c58…`); one page per test on `index.html`, 10.0 being Prototype 9; registry 647 entries | tested (2 November) |
| 679 | Prototype 10.4 built: from rung 2, only a hit from above teaches rung 3, the roof lidar; both parts from the start; no new part (§18; GDD Edit 104) | tested (2 November) |
| 680 | Rung 3 sees height: a dummy in the air or on the plinth; the plinth no longer hides a dummy standing on it | proposed |
| 681 | A spent car (it has hit the dummy) no longer stops for it: it drives off to its lesson | tested (2 November) |
| 682 | 10.4 measured: the plinth 0.07 a minute, decay 0; cover open: the gap 2.21, a jump from behind the barrier 2.70 | tested (2 November) |
| 683 | Cover is the last opening; the next rung slows past what it cannot see (revises §14.2's rung 4, D104) | proposed |
| 684 | 10.3's page frozen (md5 `5aed8e43…`); `index.html` lists 10.4 | tested (2 November) |
| 685 | Only a hit where height hid the dummy teaches rung 3: from above, in sight past cover for the whole clip (resolves D113) | tested (2 November) |
| 686 | 10.4's page frozen (md5 `b12b48d8…`), built with row 685 | tested (2 November) |
| 687 | Prototype 10.5 built: from rung 3, a hit out of cover teaches rung 4, the street cameras; Hands 1 by drone at the first stop behind cover (§19; GDD Edit 105) | tested (2 November) |
| 688 | A waiting car stays stopped when the dummy steps from its field into its path | tested (2 November) |
| 689 | The cone's swerve holds: no stop for a dummy in its field until it has passed the cone | proposed |
| 690 | Slowing past a blind spot cannot close cover; rung 4 sees behind it instead (replaces row 683's rung 4) | proposed (D114) |
| 691 | The sprint from past the field lands at rungs 2–4: 0.8 a minute at 52 | tested (2 November) |
| 692 | 10.5 measured: cover 0; the cone bait 2.0 a minute; the sprint from past the field 0.8 | tested (2 November) |
| 693 | Probes: bots `conebait` and `lurk`; the page's cameras, cones and edge marker; `duel.conesArrives`, 648 entries | tested (2 November) |
| 694 | Major learning: the duel is a stealth game, played from the other side; DUCK becomes an ability (§20) | user-decided (2 November) |
| 695 | Prototype 10.6 built: from rung 4, a hit while it swerves round a cone teaches rung 5, road items; DUCK by drone at its first stop at a cone (§21; GDD Edit 106) | tested (3 November) |
| 696 | DUCK as built: hold C; lower, slower, noticed slower; planter rows by the road; a dash vaults a planter | proposed |
| 697 | Sightlines by height; each street camera sees within its range (180) | proposed (D118) |
| 698 | 10.6 measured: the cone bait 0; DUCK behind the planter 3.03 a minute at 114; standing there 0 | tested (3 November) |
| 699 | Probes: bots `planter`, `standplanter`; 10 IDs added, 659 entries | tested (3 November) |
| 700 | 10.5's page frozen (md5 `25278535…`) | tested (3 November) |
| 701 | A car that has learned shows what it learned; D115 and D118 kept | user-decided (3 November) |
| 702 | Pace: the ambush writes off a body every 140 s, against the GDD's 80–100 s | tested (3 November) |

- **Open:** D89 red hue; D90 white role; D91 fixed or adaptive ladder; D92 car contact; D93 flank damage; D94 venue; D95 law clauses; D96 boss families; D97 parts as keys; D98 lessons, not damage; D99 learning carries across Story levels; D100 10.1's target (overtaken by row 661: rung 1 is 10.2); D101 what "something new" means; D102 pass every driver value to traffic; D103 draw the side zone that acts; D104 the nine tests' rung order; D105 a sighted car's endless wait (in part resolved by row 670); D106 the standstill rule; D107 rung 1's envelope and beam; D108 when the dash arrives; D109 the return against the drive-in; D110 rung 2 waits for any dummy in its field; D111 cover open at rung 2; D112 the plinth needs a dash-jump; D114 rung 4: the street cameras or slowing past blind spots; D115 the sprint from past the field; D116 DUCK's numbers (built, rows 695–697); D117 the pace of a write-off. D113, D115, D118 resolved (rows 685, 701).
- **Next row 703. Next open decision D119.**

## 9 The crux and the ten tests (user-decided 1 November, row 653)

### 9.1 The crux: learning must read as progress

| Force | Pillar | Fails if | Protection |
|---|---|---|---|
| The car learns from you | 3 | The change looks like chance or mood (V29 D2.2) | One cause, one visible change, a quick return |
| Fun | 2 | Learning reads as punishment for success | Your hit is the lesson; the lesson clears the level |
| You can destroy yourself | 1 | Learning closes every way in | One opening at every stage; failure never feeds the car |

- **Player understanding: unknown.** No outside player has seen car learning. Prototype 9 has `proto.learningEnabled` 0.
- **A lesson has four beats:**
  1. **Cause:** your hit, replayed as the car's training clip.
  2. **Update:** a sensor fitted on screen, mirroring the drone's part drop.
  3. **Return:** the same car and tag, back within `duel.redReturnSeconds` (proposed).
  4. **New behaviour:** it brakes for what is ahead; the flank still works.
- **Learned equals scripted in L1–L3.** Each level has one opening, so the car learns what you did.
- **Adaptive learning starts with two openings** (10.7).
- **Later levels:** sensors and parts carry over. Every cap leaves an opening. Failure trains nothing (Alien: Isolation, §4.3). D99.
- **Goal reframe:** the car's learning is your score. Its certification is your write-off (PT15's law).
- **Will other cars destroy you first?**
  - `story.missFloor` with `story.floorHold` (row 620) already stops off-brief write-offs.
  - **Exploit:** white cars chip you to the floor; then any red tap finishes you. PT1 again.
  - **To test in 10.8:** a level clears on lessons (`duel.lessonsPerLevel`, proposed), not damage. White hits cost parts (row 100). D98.
  - **Reach:** the red car must return often enough to train (`duel.redReturnSeconds`).

### 9.2 Story and Arcade (row 654)

| | Story: the curriculum | Arcade: the exam |
|---|---|---|
| Learning | Authored ladder; one opening per level, so "it learned from you" is true | Adaptive: the car counters your habit (`duel.habitCounter`, proposed) |
| The red car | One character you train across the acts | A fresh boss each run |
| Traffic | Little, introduced late | White hazards from the start |
| Progress | Lessons landed (`duel.lessonsPerLevel`); a law clause per level | Score; grades (`arcade.endless.gradeWriteOffs`) |
| Later | Trolley set pieces as lessons: the car learns a priority; you find the next lever | Trolley pieces as remixed challenges |

- **Order:** Story's lessons first. Mastery can't be tested before it is taught.
- 10.1–10.6 are Story-shaped. 10.7–10.9 are Arcade-shaped.

### 9.3 Ten tests, one change each

Each test has a bot pass and a human pass: Sasha plus one new player. Thresholds are proposed. Each test ends with a DECISIONS row.

| Build | The one change | Sasha's issue | Bot pass | Human pass | Nintendo practice |
|---|---|---|---|---|---|
| **10.0 Baseline** | None. Measure Prototype 9 (§10) | All | Policy table and pillar 1 check recorded | Sasha's oral notes (§2.1). A recorded replay is optional | — |
| **10.1 Earned hit** | The duel car never clips a standing dummy (`proto.driver.passClearance`; expiring manoeuvres re-check) | PT1 | Stand 0 hits; read-and-lunge above 0 | — | Core verb before content (Mario 64) |
| **10.2 The toy** | Proving Ground: one red car, no score (`duel.enabled`). **Three variants:** a loop; free wander; a destination it must reach | PT3, PT2 | Car never stalls | Plays 3 minutes unprompted; names a trick. One variant preferred | Toy space first; one simple goal (Mario 64, BotW 2D); many ideas, keep the survivor (Splatoon) |
| **10.3 Personality** | `driver.assertiveness` (proposed): three settings, blind A/B | PT1 | Read beats blind at all three | One setting preferred | Feel by iteration (Mario 64) |
| **10.4 One lesson** | First hit → L2 forward camera. **No goal text.** **Three variants:** all four beats; sensor fitted only; silent change | PT4, PT2 | Front-only bot fails L2; flank bot clears | Explains why it brakes within 2 minutes. Variant ranked by explanation rate | Teach by play, not text (World 1-1); **introduce** |
| **10.5 The answer** | Battery 1, the dash, by drone at L2. With vs without | PT6 | Flank-and-dash clears faster | Uses the part within the level | Put the tool where the problem is (World 1-1 mushroom); **develop** |
| **10.6 The twist** | L3 surround sensor; Legs 1, jump (`abilities.legs.airtimeBase`) | PT4, PT6 | Ground bots fail; jump bot clears | Names the L3 change; clears from above | **Twist:** most design care (Hayashida) |
| **10.7 The counter** | A level with two openings; the car closes your most-used one (`duel.habitCounter`) | PT2, PT7 | Habit bot loses; varied bot wins | Switches tactic unprompted | **Conclude:** show mastery. Counter from Alien and MGS V, not Nintendo |
| **10.8 The cast** | White cars that never learn (`traffic.white.learns` 0); their hits cost parts; red clears on lessons | PT5, PT7, PT11 | Lessons still reachable; red returns in time | Duel-plus-traffic preferred over the duel alone | One new element at a time |
| **10.9 The cost** | Car-on-car contact: a red swerve into white is an Incident (`traffic.carContact`, `scoring.incidentPoints`) | PT12, PT2 | No jams (v1 W7 watchdog) | Laughs or retries; no frustration | Objects reacting to objects (BotW multiplicative) |

- **10.0-v2 (2 November):** the escalation baseline (§12). Every later test reruns it.
- **10.0-v3 (2 November):** side sensing and the flank (§13).
- **Revised (row 661):** §14.2 replaces the 10.1–10.9 rows above. One Monument junction, one car type, one rung a test.
- **After 10.9:** trolley set pieces (PT13) as Story lessons. Same four beats; the car learns a priority.
- **Each build:** one flag (registry default 0), a bot table, a short human session, a DECISIONS row.

### 9.4 Coverage of Sasha's core issues

| Issue | Tests |
|---|---|
| PT1 insufficient challenge | 10.0, 10.1, 10.3 |
| PT2 car AI, emergence | 10.2, 10.4, 10.7, 10.9 |
| PT3 1 vs 1 first | 10.2; the format of 10.1–10.7 |
| PT4 clear progression | 10.4, 10.6 |
| PT5 white and red | 10.8 |
| PT6 powerups crucial | 10.5, 10.6 |
| PT7 easy and hard cars | 10.7, 10.8 |
| PT11 dodge and chase | 10.8 |
| PT12 swerve cost | 10.9 |

- **The vital three get the most tests:** PT1 three; PT4 two plus the crux; PT6 two.
- **Out of scope for 10.x:** PT13–PT15. PT0 is done.

### 9.5 Nintendo check (row 655)

| Practice | Source | In the plan | Verdict |
|---|---|---|---|
| Movement and physics first; courses and enemies last | Mario 64 interviews | 10.1–10.3 before any level | Follows |
| Try the character in a small toy space | Mario 64 diorama; BotW's 2D prototype: one goal, no puzzles | 10.2 Proving Ground | Follows |
| Mechanic before character and art | Splatoon began as tofu blocks shooting ink | Placeholder sensors until 10.6 | Follows, if no new art is drawn |
| Teach by layout, not text | World 1-1: blocks steer new players into the first mushroom | 10.4–10.5: visual lessons; the part arrives at the problem | Follows: 10.4 hides the goal text |
| Four beats: introduce, develop, twist, conclude | Hayashida | 10.4 → 10.5 → 10.6 → 10.7 | Follows |
| Many ideas, keep the survivor | Splatoon: about seventy ideas in six months | 10.2, 10.3, 10.4 each compare variants | Follows |
| Systems that react to each other make emergence | BotW multiplicative design | 10.9 | Follows, late |
| Enemies that learn | Not a Nintendo practice | 10.7 | Nintendo can't validate it. Alien: Isolation and MGS V inform it |

### 9.6 Sources (adds to §4.4)

- World 1-1 (SoraNews24): https://soranews24.com/2015/09/09/super-mario-bros-creator-explains-how-and-why-he-designed-world-1-1-of-the-8-bit-classic-%e3%80%90video%e3%80%91/amp/
- World 1-1 (Game Developer): https://www.gamedeveloper.com/design/how-miyamoto-built-i-super-mario-bros-i-legendary-world-1-1
- BotW 2D prototype (GDC 2017): https://www.thumbsticks.com/gdc-17-breaking-conventions-breath-of-the-wild
- Splatoon's tofu prototype (Iwata Asks): https://iwataasks.nintendo.com/interviews/wiiu/splatoon/0/0/

## 10 Spec: Prototype 10.0, the baseline

- **Status:** done, 2 November. Result in §11.

**Question:** how does Prototype 9 score on Sasha's core issues, before any change?

### Scope

- **No build change.** No edit to `prototypes/p6/sim.js`, `game.js` or `p7/story.js`.
- Prototype 9 md5 `be163e7d014344e062965986b3da5786` and 8.4 md5 `9f5549201d88891f9f0b22c461602909` must not move.
- New files only, in `qa/` and `qa/baseline/`.
- Headless, seeded (`proto.district.seed`). Fixed seeds, reused by 10.1–10.9.

### Deliverables

| File | Does |
|---|---|
| `qa/stand.js` (exists) | Stand-in-lane probe. Rerun at fixed seeds; save the output |
| `qa/policy.js` (new) | Port of the P3 `policy_check.js` to Prototype 9's `StorySim` and `ArcadeSim` |
| `qa/carmetrics.js` (new) | Port of the P3 `car_metrics.js`: car predictability under a scripted dummy |
| `qa/baseline/p9.json` | Every number below, per policy, district and seed |
| `qa/baseline/p9.md` | The tables, and the pillar 1 check |
| `qa/baseline/sasha_p9.md` | Sasha's oral notes, PT0–PT15, marked: no footage |

- **Source:** `lawrencelek/ELVTR-dummies-agent-crew`, branch `assignment4/content-pipeline`, `prototypes/p3/`. Read only.

### Policies (`qa/policy.js`)

| Policy | From | Behaviour |
|---|---|---|
| Stand in lane | P3 | Walks to a lane point; no button |
| Blind lunge every 1 s | P3 | Holds a lane-side point; dashes each second |
| Read and lunge | P3 | Picks the nearest unspent car within 150 units; leads it 0.12 s; dashes when facing within 12° |
| Wander | P3 `car_metrics.js` | Lissajous walk; dashes every 2.5 s |

- **Sims:**
  - Arcade, Endless: `monument`, `parkland`, `waterfront`.
  - Story: Monument A1–A3, with that tile's parts owned.
- **Duration:** 300 sim-seconds per run. Three seeds per sim.
- **The bot plays the run:** continue gift, report and brief screens as `qa/jam.js` does.

### Measures

Metric IDs are proposed for a `qa.fun.*` group in the registry. No targets yet: 10.0 records values only.

| Metric (proposed ID) | Definition |
|---|---|
| `qa.fun.hitsPerMin` | Damaging impacts (`impact` with `lost` > 0) per sim-minute |
| `qa.fun.writeOffsPerMin` | `writeoff` events per sim-minute |
| `qa.fun.firstHitSeconds` | Time to the first damaging impact |
| `qa.fun.firstWriteOffSeconds` | Time to the first write-off |
| `qa.fun.pointsPerMin` | `run.points` gained per sim-minute |
| `qa.fun.baitShare` | Share of impacts with `bait` true |
| `qa.fun.zoneMix` | Impacts by `zone`: front, frontDiagonal, side, rearDiagonal, rear |
| `qa.fun.carStateMix` | Impacts by `carState`: caution, intention, committed, expiring, interrupted |
| `qa.fun.readOverBlind` | Read-and-lunge points ÷ blind-lunge points (V29 D2.1) |
| `qa.fun.shiftsPerCar`, `qa.fun.headingSnaps` | From `qa/carmetrics.js` |

### Pillar 1's written test (Edit 19)

- **Fails if** standing earns more than 45% of a full head-on lunge (`qa.fun.standShareMax` 0.45, proposed).
- **Fails if** baiting earns less than 1.5× standing (`qa.fun.baitOverStandMin` 1.5, proposed).
- Points come from the impact events. Compute both per sim; report PASS or FAIL.
- **Expected:** FAIL in Prototype 9 (§2.2).

### Sasha's evidence (no replay needed)

- **The baseline human evidence is Sasha's oral notes** (§2.1). She gave them after a Prototype 9 session. No playthrough footage exists.
- `qa/baseline/sasha_p9.md` copies PT0–PT15 and marks them: oral, after play, no footage.
- A recorded Prototype 9 replay is optional, not a gate.

### Human sessions from 10.2 on

- **Record every session:** screen and voice. Oral notes alone are logged as oral notes.
- **Players:** Sasha plus one new player.
- **Observer:** says nothing during play (V29 Evaluation). Logs time stamps:
  - First deliberate hit.
  - First trick tried.
  - First complaint or laugh.
  - Any stand-in-lane play.
- **After play, three questions:**
  1. What were you trying to do?
  2. Why did that car hit you, or miss you?
  3. What would make you play again?

### Done when

- `qa/baseline/p9.json` and `p9.md` are committed, three seeds per sim.
- The pillar 1 check reports PASS or FAIL per sim.
- `qa/baseline/sasha_p9.md` holds Sasha's oral notes.
- `test_p9.js --p84` still passes 51/51; `python3 audio/freeze.py --check` passes.
- A DECISIONS row records the baseline numbers.
- **Next:** 10.1 changes one thing and reruns this suite.

## 11 Result: Prototype 10.0, the baseline (2 November, row 657)

- **Report:** `qa/baseline/p9.md`. Data: `qa/baseline/p9.json`, `qa/baseline/stand_p9.jsonl`.
- **Grid:** 6 sims × 4 policies × 3 start offsets, 300 sim-seconds each: 72 runs.
- **Build unchanged:**
  - Prototype 9 md5 `be163e7d014344e062965986b3da5786`; 8.4 md5 `9f5549201d88891f9f0b22c461602909`.
  - `test_p9.js --p84` 51/51; sound freeze 211 items, 0 changed.

### What the numbers say

| Finding | Evidence |
|---|---|
| Standing gets hit, as Sasha said | Stand policy: 18 damaging hits in 90 sim-minutes. Held in place: 16 hits in 7 of 10 placements. 0 write-offs |
| Standing pays almost nothing | 9–21 points a standing hit; 147–172 a head-on lunge. Stand share 0.06–0.14, under 0.45 |
| **Pillar 1's written test passes in all six sims** | Bait ÷ stand 1.8–8.1, over 1.5 (Edit 19) |
| **The aimed dash dominates** | The "read and lunge" bot reads no cue: nearest car, 0.12 s lead, dash. Arcade: 10–20 hits a minute; first hit under 1 s; first write-off 29–121 s |
| It finishes Arcade runs fast | Monument and Waterfront reached their ending in 2.3–3.9 minutes |
| Cars see it coming and still lose | 65% of its 809 hits landed on cars that had noticed the dummy (caution 305, intention 220) |
| Baiting is unnecessary | Bait share of its hits: 4–28% |
| Reading beats repetition, trivially | Read ÷ blind 44–653 (V29 D2.1 passes). Aiming counts as reading |
| Story gates it | A1: no dash before Battery 1. A2: 0 write-offs in 300 s (brief-gated). A3: one a run |
| Cars drive predictably | 0–0.38 shifts per car; 0 interrupts; 0–4 heading snaps a run |

### Corrections

- **Row 649's reading was wrong.** Pillar 1's written test passes. Row 657 supersedes it.
- §1, §2.2 and §3 C1 now say so. The challenge gap is the aimed dash, not standing.
- **PT1 stands as Sasha's experience:** standing does get hit, and each bump still looks like a hit.

### What it changes in the plan (D100)

- 10.1 as planned removes 16 cheap bumps. Low value.
- **Proposed:** re-aim 10.1 at the aimed dash.
  - One change: the duel car answers a dash it sees coming, within `perception.reactionDelay`.
  - Pass: the aimed-dash bot's hits a minute fall; a flank bot still clears; standing still earns nothing.
- That is tier 1's mechanic. 10.4 then tests only whether the lesson reads.
- **H0 stays, for feel:** unearned bumps look like hits.
- **H1 reframed:** hits feel earned once the aimed dash stops working.

## 12 Result: Prototype 10.0-v2, does avoidance escalate? (2 November, rows 658–659)

- **Question:** Lawrence clarified PT1 (row 658): Sasha meant it was too easy because avoidance never escalates.
  - "the car should learn something new each time. Or at least the 'learning' car."
- **Method:** `qa/escalation.js`. The aimed dash, repeated for 600 sim-seconds.
  - Grid: 4 sims × 2 variants × 2 start offsets = 16 runs.
  - Variants: as built, and `proto.learningEnabled` 1 (the dormant learning).
- **Report:** `qa/baseline/p9_escalation.md`. Data: `qa/baseline/p9_escalation.json`. Build unchanged.

### What Prototype 9 cars can learn

| Mechanism | IDs | On | Learns |
|---|---|---|---|
| Stop line | `proto.learn.standoffStep` 35 to `proto.learn.standoffMax` 190 | Yes, after a hit on a stopped car | A number |
| Forward beam | `learning.playerHitStep` 0.08 to `learning.playerHitCap` 0.4 | No (`proto.learningEnabled` 0) | A number |
| Approach registry (Edits 25–26) | — | Not built | — |
| **New behaviours** | — | — | **None** |

- One model per class: every sedan learns as one.

### Findings

| Finding | Evidence |
|---|---|
| As built, the same dash keeps working | Hits per dash, last two minutes ÷ first two: Monument 0.98, Parkland 1.10 |
| Where it wears out, it ends in a stalemate | Waterfront 0.46: one sedan's stop line reached 190, past `movement.lungeDistance` 164 (DB4a). Dashes at it never land |
| The dormant beam learning resists a little | Hits per dash: fresh cars 0.76; fully trained cars 0.42 |
| It too ends in stalemates | Monument 0.51 and Waterfront 0.47: one car dashed at 150–220 times, never hit |
| Nothing new is learned | Every learning event changes a number. Brake, shift, reverse, honk and unstick belong to the fixed driver |
| Story hides it | A3: dashes stop landing after minute 2 in both variants. The floor hold (`story.floorHold`), not learning |

- **Sasha is right.** Prototype 9 has no escalating sophistication.
- Its learning makes cars wait farther away until a dash can't reach. A wall, not a new trick.

### The escalation the plan needs

- **Rule (user-decided, row 658):** the learning car learns something new each time. White cars need not.
- **Reading (proposed, D101):** "new" means a behaviour, never only a bigger number. No lesson ends in a stalemate.

| Rung | It learns (a behaviour) | Real basis | Closes | Leaves open | Test |
|---|---|---|---|---|---|
| 0 | Nothing: drives its route | — | — | Walk in | 10.2 |
| 1 | Brake for a dash it sees coming | AEB (v1 §14.1) | The aimed frontal dash | The flank | 10.1 (D100), 10.4 |
| 2 | Watch the flanks; swerve away | Side sensors; evasive steering | The flank dash | Above | 10.6 |
| 3 | See height; hold back near jump points | Occupancy grid (v1 §14.2) | The jump | Cover; a cone | After 10.7 |
| 4 | Predict your path | Occupancy flow | Cover and cones | The feint after commit | After 10.7 |
| 5 | Counter your habit | Alien: Isolation, MGS V (§4.3) | Your favourite trick | Any other | 10.7 |

### What it changes

- **10.1 (D100):** the evidence points to rung 1, the car answering an aimed dash. Recommended.
- **The duel car runs without stop-line learning** (`proto.learn.standoffEnabled` 0). It only builds stalemates. Proposed (D101).
- **New measures (proposed IDs):** `qa.esc.decay`, `qa.esc.learnEvents`, `qa.esc.newBehaviours`.
- **Every later test reruns `qa/escalation.js`** on its build. Pass (proposed):
  - Each lesson adds one response type.
  - The closed trick's decay falls below 0.5.
  - No stalemate windows.

## 13 Result: Prototype 10.0-v3, side sensing and the flank (2 November, rows 660, 662)

- **Question (Lawrence):** the early side sensor may be missing. Is the flank too easy, or too hard to approach?
- **Method:** `qa/flank.js`, Arcade Endless.
  - Grid: 3 districts × 4 variants × 2 bots × 2 offsets, 300 s each: 48 runs.
  - Bots: `aim` dashes at the nearest car; `flank` comes alongside a moving car and dashes into its side.
- **Report:** `qa/baseline/p9_flank.md`. Data: `qa/baseline/p9_flank.json`. Build unchanged.

### The side sensor, then and now

| When | Side sensing | Driving response | Source |
|---|---|---|---|
| Vertical slice (CR-005) | Arcs 100 from the nose, 80° each side | The car slows to its wary speed; never swerves | Row 45: "so it's not like the car is totally blind from the side" |
| P1 | The same arcs (`perception.sideRadius`, `perception.sideHalfAngle`) | Slows only (`proto.sideSlowFraction`) | P1 brief, P1.13 |
| P1.7–P1.9 | The driver's field: a box alongside and ahead, `proto.driver.cautionZone` wide | Slows to `proto.driver.cautionSpeed` | DB3a |
| Prototype 9 | The arcs are computed and drawn but drive nothing. The driver's field (180) slows the car | Slow only | `sim.js` `perceive`; `game.js` draw |

- **No record of a request to remove it.** The arcs survived as a drawing; the field took over the slowing.
- **P1.13 (14 October) already flagged the flank:** lunging from the shoulder completed the contract without baiting. A human playtest was to decide. Sasha's notes are that playtest.
- **The cue lies.** The drawn arcs (100, 80°) are not the zone that acts (a 180 box).

### Findings

| Variant | Flank dashes that land | Flank hits a minute | Aimed-dash hits a minute |
|---|---|---|---|
| `built` (field 180, slows to 82) | 0.51 | 12.1 | 16.2 |
| `rowFortyFive` (field 100) | 0.44 | 11.4 | 17.2 |
| `blind` (field 0: no side awareness) | 0.52 | 13.0 | 16.6 |
| `wary` (slows to 41) | 0.58 | 15.3 | 13.4 |

- **Side awareness exists but does not defend.** Blind and built cars lose the flank equally.
- **Slowing helps the dummy.** A slower car is easier to hit from the side.
- **The flank is too easy, not too hard.** First flank hit in 3–9 s; 44–55% of side dashes land.
- **Cars notice and still lose.** Of 350 flank hits on built cars, 258 landed on cars in caution.
- **Flank hits pay less:** about 164 points a hit against 269 for the aimed dash (`damage.zone.side` 0.3).

### A bug found on the way (row 662)

- In Story and Arcade, each screen's traffic runs in its own sim.
- From the build's values, only two reach it (`TRAFFIC_KEYS`: `proto.droneConeSeconds`, `proto.driver.coneSteepPass`).
- **So `proto.driver.dodgeFollowsCone` (1 in Prototype 9, row 632) never reaches district traffic.** Its screen sims hold 0.
- **Unproven lead for the jam (row 638):** cars round a moved cone keep the other lane.
- Prototype 9 stays frozen. Prototype 10 passes every driver value (D102).
- From 10.0-v3 on, probes set driver values on every screen's sim. 10.0 and 10.0-v2 changed no driver value, so they stand.

### How games make vehicles and guards see you

| Game | Detection | Escalation |
|---|---|---|
| Stealth games (School of Stealth survey) | A strong central cone and a weaker peripheral zone. Awareness meters fill slower far off, at the edge of view, in low light, crouched or still | Suspicion states read through posture and barks |
| Shadow Tactics | Near zone: near-instant detection. Darker zone: safe crouched, not standing. Rules drawn on screen | — |
| Splinter Cell: Blacklist | A small zone behind the guard: a sense that someone is near | — |
| Thief | Guards learn second-hand from other guards | — |
| GTA V | Police see you; out of sight, search cones show on the radar | Each star adds units and tactics: rams, roadblocks, spike strips, helicopters, SWAT, then saturation |
| Need for Speed: Most Wanted (2005) | Pursuit bar; hiding spots speed the cooldown | Each heat condition adds a unit or tactic: undercover cars and roadblocks; Rhino SUVs that charge head-on; spike strips and a helicopter; federal units |

- **What they share (research, not yet a DUMMIES rule):**
  - Strong front, weak edges: detection builds slower at the periphery.
  - Escalation adds a new unit or tactic, not just more of the same.
  - The rules are drawn, so a miss can be explained.

### What it means

- **The side sensor isn't missing; its response is.** Slowing never avoids.
- **Rung 2 (§12) becomes the missing side sensor:**
  - Sense the flank slowly: a notice time at the side (`perception.sideNoticeSeconds`, proposed), against `perception.reactionDelay` ahead.
  - Answer with a real move: swerve away or speed past (v1 §14.1).
  - Draw the zone that acts, not the old arcs (D103).

## 14 Prototype 10, revised scope (2 November, row 661)

> "Don't try to rebuild all maps at once. For p10 build a reduced scenario where a two one way roads pass, then two two lane roads. probably the complexity of the road junction and the items in the road and how to get onto the road matter more than the urban landscape. for the purposes of gameplay escalation keep the road scenario the same to start with. in fact we can start with just ONE car type, to simplify testing. we focus on one map (say, monument) and the nine test scenarios can give escalating learning too." (Lawrence)

### 14.1 Scope

- **One map:** Monument. One screen, its palette. No district, no other maps.
- **Road scenario A (10.1–10.7):** two one-way roads crossing at a junction. It stays the same while the car escalates.
- **Road scenario B (10.8–10.9):** the same junction as two two-lane, two-way roads.
- **What the scenario must hold** (the parts that matter more than the city):
  - **The junction:** right of way, a blind corner, a turn.
  - **Items in the road:** cones, a barrier gap.
  - **Ways onto the road:** a kerb, a crossing, a gap in the barrier, a raised edge to jump from.
- **One car type:** the sedan (`vehicles.sedan.*`). Red is the learning car. In 10.8–10.9, white sedans that never learn.
- **One sim:** the base `Sim`, not a district. Every value reaches the cars; no `TRAFFIC_KEYS` gap (row 662).
- **Supersedes** the Proving Ground (D94) and the 10.1–10.9 rows of §9.3. The ten-test method (row 653) holds.

### 14.2 The nine tests: one rung each (proposed order, D104)

Each test changes one thing. From 10.2, that change is one new behaviour for the red car: the trick that just won is closed and one opening is left.

| Test | Road | The one change | The red car learns | Closes | Leaves open | Part by drone |
|---|---|---|---|---|---|---|
| **10.1** | A | The test road: Monument junction, one red sedan, no score | Nothing (rung 0) | — | Walk into its path | None (on foot) |
| **10.2** | A | Rung 1, shown as a lesson (clip, sensor fitted, return); no goal text | Brake for what is ahead | Front: walking or dashing | The flank | Battery 1, the dash |
| **10.3** | A | Rung 2: the missing side sensor, wired and drawn true | Watch the flanks; swerve away or speed past | The flank dash | Above: jump from a raised edge | Legs 1, jump |
| **10.4** | A | Rung 3 | See height | The jump | The junction's blind corner | — |
| **10.5** | A | Rung 4 | Creep at the junction | The corner ambush | Items in the road: a cone forces a swerve | Hands 1, cones |
| **10.6** | A | Rung 5 | Read road items: stop at a cone, don't swerve | Cone diversion | The feint after it commits | — |
| **10.7** | A | Rung 6 | Counter your habit | Your favourite opening | Any other | — |
| **10.8** | B | The road upgrade: two-way, with white sedans that never learn | — | Its swerve into an empty lane | Oncoming traffic blocks its escape | — |
| **10.9** | B | Swerve cost: a red swerve into a white sedan is an Incident (`traffic.carContact`) | Prefer braking | The swerve escape | Box it in | — |

- **Revised (row 717, proposed; D121):** 10.8 is rung 7, the search: it looks where it last saw you; closes seen-then-hidden; leaves the crawl. The road upgrade moves to 10.9, swerve cost to 10.10.
- **Every test reruns the probes** on its build: `qa/stand.js`, `qa/policy.js`, `qa/escalation.js`, `qa/flank.js`.
- **Pass (proposed):**
  - The new behaviour appears (`qa.esc.newBehaviours`).
  - The closed trick's decay is below 0.5 (`qa.esc.decay`).
  - The opening still lands; an unupgraded way stays (pillar 1, D97).
  - No stalemate windows.
- **Human pass:** Sasha plus one new player, recorded (§10).
- **Parts:** this order (dash, jump, cones) differs from Story's Monument order (Edit 93). The duel delivers its own.

### 14.3 Next: the 10.1 spec

- `prototypes/p10/`: `build.py` from Prototype 9's, and its own files that extend the base `Sim`: the `junction` level, the red car, the rungs.
- **Shared files stay untouched,** so a Prototype 9 rebuild keeps its md5 (v1 §4). Story extends `Sim6` the same way (`p7/story.js`).
- Probes gain a `--level junction` target before 10.1's run.

## 15 Result: Prototype 10.1, the test road (2 November, rows 663–666; GDD Edit 101)

- **Build:** `prototypes/p10/dummies_p10.html`, linked first from `index.html`. Greybox; on foot.
- **Scenario A:** one Monument screen; two one-way roads cross; kerbs, a zebra, a barrier with a gap, a blind corner, the plinth.
- **The red car, rung 0:** one sedan, alone on the road, back 4 s after it leaves (`duel.redReturnSeconds`). It senses and learns nothing.
- **Checks:** `node prototypes/p10/test_p10.js --page` 9/9. Prototype 9 51/51; both frozen md5s hold; sound freeze holds.
- **Measured** (`qa/baseline/p10_1.md`):
  - Walking into its path: 3.7 hits a minute; a write-off every 74 s.
  - Standing on a lane's line: 1.2–1.3 hits a minute at 100 damage, head-on. By design at rung 0.
  - Ten minutes of walking in: no decay (1.14), no learning events.
- **Registry first:** the 29 sim-only IDs are registered; three `duel.*` IDs added. Version unchanged, so Prototype 9's rebuild holds.
- **Probes on the test road:** `node qa/testroad.js` covers standing, walking in, wandering, dashing, the flank and escalation.
- **Open:**
  - The human pass (H3): Sasha plus one new player, 5 minutes free play each, recorded.
  - D105: a sighted car waited for ever for a dummy standing just off its lane line.
- **Next:** 10.2, rung 1. Built: §16.

## 16 Result: Prototype 10.2, the first lesson (2 November, rows 667–672; GDD Edit 102)

- **Build:** `prototypes/p10/dummies_p10_2.html`, first card on `index.html`. 10.1's page is frozen (row 672).
- **The one change:** rung 1, taught by one lesson. The car starts at rung 0; a hit on its nose teaches it.
- **Checks:** `node prototypes/p10/test_p10.js --page` 16/16. Probes `qa/baseline/p10_2.md` 12/12. Prototype 9 51/51; frozen md5s hold; sound freeze holds.

### 16.1 The lesson, as built (§9.1's four beats)

| Beat | On screen | Values |
|---|---|---|
| Cause | A hit on the nose at rung 0. A side bump teaches nothing | `front`, `frontDiagonal` |
| Clip | Once the car has left: the hit replayed as its training clip; the impact frame boxed | `duel.lessonClipSeconds` 3, `duel.lessonHoldSeconds` 0.8 |
| Update | A drone fits the camera on the nose; the beam draws out | `duel.lessonFitSeconds` 2 |
| Return | The same tag, SEDAN-01, at rung 1 | `duel.redReturnSeconds` 4; drive-in 5.2 s |
| New behaviour | It slows when it sees you; stops 226 short; honks; passes | §16.2 |

- **No goal text.** Labels name the car and the part only.
- **The dash** arrives by drone at the car's first brake for the dummy (`duel.dashArrives` 2): the tool where the problem is.

### 16.2 Rung 1: why the front needed more than a brake

| Tried | Result | Fix |
|---|---|---|
| Prototype 9's stop: late, as comfort allows, 50 short | A dash still reaches the braking car | Stop beyond dash reach |
| Stop 190 short (`proto.learn.standoffMax`) | Walk up and dash the stopped car: 52 damage, as much as the flank (53) | Standstill: no damage, no lesson (row 668) |
| Hard stop when the dummy closes | A sprint from the far side still lands: the 560 beam is shorter than the stop needs | Beam 720; slow from first sight within the safe envelope (row 669) |
| Car appears near a dummy at the screen's edge | It spawns inside the envelope | Run-in of a beam plus a car length (row 670) |

- **The safe envelope** (Mobileye RSS, §4.2): the gap a dummy needs to dash into the nose if it ran at the car while the car reacted and stopped.
  - It uses `movement.runSpeed`, `perception.reactionDelay`, `traffic.hardBraking`, `movement.lungeDistance` and `body.radius`.
  - At cruise it is 670; at a standstill, 226.
- **Real basis:** AEB brakes for what is ahead. It cannot undo a late step from the kerb (v1 §14.1; Euro NCAP's obstructed-pedestrian case).

### 16.3 Measured (rung 1 alone; `trained` mode)

| Way in | Hits a minute | Verdict |
|---|---|---|
| Stand in the lane, on a line or 8 off it | 0 | Closed |
| Sprint at it down its lane, dash in reach | 0 (19 charges, 19 standstill touches) | Closed |
| Step in late from the kerb, on foot | 1.94 (88 a hit) | Open: pillar 1, D97 |
| Dash into its side | 2.81 (53 a hit) | Open: the flank |

- **Escalation (`lesson` mode, 10 minutes):** standing and charging decay to 0 after the lesson; the late step-in holds at 0.75.
- **New behaviours (`qa.esc.newBehaviours`):** the brake for the dummy, the pass, the honk. None at rung 0.
- **Pass (§14.2):** a new behaviour appears; the closed trick's decay is below 0.5; an unupgraded way stays; no stalls.

### 16.4 Open

- **Human pass (H3):** Sasha plus one new player, recorded.
  - Explains why it brakes within 2 minutes (old 10.4's pass).
  - Finds the late step-in or the flank unprompted.
  - Uses the dash within the level (old 10.5's pass).
- **D105 remainder:** a dummy at a stopped car's bumper holds it until it steps away.
- **D106–D109:** standstill; envelope and beam; dash timing; return against drive-in.
- **Next:** 10.3, rung 2: the side sensor wired and drawn true. It closes the flank; the jump arrives. Built: §17.

## 17 Result: Prototype 10.3, the side sensors (2 November, rows 673–678; GDD Edit 103)

- **Build:** `prototypes/p10/dummies_p10_3.html`. 10.2's page is frozen.
- **The one change:** rung 2, taught by one lesson. The car starts at rung 1; the dummy starts with the dash.
- **Checks:** `node prototypes/p10/test_p10.js --page` 24/24. Probes `qa/baseline/p10_3.md` 12/12. Prototype 9 51/51; frozen md5s hold; sound freeze holds.

### 17.1 One page per test (Lawrence's question)

| Test | Page | State | The one change |
|---|---|---|---|
| 10.0 | `prototypes/p9/dummies_p9.html` | Prototype 9 as built | None: the baseline Sasha played |
| 10.1 | `prototypes/p10/dummies_p10.html` | Frozen, md5 `82ab5e55…` | The test road; rung 0 |
| 10.2 | `prototypes/p10/dummies_p10_2.html` | Frozen, md5 `9dd14c58…` | Rung 1, the forward camera; the dash |
| 10.3 | `prototypes/p10/dummies_p10_3.html` | Current | Rung 2, the side sensors; the jump |

- `index.html` lists them in order, each with what to look for.
- A page freezes when the next test is built. Its values stay in `sim_flags.json`, so the probes rerun it on today's code.

### 17.2 Rung 2: why it stops instead of swerving

| Tried | Result | Why |
|---|---|---|
| The side arcs (`perception.sideRadius` 200) and a swerve to the far kerb | Flank 2.8 a minute at 53: unchanged | The road is 112 wide; a dash reaches 177 |
| The same, with a flinch when the dummy dashes | Unchanged | A side hit's damage is the dummy's own strike; the car's speed adds nothing |
| The driver's field, and the envelope measured straight | The open flank, kerb, late step-in and corner score 0 | A stopped car is a wall (row 668) |

- **Weak edges** (§13, stealth games): it notices a dummy in its field after `perception.sideNoticeSeconds` (0.6); ahead, after `perception.reactionDelay` (0.3). A meter shows the notice.
- **It waits while you stay in its field,** honking. It no longer passes a dummy in its lane.

### 17.3 Measured (rung 2 alone; `trained` mode)

| Way in | Hits a minute | Verdict |
|---|---|---|
| The open kerb, the open flank, the late step-in, the corner, the lane | 0 | Closed |
| Behind the barrier, through its gap | 2.07 (52 a hit) | Open: cover, no Legs (pillar 1, D97) |
| Down from the plinth | 2.68 (53) | Open: the raised edge, with Legs 1 |
| A jump from behind the barrier | 2.70 (124) | Open: cover and the jump |

- **Escalation (`lesson` mode, 10 minutes):** the closed tricks decay to 0; the gap holds at 0.8; the plinth starts once Legs 1 arrives.
- **Legs 1** arrives 1.0–3.3 s after the car first stops for a dummy beside its path.
- **The cost (D110):** a dummy in the open near the road holds the car; bots that stay there see 0.2–0.5 cars a minute.

### 17.4 Open

- **Human pass (H3):** does the player read the meter and the wait, find cover or the plinth unprompted, and use the jump?
- **D110–D112:** the wait; cover open beside the plinth; the plinth needs a dash-jump.
- **D105:** a dummy at a stopped car's bumper still holds it.
- **Next:** 10.4, rung 3: see height. It closes the plinth and the jump; the blind corner is meant to stay open. Built: §18.

## 18 Result: Prototype 10.4, the roof lidar (2 November, rows 679–684; GDD Edit 104)

- **Build:** `prototypes/p10/dummies_p10_4.html`. 10.3's page is frozen.
- **The one change:** rung 3, taught by one lesson. The car starts at rung 2; the dummy starts with the dash and the jump.
- **Checks:** `node prototypes/p10/test_p10.js --page` 28/28. Probes `qa/baseline/p10_4.md` 12/12. Prototype 9 51/51; frozen md5s hold; sound freeze holds.

### 18.1 What changed

| | Before (rung 2) | After (rung 3) |
|---|---|---|
| A dummy on the plinth | Unseen: the plinth hid it, and its sensors saw only the ground | Seen: it stops short and waits |
| A dummy in the air | Unseen | Seen |
| What teaches it | Any hit but a tail bump | Only a hit from above: a jump's strike, or a dash off the plinth |
| A spent car | Stopped for the dummy like any other | Drives off to its lesson (row 681) |

- **Row 681 was found by the 10.4 page check.** A dummy in a spent car's field held it, so the lesson never began. It also made 10.4's first probe overstate the closure: the jump from cover looked closed at 0.2–0.4 a minute. With spent cars driving off, it lands 2.70 a minute.

### 18.2 Measured (rung 3 alone; `trained` mode)

| Way in | Hits a minute | Verdict |
|---|---|---|
| Down from the plinth | 0.07 (one hit in 15 minutes) | Closed |
| The open kerb, the open flank, the late step-in, the corner, the lane | 0 | Closed |
| Through the barrier's gap | 2.21 (52) | Open: cover |
| A jump from behind the barrier | 2.70 (124) | Open: cover |

- **Escalation (`lesson` mode, 10 minutes):** the plinth decays to 0 after the lesson; the gap holds at 0.6; the jump from behind the barrier holds at 1.2.

### 18.3 The ladder from here (row 683; revises §14.2's rungs 4–6, D104)

| Rung | It learns | Closes | Leaves open | Status |
|---|---|---|---|---|
| 4 | Slows past what it cannot see: a blind spot near its path may hide a dummy | Cover: the barrier and its gap | Items in the road: a cone forces a swerve | Proposed |
| 5 | Reads road items: stops at a cone, never swerves | The cone diversion | The feint after it commits | As §14.2 |
| 6 | Counters your habit | Your favourite opening | Any other | As §14.2 |

- **§14.2's rung 4 was "creep at the junction" against the blind corner.** Rung 2's field already closed the corner, because the building hides too little.

### 18.4 Open

- **Human pass (H3):** does the player see that it now stops for the plinth, and turn to cover?
- **D113:** resolved 2 November (row 685, §19.1).
- **D110–D112** stand as built.
- **Next:** 10.5 (§19). Rung 4 became the street cameras (row 690).

## 19 Result: Prototype 10.5, the street cameras (2 November, rows 685–693; GDD Edit 105)

- **Build:** `prototypes/p10/dummies_p10_5.html`. 10.4's page is frozen.
- **The one change:** rung 4, taught by one lesson. The car starts at rung 3; the dummy starts with the dash and the jump. Hands 1, the cones, arrive by drone.
- **Checks:** `node prototypes/p10/test_p10.js --page` 35/35. Probes `qa/baseline/p10_5.md` 13/13. 10.3 and 10.4's probes 12/12 each on today's code. Prototype 9 51/51; frozen md5s hold; sound freeze holds.

### 19.1 D113 first: what hid the dummy (row 685)

- **Lawrence:** "only count hits where height was what hid you."
- **Rule:** a hit teaches rung 3 when it comes from above and the car had the dummy in sight past cover for the whole training clip (`duel.lessonClipSeconds` 3).
- **The plinth is height; the building and the barrier are cover.**
- **Measured:** jumps from behind the barrier were in sight 0.48–2.7 s before each hit, and no longer teach. The plinth's hits: 4.6–6.8 s; lessons in 3 of 3.
- **The bar:** `perception.sideNoticeSeconds` (0.6) was tried first. Half the jumps from cover (in sight 0.75 s) still taught.
- **10.4's page was rebuilt with the rule, then frozen** (md5 `b12b48d8…`).

### 19.2 Why rung 4 is not "slow past what it cannot see" (row 690)

- **A dash out of the barrier's gap covers road A's near lane in under 0.1 s.** The car reacts after 0.3 s.
- **Only a car already at a standstill is safe** (row 668). Crossing the gap's reach at that speed takes over a minute.
- **So rung 4 sees behind cover instead: the junction's street cameras.** Shenzhen is one of 20 pilot cities for vehicle-road-cloud integration, where roadside sensors share what they see with cars.
- **Open (D114):** keep the cameras; or memory of where it lost the dummy; or slowing anyway, as a tell.

### 19.3 What changed

| | Before (rung 3) | After (rung 4) |
|---|---|---|
| A dummy behind the barrier or the building | Unseen | Seen through the cameras: it stops short and waits |
| What teaches it | A hit where height hid the dummy | A hit where cover hid it |
| The dummy's parts | Battery 1, Legs 1 | Hands 1 arrives at the first stop behind cover: E carries and lays cones |
| A swerve round a cone (every rung from 2) | Broken off for a dummy in its field | Held until it has passed the cone (row 689) |

### 19.4 Measured (rung 4 alone; `trained` mode)

| Way in | Hits a minute | Verdict |
|---|---|---|
| Through the barrier's gap; the aimed dash from behind it | 0 | Closed |
| The jump, the dash-jump, the flank from behind the barrier | 0.07 each | Closed: one hit each in 15 minutes, the sprint from past the field |
| The plinth, the kerb, the corner, the lane, standing, charging | 0 | Closed |
| The cone bait (Hands 1) | 2.00 (31) | Open: the new part's way in |
| The sprint from past the field | 0.80 (52) | Open, no part (D115) |

- **The lesson:** in 18 of 18 runs with a hit out of cover; in 0 of 5 with only hits from the open. Hands 1 2.3–2.4 s after the first stop behind cover.
- **Escalation (`lesson` mode, 10 minutes):** the gap and the jump decay to 0; the cone bait holds at 0.75.

### 19.5 Found on the way

- **The lurch (row 688).** A car waiting for a dummy beside it lurched forward when the dummy stepped into its path. It now stays stopped.
- **The sprint from past the field (row 691).** It lands at rungs 2–4: 0.8 a minute at 52, at 10.3, 10.4 and 10.5 alike.
  - The field reaches 202 from the lane; a sprint during the 0.6 s notice plus a dash reaches about 274.
  - Every earlier bot waited inside the field, so the earlier tables missed it.
  - Each hit lands on a leg. The dash shortens with leg damage (164 to 116 after four hits); then it no longer reaches.
- **A car waiting off screen** now shows a marker at the screen's edge on the 10.5 page.

### 19.6 The ladder from here

| Rung | It learns | Closes | Leaves open | Status |
|---|---|---|---|---|
| 5 | Reads road items: stops at a cone, never swerves | The cone bait | The feint after it commits; the sprint from past the field (D115) | As §14.2 |
| 6 | Counters your habit | Your favourite opening | Any other | As §14.2 |

### 19.7 Open

- **Human pass (H4):** does the player read the camera link, and find the cone without being told?
- **D114, D115.** D110: standing anywhere near the road now holds the car, behind cover too.
- **Next:** 10.6, rung 5.

## 20 Major learning: a stealth game, played from the other side (2 November, row 694)

> "Maybe DUCK becomes an ability - so it's a bit more like a stealth game? (This is a major learning)" (Lawrence, 2 November, 22:58)

### 20.1 The reading

| Stealth game | The duel, as built |
|---|---|
| Guard's vision cone | The forward beam (`perception.forwardLength`) |
| Peripheral vision, slower to notice | The driver's field (`proto.driver.cautionZone`; `perception.sideNoticeSeconds`) |
| Alert meter | The notice meter drawn over the car |
| Alert | It stops at the safe envelope and honks |
| Guard upgrades | Rungs 1–4: camera, side sensors, roof lidar, street cameras |
| Stealth tools | Dash, jump, cones; next, DUCK |

- **The goal inverts the genre.** The dummy hides to be hit, not to escape.
- **Seen, it stops short.** Unseen, it drives on into reach.
- **Every later rung is a sense; every part, a stealth tool.** D104's ladder is reread this way (D116).

### 20.2 DUCK, proposed (D116)

- **Hold to duck.** Lower and slower. Releasing stands; a dash from a duck springs at once.
- **In the open:** the field notices a crouched dummy slower (§13: awareness fills slower crouched).
- **Behind cover taller than it:** hidden from a sensor whose sightline clears the cover only past the dummy. A high sensor sees in sooner as it nears.
- **Cover to duck behind:** low planters, as in the districts (`world.gardenPlanter`). Movable with Arms later.
- **New IDs, registry first:** `body.duckHeight`, `movement.duckSpeed`, `perception.duckNoticeFactor`, `perception.sensorHeight`, `props.planter.height`, `duel.duckArrives`.

### 20.3 What it changes next

- **10.6:** rung 5 stops at a cone and never swerves (§14.2), which closes the cone bait. DUCK arrives; low planters stand by the road.
- **A later rung:** the car remembers where it lost you and stops short of that spot. It leaves open what true stealth needs: get into hiding before it sees you.

## 21 Result: Prototype 10.6, DUCK (3 November, rows 695–700; GDD Edit 106)

- **Build:** `prototypes/p10/dummies_p10_6.html`. 10.5's page is frozen.
- **The one change:** rung 5, taught by one lesson. The car starts at rung 4; the dummy starts with the dash, the jump and the cones. DUCK arrives by drone.
- **Checks:** `node prototypes/p10/test_p10.js --page` 41/41. Probes `qa/baseline/p10_6.md` 14/14. 10.3–10.5 on today's code 12/12, 12/12, 13/13. Prototype 9 51/51; frozen md5s hold; sound freeze holds.

### 21.1 What changed

| | Before (rung 4) | After (rung 5) |
|---|---|---|
| A cone in its lane | It swerves round it, and holds its line | It stops short and waits for FARSIGHT |
| What teaches it | A hit out of cover | A hit while it swerved round a cone |
| The dummy's parts | Battery 1, Legs 1, Hands 1 | DUCK arrives at its first stop at a cone |
| Low cover | — | Three planter rows; sightlines run by height |

### 21.2 DUCK and the planters (rows 696–697)

- **Hold C to duck:** lower, slower, noticed slower. A dash or a jump stands it up.
- **A planter row hides only a ducked dummy.** Standing, it shows over the row.
- **Rows, not single planters.** The field sees 720 up the road, so one planter hid a ducked dummy only from a car abreast of it.
- **A dash vaults a planter.** The ambush: duck behind a row, spring over it as the car passes.
- **The cameras watch the cover near their posts** (`perception.streetCameraRange` 180). The rows lie outside it.
- **On screen:** ducked and unseen, the dummy dims and reads HIDDEN. Each camera's reach is a dotted ring.

### 21.3 Measured (rung 5 alone; `trained` mode)

| Way in | Hits a minute | Verdict |
|---|---|---|
| The cone bait | 0 (318 stops at a cone, 0 swerves) | Closed |
| Cover, the plinth, the kerb, the corner, the lane | 0–0.07 | Closed |
| Standing behind the planter | 0 | Closed: it sees over the row |
| DUCK behind the planter | 3.03 (114) | Open: 0.40 write-offs a minute (D117) |
| The sprint from past the field | 0.80 (52) | Open, no part (D115) |

- **The lesson:** in 6 of 6 runs with a hit round a cone; 0 of 7 others. DUCK 1.4–2.5 s after the first stop at a cone.
- **Escalation (10 minutes):** the cone bait decays to 0; the planter ambush holds at 1.0.

### 21.4 The stealth reading, so far (§20)

| Rung | The car's sense | The dummy's tool | The opening it leaves |
|---|---|---|---|
| 1 | A forward camera | The dash | The flank |
| 2 | Side sensors | The jump | Height, cover |
| 3 | A roof lidar | — | Cover |
| 4 | Street cameras | Cones | The cone's swerve |
| 5 | Road items | DUCK | Low cover, by height |
| 6 (next) | Your habit | — | Any other way |

### 21.5 Open

- **Human pass (H5):** does the player read HIDDEN and SEEN, and find the spring over the row?
- **D117** the ambush's strength; **D118** the cameras' range; **D115** the sprint from past the field.
- **Next:** 10.7, rung 6: it counters your habit. Learning the spot it was hit from closes the ambush.

## 22 Showing what it learned; pace (3 November, rows 701–702)

> "the car in 10.7 who has learned also needs to show that it's learned. Sensor display is crucial then." (Lawrence, 3 November)

- **Rule (row 701):** every learned behaviour draws, on the car and on the road. It extends D103: draw the zone that acts.
- **Kept:** the sprint from past the field (D115); each camera watches the cover near its post (D118).

### 22.1 Pace (row 702)

| Measure | 10.6, DUCK behind a planter | GDD target |
|---|---|---|
| A hit | Every 20 s | Inside the first minute (Edit 18 §10.2) |
| A write-off | Every 140 s (800-point body, 114 a hit) | At most 80 s; 100 s in a five-minute visit |
| Passes | 5.6 a minute; 54% struck | — |

- **The limit is the car's supply.** A pass takes 10.7 s; 5.2 s of it is the run-in, off screen (D109).
- **D117:** cut the dead time; a lighter test-road body; more from a spring out of a duck; or leave it, since the duel pays in lessons.

## 23 Result: Prototype 10.7, crash memory (3 November, rows 703–709; GDD Edit 107)

> "there should be a 'crash detritus' left on the road when you crash there. Like an 'outline' they have on NYC sidewalk if someone dies. On the car: Let's try ok having it on the car. And OK on the lesson screen. Let's try shorter drive-in, and lighter body on the test road (500 health)." (Lawrence, 3 November)

- **Build:** `prototypes/p10/dummies_p10_7.html`. 10.6's page is frozen.
- **The one change:** rung 6, taught by one lesson. The car starts at rung 5; the dummy starts with all four parts. No new part.
- **Checks:** `node prototypes/p10/test_p10.js --page` 51/51. Probes `qa/baseline/p10_7.md` 17/17 (rows 713, 715). 10.6 reruns identical; 10.3–10.5 on today's code 12/12, 12/12, 13/13. Prototype 9 and the frozen md5s hold; sound freeze holds.

### 23.1 What changed

| | Before (rung 5) | After (rung 6) |
|---|---|---|
| A crash | Leaves nothing | A chalk outline, debris, a numbered evidence marker; it stays |
| What teaches it | A hit while it swerved round a cone | A hit sprung from the spot of an earlier crash |
| A dummy at a spot it remembers | Hidden behind a planter, noticed slowly in the open | Expected: seen past cover, noticed at once |
| What it remembers | — | The latest three crash spots (`duel.memorySites`) |
| Between passes | 5.2 s of empty road; an 800 body | 2 s; a 500 body |

### 23.2 Showing what it learned (row 701)

- **Road:** a red ring on each remembered spot, its crash's number, a line to the outline. A forgotten crash fades.
- **Car:** a memory module, one red light a spot. "R6 · MEMORY 3". A red scan to each spot in its field: "CHECKING #n".
- **Dummy:** EXPECTED at a remembered spot.
- **Lesson:** the clip rings "SAME SPOT AS CRASH n"; the fitting maps the spots it now remembers.

### 23.3 Measured (rung 6 alone; `trained` mode)

| Way in | Hits a minute | Verdict |
|---|---|---|
| DUCK behind a planter, the same spot | 0.27 (once from cover a run) | Closed: it then stops for the dummy there |
| DUCK behind a planter, moving to free spots | 6.97 (242) | Open: a write-off every 18 s (D119) |
| The sprint from past the field | 0.60 (53) | Open, no part (D115); leaves no spot (row 713) |
| Every other bot | 0 | Closed |

- **Pace:** the same ambush, without memory, on 10.7's run-in and body: a write-off every 74 s (10.6: 148 s; target 80 s).
- **Short run-in:** a car that already senses the dummy appears at its envelope's speed (75 of 670). Standing at the edge is never hit.

### 23.4 The stealth reading, so far (§20)

| Rung | The car's sense | The dummy's tool | The opening it leaves |
|---|---|---|---|
| 5 | Road items | DUCK | Low cover, by height |
| 6 | Your habit: the last three spots | — | Any other spot; the sprint |

- **The guard now checks your old hiding places.** Alien: Isolation's and MGS V's counter, capped and falling back (§4.3).

### 23.5 Open

- **Human pass (H6):** does the player read the red rings, and move?
- **D119:** an expert mover writes off a body every 18 s, a quarter of the target.
- **D120:** the memory's cap: 3, 5, or every crash.
- **Next:** ~~10.8, the road upgrade (§14.2)~~ 10.8 became the search (§25, row 717). The road upgrade moves to 10.9 (D121).

## 24 Five interlocking systems (3 November, row 710)

> "it seems like there should be these interlocking factors. This will have implications for these other design systems later on. Make a running document of these factors, as we will use them to re-design the levels." (Lawrence, 3 November)

- **Document:** `docs/DUMMIES_Interlocking_Systems.md`. Running: every test and level edit updates it.
- **Factors:** character control and abilities; car behaviour and abilities; emergent group behaviour; level design; moveable objects.
- **Contents:** an interlock table; each factor as built, with registry values; findings F1–F14; a level checklist; questions Q1–Q7.
- **Use:** the level redesign reads it first. A change to one factor lists its effect on the other four.
- **Answered (row 711):** cars are cover. Parked cars count; white cars block the red car. Cars queued behind a waiting red car flash their lights: test under group behaviour.
- **Answered (row 712):** memory follows cover. A parked car that drives off takes its spot's memory; a new car there makes a fresh spot. Parked cars leave and arrive, seen coming. White cars block the red car on one-way roads too; they arrive in 10.8.
- **Answered (row 713):** a crash from the open leaves no spot: it was skill. 10.7 amended; probes 16/16.
- **Added (row 714):** §8, the control table: every object type, what hides, obstructs, is remembered and resets. §9, stealth research: ten games, ten patterns, each with a proposal.
- **Built (row 715):** the block lift. A car kept waiting 10 s by the dummy or its cone calls a drone; it lifts the dummy beside the road until the car has left. 10.7 amended; probes 17/17. The flank from open pavement now lands 0.4 a minute: its stalemate had hidden the sprint from past the field (D115).
- **Adopted (row 716):** the six §9.2 proposals: a last-seen ghost, a search state, an area alert, moving cover draws notice, spots on a map, white cars slow past outlines (later).
- **Built (row 717):** the first two, as rung 7 in 10.8 (§25).

## 25 Result: Prototype 10.8, the search (5 November, rows 717–722; GDD Edit 108)

> "Search state with its ghost" (Lawrence), picking row 716's first two proposals.

- **Build:** `prototypes/p10/dummies_p10_8.html`. 10.7's page is frozen.
- **The one change:** rung 7, taught by one lesson. The car starts at rung 6; the dummy starts with all four parts. No new part.
- **Checks:** `node prototypes/p10/test_p10.js --page` 62/62. Probes `qa/baseline/p10_8.md` 24/24. 10.7 reruns identical. Prototype 9 and the frozen md5s hold; sound freeze holds.
- **Amended (row 723):** the street cameras see a 60° cone along their cover, not all round (§25.5).
- **Amended (row 724):** the cones pan back and forth, as in Metal Gear Solid (§25.5).
- **Amended (rows 725–727):** the stealth grade, the lure and its stop line, the floor of open ways (§25.6).
- **Amended (row 730):** the side field in stages: AWARE, SLOWING, CRAWLING, STOPPING, by distance from the nose (§25.7).

### 25.1 What changed

| | Before (rung 6) | After (rung 7) |
|---|---|---|
| What teaches it | A hit from a spot it struck from before | A hit from cover within 3 s of it truly seeing the dummy |
| The dummy vanishes behind cover | It forgets it, and drives on | It marks a ghost there and stops short of it |
| A dummy near the ghost (`duel.searchRadius` 60) | Hidden | Found: seen past cover, noticed at once |
| How long it looks | — | `duel.searchSeconds` 4 after it last had the dummy |

### 25.2 Showing what it learned (row 701)

- **Road:** an amber ghost, "LAST SEEN"; its ring, solid while you are inside; an arc, the time left.
- **Car:** an amber beacon. "SEARCHING", then "FOUND".
- **Dummy:** FOUND in amber; EXPECTED in red at a remembered spot.
- **Lesson:** the clip draws the ghost, "LAST SEEN · n s BEFORE"; the fitting diagrams the stop line, ghost and ring.

### 25.3 Measured (rung 7 alone; `trained` mode)

| Way in | Hits a minute | Verdict |
|---|---|---|
| Seen, then ducked, the same spot | 0 | Closed: 28 searches, all found |
| Seen, then crawled beyond the ring | 2.02 (150) | Open: the crawl |
| Moving between free spots | 2.59 (226) | Open, narrowed from 6.97: walks in view leave ghosts |
| The sprint from past the field | 0.60 (53) | Open, no part (D115) |
| Behind the barrier at its gap | 0.47 (66) | Open: the pan's window (row 724) |
| Every other bot | 0 | Closed |

- **Pace:** the roaming expert writes off a body every 55 s (18 s at rung 6). Within the 80 s target (D119 eased).

### 25.4 The stealth reading, so far (§20)

| Rung | The car's sense | The dummy's tool | The opening it leaves |
|---|---|---|---|
| 6 | Your habit: the last three spots | — | Any other spot; the sprint |
| 7 | Where it last saw you | — | Crawl beyond the ring; hide before it sees you; the sprint |

- **The guard now goes to where it lost you.** Conviction's and Mark of the Ninja's last known position, short and giving up (§9 of the systems document).

### 25.5 The cameras' cones (row 723)

> "with the cameras it's super difficult since they have this 360 view. they need a narrower field of view" (Lawrence, 5 November)

- **Each camera sees a cone:** `perception.streetCameraFov` 60°, out to `perception.streetCameraRange` 180.
- **Aims:** the barrier's ends along its back (30°, 150°); the building's corner along its south face (20°).
- **Now unwatched:** the north planters, the plinth, the building's west face, the planters south-east.
- **Drawn:** a faint cone per camera. Frozen 10.5–10.7 keep 360°.
- **Measured:** the bots barely move (their spots lay outside the range). Searches rise 564 to 779.
- **Panning (row 724):** "panning back and forth like mgs" (Lawrence, 6 November).
  - Each cone sweeps `perception.streetCameraPanArc` 60°: rests `perception.streetCameraPanHold` 1 s, crosses in `perception.streetCameraPanSeconds` 3 s. Cycle 8 s.
  - The barrier's two ends sweep as mirror images: a window when both look south.
  - The gap behind the barrier opens: 0.07 to 0.47 a minute.

### 25.6 The player's escalation (rows 725–727)

> From Kevin Wong's "Stealth Game Design": car learning is not the player's fun. Lawrence, 6 November: "do all three".

| Change | What it does | Measured (trained) |
|---|---|---|
| The stealth grade (rows 725, 728) | Each strike scores its damage × UNSEEN 3, LOST 2, SEEN 1 (`scoring.stealth*`). Flash, marker, HUD | The sprint UNSEEN 18 of 18; seen-then-hidden LOST 4 of 4; the open flank SEEN 9 of 9. Points a hit: roaming 635, the lure 529, the sprint 158 |
| The lure (rows 726, 729) | A remembered spot or a ghost parks the car; strike from downstream, beyond the ring. A stop line, always on; a FARSIGHT field note once per save file (`dummies.p10.save`; N on the pause screen for a new one) | 18 lures, 18 struck, 225 a hit; 2.17 a minute; the line within 10 in 94% of stops |
| The floor (row 727) | The probe report needs two open ways in at every rung, and a way for each new part | 10.8: six. History: 6, 3, 6, 5, 2, 2, 3, 6 |

- **Roaming still beats the lure for a bot:** 6.8–7.05 a minute against 4.1–4.8 at rung 6; 2.59 against 2.17 at rung 7. The lure buys control: the car stops where the dummy chose.

### 25.7 The side field in stages (row 730)

> "the car should SLOW DOWN, in inverse proportion to how close the character is … becomes aware (IT SHOULD INDICATE this), then slows down a bit, then a lot" (Lawrence, 6 November)

| Stage | Distance from the nose | Speed (of cruise) | Noticed after | Shown |
|---|---|---|---|---|
| AWARE | Beyond 360 | 0.85 | 1.2 s | "?" · one pip |
| SLOWING | Within 360 | 0.6 | 0.6 s | "?" · two pips |
| CRAWLING | Within 180 | 0.35 | 0.6 s | "?" · three pips |
| STOPPING | Noticed | Stops short | — | "!" red |

- **Closures hold;** roaming rises to 3.15 a minute, the crawl falls to 1.69.
- **Row 731:** the stages now run inside three cones (§25.8). Each distance is from its cone's apex.

### 25.8 The field as three cones; the lunge guide (rows 731–732)

> "The sensitivitiy should be from a more sensitive forward cone, and two side cones. at the moment it's just a dumb rectangle that doesn't feel right" (Lawrence, 6 November)

| Cone | Apex | Angle | Reach | Sensitivity | CLOSE · WARY |
|---|---|---|---|---|---|
| Forward | Nose | ±20° | 720 | 1 | 180 · 360 |
| Side, each | Centre | 15°–105° off the heading | 220 | 0.5 | 90 · 180 |

- **Sensitivity** scales the stage ranges and the notice meter. Speeds stay per stage.
- **Blind:** behind, and between cones.
- **Past its cones, inside the rung's rectangle:** a noticed dummy stays tracked; the camera link and memory still tell it.
- **Searching:** the forward cone turns to the ghost.
- **Cost:** rare side strikes reopen, 0.13–0.2 a minute each (F32). Lurk stays UNSEEN.

> "it's also really hard to time the lunge when you don't know where the lunge will land - this should have a helper." (Lawrence, 6 November)

- **`ui.lungeGuide`:** a dotted line and reticle at the dash's landing, near a car. Yellow "HIT" when it meets the red car; white, a miss; faint, not ready.
- **Reverses** GDD Edit 19 §4.2.8 on the test road.

### 25.9 Open

- **Human pass (H6):** does the player read the ghost, and crawl away?
- **D121:** the order from here: the road upgrade at 10.9, or the area alert first.
- **D122:** the search's values. The crawl's room is a level rule: rows longer than the ring.
- **D124:** the pan's values: 60° in 3 s, 1 s rests, mirrored.
- **D125, D126 resolved (rows 728–729).** After the playtest: does the stop line stay free, or become a part?
- **D127:** the side stages' values.
- **D128:** the cones' values. Sides at 1 close the side strikes and bring back the even field.
- **D129:** the lunge guide: always on, a part, or only while aiming?
- **Next:** 10.9, the road upgrade (D121): two-way, white sedans that never learn.

