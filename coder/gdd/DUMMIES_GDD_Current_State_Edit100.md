# DUMMIES — GDD current state (Edit 100, Prototype 9)

**30 October 2026 · Lawrence Lek** · An index of the GDD as it stands. It adds no rule. The GDD of record is V29 Design, amended by Edits 9–100; newest wins. Each line names the edit that governs it. Values are registry IDs (`content/params/tuning.parameters.json`, `edit100-2026-10-30`, 564 entries). "Build value" marks a value Prototype 7–9 sets over the registry default (`P7SIM`, `window.DUMMIES_SIM`).

## 1 Premise and lore (Edit 95 §3.1; replaces V29 §1's company and Edit 39 §3.1)

- **Setting:** SHENZHEN SMART CITY, NEW ECONOMIC ZONE. Its traffic is the training ground.
- **The company in the game:** Dummy Corporation. It manufactures custom dummies for high net-worth individuals.
- **The dummy:** a trainee. It trains to join the Certified dummies.
- **Certified dummies:** they serve high net-worth individuals and are sacrificed in their service.
- **The fleet:** the city's self-driving cars, its workers. Four price tiers; 32 named models (`content/db/fleet.json`).
- **Publisher:** Farsight. Extra-diegetic. Named only on the Credits card (Edit 95 §4.2).
- **Superseded:** "FARSIGHT crash-test dummy" (V29, Edits 39–94) holds for Prototypes 1–7.13 only.

## 2 Voice (Edit 95 §3.2; Edit 98 §3.2; Style Guide V2.7)

- **Narrator:** Dummy Corporation. Deadpan and inspirational. No "!".
- **Length:** at most two sentences (`style.v2.text.maxSentences`) and 20 words (`style.v2.text.maxWords`).
- **Tales:** 15 to 20 words (`style.v2.tale.minWords`, `style.v2.tale.maxWords`).
- **Goals:** a brief is the level's goal. Imperative, first. Placeholders kept.
- **The user's lines:** canon. Monument A1's tale and goal; the STORY and ARCADE card lines (Edit 98 §0).
- **Cars:** tier voice; at most two sentences.
- **Guide and loop:** `style/STYLE_GUIDE_V2.md` (V2.8), 42 rules; text from style run `20261029-205717-v83`, on V2.7 (Edit 98 §5).
- **Ids in `style/style.params.json`:** the `style.*` limits above; adjectives `style.v2.tone.maxAdjectives`; slogans `style.v2.slogan.minWords`, `style.v2.slogan.maxTexts`.
- **Open:** tales cluster at the 20-word cap (D85).

## 3 Story frame (Narrative A, Certified: Edit 92; restated Edit 95 §3.3)

- **Act I · Monument · INDUCTION:** the trainee arrives. Cars are colleagues.
- **Act II · Parkland · OPENING DAY:** the Expo opens to clients when the park passes.
- **Act III · Waterfront · CUSTOMS:** Certified dummies ship to clients across the river.
- **Ending:** the monument unveiled; a drone to the ship; CERTIFIED (Edit 94). Credits card after it (Edit 95).

## 4 Game flow (Edits 81, 88, 97, 98)

- **Intro screen:** DUMMIES; the front-on animation; one line (n36); START (`ui.introScreen`; build value 1; loop `ui.intro.loopSeconds`).
- **Audio gate (Edit 100):** the intro opens on PRESS ANY KEY. The first press only starts the sound; the next is START.
- **Mode select:** STORY, ARCADE; HIGH SCORES; CREDITS.
- **Story:** save screen (`story.saveSlots`, names to `story.saveNameMax`) → splash (`ui.storySplash`, `ui.splash.cycleSeconds`) → map → level card → drone drop → play.
- **Arcade:** district select → level card → drone drop → play.
- **Level card:** full screen, both modes (`ui.levelCard`). Story: act, tile, level n of 27, tale, >>> goal. Arcade: district, grade, line, >>> goal (n37).
- **Drone drop:** in from the left at each level start (`world.droneDropIn`). Not after a write-off.

## 5 Story mode (Edits 81–94)

