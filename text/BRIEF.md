# DUMMIES text review — the drafting brief (Prototype 9, 30 October 2026)

## The request (Lawrence, verbatim)

> messages such as 'HELD AT 1 · the brief wants cone-baited car' are not exactly in the correct tone and canon. Maybe it can be a tad
> snarkier. e.g. Try harder - bait a car to divert and get hit.' Review all the car barks and in-game messages, write a comprehensive
> list of all messages to the player before/after the edit for my approval.

Read the whole Style Guide V2 first: `docs/DUMMIES_Style_Guide_V2.md` (V2.9). This brief adds a proposed amendment, V2.10, below. Where they
disagree, V2.10 wins for this review. Nothing is applied to the game until Lawrence approves.

## The proposed amendment: Style Guide V2.10 (for Lawrence's approval)

- **T1, amended (Dummy Corporation):** deadpan and inspirational, with a dry corporate snark. The Corporation treats the trainee as an asset
  under review. It gives flat, procedural put-downs, then the instruction. "Try harder. Bait a car with a cone, then get hit."
  No cheer, no "!", no wink, no insult to the body's pain (T4 holds: harm is service).
- **T15, new (Dummy Corporation, feedback):** a miss, a denial, a held chassis or a NOT COUNTED gets a put-down of at most three words,
  then what to do, in the imperative. One or two sentences. It fits the objective strip: at most 60 characters.
- **T16, new (Dummy Corporation, status):** status lines (COUNTED, TILE CLEARED, combo tallies, drone captions) stay crisp. Praise is
  withheld, not given: "Adequate." beats "Great job". At most one put-down in three status lines.
- **Cars:** unchanged. Their tier voices already carry the snark (T6–T12).

## Canon (short)

- Inside the game the company is **Dummy Corporation** ("the Corporation", "we"). **Farsight** is the publisher: never in game text.
- The dummy is a **trainee** and a product: "you". Cars call it "the subject", "it", "the dummy". It trains to be **Certified**; Certified
  dummies are sacrificed in service to **clients** (high net-worth individuals: never named, never seen, never mocked).
- Glossary: **write-off** (a destroyed body), **chassis** (one body), **bay** (where a chassis is issued), **brief** (a tile's goal),
  **tile** (one screen of the Test City), **drone** (Corporation drone), **colleagues** (the cars), **dispatch**, **route**, **retraining**
  (the cars' words). One city: **Shenzhen Smart City**. Story: Act I Monument INDUCTION, Act II Parkland OPENING DAY, Act III Waterfront
  CUSTOMS; the ending CERTIFIED at the ship.
- **Banned in every in-game text (V1, blocking):** Farsight, kill, killed, die, died, dead, death, player, level, game, score, respawn,
  lives, Chongqing, Tesla, Toyota, BYD (plurals and -ed forms count). Several shipped lines break this ("Level 1 of 27", "at level",
  "No scores yet"): fix them.
- **Cars:** workers, not lore narrators (T6). Tier voice: 01 Luxury polished, superior, never apologises; 02 Corporate logs, KPIs,
  policy numbers; 03 Consumer tired, resigned; 04 Budget short-fused, politeness bolted on. A tier-free line (tier null) fires for all
  four tiers: no single tier's signature (T8). Barks react to the logged event only; claim nothing the trigger does not guarantee (R1, R2):
  a bark for a side hit may say "door"; a bark for any zone may not.
- **Mechanics words you may use:** dash (A), jump (B), grab a cone (X), throw (Y), push off a car, hitch, sling; a cone makes a car
  divert or stop; combos chain hits; the brief wants a kind of last hit; a miss of the brief holds the chassis at 1.

## Hard limits (lint checks these; a line that breaks one is rejected)

| Kind | Limit |
|---|---|
| Car bark | at most 48 characters; at most two sentences; ends with ".", "!" or "?"; "!" only if `style` is "shout" or `tier` is "04" |
| Dummy Corporation line | at most two sentences and 20 words; no "!" |
| Tale | 15 to 20 words, two sentences at most; no placeholder |
| Feedback toast, objective strip | at most 60 characters |
| Label (caps) | stays in caps; at most 19 characters (brief labels) |
| Every line | keep every `{placeholder}` exactly as given; keep a caps label's form (F10); no banned word |

## What to do

- Read each line in your batch with its `trigger`, `voice` and `limit`.
- Keep a good line (after = before). Change a line that breaks the guide or the canon, and a line where the dry snark would land better,
  above all the feedback: misses, denials, held, NOT COUNTED, fences, empty tables.
- "A tad snarkier": dry, not mean. A raised eyebrow, not a sneer. The joke is the Corporation's flatness.
- Vary: no phrase of four or more words in more than two lines of your batch (T14).
- **Locked lines** (`locked: true`, Lawrence's own, U1): after = before. Say "kept: Lawrence's line (U1)".
- **Labels and chrome:** keep unless they break the canon.
- Write `why` in at most 15 words: the rule or the reason ("T15: put-down, then the fix").

## Output

A JSON file, one entry per id in your batch, nothing else:

```json
{"msg.held": {"after": "Try harder. Bait a car with a cone, then get hit.", "why": "T15: put-down, then the fix; names the brief's verb"}}
```
