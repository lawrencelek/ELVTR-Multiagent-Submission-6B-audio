# DUMMIES — GDD Edit 98: Prototype 8.3. Intro screen; level card; drone drop; less text

**29 October 2026 · Lawrence Lek** · Amends GDD Edit 97 §3.2 (tale length), Edit 92 §4.2 (the tile card), Edit 81 (the title). Builds: `prototypes/p8/dummies_p8_3.html`. Prototypes 8 to 8.2 stay frozen. Style: `style/STYLE_GUIDE_V2.md` (V2.7).

## 0 Request and rulings

- **Request (user, 29 October):** "Story mode - there is too much superfluous text in general."
  - A new introduction screen: DUMMIES, full screen, and Start. An animation: the dummy steps into the road in front of a car, front-on, in the upgrade screen's style. One line on what to do, quirky but obvious.
  - Mode select: STORY first. "Get your Dummy Certification in Shenzhen Smart City and learn about the Corporation." ARCADE: "Get hit in fun, creative, and destructive ways before the Vehicles run out!"
  - Starting a level, in either mode: a screen that says very simply what the goal is.
  - "You are dropped off from the left side of a screen by a DRONE. (Same as for ARCADE mode when you start a new map)"
  - The level card: "ACT I: MONUMENT. Tile A1. Level 1 of 27. / Story text. 15-20 words. / Then goal text."
  - Monument A1: "Fresh off the factory floor, you're ready to do some damage to yourself. Make your engineers proud!" Goal, in bold: ">>> Walk into the path of the incoming vehicles. Time your approach, and choose your angle carefully. Bonus points for combinations and lethal hits!"
  - Starting Story: an animation like the upgrade screen, the dummy's parts flying.
- **Rulings (user, 29 October):**
  - Voice stays deadpan: no "!" (Edit 95). The user's lines are used without it.
  - The drone drops the dummy at each level start: a Story tile deployed from the map; an Arcade district.
- **Readings flagged:**
  - Tales: 15 to 20 words, two sentences. Edit 97's 35 is withdrawn.
  - The user's lines are canon as written: A1's tale, A1's goal, the STORY and ARCADE card lines. A1's goal runs 23 words in three sentences, past the 20-word cap.
  - "Vehicles" in the ARCADE line is set in lower case, as in A1's goal.
  - The user's sample intro line is a brief, not the text. n36 is written for humour and run through the loop.
  - Goals replace briefs on the card: imperative, what to do. The caps label stays for the map and the objective strip.
  - Act lines leave the level card. They stay on the story map.
  - The Story animation plays when a story starts: NEW GAME or CONTINUE, before the map.

## 3.2 Voice (amends Edit 97 §3.2)

```markdown
- **Tales:** 15 to 20 words (style.v2.tale.minWords, style.v2.tale.maxWords). At most two sentences.
- **Goals:** what to do, in the imperative, first. One or two short sentences. Placeholders kept.
- **User lines:** canon as written. The style loop never rewrites them.
- **No "!":** unchanged (Edit 95).
```

## 4.2 UI (amends)

```markdown
- **Intro screen (new):** DUMMIES, full screen. The dummy steps into the road; a car comes on, front-on. One line (n36). START.
- **Mode select:** STORY, then ARCADE. Then HIGH SCORES and CREDITS. No subtitle line.
- **Level card (both modes):** full screen.
  - Story: ACT I: MONUMENT. Tile A1. Level 1 of 27. The tale. >>> the goal.
  - Arcade: ARCADE: PARKLAND. Grade 1 of 5. The district's line. >>> the goal (n37).
  - Removed: the tile title, the act line, TRAINING BRIEF, the gift box, "Fenced until cleared."
- **Drone drop:** after the card, a drone carries the dummy in from the left edge and sets it down.
- **Story splash (new):** on NEW GAME or CONTINUE. The dummy's parts fly apart and back. STORY.
- **Story map:** the act line replaces the tale in the tile panel.
```
- **Intro line (n36):** "Self-driving cars are designed never to hit anyone. Your training: get hit, in combos, and earn your parts."
- **Arcade goal (n37):** "Write off bodies; every {Q} write-offs, the grade rises. Keep training until the vehicles run out." {Q}: world.district.<id>.quota.

