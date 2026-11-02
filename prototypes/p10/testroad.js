// Prototype 10.1 (GDD Edit 101; handover v2 §14; DECISIONS row 661): the Monument test road.
// One screen. Scenario A: two one-way roads cross at a junction, two lanes each. One car type, the sedan; the red car is the
// only car on the road, and it returns soon after it leaves (duel.redReturnSeconds). Rung 0: it learns nothing.
// Extends the base Sim from prototypes/p6/sim.js. Shared files are untouched, so Prototype 9's build keeps its md5.
// Runs in the browser (window.DUMMIES) and in node (require), so the probes run headless without a page.
(function (root) {
  'use strict';
  const X = typeof module !== 'undefined' && module.exports ? require('../p6/sim.js') : root.DUMMIES;

  // ---------- Scenario A: the Monument junction (field 800 × 640, ui.playWidth × ui.playHeight)
  // Road A runs west to east along y = ROAD_A; road B runs north to south along x = ROAD_B. Each is one-way, two lanes.
  const ROAD_A = 320, ROAD_B = 400;
  function junctionLevel(P) {
    const half = P['world.laneWidth'] / 2;
    const a = [[-200, ROAD_A], [1000, ROAD_A]], b = [[ROAD_B, -200], [ROAD_B, 840]];
    const lane = (c, off) => X.makePath(X.offsetPts(c, off));
    const lanes = [lane(a, half), lane(a, -half), lane(b, half), lane(b, -half)]; // A near, A far, B near, B far: all one-way
    lanes.forEach((p, i) => { p.road = i < 2 ? 'A' : 'B'; });
    const W = P['world.laneWidth']; // road A spans ROAD_A ± W; road B spans ROAD_B ± W
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
      lanes, statics, coneHomes: [[300, 470], [560, 470], [600, 242]],
      spawns: [{ x: 600, y: 520, f: -90 }, { x: 200, y: 520, f: -90 }, { x: 640, y: 120, f: 90 }],
      crossings: [{ road: 'A', x: 620 }], // a zebra on road A, east of the junction (drawn; cars do not stop for it in 10.1)
      barrierGap: { x: 160, y: ROAD_A + W + 12, w: 56 }, canal: true, gates: {}, theme: 'start', patches: [],
    };
  }

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
      this.emptySince = 0;
    }
    // The base driver swerves left into the next lane (an oncoming one on a two-way road) or right onto the shoulder
    // (proto.swerveOuter). On a one-way road of two lanes, the second lane's neighbour lies to its right: there, the reach
    // to the right is one lane (world.laneWidth), so it can pass by the next lane instead of waiting for ever.
    choose(c, tg, opts) {
      if (!this.testRoad || c.lane % 2 === 0) return super.choose(c, tg, opts);
      const P = this.P, keep = P['proto.swerveOuter'];
      P['proto.swerveOuter'] = P['world.laneWidth'];
      try { return super.choose(c, tg, opts); } finally { P['proto.swerveOuter'] = keep; }
    }
    onRoad() { return this.cars.filter((c) => !c.ghost && (c.layer == null || c.layer === 0)); }
    admit() {
      if (!this.testRoad) return super.admit();
      const P = this.P;
      if (this.onRoad().length >= P['duel.carsOnRoad']) { this.emptySince = null; return; }
      if (this.emptySince == null) this.emptySince = this.t;
      if (this.t - this.emptySince + 1e-9 < P['duel.redReturnSeconds']) return;
      const before = this.cars.length;
      this.nextAt = 0; // the test road's own pacing replaces the admission interval
      super.admit();
      if (this.cars.length > before) { const c = this.cars[this.cars.length - 1]; c.red = true; this.emptySince = null; }
    }
  }

  const api = { TestRoadSim, junctionLevel, ROAD_A, ROAD_B };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DUMMIES_P10 = api;
})(typeof window !== 'undefined' ? window : globalThis);
