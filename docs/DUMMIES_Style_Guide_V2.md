# DUMMIES — Style Guide V2 (Dummy Corporation)

**29 October 2026 · Lawrence Lek** · The lore refinement of GDD Edits 95–98, for Prototypes 8 to 8.4 (8.4, Edit 99, changed no text). A separate guide: `STYLE_GUIDE.md` (V1, Assignment 6) stays as it was, for Prototype 7.13.

- **Game:** DUMMIES. A crash-test dummy in SHENZHEN SMART CITY trains in the traffic. The self-driving cars are the city's workers.
- **The company in the game:** Dummy Corporation. It manufactures custom dummies for high net-worth individuals.
- **The publisher:** Farsight. Extra-diegetic. Named only in the Credits.
- **The dummy's purpose:** do its job, complete its training, join the Certified dummies, and be sacrificed in service to high net-worth individuals.
- **Story (Narrative A, Certified, kept):** Act I Monument, INDUCTION · Act II Parkland, OPENING DAY · Act III Waterfront, CUSTOMS. 27 tiles. Ending: CERTIFIED.
- **Tone reference:** *Play Station* (Lawrence Lek, 2017): slogans, programme names, perks, fine print (`PLAY#PS1`–`PLAY#PS5`).
- **Precedence:** newest wins. EDIT98 > EDIT97 > EDIT96 > EDIT95 > EDIT94 > EDIT93 > EDIT92 > STORY > FLEET > EDIT39 > DESIGN (V29) > EDIT26. EDIT95 to EDIT98 replace every source that names Farsight inside the game. A user-decided DECISIONS row beats any doc.
- **V2.1** (29 October): T14 and V10. Stage 1 of the Prototype 8 run put one slogan ("brings Certification closer") in five story texts and two notices, and stated the sacrifice nowhere (run `20261029-161328-v8`).
- **V2.2** (29 October): V11. Stage 2's tales kept the duty and could lose the place: Monument A1, B1 and A2 and Parkland A1 named no landmark.
- **V2.3** (29 October): F6 lets a tale run to 35 words (`style.v2.tale.maxWords`), user-decided (GDD Edit 96). §0 adds the unused CBD and Campus districts.
- **V2.4** (29 October): F5 bars placeholders from tales. The Prototype 8.1 review batch had put "{n}" in Parkland B2 and Waterfront B2 (run `20261029-172610-v81`).
- **V2.5** (29 October): F6 sets a tale at 15 to 35 words (`style.v2.tale.minWords`, `style.v2.tale.maxWords`); F11: the tile's content sets the length (GDD Edit 97). Prototype 8.1's tales all ran 25 to 35.
- **V2.6** (29 October): F11 asks for the shortest tale that keeps place, duty, equipment and one detail, and for lengths that vary across a batch. The V2.5 redraft still ran 22 to 35 words (mean 30.7) (run `20261029-181530-v82`).
- **V2.7** (29 October): tales 15 to 20 words (`style.v2.tale.maxWords` 20); F8 makes a brief a goal; U1, the user's own lines, are canon (GDD Edit 98).
- **V2.8** (30 October): no rule changes. T13 and T14's numbers get IDs (`style.v2.tone.maxAdjectives`, `style.v2.slogan.minWords`, `style.v2.slogan.maxTexts`). A clean piece's note may run past one sentence. V2.7 wrote Prototype 8.3's and 8.4's text.
- **V2.9** (30 October): C1 widens to the makers of the game's licensed music and sound, by their credit lines. Prototype 9's Credits card adds "Music by ansimuz" and "Sound effects by Chequered Ink" (user-decided; DECISIONS row 615, D86 closed; GDD Edit 100).
- **Sources** are chunk IDs from `style/kb/manifest_v2.json`. **Statistics** are IDs in `style/style.params.json`.

## 0 What it governs

