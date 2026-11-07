// Prototype 10 probes on the Monument test road (handover v2 §14, §16; GDD Edits 101–102). Headless in node: the base Sim
// and prototypes/p10/testroad.js, with a test's values (prototypes/p10/sim_flags.json, by stage). One runner covers what
// qa/stand.js, qa/policy.js, qa/escalation.js and qa/flank.js measure on Prototype 9: standing, walking in, charging, dashing,
// the flank, escalation. Two modes: 'lesson' starts where the build starts (10.2: rung 0, on foot); 'trained' starts at
// the build's top rung with Battery 1 fitted, to measure that rung alone.
//   node qa/testroad.js [--stage 10.2] [--secs 300] [--esc 600] [--offsets 0,7,13] [--out qa/baseline/p10_2.json]
//   Experiments: [--only gap,jump] runs only those bots (and their escalation); [--set id=value,...] overrides registry values;
//   [--trace 1] prints each run's events and, every second, the dummy, the cones and the red car.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const X = require(path.join(ROOT, 'prototypes/p6/sim.js'));
const { TestRoadSim } = require(path.join(ROOT, 'prototypes/p10/testroad.js'));
const SF = JSON.parse(fs.readFileSync(path.join(ROOT, 'prototypes/p10/sim_flags.json'), 'utf8'));
const o = { stage: SF.current, secs: 300, esc: 600, offsets: [0, 7, 13], out: null, only: null, set: null };
const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) { const k = av[i].replace(/^--/, ''), v = av[i + 1]; if (k === 'offsets') o.offsets = v.split(',').map(Number); else if (k === 'only') o.only = v.split(','); else if (k === 'set') o.set = Object.fromEntries(v.split(',').map((q) => q.split('=')).map(([a, b]) => [a, +b])); else if (k === 'out' || k === 'stage') o[k] = v; else o[k] = +v; }
const ST = SF.stages[o.stage], FLAGS = Object.assign({}, ST.flags, o.set || {});
const DEG = Math.PI / 180, wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

// Policies. Closed (rung 1): stand*, charge. Open: walkin (on foot), aim and flank (the dash).
const POLICIES = {
  stand: { home: { x: 200, y: 292 } },      // in road A's north lane (lane 1), on its line, west of the junction
  standSouth: { home: { x: 200, y: 348 } }, // in road A's south lane (lane 0), on its line
  standOff: { home: { x: 200, y: 300 } },   // in the north lane, 8 off its line toward the other lane (D105)
  charge: { home: { x: 600, y: 292 } },     // waits in the north lane; sprints head-on at each car in it, dashes in reach, steps off
  walkin: { home: { x: 300, y: 410 } },     // waits on the pavement; walks into the red car's path, 110 ahead of it: late, from the side
  wander: { home: { x: 400, y: 320 } },     // P3's scripted dummy
  aim: { home: { x: 300, y: 410 } },        // from the pavement, dashes at the nearest car within 150 (10.0's read and lunge)
  flank: { home: { x: 300, y: 410 } },      // comes alongside a moving car, dashes into its side
  jump: { home: { x: 300, y: 410 }, from: 10.3 },     // with Legs 1: runs at a passing car, jumps into it from close
  dashjump: { home: { x: 300, y: 410 }, from: 10.3 }, // with Legs 1: dashes at a passing car, jumps out of the dash
  corner: { home: { x: 497, y: 232 }, from: 10.3 },   // on foot: waits behind the building's corner; steps out at a road B car
  kerb: { home: { x: 600, y: 392 }, from: 10.3 },     // waits at the open kerb, east of the junction; dashes at a road A car in reach
  flankOpen: { home: { x: 600, y: 440 }, from: 10.3 },// the flank bot, from open pavement (no cover)
  gap: { home: { x: 188, y: 414 }, from: 10.3 },      // waits behind the barrier at its gap; dashes through it at a road A car
  plinth: { home: { x: 275, y: 226 }, from: 10.3 },   // jumps up on the plinth; dashes down from its edge at a road A car
  conebait: { home: { x: 188, y: 414 }, from: 10.5 }, // the gap until Hands 1; then lays a cone ahead of the car waiting for it, steps out of its field, strikes as it swerves round the cone
  planter: { home: { x: 188, y: 414 }, from: 10.6 },  // the cone bait (from its home) until DUCK; then ducks behind the planter row south of road A, east (SPOT); springs at a passing car
  standplanter: { home: { x: 590, y: 418 }, from: 10.6 }, // the same spot, standing: the row hides only a ducked dummy
  lurk: { home: { x: 660, y: 576 }, from: 10.3 },     // waits past every field's edge, south-east; sprints in as a car passes in road A's south lane, dashes before the field notices
  peek: { home: { x: 617, y: 421 }, from: 10.8 },     // stands in view at a free spot behind a row for the car's road; once the car has noticed it, ducks and springs as it passes
  peekmove: { home: { x: 617, y: 421 }, from: 10.8 }, // the same, but once ducked it crawls to a free spot beyond duel.searchRadius of where it was seen, then springs
  roam: { home: { x: 501, y: 421 }, from: 10.7 },     // the planter ambush from a spot the car does not remember: it reads the red rings (rung 6) and moves to the nearest free spot behind a row for the car's road
  brakecheck: { home: { x: 560, y: 250 }, from: '10.10' }, // row 740: waits at road A's north kerb, east of the junction; steps into the lane in front of a red car with a white car on its tail
  lure: { home: { x: 501, y: 421 }, from: 10.8 },     // row 726: the lure. Stands at a remembered spot (rung 6: the car expects it there) or in view at a free one (rung 7: a ghost), until the car stops for it; then crawls to a free spot downstream, beyond duel.searchRadius, and strikes as the car passes
};
// 10.7: the spots behind the planter rows, by the road whose cars they ambush. The corner (501, 421) serves both roads.
const ROAM = { A: [[50, 203], [110, 203], [170, 203], [501, 421], [559, 421], [617, 421]], B: [[501, 421], [501, 481], [501, 541]] }; // about duel.memoryRadius apart and more

