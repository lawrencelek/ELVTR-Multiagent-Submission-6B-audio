# DUMMIES — GDD Edit 95: Prototype 8. Lore refinement: Dummy Corporation

**29 October 2026 · Lawrence Lek** · Amends GDD Edit 39 §3.1 (canon), Edit 92 §3 (the narrator and its voice), the fleet canon's company and the in-game text of Prototype 7.13. Builds: `prototypes/p8/dummies_p8.html`. Prototypes 7 to 7.13 stay frozen. Style: `style/STYLE_GUIDE_V2.md`.

## 0 Request and rulings

- **Request (user, 29 October):**
  - "The game itself is published by Farsight. (Extra-diegetic). Farsight is NOT mentioned inside the game. Only in Credits."
  - "Within the game, the company is only known as Dummy Corporation. Manufacturers of custom dummies for high net-worth individuals."
  - "The tone is deadpan and inspirational, concise sentences, fewer adjectives. All text reports and in-game texts should be concise, and even the longest explanations should have maximum two sentences, or 15-20 words max."
  - "The environmental storytelling is there to inspire the Dummy to do their job, and fulfil their training, so that they can in future join the ranks of Certified dummies and to be sacrificed in service to the high net-worth individuals."
  - Tone reference: *Play Station* (Lawrence Lek, 2017), `style/kb/DUMMIES_Play_Station_Script_2017.md`.
- **Rulings (user, 29 October):** the publisher credit sits on a Credits card, on the title menu and after the CERTIFIED ending. Prototype 8 lives in the working repository only.
- **Readings flagged:**
  - "15-20 words max" is read as a cap of 20 words, with 15 as the aim. "Maximum two sentences" holds as well.
  - "Deadpan" keeps Edit 92's rule: no exclamation marks in the company's voice. The 2017 script's "!" is not adopted.
  - The cars keep their tier voices (Edit 39 §6.6). Their barks fall under the same caps: at most two sentences.
  - Gameplay, briefs' tasks, parts, write-offs and traffic are unchanged. Only text changes.

## 3.1 World and lore (replaces Edit 39 §3.1 and the fleet canon's company)

```markdown
- **Publisher:** Farsight. Extra-diegetic. Named only in the Credits.
- **The company in the game:** Dummy Corporation. It manufactures custom dummies for high net-worth individuals.
- **The setting:** SHENZHEN SMART CITY, NEW ECONOMIC ZONE (§1). The city's traffic is the training ground.
- **The dummy:** a trainee. It does its job and completes its training, to join the Certified dummies.
- **Certified dummies:** they serve high net-worth individuals, and are sacrificed in their service.
- **Environmental storytelling:** everything the city shows the dummy inspires it to do its job.
- **Lore follows state** (6.6.1), unchanged.
```

## 3.2 Voice (replaces Edit 92 §3, Voice)

```markdown
- **Narrator:** Dummy Corporation. Tales, briefs, act lines, notices, the ending.
- **Tone:** deadpan and inspirational. Concise sentences. Few adjectives. No exclamation marks.
- **Length:** every in-game text at most two sentences and at most 20 words. Aim for 15.
- **Reference:** Play Station (2017): slogans, programme names, perks, fine print.
- **Cars:** workers in their tier's voice (Edit 39 §6.6). At most two sentences.
```

## 3.3 Story (Narrative A, Certified, kept; frames restated)

```markdown
- **Act I · Monument · INDUCTION:** the trainee arrives. The cars are colleagues.
- **Act II · Parkland · OPENING DAY:** the Expo opens to clients when the park passes.
- **Act III · Waterfront · CUSTOMS:** Certified dummies ship to their clients across the river.
- **Ending:** CERTIFIED. The model is manufactured for clients.
- **Credits:** DUMMIES · a game by Lawrence Lek · published by Farsight.
```

## 4.2 UI (amends)

