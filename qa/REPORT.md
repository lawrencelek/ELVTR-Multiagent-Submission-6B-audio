# DUMMIES Prototype 9: adversarial QA, Arcade

Request (Lawrence, 30 October 18:36): "Conduct an adversarial QA game agent who wants to break the game and set them to run in the arcade mode for 30 minutes. Look particular at collisions, getting stuck, and never ending sound triggers."

Fixes (Lawrence, 19:10): DECISIONS rows 623–625. Open: D88.

## 1 Method

- **Agent:** `qa/agent.js`. Playwright drives `prototypes/p9/dummies_p9.html` through keys, as a player does. One persona per browser.
- **Monitor:** `qa/monitor.js`, injected before the game's scripts. It samples at 10 Hz on the game's clock (`app.realT`) and changes nothing.
- **Run:** `qa/run_all.sh qa/runs/2026-10-30 30`. Three personas in parallel, 30 min each, 19:09–19:40 UTC.
- **Personas:**

| Persona | Breaks for | Moves |
|---|---|---|
| clipper | Collisions, getting stuck | Walks, dashes, jumps and dash-jumps into wall faces and corners, stair sides, hill edges, closed screen edges, cars. Wiggles in corners; slides along walls |
| saboteur | Never-ending sounds, stuck cars | Stands in lanes ahead of cars, 14–26 s at a time. Fetches cones, drops and throws them in lanes. Hitches. Walks into traffic |
| chaos | Menus, music, input | Mashes every key, holds opposites together. Spams pause, mute and −/+. Blurs the window, hides the tab, resizes to a phone and back. Taps the canvas and the sound control |

