# Prototype 10.0-v3: side sensing and the flank (Prototype 9)

- **Question (Lawrence, 2 November):** the early side sensor may be missing. Is the flank too easy, or too hard, to approach?
- **Method:** `qa/flank.js`. Arcade, Endless; 3 districts × 4 variants × 2 bots × offsets [4, 40] s; 300 sim-seconds a run. 48 runs.
- **Bots:** `aim` dashes at the nearest car (10.0's read and lunge). `flank` comes alongside a moving car, 70 units off its side, and dashes into it.
- **Variants** are runtime values on every screen's traffic sim. Build unchanged.

- `built`: Prototype 9: driver's field `proto.driver.cautionZone` 180, slows to `proto.driver.cautionSpeed` 82.
- `rowFortyFive`: The row 45 reach: `proto.driver.cautionZone` 100.
- `blind`: No side awareness: `proto.driver.cautionZone` 0.
- `wary`: A stronger flank response: `proto.driver.cautionSpeed` 41 (half).

## 1 Results by variant (mean of districts and offsets)

| Variant | Bot | Dashes/min | Dashes that land | Hits/min | First hit (s) | Points/hit | Caution entries/min |
|---|---|---|---|---|---|---|---|
| built | aim | 21.5 | 0.63 | 16.2 | 0.4 | 269 | 63.9 |
| built | flank | 20.6 | 0.51 | 12.1 | 8.9 | 164 | 54.1 |
| rowFortyFive | aim | 24.2 | 0.63 | 17.2 | 1.5 | 314 | 61.8 |
| rowFortyFive | flank | 21.7 | 0.44 | 11.4 | 2.6 | 161 | 43.3 |
| blind | aim | 22.2 | 0.51 | 16.6 | 0.2 | 280 | 0.0 |
| blind | flank | 21.4 | 0.52 | 13.0 | 5.4 | 167 | 0.0 |
| wary | aim | 25.5 | 0.46 | 13.4 | 1.6 | 182 | 64.4 |
| wary | flank | 25.5 | 0.58 | 15.3 | 3.3 | 176 | 68.1 |

- "Dashes that land": share of dashes followed by a damaging hit within 0.6 s.
- Points a hit include write-off bonuses; compare across variants, not with 10.0.

## 2 Where the dummy stood when it dashed (flank bot)

| Variant | Front | Diagonal | Side | Rear |
|---|---|---|---|---|
| built | 8/9 (89%) | 40/45 (89%) | 266/524 (51%) | 13/22 (59%) |
| rowFortyFive | 13/18 (72%) | 41/46 (89%) | 238/541 (44%) | 12/29 (41%) |
| blind | 7/10 (70%) | 33/39 (85%) | 305/553 (55%) | 14/22 (64%) |
| wary | 20/25 (80%) | 34/47 (72%) | 345/630 (55%) | 14/40 (35%) |

- Sector: the angle from the car's heading to the dummy: front under 30°, diagonal 30–60°, side 60–120°, rear over 120°.

## 3 By district (flank bot, dashes that land)

| District | built | rowFortyFive | blind | wary |
|---|---|---|---|---|
| arcade:monument | 0.46 | 0.26 | 0.58 | 0.50 |
| arcade:parkland | 0.39 | 0.34 | 0.27 | 0.58 |
| arcade:waterfront | 0.67 | 0.73 | 0.70 | 0.67 |

## 4 How the hits landed (flank bot)

| Variant | Zones | Car state at impact |
|---|---|---|
| built | side 265, frontDiagonal 63, rearDiagonal 21, rear 1 | caution 258, cruise 58, expiring 18, committed 7, interrupted 6, intention 3 |
| rowFortyFive | side 251, frontDiagonal 65, rearDiagonal 16 | caution 252, cruise 43, expiring 21, committed 7, interrupted 6, intention 2, released 1 |
| blind | side 295, frontDiagonal 49, rearDiagonal 33, front 1 | cruise 351, expiring 13, committed 7, released 3, interrupted 2, intention 2 |
| wary | side 361, frontDiagonal 58, rearDiagonal 25 | caution 368, cruise 51, intention 8, committed 7, expiring 5, interrupted 5 |