function run(policy, offset, secs, mode) {
  const pol = POLICIES[policy], trained = mode === 'trained';
  const parts = { battery1: true }; if (FLAGS['duel.topRung'] >= 2) parts.legs1 = true; if (FLAGS['duel.topRung'] >= 4) parts.hands1 = true; if (FLAGS['duel.topRung'] >= 5) parts.duck1 = true; // trained: every part its rungs bring
  const s = new TestRoadSim(Object.assign({}, FLAGS, trained ? { 'duel.startRung': FLAGS['duel.topRung'] } : {}), trained ? { owned: parts } : null);
  const service = () => { if (s.phase === 'report') s.continueReport(); else if (s.phase === 'shop') s.leaveShop(); else if (s.phase === 'lesson') s.continueLesson(); };
  for (let k = 0; k < offset * 60; k++) { service(); s.step({}); }
  const b = () => s.body, home = pol.home, can = () => s.dashFitted() && b().mode !== 'lunge' && b().mode !== 'recover';
  const goTo = (tx, ty, k) => { const dx = tx - b().x, dy = ty - b().y, d = Math.hypot(dx, dy); return d > 6 ? { mx: dx / d * (k || 1), my: dy / d * (k || 1) } : {}; };
  const live = () => s.onRoad().filter((c) => !c.spent && !c.white); // row 734: the bots play the red car; white traffic is in the way
  const NAVG = (() => { // the statics' corners, pushed out past the dummy's radius, and which see each other
    const E = 12, F = E + 6, W = s.P['world.width'], H = s.P['world.height'], st = s.level.statics;
    const inBox = (x, y, q) => x > q.x - E && x < q.x + q.w + E && y > q.y - E && y < q.y + q.h + E;
    const clear = (x0, y0, x1, y1, skip) => { for (const q of st) { if (q === skip) continue; for (let k = 0; k <= 32; k++) { const u = k / 32; if (inBox(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, q)) return false; } } return true; };
    const pts = []; for (const q of st) for (const [x, y] of [[q.x - F, q.y - F], [q.x + q.w + F, q.y - F], [q.x - F, q.y + q.h + F], [q.x + q.w + F, q.y + q.h + F]]) if (x > 4 && x < W - 4 && y > 4 && y < H - 4 && !st.some((r) => inBox(x, y, r))) pts.push([x, y]);
    const see = pts.map((p) => pts.map((q) => p !== q && clear(p[0], p[1], q[0], q[1])));
    return { pts, see, clear, inBox, st, passed: new Map() };
  })();
  const nav = (tx, ty) => { // goTo, round the statics (the barrier through its gap or past an end, the building, the plinth): the first corner on the shortest way
    const { pts, see, clear, inBox, st } = NAVG, bx = b().x, by = b().y, from = st.find((q) => inBox(bx, by, q)), to = st.find((q) => inBox(tx, ty, q));
    const ok = (x0, y0, x1, y1) => clear(x0, y0, x1, y1, from) && (!to || clear(x0, y0, x1, y1, to) || true);
    if (clear(bx, by, tx, ty, from === to ? from : null) || (from && from === to)) return goTo(tx, ty);
    const n = pts.length, dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false);
    for (let i = 0; i < n; i++) if (Math.hypot(pts[i][0] - bx, pts[i][1] - by) > 4 && ok(bx, by, pts[i][0], pts[i][1])) dist[i] = Math.hypot(pts[i][0] - bx, pts[i][1] - by);
    let best = -1, bestD = Infinity;
    for (;;) {
      let u = -1; for (let i = 0; i < n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0) break; done[u] = true;
      if (clear(pts[u][0], pts[u][1], tx, ty, to)) { const d = dist[u] + Math.hypot(tx - pts[u][0], ty - pts[u][1]); if (d < bestD) { bestD = d; best = u; } }
      for (let v = 0; v < n; v++) if (see[u][v] && dist[u] + Math.hypot(pts[v][0] - pts[u][0], pts[v][1] - pts[u][1]) < dist[v]) { dist[v] = dist[u] + Math.hypot(pts[v][0] - pts[u][0], pts[v][1] - pts[u][1]); prev[v] = u; }
    }
    if (best < 0) return goTo(tx, ty);
    const way = []; for (let k = best; k >= 0; k = prev[k]) way.unshift(k);
    for (const k of way) if (Math.hypot(pts[k][0] - bx, pts[k][1] - by) < 9) NAVG.passed.set(k, s.t); // reached: passed for a while, so the dummy never turns back to it
    while (way.length && NAVG.passed.has(way[0]) && s.t - NAVG.passed.get(way[0]) < 1.5) way.shift();
    return way.length ? goTo(pts[way[0]][0], pts[way[0]][1]) : goTo(tx, ty);
  };
  const done = new Set(); let cur = null, tries = 0, climb = null, layStage = 0, roamT = null, pk = null, lu = null;
  const lureTook = new Set(); let lureRemembered = 0, lureGhost = 0; // row 726: cars that stopped for the lure; at a remembered spot; for a ghost
  if (policy === 'charge') { b().x = home.x; b().y = home.y; for (const c of s.cars) done.add(c.id); } // it starts in its lane, and charges only cars that arrive after it
  if (s.P['duel.runInLength'] > 0 && /^stand(South|Off)?$/.test(policy)) { b().x = home.x; b().y = home.y; } // 10.7's short run-in: the first car would meet it still walking to its spot; it stands there from the start
  const SPOT = { x: 590, y: 418 }; // behind the planter row south of road A, east
  const back = () => { // to SPOT: past the row's east end when on its road side
    const x = b().x, y = b().y;
    if (x > 492 && x < 700 && y > 330 && y < 412) return y < 388 && x < 640 ? goTo(652, 380) : goTo(646, 428); // north of it, east to its end; then down past the end
    return nav(SPOT.x, SPOT.y);
  };
  const act = {
    stand: () => nav(home.x, home.y), standSouth: () => nav(home.x, home.y), standOff: () => nav(home.x, home.y), // round the statics (10.6's planters)
    charge: () => {
      const c = s.onRoad().find((q) => q.lane === 1 && !done.has(q.id));
      if (!b().alive) return {};
      if (c && c.spent) { done.add(c.id); if (cur === c.id) cur = null; }
      if (!c || c.spent) { const g = s.onRoad().find((q) => done.has(q.id)); return g ? goTo(b().x, 420) : goTo(home.x, home.y); }
      const nx = c.x + Math.cos(c.h) * c.L / 2, gap = b().x - nx;
      if (cur !== c.id && gap > 0 && nx > -c.L && Math.abs(b().y - home.y) < 6) { cur = c.id; tries++; }
      if (cur !== c.id) return goTo(home.x, home.y);
      if (b().mode === 'recover' || (c.v < 1 && gap < 40) || gap < -c.L) { done.add(c.id); cur = null; return goTo(b().x, 420); }
      const ang = Math.atan2(c.y - b().y, nx - b().x);
      return { mx: Math.cos(ang), my: Math.sin(ang), aPress: can() && gap < s.reach() + 13 };
    },
    walkin: () => {
      const c = s.onRoad().find((q) => q.red);
      if (!c || !b().alive) return goTo(home.x, home.y);
      const p = X.pathAt(c.path, c.s + c.L / 2 + 110);
      if (p.x < 20 || p.x > 780 || p.y < 20 || p.y > 620) return goTo(home.x, home.y);
      return goTo(p.x, p.y);
    },
    wander: (i) => { if (!b().alive) return {}; const tx = 400 + 300 * Math.sin(i / 400), ty = 320 + 90 * Math.sin(i / 170), dx = tx - b().x, dy = ty - b().y, d = Math.hypot(dx, dy); return d > 8 ? { mx: dx / d, my: dy / d } : {}; },
    aim: () => {
      if (!b().alive) return {};
      let best = null;
      for (const c of live()) { const tx = c.x + (c.vx || 0) * 0.12, ty = c.y + (c.vy || 0) * 0.12, d = Math.hypot(tx - b().x, ty - b().y); if (d < 150 && (!best || d < best.d)) best = { tx, ty, d }; }
      if (!best) return goTo(home.x, home.y);
      const ang = Math.atan2(best.ty - b().y, best.tx - b().x), off = Math.abs(wrap(ang - b().facing));
      return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: can() && off < 12 * DEG };
    },
    jump: () => {
      if (!b().alive) return {};
      let best = null;
      for (const c of live()) { const d = Math.hypot(c.x - b().x, c.y - b().y); if (d < 260 && c.v > 15 && (!best || d < best.d)) best = { c, d }; }
      if (!best) return goTo(home.x, home.y);
      const c = best.c, tx = c.x + (c.vx || 0) * 0.25, ty = c.y + (c.vy || 0) * 0.25, ang = Math.atan2(ty - b().y, tx - b().x), d = Math.hypot(tx - b().x, ty - b().y);
      const run = Math.hypot(b().vx, b().vy) > s.P['movement.walkSpeed'] * 1.06;
      return { mx: Math.cos(ang), my: Math.sin(ang), bPress: s.has('jump') && run && d < 70 && b().mode !== 'jump' };
    },
    dashjump: () => {
      if (!b().alive) return {};
      let best = null;
      for (const c of live()) { const tx = c.x + (c.vx || 0) * 0.2, ty = c.y + (c.vy || 0) * 0.2, d = Math.hypot(tx - b().x, ty - b().y); if (d < 230 && c.v > 15 && (!best || d < best.d)) best = { tx, ty, d }; }
      if (!best) return goTo(home.x, home.y);
      const ang = Math.atan2(best.ty - b().y, best.tx - b().x), off = Math.abs(wrap(ang - b().facing));
      if (b().mode === 'lunge') return { bPress: s.has('jump') && b().lunge && b().lunge.t > 0.04 };
      return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: can() && off < 12 * DEG && best.d < 200 };
    },
    brakecheck: () => { // row 740: make it stop hard; the white car behind does the rest
      if (!b().alive) return {};
      const c = live().find((q) => q.path.road === 'A' && q.path.dir > 0 && q.x + q.L / 2 < b().x && !done.has(q.id));
      if (!c) return goTo(home.x, home.y);
      const tail = s.onRoad().find((o) => o.white && o.path === c.path && o.s < c.s && (c.s - c.L / 2) - (o.s + o.L / 2) < Math.max(20, o.v) * 1.2), gap = b().x - (c.x + c.L / 2);
      if (c.v < 1 || s.events.slice(-30).some((e) => e.type === 'incident' && e.car === c.id)) { done.add(c.id); return goTo(home.x, home.y); }
      if (tail && gap < 150 && gap > c.L && Math.abs(b().y - home.y) < 8 && can()) return { mx: 0, my: 1, aPress: true }; // into its lane, late
      return Math.abs(b().y - home.y) < 8 ? {} : goTo(home.x, home.y);
    },
    kerb: () => {
      if (!b().alive) return {};
      const c = live().find((q) => q.path.road === 'A' && q.x < b().x + 40);
      if (!c) return goTo(home.x, home.y);
      const tx = c.x + (c.vx || 0) * 0.12, ty = c.y + (c.vy || 0) * 0.12, d = Math.hypot(tx - b().x, ty - b().y), ang = Math.atan2(ty - b().y, tx - b().x), off = Math.abs(wrap(ang - b().facing));
      if (d > 165) return Object.assign(goTo(home.x, home.y), Math.hypot(home.x - b().x, home.y - b().y) < 7 ? { mx: Math.cos(ang) * 0.05, my: Math.sin(ang) * 0.05 } : {});
      return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: can() && off < 15 * DEG };
    },
    gap: () => {
      if (!b().alive) return {};
      const c = live().find((q) => q.path.road === 'A' && q.x + (q.vx || 0) * 0.15 > 140 && q.x + (q.vx || 0) * 0.15 < 236);
      if (!c) return Object.assign(goTo(home.x, home.y), Math.hypot(home.x - b().x, home.y - b().y) < 7 ? { mx: 0, my: -0.05 } : {});
      const tx = c.x + (c.vx || 0) * 0.15, ty = c.y, ang = Math.atan2(ty - b().y, tx - b().x), off = Math.abs(wrap(ang - b().facing));
      return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: can() && off < 15 * DEG };
    },
    conebait: () => {
      if (!b().alive) return {};
      if (!s.has('carry')) return act.gap();
      const P = s.P, W = P['world.width'], H = P['world.height'], c = live()[0], LURK = P['proto.driver.cautionZone'] + 40; // the red car; past its field's edge
      const frame = (x, y) => { const ca = Math.cos(c.h), sa = Math.sin(c.h), dx = x - c.x, dy = y - c.y; return { fx: dx * ca + dy * sa, fy: -dx * sa + dy * ca }; };
      const ahead = (cn) => { if (cn.state !== 'free') return false; const q = frame(cn.x, cn.y); return q.fx > c.L / 2 && Math.abs(q.fy) < c.W / 2 + P['props.cone.radius']; };
      const placed = c ? s.cones.find((cn) => cn.state === 'free' && ((c.dodge && c.dodge.id === cn.id) || ahead(cn))) : null; // in its lane ahead, or the one it swerves round
      if (b().held) {
        if (c && c.v < 1 && (c.noticed || (c.hz && c.hz.inPath))) { // it waits for the dummy: lay the cone in its lane, ahead of its nose, on screen
          const ca = Math.cos(c.h), sa = Math.sin(c.h); let k = c.L / 2 + 70, tx, ty;
          const on = (x, y) => x > 14 && x < W - 14 && y > 14 && y < H - 14;
          do { tx = c.x + ca * k; ty = c.y + sa * k; k += 10; } while (!(on(tx, ty) && on(tx - ca * 44, ty - sa * 44)) && k < 700); // the spot, and the run-up to it, on screen
          const p1x = tx - ca * 44, p1y = ty - sa * 44, p2x = tx - ca * 16, p2y = ty - sa * 16; // come at the spot along its lane, so the dummy faces along it
          if (layStage === 0) { if (Math.hypot(p1x - b().x, p1y - b().y) < 8) layStage = 1; else return nav(p1x, p1y); }
          if (Math.hypot(p2x - b().x, p2y - b().y) >= 7) return goTo(p2x, p2y);
          const rp = s.releasePoint(), q = frame(rp.x, rp.y);
          if (!(q.fx > c.L / 2 + 20 && Math.abs(q.fy) < c.W / 2 + 4)) { layStage = 0; return {}; } // facing wrong: come round again
          return Math.hypot(b().vx, b().vy) < 12 ? { xPress: true } : {}; // stopped first: a moving dummy punts the cone it puts down
        }
        layStage = 0; return nav(home.x, home.y); // behind the barrier: its cameras see the dummy, so it stops and waits
      }
      if (placed) {
        if (c.cause === 'cone' && c.dodge) { // it swerves round the cone and holds its line: strike
          const tx = c.x + (c.vx || 0) * 0.2, ty = c.y + (c.vy || 0) * 0.2, d = Math.hypot(tx - b().x, ty - b().y), ang = Math.atan2(ty - b().y, tx - b().x), off = Math.abs(wrap(ang - b().facing));
          return { mx: Math.cos(ang), my: Math.sin(ang), aPress: can() && off < 15 * DEG && d < s.reach() + 8 };
        }
        const dc = Math.hypot(b().x - placed.x, b().y - placed.y);
        if (dc < 30) { const k = 1 / (dc || 1); return { mx: (b().x - placed.x) * k, my: (b().y - placed.y) * k }; } // step back off the cone: never punt it
        const nx = -Math.sin(c.h), ny = Math.cos(c.h), lat = (b().x - c.x) * nx + (b().y - c.y) * ny; // out of its field, straight off its lane
        let sd = lat >= 0 ? 1 : -1, px = b().x - nx * lat + nx * sd * LURK, py = b().y - ny * lat + ny * sd * LURK;
        if (px < 10 || px > W - 10 || py < 10 || py > H - 10) { sd = -sd; px = b().x - nx * lat + nx * sd * LURK; py = b().y - ny * lat + ny * sd * LURK; }
        return nav(px, py);
      }
      const cn = s.cones.filter((q) => q.state === 'free' && q !== placed).sort((p, q) => Math.hypot(p.x - b().x, p.y - b().y) - Math.hypot(q.x - b().x, q.y - b().y))[0];
      if (!cn) return nav(home.x, home.y);
      return Math.hypot(cn.x - b().x, cn.y - b().y) < P['body.radius'] + P['props.cone.radius'] + 8 ? { xPress: true } : nav(cn.x, cn.y);
    },
    planter: () => { // DUCK behind low cover: hidden from the car's sensors, it springs as the car passes in reach
      if (!b().alive) return {};
      if (!s.has('duck1')) return act.conebait();
      const c = live().find((q) => q.v > 15), atSpot = Math.hypot(SPOT.x - b().x, SPOT.y - b().y) < 8;
      if (c && atSpot) {
        const tx = c.x + (c.vx || 0) * 0.15, ty = c.y + (c.vy || 0) * 0.15, d = Math.hypot(tx - b().x, ty - b().y), ang = Math.atan2(ty - b().y, tx - b().x);
        if (d < s.reach() + 6 && can()) return { mx: Math.cos(ang) * 0.3, my: Math.sin(ang) * 0.3, aPress: true, duck: true };
      }
      if (!atSpot) return back();
      return { duck: true };
    },
    standplanter: () => {
      if (!b().alive) return {};
      const c = live().find((q) => q.v > 15), atSpot = Math.hypot(SPOT.x - b().x, SPOT.y - b().y) < 8;
      if (c && atSpot) {
        const tx = c.x + (c.vx || 0) * 0.15, ty = c.y + (c.vy || 0) * 0.15, d = Math.hypot(tx - b().x, ty - b().y), ang = Math.atan2(ty - b().y, tx - b().x);
        if (d < s.reach() + 6 && can()) return { mx: Math.cos(ang) * 0.3, my: Math.sin(ang) * 0.3, aPress: true };
      }
      return atSpot ? {} : back();
    },
    roam: () => { // the planter ambush, moving on: the nearest spot behind a row for the car's road that it does not remember
      if (!b().alive) return {};
      if (!s.has('duck1')) return act.conebait();
      const c = live().find((q) => q.red), R = s.P['duel.memoryRadius'] || 0, mem = s.memory();
      const free = (q) => !mem.some((m) => Math.hypot(q[0] - m.ox, q[1] - m.oy) <= R + 1e-9);
      const near = (L) => L.slice().sort((p, q) => Math.hypot(p[0] - b().x, p[1] - b().y) - Math.hypot(q[0] - b().x, q[1] - b().y))[0];
      const all = ROAM.A.concat(ROAM.B).filter(free), ok = (c ? ROAM[c.path.road] : []).filter(free);
      if (c && ok.length) { if (!roamT || !ok.includes(roamT)) roamT = near(ok); } // a free spot for the car's road
      else if (!roamT || !free(roamT)) roamT = all.length ? near(all) : null;   // none: wait at a free spot for the next car; every spot remembered: off the road
      if (!roamT) return nav(POLICIES.lurk.home.x, POLICIES.lurk.home.y);
      const at = Math.hypot(roamT[0] - b().x, roamT[1] - b().y) < 8;
      if (at && !free([b().x, b().y])) { const dx = roamT[0] - b().x, dy = roamT[1] - b().y, d = Math.hypot(dx, dy) || 1; return { mx: dx / d * 0.3, my: dy / d * 0.3, duck: true }; } // it settled inside a ring: edge onto the spot
      if (c && at && c.v > 15) {
        const d0 = Math.hypot(c.x - b().x, c.y - b().y), k = 0.1 + d0 / 600; // lead the car by the dash's time to it
        const tx = c.x + (c.vx || 0) * k, ty = c.y + (c.vy || 0) * k, d = Math.hypot(tx - b().x, ty - b().y), ang = Math.atan2(ty - b().y, tx - b().x);
        if (d < s.reach() + 6 && can()) return { mx: Math.cos(ang) * 0.3, my: Math.sin(ang) * 0.3, aPress: true, duck: true };
      }
      return at ? { duck: true } : nav(roamT[0], roamT[1]);
    },
    peek: () => peekAct(false), peekmove: () => peekAct(true), lure: () => lureAct(),
    lurk: () => { // past the field's edge, it sprints in as the car passes and dashes before the field notices (perception.sideNoticeSeconds)
      if (!b().alive) return {};
      const c = live().find((q) => q.path.road === 'A' && q.lane === 0 && q.v > 15);
      if (cur && (!c || c.id !== cur.id || b().mode === 'recover')) cur = null;
      if (!cur && c && Math.abs(c.x + c.vx * 0.45 - b().x) < 14 && Math.hypot(home.x - b().x, home.y - b().y) < 10) cur = { id: c.id };
      if (!cur) return goTo(home.x, home.y);
      const tx = c.x + c.vx * 0.15, ty = c.y, d = Math.hypot(tx - b().x, ty - b().y), ang = Math.atan2(ty - b().y, tx - b().x), off = Math.abs(wrap(ang - b().facing));
      return { mx: Math.cos(ang), my: Math.sin(ang), aPress: can() && off < 20 * DEG && d < s.reach() + 6 };
    },
    plinth: () => {
      if (!b().alive) return {};
      if (!b().raised) { // climb: from north of the plinth, a dash at it and a jump out of the dash (Legs 1's airtime is short)
        if (b().mode === 'jump') return {};
        if (b().mode === 'lunge') return { bPress: s.has('jump') && b().lunge && b().lunge.t > 0.03 };
        if (b().y > 75 && Math.abs(b().x - 360) > 10) return goTo(360, b().y > 260 ? b().y : 70);
        if (Math.hypot(275 - b().x, 70 - b().y) > 16) return goTo(275, 70);
        return { mx: 0, my: 0.12, aPress: can() && Math.abs(wrap(Math.PI / 2 - b().facing)) < 8 * DEG };
      }
      const c = live().find((q) => q.path.road === 'A' && q.x < b().x + 30);
      if (!c) return goTo(home.x, home.y);
      const tx = c.x + (c.vx || 0) * 0.1, ty = c.y, d = Math.hypot(tx - b().x, ty - b().y), ang = Math.atan2(ty - b().y, tx - b().x), off = Math.abs(wrap(ang - b().facing));
      if (d > 160) return Object.assign(goTo(home.x, home.y), Math.hypot(home.x - b().x, home.y - b().y) < 7 ? { mx: Math.cos(ang) * 0.05, my: Math.sin(ang) * 0.05 } : {});
      return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: can() && off < 15 * DEG };
    },
    corner: () => {
      if (!b().alive) return {};
      const c = live().find((q) => q.path.road === 'B' && q.y > 60 && q.y < 330);
      if (!c) return goTo(home.x, home.y);
      const p = X.pathAt(c.path, c.s + c.L / 2 + 40);
      return p.y < 330 ? goTo(p.x, p.y) : goTo(home.x, home.y);
    },
    flank: () => {
      if (!b().alive) return {};
      let best = null;
      for (const c of live()) { const d = Math.hypot(c.x - b().x, c.y - b().y); if (d < 250 && c.v > 15 && (!best || d < best.d)) best = { c, d }; }
      if (!best) return goTo(home.x, home.y);
      const c = best.c, ca = Math.cos(c.h), sa = Math.sin(c.h), dx = b().x - c.x, dy = b().y - c.y, lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca, side = ly >= 0 ? 1 : -1;
      if (Math.abs(lx) < c.L / 2 + 10 && Math.abs(ly) < c.W / 2 + 120) {
        const tx = c.x + (c.vx || 0) * 0.1, ty = c.y + (c.vy || 0) * 0.1, ang = Math.atan2(ty - b().y, tx - b().x), off = Math.abs(wrap(ang - b().facing));
        return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: can() && off < 15 * DEG };
      }
      const px = c.x + (c.vx || 0) * 0.4, py = c.y + (c.vy || 0) * 0.4;
      return goTo(px - sa * side * (c.W / 2 + 70), py + ca * side * (c.W / 2 + 70));
    },
  }; act.flankOpen = act.flank;
  function peekAct(move) { // 10.8: seen, then hidden. Rung 7 searches the ghost; crawling beyond duel.searchRadius escapes it
    if (!b().alive) return {};
    if (!s.has('duck1')) return act.conebait();
    const c = live().find((q) => q.red), Rm = s.P['duel.memoryRadius'] || 0, Rs = s.P['duel.searchRadius'] || 0, mem = s.memory();
    const free = (q) => !mem.some((m) => Math.hypot(q[0] - m.ox, q[1] - m.oy) <= Rm + 1e-9);
    const near = (L, x, y) => L.slice().sort((p, q) => Math.hypot(p[0] - x, p[1] - y) - Math.hypot(q[0] - x, q[1] - y))[0];
    const at = (q) => Math.hypot(q[0] - b().x, q[1] - b().y) < 8;
    if (!c) { pk = null; return {}; }
    if (!pk || pk.car !== c.id) { // peekmove: a free spot to be seen at, and a free spot beyond the search's reach to crawl to; none: hide at a free spot
      const L = ROAM[c.path.road].filter(free), pairs = move ? L.flatMap((p) => L.filter((q) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); return d > Rs + 15 && d < 2 * (Rs + 15) + 10 && (p[0] === q[0] || p[1] === q[1]); }).map((q) => [p, q])) : []; // along one row, beyond the search's reach
      pairs.sort((u, v) => Math.hypot(u[0][0] - b().x, u[0][1] - b().y) - Math.hypot(v[0][0] - b().x, v[0][1] - b().y));
      pk = move && pairs.length ? { car: c.id, spot: pairs[0][0], dest: pairs[0][1], phase: 'show' } : { car: c.id, spot: near(L.length ? L : ROAM[c.path.road], b().x, b().y), phase: move ? 'hide' : 'show', dest: null };
    }
    if (pk.phase === 'show') { // standing, in view over the row, until the car has it
      if (!at(pk.spot)) return nav(pk.spot[0], pk.spot[1]);
      if (c.noticed || (c.hz && c.v < 1)) { pk.phase = 'hide'; pk.seen = [b().x, b().y]; }
      return {};
    }
    const tgt = pk.dest || pk.spot;
    if (!at(tgt)) { if (!pk.seen && !move) return nav(tgt[0], tgt[1]); const dx = tgt[0] - b().x, dy = tgt[1] - b().y, d = Math.hypot(dx, dy) || 1; return pk.seen ? { mx: dx / d, my: dy / d, duck: true } : nav(tgt[0], tgt[1]); } // crawl, ducked, once seen
    if (c.v > 15) {
      const d0 = Math.hypot(c.x - b().x, c.y - b().y), k = 0.1 + d0 / 600, tx = c.x + (c.vx || 0) * k, ty = c.y + (c.vy || 0) * k, d = Math.hypot(tx - b().x, ty - b().y), ang = Math.atan2(ty - b().y, tx - b().x);
      if (d < s.reach() + 6 && can()) return { mx: Math.cos(ang) * 0.3, my: Math.sin(ang) * 0.3, aPress: true, duck: true };
    }
    return { duck: true };
  }
  function lureAct() { // row 726: make the car stop where the bot chooses, then strike from elsewhere
    if (!b().alive) return {};
    if (!s.has('duck1')) return act.conebait();
    const c = live().find((q) => q.red), Rm = s.P['duel.memoryRadius'] || 0, Rs = s.P['duel.searchRadius'] || 0, mem = s.memory();
    const free = (q) => !mem.some((m) => Math.hypot(q[0] - m.ox, q[1] - m.oy) <= Rm + 1e-9);
    const at = (q) => Math.hypot(q[0] - b().x, q[1] - b().y) < 8;
    if (!c) { lu = null; return {}; }
    if (!lu || lu.car !== c.id) {
      const L = ROAM[c.path.road], ca = Math.cos(c.h), sa = Math.sin(c.h), ahead = (q) => q[0] * ca + q[1] * sa; // along the car's heading
      const lures = L.filter((q) => !free(q)), from = lures.length ? lures : s.rung >= 7 ? L.filter(free) : [];
      let best = null;
      for (const l of from) for (const q of L.filter(free)) { // a free spot downstream along the same row, beyond the ghost's ring
        const d = Math.hypot(q[0] - l[0], q[1] - l[1]);
        if (q !== l && (q[0] === l[0] || q[1] === l[1]) && d > Rs + 15 && d < 2 * (Rs + 15) + 10 && ahead(q) > ahead(l)) { const k = Math.hypot(l[0] - b().x, l[1] - b().y); if (!best || k < best.k) best = { l, q, k }; }
      }
      lu = best ? { car: c.id, L: best.l, S: best.q, phase: 'show', remembered: lures.includes(best.l) } : { car: c.id, none: true };
    }
    if (lu.none) return act.roam(); // no lure yet (rung 6 before a crash from cover): the planter ambush makes the first spot
    if (lu.phase === 'show') { // standing at the lure until the car stops for it
      if (!at(lu.L)) return nav(lu.L[0], lu.L[1]);
      if (c.v < 1 && ['body', 'side', 'search'].includes(c.cause)) { lu.phase = 'move'; lureTook.add(c.id); if (lu.remembered) lureRemembered++; else lureGhost++; }
      return {};
    }
    if (!at(lu.S)) { const dx = lu.S[0] - b().x, dy = lu.S[1] - b().y, d = Math.hypot(dx, dy) || 1; return { mx: dx / d, my: dy / d, duck: true }; } // crawl, ducked, along the row
    if (c.v > 15) {
      const d0 = Math.hypot(c.x - b().x, c.y - b().y), k = 0.1 + d0 / 600, tx = c.x + (c.vx || 0) * k, ty = c.y + (c.vy || 0) * k, d = Math.hypot(tx - b().x, ty - b().y), ang = Math.atan2(ty - b().y, tx - b().x);
      if (d < s.reach() + 6 && can()) return { mx: Math.cos(ang) * 0.3, my: Math.sin(ang) * 0.3, aPress: true, duck: true };
    }
    return { duck: true };
  }
  const actFn = act[policy];
  const stopPred = new Map(), stopErr = []; // row 726: where the stop line said the car would stop, against where it stopped
  const t0 = s.t, e0 = s.events.length, wins = [], seen = new Set(), stops = new Map(), blk = new Map(); let maxOn = 0, stall = 0, blockedStall = 0, points = 0, minStopGap = Infinity, minSideGap = Infinity;
  const W = (t) => { const k = Math.floor((t - t0) / 60); while (wins.length <= k) wins.push(0); return k; };
  const reach = s.P['movement.lungeDistance'] + s.P['body.radius'];
  for (let i = 0; i < secs * 60; i++) {
    service();
    const before = s.run.points, eB = s.events.length, play = s.phase === 'play';
    s.step(play ? actFn(i) : {});
    if (o.trace) { for (const e of s.events.slice(eB)) if (!['commit', 'release', 'lunge-end'].includes(e.type)) console.log('   ', e.t.toFixed(2), e.type, JSON.stringify(e).slice(0, 140));
      if (i % 60 === 0) { const c = s.onRoad()[0]; console.log('  t', s.t.toFixed(1), 'cmd', JSON.stringify(actFn(i)), 'b', b().x.toFixed(1), b().y.toFixed(1), b().mode, 'v', b().vx.toFixed(1), b().vy.toFixed(1), 'f', (b().facing * 180 / Math.PI).toFixed(0), 'held', !!b().held, 'cones', s.cones.map((q) => q.state[0] + (q.x | 0) + ',' + (q.y | 0)).join(' '), c ? `car ${c.path.road}${c.lane} ${c.x | 0},${c.y | 0} v${c.v.toFixed(0)} ${c.cause} dodge ${c.dodge ? c.dodge.kind : '-'} noticed ${!!c.noticed}` : 'no car'); } }
    points += s.run.points - before;
    for (const e of s.events.slice(eB)) if (e.type === 'impact' && e.lost > 0 && !e.white) wins[W(e.t)]++;
    const on = s.onRoad().filter((c) => !c.white); maxOn = Math.max(maxOn, on.length); // row 734: white traffic aside
    for (const c of on) {
      seen.add(c.id);
      const st = c.v < 1 ? (stops.get(c.id) || 0) + 1 / 60 : 0; stops.set(c.id, st);
      const inPath = !!(c.hz && (c.hz.inPath || c.noticed)) || !!(c.det && c.det.fwd && c.det.fwd.kind === 'cone'); // waiting for a dummy in its path, (rung 2) in its field, or (rung 5) for a cone ahead
      if (inPath) blk.set(c.id, s.t);
      if (st > 20 && st - 1 / 60 <= 20) { if (blk.has(c.id) && s.t - blk.get(c.id) <= 20) blockedStall++; else stall++; } // a stall: 20 s stopped with nothing in its way at any moment of them
      if (c.v < 1 && c.hz && c.hz.inPath && s.body.alive) minStopGap = Math.min(minStopGap, c.hz.lx);
      if (c.red) { // one braking episode a stop: the first line drawn, against where its nose comes to rest
        const ep = stopPred.get(c.id), stopping = ['body', 'side', 'search'].includes(c.cause) && c.man && c.man.type === 'brake';
        if (c.v >= 1 && stopping && !ep) { const sp = s.stopPoint(c); if (sp && sp.s > c.s + c.L / 2 + 1) stopPred.set(c.id, { s: sp.s }); }
        else if (c.v >= 1 && !stopping && ep) stopPred.delete(c.id); // it dropped the plan: no stop
        else if (c.v < 1 && ep) { stopErr.push(Math.abs(c.s + c.L / 2 - ep.s)); stopPred.delete(c.id); }
      }
      if (c.v < 1 && c.noticed && s.body.alive) minSideGap = Math.min(minSideGap, Math.hypot(s.body.x - (c.x + Math.cos(c.h) * c.L / 2), s.body.y - (c.y + Math.sin(c.h) * c.L / 2)));
    }
  }
  while (wins.length < Math.ceil(secs / 60)) wins.push(0);
  const ev = s.events.slice(e0), incidents = ev.filter((e) => e.type === 'incident').length, imp = ev.filter((e) => e.type === 'impact' && e.lost > 0 && !e.white), whiteHits = ev.filter((e) => e.type === 'impact' && e.lost > 0 && e.white).length, whites = ev.filter((e) => e.type === 'admit' && e.white).length, mins = (s.t - t0) / 60, n = (t) => ev.filter((e) => e.type === t);
  const tally = (k) => imp.reduce((a, e) => (a[e[k]] = (a[e[k]] || 0) + 1, a), {});
  const lessonAt = n('lesson-due')[0], learned = n('learned')[0], firstBrake = n('first-brake')[0], firstSide = n('first-side')[0], firstCover = n('first-cover')[0], firstItem = n('first-item')[0], gift = n('gift')[0];
  const after = learned ? imp.filter((e) => e.t > learned.t) : null;
  const commits = n('commit').reduce((a, e) => (a[e.cause] = (a[e.cause] || 0) + 1, a), {});
  return { policy, mode, offset, simSeconds: +(s.t - t0).toFixed(1), rungEnd: s.rung, whiteHits, whites, incidents,
    hits: imp.length, hitsPerMin: +(imp.length / mins).toFixed(2), writeOffs: n('writeoff').length,
    firstHit: imp.length ? +(imp[0].t - t0).toFixed(1) : null, points: Math.round(points), lost: Math.round(imp.reduce((a, e) => a + e.lost, 0)),
    zones: tally('zone'), carStates: tally('carState'), kinds: tally('kind'), dashes: n('lunge').length,
    above: imp.filter((e) => e.above).length, heightHid: imp.filter((e) => e.above && e.sight >= s.P['duel.lessonClipSeconds'] - 1e-9).length, // D113: hits from above; of those, in sight past cover for the whole clip
    sights: imp.filter((e) => e.above).map((e) => e.sight), coverHits: imp.filter((e) => e.cover).length, // row 687: hits where cover hid the dummy
    conedHits: imp.filter((e) => e.coned).length, duckHits: imp.filter((e) => e.ducked).length, ducks: n('duck').length, // row 695: hits while it swerved round a cone; row 696: strikes from a duck
    habitHits: imp.filter((e) => e.habit).length, coveredHits: imp.filter((e) => e.covered).length, rememberedHits: imp.filter((e) => e.remembered).length, rememberedDucked: imp.filter((e) => e.remembered && e.ducked).length, crashes: s.crashes.length, sites: s.memory().length, // row 703: hits sprung from an earlier crash's spot; of those, from one it remembered at the time
    grades: tally('grade'), stealthPoints: s.stealth ? s.stealth.points : 0, // row 725
    lureStops: lureTook.size, lureRemembered, lureGhost, lureHits: imp.filter((e) => lureTook.has(e.car)).length, lureLost: Math.round(imp.filter((e) => lureTook.has(e.car)).reduce((a, e) => a + e.lost, 0)), // row 726
    stopErrs: stopErr.length, stopErrMedian: stopErr.length ? +stopErr.slice().sort((a, b) => a - b)[Math.floor(stopErr.length / 2)].toFixed(1) : null, stopErrWithin10: stopErr.filter((x) => x <= 10).length,
    lostSightHits: imp.filter((e) => e.lostSight).length, searches: n('search').length, searchFound: n('search-found').length, searchEnd: n('search-end').length, // rung 7 (row 717)
    spawnSlow: n('spawn-slow').length, lifts: n('block-lift').length, liftDrops: n('block-drop').length, secsPerWriteOff: n('writeoff').length ? +((s.t - t0) / n('writeoff').length).toFixed(1) : null,
    expectStops: new Set(n('expect-stop').map((e) => e.car)).size, expectHidden: new Set(n('expect-stop').filter((e) => e.hidden).map((e) => e.car)).size, // rung 6: cars that stopped for a dummy at a remembered spot; of those, for one cover hid
    coneSwerves: n('commit').filter((e) => e.cause === 'cone' && e.man === 'shift').length, coneStops: n('commit').filter((e) => e.cause === 'cone' && e.man === 'brake').length,
    standstillTouches: n('touch').filter((e) => e.standstill).length, tries: policy === 'charge' ? tries : null,
    lesson: lessonAt ? { hitAt: +(lessonAt.t - t0).toFixed(1), zone: lessonAt.zone, learnedAt: learned ? +(learned.t - t0).toFixed(1) : null } : null,
    afterLesson: after ? { hits: after.length, hitsPerMin: +(after.length / Math.max(1e-9, (s.t - learned.t) / 60)).toFixed(2), lost: Math.round(after.reduce((a, e) => a + e.lost, 0)) } : null,
    firstBrakeAt: firstBrake ? +(firstBrake.t - t0).toFixed(1) : null, firstSideAt: firstSide ? +(firstSide.t - t0).toFixed(1) : null, firstCoverAt: firstCover ? +(firstCover.t - t0).toFixed(1) : null, firstItemAt: firstItem ? +(firstItem.t - t0).toFixed(1) : null,
    dashAt: gift ? +(gift.t - t0).toFixed(1) : null, parts: n('gift').map((e) => ({ node: e.node, t: +(e.t - t0).toFixed(1) })),
    behaviours: commits, learnEvents: n('learn-standoff').length + imp.filter((e) => e.learned != null).length + n('lesson-due').length,
    cars: { appearances: seen.size, maxOnRoad: maxOn, stalls20s: stall, blocked20s: blockedStall, honks: n('honk').length, minStopGap: Number.isFinite(minStopGap) ? Math.round(minStopGap) : null, minSideGap: Number.isFinite(minSideGap) ? Math.round(minSideGap) : null, reach },
    windows: wins };
}

