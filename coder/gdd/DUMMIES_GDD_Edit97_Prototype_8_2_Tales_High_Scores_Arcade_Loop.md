# DUMMIES — GDD Edit 97: Prototype 8.2. Tales redrafted; high scores; the Arcade loop

**29 October 2026 · Lawrence Lek** · Amends GDD Edit 96 §3.2 (tale length). Builds: `prototypes/p8/dummies_p8_2.html`. Prototypes 8 and 8.1 stay frozen. Style: `style/STYLE_GUIDE_V2.md` (V2.5).

## 0 Request and rulings

- **Request (user, 29 October):**
  - "Redraft the tales. They can be longer or shorter based on what is better. 15 to 35 words."
  - "Is there working high score system and leaderboard? High score button below the ARCADE or STORY mode."
  - "Lets look at the game loop for ARCADE. Does it make more sense to finish level with write offs? Or after X write offs, things get harder somehow?"
- **Rulings (user, 29 October):** high scores kept in this browser. The Arcade loop: §7.
- **Readings flagged:**
  - Tales: 15 to 35 words, at most two sentences. The tile's content sets the length.
  - Arcade: "after X write-offs" read as the district's quota (world.district.<id>.quota). No new X.
  - "Denser or faster": denser built; faster left open (D81).

## 3.2 Voice (amends Edit 96 §3.2)

```markdown
- **Tales:** 15 to 35 words (style.v2.tale.minWords, style.v2.tale.maxWords). At most two sentences.
  - Length follows content. One image: short. A place with a history: longer.
  - No padding. No restated brief. No restated act line.
- **Other company texts:** unchanged. At most 20 words (style.v2.text.maxWords).
```

## 7 Arcade loop (amends Edit 81; Edit 91's Arcade)

- **Ruling (user, 29 October):** "Maybe your body gets more damage to destroy, and you get denser or faster cars. I am not sure if cars 'learning' is an achievable mechanic when it hasn't been tested and I only have 10 days dev time to release."

```markdown
- **Shift:** one district, its shift of cars (run.appearances.road). No end at the quota.
- **Grades:** the grade rises every world.district.<id>.quota write-offs (arcade.grades).
  - Each grade past 1: the next chassis gains arcade.grade.healthStep of base health.
  - Each grade past 1: traffic density gains arcade.grade.densityStep, every tile.
  - Top grade: arcade.grade.max. Grade 5: health ×2, density ×1.8.
- **End:** the shift's cars run out. Licensed after one full grade; else Failed test. Refusal: Non-compliant.
- **Score:** points. Shown with grade and write-offs.
- **Fleet learning:** stays off (proto.learningEnabled 0). Untested.
- **Faster cars:** not built. Headless: cruise ×1.2 with density ×1.5 lowered mean speed (93 → 77–87). Speed alone untested (D81).
```

- **Measured (headless, Parkland, a write-off every 20 s):** grades 2–5 at 1,000 / 1,200 / 1,400 / 1,600 health; density ×1.8 at grade 5; the 100-car shift ends at 5.9 min, Licensed, 17 write-offs.
- **Prototype 7's rule:** arcade.grades 0 keeps Licensed at the quota.

## 4.2 UI (amends)

| Was (P8.1) | Prototype 8.2 |
|---|---|
| Title: ARCADE · STORY · CREDITS | ARCADE · STORY; under them HIGH SCORES and CREDITS |
| ARCADE card: "Pick one district and write off its quota. The score is the run." | n34: "One district, one shift of cars. Every few write-offs, you earn a tougher grade." |
| Banner: DISTRICT 1 OF 3 · PARKLAND · 2 WRITE-OFFS | DISTRICT 1 OF 3 · PARKLAND · A GRADE EVERY 2 WRITE-OFFS |
| Objective: Write off 2 bodies (0 of 2). | Grade 1: write off 2 bodies for grade 2 (0 of 2). Top grade: "write off all you can." |
| — | Grade up: toast and report header, n35 "GRADE {G} · TOUGHER CHASSIS · DENSER TRAFFIC" |
| Ending stats: TIME · WRITE-OFFS · POINTS · BEST HIT | Arcade: BEST HIT → GRADE |
| — | Ending, beside the menu: HIGH SCORE · RANK n OF 10 · name and table; items Name this score (Arcade), High scores |

- **HIGH SCORES board:** tabs PARKLAND · WATERFRONT · MONUMENT · STORY. Top highscore.tableSize each.
  - Arcade row: rank, name, points, grade, write-offs, time, date. Story row: rank, name, points, chassis, time, date.
  - Saved in this browser (localStorage; this visit only if storage is off).
- **Arcade name:** a new score takes the last name used (TRAINEE at first). "Name this score" opens the name keyboard (Edit 88).
- **Story score:** finished runs only (user-decided, row 567). Recorded at CERTIFIED under the save slot's name. CERTIFIED ends Story for that slot; runs in progress are not logged.

## 5 Text pipeline

- **Guide:** `style/STYLE_GUIDE_V2.md` V2.6. V2.5: tales 15 to 35 words; F11, length follows content. V2.6: F11 asks for the shortest tale that keeps the tile.
- **Run:** `style/runs/20261029-181530-v82` (`style/loop.py --v82`).
  - Stage 1 (V2.5): each tale redrafted by the generator from 7.13's and 8.1's versions, then evaluated and refined.
  - Stage 2 (V2.5): the story and six opening lines as one batch.
  - Stage 3 (V2.5): n34 and n35, Arcade's grades.
  - Stage 4 (V2.6): the batch again.

## Measured

- **Run:** 30 of 30 pieces at 10/10, confirmed. 155 agent calls. $18.64.
  - Stage 2: 4 → 10 → ✓10. Stage 3: 6 → 8 → 8 → 10 → ✓10. Stage 4: 7 → 8 → 10 → ✓10 (F11 cut stock tails).
- **Tales:** 19 to 35 words, mean 28.5 (8.1: 25 to 35, mean 30.2). Five at 22 or fewer.
- **`prototypes/p8/test_p82.js`:** 29 of 29.
  - Grades headless and in the page; Prototype 7's rule without arcade.grades.
  - High scores: recorded at the end, named on the keyboard, kept after a reload. Story's CERTIFIED run recorded.
  - Farsight drawn only on the Credits card. 317 strings on a 28-step tour. No page errors.
  - Prototypes 6.4 to 7.13, 8 and 8.1 byte-identical to their commits.

## Registry

- `edit97-2026-10-29`, 512 entries. Added: `arcade.grades` (0; Prototype 8.2: 1), `arcade.grade.healthStep` 0.25, `arcade.grade.densityStep` 0.2, `arcade.grade.max` 5, `highscore.tableSize` 10.
- `prototypes/p8/build.py` writes `window.DUMMIES_SIM` from these entries.
- `style.v2.tale.minWords` is an ID in `style/style.params.json`.

## Open

- **D81:** faster cars per grade. Build a cruise-speed step and test it; or keep density only.
- **D82:** a shared online leaderboard. Needs a hosted page and a shared store.
- **D80** stands: terminal signage, a fleet job, the glossary still name Farsight. Never drawn.