## 5 Text pipeline

- **Guide:** `style/STYLE_GUIDE_V2.md` V2.7. Tales 15 to 20 words (F6). A brief is the level's goal (F8). U1: the user's lines are locked in a batch, still counted for T14.
- **Run:** `style/runs/20261029-205717-v83`.
  - Stage 1 (`--v83`): 26 tales cut from 8.2's; 10 briefs rewritten as goals; n36 and n37 by the generator. The user's four lines placed.
  - Stage 2 (`review`): the story and eight opening lines as one batch (n36, n02, n03, n34, n24–n26, n37). User lines locked.
  - Stage 3 (`--v83-intro`): n36 drafted by hand for humour, then evaluated and refined.
- **Placement:** `make_lore.py` reads the build from the tag (-v83: P8.3, Edit 98). The rest is 8.2's text.

## 6 Build

- **Flags** (registry default 0; `build.py` sets 1): `ui.introScreen`, `ui.levelCard`, `world.droneDropIn`, `ui.storySplash`.
- **Intro:** a 320 × 180 canvas, front-on. One loop every `ui.intro.loopSeconds`. Space, A or a tap: the mode select. Back returns to it.
- **Level card:** the sim holds in phase `brief`. Arcade starts in it too. Space, A or a tap: the drone drop.
- **Drone drop:** from x −40 at the spawn's height. The dummy rides in, is lowered, set down idle. The drone leaves left. Not after a write-off.
- **Splash:** NEW GAME and CONTINUE. Six parts cut from the dummy art fly apart and back every `ui.splash.cycleSeconds`.
- **Fix:** 8.2's `window.__dummiesUI` had `saves`, `hits` and `slotActs` commented out. Restored.

## Measured

- **Run:** 39 of 39 pieces at 10/10, confirmed. 172 agent calls. $22.69.
  - 3 tales accepted as cut; 23 after one to three refinements. 10 goals after one or two.
  - Review: 6 → 8 → 9 → 10 → ✓10. n36 framed the work as a game; n37 said "points"; a T14 phrase in three tales; tales padded to the cap.
  - Intro line: 8 → 10 → ✓10.
- **Tales:** 15 to 20 words, mean 19.0 (8.2: mean 28.5). 513 words in all (8.2: 770). Longest 134 characters.
- **Goals:** "Coverage gap: dashes. The final hit must be a dash into a car." → "Dash into a car. The final hit must be the dash."
- **Card:** A1 drops the tile title, TRAINING BRIEF, the gift box and the fence line.
- **Drone drop:** 2.75 s (Arcade Parkland), 2.35 s (Story Monument A1).
- **`prototypes/p8/test_p83.js`:** 37 of 37.
  - Headless: the card holds both sims; the drop lands at the spawn. Without the flags, Arcade starts in play.
  - Page: intro, mode select, both cards, both drops, the splash on NEW GAME and CONTINUE. One drop a district.
  - Farsight drawn only on the Credits card. 321 strings on a 32-step tour. No page errors.
  - Prototypes 6.4 to 7.13, 8, 8.1 and 8.2 byte-identical to their commits.
- **`prototypes/p7/test_p713.js`:** 103 of 103.

## Registry

- `edit98-2026-10-29`, 518 entries. Added: `ui.introScreen`, `ui.levelCard`, `world.droneDropIn`, `ui.storySplash` (0; Prototype 8.3: 1), `ui.intro.loopSeconds` 6.5, `ui.splash.cycleSeconds` 3.6.
- `style.v2.tale.maxWords` 20 (was 35) in `style/style.params.json`.

## Open

- **D83:** the story map's tile panel and objective strip still carry labels and counts. Trim after play-testing.
- **D81, D82, D80** stand.