const out = { build: 'prototypes/p10/' + ST.page, stage: o.stage, level: 'junction', secs: o.secs, esc: o.esc, offsets: o.offsets, p10: ST.p10, runs: [], escalation: [] };
const modes = FLAGS['duel.topRung'] > (FLAGS['duel.startRung'] || 0) ? ['lesson', 'trained'] : ['lesson'];
const want = (p) => !o.only || o.only.includes(p);
if (o.set) out.set = o.set;
const vge = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); return x[0] !== y[0] ? x[0] > y[0] : (x[1] || 0) >= (y[1] || 0); }; // stage order by number: 10.10 comes after 10.9
for (const mode of modes) for (const p of Object.keys(POLICIES).filter((q) => (!POLICIES[q].from || vge(o.stage, POLICIES[q].from)) && want(q))) for (const off of o.offsets) {
  const r = run(p, off, o.secs, mode); out.runs.push(r);
  console.log(`${mode.padEnd(7)} ${p.padEnd(10)} +${String(off).padEnd(3)} hits ${r.hits} (${r.hitsPerMin}/min) wo ${r.writeOffs} lesson ${r.lesson ? r.lesson.hitAt : '-'} after ${r.afterLesson ? r.afterLesson.hits : '-'} part ${r.parts.map((q) => q.node + '@' + q.t).join(',')} stills ${r.standstillTouches} tries ${r.tries} stalls ${r.cars.stalls20s}/${r.cars.blocked20s} gap ${r.cars.minStopGap}`);
}
for (const p of FLAGS['duel.topRung'] >= 7 ? ['peek', 'peekmove', 'roam', 'lure'] : FLAGS['duel.topRung'] >= 6 ? ['planter', 'roam', 'lurk'] : FLAGS['duel.topRung'] >= 5 ? ['conebait', 'planter', 'lurk'] : FLAGS['duel.topRung'] >= 4 ? ['gap', 'jump', 'conebait', 'lurk'] : FLAGS['duel.topRung'] >= 3 ? ['plinth', 'jump', 'dashjump', 'gap', 'kerb'] : FLAGS['duel.topRung'] >= 2 ? ['kerb', 'flankOpen', 'walkin', 'plinth', 'gap', 'corner'] : ['stand', 'charge', 'walkin', 'aim']) {
  if (!want(p)) continue;
  const r = run(p, 0, o.esc, 'lesson'), w = r.windows, f = (w[0] + w[1]) / 2, l = (w[w.length - 1] + w[w.length - 2]) / 2;
  r.decay = f ? +(l / f).toFixed(2) : null; out.escalation.push(r);
  console.log(`escalation ${p}: hits by minute ${w.join(' ')} decay ${r.decay}`);
}
if (o.out) { fs.mkdirSync(path.dirname(path.resolve(o.out)), { recursive: true }); fs.writeFileSync(o.out, JSON.stringify(out, null, 1) + '\n'); }
