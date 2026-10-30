# DUMMIES — GDD Edit 99: Prototype 8.4. Cones, car lights, the cue key, the bottom edge

**29 October 2026 · Lawrence Lek** · Amends GDD Edit 37 §4.2.2 (car cues), Edit 43 (car lights), Edit 71 (cone drones) and Edit 98. Builds: `prototypes/p8/dummies_p8_4.html`. Prototypes 8 to 8.3 stay frozen. No text change: the lore layer is 8.3's.

## 0 Request and readings

- **Request (user, 29 October, errors from play):**
  - "cars do not divert around cones, they just wait there until the drone comes and takes away the cone. so the map with 'HANDS 1' doesn't work."
  - "the rays of headlights also bend with the streets instead of going straight ahead (for curved roads)."
  - "combos is fun, though."
  - "there are too many CUE KEYS for the cars."
  - "when you have hit a car once already, the car should clearly not be available, perhaps the outline can turn from blue to grey."
  - "'Slowing past you' and 'Slowing' aren't very different. Braking for safety should also have brake lights on. 'Has noticed you' should have flashing headlights."
  - "there's this weird ghosting rendering artefact when cars come from the bottom of the screen."
- **Causes found:**
  - Cones: a car stopped close to a cone planned a full 120-unit swerve (proto.swerveLength). It found none clear, held, honked, and called the drone.
  - Cones: P6's player values never reached the screens' traffic sims. Each kept P6's own.
  - Beams: drawn along the route; the forward sensor is straight (proto.sensorStraight).
  - Ghosting: a lifted layer at the bottom edge copied its finished bottom row down by its lift, cars included. Streaks, then the x-ray checker on the car.
- **Readings flagged:**
  - "Has noticed you": the dummy in a car's caution zone for perception.reactionDelay. Was the intention chevron, about 0.3 s.
  - "Slowing past you" merges into "Slowing": brake lights only.
  - "Braking for safety" keeps its ring and gains brake lights at a standstill.
  - Spent: grey outline, body dimmed toward grey. The roof slash goes.
  - Cue key: 11 rows to 7. "Commitment ending" merges into "Route fixed" (the ring empties). "Where it can stop" goes with the stop bracket. "Cannot sense you" goes with the shadow outlines; the hatch gap stays. "No more points" becomes "Already hit you".
  - Combos: unchanged.

## 4.2.2 Car cues (amends Edit 37; ui.cueKey.simple)

```markdown
- **Has noticed you:** headlights flash (proto.art.noticeFlashHz). Lamps ahead of the bumper; the beam pulses.
- **Route fixed:** white ring on the roof. It empties as the route ends.
- **Slowing:** brake lights; red glow behind.
- **Braking for safety:** brake lights, held at a standstill (proto.art.brakeGlowStopped); warning ring.
- **Already hit you:** grey outline; body dimmed (proto.art.spentGrey). Tag inverted, as before.
- **Blocked, warning you:** "!" tag; hazards flash.
- **What you can see:** view-cone edges. Scanners and paths show inside it.
- **Removed:** chevron, triangle, roof slash, stop bracket (proto.stopCue 0), sensor-shadow outlines.
```

## 4.3 Car lights (amends Edit 43)

```markdown
- **Beams:** straight ahead from the nose for proto.art.beamLength (proto.art.beamStraight). Shadows unchanged.
- **Brake glow:** while braking; held at a standstill for safety or a planned stop.
```

## 6.4 Cones (amends Edit 71)

```markdown
- **Steering round:** a car below proto.driver.passSpeed at a cone pulls out steeply (proto.driver.coneSteepPass).
  - Pull-out length: clamp(1.1 × gap, 40, proto.swerveLength), as a pass round the dummy.
  - A stopped car steers round once the way is clear.
- **Drones:** only for a car blocked and honking (proto.droneConeSeconds 0). A cone a car can pass stays.
- **Bait:** a car steering round the cone into the dummy scores a hit the cone caused (Hands 1's goal).
- **Traffic values:** the player sim passes the drivers' values to every screen's traffic.
```

## 6 Build

- **Flags** (registry default 0; `build.py` sets 1): `proto.driver.coneSteepPass`, `proto.art.beamStraight`, `proto.art.brakeGlowStopped`, `proto.art.spentGrey`, `ui.cueKey.simple`, `ui.layerEdgeFix`.
- **Values:** `proto.art.noticeFlashHz` 4; `proto.droneConeSeconds` 0 (registry 5); `proto.stopCue` 0 (registry 1).
- **Bottom edge** (`ui.layerEdgeFix`): a lifted layer reaching the bottom row extends its surface by its lift first. Its cars draw into those rows.
- **Traffic values:** `world6.js` passes `proto.droneConeSeconds` and `proto.driver.coneSteepPass` to every screen's sims.
- **Test hook:** `window.__dummiesUI.carLook()`: each car's noticed, flash, spent, grey, brake state.

## Measured

- **Cones** (`test_p84.js`, headless; Monument and Waterfront; 11 cars):
  - The dummy puts a cone down in a lane and stands on it. A car stops. The dummy steps 48 units aside.
  - 8.4: 1 car steers round; 9 steer round into the dummy, a cone-caused hit; 1 waits for the drone.
  - 8.3's drivers: 4 round; 7 wait for the drone.
- **Lights:** a noticed car lit in about half of 10 samples at 4 Hz. Spent cars grey. Brake lights held at 0 speed.
- **Bottom edge:** Parkland B2's highway cars enter whole. No streaks, no checker.
- **`prototypes/p8/test_p84.js`:** 41 of 41. 315 strings on a 32-step tour. Farsight only on the Credits card. No page errors.
  - Prototypes 6.4 to 7.13 and 8 to 8.3 byte-identical to their commits.
- **Shared code:** `test_p713.js` 103 of 103; `p6/test_sim.js` 104 of 104; `p6/test_p610.js` 47 of 47.
  - `p6/test_p6.js` 72 of 73: Parkland's longest stop 8.8 s. The same on 8.3's code.

## Registry

- `edit99-2026-10-29`, 525 entries. Added (default 0): `proto.driver.coneSteepPass`, `proto.art.beamStraight`, `proto.art.noticeFlashHz`, `proto.art.brakeGlowStopped`, `proto.art.spentGrey`, `ui.cueKey.simple`, `ui.layerEdgeFix`.
- Set by Prototype 8.4, unchanged in the registry: `proto.droneConeSeconds` 0, `proto.stopCue` 0.

## Open

- **D84:** the scanner hatch and paths still draw inside the view cone. Keep, or show them only for cars that have noticed the dummy.
- **D83, D81, D82, D80** stand.
