# Prototype 10.0-v2: does avoidance escalate? (Prototype 9)

- **Question (Lawrence, 2 November):** what is the escalating sophistication by which cars avoid you? The learning car should learn something new each time.
- **Method:** the aimed dash (`qa/policy.js` "read") repeated for 600 sim-seconds a run. Offsets [4, 40] s. `run.appearances.road` raised so the shift never runs out.
- **Variants:** `built` (Prototype 9 as shipped); `learningOn` (`proto.learningEnabled` 1, the dormant learning in `sim.js`).
- **Runs:** 16. Build unchanged. Tool: `node qa/escalation.js --out qa/baseline/p9_escalation.json`.

## 1 What Prototype 9 cars can learn

| Mechanism | IDs and values | On in Prototype 9 | Changes |
|---|---|---|---|
| Stop line | `proto.learn.standoffEnabled` 1 (sim.js only); `proto.learn.standoffStep` 35 (sim.js only) to `proto.learn.standoffMax` 190 (sim.js only) | Yes. Only after a hit on a stopped car | A number |
| Forward beam | `proto.learningEnabled` 0 (sim.js only); `learning.playerHitStep` 0.08 (sim.js only) to `learning.playerHitCap` 0.4 (sim.js only) | No | A number |
| Approach registry (Edits 25–26): six approaches | — | Not built | — |
| **New avoidance behaviours a car can learn** | — | **None** | — |

- One model per class (`this.models`): every sedan learns as one. A car keeps its values until it leaves.

## 2 Does the trick wear out? Hits per dash, by minute (mean of offsets)

| Sim | Variant | min 1 | min 2 | min 3 | min 4 | min 5 | min 6 | min 7 | min 8 | min 9 | min 10 | Decay (`qa.esc.decay`) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| arcade:monument | built | 0.94 | 1.06 | 0.89 | 1.05 | 0.93 | 0.91 | 1.02 | 1.02 | 0.84 | 1.12 | 0.98 |
| arcade:monument | learningOn | 0.94 | 0.94 | 0.93 | 0.84 | 0.47 | 0.45 | 0.50 | 0.50 | 0.50 | 0.46 | 0.51 |
| arcade:parkland | built | 0.50 | 0.67 | 0.65 | 0.76 | 0.72 | 0.61 | 0.54 | 0.66 | 0.54 | 0.74 | 1.1 |
| arcade:parkland | learningOn | 0.50 | 0.70 | 0.50 | 0.28 | 0.39 | 0.69 | 0.53 | 0.76 | 0.84 | 0.69 | 1.27 |
| arcade:waterfront | built | 0.70 | 0.64 | 0.82 | 0.64 | 0.69 | 0.61 | 0.67 | 0.69 | 0.33 | 0.28 | 0.46 |
| arcade:waterfront | learningOn | 0.64 | 0.79 | 0.80 | 0.77 | 0.42 | 0.39 | 0.42 | 0.39 | 0.39 | 0.30 | 0.47 |
| story:A3 | built | 0.89 | 0.39 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.0 |
| story:A3 | learningOn | 0.94 | 0.40 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.0 |

- Decay 1.0: the same dash works as well at the end as at the start. Below 1: the cars caught up.

## 3 Learning events (`qa.esc.learnEvents`)

| Sim | Variant | Events | Stop line | Forward beam | Models at end |
|---|---|---|---|---|---|
| arcade:monument | built | 7.0 a run | 14 | 0 | VAN-02 beam 0, stop 190, POL-03 beam 0, stop 85 |
| arcade:monument | learningOn | 26.0 a run | 12 | 40 | SEDAN-01 beam 5, stop 155, VAN-02 beam 5, stop 85, HAT-03 beam 5, stop 85, POL-03 beam 5, stop 50 |
| arcade:parkland | built | 10.0 a run | 20 | 0 | SEDAN-01 beam 0, stop 190, VAN-02 beam 0, stop 120, HAT-03 beam 0, stop 155, POL-03 beam 0, stop 120 |
| arcade:parkland | learningOn | 29.5 a run | 22 | 37 | SEDAN-01 beam 5, stop 190, VAN-02 beam 5, stop 190, HAT-03 beam 5, stop 120, POL-03 beam 5, stop 85 |
| arcade:waterfront | built | 15.0 a run | 30 | 0 | SEDAN-01 beam 0, stop 190, VAN-02 beam 0, stop 190, HAT-03 beam 0, stop 190, POL-03 beam 0, stop 190 |
| arcade:waterfront | learningOn | 35.5 a run | 31 | 40 | SEDAN-01 beam 5, stop 190, VAN-02 beam 5, stop 190, HAT-03 beam 5, stop 190, POL-03 beam 5, stop 155 |
| story:A3 | built | 3.0 a run | 6 | 0 | SEDAN-01 beam 0, stop 85, HAT-03 beam 0, stop 85, POL-03 beam 0, stop 85 |
| story:A3 | learningOn | 20.0 a run | 6 | 34 | SEDAN-01 beam 5, stop 85, VAN-02 beam 5, stop 50, HAT-03 beam 3, stop 85, POL-03 beam 2, stop 85 |

