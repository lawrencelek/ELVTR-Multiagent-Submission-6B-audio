// Prototype 10 (GDD Edits 101–102; handover v2 §14, §16): the Monument test road.
// One screen. Scenario A: two one-way roads cross at a junction, two lanes each. One car type, the sedan; the red car is the
// only car on the road, and it returns soon after it leaves (duel.redReturnSeconds).
// 10.1: rung 0, the red car learns nothing. 10.2: one lesson. A hit on its nose teaches rung 1, the forward camera.
// Extends the base Sim from prototypes/p6/sim.js. Shared files are untouched, so Prototype 9's build keeps its md5.
// Runs in the browser (window.DUMMIES) and in node (require), so the probes run headless without a page.
(function (root) {
  'use strict';
  const X = typeof module !== 'undefined' && module.exports ? require('../p6/sim.js') : root.DUMMIES;
  const hyp = Math.hypot;

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
  const RUNGS = [
    { rung: 0, name: 'Prototype', sensor: null, learnsFrom: [] },
    { rung: 1, name: 'Forward camera', sensor: 'FORWARD CAMERA', learnsFrom: ['front', 'frontDiagonal'] },
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
      this.lesson = null; this.lessons = []; this.delivery = null; this.firstBrakeT = null;
    }
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
      if (tg.kind === 'body' && !(opts && opts.pass) && this.rung >= 1 && c.v >= 1) {
        const b = this.body, q = X.pathAt(c.path, tg.s), vb = -(b.vx * q.tx + b.vy * q.ty), hard = this.P['traffic.hardBraking'];
        if (vb > 1) return { type: 'brake', v0: c.v, a: hard, vTarget: 0, emergency: true, closing: +vb.toFixed(1) };
        return { type: 'brake', v0: c.v, a: hard, vTarget: 0, standoff: true, env: true, sBody: tg.s };
      }
      const P = this.P, kl = P['world.laneWidth'], ko = P['proto.swerveOuter'], [lo, hi] = c.path.edges;
      P['world.laneWidth'] = -(lo + c.W / 2); P['proto.swerveOuter'] = hi - c.W / 2;
      try { return super.choose(c, tg, opts); } finally { P['world.laneWidth'] = kl; P['proto.swerveOuter'] = ko; }
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
        if (!c.red || c.ghost || !m || m.type !== 'brake' || m.emergency || c.cause !== 'body' || !hz || !hz.inPath || c.v < 1) continue;
        const q = X.pathAt(c.path, hz.s);
        if (-(b.vx * q.tx + b.vy * q.ty) > 1) { c.man = null; c.state = 'cruise'; }
      }
      return super.carAI(dt);
    }

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
      if (Math.round(this.P['duel.dashArrives'] || 0) === 1 && !this.dashFitted()) this.sendPart('battery1');
    }
    // Rung 1's answer to a dummy ahead is a brake for the body. The first one calls the dash by drone (duel.dashArrives 2):
    // the tool arrives where the problem is (World 1-1; handover v2 §9.5).
    commit(c, man, cause, tg) {
      super.commit(c, man, cause, tg);
      if (!this.testRoad || cause !== 'body' || !c.red || this.rung < 1 || this.firstBrakeT != null) return;
      this.firstBrakeT = this.t; this.emit('first-brake', { car: c.id, model: c.model });
      if (Math.round(this.P['duel.dashArrives'] || 0) === 2 && !this.dashFitted()) this.sendPart('battery1');
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