- **27 tiles:** Monument A1 → Waterfront B2, in the order of row 450.
- **Write-offs per tile:** `story.writeOffs.<district>.<tile>`; 34 bodies in all (Edit 93).
- **Briefs:** task kinds any, dash, drop, jump, level, cone, push, bounce, struck, combo, cls. Only the last hit counts (row 464).
- **Miss floor:** a fatal hit off the brief leaves `story.missFloor` health (Edit 91).
- **On foot:** `damage.bodyHealthOnFoot` until Battery 1; then `damage.bodyHealth` (Edit 91).
- **Parts by drone (Edit 93):** Monument Battery 1 B1, Hands 1 A2, Legs 1 B3. Parkland Arms 1 C1, Legs 2 A3, Hands 2 A2, Arms 2 A1, Battery 2 B2. Waterfront Legs 3 B1, Arms 3 B3, Battery 3 B2.
- **No credits, no levels:** points are the score (Edit 91).
- **Traffic per tile:** `story.traffic.<district>.<tile>` (Edit 85). A district runs `story.shiftCars`; no Failed test.
- **Ferry:** a clear flies the next chassis into the next tile, within `story.ferryDepth` of the edge (Edit 83).
- **Gift screen:** `ui.gift.fallSeconds`, `ui.gift.holdSeconds` (Edit 84).
- **Finale:** the monument shrouded until Waterfront B2 (`world.monumentShroud`, build value 1); unveiling `ui.finale.unveilSeconds`; the voyage to B3 (Edit 94).
- **High scores:** finished (CERTIFIED) runs only (row 567).

## 6 Arcade mode (Edits 84, 91, 97)

- **One district a run.** Quotas `world.district.<id>.quota`.
- **Parts for credits:** `economy.creditsPerWriteOff`; prices `economy.price.ability.level1`–`level3`. The chassis ships with Battery 1.
- **Grades:** every quota of write-offs the grade rises, to `arcade.grade.max` (`arcade.grades`, build value 1).
  - Each grade: +`arcade.grade.healthStep` chassis health; +`arcade.grade.densityStep` traffic density.
- **End:** the shift's cars run out (`run.appearances.road`): Licensed after one full grade, else Failed test. Refusal: Non-compliant.
- **High scores:** a table per district, top `highscore.tableSize`, kept in the browser (Edit 97).

## 7 The dummy (Edits 75–80, 89–91)

- **Turning:** DIRECT (`proto.turnModel` 2).
- **A · Battery** (`proto.batteryModel`, build value 1): 1 the dash; 2 a second charge (`battery.capacity`); 3 a faster recharge (`abilities.battery.level3Seconds`). Base recharge `battery.secondsPerCharge`.
- **B · Legs:** jump; airtime `abilities.legs.airtimeBase` + `abilities.legs.airtimeStep` a level; run to clear (`proto.jump.runToClear`). Cost `battery.jumpCost`; free out of a dash (`battery.dashJumpCost`).
- **X · Hands:** carry cones, `abilities.hands.conesPerLevel` a level, to `abilities.hands.maxLevel`. Tap up, tap down (`abilities.hands.tapDrop`).
- **Y · Arms:** push off a car hit within `abilities.arms.pushWindow`; `abilities.arms.pushSpeed` + `abilities.arms.pushStep` a level; `abilities.arms.pushesPerLevel` before landing.
- **Ricochet:** Newtonian, kept at `proto.recoilScale`, thrown at most `proto.bounce.maxThrow`.
- **Combos:** window `scoring.comboWindow`; step `scoring.comboStep`; variety `scoring.comboVariety`; cap `scoring.comboMax`; the clock holds in the air (`scoring.comboAirPause`).
- **Damage:** locational; parts redden with damage (Edit 91).

## 8 Traffic, cones and car cues (Edits 53, 63, 71–72, 85, 99)

- **Traffic:** continuous across screens, managed out of view (Edits 53, 63). Rings give way at `traffic.ringEntryGap`; signals from `traffic.signalDistance` (Edits 71–72). Vehicles at `vehicles.scale`.
- **Drivers:** react after `perception.reactionDelay`; the forward sensor is straight.
- **Cones:** a slow or stopped car at a cone pulls out steeply (`proto.driver.coneSteepPass`, build value 1). A drone only for a car blocked and honking (`proto.droneConeSeconds`, build value 0) (Edit 99).
- **Cones in view:** never on a road or hidden (`props.cone.minVisible`) (Edit 85).
- **Cue key, seven rows** (`ui.cueKey.simple`, build value 1): Has noticed you (headlights flash, `proto.art.noticeFlashHz`); Route fixed; Slowing; Braking for safety (brake lights held, `proto.art.brakeGlowStopped`); Already hit you (grey, `proto.art.spentGrey`); Blocked, warning you; What you can see.
- **Beams:** straight ahead (`proto.art.beamStraight`). No stop bracket (`proto.stopCue`, build value 0) (Edit 99).

## 9 The city (Edits 62–69, 85, 91–92)

