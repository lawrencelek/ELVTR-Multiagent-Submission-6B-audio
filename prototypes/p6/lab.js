// DUMMIES P4 Turn Lab (GDD Edit 49, test only). Road pieces at chosen radii, run with the real P4 driver.
// One module for the browser viewer (turn_lab.html) and the headless matrix (node lab_run.js).
(function (root) {
  'use strict';
  const W = 800, H = 640, LEAD = 200;
  const hyp = Math.hypot;

  // ---------- road pieces. Each returns { center, ring } in an 800 × 640 screen, lead-ins beyond the edges like a city screen.
  // P3 pieces use P3's corner rule: a 90° fillet that shrinks to fit (fillet). P4 pieces never bend below the minimum (filletAny).
  const PIECES = {
    corner: { name: 'L corner (90°)', params: ['R'], build: (X, q) => ({ center: X.filletAny([[-LEAD, 320], [400, 320], [400, H + LEAD]], q.R, 0) }) },
    zjog: { name: 'Z jog, P3 (two 90° corners)', params: ['R', 'lat'],
      build: (X, q) => ({ center: X.fillet([[-LEAD, 320 - q.lat / 2], [400, 320 - q.lat / 2], [400, 320 + q.lat / 2], [W + LEAD, 320 + q.lat / 2]], q.R) }) },
    stepped: { name: 'Stepped L, P3 (two steps)', params: ['R'],
      build: (X, q) => ({ center: X.fillet([[-LEAD, 200], [280, 200], [280, 400], [520, 400], [520, H + LEAD]], q.R) }) },
    diagonal: { name: 'Diagonal jog, P4 (45°)', params: ['R', 'lat'],
      build: (X, q) => ({ center: X.filletAny([[-LEAD, 320 - q.lat / 2], [400 - q.lat / 2, 320 - q.lat / 2], [400 + q.lat / 2, 320 + q.lat / 2], [W + LEAD, 320 + q.lat / 2]], q.R, 0) }) },
    chamfer: { name: 'Chamfered L, P4 (45° cut)', params: ['R', 'cut'],
      build: (X, q) => ({ center: X.filletAny([[-LEAD, 240], [480 - q.cut, 240], [480, 240 + q.cut], [480, H + LEAD]], q.R, 0) }) },
    roundabout: { name: 'Roundabout (W → E, the long way round half)', params: ['Rf'],
      build: (X, q, P) => {
        const a = { side: 'W', off: H / 2 }, b = { side: 'E', off: H / 2 }, r = () => 0.3, Rc = P['world.roundaboutRadius'];
        const ring = X.arcPts(W / 2, H / 2, Rc, 0, 2 * Math.PI, 48);
        if (q.Rf > 0) return { center: X.roundaboutCenter(a, b, W, H, LEAD, Rc, r, q.Rf), ring };
        return { center: p3Roundabout(X, a, b, Rc), ring }; // P3: radial road meets the ring at a chaikin-rounded corner
      } },
    roundaboutL: { name: 'Roundabout (W → S, three quarters round)', params: ['Rf'],
      build: (X, q, P) => {
        const a = { side: 'W', off: H / 2 }, b = { side: 'S', off: W / 2 }, r = () => 0.3, Rc = P['world.roundaboutRadius'];
        const ring = X.arcPts(W / 2, H / 2, Rc, 0, 2 * Math.PI, 48);
        if (q.Rf > 0) return { center: X.roundaboutCenter(a, b, W, H, LEAD, Rc, r, q.Rf), ring };
        return { center: p3Roundabout(X, a, b, Rc, -1.5 * Math.PI), ring };
      } },
    roundabout3: { name: 'Roundabout, three arms (W, E, S): every route', params: ['Rf'], build: (X, q, P) => multiRoundabout(X, P, ['W', 'E', 'S'], q.Rf) },
    roundabout4: { name: 'Roundabout, four arms: every route', params: ['Rf'], build: (X, q, P) => multiRoundabout(X, P, ['W', 'N', 'E', 'S'], q.Rf) },
    // P4 (Edit 49.3): junctions on one screen. Major road W–E; a minor road joins it. Give way by rank (see junction()).
    tee: { name: 'T junction, 90° (W, E, S): every route', params: ['R'], defaults: { R: 'world.junctionTurnRadius' }, build: (X, q, P) => junction(X, P, { W: ARM.W(), E: ARM.E(), S: ARM.S() }, ['W', 'E'], q.R) },
    y45: { name: 'Y junction, 45° (W, E, SW): every route', params: ['R'], defaults: { R: 'world.junctionTurnRadius' }, build: (X, q, P) => junction(X, P, { W: ARM.W(), E: ARM.E(), SW: ARM.SW() }, ['W', 'E'], q.R) },
    y45fork: { name: 'Y junction, 45°, no hairpin turns (fork)', params: ['R'], defaults: { R: 'world.junctionTurnRadius' }, build: (X, q, P) => junction(X, P, { W: ARM.W(), E: ARM.E(), SW: ARM.SW() }, ['W', 'E'], q.R, 100) },
    tee45: { name: 'T junction, 45° road squared off', params: ['R', 'run'], defaults: { R: 'world.junctionTurnRadius', run: 'world.junctionApproach' }, build: (X, q, P) => junction(X, P, { W: ARM.W(), E: ARM.E(), SQ: ARM.SQ(X, Math.max(q.run != null ? q.run : P['world.junctionApproach'], q.R + P['world.turnRadiusWide'] * Math.tan(Math.PI / 8) + 8), P['world.turnRadiusWide']) }, ['W', 'E'], q.R) },
    roundabout45: { name: 'Roundabout, three arms, one at 45° (W, E, SW)', params: ['Rf'], build: (X, q, P) => multiRoundabout(X, P, ['W', 'E', 'SW'], q.Rf) },
    // Edit 55 (example only): a 45° road crossing a W–E road, today and four engineered treatments
    cross45: { name: 'Crossroads at 45° (W, E, NW, SE): today', params: ['R'], defaults: { R: 'world.junctionTurnRadius' }, build: (X, q, P) => junction(X, P, { W: ARM.W(), E: ARM.E(), NW: ARM.D([-D45, -D45]), SE: ARM.D([D45, D45]) }, ['W', 'E'], q.R) },
    cross45realign: { name: 'A · Realigned to 90°: the 45° road bends in', params: ['R'], defaults: { R: 'world.junctionTurnRadius' }, build: (X, q, P) => { const run = squareRun(P, q.R); return junction(X, P, { W: ARM.W(), E: ARM.E(), N: ARM.bent(X, [JX, JY], [0, -1], [-D45, -D45], run, P['world.turnRadiusWide']), S: ARM.bent(X, [JX, JY], [0, 1], [D45, D45], run, P['world.turnRadiusWide']) }, ['W', 'E'], q.R); } },
    cross45stagger: { name: 'B · Staggered: two T junctions, left then right', params: ['R'], defaults: { R: 'world.junctionTurnRadius' }, build: (X, q, P) => staggered(X, P, P['world.junctionStagger'], q.R) },
    cross45ring: { name: 'C · Roundabout: four arms, the skew kept', params: ['Rf'], build: (X, q, P) => multiRoundabout(X, P, ['W', 'NW', 'E', 'SE'], q.Rf) },
    cross45flyMajor: { name: 'D · Flyover: the W–E road at grade', params: [], build: () => ({ center: [[-LEAD, JY], [W + LEAD, JY]] }) },
    cross45flyDiag: { name: 'D · Flyover: the 45° road on the deck', params: [], build: () => ({ center: [toEdge([-D45, -D45], [JX, JY]), toEdge([D45, D45], [JX, JY])] }) },
  };
  const squareRun = (P, R) => Math.max(P['world.junctionApproach'], R + P['world.turnRadiusWide'] * Math.tan(Math.PI / 8) + 8); // straight before J on a squared-off 45° road
  // ---------- P4 (Edit 49.3): junctions. Arms run out from the junction point J. A route is arm A reversed, a fillet of
  // radius R at J, then arm B. Traffic keeps right. Rank 0: the major road, through and turning right off it. Rank 1:
  // turning left off the major road (gives way to oncoming traffic). Rank 2: the minor road (gives way to both).
  const JX = W / 2, JY = H / 2, D45 = Math.SQRT1_2;
  const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = hyp(dx, dy); return [dx / l, dy / l]; };
  // Edit 57: a yield line sits square to the approach lane's last straight. Walk back from s to the first point whose heading
  // is a multiple of 45°; the line goes there, the teeth point back up that straight (MUTCD 3B.16).
  function yieldAt(X, lane, s, reach) {
    const q45 = Math.PI / 4;
    for (let ds = 0; ds <= (reach || 200); ds += 1) {
      const p = X.pathAt(lane, s - ds), a = Math.atan2(p.ty, p.tx), k = Math.round(a / q45);
      if (Math.abs(a - k * q45) < 0.004) return { s: s - ds, ds, x: p.x, y: p.y, ux: Math.round(Math.cos(k * q45) * 1e6) / 1e6, uy: Math.round(Math.sin(k * q45) * 1e6) / 1e6 };
    }
    const p = X.pathAt(lane, s), a = Math.round(Math.atan2(p.ty, p.tx) / q45) * q45;
    return { s, ds: 0, x: p.x, y: p.y, ux: Math.cos(a), uy: Math.sin(a) };
  }
  function yieldMarks(X, lanes) { // one mark per approach: deduplicated by place and heading
    const out = [], seen = new Set();
    const add = (ln, s) => { const m = yieldAt(X, ln, s, 40), key = Math.round(m.x / 4) + ',' + Math.round(m.y / 4) + ',' + Math.round(Math.atan2(m.uy, m.ux) * 4 / Math.PI); if (!seen.has(key)) { seen.add(key); out.push(m); } };
    for (const l of lanes) if (l.giveWay) add(l, l.giveWay.s);
    for (const l of lanes) if (l.junction && l.junction.rank === 2 && l.junction.line != null) add(l, l.junction.line); // a left turn off the major road waits unmarked
    return out;
  }
  function toEdgeAny(dir, from, Wv, Hv) { const [x, y] = from, ts = []; if (dir[0] > 1e-9) ts.push((Wv - x) / dir[0]); if (dir[0] < -1e-9) ts.push(-x / dir[0]); if (dir[1] > 1e-9) ts.push((Hv - y) / dir[1]); if (dir[1] < -1e-9) ts.push(-y / dir[1]); const t = Math.min(...ts) + LEAD; return [x + dir[0] * t, y + dir[1] * t]; }
  function toEdge(dir, from) { // from a point along dir to LEAD beyond the screen edge
    const [x, y] = from, ts = [];
    if (dir[0] > 1e-9) ts.push((W - x) / dir[0]); if (dir[0] < -1e-9) ts.push(-x / dir[0]);
    if (dir[1] > 1e-9) ts.push((H - y) / dir[1]); if (dir[1] < -1e-9) ts.push(-y / dir[1]);
    const t = Math.min(...ts) + LEAD;
    return [x + dir[0] * t, y + dir[1] * t];
  }
  const ARM = {
    W: () => [[JX, JY], toEdge([-1, 0], [JX, JY])], E: () => [[JX, JY], toEdge([1, 0], [JX, JY])], S: () => [[JX, JY], toEdge([0, 1], [JX, JY])],
    SW: () => [[JX, JY], toEdge([-D45, D45], [JX, JY])],
    SQ: (X, run, Rb) => { const b = [JX, JY + run]; return X.filletAny([[JX, JY], b, toEdge([-D45, D45], b)], Rb, 0); }, // 45° road, straight for `run` before J
    D: (dir, J) => { J = J || [JX, JY]; return [J, toEdge(dir, J)]; }, // Edit 55: any direction out of J
    bent: (X, J, ax, dg, run, Rb) => { const b = [J[0] + ax[0] * run, J[1] + ax[1] * run]; return X.filletAny([J, b, toEdge(dg, b)], Rb, 0); }, // Edit 55: square to the major road for `run`, then out at 45°
  };
  // Edit 55: a staggered crossing. The 45° road meets the W–E road at two T junctions `stagger` apart, each squared to 90°.
  // Keep right: the NW arm meets at the west T, the SE arm at the east T, so the crossing road turns left onto the major
  // road, then right off it (the preferred stagger). Routes through both junctions give way once, at their first.
  function staggered(X, P, stagger, R) {
    const T1 = [JX - stagger / 2, JY], T2 = [JX + stagger / 2, JY], run = squareRun(P, R), Rb = P['world.turnRadiusWide'];
    const at = { W: { T: 0, A: ARM.D([-1, 0], T1) }, NW: { T: 0, A: ARM.bent(X, T1, [0, -1], [-D45, -D45], run, Rb) }, E: { T: 1, A: ARM.D([1, 0], T2) }, SE: { T: 1, A: ARM.bent(X, T2, [0, 1], [D45, D45], run, Rb) } };
    const link = [[T1, T2], [T2, T1]], major = ['W', 'E'], lanes = [], roads = [], routes = [], info = [];
    const turnOf = (A, B) => { const u = unit(A[0], A[1]), v = unit(B[0], B[1]); return { th: Math.acos(Math.max(-1, Math.min(1, -(u[0] * v[0] + u[1] * v[1])))) * 180 / Math.PI, right: (-u[0]) * v[1] - (-u[1]) * v[0] > 1e-9 }; };
    for (const a of Object.keys(at)) for (const b of Object.keys(at)) {
      if (a === b) continue;
      const A = at[a].A, B = at[b].A; let center, turns;
      if (at[a].T === at[b].T) { center = jRoute(X, A, B, R); turns = [turnOf(A, B)]; }
      else { const L1 = link[at[a].T], L2 = link[at[b].T], p1 = jRoute(X, A, L1, R), p2 = jRoute(X, L2, B, R); if (!p1 || !p2) continue; center = p1.slice(0, -1).concat(p2.slice(1)); turns = [turnOf(A, L1), turnOf(L2, B)]; }
      if (!center) continue;
      const left = turns.some((t) => t.th > 1 && !t.right), rank = !major.includes(a) ? 2 : left ? 1 : 0;
      lanes.push(X.lanesOf(center, P)[0]); roads.push(center); routes.push(a + '→' + b); info.push({ from: a, to: b, rank, turn: Math.round(Math.max(...turns.map((t) => t.th))) });
    }
    conflictZones(X, lanes, info, P);
    const lw = P['world.laneWidth'], majorLine = at.W.A.slice().reverse().concat(at.E.A);
    return { center: roads[0], ring: null, lanes, roads, routes, info, arms: [majorLine, trimFrom(at.NW.A, lw + R), trimFrom(at.SE.A, lw + R)], junction: T1, junctions: [T1, T2] };
  }
  function jRoute(X, A, B, R) {
    const u = unit(A[0], A[1]), v = unit(B[0], B[1]), th = Math.acos(Math.max(-1, Math.min(1, -(u[0] * v[0] + u[1] * v[1])))); // deflection
    const back = A.slice(1).reverse(), [jx, jy] = A[0];
    if (th < 1e-3) return back.concat([A[0]], B.slice(1));
    const t = R * Math.tan(th / 2);
    if (t > hyp(A[1][0] - jx, A[1][1] - jy) - 1 || t > hyp(B[1][0] - jx, B[1][1] - jy) - 1) return null; // the fillet does not fit the arm's first straight
    const p1 = [jx + u[0] * t, jy + u[1] * t], p2 = [jx + v[0] * t, jy + v[1] * t];
    const bis = unit([0, 0], [u[0] + v[0], u[1] + v[1]]), dc = R / Math.cos(th / 2), c = [jx + bis[0] * dc, jy + bis[1] * dc];
    const a0 = Math.atan2(p1[1] - c[1], p1[0] - c[0]); let da = Math.atan2(p2[1] - c[1], p2[0] - c[0]) - a0;
    while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    return back.concat(X.arcPts(c[0], c[1], R, a0, a0 + da, Math.max(4, Math.round(R * Math.abs(da) / 8))), B.slice(1));
  }
  function junction(X, P, arms, major, R, maxTurn) {
    const lanes = [], roads = [], routes = [], info = [];
    for (const a of Object.keys(arms)) for (const b of Object.keys(arms)) {
      if (a === b) continue;
      const A = arms[a], B = arms[b], u = unit(A[0], A[1]), v = unit(B[0], B[1]);
      const th = Math.acos(Math.max(-1, Math.min(1, -(u[0] * v[0] + u[1] * v[1])))) * 180 / Math.PI, right = (-u[0]) * v[1] - (-u[1]) * v[0] > 1e-9;
      if (maxTurn && th > maxTurn) continue; // banned turn
      const center = jRoute(X, A, B, R); if (!center) continue;
      const rank = !major.includes(a) ? 2 : major.includes(b) || right ? 0 : 1;
      lanes.push(X.lanesOf(center, P)[0]); roads.push(center); routes.push(a + '→' + b); info.push({ from: a, to: b, rank, turn: Math.round(th) });
    }
    conflictZones(X, lanes, info, P);
    const lw = P['world.laneWidth'];
    const show = Object.values(arms).map((A) => trimFrom(A, lw + R)); // Edit 56 (MUTCD 3B.08): no centre line through the junction, major road included
    return { center: roads[0], ring: null, lanes, roads, routes, info, arms: show, junction: [JX, JY] };
  }
  function trimFrom(A, d) { // the arm beyond distance d from its start
    const out = []; let acc = 0;
    for (let i = 1; i < A.length; i++) {
      const l = hyp(A[i][0] - A[i - 1][0], A[i][1] - A[i - 1][1]);
      if (!out.length && acc + l > d) { const f = (d - acc) / l; out.push([A[i - 1][0] + (A[i][0] - A[i - 1][0]) * f, A[i - 1][1] + (A[i][1] - A[i - 1][1]) * f]); }
      if (out.length) out.push(A[i]);
      acc += l;
    }
    return out;
  }
  // Where each route's lane meets another's: lane lines closer than the widest body plus 6 (the driver's corridor margin).
  // Spans on both lanes. Routes from one arm share their entry (they queue, they do not conflict). A merge into one exit is
  // capped at one bus length past where the lanes meet. The give-way line stands traffic.minimumGap before the first span.
  function conflictZones(X, lanes, info, P) {
    const NEAR = Math.max(...CLASSES.map((c) => P['vehicles.' + c + '.width'])) + 6, STEP = 4, CAP = P['vehicles.bus.length'], GAP = P['traffic.minimumGap'];
    lanes.forEach((a, i) => {
      const zones = [];
      lanes.forEach((b, j) => {
        if (i === j || info[i].from === info[j].from) return;
        let cur = null;
        for (let s = 0; s <= a.length; s += STEP) {
          const p = X.pathAt(a, s), pr = X.pathProject(b, p.x, p.y), hit = onScreen([p.x, p.y]) && Math.sqrt(pr.d2) < NEAR && pr.s > 1 && pr.s < b.length - 1;
          if (hit) { if (!cur) cur = { lane: j, s0: s, s1: s, o0: pr.s, o1: pr.s }; else { cur.s1 = s; cur.o0 = Math.min(cur.o0, pr.s); cur.o1 = Math.max(cur.o1, pr.s); } }
          else if (cur) { zones.push(cur); cur = null; }
        }
        if (cur) zones.push(cur);
      });
      for (const z of zones) if (info[i].to === info[z.lane].to) { z.s1 = Math.min(z.s1, z.s0 + CAP); z.o1 = Math.min(z.o1, z.o0 + CAP); z.merge = true; }
      const first = zones.filter((z) => info[z.lane].rank < info[i].rank || (info[i].rank > 0 && !z.merge)).reduce((m, z) => Math.min(m, z.s0), Infinity); // P5.3: a waiting car stands clear of every path it could block, whatever its rank
      a.junction = { rank: info[i].rank, line: info[i].rank > 0 && first < Infinity ? Math.max(0, first - GAP) : null, zones, route: info[i].from + '→' + info[i].to };
    });
    // the minor road has one give-way line per arm: every route from it stops at the earliest of their lines
    lanes.forEach((a, i) => {
      if (info[i].rank < 2) return;
      a.junction.line = Math.min(...lanes.filter((b, j) => info[j].from === info[i].from && b.junction.line != null).map((b) => b.junction.line));
    });
  }
  // P4 (Edit 49.1): a roundabout with several arms. Traffic keeps right and circulates one way (anticlockwise on screen) in the
  // outer ring lane. One route per ordered pair of arms, each with its own lane path and a give-way line where it joins the ring.
  // Edit 56: bends { k: { dir: [dx, dy], at, Rb } }: arm k runs radially out to the vertex at distance `at`, then turns to dir
  // (a fillet of Rb) and runs to the edge. A 45° road reaches a ring square to it without moving the ring.
  function multiRoundabout(X, P, arms, Rf, ctr, bends) { // ctr (Edit 55.2): the ring's centre, default the screen's
    const arms0 = arms;
    const Rc = P['world.roundaboutRadius'], half = P['world.laneWidth'] / 2, R = Rc + half, ang = { W: Math.PI, E: 0, N: -Math.PI / 2, S: Math.PI / 2, SW: 3 * Math.PI / 4, NW: -3 * Math.PI / 4, SE: Math.PI / 4, NE: -Math.PI / 4 }, diag = (k) => k.length === 2; // Edit 55: every 45° arm
    const cx = ctr ? ctr[0] : W / 2, cy = ctr ? ctr[1] : H / 2, Wv = 2 * cx, Hv = 2 * cy, ring = X.arcPts(cx, cy, Rc, 0, 2 * Math.PI, 48), lanes = [], roads = [], names = [];
    const wrapA = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
    for (const a of arms) for (const b of arms) {
      if (a === b) continue;
      const arm = (k) => (diag(k) ? { side: k[0], ang: ang[k], pt: toEdge([Math.cos(ang[k]), Math.sin(ang[k])], [cx, cy]) } : { side: k, off: k === 'W' || k === 'E' ? cy : cx });
      const ea = arm(a), eb = arm(b);
      const nat = wrapA(ang[b] - ang[a]), opposite = Math.abs(Math.abs(nat) - Math.PI) < 1e-6;
      const r = () => (opposite ? 0.9 : nat > 0 ? 0.1 : 0.9); // always the anticlockwise way round (decreasing angle)
      // arms close together (45°): both fillets must fit the short way between them, with world.roundaboutArmGap of ring; never below world.turnRadiusTight
      const short = Math.abs(nat) < Math.PI - 1e-6 && nat < 0 ? Math.abs(nat) : 2 * Math.PI, hs = (short - P['world.roundaboutArmGap'] * Math.PI / 180) / 2;
      const Rfp = short < Math.PI ? Math.max(P['world.turnRadiusTight'], Math.min(Rf || 96, Rc * Math.sin(hs) / (1 - Math.sin(hs)))) : Rf || 96;
      const bent = (k) => bends && bends[k], Ds = (Rc + Rfp) * Math.cos(Math.asin(Rfp / (Rc + Rfp))) + 8;
      const outer = (k) => { const b = bent(k), u = [Math.cos(ang[k]), Math.sin(ang[k])], v = [cx + u[0] * b.at, cy + u[1] * b.at]; return X.filletAny([toEdgeAny(b.dir, v, Wv, Hv), v, [cx + u[0] * Ds, cy + u[1] * Ds]], b.Rb, 0); };
      if (bent(a)) ea.pt = outer(a).slice(-1)[0]; if (bent(b)) eb.pt = outer(b).slice(-1)[0];
      let center = X.roundaboutCenter(ea, eb, Wv, Hv, LEAD, Rc, r, Rfp);
      if (bent(a)) center = outer(a).slice(0, -1).concat(center);
      if (bent(b)) center = center.concat(outer(b).reverse().slice(1));
      const lane = X.lanesOf(center, P)[0];
      let sLine = null, aj = null, sj = null;
      for (let i = 0; i < lane.pts.length; i++) {
        const [x, y] = lane.pts[i], d = hyp(x - cx, y - cy);
        if (sLine == null && d <= R + 45) sLine = lane.cum[i];
        if (aj == null && d <= R + 2) { aj = Math.atan2(y - cy, x - cx); sj = lane.cum[i]; break; }
      }
      { const m = yieldAt(X, lane, sLine, 40); if (m.ds > 0 && m.ds < 40) sLine = m.s; } // Edit 57: the line at the end of the arm's last straight, square to it
      lane.giveWay = { s: sLine, sj, cx, cy, R, dir: -1, aj }; // stop line, join point (s and angle), circulating lane
      // P5 (Edit 52): the same route with 1..traffic.ringMaxLaps extra laps, for the inner-lane orbit. Identical up to the end of the arc.
      let iEnd = -1; center.forEach(([x, y], i) => { if (Math.abs(hyp(x - cx, y - cy) - Rc) < 0.6) iEnd = i; });
      const aEnd = Math.atan2(center[iEnd][1] - cy, center[iEnd][0] - cx), nLap = 48, variants = [lane];
      for (let k = 1; k <= (P['traffic.ringMaxLaps'] || 0); k++) {
        const loop = X.arcPts(cx, cy, Rc, aEnd, aEnd - 2 * Math.PI * k, nLap * k).slice(1);
        const vl = X.lanesOf(center.slice(0, iEnd + 1).concat(loop, center.slice(iEnd + 1)), P)[0]; vl.giveWay = lane.giveWay; variants.push(vl);
      }
      const turnOf = (k) => ((ang[a] - ang[k]) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI), exitNo = arms.filter((k) => k !== a && turnOf(k) <= turnOf(b) + 1e-9).length; // Edit 54: which exit, counted from the entry
      variants.forEach((vl, k) => { vl.ring = { variants, k, exitS: vl.cum[iEnd + k * nLap], cx, cy, Rout: R, Rin: Rc - half, dir: -1, exitNo }; });
      lanes.push(lane); roads.push(center); names.push(a + '→' + b);
    }
    lanes.forEach((ln, i) => { const a = names[i].split('→')[0]; ln.giveWay.s = Math.min(...lanes.filter((_, j) => names[j].split('→')[0] === a).map((m) => m.giveWay.s)); }); // one line per arm
    const armLines = arms0.map((k) => { const t = ang[k], u = [Math.cos(t), Math.sin(t)], c = [cx + u[0] * (Rc + (Rf || 96) + 8), cy + u[1] * (Rc + (Rf || 96) + 8)];
      if (bends && bends[k]) { const b = bends[k], v = [cx + u[0] * b.at, cy + u[1] * b.at]; return X.filletAny([toEdgeAny(b.dir, v, Wv, Hv), v, c], b.Rb, 0); }
      return [diag(k) ? toEdge(u, [cx, cy]) : X.edgePoint(k, k === 'W' || k === 'E' ? cy : cx, Wv, Hv, LEAD), c]; });
    return { center: roads[0], ring, lanes, roads, routes: names, arms: armLines };
  }
  // P3's roundabout path, rebuilt here so the lab can compare it on the same driver (P3 sim.js, Edit 41.1).
  function p3Roundabout(X, a, b, Rc, sweepIn) {
    const ang = { W: Math.PI, E: 0, N: -Math.PI / 2, S: Math.PI / 2 }, cx = W / 2, cy = H / 2, ta = ang[a.side], tb = ang[b.side];
    const sweep = sweepIn != null ? sweepIn : Math.PI;
    const pts = [X.edgePoint(a.side, a.off, W, H, LEAD), [cx + Math.cos(ta) * (Rc + 90), cy + Math.sin(ta) * (Rc + 90)]];
    const n = Math.max(2, Math.round(Math.abs(sweep) / (Math.PI / 8)));
    for (let i = 0; i <= n; i++) { const t = ta + sweep * i / n; pts.push([cx + Math.cos(t) * Rc, cy + Math.sin(t) * Rc]); }
    pts.push([cx + Math.cos(tb) * (Rc + 90), cy + Math.sin(tb) * (Rc + 90)], X.edgePoint(b.side, b.off, W, H, LEAD));
    return chaikin(pts, 3);
  }
  function chaikin(pts, n) {
    for (let k = 0; k < n; k++) {
      const out = [pts[0]];
      for (let i = 0; i + 1 < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; out.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25], [x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]); }
      out.push(pts[pts.length - 1]); pts = out;
    }
    return pts;
  }

  // ---------- geometry metrics
  const onScreen = ([x, y]) => x >= -40 && x <= W + 40 && y >= -40 && y <= H + 40;
  function radii(pts) {
    return pts.map((q, i) => {
      const p0 = pts[i - 1], p2 = pts[i + 1];
      if (!p0 || !p2) return Infinity;
      const A = hyp(q[0] - p0[0], q[1] - p0[1]), B = hyp(p2[0] - q[0], p2[1] - q[1]), C = hyp(p2[0] - p0[0], p2[1] - p0[1]);
      const cr = Math.abs((q[0] - p0[0]) * (p2[1] - p0[1]) - (q[1] - p0[1]) * (p2[0] - p0[0]));
      return cr < 1e-6 ? Infinity : A * B * C / (2 * cr);
    });
  }
  function minRadius(pts) { // smallest bend on screen and where it is
    const r = radii(pts); let best = { r: Infinity, at: null };
    r.forEach((v, i) => { if (onScreen(pts[i]) && v < best.r) best = { r: v, at: pts[i] }; });
    return best;
  }

  // ---------- fleets (P4, Edit 49.2 mock-up). 'p3': sedans and vans by vanShare. 'expanded': all eight canon classes.
  // 'buses': buses only. Bus length comes from vehicles.bus.length (overrides), so 96, 120 and 144 can be compared.
  const FLEETS = {
    p3: null,
    expanded: [['sedan', 0.3], ['hatchback', 0.22], ['police', 0.08], ['van', 0.3], ['bus', 0.1]], // P5 (Edit 50): the five-model fleet
    buses: [['bus', 1]],
  };
  const CLASSES = ['hatchback', 'sedan', 'police', 'van', 'bus'];
  function pickClass(fleet, vanShare, u) {
    const F = FLEETS[fleet || 'p3'];
    if (!F) return u < vanShare ? 'van' : 'sedan';
    let acc = 0; for (const [c, w] of F) { acc += w; if (u < acc) return c; }
    return F[F.length - 1][0];
  }
  // how far a car's body corners stand outside its own lane (half a lane each side of its path), world units
  function overhang(c, P) {
    const ca = Math.cos(c.h), sa = Math.sin(c.h), lw2 = P['world.laneWidth'] / 2;
    let m = 0;
    for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const x = c.x + ca * a * c.L / 2 - sa * b * c.W / 2, y = c.y + sa * a * c.L / 2 + ca * b * c.W / 2, pr = X0.pathProject(c.path, x, y);
      m = Math.max(m, Math.abs(pr.lat - c.d) - lw2);
    }
    return m;
  }
  let X0 = null;
  // ---------- a lab sim: the P4 driver on one road piece, the dummy away, cars of the chosen mix both ways
  function makeSim(X, piece, q, opts) {
    X0 = X;
    const s = new X.Sim('straight', Object.assign({ 'run.appearances.road': 2000 }, opts.overrides || {}));
    const P = s.P, g = PIECES[piece].build(X, q, P), lanes = g.lanes || X.lanesOf(g.center, P);
    s.level = Object.assign({}, s.level, { center: g.center, ring: g.ring || null, lanes, statics: [], coneHomes: [], spawns: [{ x: -900, y: -900, f: 0 }],
      patches: [], decks: [], deckLanes: [], checkpoints: [], floors: [], stairs: [], theme: 'plain' });
    s.cones = []; s.cars = []; s.drones = []; s.booms = {};
    s.checkTerminal = () => {}; s.checkFlip = () => {};
    let seed = opts.seed || 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    s.schedule = Array.from({ length: 2000 }, (_, i) => ({ i, cls: pickClass(opts.fleet, opts.vanShare, rnd()), lane: Math.min(lanes.length - 1, Math.floor(rnd() * lanes.length)), mult: 0.8 + 0.4 * rnd() }));
    s.admissionInterval = () => opts.interval;
    Object.assign(s.body, { x: -900, y: -900 });
    s.lab = { piece, q, opts, geo: { center: g.center, ring: g.ring || null, roads: g.roads || [g.center], lanes: s.level.lanes.map((l) => l.pts), stops: yieldMarks(X, lanes), // Edit 57: square to the last straight
      arms: g.arms || null, info: g.info || null, junction: g.junction || null }, stats: null };
    s.lab.stats = { t: 0, exited: 0, maxStop: 0, jamAt: null, jamCars: [], overlapT: 0, held: 0, peak: 0, minV: Infinity, over: {}, overT: 0, routes: {}, rankStop: {} };
    return s;
  }
  // rectangle overlap of two car bodies (separating axis)
  function overlap(a, b) {
    const ax = [Math.cos(a.h), Math.sin(a.h)], ay = [-ax[1], ax[0]], bx = [Math.cos(b.h), Math.sin(b.h)], by = [-bx[1], bx[0]], d = [b.x - a.x, b.y - a.y];
    for (const n of [ax, ay, bx, by]) {
      const pa = Math.abs(n[0] * ax[0] + n[1] * ax[1]) * a.L / 2 + Math.abs(n[0] * ay[0] + n[1] * ay[1]) * a.W / 2;
      const pb = Math.abs(n[0] * bx[0] + n[1] * bx[1]) * b.L / 2 + Math.abs(n[0] * by[0] + n[1] * by[1]) * b.W / 2;
      if (Math.abs(n[0] * d[0] + n[1] * d[1]) > pa + pb - 0.5) return false;
    }
    return true;
  }
  // one tick, then the lab's bookkeeping. The jam test runs whether or not spawns are held.
  function tick(s) {
    const st = s.lab.stats, dt = 1 / s.P['simulation.tickRate'];
    const before = s.cars.slice();
    s.step({}); s.body.x = -900; s.body.y = -900;
    st.t = s.t;
    for (const e of s.events || []) { if (e.type === 'exit') st.exited++; }
    for (const c of before) if (!s.cars.includes(c) && c.path.junction) { const r = c.path.junction.route; st.routes[r] = (st.routes[r] || 0) + 1; } // P4 (Edit 49.3): out per route
    for (const c of s.cars) { const k = c.path.junction ? c.path.junction.rank : c.path.giveWay ? 2 : 0; if ((c.stopT || 0) > (st.rankStop[k] || 0)) st.rankStop[k] = c.stopT; }
    s.events = [];
    let ov = false;
    for (let i = 0; i < s.cars.length; i++) {
      const c = s.cars[i];
      if ((c.stopT || 0) > st.maxStop) st.maxStop = c.stopT;
      if (c.v > 1 && c.v < st.minV && c.s > c.L && c.s < c.path.length - c.L) st.minV = c.v;
      for (let j = i + 1; j < s.cars.length && !ov; j++) if (overlap(c, s.cars[j])) ov = true;
    }
    if (ov) st.overlapT += dt;
    if (s.tick % 3 === 0) { let big = false; for (const c of s.cars) { if (c.s < c.L || c.s > c.path.length - c.L) continue; const o = overhang(c, s.P); st.over[c.cls] = Math.max(st.over[c.cls] || 0, o); if (o > 8) big = true; } if (big) st.overT += 3 * dt; } // swept path
    st.peak = Math.max(st.peak, s.cars.length);
    const T = 6, jam = s.cars.filter((c) => (c.stopT || 0) >= T && ['cycle', 'none'].includes(s.jamCause(c, new Set([c]))));
    if (jam.length && st.jamAt == null) { st.jamAt = +s.t.toFixed(1); st.jamCars = jam.map((c) => c.cls); }
    if (s.slot < s.schedule.length && s.t >= s.nextAt && s.P['traffic.gridlockSeconds'] > 0 && s.jams && s.jams[0]) st.held += dt;
  }
  function run(X, piece, q, opts) {
    const s = makeSim(X, piece, q, opts), n = Math.round(opts.seconds * s.P['simulation.tickRate']);
    for (let i = 0; i < n; i++) tick(s);
    const geo = s.lab.geo, lanesR = geo.lanes.map((p) => minRadius(p).r), st = s.lab.stats;
    return { piece, q, driver: opts.overrides && opts.overrides['traffic.followRoad'] === 0 ? 'P3' : 'P4', hold: !(opts.overrides && opts.overrides['traffic.gridlockSeconds'] === 0), fleet: opts.fleet || 'p3', busL: s.P['vehicles.bus.length'],
      overhang: Object.fromEntries(Object.entries(st.over).map(([k, v]) => [k, +v.toFixed(1)])), overhangS: +st.overT.toFixed(1),
      vanShare: opts.vanShare, interval: opts.interval, seconds: opts.seconds,
      centreR: +minRadius(geo.center).r.toFixed(1), laneR: +Math.min(...lanesR).toFixed(1), cornerV: +Math.sqrt(s.P['traffic.cornerAccel'] * Math.min(...lanesR)).toFixed(0),
      exitedPerMin: +(st.exited / opts.seconds * 60).toFixed(1), maxStop: +st.maxStop.toFixed(1), jamAt: st.jamAt, jamCars: st.jamCars, overlapS: +st.overlapT.toFixed(1),
      heldS: +st.held.toFixed(1), peak: st.peak, routes: st.routes, rankStop: Object.fromEntries(Object.entries(st.rankStop).map(([k, v]) => [k, +v.toFixed(1)])) };
  }
  FLEETS.nobus = [['sedan', 0.36], ['hatchback', 0.28], ['police', 0.1], ['van', 0.26]]; // P5 (Edit 52): screens whose bends are under vehicles.bus.minRadius
  const api = { PIECES, FLEETS, CLASSES, makeSim, tick, run, minRadius, radii, overlap, overhang: (c, P) => overhang(c, P), junction, multiRoundabout, staggered, W, H };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TURNLAB = api;
})(typeof window !== 'undefined' ? window : globalThis);
