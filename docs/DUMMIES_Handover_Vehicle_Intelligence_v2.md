# DUMMIES — Handover v2: vehicle intelligence, finding the fun (Prototype 10)

**1 November 2026 · Lawrence Lek** · Regroups the first outside playtest into five categories. Read this before v1.

## 0 How to use this with v1

- **v1** (`claude/DUMMIES_Handover_Vehicle_Intelligence.md`) still holds: constraints (§4), code survey (§5), tools (§8), repos (§9), run and test (§11), conventions (§12).
- **v2 replaces** v1 §3.2's grouping, v1 §7's workstreams and v1 §14.3's "Rules for DUMMIES".
- **The five rules in v1 §14.3 are withdrawn.** They were never tested. §6 restates them as hypotheses with tests.
- **Status labels:**
  - **Evidence:** measured in a build or said by a player.
  - **Research:** from a cited source.
  - **Hypothesis:** a design claim. Nothing ships as a rule until its test passes.
- **First message for the next chat:** "Read `claude/DUMMIES_Handover_Vehicle_Intelligence_v2.md`, then v1 §4–§12. Start Prototype 10.0 (§7)."

## 1 Back to the original pillars

Three generations of the same five pillars. The playtest tests the oldest wording.

| # | Edit 9 (1 October, original) | Edits 11–23 (row 79) | V29 D2 | Playtest, 1 November |
|---|---|---|---|---|
| 1 | There is always a way to destroy yourself | There is always a way to outsmart the car. *Fails if standing in a lane pays as well as baiting* (Edit 19) | D2.1 Reading and fooling a car is the rewarding strategy | **Fails.** Standing earns hits (PT1, §2.2) |
| 2 | Every encounter feels good. A failed lunge makes you want another | Juiced to 11: you feel like the dummy | D2.4 A beautiful, readable encounter leads to closure and replay | **At risk.** Free hits feel like nothing (PT1) |
| 3 | The cars visibly learn | The cars visibly learn, as individuals and a fleet; emergent behaviour | D2.2 Recurring cars visibly adapt | **No stage.** The tester wants one car that learns (PT2–PT4) |
| 4 | The signals make timing readable | Machine to human: you buy degrees of freedom | D2.3 The first upgrade changes how you play | **Asked for.** Parts must be the way in (PT6) |
| 5 | Stellar Art Direction | Unchanged | (art and voice) | Battery done (PT0); story wanted (PT15) |

- **Intended player (Edit 9):** a fifteen-year-old at an exhibition, a friend shouting suggestions. Test with that pair.
- **Reading:** the pillars already hold the answer. Pillar 1 fails its own written test. Pillar 3 has no stage.

## 2 Evidence

### 2.1 The tester's notes (verbatim, numbered as v1 §3.2)

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
  - Free hits, slow kills: no challenge and no payoff. Pillars 1 and 2 both fail.

## 3 The five categories

Every note sits in one category. Maximum five.

| Cat | Name | Notes | Pillars | Status |
|---|---|---|---|---|
| **C1** | **Earned hits** — challenge and the core verb | PT1, PT6 | 1, 2, 4 | Broken (§2.2). Fix first |
| **C2** | **One car's mind** — behaviour, learning, progression | PT2, PT3, PT4, PT8, PT9 | 3 | Absent. Build the stage |
| **C3** | **Cast and attention** — white and red, avoid and chase, swerve cost | PT5, PT7, PT10, PT11, PT12 | 2, 3 | Needs C1 and C2 first |
| **C4** | **Places and set pieces** — roads, trolley problems, zones | PT13, PT14 | 3, 5 | Later |
| **C5** | **Meaning and look** — the corporate law, the chassis | PT0, PT15 | 5 | PT0 done (row 644); PT15 later |

### C1 Earned hits

- **Problem (evidence):** standing earns hits (§2.2). Pillar 1's written test fails.
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
  - **PT1, earned hits (C1).** The core verb is broken. Every other note decorates it.
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

One question per prototype. Build only what the question needs. Bot first, then people: the tester plus a friend (Edit 9's player). Record unprompted play before asking questions (V29 Evaluation).

| Build | Question | Builds | Bot test | Human test | Flag (proposed) |
|---|---|---|---|---|---|
| **10.0 Baseline** | Where do free hits come from? (H0) | Nothing new. Probe and port P1–P3 policies (stand, blind lunge, read and lunge) to Prototype 9 | `qa/stand.js`; policy table | — | — |
| **10.1 The toy** | Is one car fun with no goal? (H3) | Proving Ground: open tarmac. One red car on a loop. The dummy. No score | Car never stalls; stand 0 hits | 5-minute free play | `duel.enabled` |
| **10.2 Earned hit** | Which assertiveness is most fun to bait? (H1, H2) | Three settings of `driver.assertiveness` | Stand 0 hits at all three; read beats blind | Blind A/B of the three | `driver.assertiveness` |
| **10.3 The ladder** | Does one sensor per level read as learning? (H4, H6, H7) | L1 front-blind, L2 forward camera, L3 surround. Parts by drone: dash, jump. Sensor cue | Each level: its closed approach 0, its opening above 0 | Tester names each change | `duel.level.<n>.tier`, `ui.sensorCue` |
| **10.4 The counter** | Should the car counter your habit? (H5) | After L3, the car closes your most-used opening; capped; failures ignored | Habit bot loses; varied bot wins | Fixed vs counter A/B | `duel.habitCounter` |
| **Gate** | 10.1–10.4 pass, or Lawrence's play says go | — | — | — | — |
| **10.5 The cast** | Do white hazards add fun? (H8) | White traffic that never learns; graze | Reading still beats repetition | Duel vs duel-plus-traffic | `traffic.white.learns` |
| **10.6 The cost** | Is car-on-car oddity funny? (H9) | Cone freeze; red swerve into white | No jams (v1 W7 watchdog) | Observe reactions | `traffic.carContact` |
| **Later** | C4 places, C5 law | Roads, set pieces, law clauses on level cards | — | — | — |

- **Each build:** a flag (registry default 0), a bot table, a short human session, a DECISIONS row with the result.
- **Frozen builds stay frozen** (v1 §4). Prototype 9's md5 must not move.
- **Registry first** (v1 §4): register the 29 sim-only IDs before 10.2.

## 8 Decisions to record

Replaces the rows v1 §3.2 proposed (648–652). None is recorded yet.

| Row | Decision | Status |
|---|---|---|
| 648 | Prototype 10 is 1 vs 1: one red car, one dummy | user-directed (1 November) |
| 649 | Pillar 1 fails its own test in Prototype 9: standing earns hits (§2.2) | evidence |
| 650 | v1 §14.3's five rules are withdrawn; §6's hypotheses replace them | user-directed (1 November) |
| 651 | Feedback grouped into five categories, C1–C5 | proposed |
| 652 | The vital three: PT1, PT4, PT6 | proposed |
| 653 | Build order 10.0–10.4, then a gate | proposed |
| 654 | The battery note repeats row 644; no change | proposed |

- **Open, from v1 §3.2:** D89 red hue; D90 white role; D91 fixed or adaptive ladder; D92 car contact; D93 flank damage; D94 venue; D95 law clauses; D96 boss families; D97 parts as keys.
- **Next open decision:** D98.