- **Three districts:** Parkland, Waterfront, Monument. 3 × 3 screens each; levels Z0–Z2.
- **Highways:** a flight and a drop gap each (`world.deckFlightsMin`, `world.deckDropGaps`) (Edit 85).
- **Story art:** cosmetic tile art (`world.storyArt`); the DUMMY MONUMENT on Waterfront B2 (`world.dummyMonument`).
- **Unused:** CBD and Calibration Campus, in the lore only (Edit 96 §3.4).

## 10 Interface (Edits 86–87, 89, 98, 99)

- **Clean screen:** options and per-device controls in the pause menu (Edit 86).
- **HUD:** BODY, the field and the chassis on one top edge; the objective on top; POINTS top right (Edits 87, 91).
- **Touch:** player-placed stick and diamond (`ui.touch.scaleMin`–`ui.touch.scaleMax`) (Edit 87).
- **Bottom edge:** lifted layers draw whole cars (`ui.layerEdgeFix`, build value 1) (Edit 99).

## 11 Builds and records

- **Current build:** `prototypes/p9/dummies_p9.html` (Edit 100), in `lawrencelek/ELVTR-Multiagent-Submission-6B-audio`. Prototypes 8–8.4 and 1–7.13 frozen.
- **Decisions:** `DECISIONS.md`, rows 1–618; open items in its D table (newest D77–D85; D86 closed).
- **Text sources:** `content/story/story_v2.json`, `prototypes/p8/lore.js`. Prototype 7.13 keeps `story.json` and Farsight.
- **Style Guide Agent:** Assignment 6, `style/` (V1 for 7.13; V2 for 8).
- **Sound Designer Agent:** `audio/` in the sound repo; GDD Edit 100; the Sound Lab `prototypes/p9/sound_lab.html`.

## 12 Sound (Edit 100)

- **Engine:** `prototypes/p9/audio.js`, on when `audio.enabled` is 1 (build value 1; registry default 0).
- **Pack:** six OGG tracks (ansimuz), 100 WAV effects (Chequered Ink), beside the page; an MP3 copy of each track.
- **Music:** Track 1 intro, finale and Credits; Track 2 menus and run ends; levels rotate Tracks 3–6 (`audio.music.levelRotation`) (rows 610–612, 617).
  - Each level card starts its level's track (`audio.music.track.card` −1). Story: the card's tile *n* plays slot ((*n* − 1) mod 4) + 1. Arcade: each level's card, the next slot.
  - The track holds until the next card: a cleared tile walked back to keeps it (row 611).
  - Ducks: pause `audio.music.pauseDuck`; gift screen, report, workshop `audio.music.screenDuck`; write-off `audio.music.writeoffDuck` (rows 612–613).
  - Fades: `audio.music.fadeInSeconds` at every start, `audio.music.fadeOutSeconds` at every end, the loop's seam included (row 609).
- **Effects:** cue map `content/audio/cues.json`: 107 entries. 52 cues, 23 stated silences, 32 generated tones (among them the hits, the honk and the new chassis's blip).
- **Lawrence's picks** (rows 603, 607, 614): his Sound Lab choices over the agent's map, 37 entries (`content/audio/picks_lawrence*.json`).
- **Generated tones** (rows 604, 606): Prototype 8.4's synth rendered to `prototypes/p9/audio/tones/`, and ten new tones (66 files). A `synth` entry plays its tone in the mix.
- **Mix:** buses `audio.music.volume`, `audio.sfx.volume`, `audio.ui.volume`. Gain classes `audio.sfx.gain.<class>`. Cooldowns `audio.sfx.cooldown.<class>`.
- **Limits:** voices `audio.sfx.maxVoices`; jitter `audio.sfx.pitchJitter`. Trims toward `audio.sfx.targetLufs` and `audio.music.targetLufs`.
- **Edge cues:** low health below `audio.sfx.lowHealthAt`; a car noticing the dummy; brake lights; a part breaking; the intro's hit.
- **Sound control:** mute and a volume slider (`audio.settings.master`), top right on the intro, the mode select and the pause pages (row 608). M mutes; − and + step it.
  - Its dropdown: MUSIC (`audio.settings.music`) and SFX (`audio.settings.sound`) sliders (row 616).
- **Options:** Volume, Music, SFX, Mute; saved as `dummies.p9.audio` (defaults `audio.settings.master`, `audio.settings.music`, `audio.settings.sound`).
- **Sound Lab:** auditions every cue and state. Picks are saved as `dummies.p9.audio.lab`, and the game reads them.
- **Credits card:** adds "Music by ansimuz", "Sound effects by Chequered Ink". Style Guide V2 C1 widened to the makers of licensed music and sound (row 615).
- **Q1–Q6:** ruled by Lawrence (rows 609–617). Review fixes: row 605. Level-start chassis fix: row 618.