- **Parts:** clipper and saboteur fit every part at each run's start (`s.run.owned`), so dash, jump, grab, throw and hitch are all there to abuse. Chaos plays the parts as issued.
- **Menus:** a shared driver goes back into play. It rotates districts and difficulty, and picks endings at random: retry, choose a district, name a score, high scores.
- **Pilot:** a first run (`qa/runs/2026-10-30-pilot`, 12 min) was stopped. The agent asked the district select for districts 4–5. Arcade lists only the three open, so it looped. The agent was fixed (it learns the list from the cursor's wrap), not the game.

### 1.1 The checks

| Group | Check | Limit |
|---|---|---|
| Collision | Dummy inside a Z0 static, stair side or the hill; inside a raised solid at its level | > 3 px for 0.5 s |
| Collision | Dummy inside a car it meets, after the step resolved it | > 6 px for 1 s |
| Collision | A car's centre inside another car on its layer | 1.5 s |
| Collision | Dummy off the screen; NaN in a body or a car | 1 s; at once |
| Stuck | Pushing with no progress → eight 0.45 s walks, a jump, a dash | Trapped if all move < 6 px |
| Stuck | Body mode past its limit | lunge, jump 3 s; knock, counter 4 s; drop 8 s; dead 10 s; rescue 40 s; hitch 60 s |
| Stuck | Phase past its limit | hitstop 2 s; scroll 6 s; write-off `feedback.writeOffSeconds` + 6 s |
| Stuck | A car stopped with the dummy away | 45 s |
| Stuck | The same menu or phase while the agent presses through it | 90 s |
| Stuck | Game loop gap in play | 1.5 s |
| Sound | One cue or synth event sounding in many seconds of the last 30 | ≥ 20 of 30 (loop) |
| Sound | One cue's rate | ≥ 60 a minute (spam) |
| Sound | A cue inside its own cooldown (`audio.sfx.cooldown.<class>`) | at once |
| Sound | Drops at `audio.sfx.maxVoices`; voices held | > 20 in 10 s; > 40 for 3 s |
| Sound | Prototype 8.4 synth oscillators | > 60 a second for 5 s |
| Music | Overlap; missing; stuck after a change; flapping | > 2 players for 2 s; 10 s; 3 s; > 10 changes a minute |

## 2 Coverage

| | clipper | saboteur | chaos | All |
|---|---|---|---|---|
| Wall time | 30 min | 30 min | 30 min | 90 min |
| Game time in a district | 22.4 min | 23.9 min | 19.5 min | 65.8 min |
| Runs ended | 6 | 4 | 1 | 11 (all Failed test) |
| Districts | Monument, Waterfront | Monument, Parkland, Waterfront | Waterfront | All three open |
| Tiles visited | 7 | 12 | 7 | — |
| Inputs | 1,749 | 1,137 | 3,621 | 6,507 |
| Cues played | 1,396 | 3,444 | 2,309 | 7,149 |
| Probes (no progress) | 2 | 0 | — | 2: both a wall, not trapped |
| Write-offs | 0 | 2 | 0 | 2 |

Three browsers shared two CPUs. Game time was 65–80% of wall time: menus, loading, and the 0.1 s frame cap under load. Every limit runs on the game's clock.

## 3 Findings

| ID | Severity | Finding | Status |
|---|---|---|---|
| QA-01 | Major | A blocked car honks every 1.4 s, without end | Fixed (row 623) |
| QA-02 | Major | Leaning on a stopped spent car: knock and touch-spent ~16 a second | Fixed: sound (row 624), sim (row 630) |
| QA-03 | Major | `car-notice` rings near-constantly in traffic | Fixed: silent (row 625) |
| QA-04 | Major | Barks: 30 a minute in a jam | Fixed: silent (row 625) |
| QA-05 | Info | Game-loop gaps of 1.5–3.2 s in play | Not reproduced alone: CPU load |
| QA-06 | Info | A district builds in 4.1 s behind the loading screen | Noted |

### QA-01 Never-ending honk

- **Seen:** pilot, saboteur: `honk.body` in 20 of 30 s. Run: 125 `honk.body` cues from saboteur.
- **Repro:** `node qa/repro.js block 1 75`. Stand 90 px ahead of a moving car on Waterfront B2. It stops and honks.
- **Before:** one car honked 14 times in 18 s, every 1.4 s, while the dummy stood.
- **Cause:** `game.js` `drawTag`. While `c.honkAt === 'body'`, the draw repeats the horn every 1.4 s. No count, no end.
- **Fix:** `audio.sfx.honkMaxPerCar` (2) counts both the sim's honk and the draw's repeat. Past 2, the car is silent. The "!" mark still flashes.
- **After:** 4 cars blocked; 2, 2, 2 and 1 honks; 12 more silenced.

### QA-02 Knock flood off a spent car

- **Seen:** saboteur: 769 `knock` and 658 `touch-spent` cues. Loop: 47 and 54 a minute; spam to 65 and 77.
- **Repro:** `node qa/repro.js lean 1 45`. Every car spent; the dummy walks into the nearest, again and again.
- **Before:** the sim emits a knock and a touch-spent about 16 times a second, per car leaned on.
- **Cause:** walking speed into a stopped car gives `impulseImpact` a knock (`un` > 0). The knock pushes the dummy off a few px. The held direction walks it back in. Each touch is a new contact episode.
- **Fix (sound):** `audio.sfx.spentRepeatMax` (2) per `audio.sfx.spentRepeatSeconds` (2), per cue, per spent car. A live car is not capped.
- **After:** one car: 4 reached the engine, 52 silenced. Pairs at most, 2 s apart.
- **Sim fix (row 630; D88 closed):** `proto.contactGraceSeconds` (0.3 s). A touch on the same car within it continues the contact. `qa/repro.js lean`, 40 s: 113 knocks and 145 touch-spent before; 5 and 10 after.
- **Spent tick:** `ui.spentTick` (1). A spent car carries a tick on its roof, upright, white edged in ink. The cue key's "Already hit you" row shows it. Screenshot: `qa/runs/2026-10-30-solo/spent_tick.png`.

### QA-03 car-notice

- **Seen:** all three personas: in 20 of 30 s. 1,615 cues; up to 77 a minute.
- **Cause:** each car rings once each time it notices the dummy (`perception.reactionDelay`). Busy screens have many cars.
- **Fix:** silent (`content/audio/picks_lawrence_5.json`). The headlamp flash still shows.

### QA-04 Barks

- **Seen:** saboteur in a Monument C2 jam: in 20 of 30 s, 30 a minute. 860 bark cues in all.
- **Fix:** `bark` and `bark.shout` silent. Supersedes row 614. The bubbles still show.

### QA-05 Game-loop gaps

- **Seen:** 14 places, 1.5–3.2 s, all three personas. Each browser had two thirds of a CPU.
- **Alone:** clipper, 4 min, three tiles crossed: no gap over 250 ms in play.
- **Verdict:** load, not a defect. The monitor now names a gap at a screen crossing.

### QA-06 District build

- **Alone:** 4.1 s, behind the loading screen. Three browsers: 13.7–23.8 s.

## 4 Clean

What was hunted and not found in 65.8 game minutes:

- **Collisions:** no dummy inside a solid, a raised solid, the hill or a car. No car inside a car. Nothing off the screen. No NaN.
- **Stuck:** never trapped (2 probes; both walls). No mode or phase past its limit. No car stopped 45 s with the dummy away. No menu lock (after the agent's own fix).
- **Sound:** no cue inside its cooldown. The voice cap was never hit. No synth fallback: 0 oscillators. Every sound went through the cue map.
- **Music:** no overlap, gap, stuck track or flapping. No audio engine errors.
- **Page:** no page errors, crashes or reloads. Resizes, blur, a hidden tab and mute spam broke nothing.

## 5 Limits

- **Reach:** the agents never won a run. All 11 ended Failed test; write-offs were rare (2). Licensed, Non-compliant and the grade steps went untested here (`test_p9.js` and the tour cover them).
- **Districts:** chaos stayed in Waterfront. Parkland had one persona.
- **Probes:** pushing into a wall usually slides the dummy, so the trapped probe fired twice. The inside-solid check still ran every 0.1 s.
- **Not covered:** Story mode, touch controls, gamepads, the tune panel (T), pad setup (G).
- **Load:** three browsers on two CPUs. Rerun on more cores for timing claims.

## 6 Rerun

- `qa/run_all.sh qa/runs/<stamp> 30`: the three personas.
- `python3 qa/report.py qa/runs/<stamp>`: deduped families → `<run>/findings.json`.
- `node qa/repro.js block|lean|notice|tick <district 0–2> <seconds>`: one situation alone.
- Evidence per persona: `findings.jsonl`, `heartbeat.jsonl` (every 30 s), `summary.json`, `shots/`.
