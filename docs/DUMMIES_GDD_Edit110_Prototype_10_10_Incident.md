# DUMMIES — GDD Edit 110: Prototype 10.10, the Incident

**7 November 2026 · Lawrence Lek** · The tenth escalating test (D121: the cost). Localized: adds §10.10 to the Prototype 10 chapter. Kojima's lesson: turn the enemy's own system against it.

- **Build:** `prototypes/p10/dummies_p10_10.html` (`python3 prototypes/p10/build.py`).
- **Frozen:** 10.1–10.9; 10.9 at md5 `213f9020…`.
- **Tests:** `node prototypes/p10/test_p10.js --page` 68/68. Sound freeze: 211 items, 0 changed.
- **Probes:** `node qa/testroad.js --stage 10.10 --out qa/baseline/p10_10.json`; report `qa/baseline/p10_10.md`, 13/17.
- **Decision log:** row 740. Open D131.

## Request

> "freeze 10.9 and move to 10.10" (Lawrence, 7 November), after the must-haves: tailgating white cars, the Incident, honks, the stamp.

## 10.10 The Incident

### 10.10.1 White cars tailgate

- **Close in:** they cruise at `traffic.whiteSpeedRatio` 1.12 of their cruise speed.
- **Tailgate:** they follow at `traffic.whiteTimeGap` 0.5 s (`traffic.timeGap` 1.2 for the red car).
- **Caught out:** while the red car just ahead in its lane stops for the dummy, a white car brakes no harder than `traffic.whiteBraking` 45. Any other stop, it brakes as it can.

### 10.10.2 The Incident

- **Make it stop hard.** The white car behind runs into the red car's back.
- **Scores** `scoring.incidentPoints` 250. Only a stop the dummy caused counts.
- **Both stand** `traffic.incidentSeconds` 2, at the bumper, then drive on.
- **Shown:** a red DUMMY CORP. REPORT stamp above the cars; the white car honks; the HUD counts INCIDENTS.
- **The red car learns nothing new.** Its rung-7 behaviour is the setup.

## Measured (`qa/baseline/p10_10.md`, rung 7, 5 minutes × 3)

- **Incidents:** 224 across all bots, about 0.6 a minute. Most come from any stop the dummy causes with a white car behind. The dedicated brake-check bot: 2 in 15 minutes.
- **Open ways in:** 12, as 10.9.
- **Fails, as 10.9:** 5 stalls; 8 long waits; peek 7; 2 remembered-spot hits.
- **Junction:** 10 minutes of traffic, no overlapping cars.

## Build

- `testroad.js`: `caughtOut`, `incidents`; the white time gap in `cornerSpeed`; white braking capped in `carAI`, `manSpeed` and `moveCars` while caught out; shaken cars stand.
- `game_p10.js`: the stamp, the HUD count, the white car's honk, the intro line.
- `qa/testroad.js`: bot `brakecheck`; incidents per run; stages ordered by number (10.10 after 10.9). `qa/testroad_report.py`: the same; the Incident check.

## Registry

- **Added (5):** `traffic.whiteTimeGap`, `traffic.whiteBraking`, `traffic.whiteSpeedRatio`, `scoring.incidentPoints`, `traffic.incidentSeconds` (all default 0: off).
- **703 entries.**

## Open

- **D131:** the Incident's worth and frequency. 250 a time, about 0.6 a minute: it can outscore strikes.
- **Human pass:** does the player try to cause Incidents? Does the stamp read?
