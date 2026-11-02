# DUMMIES — GDD Edit 104: Prototype 10.4, the roof lidar

**2 November 2026 · Lawrence Lek** · The fourth of the nine escalating tests (handover v2 §14.2, §18). Localized: adds §10.4 to the Prototype 10 chapter; amends §10.2.1 (a spent car drives off).

- **Build:** `prototypes/p10/dummies_p10_4.html` (`python3 prototypes/p10/build.py`).
- **Playtest pages:** `index.html`, one per test. 10.1, 10.2 and 10.3 (md5 `5aed8e43…`) are frozen.
- **Tests:** `node prototypes/p10/test_p10.js --page` 28/28. Prototype 9 `test_p9.js --p84` 51/51; md5 `be163e7d014344e062965986b3da5786` on rebuild. 8.4 md5 `9f5549201d88891f9f0b22c461602909`. Sound freeze: 211 items, 0 changed.
- **Probes:** `node qa/testroad.js --stage 10.4 --out qa/baseline/p10_4.json`; report `qa/baseline/p10_4.md`, 12/12 checks.
- **Decision log:** rows 679–684; open D113.

## Request

> "Go" (Lawrence, 2 November, 13:19), on 10.4: rung 3, see height; it closes the plinth and the jump.

## Readings

| Reading | Basis | Status |
|---|---|---|
| 10.4 starts where 10.3 ends: rung 2, the dash and the jump fitted | One change a test (row 653) | Proposed (row 679) |
| Only a hit from above teaches rung 3 | A rung learns from a hit on what it then guards (§10.2.1) | Proposed (row 679) |
| Rung 3 is a roof lidar | v1 §14.2: lidar against vision; v2 §12: occupancy, "see height" | Proposed (row 680) |
| D110–D112 stand as built: it waits; cover stays open; the plinth needs a dash-jump | No answer yet; the defaults keep the ladder testable | Open |

## 10.4 The roof lidar

### 10.4.1 The lesson

- **Start:** rung 2 (`duel.startRung` 2). Battery 1 and Legs 1 fitted (`duel.dashArrives` 3, `duel.jumpArrives` 3). No new part.
- **Cause: a hit from above.** That is a jump's strike, or a dash launched from the plinth.
  - A dash or a strike from cover teaches nothing.
- **Beats:** as 10.2. The fitting shows "SENSOR FITTED · ROOF LIDAR": a puck on the roof, its sweep turning.
- **One lesson:** rung 2 to `duel.topRung` 3.

### 10.4.2 Rung 3: it sees height

- **Its beam and field now see** a dummy in the air and a dummy on the plinth.
- **It answers as on the ground:** it keeps the safe envelope, stops short and waits (§10.3.2).
- **The plinth no longer hides a dummy standing on it.**
- **Statics still hide a dummy behind them:** the building and the barrier.

### 10.4.3 A spent car drives off (amends §10.2.1)

- A car that has hit the dummy no longer stops for it. It drives off to its lesson.
- **Found by the 10.4 page check:** a dummy left in a spent car's field held it, so the lesson never began.
- Touches on a spent car do nothing, as before.

## Build

- `testroad.js`: rung 3 in the rungs table (high: true); `fromAbove`; the plinth no longer hides a dummy standing on it; spent cars do not stop.
- `game_p10.js`: the roof puck; the lidar's fitting beat.
- `build.py`: 10.4's stage; 10.3's page frozen.

## Measured (`qa/baseline/p10_4.md`)

**Rung 3 alone** (mode `trained`; 3 offsets × 300 s):

| Way in | Hits a minute | Damage a hit | Verdict |
|---|---|---|---|
| Down from the plinth | 0.07 | 104 | Closed: one hit in 15 minutes, a landing inside the notice window |
| The open kerb, the open flank, the late step-in, the corner, the lane | 0 | — | Closed |
| Through the barrier's gap | 2.21 | 52 | Open: cover |
| A jump from behind the barrier | 2.70 | 124 | Open: cover |
| Dashes from behind the barrier | 1.81–2.00 | 52–53 | Open: cover |

**The lesson** (mode `lesson`, 10 minutes):

- **Lessons:** in 6 of 6 runs with a jump's hit; in 0 of 12 runs with only hits from cover.
- **The plinth:** one hit, then none. Decay 0.
- **The gap:** 1–3 hits every minute. Decay 0.6.
- **The jump from behind the barrier:** 2–3 hits every minute, before and after the lesson.
  - It is a cover trick. The jump is only the strike (D113).

## Registry

- **No new IDs.** 647 entries. `registryVersion` unchanged (row 665).

## Open

- **Human pass (H3):** does the player see that it now stops for the plinth, and turn to cover?
- **D113:** a jump from behind cover teaches "see height", though cover let it land.
- **Next, 10.5:** cover is the last opening (row 683). The proposed rung 4 slows past what it cannot see.