- Every learning event changes a number. None adds a behaviour.

## 4 Do trained cars resist? Hits per dash by the target's training (learningOn)

| Beam steps learned (`learning.playerHitStep` each) | Dashes aimed | Hits | Hits per dash |
|---|---|---|---|
| 0 | 128 | 97 | 0.76 |
| 1 | 33 | 21 | 0.64 |
| 2 | 50 | 28 | 0.56 |
| 3 | 58 | 28 | 0.48 |
| 4 | 55 | 31 | 0.56 |
| 5 | 1441 | 600 | 0.42 |

- Hits are matched to the car hit; dashes to the car aimed at. Approximate.

## 5 Something new each time? (`qa.esc.newBehaviours`)

| Sim | Variant | Responses seen | First learning event (s) | New after it |
|---|---|---|---|---|
| arcade:monument | built | commit:brake, state:caution, state:intention, unstick | 240.8 | unstick |
| arcade:monument | learningOn | commit:brake, commit:shift, honk, state:caution, state:intention | 0.8 | commit:brake, commit:shift, honk, state:intention |
| arcade:parkland | built | commit:brake, commit:shift, state:caution, state:intention | 4.6 | commit:shift |
| arcade:parkland | learningOn | commit:brake, commit:shift, honk, state:caution, state:intention, unstick | 0.2 | commit:brake, commit:shift, honk, state:intention, unstick |
| arcade:waterfront | built | commit:brake, commit:reverse, commit:shift, honk, state:caution, state:intention, unstick | 4.9 | commit:reverse, commit:shift, honk, unstick |
| arcade:waterfront | learningOn | commit:brake, commit:reverse, commit:shift, honk, state:caution, state:intention, unstick | 0.2 | commit:brake, commit:reverse, commit:shift, honk, state:intention, unstick |
| story:A3 | built | commit:brake, honk, state:caution, state:intention, unstick | 15.6 | honk, unstick |
| story:A3 | learningOn | commit:brake, honk, state:caution, state:intention, unstick | 1.1 | commit:brake, honk, unstick |

- A response "new after it" first appeared after a learning event. Responses come from the fixed driver (v1 §5.3), so a late first sighting is chance, not learning.

## 6 Why dashes stopped landing: stalemates and the floor

A window with dashes but no damaging hit is classed by its dashes:
- **Stalemate:** 80% or more aimed at one car that is never hit. Its stop line beyond `movement.lungeDistance` puts it out of dash reach (DB4a); a shorter line points to another block.
- **Story floor:** in Story, a hit off the brief at the floor deals no damage (`story.floorHold`, row 620).

| Sim | Variant | Offset | Dry windows (min) | Class | Car | Its stop line |
|---|---|---|---|---|---|---|
| arcade:monument | learningOn | +40 | 5, 6, 7, 8, 9, 10 | Stalemate | HAT-03 | 85 (lunge 164) |
| arcade:waterfront | built | +40 | 10 | Stalemate | SEDAN-01 | 190 (lunge 164) |
| arcade:waterfront | learningOn | +4 | 6, 7, 8, 9, 10 | Stalemate | SEDAN-01 | 190 (lunge 164) |
| story:A3 | built | +4 | 3, 4, 5, 6, 7, 8, 9, 10 | Story floor | — | — |
| story:A3 | built | +40 | 3, 4, 5, 6, 7, 8, 9, 10 | Story floor | — | — |
| story:A3 | learningOn | +4 | 3, 4, 5, 6, 7, 8, 9, 10 | Story floor | — | — |
| story:A3 | learningOn | +40 | 3, 4, 5, 6, 7, 8, 9, 10 | Story floor | — | — |