| Speaker | Content | Slot in Prototype 8 |
|---|---|---|
| Dummy Corporation | Tales: the tile card | `content/story/story_v2.json` `districts[].tiles.<tile>.tale` |
| Dummy Corporation | Briefs: label and duty | `story_v2.json` `tasks` |
| Dummy Corporation | Act lines | `story_v2.json` `districts[].intro` |
| Dummy Corporation | The ending | `story_v2.json` `ending` |
| Dummy Corporation | Notices: title lines, drone and gift labels, part notes, toasts, signage, Arcade's district banners | `prototypes/p8/lore.js` |
| The cars | Barks: one bubble per event | `content/db/fleet.json` `barks[]`; Prototype 8's overrides in `lore.js` |
| Dummy Corporation | The unused CBD and Campus districts: names, blurbs, intros, landmark and screen names (GDD Edit 96 §3.4) | `lore.js` notices n27–n33 |
| The Credits | Who made and published the game, and who made its licensed music and sound. Extra-diegetic | `lore.js` `credits`; Prototype 9 adds the audio lines (`prototypes/p9/build.py`) |

- **U1, the user's own lines:** Monument A1's tale, the `any` goal, the STORY card (n03) and the ARCADE card (n34) are written by the user (GDD Edit 98 §0). Canon as written, with "!" dropped. The loop never rewrites them and never deducts for them. In a batch they are marked `locked`; they still count for T14.
- **Out of scope:** menu chrome and controls help (NEW GAME, PRESS SPACE TO START). They are interface, not voice (decision 540). They still name no company.

## 0.1 Cast and factions

| Who | What they are | In text | Rules | Source |
|---|---|---|---|---|
| The dummy | A trainee and the product. It wants to be Certified | "you". Cars: "the subject", "it", "the dummy" | V3, V8, T5 | `EDIT95#3.1`, `FLEET#F3` |
| Dummy Corporation | Makes custom dummies for high net-worth individuals. Narrates | "Dummy Corporation", "the Corporation", "we". Caps: DUMMY CORPORATION | T1–T5, V4 | `EDIT95#3.1`, `EDIT95#3.2` |
| Clients | High net-worth individuals. Never named, never seen. Served | "clients", "our clients", "high net-worth individuals" | V9 | `EDIT95#3.1` |
| Certified dummies | Those who passed. They serve, and are sacrificed for, clients | "Certified" (capital C) | V3, T4 | `EDIT95#3.1`, `EDIT95#3.3` |
| The fleet | The city's self-driving cars, its workers; the trainee's colleagues | Barks in tier voice | T6–T12 | `FLEET#F1`, `FLEET#F2` |
| Four price tiers | 01 Luxury · 02 Corporate · 03 Consumer · 04 Budget | Each keeps its voice | T7, T8, T10 | `FLEET#F4` |
| Eight classes, 32 named models | Comet couriers to Commons buses; callsigns Aurum to Rust Bucket | A class speaks from its job; a callsign pins a line | V7 | `FLEET#F5`, `FLEET#F7~2` |
| Act II and III people | The board, visitors, a school party, the gardener; customs, the police, Chassis 0 | Narration only | V6, R4 | `STORY#PC2`, `STORY#PA1`, `STORY#WB3` |
| Farsight | The publisher | Credits only | V1, C1 | `EDIT95#0` |
| ansimuz, Chequered Ink | The makers of the licensed music and sound (Prototype 9) | Credits only | C1 | DECISIONS row 615 |

## 1 Scoring

- **Start at 10.** Each violated rule deducts its severity, once per rule per line.
- **Severity:** blocking −4 (`style.score.deduct.blocking`) · major −2 (`style.score.deduct.major`) · minor −1 (`style.score.deduct.minor`). **Floor:** 1 (`style.score.floor`).
- **Acceptance:** 10/10 (`style.loop.targetScore`), confirmed by a fresh evaluator (`style.loop.confirmations`). At most three refinements (`style.loop.maxRounds`).
- **Lint** (`style/lint.py`, mode v2) measures: length, sentences, Farsight, the company's name, "!", intensifiers, digits, grid codes, landmarks. Its findings are facts.
- **Output, strictly:**