| Was (P7.13) | Prototype 8 |
|---|---|
| FARSIGHT (frame wordmark) | DUMMY CORPORATION |
| FARSIGHT BRIEF | TRAINING BRIEF |
| FARSIGHT DRONE | CORPORATION DRONE |
| FARSIGHT GIFT | CORPORATION GIFT |
| NEXT FROM FARSIGHT | NEXT FROM THE CORPORATION |
| A Farsight drone brings this part. | A Corporation drone brings this part. |
| Monument A1 sign: WELCOME · NEW STAFF · FARSIGHT | WELCOME · NEW STAFF · DUMMY CORP |
| No credits | CREDITS: on the title menu, and after the CERTIFIED ending |
| Tile card: the brief, then "One counted write-off clears the tile." (three sentences) | The brief (two sentences), then a label: TO CLEAR · 1 COUNTED WRITE-OFF |
| Arcade banner: "District 2 of 3: Waterfront. [the district's design note] Write-offs required: 3." (30 words) | A label, DISTRICT 2 OF 3 · WATERFRONT · 3 WRITE-OFFS, then the district's line (n24–n26) |
| Title: "You are a FARSIGHT crash-test subject. Cars avoid you. Fool them into hitting you." | "You are a Dummy Corporation trainee. Every write-off brings Certification closer." |
| Arcade ending Licensed: "Contract complete. FARSIGHT thanks you for your cooperation." | "Training complete. The Corporation thanks you for your service." |

- **Credits card:** CREDITS, then DUMMIES · A game by Lawrence Lek · Published by Farsight. A, Space, a tap or Back closes it.
- **Notices:** 26, by ID (n01–n26), in `prototypes/p8/lore.js`. Each keeps its placeholders, capitals and width.

## 5 Text pipeline (Style Guide V2)

- **Guide:** `style/STYLE_GUIDE_V2.md`. 41 rules (V2.2). Tone reference `PLAY` (*Play Station*, 2017).
- **Run:** `style/runs/20261029-161328-v8` (`style/loop.py --v8`). Every 7.13 text that breaks V2 starts as shipped.
  - Stage 1 (V2.0): 45 pieces. 27 tales, 3 act lines, the ending, 11 briefs, 23 notices, 11 barks, the credits.
  - Stage 2 (V2.1): the story's 31 texts as one batch. T14: one slogan per batch. V10: the purpose stated.
  - Stage 3 (V2.1): Arcade's three district banners, found by the text audit.
  - Stage 4 (V2.2): the story and six opening lines as one batch. V11: each tale names its place.
- **Placement:** `prototypes/p8/make_lore.py <run>` writes `content/story/story_v2.json` and `prototypes/p8/lore.js`. It refuses a run with any piece not accepted.
- **Gating:** the shared code reads `window.DUMMIES_LORE` and `window.DUMMIES_CREDITS`. Only Prototype 8 bundles them. Prototypes 7 to 7.13 draw as before.

## Measured

- **Run:** 48 of 48 pieces accepted at 10/10, each confirmed by a fresh evaluator. 183 agent calls. $19.88.
  - 12 accepted as shipped (the 11 briefs, the credits). 30 after one refinement; 5 after two; 1 after three.
  - Stage 2: one slogan in five story texts; the sacrifice stated nowhere. 5 → 8 → 10 → ✓10.
  - Stage 3: the banners named no duty and ran to 30 words. 1 → 10 → 6 → 10 → ✓10 (a confirmation caught "under the highways").
  - Stage 4: four tales named no place; the slogan also closed two tales. 1 → 8 → 10 → ✓10. Seven texts rewritten.
- **`prototypes/p8/test_p8.js`:** 20 of 20.
  - 57 company texts at most 2 sentences and 20 words; the longest 20. No "!", no Farsight.
  - No phrase of four words in more than two of the 37 texts of stage 4. The sacrifice stated in Act III's line.
  - story_v2.json equals story.json in every non-text field.
  - Farsight drawn only on the Credits card, from the title and after CERTIFIED. 291 strings on a 27-step tour. No page errors.
  - Prototypes 6.4 to 7.13 byte-identical to their commits. `prototypes/p7/build.py` refuses to build.
- **`prototypes/p7/test_p713.js`:** 103 of 103 after the shared-code changes.

## Registry

- No IDs added. The registry stays `edit94-2026-10-29` (507 entries). The style limits are IDs in `style/style.params.json`.

## Open

- **D79** stands for Prototype 7.13's text; Prototype 8 carries its fixes.
- **D78** stands: tile barks wait for a `tile` condition.
- **D80:** data Prototype 8 bundles but never draws still names Farsight: the CBD and Campus districts (`sim.js`, `content.js` places), the terminal signage, a fleet model's job, the fleet glossary.
