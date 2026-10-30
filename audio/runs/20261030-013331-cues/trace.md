# Sound designer run 20261030-013331-cues

- Models: designer opus, reviewer opus, refiner opus.
- Inputs: 94 events, 8 music states, 100 SFX, 6 tracks.
- Incremental: version 0 is `audio/runs/20261030-012347-cues/map_v1.json` (run None); no designer call.

## Version 0

- Lint: 1 blocking, 2 major
- Reviewer: **4/10**

```
SCORE: 4/10
REASON:
- chassis.start · C1 (blocking, −4) "chassis.start" has no entry in the map, but the catalogue lists it as a variant of `chassis` and it fires when a level starts. Fix: add a `chassis.start` entry, either `base` so it plays `teleport.wav` or `silence` with the reason that the level card covers the issue.
- combo.max · S2 (major, −2) "powerup_2.wav" is the only file, and the stated reason "it fires once per cap" contradicts the entry's own `burst` cooldown and the catalogue's burst frequency. Fix: set files to `powerup_2.wav` and `powerup_4.wav`, and change the alternates to `collect_5.wav` and `powerup_3.wav`.
- honk · C2 (major, −0) "The pack has no horn; 8.4 honks keep each tier's voice." I reject this lint finding: the inventory has no horn file, and §0 (Style Guide V2 T3, T7) has cars bark in their tier's voice, so the reason is tied to the game. Fix: none.
Total: 10 − 4 − 2 = 4.
```

## Version 1

- Lint: 1 major
- Reviewer: **9/10**

```
SCORE: 9/10
REASON:
- honk · C2 (major, −0) "decision": "synth" Not deducted because the lint finding is wrong: the entry gives a reason tied to the game. The pack has no horn, so any cue would break F1, and the 8.4 synth keeps each tier's own honk (§0, Style Guide V2 T3/T7). Fix: none.
- road-cleared · F3 (minor, −1) "powerup_4.wav" The Arcade clear plays the same file at the same `reward` gain as `combo.max`, which fires several times a second, so meeting the quota sounds no bigger than one capped combo hit. Fix: make `powerup_5.wav` the primary, matching `story-clear`, and keep `powerup_1.wav` and `level_up.wav` as alternates.
Total: 10 − 1 = 9.
```

## Version 2

- Lint: 1 major
- Reviewer: **9/10**

```
SCORE: 9/10
REASON:
- honk · C2 (major, −0) "decision": "synth". I am rejecting this lint finding. C2 deducts only when the reason is not tied to the game. This reason is: the inventory has no horn file, and Prototype 8.4's honks give each car tier its own voice, which the Style Guide V2 requires (T3, T7). Fix: none needed.
- ending.win · F3 (minor, −1) "level_up.wav" The win ending is in the `big` class, but at −28.2 dB it is the quietest file in that class. It sits 8.7 dB below the gift's powerup_5.wav (−19.5) and is even quieter than ending.fail's lose_1.wav (−24.3), so a Licensed or Certified run ends smaller than a failed one. Fix: make powerup_5.wav the primary for ending.win and keep level_up.wav as an alternate. To keep X2 at three uses of powerup_5.wav, move road-cleared to powerup_1.wav.
Total: 10 − 0 − 1 = 9.
```

## Version 3

- Lint: 1 major
- Reviewer: **9/10**

```
SCORE: 9/10
REASON:
- honk · C2 (major, −0) "decision": "synth". I am not deducting this lint finding: the event is high priority and set to synth, but the rule only breaks when there is no game reason, and the entry gives one: the inventory has no horn file, and the 8.4 horns keep each car tier's voice (Style Guide V2 T3, T7). Fix: none needed.
- road-cleared · F3 (minor, −1) "powerup_1.wav" Its why says the met quota outranks a capped combo hit, but at −28.1 dB in the same `reward` class it is quieter than combo.max's "powerup_2.wav" (−27.3) and "powerup_4.wav" (−26.8). Fix: make "chime.wav" (−20.3 dB, 0.77 s) the primary for road-cleared and keep "powerup_1.wav" and "level_up.wav" as alternates.
Total: 10 − 0 − 1 = 9.
```

## Result

- Not accepted: best version kept, reported.
- Final lint: 1 major.
- Calls: 7 · 597.6 s · $2.92.