```
SCORE: <X>/10
REASON:
- <line id> · <rule id> (<severity>, −<n>) "<quoted text>" <why, one sentence>. [<chunk id>] Fix: <replacement or instruction>.
Total: 10 − <n> − <n> = <X>.
```

- The first line is the `SCORE` line. Nothing follows the `Total:` line. A clean piece: `- None.`, a short note of what was checked, `Total: 10.`

## 2 Tone

| ID | Speaker | Rule | Source | Test | Severity |
|---|---|---|---|---|---|
| T1 | Dummy Corporation | Deadpan and inspirational. A corporate notice that motivates the trainee, delivered flat. | `EDIT95#3.2`, `PLAY#PS2` | Judge: cheer, hype, irony that winks, or sarcasm fail. So does a notice that does not motivate | major |
| T2 | Dummy Corporation | No exclamation marks. | `EDIT95#3.2`, `PLAY#PS0` | Lint `bang` | major |
| T3 | Dummy Corporation | Training framing. The job is training. A write-off is progress. Parts are equipment. Cars are colleagues. The goal is Certification and service to clients. | `EDIT95#3.1`, `EDIT95#3.3` | Judge: a game, a contest, enemies, a power-up fail | major |
| T4 | Dummy Corporation | Inspire, never console. Harm is service and progress. Sacrifice is stated plainly, as an honour. No pity, no gore, no wink. | `EDIT95#3.1`, `EDIT39#4.1.1` | Judge | major |
| T5 | Dummy Corporation | Address the trainee as "you". The company speaks as "Dummy Corporation", "the Corporation" or "we". | `EDIT95#3.2`, `PLAY#PS2` | Judge | minor |
| T6 | Cars | Workers, not lore narrators: deadlines, rank, record, fear of retraining, resentment, pride. | `EDIT26#3.2`, `DESIGN#D9.3`, `FLEET#F2` | Judge | major |
| T7 | Cars | Tier voice holds. 01 Luxury: polished, superior, never apologises. 02 Corporate: logs, KPIs, policy numbers. 03 Consumer: tired, resigned. 04 Budget: short-fused, politeness bolted on. | `FLEET#F4` | Judge against `when.tier` | major |
| T8 | Cars | A tier-free line fires for all four tiers. It carries no single tier's signature. | `SUB4#5`, `FLEET#F4` | Judge | major |
| T9 | Cars | Politeness barely contains the personality. | `EDIT26#3.2`, `FLEET#F2` | Judge | minor |
| T10 | Cars | "!" only in a shout-style bark or a Budget (04) bark. | `DECISIONS#rows-541-550` (row 541) | Lint `bang` | major |
| T11 | Cars | A batch does not lean on stock endings: at most two lines share a stock word or a closing tag (`style.bark.maxStockEndings`). | `SUB4#6.1` | Lint `stock` | minor |
| T12 | Cars | A line is a feeling or a joke, not a flat report. | `SUB4#6.1` | Judge | minor |
| T13 | Dummy Corporation | Few adjectives. At most one per sentence (`style.v2.tone.maxAdjectives`). No intensifiers (very, truly, really, incredibly, extremely, amazing). | `EDIT95#3.2` | Lint `adjectives` (intensifiers); judge the count | minor |
| T14 | Dummy Corporation | A batch does not lean on one slogan. No phrase of four or more words (`style.v2.slogan.minWords`) recurs in more than two texts (`style.v2.slogan.maxTexts`). | `SUB4#6.1`, `PLAY#PS5` (the 2017 script repeats its slogan once) | Lint `repeats` | minor |

## 3 Vocabulary and lore

