# DUMMIES — GDD Edit 96: Prototype 8.1. Longer tales; CBD and Campus in the lore

**29 October 2026 · Lawrence Lek** · Amends GDD Edit 95 §3.2 (length) and closes D80 for the CBD and Campus districts. Builds: `prototypes/p8/dummies_p8_1.html`. Prototype 8 stays frozen (`dummies_p8.html`). Style: `style/STYLE_GUIDE_V2.md` (V2.3).

## 0 Request and rulings

- **Request (user, 29 October):**
  - "The tales can be slightly longer up to 35 words if needed."
  - "Rewrite unused CBD and campus districts too."
- **Readings flagged:**
  - Tales only. Act lines, briefs, the ending and notices keep 20 words.
  - A tale keeps the cap of two sentences (Edit 95 §3.2).
  - "If needed": the extra words go to the place. A tale may stay short.
  - CBD and Campus: their names, blurbs, intros, landmark and screen names. The rest of D80 (terminal signage, a fleet job, the glossary) stays open.

## 3.2 Voice (amends Edit 95 §3.2)

```markdown
- **Length:** every in-game text at most two sentences.
  - Tales: at most 35 words (style.v2.tale.maxWords). The extra words name the place.
  - Act lines, briefs, the ending, notices: at most 20 words (style.v2.text.maxWords). Aim for 15.
```

## 3.4 CBD and Campus (unused districts)

```markdown
- **Status:** city districts of Edit 41. Not in Prototype 8's Arcade or Story.
- **Rule:** their text follows Edit 95. Dummy Corporation, never Farsight.
- **Text:** CBD's blurb, intro and centre landmark; Campus's name, blurb and intro.
- **Slots:** n27–n33 in prototypes/p8/lore.js. Patched into the bundled data.
- **Facts kept:** two flyovers and towers (CBD); impact plates that score more (Campus).
```

## 4.2 UI (amends)

| Was (P8) | Prototype 8.1 |
|---|---|
| Campus name: FARSIGHT Campus | Calibration Campus |
| CBD landmark: FARSIGHT Tower | Corporation Tower |
| CBD B2: FARSIGHT Tower Plaza | Corporation Tower Plaza |
| Monument A1 tale (16 words): "Dummy Corporation welcomes you to training. Stand in the road until a colleague notices you." | (33 words) "A conveyor sets you down at the welcome wall, where a screen shows your face and the word WELCOME. Your first duty toward Certification: stand in the road until a colleague notices you." |

## 5 Text pipeline

- **Guide:** `style/STYLE_GUIDE_V2.md` V2.4. V2.3: tales to 35 words. V2.4: no placeholder in a tale.
- **Run:** `style/runs/20261029-172610-v81` (`style/loop.py --v81`). The rest of the text is Prototype 8's run.
  - Stage 1 (V2.3): 7.13's 27 tales, as shipped; the CBD and Campus text (n27–n33).
  - Stage 2 (V2.3): the story and six opening lines as one batch.
  - Stage 3 (V2.4): the same batch again. Stage 2 had put "{n}" in two tales.
- **Placement:** `prototypes/p8/make_lore.py` reads the build from the run's tag (-v81: P8.1, Edit 96).

## Measured

- **Run:** 30 of 30 pieces at 10/10, confirmed. 132 agent calls. $16.68.
  - 25 tales after one refinement; Parkland A1 and B3 after three. Districts 1 → 10 → ✓9 → 10 → ✓10.
  - Stage 2: 7 → 10 → ✓10 (T14: three phrases in three tales). Stage 3: 6 → 10 → ✓10 (F5: "{n}" in Parkland B2, Waterfront B2).
- **Tales:** 25 to 35 words, mean 30.2; all 27 past 20. Longest 192 characters (7.13: 223). Two sentences each.
- **`prototypes/p8/test_p81.js`:** 22 of 22.
  - CBD and Campus: no Farsight in the district table, the places, or the page.
  - Farsight drawn only on the Credits card. 295 strings on a 27-step tour. No page errors.
  - Prototypes 6.4 to 7.13 and 8 byte-identical to their commits.

## Registry

- No IDs added. The registry stays `edit94-2026-10-29` (507 entries). `style.v2.tale.maxWords` is an ID in `style/style.params.json`.

## Open

- **D80** narrows: terminal signage, fleet model SED-01-001's job and the fleet glossary still name Farsight. Never drawn.
- **Tale length:** every tale took the extra words. The loop started from 7.13's longer tales.
