# Sound designer run 20261030-014423-cues

- Models: designer opus, reviewer opus, refiner opus.
- Inputs: 94 events, 8 music states, 100 SFX, 6 tracks.
- Incremental: version 0 is `audio/runs/20261030-013331-cues/map_v3.json` (run None); no designer call.

## Version 0

- Lint: 1 major
- Reviewer: **5/10**

```
SCORE: 5/10
REASON:
- music.rotation · L1 (blocking, −4) "track6_ansimuz-itch-io_fantasy Dragon.ogg" The pack's inventory has no file by this name (it lists "track6_ansimuz-itch-io_fantasy-dragon.ogg"), so the fourth level track will not load. Fix: change the fourth rotation entry to track6_ansimuz-itch-io_fantasy-dragon.ogg.
- dropped-in · A1 (minor, −1) "confirm_2.wav" This alternate is a menu confirm from the system world, but the event is a body landing thud. Fix: replace it with blocked.wav and keep door_close.wav as the other alternate, so both fit the landing.
- honk · C2 (major, −0) "synth" I overrule the lint finding because the reason is tied to the game: the pack has no horn, and Style Guide V2 T3/T7 have each car tier honk in its own voice, which the Prototype 8.4 synth already does. Fix: none.
Total: 10 − 4 − 1 = 5.
```

## Version 1

- Lint: 1 major
- Reviewer: **10/10**

```
SCORE: 10/10
REASON:
- None.
I checked every §3 rule (C1–C3, F1–F4, X1–X2, S1–S2, L1–L2, M1–M3, A1) against all 108 entries, the inventory and the music states; I rejected the lint finding "honk · C2" because its `why`, "The pack has no horn; 8.4 honks keep each tier's voice.", is a reason tied to the game (the inventory has no horn file, and cars speak in their tier's voice per Style Guide V2 T3/T7), which C2 explicitly allows.
Total: 10 − 0 = 10.
```

- Fresh reviewer 1: **10/10**

```
SCORE: 10/10
REASON:
- honk · C2 (major, −0) "decision": "synth" The lint finding is wrong: the test allows `synth` when the reason is tied to the game, and this one is. The inventory has no horn file. Prototype 8.4's honks keep each tier's own voice, which the guide's §0 calls for (cars "bark in their tier's voice"). Fix: none needed.
- None. I checked the rest against every rule in §3: one entry for each of the 94 events and 13 variants (C1–C3); file fit, length, weight and tone (F1–F4); clashes between events that fire together, and that no file is primary in more than three events (X1–X2); cooldowns and variety (S1–S2); files in the inventory and gain classes (L1–L2); the music spans, rotation and open states (M1–M3); and 2–3 alternates per cue (A1).
Total: 10 − 0 = 10.
```

## Result

- Accepted: 10/10, confirmed.
- Final lint: 1 major.
- Calls: 4 · 351.0 s · $1.54.
