# DUMMIES — Handover v2: vehicle intelligence, finding the fun (Prototype 10)

**1 November 2026 · Lawrence Lek** · Regroups the first outside playtest (Sasha) into five categories. Read this before v1.

**Updated 1 November, 21:19:** §9 the crux and the ten tests (user-decided); §10 the 10.0 spec. Rows 648–656 recorded.

**Updated 2 November:** §11 the 10.0 result. Pillar 1's written test passes; the aimed dash is the gap. Row 649 superseded by row 657.

**Updated 2 November, later:** §12 the 10.0-v2 result. PT1 means avoidance never escalates (row 658). Prototype 9 cars learn two numbers and no behaviours.

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

- **Open:** D89 red hue; D90 white role; D91 fixed or adaptive ladder; D92 car contact; D93 flank damage; D94 venue; D95 law clauses; D96 boss families; D97 parts as keys; D98 lessons, not damage; D99 learning carries across Story levels; D100 10.1's target: standing, or the aimed dash; D101 what "something new" means.
- **Next row 660. Next open decision D102.**

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
