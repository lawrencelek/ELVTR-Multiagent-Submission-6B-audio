// Prototype 10 (GDD Edits 101–102; handover v2 §14, §16): the Monument test road.
// One screen. Scenario A: two one-way roads cross at a junction, two lanes each. One car type, the sedan; the red car is the
// only car on the road, and it returns soon after it leaves (duel.redReturnSeconds).
// 10.1: rung 0, the red car learns nothing. 10.2: one lesson. A hit on its nose teaches rung 1, the forward camera.
// 10.3: from rung 1, a hit from the side teaches rung 2, the side sensors. Battery 1 from the start; Legs 1, the jump, arrives.
// 10.4: from rung 2, a hit from above teaches rung 3, the roof lidar: it sees height. Both parts from the start.
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
  const ROAD_A = 320, ROAD_B = 400;
  const runInFor = (P) => Math.max(P['world.spawnLeadIn'], Math.ceil(P['perception.forwardLength'] + P['vehicles.sedan.length']));
  function junctionLevel(P) {
    const half = P['world.laneWidth'] / 2, R = runInFor(P), out = P['world.spawnLeadIn'];
    const a = [[-R, ROAD_A], [P['world.width'] + out, ROAD_A]], b = [[ROAD_B, -R], [ROAD_B, P['world.height'] + out]];
    const lane = (c, off) => X.makePath(X.offsetPts(c, off));
    const lanes = [lane(a, half), lane(a, -half), lane(b, half), lane(b, -half)]; // A near, A far, B near, B far: all one-way
    const W = P['world.laneWidth']; // road A spans ROAD_A ± W; road B spans ROAD_B ± W
    lanes.forEach((p, i) => {
      p.road = i < 2 ? 'A' : 'B'; p.enterS = R; // where the lane meets the screen's edge
      // 10.2 (row 670): the road's kerbs, as lateral offsets from this lane's centre. They bound every swerve and pass.
      const e = p.road === 'A' ? [[300, ROAD_A - W], [300, ROAD_A + W]] : [[ROAD_B - W, 300], [ROAD_B + W, 300]];
      const lat = e.map(([x, y]) => X.pathProject(p, x, y).lat);
      p.edges = [Math.min(...lat), Math.max(...lat)];
    });
    const statics = [
      // NW: the monument's plinth, a raised edge to jump from (height ≤ world.jumpableHeight)
      { x: 230, y: 150, w: 90, h: 90, kind: 'block', height: P['world.jumpableHeight'], plinth: true },
      // NE: a building on the corner. It hides road A's approach from road B's cars, and road B's from road A's: the blind corner
      { x: 488, y: 40, w: 200, h: 180, kind: 'block', height: 110 },
      // SW: a barrier along road A's south kerb, with a gap to step through
      { x: 40, y: ROAD_A + W + 12, w: 120, h: 8, kind: 'jersey' }, { x: 216, y: ROAD_A + W + 12, w: 120, h: 8, kind: 'jersey' },
    ].map((s, i) => Object.assign({ id: 's' + i }, s));
    return {
      id: 'junction', key: 'junction', name: 'Monument junction', blurb: 'Two one-way roads cross. One red car learns from you.',
      center: a, centers: [a, b], roads: [{ id: 'A', axis: 'x', at: ROAD_A, half: W }, { id: 'B', axis: 'y', at: ROAD_B, half: W }],
      lanes, statics, coneHomes: [[300, 470], [560, 470], [600, 242]], runIn: R,
      spawns: [{ x: 600, y: 520, f: -90 }, { x: 200, y: 520, f: -90 }, { x: 640, y: 120, f: 90 }],
      crossings: [{ road: 'A', x: 620 }], // a zebra on road A, east of the junction (drawn; cars do not stop for it yet)
      barrierGap: { x: 160, y: ROAD_A + W + 12, w: 56 }, canal: true, gates: {}, theme: 'start', patches: [],
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
  // hit from above teaches it (high): a jump, or a dash from the plinth. A hit from cover teaches nothing it can use.
  // Each rung brings the dummy a part by drone (part, partKey): when that value is 1, as the lesson ends; 2, the first
  // time the car uses the new rung against the dummy (trigger); 3, fitted from the start.
  const RUNGS = [
    { rung: 0, name: 'Prototype', sensor: null, learnsFrom: [] },
    { rung: 1, name: 'Forward camera', sensor: 'FORWARD CAMERA', learnsFrom: ['front', 'frontDiagonal'], part: 'battery1', partKey: 'duel.dashArrives', trigger: 'first-brake' },
    { rung: 2, name: 'Side sensors', sensor: 'SIDE SENSORS', learnsFrom: ['front', 'frontDiagonal', 'side', 'rearDiagonal'], part: 'legs1', partKey: 'duel.jumpArrives', trigger: 'first-side' },
    { rung: 3, name: 'Roof lidar', sensor: 'ROOF LIDAR', learnsFrom: ['front', 'frontDiagonal', 'side', 'rearDiagonal'], high: true },
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
      this.schedule = Array.from({ length: P['run.appearances.road'] }, (_, i) => ({ i, cls: 'sedan', lane: Math.floor(g(i, 0.31) * n), mult: 1 }));
      this.leftAt = 0; // when the red car last left the screen
      this.rung = Math.max(0, Math.min(RUNGS.length - 1, Math.round(P['duel.startRung'] || 0))); // the red car's rung
      this.lesson = null; this.lessons = []; this.delivery = null; this.firstBrakeT = null; this.firstSideT = null;
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
      if (this.rung < 3 && (this.airborne() || this.body.raised)) return null; // it sees the ground: not the air, not the plinth's top
      const P = this.P, keep = P['proto.driver.cautionZone'];
      P['proto.driver.cautionZone'] = this.fieldFor();
      try { return super.assessBody(c); } finally { P['proto.driver.cautionZone'] = keep; }
    }
    manSpeed(c, man, tau, sAt) {
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
        if (this.rung >= 2 && this.watchField(c, dt)) continue;
        if (!m || m.type !== 'brake' || m.emergency || c.cause !== 'body' || !hz || !hz.inPath || c.v < 1) continue;
        const q = X.pathAt(c.path, hz.s);
        if (-(b.vx * q.tx + b.vy * q.ty) > 1) { c.man = null; c.state = 'cruise'; }
      }
      return super.carAI(dt);
    }
    // The field's width: rung 2 and up. Below, the car has no field (10.1, 10.2: proto.driver.cautionZone 0 by rung).
    fieldFor() { return this.rung >= 2 ? this.P['proto.driver.cautionZone'] : 0; }
    // ----- rung 2: the dummy in its field, beside its path (in its path is the beam's: rung 1's brake)
    watchField(c, dt) {
      const P = this.P, b = this.body, hz = c.hz;
      const side = !!(hz && !hz.inPath && b.alive), wasHolding = c.cause === 'side' && !!c.man;
      c.fieldT = side ? (c.fieldT || 0) + dt : 0;
      c.noticed = side && c.fieldT >= P['perception.sideNoticeSeconds'] - 1e-9;
      if (!c.noticed) { c.sideHonk = false; c.sideHoldT = 0; if (wasHolding && c.v < 1) { c.man = null; c.state = 'cruise'; } return false; }
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
      if (this.lesson) return; // a lesson is due or showing: the car is away being trained
      if (this.onRoad().length >= P['duel.carsOnRoad']) return;
      if (this.t + 1e-9 < this.leftAt + P['duel.redReturnSeconds'] - this.driveIn()) return; // it appears R after the last left, or as soon as it can drive in
      const before = this.cars.length, keep = P['perception.forwardLength'];
      this.nextAt = 0; // the test road's own pacing replaces the admission interval
      P['perception.forwardLength'] = this.beamFor(); // newCar reads its beam from here
      try { super.admit(); } finally { P['perception.forwardLength'] = keep; }
      if (this.cars.length > before) {
        const c = this.cars[this.cars.length - 1]; c.red = true; c.rung = this.rung;
        if (this.rung >= 1) c.standoff = this.envelope(0); // its stop line: honks and holds there
      }
    }
    exitCars() {
      super.exitCars();
      if (!this.testRoad) return;
      const P = this.P, W = P['world.width'], H = P['world.height'];
      for (const c of this.cars) {
        if (c.gone || c.ghost || c.s < c.path.enterS) continue;
        const m = c.L / 2 + c.W;
        if (c.x < -m || c.x > W + m || c.y < -m || c.y > H + m) { c.gone = true; this.leftAt = this.t; this.emit('left', { car: c.id, model: c.model }); }
      }
    }

    // ----- the jump on the test road (10.3): Prototype 6.5's rules (world6.js, Edit 75), on the base sim. A running or dash
    // jump passes over a car while the dummy is above its roof (vehicles.<cls>.height); below it, it strikes as a dash does.
    // The monument's plinth is a raised edge (world.jumpableHeight): a jump that tops it lands on it; walking off its edge
    // steps down. Standing on it, the dummy is above the ground the sensors watch.
    plinth() { return this.level.statics.find((st) => st.plinth) || null; }
    onPlinth(x, y) { const st = this.plinth(); return !!st && x >= st.x && x <= st.x + st.w && y >= st.y && y <= st.y + st.h; }
    // A dummy standing on the plinth stands above it: the plinth does not hide it from a car that sees height (rung 3).
    occluded(self, x0, y0, x1, y1) {
      const b = this.body;
      if (!this.testRoad || !b || !b.raised || x1 !== b.x || y1 !== b.y) return super.occluded(self, x0, y0, x1, y1);
      const keep = this.level.statics, st = this.plinth(); this.level.statics = keep.filter((q) => q !== st);
      try { return super.occluded(self, x0, y0, x1, y1); } finally { this.level.statics = keep; }
    }
    // A hit from above: a jump's strike, or a dash launched from the plinth (or a jump out of one).
    fromAbove(e) { const b = this.body; return e.kind === 'jump' || !!(b && ((b.lunge && b.lunge.fromRaised) || (b.jump && b.jump.fromRaised))); }
    startLunge(facing0, k) { const b = this.body, up = !!b.raised; super.startLunge(facing0, k); if (this.testRoad && b.lunge) b.lunge.fromRaised = up; }
    tryJump() { const b = this.body, up = !!b.raised; super.tryJump(); if (this.testRoad && b.mode === 'jump' && b.jump) { b.jump.fromRaised = up; b.raised = false; } }
    landJump() { const b = this.body; super.landJump(); if (this.testRoad) { b.raised = this.onPlinth(b.x, b.y); if (b.raised) this.emit('raised', { x: +b.x.toFixed(1), y: +b.y.toFixed(1) }); } }
    collideBody(contacts, k) {
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
      const e0 = this.events.length, positive = super.account(keep);
      for (const e of this.events.slice(e0)) if (e.type === 'impact' && e.lost > 0) this.learnFrom(e);
      return positive;
    }
    // Beat 1, the cause: a damaging hit on the part the next rung guards. The lesson shows once the car has left the screen.
    learnFrom(e) {
      const c = this.carById(e.car), next = RUNGS[this.rung + 1];
      if (!c || !c.red || this.lesson || !next || this.rung >= Math.round(this.P['duel.topRung'] || 0) || !next.learnsFrom.includes(e.zone)) return;
      if (next.high && !this.fromAbove(e)) return; // rung 3 learns only from a hit from above
      this.lesson = { state: 'due', from: this.rung, to: next.rung, name: next.name, sensor: next.sensor, model: c.model, car: c.id, zone: e.zone, kind: e.kind, hitT: e.t, lost: e.lost };
      this.emit('lesson-due', { model: c.model, from: this.rung, to: next.rung, zone: e.zone, car: c.id });
    }
    step(cmd) {
      if (this.testRoad && this.phase === 'play' && this.lesson && this.lesson.state === 'due' && this.body.alive && !this.onRoad().some((c) => c.red)) {
        // Beats 1–2 on screen: the training clip, then the sensor fitted. The sim waits in phase 'lesson' (continueLesson).
        this.lesson.state = 'showing'; this.lesson.shownT = this.t; this.phase = 'lesson';
        this.emit('lesson', { model: this.lesson.model, from: this.lesson.from, to: this.lesson.to, name: this.lesson.name, zone: this.lesson.zone });
        return;
      }
      return super.step(cmd);
    }
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
    stepDrones(dt) {
      super.stepDrones(dt);
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
