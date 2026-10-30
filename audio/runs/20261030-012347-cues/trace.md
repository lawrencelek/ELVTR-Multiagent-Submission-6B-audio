# Sound designer run 20261030-012347-cues

- Models: designer opus, reviewer opus, refiner opus.
- Inputs: 94 events, 8 music states, 100 SFX, 6 tracks.

## Version 0

- Lint: 4 blocking, 3 major
- Reviewer: **7/10**

```
SCORE: 7/10
REASON:
- combo.max · S2 (major, −0) "A powerup crowns the cap; it fires once per cap." The lint finding is wrong because the why gives a reason: the cap fires once per combo, so one file cannot repeat back to back. Fix: none.
- honk · C2 (major, −0) "The pack has no horn; 8.4 honks keep each tier's voice." The lint finding is wrong because C2 accepts a reason tied to the game: the inventory has no horn file, and tier voices come from Style Guide T3/T7. Fix: none.
- bark · S1 (blocking, −0) "audio.sfx.cooldown.bark" The lint finding is wrong because §2 names this as a valid specific ID, and S1 only tests frame and ambient events, while `bark` is burst. Fix: none.
- bark.shout · S1 (blocking, −0) "audio.sfx.cooldown.bark" The lint finding is wrong for the same reasons: the cooldown ID is named in §2, and the event is burst. Fix: none.
- music.intro · M1 (blocking, −0) "track1_ansimuz-itch-io_megabot.ogg" The lint finding is wrong because this file is Track 1 in the pack's music inventory. Fix: none.
- music.menu · M1 (blocking, −0) "track2_ansimuz-itch-io_summer-nights.ogg" The lint finding is wrong because this file is Track 2 in the pack's music inventory. Fix: none.
- music.level · M2 (major, −0) "rotation" The lint finding is wrong because the rotation holds Tracks 3, 4, 5 and 6 once each, with storyRule "tile" and arcadeRule "run". Fix: none.
- story-clear · F3 (minor, −1) "level_up.wav" At −28.2 dB this is the quietest reward cue, 5.3 dB under the combo tick `collect_7.wav` (−22.9), so clearing a tile sounds smaller than a routine combo hit. Fix: make `powerup_5.wav` (−19.5 dB) primary and keep `level_up.wav` as an alternate.
- bark.shout · L2 (minor, −1) "gain": "alert" A shout is still a car bark, which is ambient chatter, but it is on `alert` while the base `bark` is on `ambient`. Fix: set gain to `ambient` and keep `select_5.wav` and `select_4.wav`.
- unveil-lift · A1 (minor, −1) "tidal_wave.wav" A tidal wave comes from another domain (water disaster) than a cloth lifting off a monument. Fix: replace it with `teleport.wav`, next to `shrink.wav`.
Total: 10 − 1 − 1 − 1 = 7.
```

## Version 1

- Lint: 4 blocking, 3 major
- Reviewer: **10/10**

```
SCORE: 10/10
REASON:
- None. I checked every §3 rule (C1–C3, F1–F4, X1–X2, S1–S2, L1–L2, M1–M3, A1) against all 106 ids and the music states, and every lint finding is wrong: combo.max states a reason ("it fires once per cap"), honk's synth reason is tied to the game (the pack has no horn, and horns keep each tier's voice), "audio.sfx.cooldown.bark" is a specific ID that §2 names and bark is a burst event, not frame or ambient, intro and menu play the Track 1 and Track 2 files exactly, and the rotation holds Tracks 3, 4, 5 and 6 once each.
Total: 10 − 0 = 10.
```

- Fresh reviewer 1: **10/10**

```
SCORE: 10/10
REASON:
- combo.max · S2 (major, −0) "powerup_2.wav": I rejected this lint finding. S2 fails an entry only when it gives no reason, and this entry's `why` gives one ("it fires once per cap"). Fix: None to the map. Lint should check for a stated reason, not for stated variation.
- honk · C2 (major, −0) "decision": "synth": I rejected this lint finding. C2 accepts a reason tied to the game, and this entry gives one: the pack has no horn, and the 8.4 synth keeps each tier's voice (Style Guide V2 T3, T7). Fix: None to the map. Lint should read the `why` before it flags.
- bark · S1 (blocking, −0) "audio.sfx.cooldown.bark": I rejected this lint finding. §2 names `audio.sfx.cooldown.bark` as an allowed cooldown ID, and S1 only covers `frame` and `ambient` events, while `bark` is `burst`. Fix: None to the map. Lint should accept the specific cooldown IDs listed in §2.
- bark.shout · S1 (blocking, −0) "audio.sfx.cooldown.bark": I rejected this lint finding for the same reason: the cooldown ID is listed in §2, and the variant is `burst`, which S1 does not cover. Fix: None to the map.
- music.intro · M1 (blocking, −0) "track1_ansimuz-itch-io_megabot.ogg": I rejected this lint finding. The music inventory lists this file as Track 1. Fix: None to the map. Lint should match tracks by the inventory's track number.
- music.menu · M1 (blocking, −0) "track2_ansimuz-itch-io_summer-nights.ogg": I rejected this lint finding. The music inventory lists this file as Track 2, and `card` continues it until the level starts, as the request asks. Fix: None to the map.
- music.level · M2 (major, −0) "rotation": I rejected this lint finding. The rotation plays the inventory's Tracks 3, 4, 5 and 6, each once, and it rotates per tile in Story and per run in Arcade. Fix: None to the map.
- No other rule is broken. I checked C1–C3, F1–F4, X1–X2, S1–S2, L1–L2, M1–M3 and A1 against all 106 entries (94 events and 12 variants) and all 8 music states.
Total: 10 − 0 = 10.
```

## Result

- Accepted: 10/10, confirmed.
- Final lint: 4 blocking, 3 major.
- Calls: 5 · 534.8 s · $2.17.
