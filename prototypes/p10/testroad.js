// Prototype 10 (GDD Edits 101–102; handover v2 §14, §16): the Monument test road.
// One screen. Scenario A: two one-way roads cross at a junction, two lanes each. One car type, the sedan; the red car is the
// only car on the road, and it returns soon after it leaves (duel.redReturnSeconds).
// 10.1: rung 0, the red car learns nothing. 10.2: one lesson. A hit on its nose teaches rung 1, the forward camera.
// 10.3: from rung 1, a hit from the side teaches rung 2, the side sensors. Battery 1 from the start; Legs 1, the jump, arrives.
// 10.4: from rung 2, a hit from above teaches rung 3, the roof lidar: it sees height. Both parts from the start.
// 10.5: from rung 3, a hit out of cover teaches rung 4, the street cameras: it sees behind cover. Hands 1, the cones, arrive.
// 10.6: from rung 4, a hit while it swerves round a cone teaches rung 5: it stops at a cone and never swerves. DUCK arrives;
// low planter rows stand by the road. Sightlines run by height: a ducked dummy behind a planter is hidden.
// 10.7: from rung 5, a hit sprung from the spot of an earlier crash teaches rung 6, crash memory: it remembers where you
// struck from, and expects you there. Every crash leaves a chalk outline on the road. A shorter run-in; a lighter body.
// A car kept waiting for the dummy duel.blockSeconds calls FARSIGHT: a drone lifts the dummy to the side of the road.
// 10.8: from rung 6, a hit from cover by a dummy the car had seen just before teaches rung 7, the search: when it loses the
// dummy behind cover it leaves a ghost where it last saw it, slows to stop short of it, and finds a dummy still near it.
// After duel.searchSeconds it gives up and drives on.
// Extends the base Sim from prototypes/p6/sim.js. Shared files are untouched, so Prototype 9's build keeps its md5.
// Runs in the browser (window.DUMMIES) and in node (require), so the probes run headless without a page.
(function (root) {
  'use strict';
  const X = typeof module !== 'undefined' && module.exports ? require('../p6/sim.js') : root.DUMMIES;
  const hyp = Math.hypot, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function circleRect(px, py, r, s) { // as sim.js (not exported): the push-out of a circle from a rectangle
    const qx = clamp(px, s.x, s.x + s.w), qy = clamp(py, s.y, s.y + s.h), dx = px - qx, dy = py - qy, d = hyp(dx, dy);
    if (d >= r) return null;
    if (d > 1e-9) return { nx: dx / d, ny: dy / d, pen: r - d };
    const l = px - s.x, rt = s.x + s.w - px, t = py - s.y, bt = s.y + s.h - py, m = Math.min(l, rt, t, bt);
    return m === l ? { nx: -1, ny: 0, pen: l + r } : m === rt ? { nx: 1, ny: 0, pen: rt + r } : m === t ? { nx: 0, ny: -1, pen: t + r } : { nx: 0, ny: 1, pen: bt + r };
  }

  // ---------- Scenario A: the Monument junction (field 800 × 640, ui.playWidth × ui.playHeight)
  // Road A runs west to east along y = ROAD_A; road B runs north to south along x = ROAD_B. Each is one-way, two lanes.
  // Each lane starts runIn before the screen's edge and ends world.spawnLeadIn past the far edge. 10.1: runIn is
  // world.spawnLeadIn. From 10.2 (row 670): at least the forward beam plus a car length, so a car sees a dummy at the screen's
  // edge before it could need to stop for it. It never appears already too close.
  // 10.7 (row 703; D117): duel.runInLength sets a shorter run-in. The car then appears at the speed its envelope allows
  // for a dummy it already senses (spawnSpeed), so it still never appears too close.
  const ROAD_A = 320, ROAD_B = 400;
  const runInFor = (P) => P['duel.runInLength'] > 0 ? P['duel.runInLength'] : Math.max(P['world.spawnLeadIn'], Math.ceil(P['perception.forwardLength'] + P['vehicles.sedan.length']));
  function junctionLevel(P) {
    const half = P['world.laneWidth'] / 2, R = runInFor(P), out = P['world.spawnLeadIn'];
    const a = [[-R, ROAD_A], [P['world.width'] + out, ROAD_A]], b = [[ROAD_B, -R], [ROAD_B, P['world.height'] + out]];
    const lane = (c, off) => X.makePath(X.offsetPts(c, off));
    const two = (P['duel.twoWay'] || 0) > 0, aR = [[P['world.width'] + R, ROAD_A], [-R, ROAD_A]], bR = [[ROAD_B, P['world.height'] + R], [ROAD_B, -R]];
    // 10.9 (row 734): two two-way roads, traffic on the left (London). Each lane keeps its place: 0 road A westbound (south
    // lane), 1 eastbound (north lane), 2 road B northbound (west lane), 3 southbound (east lane). 10.1–10.8: all one-way.
    const lanes = two ? [lane(aR, -half), lane(a, -half), lane(bR, -half), lane(b, -half)] : [lane(a, half), lane(a, -half), lane(b, half), lane(b, -half)]; // A near, A far, B near, B far
    const W = P['world.laneWidth']; // road A spans ROAD_A ± W; road B spans ROAD_B ± W
    lanes.forEach((p, i) => {
      p.road = i < 2 ? 'A' : 'B'; p.enterS = R; // where the lane meets the screen's edge
      // 10.2 (row 670): the road's kerbs, as lateral offsets from this lane's centre. They bound every swerve and pass.
      const e = p.road === 'A' ? [[300, ROAD_A - W], [300, ROAD_A + W]] : [[ROAD_B - W, 300], [ROAD_B + W, 300]];
      const lat = e.map(([x, y]) => X.pathProject(p, x, y).lat);
      p.edges = [Math.min(...lat), Math.max(...lat)];
      if (two) { p.dir = i % 2 ? 1 : -1; p.twoWay = true; }
    });
    if (two) { // row 734: the junction box; road B gives way to road A (proto.driver ranks: A 0, B 1)
      const Wl = P['world.laneWidth'], box = { x0: ROAD_B - Wl, x1: ROAD_B + Wl, y0: ROAD_A - Wl, y1: ROAD_A + Wl };
      const span = (p) => { const q0 = p.pts[0], q1 = p.pts[p.pts.length - 1], ax = p.road === 'A', v0 = ax ? q0[0] : q0[1], dir = Math.sign((ax ? q1[0] : q1[1]) - v0), lo = ax ? box.x0 : box.y0, hi = ax ? box.x1 : box.y1; return dir > 0 ? [lo - v0, hi - v0] : [v0 - hi, v0 - lo]; };
      lanes.forEach((p, i) => { p.box = span(p); });
      // row 735: no give-way line to crawl to; TestRoadSim.junctionCap decides (road B gives way by time; anyone yields to a car in the box)
    }
    const statics = [
      // NW: the monument's plinth, a raised edge to jump from (height ≤ world.jumpableHeight)
      { x: 230, y: 150, w: 90, h: 90, kind: 'block', height: P['world.jumpableHeight'], plinth: true },
      // NE: a building on the corner. It hides road A's approach from road B's cars, and road B's from road A's: the blind corner
      { x: 488, y: 40, w: 200, h: 180, kind: 'block', height: 110 },
      // SW: a barrier along road A's south kerb, with a gap to step through
      { x: 40, y: ROAD_A + W + 12, w: 120, h: 8, kind: 'jersey' }, { x: 216, y: ROAD_A + W + 12, w: 120, h: 8, kind: 'jersey' },
    ];
    // 10.6 (row 696): three low planter rows (duel.planters), five planters a row (world.gardenPlanter wide). Low cover: it hides
    // only a dummy below props.planter.height on a sightline that passes it (lowBlocked). Each row runs back up the road its
    // cars come down, so it hides a ducked dummy from them while they are still far off.
    if (P['duel.planters'] > 0) {
      const ph = P['props.planter.height'], pw = P['world.gardenPlanter'], d = 16;
      statics.push({ x: 216 - 5 * pw, y: ROAD_A - W - 48, w: 5 * pw, h: d, kind: 'planter', low: true, height: ph }, // north of road A, west
        { x: 470, y: ROAD_A + W + 16, w: 150, h: d, kind: 'planter', low: true, height: ph },                          // south of road A, east
        { x: ROAD_B + W + 16, y: ROAD_A + W + 6, w: d, h: 5 * pw, kind: 'planter', low: true, height: ph });            // east of road B, south
    }
    statics.forEach((s, i) => Object.assign(s, { id: 's' + i }));
    return {
      id: 'junction', key: 'junction', name: 'Monument junction', blurb: 'Two one-way roads cross. One red car learns from you.',
      center: a, centers: [a, b], roads: [{ id: 'A', axis: 'x', at: ROAD_A, half: W }, { id: 'B', axis: 'y', at: ROAD_B, half: W }],
      lanes, statics, coneHomes: [[300, 470], [560, 470], [600, 242]], runIn: R,
      spawns: [{ x: 600, y: 520, f: -90 }, { x: 200, y: 520, f: -90 }, { x: 640, y: 120, f: 90 }],
      crossings: [{ road: 'A', x: 620 }], // a zebra on road A, east of the junction (drawn; cars do not stop for it yet)
      barrierGap: { x: 160, y: ROAD_A + W + 12, w: 56 }, canal: true, gates: {}, theme: 'start', patches: [],
      // rung 4's street cameras (drawn): the barrier's two ends, the building's corner. Each aims (degrees, 0 east, 90 south) along
      // the cover it was put up for: perception.streetCameraFov sets its cone (row 723). The fourth value is its pan's phase, a
      // fraction of the cycle (row 724): the barrier's two ends sweep as mirror images, so both look away at once.
      cameras: [[24, ROAD_A + W + 4, 30, 0], [352, ROAD_A + W + 4, 150, 0.5], [476, 228, 20, 0.25]],
    };
  }

  // ---------- The red car's rungs (handover v2 §12, §14.2; v1 PT4). A lesson teaches the next rung, up to duel.topRung.
  // A rung learns from a hit on the part of the car it then guards.
  // Rung 1, the forward camera (v1 PT4, L2): the forward beam (perception.forwardLength) sees the dummy in its lane. The car
  // keeps the safe envelope from it (envelope, below) and stops hard if it comes at the car. No side field
  // (proto.driver.cautionZone) until rung 2.
  // Rung 2, the side sensors (v1 PT4, L3 "surround"; handover v2 §13): the driver's field, proto.driver.cautionZone either
  // side of its path, perception.forwardLength ahead. It only ever slowed a car (row 660). Now it is the zone that acts
  // (D103): weaker than the front, it notices a dummy there after perception.sideNoticeSeconds. Then it keeps the safe
  // envelope from it as from a dummy ahead: it stops short, and waits while the dummy stays in its field. It no longer
  // passes a dummy in its lane. Every hit at rung 1 came from the side, so any hit but a bump on its tail teaches it.
  // Its sensors see the ground: a dummy in the air, or up on the plinth, is unseen until rung 3. So is one behind a static.
  // Rung 3, the roof lidar (v1 PT4 tier 3; handover v2 §12: "see height"; v1 §14.2: lidar and the occupancy network): its
  // beam and field now see a dummy in the air or up on the plinth. It answers it as it answers one on the ground. Only a
  // hit where height hid the dummy teaches it (high; row 685): a jump or a dash from the plinth, by a dummy in its sight
  // for the whole training clip. A strike out of cover, a jump included, teaches nothing it can use.
  // Rung 4, the street cameras (Shenzhen's vehicle-road-cloud pilot: roadside sensors share what they see with cars): the
  // junction's cameras see behind the barrier and the building, and the car sees what they see. A dummy behind cover is
  // answered as one in the open: the safe envelope, a stop short, a wait. Only a hit where cover hid the dummy teaches it
  // (cover): the training clip shows the dummy coming out of cover. Its swerve round a cone is held until it has passed the
  // cone: meanwhile it does not stop for a dummy in its field (rungs 2–4). That is the opening the cones make.
  // Rung 5, road items (handover v2 §14.2; robotaxis stopped by a cone on the bonnet, 2023): it stops short of a cone in its
  // lane and never swerves round it. It waits while FARSIGHT fetches the cone. Only a hit while it swerved round a cone
  // teaches it (items): the training clip shows the swerve. Its part is DUCK (rows 694–696).
  // Rung 6, crash memory (handover v2 §14.2: it counters your habit; §4.3: Metal Gear Solid V's Revenge, Alien: Isolation):
  // it remembers the spot each crash was sprung from, if cover hid the dummy there (crashes; duel.memorySites, the latest;
  // 0 all). A hit from the open was the player's skill: it leaves an outline, not a memory (row 713). A dummy within
  // duel.memoryRadius of a remembered spot is expected: cover does not hide it and the field notices it at once. Only a hit
  // sprung from cover at the spot of an earlier such crash teaches it (habit). New spots still work, once each. No part.
  // Rung 7, the search (systems document §9.2, row 716; Splinter Cell: Conviction's last known position, Mark of the Ninja's
  // partial sighting): when the car loses a dummy it had in sight behind cover, it keeps a ghost where it last saw it. It
  // slows to stop short of the ghost, as for a dummy there, and a dummy within duel.searchRadius of it is found: cover does
  // not hide it, and the field notices it at once. After duel.searchSeconds it gives up and drives on. Only a hit from cover
  // by a dummy the car had in sight within the training clip teaches it (search). The opening it leaves: get into hiding
  // before the car sees you, or crawl away from the ghost before it gets there. No part.
  // Each rung brings the dummy a part by drone (part, partKey): when that value is 1, as the lesson ends; 2, the first
  // time the car uses the new rung against the dummy (trigger); 3, fitted from the start.
  const RUNGS = [
    { rung: 0, name: 'Prototype', sensor: null, learnsFrom: [] },
    { rung: 1, name: 'Forward camera', sensor: 'FORWARD CAMERA', learnsFrom: ['front', 'frontDiagonal'], part: 'battery1', partKey: 'duel.dashArrives', trigger: 'first-brake' },
    { rung: 2, name: 'Side sensors', sensor: 'SIDE SENSORS', learnsFrom: ['front', 'frontDiagonal', 'side', 'rearDiagonal'], part: 'legs1', partKey: 'duel.jumpArrives', trigger: 'first-side' },
    { rung: 3, name: 'Roof lidar', sensor: 'ROOF LIDAR', learnsFrom: ['front', 'frontDiagonal', 'side', 'rearDiagonal'], high: true },
    { rung: 4, name: 'Street cameras', sensor: 'STREET CAMERAS', fit: 'LINK', learnsFrom: ['front', 'frontDiagonal', 'side', 'rearDiagonal'], cover: true, part: 'hands1', partKey: 'duel.conesArrives', trigger: 'first-cover' },
    { rung: 5, name: 'Road items', sensor: 'ROAD ITEMS', fit: 'UPDATE', learnsFrom: ['front', 'frontDiagonal', 'side', 'rearDiagonal'], items: true, part: 'duck1', partKey: 'duel.duckArrives', trigger: 'first-item' },
    { rung: 6, name: 'Crash memory', sensor: 'YOUR HABIT', fit: 'MEMORY', learnsFrom: ['front', 'frontDiagonal', 'side', 'rearDiagonal'], habit: true },
    { rung: 7, name: 'Search', sensor: 'LAST SEEN', fit: 'SEARCH', learnsFrom: ['front', 'frontDiagonal', 'side', 'rearDiagonal'], search: true },
  ];

  // ---------- The test road: one red sedan, alone on the road
  class TestRoadSim extends X.Sim {
    constructor(overrides, carry) {
      super('straight', overrides, carry); // the base road sim, then the junction replaces its level
      this.levelId = 'junction'; this.testRoad = true;
      this.district = null; // one screen: no screens to flip to
      this.level = junctionLevel(this.P);
      this.reset();
    }
    checkFlip() { // the screen's edge holds the dummy
      if (!this.testRoad) return super.checkFlip();
      const b = this.body, P = this.P;
      if (!b || !b.alive) return;
      b.x = Math.max(0, Math.min(P['world.width'], b.x)); b.y = Math.max(0, Math.min(P['world.height'], b.y));
    }
    reset() {
      super.reset();
      if (!this.testRoad) return;
      const P = this.P, n = this.level.lanes.length, g = (i, o) => ((i * 0.6180339887 + o) % 1);
      // One car type: every appearance is a sedan. Its lane rotates over the four by the golden ratio, so both roads recur.
      const redLanes = this.level.lanes.map((l, i) => i).filter((i) => !this.level.lanes[i].twoWay || this.level.lanes[i].dir > 0); // row 734: on two-way roads the red car keeps its directions: road A eastbound, road B southbound
      this.schedule = Array.from({ length: P['run.appearances.road'] }, (_, i) => ({ i, cls: 'sedan', lane: redLanes[Math.floor(g(i, 0.31) * redLanes.length)], mult: 1 }));
      this.whiteAt = null; this.whiteSeq = 0;
      this.leftAt = 0; // when the red car last left the screen
      this.rung = Math.max(0, Math.min(RUNGS.length - 1, Math.round(P['duel.startRung'] || 0))); // the red car's rung
      this.lesson = null; this.lessons = []; this.delivery = null; this.firstBrakeT = null; this.firstSideT = null; this.firstCoverT = null; this.firstItemT = null;
      this.crashes = []; this.spring = null; // every damaging hit: where it struck, the spot it was sprung from (row 703); the last dash or jump's start
      this.stealth = { points: 0, unseen: 0, lost: 0, seen: 0, last: null }; // row 725: the strikes' stealth grades and their points
      this.lift = null; this.blockT = 0; // the block lift (row 715): the drone that moves a blocking dummy; how long the car has waited for it
      let fitted = false; // parts fitted from the start (partKey 3)
      for (const r of RUNGS) if (r.part && Math.round(P[r.partKey] || 0) === 3) { this.run.owned[r.part] = true; fitted = true; }
      if (fitted && this.body) this.body.health = this.maxHealth();
    }
    airborne() { const b = this.body; return !!(b && b.mode === 'jump' && b.jump); } // rungs 0–2 see the ground only
    rungInfo(n) { return RUNGS[n == null ? this.rung : n] || null; }

    // ----- rung 1: the safe envelope (Mobileye RSS, handover v2 §4.2). The gap a dummy needs to dash into the car's nose if it
    // ran at the car (movement.runSpeed) while the car reacted (perception.reactionDelay) and stopped (traffic.hardBraking).
    // The car never lets a dummy ahead inside it. At a standstill it is dash reach plus a reaction's run: its stop line.
    envelope(v) {
      const P = this.P, h = P['traffic.hardBraking'], R = P['movement.runSpeed'], tau = P['perception.reactionDelay'];
      return tau * (v + R) + v * v / (2 * h) + R * v / h + P['movement.lungeDistance'] + P['body.radius'];
    }
    envSpeed(g) { // the fastest the car may go with a dummy g ahead of its nose: envelope(v) = g
      const P = this.P, h = P['traffic.hardBraking'], R = P['movement.runSpeed'], tau = P['perception.reactionDelay'];
      const B = tau + R / h, C = tau * R + P['movement.lungeDistance'] + P['body.radius'] - g;
      return C >= 0 ? 0 : h * (-B + Math.sqrt(B * B - 2 * C / h));
    }
    // Rung 1's brake for a dummy in its lane ahead. Still: slow from the moment it sees it, never faster than the envelope
    // allows, to a stop at the envelope's edge. Coming at the car: a hard stop now. Late, from the side: the brake cannot
    // undo the physics, so the hit lands at a lower speed. That is the opening.
    // The kerbs bound every swerve and pass (row 670). The base driver reaches one lane width to one side and
    // proto.swerveOuter to the other: a district road's hard shoulder. Here both bounds are the road's kerbs.
    choose(c, tg, opts) {
      if (!this.testRoad || !c.path.edges) return super.choose(c, tg, opts);
      if (c.white) { const P = this.P, margin = 12 + (tg.r || P['body.radius']), dist = Math.max(1, (tg.lx || 0) - margin), a = Math.min(c.v * c.v / (2 * dist) > P['traffic.comfortBraking'] ? P['traffic.hardBraking'] : P['traffic.comfortBraking'], (P['traffic.whiteBraking'] || 0) > 0 ? P['traffic.whiteBraking'] : Infinity); return { type: 'brake', v0: c.v, a, vTarget: 0, sStop: tg.s - c.L / 2 - margin }; } // row 734: it brakes, never swerves; row 740: no harder than traffic.whiteBraking
      if (tg.kind === 'cone' && this.rung >= 5) { // rung 5 never swerves round a cone: it stops short and waits (the base driver's stop)
        const P = this.P, margin = 12 + tg.r, dist = Math.max(1, tg.lx - margin);
        const a = c.v * c.v / (2 * dist) > P['traffic.comfortBraking'] ? P['traffic.hardBraking'] : P['traffic.comfortBraking'];
        return { type: 'brake', v0: c.v, a, vTarget: 0, sStop: tg.s - c.L / 2 - margin };
      }
      if (tg.kind === 'body' && opts && opts.pass && !this.choosePass()) return { type: 'brake', v0: 0, a: this.P['traffic.comfortBraking'], vTarget: 0, sStop: c.s, standoff: true }; // rung 2 waits
      if (tg.kind === 'body' && !(opts && opts.pass) && this.rung >= 1 && c.v >= 1) {
        const b = this.body, q = X.pathAt(c.path, tg.s), vb = -(b.vx * q.tx + b.vy * q.ty), hard = this.P['traffic.hardBraking'];
        if (vb > 1) return { type: 'brake', v0: c.v, a: hard, vTarget: 0, emergency: true, closing: +vb.toFixed(1) };
        return { type: 'brake', v0: c.v, a: hard, vTarget: 0, standoff: true, env: true, sBody: tg.s };
      }
      const P = this.P, kl = P['world.laneWidth'], ko = P['proto.swerveOuter'], [lo, hi] = c.path.edges;
      P['world.laneWidth'] = -(lo + c.W / 2); P['proto.swerveOuter'] = hi - c.W / 2;
      try { return super.choose(c, tg, opts); } finally { P['world.laneWidth'] = kl; P['proto.swerveOuter'] = ko; }
    }
    assessBody(c) {
      if (!this.testRoad) return super.assessBody(c);
      if (c.spent) return null; // the car that hit you drives off to its lesson: it no longer stops for you (row 681)
      if (this.body && this.body.lifted) return null; // FARSIGHT has the dummy (row 715)
      if (c.white) { const P = this.P, keep = P['proto.driver.cautionZone']; P['proto.driver.cautionZone'] = 0; let hz; try { hz = super.assessBody(c); } finally { P['proto.driver.cautionZone'] = keep; } return hz && hz.inPath ? hz : null; } // row 734: a white car never learns: its path only
      if (this.rung < 3 && (this.airborne() || this.body.raised)) return null; // it sees the ground: not the air, not the plinth's top
      const P = this.P, keep = P['proto.driver.cautionZone'];
      P['proto.driver.cautionZone'] = this.fieldFor();
      let hz; try { hz = super.assessBody(c); } finally { P['proto.driver.cautionZone'] = keep; }
      if (!hz || !this.coned()) return hz;
      if (hz.inPath) { c.coneT = this.t; return hz; }
      const k = this.coneOf(c, this.body.x, this.body.y); if (k) c.coneT = this.t; // row 733: when it last had the dummy in a cone or its path
      if (k && k.cone === 'forward') { hz.cone = k.cone; hz.dist = k.d; hz.R = k.R; return hz; }
      const T = P['perception.trackSeconds'] || 0, held = c.noticed && (!(T > 0) || (c.coneT != null && this.t - c.coneT <= T + 1e-9)); // row 733: a noticed dummy out of its cones is kept perception.trackSeconds, then forgotten
      const how = hz.gapLat > keep ? null : held && !k ? 'track' : this.rung >= 4 && this.cameraSees() ? 'link' : this.expected() ? 'memory' : null; // row 731: inside the rung's rectangle, noticed, it tracks the dummy; a street camera or its memory tells it where the dummy is, at full sensitivity, past or inside its duller side cones
      const b = this.body; if (how) { if (how === 'track') hz.trackLeft = T > 0 ? Math.max(0, T - (this.t - c.coneT)) : null; const ox = this.propField() ? 0 : c.L / 2; hz.cone = how; hz.dist = Math.hypot(b.x - c.x - Math.cos(c.h) * ox, b.y - c.y - Math.sin(c.h) * ox); return hz; }
      if (k) { hz.cone = k.cone; hz.dist = k.d; hz.R = k.R; return hz; }
      return null; // outside its three cones, unnoticed, untold: it does not sense the dummy
    }
    // Row 731: the field as three cones, not a rectangle. A forward cone from the nose, perception.forwardConeAngle either side of
    // its heading, out to perception.forwardLength. Two side cones, also from the nose (row 733), about perception.sideConeAxis
    // either side of its heading, perception.sideConeAngle wide each way, from the forward cone's edge, out to
    // perception.sideConeRange. Each has a sensitivity
    // (perception.forwardConeSensitivity, perception.sideConeSensitivity): it scales the stage ranges (a dummy must come closer
    // to a duller cone for each stage) and how fast the notice meter fills. Each stage's speed stays the same. The beam (the
    // lane ahead) is unchanged. The cones are the car's own sensors. Inside the rung's rectangle (proto.driver.cautionZone)
    // it still has the dummy past them when it has noticed it (it tracks what it detected), when a street camera sees it (the
    // link, rung 4), or when it stands where the car remembers (rung 6). 0 for perception.forwardConeAngle: the rectangle.
    coned() { return (this.P['perception.forwardConeAngle'] || 0) > 0 && this.rung >= 2; }
    coneOf(c, px, py) { // row 733: all three from the nose; the side cones begin where the forward cone ends, so none overlaps
      const P = this.P, ca = Math.cos(c.h), sa = Math.sin(c.h), br = P['body.radius'], prop = this.propField(), ox = prop ? 0 : c.L / 2, dx = px - (c.x + ca * ox), dy = py - (c.y + sa * ox), fx = dx * ca + dy * sa, fy = -dx * sa + dy * ca; // row 735: proportional, from the car's middle
      const d = Math.hypot(fx, fy), a = Math.atan2(fy, fx) * 180 / Math.PI, A = P['perception.forwardConeAngle'], look = this.coneLook(c), R = prop ? this.coneReach() : null;
      if (prop) { const k = this.cornerApex(c), gx = fx - k, ga = Math.atan2(fy, gx) * 180 / Math.PI, gd = Math.hypot(gx, fy), off = -k; // row 736: the forward cone's edges run through the front corners; its centre lies behind, where they meet. Row 737: its rings at x, 2x, 3x from the car's middle
        if (Math.abs(ga - look) <= A && d <= R.f + br) return { cone: 'forward', d, R: R.f }; } // row 738: its reach and rings about the car's middle, like the side cones: one set of circles
      else if (Math.abs(a - look) <= A && d <= c.fwdLen + br) return { cone: 'forward', d, R: null };
      const e = this.sideEdges(), aa = Math.abs(a); if (aa > e[0] && aa <= e[1] && d <= (prop ? R.s : P['perception.sideConeRange']) + br) return { cone: 'side', d, R: prop ? R.s : null };
      return null;
    }
    // Row 735: the proportional field. One radius sets it all: the forward cone reaches perception.coneRadius from the car's
    // middle, the side cones perception.sideConeRatio of it. Rings split each into equal grades: perception.forwardGrades (3:
    // AWARE, SLOWING, CRAWLING) and perception.sideGrades (2: AWARE, SLOWING). The radius grows as the car learns: by
    // perception.coneGrowthPerMemory for each crash spot it remembers, up to perception.coneGrowthMax.
    cornerApex(c) { return c.L / 2 - (c.W / 2) / Math.tan(Math.max(1, this.P['perception.forwardConeAngle']) * Math.PI / 180); } // row 736: along the heading from the car's middle (negative: behind it)
    propField() { return (this.P['perception.coneRadius'] || 0) > 0 && this.coned(); }
    coneReach() { const P = this.P, g = 1 + Math.min(P['perception.coneGrowthMax'] || 0, (P['perception.coneGrowthPerMemory'] || 0) * this.memory().length), f = P['perception.coneRadius'] * g; return { f, s: f * P['perception.sideConeRatio'], g }; }
    gradeStage(cone, d, R) { const G = Math.max(1, Math.round(this.P[cone === 'side' ? 'perception.sideGrades' : 'perception.forwardGrades'])), band = clamp(Math.ceil(d / (R / G) - 1e-9), 1, G); return G - band + 1; } // innermost grade: the highest stage
    sideEdges() { const P = this.P; return [Math.max(P['perception.sideConeAxis'] - P['perception.sideConeAngle'], P['perception.forwardConeAngle']), P['perception.sideConeAxis'] + P['perception.sideConeAngle']]; } // degrees off the heading
    // Searching (rung 7), the forward cone looks at the ghost, as a guard turns to the last place it saw you: turned from the
    // heading toward it, as far as the side cones' outer edge (perception.sideConeAxis + perception.sideConeAngle). Degrees.
    coneLook(c) {
      const g = c.lkp; if (!g) return 0;
      const ca = Math.cos(c.h), sa = Math.sin(c.h), ox = this.propField() ? this.cornerApex(c) : c.L / 2, dx = g.x - (c.x + ca * ox), dy = g.y - (c.y + sa * ox), lim = this.sideEdges()[1];
      return clamp(Math.atan2(-dx * sa + dy * ca, dx * ca + dy * sa) * 180 / Math.PI, -lim, lim);
    }
    // Row 732: the lunge guide. Where a dash pressed now would land, and the first car on the way. The path follows the dash's
    // own profile (movement.lungeFastTimeFraction of movement.lungeDuration covers movement.lungeFastDistanceFraction of the
    // reach); a solid stops it (low cover does not; the plinth does not, from on top). Cars move straight on at their speed.
    lungePreview(mx, my) {
      const P = this.P, b = this.body; if (!b || !b.alive) return null;
      const direct = P['proto.turnModel'] === 2, m = hyp(mx || 0, my || 0), dir = direct && m > 0.05 ? Math.atan2(my, mx) : b.facing;
      const lk = this.underfoot('lunge'), R = this.reach() * Math.max(0, lk), T = P['movement.lungeDuration'], tf = T * P['movement.lungeFastTimeFraction'], df = P['movement.lungeFastDistanceFraction'], r = P['body.radius'];
      const ready = this.dashFitted() && b.mode !== 'lunge' && b.mode !== 'recover' && !b.stair && !(b.landT > 0) && b.charge >= P['battery.lungeCost'] - 1e-9 && lk > 0;
      const solids = this.level.statics.filter((q) => !q.low && !(b.raised && q === this.plinth())), ca = Math.cos(dir), sa = Math.sin(dir);
      const cars = this.onRoad();
      const tAt = (d) => d <= R * df ? tf * d / (R * df) : tf + (T - tf) * (d - R * df) / (R * (1 - df)), free = (d) => !solids.some((q) => circleRect(b.x + ca * d, b.y + sa * d, r, q));
      let x1 = b.x, y1 = b.y, hit = null; const N = Math.max(24, Math.ceil(R / 4)); // about every 4 px
      for (let i = 1; i <= N; i++) { const d = R * i / N;
        if (!free(d)) { let lo = R * (i - 1) / N, hi = d; for (let j = 0; j < 12; j++) { const m = (lo + hi) / 2; if (free(m)) lo = m; else hi = m; } x1 = b.x + ca * lo; y1 = b.y + sa * lo; break; } // a solid: it stops touching it
        const t = tAt(d), x = b.x + ca * d, y = b.y + sa * d; x1 = x; y1 = y;
        for (const c of cars) if (X.circleCar(x, y, r, { x: c.x + Math.cos(c.h) * c.v * t, y: c.y + Math.sin(c.h) * c.v * t, h: c.h, L: c.L, W: c.W })) { hit = { x, y, t, car: c.id, red: !!c.red }; break; } // the sim's own contact test, the car where it will be
        if (hit) break; }
      return { x0: b.x, y0: b.y, x1, y1, dir, R, hit, ready };
    }
    coneSensitivity(c) { const P = this.P, hz = c.hz; return !hz || !hz.cone ? 1 : hz.cone === 'side' ? P['perception.sideConeSensitivity'] : P['perception.forwardConeSensitivity']; }
    moveCars(h, ts) { // row 740: however its speed was set this substep, a white car slows no faster than traffic.whiteBraking
      const wb = this.P['traffic.whiteBraking'] || 0, pre = wb > 0 && this.testRoad ? this.cars.filter((c) => c.white && !c.gone && this.caughtOut(c)).map((c) => [c, c.v]) : null;
      super.moveCars(h, ts);
      if (pre) for (const [c, v] of pre) if (c.v > 0 && c.v < v - wb * h && !(c.shakenUntil != null && this.t < c.shakenUntil)) { const nv = v - wb * h; c.s += (nv - c.v) * h; c.v = nv; this.pose(c); }
    }
    manSpeed(c, man, tau, sAt) { // row 740: a white car's plan brakes no harder than traffic.whiteBraking
      const v = this.manSpeed0(c, man, tau, sAt), wb = this.P['traffic.whiteBraking'] || 0;
      return c.white && wb > 0 && man && man.v0 != null && this.caughtOut(c) ? Math.max(v, man.v0 - wb * Math.max(0, tau)) : v;
    }
    manSpeed0(c, man, tau, sAt) {
      if (!man || !man.env) return super.manSpeed(c, man, tau, sAt);
      const s = sAt != null ? sAt : c.s, gap = man.sBody - (s + c.L / 2), v0 = Math.max(0, man.v0);
      return Math.min(v0, Math.max(this.envSpeed(gap), v0 - this.P['traffic.hardBraking'] * Math.max(0, tau)));
    }
    // A plan holds for traffic.commitHorizon. If the dummy ahead starts coming at the car meanwhile, rung 1 drops an even
    // stop and stops hard at once (choose).
    carAI(dt) {
      if (this.testRoad && this.rung >= 1) for (const c of this.cars) {
        const m = c.man, hz = c.hz, b = this.body;
        if (!c.red || c.ghost) continue;
        this.trackSight(c, dt);
        if (c.hz && (c.noticed || c.hz.inPath) && b.alive && this.trulySees(c)) { c.seenT = this.t; c.seenAt = { x: b.x, y: b.y }; } // it truly had the dummy (last tick's sensing): when, and where
        if (this.rung >= 7) this.searchStep(c);
        c.checks = this.rung >= 6 ? this.checking(c) : null; // rung 6: the remembered spots in its field, which it watches
        if (c.dodge && c.dodge.kind === 'cone' && c.cause === 'cone' && c.man && c.man.type === 'shift' || c.coneSwerve && c.dodge && c.dodge.kind === 'cone') { c.coneSwerve = true; c.coneSwerveT = this.t; } else c.coneSwerve = false; // row 695: swerving round a cone, and when last
        if (this.rung >= 2 && this.watchField(c, dt)) continue;
        if (!m || m.type !== 'brake' || m.emergency || c.cause !== 'body' || !hz || !hz.inPath || c.v < 1) continue;
        const q = X.pathAt(c.path, hz.s);
        if (-(b.vx * q.tx + b.vy * q.ty) > 1) { c.man = null; c.state = 'cruise'; }
      }
      // Row 730: staged, each red car's caution speed (proto.driver.cautionSpeed) is its stage's: cornerSpeed sets it, just before
      // the base's caution block reads it for the same car, which then brakes to reach it by the dummy (comfort to hard)
      const P = this.P, keepC = P['proto.driver.cautionSpeed'], staged = this.testRoad && this.sideStaged(), keepTG = P['traffic.timeGap'], wb = P['traffic.whiteBraking'] || 0;
      this.stageCaution = staged ? keepC : null; this.carKeepTG = keepTG; // row 740: cornerSpeed sets each car's time gap, read next by the base's following
      if (wb > 0) for (const c of this.cars) if (c.white) { c.vPrev = c.v; c.caught = this.caughtOut(c); }
      try { super.carAI(dt); } finally { P['proto.driver.cautionSpeed'] = keepC; P['traffic.timeGap'] = keepTG; this.stageCaution = null; this.carKeepTG = null; }
      if (wb > 0) for (const c of this.cars) if (c.white && c.caught && c.vPrev != null && c.v < c.vPrev - wb * dt) c.v = c.vPrev - wb * dt; // row 740: caught out, a white car brakes no harder than traffic.whiteBraking
      if ((P['scoring.incidentPoints'] || 0) > 0) this.incidents();
      if (staged) for (const c of this.cars) { if (!c.red || c.ghost) continue; const st = this.sideStage(c); if (st > (c.awarePrev || 0)) this.emit('aware', { car: c.id, stage: st, x: +this.body.x.toFixed(1), y: +this.body.y.toFixed(1) }); c.awarePrev = st; }
    }
    // Row 730: the field in stages, by the dummy's distance from the car's nose (beside it: its gap from the flank). AWARE in
    // the field beyond perception.sideWaryRange; WARY within it; CLOSE within perception.sideCloseRange (about the dash's reach).
    // Each caps the car's speed at a share of its cruise (perception.sideAwareSpeed, perception.sideWarySpeed,
    // perception.sideCloseSpeed), after perception.reactionDelay. The notice meter fills at a share of its speed:
    // perception.sideAwareNoticeRate, perception.sideWaryNoticeRate; CLOSE at full. Noticed (stage 4), it stops short, as
    // before. 0 for perception.sideCloseRange: off, the whole field alike (10.3–10.7).
    sideStaged() { return (this.P['perception.sideCloseRange'] || 0) > 0 && this.rung >= 2; }
    sideDist(c) { const hz = c.hz; return hz && !hz.inPath ? (hz.dist != null ? hz.dist / Math.max(0.05, this.coneSensitivity(c)) : Math.hypot(Math.max(0, hz.lx), Math.max(0, Math.abs(hz.ly) - c.W / 2))) : null; } // row 731: coned, from the cone's apex, over its sensitivity: a dummy must come closer to a duller cone for each stage
    sideStage(c) {
      if (!this.sideStaged() || !c.red || !c.hz || c.hz.inPath || !this.body.alive) return 0;
      if (c.noticed) return 4;
      if (this.propField()) { const hz = c.hz, R = this.coneReach(); return hz.cone === 'side' ? this.gradeStage('side', hz.dist, hz.R || R.s) : this.gradeStage('forward', hz.dist != null ? hz.dist : Math.hypot(this.body.x - c.x, this.body.y - c.y), hz.cone === 'forward' && hz.R ? hz.R : R.f); } // row 735
      const d = this.sideDist(c), P = this.P;
      return d <= P['perception.sideCloseRange'] ? 3 : d <= P['perception.sideWaryRange'] ? 2 : 1;
    }
    noticeRate(c) {
      if (!this.sideStaged()) return 1;
      const st = this.sideStage(c), P = this.P, k = st === 1 ? P['perception.sideAwareNoticeRate'] : st === 2 ? P['perception.sideWaryNoticeRate'] : 1;
      return (k == null ? 1 : k) * this.coneSensitivity(c); // row 731: a less sensitive cone notices slower
    }
    cornerSpeed(c) {
      let v = super.cornerSpeed(c); const jc = this.junctionCap(c); if (jc != null) v = Math.min(v, jc); // row 735
      if (this.carKeepTG != null && (this.P['traffic.whiteTimeGap'] || 0) > 0) this.P['traffic.timeGap'] = c.white ? this.P['traffic.whiteTimeGap'] : this.carKeepTG; // row 740: a white car tailgates
      if (c.shakenUntil != null && this.t < c.shakenUntil) v = 0; // row 740: after an Incident, both cars stand
      if (this.stageCaution != null) this.P['proto.driver.cautionSpeed'] = this.stageSpeed(c); // row 730: this car's caution speed, read next
      return v;
    }
    // Row 740: the Incident. White cars tailgate (traffic.whiteTimeGap). When the red car ahead stops for the dummy, the white
    // car behind is caught out: it brakes no harder than traffic.whiteBraking and runs into its back: an Incident, worth
    // scoring.incidentPoints. Any other stop, it brakes as it can. The two stand
    // traffic.incidentSeconds, then drive on. Any car that runs into the one ahead in its lane is stopped at its bumper.
    caughtOut(w) { // row 740: the red car just ahead of it in its lane is stopping for the dummy: the tailgater is caught out
      return this.cars.some((r) => r.red && !r.gone && r.path === w.path && r.s > w.s && r.s - w.s < 4 * r.L + 60 && (r.cause === 'body' || r.noticed || (r.hz && r.hz.inPath)));
    }
    incidents() {
      const P = this.P;
      for (const f of this.cars) { if (f.gone || f.ghost) continue;
        for (const l of this.cars) { if (l === f || l.gone || l.ghost || l.path !== f.path || l.s <= f.s) continue;
          const gap = (l.s - l.L / 2) - (f.s + f.L / 2); if (gap >= 0) continue;
          f.s = l.s - (l.L + f.L) / 2 - 0.5; f.v = 0; this.pose(f); // stopped at its bumper
          if (!(l.red && f.white) || !this.caughtOut(f)) continue; // only a stop the dummy caused
          l.incidentWith = l.incidentWith || new Set(); if (l.incidentWith.has(f.id)) continue; l.incidentWith.add(f.id);
          const pts = Math.round(P['scoring.incidentPoints']); this.run.points += pts; this.run.incidents = (this.run.incidents || 0) + 1;
          l.shakenUntil = f.shakenUntil = this.t + (P['traffic.incidentSeconds'] || 0); f.incidentAt = l.incidentAt = this.t;
          const x = (l.x + f.x) / 2, y = (l.y + f.y) / 2; this.emit('incident', { car: l.id, by: f.id, model: l.model, x: +x.toFixed(1), y: +y.toFixed(1), points: pts, v: +f.vPrev?.toFixed(1) || 0 }); } }
    }
    // Row 735: the two-way junction. Road B gives way to road A: within traffic.junctionLookahead of the box, a road B car stops
    // short of it while a road A car would reach the box within traffic.junctionGap seconds. Any car stops short of the box
    // while a crossing car is in it, or too close to stop before it. A car too close to stop gently goes on. Nothing slows a
    // car when the way is clear.
    junctionCap(c) {
      const P = this.P; if (!P['duel.twoWay'] || !c.path.box) return null; const was = !!c.jYield; c.jYield = false; // its own flag: the base clears c.yielding each tick
      const nose = c.s + c.L / 2, d = c.path.box[0] - 4 - nose; if (d < 0 || d > P['traffic.junctionLookahead']) return null;
      const cb = P['traffic.comfortBraking'], committed = (o, dO) => !o.jYield && dO > 0 && o.v > 5 && o.v * o.v / (2 * cb) > dO - 4; // too close to stop gently, and not giving way
      if (!was && c.v * c.v / (2 * cb) > d) return null; // too close to stop gently, and not already giving way: it goes
      const gap = P['traffic.junctionGap'], minor = c.path.road === 'B';
      const hold = this.cars.some((o) => { if (o === c || o.gone || !o.path.box || o.path.road === c.path.road) return false;
        const on = o.s + o.L / 2, ot = o.s - o.L / 2, dO = o.path.box[0] - on; if (ot >= o.path.box[1]) return false; // past the box
        if (on > o.path.box[0] || committed(o, dO)) return true; // in the box, or about to be
        return minor && (on > o.path.box[0] - 30 || (dO > 0 && o.v > 5 && dO / o.v < gap)); }); // road B: road A at the box edge, or coming within the gap
      c.jYield = hold; return hold ? Math.sqrt(2 * P['traffic.comfortBraking'] * Math.max(0, d)) : null;
    }
    stageSpeed(c) { // a red car's caution speed by stage; any other car keeps proto.driver.cautionSpeed
      if (!c.red) return this.stageCaution;
      const st = this.sideStage(c), P = this.P, k = st === 1 ? P['perception.sideAwareSpeed'] : st === 2 ? P['perception.sideWarySpeed'] : st >= 3 ? P['perception.sideCloseSpeed'] : null;
      return k == null ? this.stageCaution : (c.cruise || P['vehicles.sedan.cruiseSpeed']) * k; // each stage's speed is the same in every cone: the stage shown is what the car does
    }
    // The field's width: rung 2 and up. Below, the car has no field (10.1, 10.2: proto.driver.cautionZone 0 by rung).
    fieldFor() { // row 731: coned, wide enough to hold the cones; the cones then decide
      const P = this.P; if (this.rung < 2) return 0;
      if (!this.coned()) return P['proto.driver.cautionZone'];
      if (this.propField()) { const R = this.coneReach(); return Math.max(Math.sin(P['perception.forwardConeAngle'] * Math.PI / 180) * R.f, R.s) + P['body.radius']; } // row 735
      return Math.max(Math.tan(P['perception.forwardConeAngle'] * Math.PI / 180) * (P['perception.forwardLength'] + P['body.radius']), P['perception.sideConeRange'] + P['body.radius']);
    }
    // ----- rung 2: the dummy in its field, beside its path (in its path is the beam's: rung 1's brake)
    watchField(c, dt) {
      const P = this.P, b = this.body, hz = c.hz;
      const side = !!(hz && !hz.inPath && b.alive), wasHolding = c.cause === 'side' && !!c.man;
      c.fieldT = side ? (c.fieldT || 0) + dt * this.noticeRate(c) : 0; // row 730: staged, the meter fills slower the farther the dummy is
      c.noticed = side && c.fieldT >= (this.expected() ? 0 : P['perception.sideNoticeSeconds'] * (b.duck ? P['perception.duckNoticeFactor'] || 1 : 1)) - 1e-9; // a ducked dummy is noticed slower (row 696); one at a remembered spot, at once (rung 6)
      if (this.rung < 5 && c.dodge && c.dodge.kind === 'cone' && c.cause === 'cone') { c.sideHonk = false; c.sideHoldT = 0; return false; } // its swerve round a cone holds until it has passed it (rungs 2–4)
      if (!c.noticed) { c.sideHonk = false; c.sideHoldT = 0; if (wasHolding && c.v < 1 && !(hz && hz.inPath)) { c.man = null; c.state = 'cruise'; } return false; } // a dummy that steps from its field into its path keeps it stopped (row 688)
      // the stop point: where its nose stays envelope(0) from the dummy, measured straight, not along the road
      const E0 = this.envelope(0), lat = Math.max(0, Math.abs(hz.ly) - c.W / 2), sBody = hz.s - Math.sqrt(Math.max(0, E0 * E0 - lat * lat)) + E0;
      const q = X.pathAt(c.path, hz.s), dx = b.x - c.x, dy = b.y - c.y, dd = Math.hypot(dx, dy) || 1;
      const closing = -((b.vx * dx + b.vy * dy) / dd) + 0; // the dummy's speed toward the car
      c.sideHoldT = c.v < 1 ? (c.sideHoldT || 0) + dt : 0;
      if (c.sideHoldT >= P['proto.honkSeconds'] - 1e-9 && !c.sideHonk) { c.sideHonk = true; this.emit('honk', { car: c.id, at: 'body', side: true }); }
      if (c.man && c.cause === 'side' && !(closing > 1 && !c.man.emergency && c.v >= 1)) return true; // holding its plan
      if (c.man && c.cause === 'body') return false; // the beam's brake comes first
      void q;
      const plan = c.v < 1 ? { type: 'brake', v0: 0, a: P['traffic.comfortBraking'], vTarget: 0, sStop: c.s, standoff: true }
        : closing > 1 || lat <= 0 ? { type: 'brake', v0: c.v, a: P['traffic.hardBraking'], vTarget: 0, emergency: true }
        : { type: 'brake', v0: c.v, a: P['traffic.hardBraking'], vTarget: 0, standoff: true, env: true, sBody };
      c.man = null; this.commit(c, plan, 'side', null);
      return true;
    }
    // A pass takes the car alongside the dummy. From rung 2 it waits for the dummy to leave its lane instead.
    choosePass() { return this.rung < 2; }

    // ----- the red car on the road: one at a time; back duel.redReturnSeconds after it leaves the screen (row 670)
    onRoad() { return this.cars.filter((c) => !c.ghost && !c.gone && (c.layer == null || c.layer === 0)); }
    beamFor() { return this.rung >= 1 ? this.P['perception.forwardLength'] : 0; } // rung 0 senses nothing
    driveIn() { const P = this.P; return (this.level.runIn - P['vehicles.sedan.length']) / P['vehicles.sedan.cruiseSpeed']; } // spawn to the screen's edge, at cruise
    admit() {
      if (!this.testRoad) return super.admit();
      const P = this.P;
      if ((P['duel.whiteInterval'] || 0) > 0) this.admitWhite(); // row 734: white traffic on every lane
      if (this.lesson) return; // a lesson is due or showing: the car is away being trained
      if (this.onRoad().filter((c) => c.red).length >= P['duel.carsOnRoad']) return; // the red car alone among red cars
      if (this.t + 1e-9 < this.leftAt + P['duel.redReturnSeconds'] - this.driveIn()) return; // it appears R after the last left, or as soon as it can drive in
      const before = this.cars.length, keep = P['perception.forwardLength'];
      this.nextAt = 0; // the test road's own pacing replaces the admission interval
      P['perception.forwardLength'] = this.beamFor(); // newCar reads its beam from here
      try { super.admit(); } finally { P['perception.forwardLength'] = keep; }
      if (this.cars.length > before) {
        const c = this.cars[this.cars.length - 1]; c.red = true; c.rung = this.rung;
        if (this.rung >= 1) c.standoff = this.envelope(0); // its stop line: honks and holds there
        if (P['duel.runInLength'] > 0) { const v = this.spawnSpeed(c); if (v < c.v) { c.v = v; this.emit('spawn-slow', { car: c.id, v: +v.toFixed(1) }); } }
      }
    }
    // Row 734: white sedans that never learn. One enters every duel.whiteInterval on average (spread ±40%), on a lane chosen by
    // the golden ratio; it waits while that lane's start is not clear. It brakes for what is in its path (its beam), follows,
    // gives way, and nothing else: no field, no lessons, no swerve. It scores nothing; its hits still damage the dummy.
    admitWhite() {
      const P = this.P, iv = P['duel.whiteInterval'], L = this.level.lanes, k = this.whiteSeq || 0;
      if (this.whiteAt == null) this.whiteAt = this.t + 0.4 * iv;
      if (this.t + 1e-9 < this.whiteAt) return;
      const li = Math.floor(((k * 0.6180339887 + 0.17) % 1) * L.length), path = L[li], gap = 3 * P['vehicles.sedan.length'] + 40;
      if (this.cars.some((o) => o.path === path && !o.gone && o.s < gap)) { this.whiteAt = this.t + 0.5; return; }
      const c = this.newCar('white' + (++this.carSeq), 'sedan', li, path, 0, 0);
      c.white = true; c.red = false; c.rung = 0; c.slot = 1e6 + k; if ((P['traffic.whiteSpeedRatio'] || 0) > 0) c.cruise = (c.cruise || P['vehicles.sedan.cruiseSpeed']) * P['traffic.whiteSpeedRatio']; c.v = Math.min(c.cruise || c.v, this.cornerSpeed(c)); this.pose(c); this.cars.push(c); // row 740: impatient, it closes on the car ahead
      this.emit('admit', { car: c.id, cls: c.cls, model: c.model, lane: li, white: true });
      this.whiteSeq = k + 1; this.whiteAt = this.t + iv * (0.6 + 0.8 * ((k * 0.7548776662 + 0.29) % 1));
    }
    // A short run-in (duel.runInLength): the car appears at the speed it would have braked to for a dummy it senses ahead
    // (its beam, or its field from rung 2), never faster than the envelope allows. A dummy it cannot see changes nothing.
    spawnSpeed(c) {
      const b = this.body, beam = this.beamFor();
      if (!b || !b.alive || beam <= 0 || !c.path) return c.v;
      const ca = Math.cos(c.h), sa = Math.sin(c.h), nx = c.x + ca * c.L / 2, ny = c.y + sa * c.L / 2;
      const fx = (b.x - nx) * ca + (b.y - ny) * sa, fy = -(b.x - nx) * sa + (b.y - ny) * ca, half = c.W / 2 + this.P['body.radius'] + this.fieldFor();
      if (fx < -c.L || fx > beam || Math.abs(fy) > half || this.occluded(c, nx, ny, b.x, b.y)) return c.v;
      if (this.coned() && Math.abs(fy) > c.W / 2 + this.P['body.radius'] && !this.coneOf(c, b.x, b.y)) return c.v; // row 731: outside its cones and its lane
      return Math.min(c.v, this.envSpeed(Math.hypot(Math.max(0, fx), Math.max(0, Math.abs(fy) - c.W / 2))));
    }
    exitCars() {
      super.exitCars();
      if (!this.testRoad) return;
      const P = this.P, W = P['world.width'], H = P['world.height'];
      for (const c of this.cars) {
        if (c.gone || c.ghost || c.s < c.path.enterS) continue;
        const m = c.L / 2 + c.W;
        if (c.x < -m || c.x > W + m || c.y < -m || c.y > H + m) { c.gone = true; if (c.white) { this.emit('left', { car: c.id, model: c.model, white: true }); continue; } this.leftAt = this.t; this.emit('left', { car: c.id, model: c.model }); }
      }
    }

    // ----- the jump on the test road (10.3): Prototype 6.5's rules (world6.js, Edit 75), on the base sim. A running or dash
    // jump passes over a car while the dummy is above its roof (vehicles.<cls>.height); below it, it strikes as a dash does.
    // The monument's plinth is a raised edge (world.jumpableHeight): a jump that tops it lands on it; walking off its edge
    // steps down. Standing on it, the dummy is above the ground the sensors watch.
    plinth() { return this.level.statics.find((st) => st.plinth) || null; }
    onPlinth(x, y) { const st = this.plinth(); return !!st && x >= st.x && x <= st.x + st.w && y >= st.y && y <= st.y + st.h; }
    // A dummy standing on the plinth stands above it: the plinth does not hide it from a car that sees height (rung 3).
    // Sightlines to the dummy (rows 696–697). Tall statics hide it from the car's own sensors; the plinth does not hide a dummy
    // standing on it. Low cover hides it by height (lowBlocked). From rung 4 the street cameras see it too: past every tall
    // static, within perception.streetCameraRange of a post (0: anywhere), and over low cover by height. From 10.8 (row 723)
    // only within perception.streetCameraFov of its aim (360: all round).
    occluded(self, x0, y0, x1, y1) {
      const b = this.body;
      if (!this.testRoad || !b || x1 !== b.x || y1 !== b.y) return super.occluded(self, x0, y0, x1, y1);
      if (b.lifted) return true; // in FARSIGHT's grip, out of play (row 715)
      if (self && self.red && this.expected()) return false; // rung 6: it looks where it remembers you
      if (self && self.red && this.whiteHides(self, x0, y0)) return !(this.rung >= 4 && this.cameraSees()); // row 734: a white car between them hides the dummy; the street cameras still see
      if (this.carSees(self, x0, y0, true)) return false;
      return !(this.rung >= 4 && self && self.red && this.cameraSees());
    }
    carSees(self, x0, y0, plinthBlocks) { // plinthBlocks: the plinth hides a dummy behind it (not one on it); for D113's cover test it never counts
      const b = this.body, keep = this.level.statics, st = this.plinth(); let blocked;
      this.level.statics = keep.filter((q) => !q.low && !(q === st && (b.raised || !plinthBlocks)));
      try { blocked = super.occluded(self, x0, y0, b.x, b.y); } finally { this.level.statics = keep; }
      return !blocked && !this.lowBlocked(x0, y0, this.eyeHeight(self), b.x, b.y, this.bodyHeight());
    }
    cameraSees() { return !!this.seeingCamera(); }
    whiteHides(self, x0, y0) { // row 711, built in row 734: a white sedan on the sightline, from the red car's sensors to the dummy
      const b = this.body, ws = this.cars.filter((o) => o.white && !o.gone && o !== self); if (!ws.length || b.raised) return false;
      const d = hyp(b.x - x0, b.y - y0), n = Math.max(2, Math.ceil(d / 8));
      for (let i = 1; i < n; i++) { const u = i / n, px = x0 + (b.x - x0) * u, py = y0 + (b.y - y0) * u; if (ws.some((o) => X.circleCar(px, py, 1, o))) return true; }
      return false;
    }
    seeingCamera() { // the first street camera that sees the dummy, or null
      const P = this.P, b = this.body, R = P['perception.streetCameraRange'] || 0, H = P['perception.streetCameraHeight'] || 0, F = P['perception.streetCameraFov'] || 360;
      for (const cam of this.level.cameras || []) {
        const [x, y, aim] = cam;
        if (R > 0 && hyp(b.x - x, b.y - y) > R) continue;
        if (F < 360 && aim != null && !this.inCameraCone(cam, b.x, b.y)) continue;
        if (!this.lowBlocked(x, y - 16, H, b.x, b.y, this.bodyHeight())) return cam;
      }
      return null;
    }
    inCameraCone(cam, px, py) { // within half of perception.streetCameraFov of the camera's aim now
      const F = this.P['perception.streetCameraFov'] || 360; if (F >= 360 || cam[2] == null) return true;
      const a = Math.atan2(py - cam[1], px - cam[0]) * 180 / Math.PI, d = ((a - this.cameraAim(cam)) % 360 + 540) % 360 - 180;
      return Math.abs(d) <= F / 2;
    }
    // Row 724: a camera pans across perception.streetCameraPanArc about its aim, as Metal Gear Solid's do: it rests
    // perception.streetCameraPanHold at one end, sweeps across in perception.streetCameraPanSeconds at a steady rate, rests, sweeps back.
    // 0: fixed. Its phase (the fourth value) offsets it in the cycle. Sim time only: no randomness.
    cameraAim(cam) {
      const P = this.P, A = P['perception.streetCameraPanArc'] || 0; if (!A || cam[2] == null) return cam[2];
      const T = Math.max(0.1, P['perception.streetCameraPanSeconds'] || 0), H = Math.max(0, P['perception.streetCameraPanHold'] || 0), cyc = 2 * (T + H);
      const ph = (((this.t || 0) / cyc + (cam[3] || 0)) % 1 + 1) % 1 * cyc;
      const u = ph < H ? 0 : ph < H + T ? (ph - H) / T : ph < 2 * H + T ? 1 : 1 - (ph - 2 * H - T) / T;
      return cam[2] - A / 2 + A * u;
    }
    eyeHeight(c) { return this.rung >= 3 ? this.P['perception.lidarHeight'] : this.P['perception.sensorHeight']; } // rung 3's lidar rides above the roof
    bodyHeight() { const b = this.body, P = this.P; return (b.duck ? P['body.duckHeight'] : P['proto.art.dummyHeight']) + (b.raised ? P['world.jumpableHeight'] : 0) + (b.z || 0); }
    // A sightline from (x0, y0) at height h0 to (x1, y1) at h1 is blocked where it crosses low cover at or below its height.
    lowBlocked(x0, y0, h0, x1, y1, h1) {
      const dx = x1 - x0, dy = y1 - y0;
      for (const q of this.level.statics) {
        if (!q.low) continue;
        let u0 = 0, u1 = 1; // the segment's span inside the rect (Liang–Barsky)
        const clip = (p, r) => { if (Math.abs(p) < 1e-12) return r >= 0; const t = r / p; if (p < 0) { if (t > u1) return false; if (t > u0) u0 = t; } else { if (t < u0) return false; if (t < u1) u1 = t; } return true; };
        if (!(clip(-dx, x0 - q.x) && clip(dx, q.x + q.w - x0) && clip(-dy, y0 - q.y) && clip(dy, q.y + q.h - y0)) || u1 < u0) continue;
        if (Math.min(h0 + (h1 - h0) * u0, h0 + (h1 - h0) * u1) <= q.height + 1e-9) return true;
      }
      return false;
    }
    // D113: what hid the dummy, height or cover? sightT is how long the car has had it in sight past every static but the
    // plinth, up to now. The building and the barrier are cover; the plinth is height.
    trackSight(c, dt) {
      const b = this.body, ca = Math.cos(c.h), sa = Math.sin(c.h), nx = c.x + ca * c.L / 2, ny = c.y + sa * c.L / 2;
      const cover = !this.carSees(c, nx, ny, false); // its own sensors: tall statics but the plinth; low cover by height
      c.sightT = b.alive && !cover ? (c.sightT || 0) + dt : 0;
      c.hidden = !!(b.alive && cover); if (c.hidden) { c.coverT = this.t; c.coverBy = this.hidingCover(c, nx, ny); } // behind cover now; when last; which cover (row 713)
    }
    hidingCover(self, x0, y0) { // the first static that hides the dummy from the car's own sensors (as trackSight: not the plinth), or null
      const b = this.body, keep = this.level.statics, st = this.plinth();
      try {
        for (const q of keep) {
          if (q === st) continue;
          this.level.statics = [q];
          if (q.low ? this.lowBlocked(x0, y0, this.eyeHeight(self), b.x, b.y, this.bodyHeight()) : super.occluded(self, x0, y0, b.x, b.y)) return q.id;
        }
      } finally { this.level.statics = keep; }
      return null;
    }
    // ----- rung 6, crash memory (row 703). The remembered spots: the latest duel.memorySites crashes' spring spots (0: all).
    // Only crashes sprung from cover make spots (row 713): a hit from the open was skill. Each spot keeps the cover that hid it.
    sites() { return this.crashes.filter((m) => m.cover); }
    memory() { if (this.rung < 6) return []; const n = Math.round(this.P['duel.memorySites'] || 0), all = this.sites(); return n > 0 ? all.slice(-n) : all; }
    nearSite(x, y, sites) { const R = this.P['duel.memoryRadius'] || 0; return (sites || this.sites()).find((m) => hyp(x - m.ox, y - m.oy) <= R + 1e-9) || null; }
    expected() { const b = this.body; return this.rung >= 6 && !!b && b.alive && (!!this.nearSite(b.x, b.y, this.memory()) || this.searched()); } // the dummy stands at a spot it remembers, or (rung 7) near a ghost it searches
    // ----- rung 7, the search (row 717). The ghost: where it last had the dummy, kept when cover takes it away.
    searched() { const b = this.body, R = this.P['duel.searchRadius'] || 0; return this.rung >= 7 && !!b && b.alive && this.onRoad().some((c) => c.red && c.lkp && hyp(b.x - c.lkp.x, b.y - c.lkp.y) <= R + 1e-9); }
    // Truly seen: by its own sensors, or a street camera (rung 4). Memory and the search see through cover; they find the
    // dummy, but do not move the ghost.
    trulySees(c) { return !c.hidden || (this.rung >= 4 && this.cameraSees()); }
    searchStep(c) {
      const P = this.P, b = this.body, T = P['duel.searchSeconds'] || 0, sensed = !!(c.hz && (c.noticed || c.hz.inPath));
      if (!(T > 0) || c.spent) { c.lkp = null; return; }
      if (sensed && this.trulySees(c)) { if (c.lkp) { this.emit('search-end', { car: c.id, found: true, seen: true }); c.lkp = null; } return; } // in plain sight again: no ghost
      if (sensed && c.lkp) { c.lkp.had = this.t; if (!c.lkp.found) { c.lkp.found = true; this.emit('search-found', { car: c.id, x: +b.x.toFixed(1), y: +b.y.toFixed(1), after: +(this.t - c.lkp.t0).toFixed(2) }); } return; } // found near the ghost, behind cover: it keeps the dummy; the ghost stays
      if (!c.lkp && c.seenT != null && this.t - c.seenT <= 0.05 && c.hidden && b.alive && !b.lifted) { // lost behind cover this tick
        c.lkp = { x: c.seenAt.x, y: c.seenAt.y, t0: this.t, had: this.t }; this.emit('search', { car: c.id, x: +c.lkp.x.toFixed(1), y: +c.lkp.y.toFixed(1) });
      }
      if (!c.lkp) return;
      if (this.t - c.lkp.had >= T - 1e-9 || !b.alive || b.lifted) { // duel.searchSeconds since it last had the dummy: it gives up and drives on
        this.emit('search-end', { car: c.id, found: false }); c.lkp = null;
        if (c.cause === 'search') { c.man = null; c.state = 'cruise'; }
        return;
      }
      if (c.man && c.cause !== 'search') return; // a plan for the dummy or a cone comes first
      const E0 = this.envelope(0), pr = X.pathProject(c.path, c.lkp.x, c.lkp.y), lat = Math.max(0, Math.abs(pr.lat) - c.W / 2);
      const sBody = pr.s - Math.sqrt(Math.max(0, E0 * E0 - lat * lat)) + E0; // its stop line short of the ghost, measured straight
      if (pr.s < c.s - c.L) return; // the ghost is behind it
      c.man = null; this.commit(c, c.v < 1 ? { type: 'brake', v0: 0, a: P['traffic.comfortBraking'], vTarget: 0, sStop: c.s, standoff: true } : { type: 'brake', v0: c.v, a: P['traffic.hardBraking'], vTarget: 0, standoff: true, env: true, sBody }, 'search', null);
    }
    // Row 726: where a red car braking to a stop will stop: its nose's point on its path, for the stop line the page draws.
    // An envelope stop ends duel's envelope(0) short of its target (envSpeed is 0 there); an even stop at its sStop.
    stopPoint(c) {
      const m = c && c.man; if (!c || !c.red || !m || m.type !== 'brake') return null;
      const front = c.s + c.L / 2, sF = m.env ? m.sBody - this.envelope(0) : m.sStop != null ? m.sStop + c.L / 2 : null;
      if (sF == null) return null;
      const sAt = Math.max(front, sF), p = X.pathAt(c.path, sAt), q = X.pathAt(c.path, Math.min(c.path.length, sAt + 1));
      return { x: p.x, y: p.y, h: Math.atan2(q.y - p.y, q.x - p.x), s: sAt, cause: c.cause, arrived: c.v < 1 };
    }
    checking(c) { // the remembered spots inside its field ahead: drawn as the spots it watches
      const ca = Math.cos(c.h), sa = Math.sin(c.h), half = c.W / 2 + this.P['body.radius'] + this.fieldFor() + (this.P['duel.memoryRadius'] || 0);
      return this.memory().filter((m) => { const dx = m.ox - c.x, dy = m.oy - c.y, fx = dx * ca + dy * sa, fy = -dx * sa + dy * ca; return fx > -c.L && fx < c.fwdLen + c.L / 2 && Math.abs(fy) < half; });
    }
    // Where a hit was sprung from: a dash's or a jump's start; a walk-in or a car's own strike, where the dummy stood.
    springOrigin(e) { const b = this.body, sp = this.spring; return (e.kind === 'dash' || e.kind === 'jump') && sp ? { x: sp.x, y: sp.y, cover: sp.cover || null } : { x: b.x, y: b.y, cover: null }; } // a walk-in springs from the open
    // A cone took it: it swerved round a cone within the training clip (duel.lessonClipSeconds).
    itemHit(c) { return c.coneSwerveT != null && this.t - c.coneSwerveT <= this.P['duel.lessonClipSeconds'] + 1e-9; }
    // Cover hid the dummy: the car lost it behind cover within the training clip (duel.lessonClipSeconds).
    coverHid(c) { return c.coverT != null && this.t - c.coverT <= this.P['duel.lessonClipSeconds'] + 1e-9; }
    // Height hid the dummy: a hit from above, by a dummy in the car's sight for the whole training clip (duel.lessonClipSeconds).
    // A clip that shows the dummy coming out of cover teaches cover, not height (row 685).
    heightHid(e, c) { return this.fromAbove(e) && (c.sightT || 0) >= this.P['duel.lessonClipSeconds'] - 1e-9; }
    // A hit from above: a jump's strike, or a dash launched from the plinth (or a jump out of one).
    fromAbove(e) { const b = this.body; return e.kind === 'jump' || !!(b && ((b.lunge && b.lunge.fromRaised) || (b.jump && b.jump.fromRaised))); }
    springCover() { const c = this.onRoad().find((q) => q.red && !q.spent); return c && c.hidden ? (c.coverBy || null) : null; } // the cover hiding the dummy from the red car as it springs, or null (the open)
    springSeen() { const c = this.onRoad().find((q) => q.red && !q.spent); return c && c.seenT != null ? { ago: this.t - c.seenT, x: c.seenAt.x, y: c.seenAt.y } : null; } // when and where that car last had the dummy, as it springs (rung 7's cause)
    startLunge(facing0, k) { const b = this.body, up = !!b.raised, x = b.x, y = b.y, cover = this.testRoad ? this.springCover() : null; super.startLunge(facing0, k); if (this.testRoad && b.lunge) { b.lunge.fromRaised = up; this.spring = { x, y, t: this.t, cover, seen: this.springSeen() }; } }
    tryJump() { const b = this.body, up = !!b.raised, x = b.x, y = b.y, dashing = b.mode === 'lunge', cover = this.testRoad && !dashing ? this.springCover() : null; super.tryJump(); if (this.testRoad && b.mode === 'jump' && b.jump) { b.jump.fromRaised = up; b.raised = false; if (!dashing) this.spring = { x, y, t: this.t, cover, seen: this.springSeen() }; } } // a jump out of a dash keeps the dash's start
    landJump() { const b = this.body; super.landJump(); if (this.testRoad) { b.raised = this.onPlinth(b.x, b.y); if (b.raised) this.emit('raised', { x: +b.x.toFixed(1), y: +b.y.toFixed(1) }); } }
    // A dash vaults low cover (row 696): a planter stops a walk, not a dash. The dummy springs from a duck over the row.
    collideBody(contacts, k) {
      const b = this.body;
      if (this.testRoad && b && b.lifted) return; // carried over the road: it touches nothing (row 715)
      if (!this.testRoad || !b || b.mode !== 'lunge' || !this.level.statics.some((q) => q.low)) return this.collideStatics(contacts, k);
      const keep = this.level.statics; this.level.statics = keep.filter((q) => !q.low);
      try { return this.collideStatics(contacts, k); } finally { this.level.statics = keep; }
    }
    collideStatics(contacts, k) {
      const b = this.body;
      if (this.testRoad && b.alive && b.raised && b.mode !== 'jump') { // on the plinth: it does not push the dummy off
        const keep = this.level.statics, st = this.plinth(); this.level.statics = keep.filter((q) => q !== st);
        try { super.collideBody(contacts, k); } finally { this.level.statics = keep; }
        if (!this.onPlinth(b.x, b.y)) { b.raised = false; this.emit('step-down', { x: +b.x.toFixed(1), y: +b.y.toFixed(1) }); }
        return;
      }
      if (!this.testRoad || !b.alive || b.mode !== 'jump' || !b.jump) return super.collideBody(contacts, k);
      const P = this.P, r = P['body.radius'], air = b.jump.clear !== false ? b.z : 0;
      const push = (nx, ny, pen) => { b.x += nx * pen; b.y += ny * pen; const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= vn * nx; b.vy -= vn * ny; } X.JUMP.slide(b.jump, nx, ny); };
      for (const st of this.level.statics) {
        if (st.plinth && (b.jump.fromRaised || air >= st.height || this.onPlinth(b.x, b.y))) continue; // over the raised edge (its centre above the top lands on it), or leaving it
        if (st.low && air >= st.height) continue; // over a planter
        const res = circleRect(b.x, b.y, r, st); if (res) push(res.nx, res.ny, res.pen);
      }
      for (const c of this.cars) {
        if (!this.meets(c) || c.ghost) continue;
        if (air > 0 && air >= P['vehicles.' + c.cls + '.height']) continue; // over the roof
        const res = X.circleCar(b.x, b.y, r, c);
        if (!res) continue;
        c.touched = true; c.touchT = this.t;
        const nx = -res.nx, ny = -res.ny, rel = (b.vx - c.vx) * nx + (b.vy - c.vy) * ny;
        let knock = null;
        if (!c.inEpisode) {
          c.inEpisode = true;
          const ph = X.impulseImpact(P, b.vx, b.vy, c.vx, c.vy, nx, ny, c.cls, true); // a jump strikes as a dash does
          contacts.push({ k, car: c, closing: Math.max(0, rel), ph, px: res.cx, py: res.cy, zone: X.zoneOf(res.qx, res.qy, c), carState: this.carCue(c), cause: c.cause, coneT: c.coneT,
            lunging: false, jump: true, kind: 'jump', bodySpeed: hyp(b.vx, b.vy), carSpeed: c.v, stopped: c.v < 5 || !!(c.man && c.man.standoff) });
          if (P['proto.damageModel'] && ph.un > 1e-6) knock = ph.knock;
        }
        b.x += res.nx * res.pen; b.y += res.ny * res.pen;
        if (knock) { b.mode = 'knock'; b.lunge = null; b.jump = null; b.z = 0; b.knockT = 0; b.knockVx = knock.x; b.knockVy = knock.y; b.vx = knock.x; b.vy = knock.y; this.emit('knock', { car: c.id, speed: +hyp(knock.x, knock.y).toFixed(2) }); }
        else if (rel > 0) { b.vx -= rel * nx; b.vy -= rel * ny; }
      }
    }

    // ----- the lesson (handover v2 §9.1): cause, update, return, new behaviour
    // A car slower than duel.standstillSpeed is at a standstill. A dash or a walk into it does no damage and teaches
    // nothing: the car has passed its test (row 668). It is a touch, as on a spent car.
    account(contacts) {
      if (!this.testRoad) return super.account(contacts);
      const still = this.P['duel.standstillSpeed'] || 0, keep = [];
      for (const ct of contacts) {
        if (still > 0 && !ct.drop && Math.abs(ct.carSpeed) < still && this.body.alive && !ct.car.spent) { this.emit('touch', { car: ct.car.id, standstill: true, closing: +ct.closing.toFixed(2), zone: ct.zone }); continue; }
        keep.push(ct);
      }
      const white = keep.filter((ct) => ct.car && ct.car.white), red = keep.filter((ct) => !(ct.car && ct.car.white));
      if (white.length) { const p0 = this.run.points, w0 = this.events.length; super.account(white); this.run.points = p0; for (const e of this.events.slice(w0)) if (e.type === 'impact') { e.white = true; e.points = 0; } } // row 734: a white car's hit damages the dummy, scores nothing, teaches nothing
      const e0 = this.events.length, positive = super.account(red);
      for (const e of this.events.slice(e0)) if (e.type === 'impact') {
        const c = this.carById(e.car); if (c && c.red) { e.sight = +(c.sightT || 0).toFixed(2); e.above = this.fromAbove(e); e.cover = this.coverHid(c); e.coned = this.itemHit(c); e.ducked = !!this.body.duck || !!this.body.duckAt && this.t - this.body.duckAt < 0.5; } // in sight past cover (s); from above (D113); out of cover (row 687); round a cone (row 695); from a duck
        if (e.lost > 0 && c && c.red) { // the crash: an outline where it struck; the spot it was sprung from; is that spot an earlier crash's? (row 703)
          const o = this.springOrigin(e), b = this.body, fx = this.effects.filter((q) => q.type === 'burst').pop(), prev = o.cover ? this.nearSite(o.x, o.y) : null; // from the open: skill, no spot (row 713)
          const sn = (e.kind === 'dash' || e.kind === 'jump') && this.spring ? this.spring.seen : null; // rung 7: had the car seen it just before it hid and sprang?
          e.lostSight = !!(o.cover && sn && sn.ago <= this.P['duel.lessonClipSeconds'] + 1e-9); e.seenAt = e.lostSight ? { x: +sn.x.toFixed(1), y: +sn.y.toFixed(1), ago: +sn.ago.toFixed(2) } : null;
          e.origin = { x: +o.x.toFixed(1), y: +o.y.toFixed(1) }; e.covered = o.cover; e.habit = !!prev; e.remembered = !!this.nearSite(o.x, o.y, this.memory());
          e.grade = this.strikeGrade(e, c); const mult = this.gradeMultiplier(e.grade), pts = Math.round(e.lost * mult); // row 725: how unseen the strike was; row 728: its damage × the grade
          this.stealth.points += pts; this.stealth[e.grade]++; this.stealth.last = { grade: e.grade, mult, points: pts, t: +this.t.toFixed(2) }; e.points = pts; e.mult = mult;
          this.crashes.push({ n: this.crashes.length + 1, x: +b.x.toFixed(1), y: +b.y.toFixed(1), ox: e.origin.x, oy: e.origin.y, cover: o.cover, px: fx ? +fx.x.toFixed(1) : null, py: fx ? +fx.y.toFixed(1) : null, h: +c.h.toFixed(3), t: +this.t.toFixed(2), model: c.model, zone: e.zone, prev: prev ? prev.n : null, writeoff: b.health <= 0, grade: e.grade, points: pts });
          this.emit('crash', { n: this.crashes.length, x: e.origin.x, y: e.origin.y, cover: o.cover, habit: e.habit, prev: prev ? prev.n : null, grade: e.grade, mult, points: pts });
        }
        if (e.lost > 0) this.learnFrom(e);
      }
      return positive;
    }
    // Row 725: the stealth grade of a damaging strike, from the striking car's sightings this pass (c.seenT: it truly had the
    // dummy, noticed or in its path). 'unseen': it never had it. 'lost': it had it, but not as the dummy sprang. 'seen': it had
    // it on the spring's tick (a dash's or a jump's start; for a walk-in, the impact). Row 728: the strike scores its damage
    // times its grade's multiplier: scoring.stealthUnseen, scoring.stealthLost, scoring.stealthSeen.
    strikeGrade(e, c) {
      const sp = (e.kind === 'dash' || e.kind === 'jump') && this.spring ? this.spring : null, TICK = 0.05;
      const had = sp ? sp.seen : c.seenT != null ? { ago: this.t - c.seenT } : null;
      return !had ? 'unseen' : had.ago <= TICK ? 'seen' : 'lost';
    }
    gradeMultiplier(g) { return this.P[{ unseen: 'scoring.stealthUnseen', lost: 'scoring.stealthLost', seen: 'scoring.stealthSeen' }[g]] || 0; }
    // Beat 1, the cause: a damaging hit on the part the next rung guards. The lesson shows once the car has left the screen.
    learnFrom(e) {
      const c = this.carById(e.car), next = RUNGS[this.rung + 1];
      if (!c || !c.red || this.lesson || !next || this.rung >= Math.round(this.P['duel.topRung'] || 0) || !next.learnsFrom.includes(e.zone)) return;
      if (next.high && !this.heightHid(e, c)) return; // rung 3 learns only from a hit where height hid the dummy (row 685)
      if (next.cover && !this.coverHid(c)) return; // rung 4, only from a hit where cover hid it
      if (next.items && !this.itemHit(c)) return; // rung 5, only from a hit while it swerved round a cone (row 695)
      if (next.habit && !e.habit) return; // rung 6, only from a hit sprung from the spot of an earlier crash (row 703)
      if (next.search && !e.lostSight) return; // rung 7, only from a hit from cover by a dummy it had seen within the clip (row 717)
      this.lesson = { state: 'due', from: this.rung, to: next.rung, name: next.name, sensor: next.sensor, model: c.model, car: c.id, zone: e.zone, kind: e.kind, hitT: e.t, lost: e.lost, origin: e.origin || null, seenAt: e.seenAt || null };
      this.emit('lesson-due', { model: c.model, from: this.rung, to: next.rung, zone: e.zone, car: c.id, origin: e.origin || null, habit: !!e.habit, seenAt: e.seenAt || null });
    }
    step(cmd) {
      if (this.testRoad && this.phase === 'play' && this.lesson && this.lesson.state === 'due' && this.body.alive && !this.onRoad().some((c) => c.red)) {
        // Beats 1–2 on screen: the training clip, then the sensor fitted. The sim waits in phase 'lesson' (continueLesson).
        this.lesson.state = 'showing'; this.lesson.shownT = this.t; this.phase = 'lesson';
        this.emit('lesson', { model: this.lesson.model, from: this.lesson.from, to: this.lesson.to, name: this.lesson.name, zone: this.lesson.zone });
        return;
      }
      if (this.testRoad && this.lift && this.lift.state !== 'inbound' && this.lift.state !== 'outbound') cmd = {}; // in FARSIGHT's grip: no control
      if (this.testRoad && this.body) this.duckFor(cmd);
      const r = super.step(cmd);
      if (this.testRoad && this.body && this.body.duck && !this.canDuck()) this.stand();
      return r;
    }
    // DUCK (rows 694, 696): hold to duck. Lower (body.duckHeight) and slower (movement.duckSpeedFactor). A dash or a jump
    // from a duck stands the dummy up as it goes.
    canDuck() { const b = this.body; return !!this.run.owned.duck1 && b.alive && !b.lifted && (b.mode === 'idle' || b.mode === 'move' || b.mode === 'coast') && !b.stair; }
    duckFor(cmd) {
      const b = this.body, want = !!(cmd && cmd.duck) && this.canDuck();
      if (want && !b.duck) { b.duck = true; this.emit('duck', { x: +b.x.toFixed(1), y: +b.y.toFixed(1) }); }
      else if (!want && b.duck) this.stand();
    }
    stand() { const b = this.body; b.duck = false; b.duckAt = this.t; this.emit('stand', { x: +b.x.toFixed(1), y: +b.y.toFixed(1) }); }
    underfoot(field) { const v = super.underfoot(field); return field === 'dummySpeed' && this.testRoad && this.body && this.body.duck ? v * this.P['movement.duckSpeedFactor'] : v; }
    // Beat 3, the return: the same car and tag, back as soon as it can be (admit). Beat 4 is the new behaviour.
    continueLesson() {
      if (this.phase !== 'lesson' || !this.lesson) return;
      const L = this.lesson;
      this.rung = L.to; this.lessons.push({ from: L.from, to: L.to, model: L.model, zone: L.zone, kind: L.kind, hitT: L.hitT, shownT: L.shownT });
      this.lesson = null; this.phase = 'play';
      this.emit('learned', { model: L.model, rung: L.to, name: L.name });
      this.partFor(L.to, 1);
    }
    // Rung 1's answer to a dummy ahead is a brake for the body. The first one calls the dash by drone (duel.dashArrives 2):
    // the tool arrives where the problem is (World 1-1; handover v2 §9.5).
    commit(c, man, cause, tg) {
      super.commit(c, man, cause, tg);
      if (!this.testRoad || !c.red) return;
      if (cause === 'body' && this.rung >= 1 && this.firstBrakeT == null) { this.firstBrakeT = this.t; this.emit('first-brake', { car: c.id, model: c.model }); this.partFor(1, 2); }
      if (cause === 'side' && this.rung >= 2 && this.firstSideT == null) { this.firstSideT = this.t; this.emit('first-side', { car: c.id, model: c.model }); this.partFor(2, 2); }
      if (cause === 'cone' && man.type === 'brake' && this.rung >= 5 && this.firstItemT == null) { this.firstItemT = this.t; this.emit('first-item', { car: c.id, model: c.model }); this.partFor(5, 2); } // it stops at a cone: DUCK arrives
      if ((cause === 'side' || cause === 'body') && this.rung >= 6 && this.expected()) { const m = this.nearSite(this.body.x, this.body.y, this.memory()); this.emit('expect-stop', { car: c.id, site: m ? m.n : null, hidden: !!c.hidden }); } // it stops for a dummy where it remembers one
      if ((cause === 'side' || cause === 'body') && this.rung >= 4 && c.hidden && this.firstCoverT == null) { this.firstCoverT = this.t; this.emit('first-cover', { car: c.id, model: c.model }); this.partFor(4, 2); } // it stops for a dummy only its cameras see
    }
    partFor(rung, when) { // rung's part, if its partKey says it comes now (1: the lesson's end; 2: the first use)
      const r = RUNGS[rung];
      if (r && r.part && Math.round(this.P[r.partKey] || 0) === when && !this.run.owned[r.part]) this.sendPart(r.part);
    }
    // A FARSIGHT drone brings a part: it flies in from the top edge at proto.droneSpeed, lowers it onto the dummy over
    // proto.droneLiftSeconds and leaves. Play goes on. Damage carries over, as Story's gift does (installGift, Edit 91).
    sendPart(node) {
      if (this.delivery) return;
      this.delivery = { node, x: this.body.x, y: -40, state: 'inbound', t0: this.t, tl: 0 };
      this.emit('part-dispatch', { node });
    }
    install(node) {
      const b = this.body, m0 = this.maxHealth();
      this.run.owned[node] = true;
      if (b && b.alive) b.health = Math.min(this.maxHealth(), b.health + this.maxHealth() - m0);
      this.emit('gift', { node });
    }
    // ----- the block lift (row 715). A car kept waiting by the dummy (in its path, noticed in its field, or a cone ahead)
    // for duel.blockSeconds calls FARSIGHT. A drone flies in (proto.droneSpeed), lifts the dummy (proto.droneLiftSeconds),
    // carries it to the side of the car's road (sidePoint; off the road, it lifts it where it stands), holds it until the car
    // has left the screen, and puts it down. Lifted, the dummy is out of play: unseen, untouchable, without control.
    sidePoint(c) { // beside the car's road, on the dummy's side, clear of the other road and of every static: the kerb plus a body's width, further out if need be
      const P = this.P, b = this.body, W = P['world.laneWidth'], r = P['body.radius'], off = W + 2 * r, A = c.path.road === 'A';
      if (Math.abs(A ? b.y - ROAD_A : b.x - ROAD_B) >= off) return { x: b.x, y: b.y }; // already off the car's road: lifted where it stands
      const sg = A ? (b.y < ROAD_A ? -1 : 1) : (b.x < ROAD_B ? -1 : 1);
      let along = clamp(A ? b.x : b.y, 2 * r, (A ? P['world.width'] : P['world.height']) - 2 * r); const other = A ? ROAD_B : ROAD_A;
      if (Math.abs(along - other) < off) along = other + (along < other ? -off : off);
      const at = (k) => { const d = (A ? ROAD_A : ROAD_B) + sg * (off + k * r); return A ? { x: along, y: d } : { x: d, y: along }; };
      for (let k = 0; k <= 8; k++) { const q = at(k); if (!this.level.statics.some((st) => circleRect(q.x, q.y, r, st))) return q; }
      return at(0);
    }
    carPassed(c) { return !c || c.gone || c.spent; } // it has moved on: off the screen (a dummy put down beside a car still in reach would strike it)
    blocked() { const b = this.body, c = this.onRoad().find((q) => q.red && !q.spent); if (!b || !b.alive) return null; if (c && c.v < 1 && (c.noticed || (c.hz && c.hz.inPath) || (c.det && c.det.fwd && c.det.fwd.kind === 'cone'))) return c; // a car kept waiting by the dummy or its cone
      return this.onRoad().find((q) => q.white && q.v < 1 && q.hz && q.hz.inPath) || null; } // row 734: a white car the dummy keeps waiting: FARSIGHT lifts the dummy for it too
    fetchBlockingCones(c) { // the cones in its lane ahead go too: a drone each, now (the base waits proto.droneConeSeconds, and 20 s between fetches of one cone)
      const r = this.P['props.cone.radius'];
      for (const cn of this.cones) {
        if (cn.state !== 'free' || this.drones.some((d) => d.cone === cn.id)) continue;
        const pr = X.pathProject(c.path, cn.x, cn.y), ds = pr.s - c.s - c.L / 2;
        if (ds > -r && ds < c.fwdLen && Math.abs(pr.lat) < c.W / 2 + r + 2) { cn.droneT = null; this.dispatchDrone(cn); }
      }
    }
    stepLift(dt) {
      const P = this.P, Xs = P['duel.blockSeconds'] || 0, b = this.body, v = P['proto.droneSpeed'] * dt;
      if (Xs <= 0 || !b) return;
      const L = this.lift;
      if (!L) { // the wait counts while the car stays stopped: a cone fetched and laid again does not restart it
        const two = !!P['duel.twoWay'], red = this.onRoad().find((q) => q.red && !q.spent); let c = two ? this.blocked() : red; // row 734: in traffic, a car the dummy keeps waiting (red first, then white)
        if (two && c) { this.blockCar = c.id; this.blockSeen = this.t; } else if (two && this.blockSeen != null && this.t - this.blockSeen < 3.5) { const k = this.carById(this.blockCar); if (k && !k.gone && k.v < 1) c = k; } // through a flicker (a white car passing, the three-second forget) it still counts
        const stopped = !!(c && b.alive && c.v < 1); this.blockT = stopped ? this.blockT + dt : 0;
        if (stopped && this.blockT >= Xs - 1e-9) {
          const sp = this.sidePoint(c); this.lift = { car: c.id, state: 'inbound', x: b.x, y: -40, sx: sp.x, sy: sp.y, tl: 0, t0: this.t };
          this.fetchBlockingCones(c);
          this.emit('block-lift', { car: c.id, wait: +this.blockT.toFixed(1), x: +b.x.toFixed(1), y: +b.y.toFixed(1), to: { x: +sp.x.toFixed(1), y: +sp.y.toFixed(1) } });
        }
        return;
      }
      const c = this.carById(L.car), go = (tx, ty) => { const dx = tx - L.x, dy = ty - L.y, d = hyp(dx, dy); if (d <= v) { L.x = tx; L.y = ty; return true; } L.x += dx / d * v; L.y += dy / d * v; return false; };
      if (L.state === 'inbound') { if (!b.alive || this.carPassed(c) || c.v >= 1) { L.state = 'outbound'; this.blockT = 0; return; } if (go(b.x, b.y) && b.mode !== 'lunge' && b.mode !== 'jump') { L.state = 'lifting'; L.tl = 0; } return; } // the car moved off first: the drone turns back. Mid-dash or mid-jump, it hovers
      if (L.state === 'lifting') { L.x = b.x; L.y = b.y; L.tl += dt; if (L.tl >= P['proto.droneLiftSeconds'] - 1e-9) { b.lifted = true; b.duck = false; L.state = 'carrying'; } return; }
      if (L.state === 'carrying' || L.state === 'holding') {
        if (L.state === 'carrying' && go(L.sx, L.sy)) L.state = 'holding';
        Object.assign(b, { x: L.x, y: L.y, vx: 0, vy: 0 });
        if (L.state === 'holding' && this.carPassed(c)) { L.state = 'lowering'; L.tl = 0; }
        return;
      }
      if (L.state === 'lowering') {
        Object.assign(b, { x: L.x, y: L.y, vx: 0, vy: 0 }); L.tl += dt;
        if (L.tl >= P['proto.droneLiftSeconds'] - 1e-9) { b.lifted = false; L.state = 'outbound'; this.blockT = 0; this.emit('block-drop', { x: +b.x.toFixed(1), y: +b.y.toFixed(1), held: +(this.t - L.t0).toFixed(1) }); }
        return;
      }
      L.y -= v; if (L.y < -60) this.lift = null; // outbound
    }
    stepDrones(dt) {
      super.stepDrones(dt);
      if (this.testRoad) this.stepLift(dt);
      const d = this.delivery, b = this.body, P = this.P;
      if (!this.testRoad || !d) return;
      const v = P['proto.droneSpeed'] * dt;
      if (d.state === 'inbound') {
        if (!b.alive) return;
        const dx = b.x - d.x, dy = b.y - d.y, dist = hyp(dx, dy);
        if (dist <= v) { d.x = b.x; d.y = b.y; d.state = 'lowering'; d.tl = 0; } else { d.x += dx / dist * v; d.y += dy / dist * v; }
      } else if (d.state === 'lowering') {
        if (b.alive) { d.x = b.x; d.y = b.y; }
        d.tl += dt;
        if (d.tl >= P['proto.droneLiftSeconds'] - 1e-9 && b.alive) { this.install(d.node); d.state = 'outbound'; }
      } else if (d.state === 'outbound') { d.y -= v; if (d.y < -60) this.delivery = null; }
    }
  }

  const api = { TestRoadSim, junctionLevel, runInFor, RUNGS, ROAD_A, ROAD_B };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DUMMIES_P10 = api;
})(typeof window !== 'undefined' ? window : globalThis);