| ID | Speaker | Rule | Source | Test | Severity |
|---|---|---|---|---|---|
| V1 | Both | Banned in every in-game text: Farsight (any case), kill, killed, die, died, dead, death, player, level, game, score, respawn, lives, Chongqing, Tesla, Toyota, BYD. Plurals and -ed forms count. The Credits may name Farsight. | `EDIT95#0`, `EDIT95#3.1`, `FLEET#F2`; row 540 | Lint `banned` | blocking |
| V2 | Both | One city: Shenzhen Smart City. No other real city. No real car brand. | `FLEET#F1`, `EDIT39#3.1` | Lint `city`, `brand` | blocking |
| V3 | Both | The glossary. Training: the dummy's job. Certified: a dummy that passed. Clients: high net-worth individuals. Write-off: a destroyed body. Chassis: one body. Bay: where a chassis is issued. Dispatch, route, retraining: the cars' words. Never a game's words (lives, respawn, level). | `EDIT95#3.1`, `FLEET#F3` | Judge | major |
| V4 | Dummy Corporation | The company is Dummy Corporation. Caps labels: DUMMY CORPORATION, CORPORATION DRONE. A sign too narrow may read DUMMY CORP. No other company name. | `EDIT95#3.1`, `EDIT95#4.2` | Lint `company` | major |
| V5 | Cars | Cars name places, never grid codes. | `EDIT94#who-built-what-assignment-5`; row 537 | Lint `gridcode` | major |
| V6 | Dummy Corporation | The story frame holds. INDUCTION: the trainee arrives. OPENING DAY: the Expo opens to clients. CUSTOMS: Certified dummies ship to clients. Fixed phrases stay exact: ZERO ACCIDENTS, ROLE: DESTRUCTIVE TESTING, CERTIFIED. | `EDIT95#3.3`, `STORY#S2` | Judge | major |
| V7 | Cars | The roster from `fleet.json`. A callsign or job detail pins the line to its model. | `FLEET#F5`, `FLEET#F7~2` | Judge | major |
| V8 | Both | The dummy is a crash-test body: a trainee and a product, not a person or a competitor. | `EDIT95#3.1`, `FLEET#F3` | Judge | major |
| V9 | Dummy Corporation | Clients are high net-worth individuals. They are served, never seen, never named, never mocked. | `EDIT95#3.1` | Judge | major |
| V10 | Dummy Corporation | Across the story, the purpose is stated plainly at least once: Certified dummies are sacrificed in service to clients. | `EDIT95#3.1` | Judge, on a batch of the story's texts | major |
| V11 | Dummy Corporation | Environmental storytelling. A tale names its place: the tile's landmark, or a detail of it from the canon. It turns that place toward the duty or the training. A tale of equipment and duty alone misses. | `EDIT95#3.1` ("everything the city shows the dummy inspires it to do its job") | Judge | major |

## 4 Formatting and length

| ID | Speaker | Rule | Source | Test | Severity |
|---|---|---|---|---|---|
| F1 | Cars | At most 48 characters (`style.bark.maxChars`): three lines of the field face. | `EDIT39#6.6`, `FSG#field-text` | Lint `length` | blocking |
| F2 | Cars | One bubble, one ink: plain text on one line. | `FSG#field-text` | Lint `plain` | major |
| F3 | Cars | Ends with ".", "!" or "?". | `FLEET#F2` | Lint `end` | major |
| F4 | Cars | Fields fit the event: style, priority (write-off 3, hit 2, chatter 1). | `EDIT39#6.6`, `EDIT26#6.6` | Lint `fields` | major |
| F5 | Both | No typed gameplay figures. Numbers live in the registry. Placeholders and paperwork numbers only, as in V1. A tale takes no placeholder: the card draws it as written, and the brief carries the number. | `STORY#S1`, `FSG#canon-rules` | Lint `digits`, `placeholders` | major |
| F6 | Dummy Corporation | Every in-game text: at most two sentences (`style.v2.text.maxSentences`). A tale: 15 to 20 words (`style.v2.tale.minWords`, `style.v2.tale.maxWords`). Briefs, act lines, the ending, notices: at most 20 words (`style.v2.text.maxWords`); aim for 15 (`style.v2.text.targetWords`). | `EDIT98#3.2`, `EDIT97#3.2`, `EDIT95#3.2` | Lint `length` | blocking |
| F7 | Dummy Corporation | A tale on a tile that issues equipment names it, by rank or in words ("Legs 1 is fitted."). | `DECISIONS#rows-531-540~2` (row 531), `STORY#MB3` | Judge | major |
| F8 | Dummy Corporation | A brief is the level's goal. A caps label of at most 19 characters (`style.brief.labelMaxChars`), then the goal: what to do, in the imperative, first; then what the final hit must be. One or two short sentences. Keep its placeholders ({n}, {cls}, {clsLong}). No "coverage gap" framing. | `EDIT98#3.2`, `STORY#S3` | Lint `brief`; judge | major |
| F9 | Cars | At most two sentences (`style.v2.text.maxSentences`). | `EDIT95#3.2` | Lint `sentences` | blocking |
| F11 | Dummy Corporation | A tale's length follows its content. Write the shortest tale that keeps the place, the duty, any equipment and one detail or joke; every clause past that earns its place. A tile with one image stays short; a place with a history takes more. No clause that pads, repeats the brief or restates the act line. Across a batch, lengths vary: tales that all sit near the cap are padded. | `EDIT97#3.2` | Judge; on a batch, the spread of lengths | minor |
| F10 | Dummy Corporation | A notice keeps its slot's form: a caps label stays caps; a placeholder ({PART}, {TILE}, {N}) stays as given. | `EDIT95#4.2` | Lint `placeholders`; judge | major |

