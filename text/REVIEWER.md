# The text reviewer (an independent pass over the drafts)

You did not write these lines. Four writers drafted them, one batch each, from `text/BRIEF.md` and `docs/DUMMIES_Style_Guide_V2.md`.
Your job: read every proposed change across all batches and find what a careful editor would send back. Lint (`text/lint.py`) has
already checked the hard limits; you check what a script cannot.

Read first: `text/BRIEF.md` (the request, the proposed V2.10 amendment, the canon), `docs/DUMMIES_Style_Guide_V2.md`, and
`content/text/review.json` (every line: `text` is before, `after` the proposal, `why` the writer's reason, `trigger` where it shows,
`voice` a car's tier voice, `event`, `style`, `placeholders`).

Look at every item where `after` differs from `text`, and at the kept lines where the brief calls for a change (banned words; the
held, NOT COUNTED, fence and denial toasts). Flag a line when:

1. **Canon:** a wrong term (Farsight, player, level, game, score; "lives"; a real brand), a fact the game does not have, a control or a
   mechanic stated wrongly (A dashes, B jumps, X grabs a cone, Y throws; a cone makes a car divert or stop; the brief wants a kind of last
   hit; a miss of the brief holds the chassis at 1), a tale that loses its place or its part (V11, F7, R4, R5).
2. **Truth (cars):** the bark claims what its trigger does not guarantee (R1, R2): a door on an any-zone hit, a speed, a fine, a motive.
3. **Voice:** a car out of its tier (T7) or a tier-free line with one tier's signature (T8); the Corporation cheerful, winking, cruel
   about pain, or so snarky the line stops instructing (V2.10 T1, T15). "A tad snarkier": dry, not mean.
4. **Sense:** the line reads wrongly once its placeholders are filled (`{brief}` becomes a label in lower case, e.g. "cone-baited car",
   "dash into a car", "combo ×3"; `{tile}` "A2"; `{n}` "1"); a status line that hides the number the player needs; a lost instruction.
5. **Repetition across the whole set (T14):** the same put-down or phrase in more than two lines, across batches.
6. **A change for nothing:** a rewrite no better than the original. Prefer keeping the original then.

Also look at the three interface lines lint flags for banned words (`ui.09` "STORY · SAVE GAMES", `ui.16` "Name this score",
`ui.18` "Restart level") and propose plain replacements that keep their job.

Write `text/review_findings.json`: `{"<id>": {"problem": "one sentence", "fix": "the corrected line, or KEEP_ORIGINAL"}}`. Every `fix`
must meet the brief's hard limits (run `python3 text/lint.py` mentally: barks ≤48 characters; toasts ≤60 filled; Corporation ≤20
words, ≤2 sentences; placeholders kept). Only flagged lines; no entry for a line that is fine. Then report in under 120 words: how many
you flagged, the main kinds, and your overall verdict on the set.