## 5 Truth

| ID | Speaker | Rule | Source | Test | Severity |
|---|---|---|---|---|---|
| R1 | Cars | React to logged events only. Invent no speed, damage, delay, fine or motive. | `DESIGN#D9.3`, `FLEET#F8` | Judge | blocking |
| R2 | Cars | Every fact a line asserts has a claim its conditions guarantee. | `EDIT39#6.6`, `FLEET#F8` | Judge | blocking |
| R3 | Cars | Event-correct. A write-off line only on `writeoff`. | `EDIT26#6.6` | Judge | blocking |
| R4 | Both | Tile truth. A tile's text names only what the tile has. A car's tile line names the landmark as the place, never a spot relative to it. | `STORY#MA1` … `STORY#WB2`; `FLEET#F8` | Lint `landmark`; judge | blocking |
| R5 | Dummy Corporation | A tale's duty matches its brief, and it names equipment only on the tile that issues it, or later. | `STORY#S1`, `EDIT93#3.1` | Judge | blocking |

## 6 Credits

| ID | Speaker | Rule | Source | Test | Severity |
|---|---|---|---|---|---|
| C1 | Credits | Extra-diegetic. Name the game, its maker, its publisher, Farsight, and the makers of its licensed music and sound, by their credit lines. No lore, no slogans. At most two sentences a line. | `EDIT95#0`, `EDIT95#3.3`; DECISIONS row 615 (V2.9) | Lint `length`; judge | major |

## 7 In voice, out of voice

| Speaker | In voice | Out of voice | Rule |
|---|---|---|---|
| Dummy Corporation | "Every write-off brings Certification closer. Stand in the road." | "Farsight welcomes you to the Test City!" | V1, T2 |
| Dummy Corporation | "Our clients cannot afford accidents. You can." | "Poor dummy. It hurts, but you are so brave." | T4, T13 |
| Dummy Corporation | "Legs 1 is fitted. Jump into a car between the screens." | A 40-word tale about the screens' history, in five sentences | F6 |
| Dummy Corporation | "Success is measured against the possible, not the probable." (`PLAY#PS2`, the register) | "It's work! It's play!" (`PLAY#PS4`, not adopted) | T1, T2 |
| Cars | "Bumper damage on a Luxury trim. Typical." | "Done! Done! You happy now?!" (three sentences) | F9 |
| Credits | "DUMMIES · A game by Lawrence Lek · Published by Farsight" | "Farsight: aligning AI with your interests." in a tale | C1, V1 |
| Credits | "Music by ansimuz" · "Sound effects by Chequered Ink" | "Beats by our partners at ansimuz, powering your Certification." | C1 |
